import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendOtpEmail } from '@/lib/mail';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!existingUser) {
      // Don't leak whether the email exists or not for security reasons, just return success
      return NextResponse.json({ success: true, message: 'If the email exists, an OTP was sent' });
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing OTP for this email
    await prisma.otpCode.deleteMany({
      where: { email },
    });

    // Save OTP
    await prisma.otpCode.create({
      data: {
        email,
        code,
        expiresAt,
      },
    });

    // Send email
    const emailResult = await sendOtpEmail(email, code, 'reset', existingUser.name || undefined);

    if (emailResult && !emailResult.success) {
      return NextResponse.json({ 
        success: false, 
        message: 'OTP saved in DB but email failed to send',
        emailError: emailResult.error 
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'OTP sent to email' });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
