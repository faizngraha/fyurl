import { Resend } from 'resend';

export const sendOtpEmail = async (email: string, code: string, type: 'register' | 'reset' = 'register') => {
  const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_for_build');

  const subject = type === 'reset' ? 'Reset Your Password' : 'Your Verification Code';
  const heading = type === 'reset' ? 'Reset your password' : 'Verify your email';
  const textBody = type === 'reset' 
    ? 'You have requested to reset your password. Please use the following OTP code to proceed. This code is valid for 10 minutes.' 
    : 'Thank you for registering. Please use the following OTP code to verify your email address. This code is valid for 10 minutes.';

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      margin: 0;
      padding: 40px 20px;
    }
    .container {
      max-width: 500px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
      border: 1px solid #e2e8f0;
    }
    .header {
      padding: 32px 32px 24px;
      text-align: center;
      border-bottom: 1px solid #f1f5f9;
    }
    .logo {
      height: 28px;
      margin-bottom: 20px;
    }
    .title {
      color: #0f172a;
      font-size: 22px;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.5px;
    }
    .content {
      padding: 32px;
    }
    .greeting {
      color: #0f172a;
      font-size: 16px;
      font-weight: 600;
      margin-top: 0;
      margin-bottom: 12px;
    }
    .message {
      color: #475569;
      font-size: 15px;
      line-height: 1.6;
      margin-top: 0;
      margin-bottom: 32px;
    }
    .otp-wrapper {
      background: linear-gradient(145deg, #f0f9ff 0%, #e0f2fe 100%);
      border: 1px solid #bae6fd;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin-bottom: 32px;
    }
    .otp-code {
      color: #0284c7;
      font-size: 38px;
      font-weight: 800;
      letter-spacing: 12px;
      margin: 0;
      margin-left: 12px; /* to balance the letter-spacing */
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .otp-label {
      color: #0369a1;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 10px;
      margin-bottom: 0;
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px 32px;
      text-align: center;
      border-top: 1px solid #f1f5f9;
    }
    .footer p {
      color: #64748b;
      font-size: 13px;
      line-height: 1.5;
      margin: 0;
    }
    .help-link {
      color: #0ea5e9;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://fyurl.id/logo/fyurl-horizontal.png" alt="Fyurl" class="logo">
      <h2 class="title">${heading}</h2>
    </div>
    <div class="content">
      <p class="greeting">Hi there,</p>
      <p class="message">${textBody}</p>
      
      <div class="otp-wrapper">
        <p class="otp-code">${code}</p>
        <p class="otp-label">Valid for 10 minutes</p>
      </div>
      
      <p class="message" style="margin-bottom: 0; font-size: 14px;">For security reasons, do not share this code with anyone. If you didn't request this code, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      <p>Need help? Contact us at <a href="mailto:support@fyurl.id" class="help-link">support@fyurl.id</a></p>
      <p style="margin-top: 8px;">&copy; ${new Date().getFullYear()} Fyurl. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️ RESEND_API_KEY not found. The OTP code is:', code);
      return { success: false, error: 'API_KEY_NOT_FOUND' };
    }

    const { data, error } = await resend.emails.send({
      from: 'Fyurl <noreply@fyurl.id>',
      to: [email],
      subject: subject,
      html: htmlContent,
    });

    if (error) {
      console.error('Error sending email via Resend:', error);
      console.warn('⚠️ Fallback: The OTP code is:', code);
      return { success: false, error };
    }

    console.log('Email sent successfully via Resend:', data);
    console.log(`🔑 OTP CODE FOR ${email}: ${code}`);
    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error sending email:', error);
    console.warn('⚠️ Fallback: The OTP code is:', code);
    return { success: false, error };
  }
};
