import { NextResponse } from "next/server";
import { LinkRepository } from "@/repositories/link.repository";

const linkRepository = new LinkRepository();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const alias = searchParams.get('alias');
    const domainId = searchParams.get('domainId');

    if (!alias) {
      return NextResponse.json({ available: false });
    }

    // Validate format
    if (!/^[a-zA-Z0-9-_]+$/.test(alias)) {
      return NextResponse.json({ available: false });
    }

    const exists = await linkRepository.checkAliasExists(alias, domainId || undefined);
    
    if (exists) {
      // Check if it's expired. If it's expired, it's considered available because the backend will archive the old one.
      const link = await linkRepository.findByShortCode(alias, domainId || undefined);
      if (link && link.expiresAt && link.expiresAt < new Date()) {
        return NextResponse.json({ available: true });
      }
      
      // Generate suggestions
      const suffixes = ['123', 'ku', 'pro', 'id', 'link', 'app'];
      const suggestions: string[] = [];
      for (const suffix of suffixes) {
         const sug = `${alias}${suffix}`;
         const exists = await linkRepository.checkAliasExists(sug, domainId || undefined);
         if (!exists) {
            suggestions.push(sug);
         }
         if (suggestions.length >= 3) break;
      }

      return NextResponse.json({ 
        available: false, 
        expiresAt: link?.expiresAt || null,
        suggestions 
      });
    }

    return NextResponse.json({ available: true });
  } catch (error) {
    return NextResponse.json({ available: false }, { status: 500 });
  }
}
