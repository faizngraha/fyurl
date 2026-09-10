import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { sendOtpEmail } from '@/lib/mail';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing OTP for this email
    await prisma.otpCode.deleteMany({
      where: { email },
    });

    // Save OTP along with pending user data
    await prisma.otpCode.create({
      data: {
        email,
        code,
        expiresAt,
        name,
        password: hashedPassword,
      },
    });

    // Send email
    const emailResult = await sendOtpEmail(email, code, 'register', name);

    if (emailResult && !emailResult.success) {
      return NextResponse.json({ 
        success: false, 
        message: 'OTP saved in DB but email failed to send',
        emailError: emailResult.error 
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'OTP sent to email' });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Failed to register' }, { status: 500 });
  }
}
