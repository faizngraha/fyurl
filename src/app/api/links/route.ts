import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { CreateLinkUseCase } from "@/use-cases/create-link.use-case";
import { LinkRepository } from "@/repositories/link.repository";

import { ratelimit, anonQuotaLimit } from "@/lib/ratelimit";
import { isUrlBlocklisted } from "@/lib/blocklist";
import { isGoogleSafeBrowsingClear } from "@/lib/safebrowsing";

// Clean Architecture: Initialize dependencies outside the handler
const linkRepository = new LinkRepository();
const createLinkUseCase = new CreateLinkUseCase(linkRepository);

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting Check
    const ip = request.headers.get("x-forwarded-for") || "anonymous";
    const { success, limit, reset, remaining } = await ratelimit.limit(`create-link_${ip}`);

    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { 
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString()
          }
        }
      );
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as any).id : undefined;

    // 1.5 Anonymous User Quota Check
    if (!userId) {
      const anonQuota = await anonQuotaLimit.limit(ip);
      if (!anonQuota.success) {
        return NextResponse.json(
          { error: "You have reached the limit of 5 free links per week. Please log in for unlimited links." },
          { status: 429 }
        );
      }
    }

    const body = await request.json();
    const { longUrl, customAlias, domainId, expiresIn, password, unlockAt, title, ogTitle, ogDescription, ogImage } = body;

    if (!longUrl) {
      return NextResponse.json({ error: "longUrl is required" }, { status: 400 });
    }

    // 2. Blocklist Check
    if (isUrlBlocklisted(longUrl)) {
      return NextResponse.json({ error: "This URL is not allowed (blocklisted or invalid format)" }, { status: 400 });
    }

    // 3. Google Safe Browsing Check
    const isSafe = await isGoogleSafeBrowsingClear(longUrl);
    if (!isSafe) {
      return NextResponse.json({ error: "This URL has been flagged as unsafe (Phishing/Malware) by Google Safe Browsing." }, { status: 400 });
    }

    const link = await createLinkUseCase.execute({
      longUrl,
      title,
      customAlias,
      userId,
      domainId,
      expiresIn,
      password,
      unlockAt,
      ogTitle,
      ogDescription,
      ogImage,
    });

    return NextResponse.json({ 
      success: true,
      data: link 
    }, { status: 201 });
    
  } catch (error: any) {
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 400 });
  }
}
