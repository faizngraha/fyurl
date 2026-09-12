import { ILinkRepository } from "@/repositories/link.repository";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { redis } from "@/lib/redis";

function generateShortCode(length = 7): string {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export interface CreateLinkDTO {
  longUrl: string;
  title?: string;
  customAlias?: string;
  userId?: string;
  domainId?: string;
  expiresIn?: string; // '1d', '3d', '7d', '30d'
  password?: string;
  unlockAt?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

export class CreateLinkUseCase {
  constructor(private linkRepository: ILinkRepository) {}

  async execute(data: CreateLinkDTO) {
    // 1. Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(data.longUrl);
    } catch (e) {
      throw new Error("Invalid URL provided");
    }

    // 1.5. Validate Domain Ownership
    let domainName = process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '') || 'fyurl.id';
    
    if (data.domainId) {
      const domain = await prisma.customDomain.findUnique({
        where: { id: data.domainId }
      });
      if (!domain) {
        throw new Error("Custom domain not found");
      }
      if (domain.userId !== 'admin-system' && domain.userId !== data.userId) {
        throw new Error("You do not have permission to use this custom domain");
      }
      domainName = domain.domain;
    }

    // 2. Determine short code
    let shortCode = data.customAlias;
    
    if (shortCode) {
      // Validate alias format
      if (!/^[a-zA-Z0-9-_]+$/.test(shortCode)) {
        throw new Error("Invalid custom alias format (only alphanumeric, dash, underscore)");
      }
      
      // Check collision
      const existingLink = await this.linkRepository.findByShortCode(shortCode, data.domainId);
      if (existingLink) {
        const now = new Date();
        if (existingLink.expiresAt && existingLink.expiresAt < now) {
          // Link is expired! Soft-delete it by archiving the shortcode
          // This frees up the alias for reuse while preserving the old analytics!
          await this.linkRepository.archive(existingLink.id, existingLink.shortCode);
        } else {
          // Link is still active. Calculate remaining time for the error message.
          if (!existingLink.expiresAt) {
            throw new Error("Custom alias already in use (Never expires)");
          }
          
          const msRemaining = existingLink.expiresAt.getTime() - now.getTime();
          const days = Math.floor(msRemaining / (1000 * 60 * 60 * 24));
          const hours = Math.floor((msRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          
          let timeMsg = "";
          if (days > 0) timeMsg = `${days} day${days > 1 ? 's' : ''}`;
          else if (hours > 0) timeMsg = `${hours} hour${hours > 1 ? 's' : ''}`;
          else timeMsg = "less than an hour";

          throw new Error(`Custom alias already in use. It will expire in ${timeMsg}.`);
        }
      }
    } else {
      // Generate unique short code fallback
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 5) {
        shortCode = generateShortCode();
        const exists = await this.linkRepository.checkAliasExists(shortCode, data.domainId);
        if (!exists) {
          isUnique = true;
        }
        attempts++;
      }
      
      if (!isUnique) {
        throw new Error("Failed to generate a unique short code. Please try again.");
      }
    }

    // 3. Calculate expiresAt (Mandatory unless 'never')
    let expiresAt: Date | null = null;
    const expirationStr = data.expiresIn || '7d'; // Enforce default if missing
    
    if (expirationStr !== 'never') {
      const days = parseInt(expirationStr.replace('d', ''), 10);
      if (!isNaN(days) && days > 0) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);
      } else {
        throw new Error("Invalid expiration format");
      }
    }

    // 4. Hash Password (if any)
    let passwordHash = null;
    if (data.password) {
      if (data.password.length < 4) {
        throw new Error("Password must be at least 4 characters long");
      }
      passwordHash = await bcrypt.hash(data.password, 10);
    }

    // 5. Save to database
    const link = await this.linkRepository.create({
      longUrl: parsedUrl.toString(),
      title: data.title,
      shortCode: shortCode as string,
      password: passwordHash,
      user: data.userId ? { connect: { id: data.userId } } : undefined,
      domain: data.domainId ? { connect: { id: data.domainId } } : undefined,
      expiresAt: expiresAt as Date | undefined,
      unlockAt: data.unlockAt ? new Date(data.unlockAt) : undefined,
      ogTitle: data.ogTitle,
      ogDescription: data.ogDescription,
      ogImage: data.ogImage,
    });

    // 4. Set to Redis Cache immediately for fast first-redirect
    try {
      let ttl = 3600;
      if (expiresAt) {
        const secondsUntilExpiry = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
        if (secondsUntilExpiry < 3600) {
          ttl = Math.max(1, secondsUntilExpiry);
        }
      }

      const cacheKey = `domain:${domainName}:code:${(shortCode as string).toLowerCase()}`;
      
      const isTimeLocked = data.unlockAt ? new Date(data.unlockAt) > new Date() : false;
      const isLocked = !!data.password || isTimeLocked;
      const hasCustomOg = !!data.ogTitle || !!data.ogDescription || !!data.ogImage;

      if (isLocked) {
        const lockData = {
          locked: true,
          hasPassword: !!data.password,
          unlockAt: data.unlockAt ? new Date(data.unlockAt).toISOString() : null,
          title: data.title || null,
        };
        await redis.setex(cacheKey, ttl, JSON.stringify(lockData));
      } else if (hasCustomOg) {
        const ogData = {
          hasCustomOg: true,
          longUrl: parsedUrl.toString(),
          ogTitle: data.ogTitle,
          ogDescription: data.ogDescription,
          hasOgImage: !!data.ogImage,
        };
        await redis.setex(cacheKey, ttl, JSON.stringify(ogData));
      } else {
        await redis.setex(cacheKey, ttl, parsedUrl.toString());
      }
    } catch (e) {
      console.error("Failed to populate Redis cache on creation", e);
    }

    return link;
  }
}
