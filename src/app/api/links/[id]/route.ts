import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redis } from '@/lib/redis';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const userId = (session.user as any).id;
    const isAdmin = session.user.email === 'fyznugraha@gmail.com';
    
    // Check if link exists
    const link = await prisma.link.findUnique({
      where: { id },
      include: { domain: true }
    });

    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    if (link.userId !== userId && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Invalidate Cache
    // Attempt to invalidate on primary domain and the specific custom domain
    const domainsToClear = ['fyurl.id', 'fylink.id'];
    if (link.domain?.domain) {
      domainsToClear.push(link.domain.domain);
    }

    for (const d of domainsToClear) {
      const cacheKey = `domain:${d}:code:${link.shortCode.toLowerCase()}`;
      await redis.del(cacheKey);
    }

    // Delete the link
    await prisma.link.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete link error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const userId = (session.user as any).id;
    const isAdmin = session.user.email === 'fyznugraha@gmail.com';
    
    // Check if link exists
    const link = await prisma.link.findUnique({
      where: { id },
      include: { domain: true }
    });

    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    if (link.userId !== userId && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    let { longUrl } = body;

    if (!longUrl) {
      return NextResponse.json({ error: 'Missing destination URL' }, { status: 400 });
    }

    // Basic validation
    longUrl = longUrl.trim();
    if (!/^https?:\/\//i.test(longUrl)) {
      longUrl = `https://${longUrl}`;
    }
    
    try {
      new URL(longUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Update the link
    const updatedLink = await prisma.link.update({
      where: { id },
      data: { longUrl }
    });

    // Invalidate Cache
    const domainsToClear = ['fyurl.id', 'fylink.id'];
    if (link.domain?.domain) {
      domainsToClear.push(link.domain.domain);
    }

    for (const d of domainsToClear) {
      const cacheKey = `domain:${d}:code:${link.shortCode.toLowerCase()}`;
      await redis.del(cacheKey);
    }

    return NextResponse.json({ success: true, link: updatedLink });
  } catch (error) {
    console.error('Update link error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
