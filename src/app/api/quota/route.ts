import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { anonQuotaLimit } from "@/lib/ratelimit";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // If user is logged in, they have unlimited quota
    if (session?.user) {
      return NextResponse.json({
        isUnlimited: true,
        remaining: 999,
        limit: 999,
      });
    }

    // Anonymous user
    const deviceId = request.headers.get("x-device-id");
    const ip = request.headers.get("x-forwarded-for") || "anonymous";
    const identifier = deviceId ? `device_${deviceId}` : `ip_${ip}`;
    
    const quotaInfo = await anonQuotaLimit.getRemaining(identifier);

    return NextResponse.json({
      isUnlimited: false,
      remaining: quotaInfo.remaining,
      limit: 5,
      reset: quotaInfo.reset,
    });
    
  } catch (error: any) {
    console.error("Error fetching quota:", error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}
