import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendOtpEmail } from '@/lib/mail';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if the OTP record exists
    const existingOtp = await prisma.otpCode.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' }
    });

    if (!existingOtp) {
      return NextResponse.json({ error: 'No pending registration found for this email' }, { status: 404 });
    }

    // Generate new 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update the OTP record
    await prisma.otpCode.update({
      where: { id: existingOtp.id },
      data: {
        code,
        expiresAt,
      },
    });

    // Send email
    const emailResult = await sendOtpEmail(email, code, 'register');

    if (emailResult && !emailResult.success) {
      return NextResponse.json({ 
        success: false, 
        message: 'OTP updated but email failed to send',
        emailError: emailResult.error 
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'New OTP sent to email' });
  } catch (error: any) {
    console.error('Resend OTP error:', error);
    return NextResponse.json({ error: 'Failed to resend OTP' }, { status: 500 });
  }
}
