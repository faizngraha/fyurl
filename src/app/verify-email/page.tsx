'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Mail, ArrowRight, Loader2, AlertCircle, KeyRound, ArrowLeft } from 'lucide-react';
import { useGeoLang } from '@/hooks/useGeoLang';
import { dictionaries } from '@/lib/i18n';

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email');
  
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  const { lang } = useGeoLang();
  const t = dictionaries[lang];

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || resendLoading || !email) return;
    
    setResendLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to resend OTP');
      
      setCooldown(60); // 60 seconds cooldown
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to verify OTP');
      }

      setSuccess(true);
      
      const tempPassword = sessionStorage.getItem('temp_reg_password');
      if (tempPassword) {
        sessionStorage.removeItem('temp_reg_password'); // clean up immediately
        
        const signInResult = await signIn('credentials', {
          redirect: false,
          email,
          password: tempPassword,
        });

        if (signInResult?.ok) {
          router.push('/dashboard');
          return; // Stop here, don't do the fallback redirect
        }
      }
      
      // Fallback if password was lost (e.g. they opened in a new tab)
      setTimeout(() => {
        router.push('/login?verified=true');
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">
      
      {success ? (
        <div className="text-center py-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg leading-6 font-medium text-slate-900">{t.emailVerified}</h3>
          <p className="mt-2 text-sm text-slate-500">{t.redirectingLogin}</p>
        </div>
      ) : (
        <form className="space-y-6" onSubmit={handleVerify}>
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700">{t.emailAddr}</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-lg py-2.5 transition-colors bg-slate-50 text-slate-500"
                placeholder="you@example.com"
                readOnly={!!emailParam}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">{t.otpCode}</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyRound className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-lg py-2.5 transition-colors tracking-widest font-mono text-lg"
                placeholder="000000"
              />
            </div>
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-slate-500">{t.checkInbox}</p>
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || resendLoading || !email}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {resendLoading ? (
                  <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> {lang === 'id' ? 'Mengirim...' : 'Sending...'}</span>
                ) : cooldown > 0 ? (
                  `${lang === 'id' ? 'Kirim ulang' : 'Resend'} (${cooldown}s)`
                ) : (
                  lang === 'id' ? 'Kirim Ulang OTP' : 'Resend OTP'
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || code.length < 6}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>{t.verifyAndContinue} <ArrowRight className="ml-2 w-4 h-4" /></>
            )}
          </button>
        </form>
      )}

      <div className="mt-8 text-center text-sm">
        <Link href="/login" className="font-semibold text-primary-600 hover:text-primary-500">
          {t.backToLogin}
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  const { lang } = useGeoLang();
  const t = dictionaries[lang];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Back Button */}
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8 z-20">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors bg-white/50 hover:bg-white/80 px-3 py-2 rounded-full backdrop-blur-sm border border-slate-200/50 shadow-sm">
          <ArrowLeft className="w-4 h-4 mr-2" /> {t.backToHome}
        </Link>
      </div>

      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary-400/20 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] rounded-full bg-blue-400/20 blur-[100px]" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link href="/" className="flex justify-center mb-6">
          <img src="/logo/fyurl-horizontal.png" alt="Fyurl" className="h-12 w-auto object-contain" />
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          {t.verifyEmailTitle}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          {t.weSentCode}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Suspense fallback={<div className="flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>}>
          <VerifyEmailForm />
        </Suspense>
      </div>
    </div>
  );
}
