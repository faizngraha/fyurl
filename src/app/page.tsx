'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowRight, Link as LinkIcon, Globe, Shield, Zap, Copy, Download, Loader2, CheckCircle2, QrCode, ChevronDown, Trash2, ShieldAlert, Lock, Eye, EyeOff, Clock, Calendar, HandCoins, LogIn, X, Upload, ExternalLink, RefreshCw, Palette, Clipboard, Check, Share2, GripHorizontal, Scan, Infinity } from 'lucide-react';
import jsQR from "jsqr";
import { QRCodeCanvas } from 'qrcode.react';
import Link from 'next/link';
import UserNavbar from '@/components/UserNavbar';
import { motion, AnimatePresence } from 'framer-motion';
import { dictionaries, Language } from '@/lib/i18n';
import { useSession, signIn } from 'next-auth/react';
import toast from 'react-hot-toast';
import DonationModal from '@/components/DonationModal';

const TaglineRotator = ({ taglines }: { taglines: string[] }) => {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % taglines.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [taglines.length]);

  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={wordIndex}
        initial={{ y: -40, opacity: 0, scale: 0.8 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0, scale: 0.8 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="text-transparent bg-clip-text bg-gradient-to-br from-primary-600 via-blue-600 to-indigo-600 p-2 -m-2 inline-block whitespace-nowrap drop-shadow-sm text-center text-[0.9em] sm:text-[0.95em] md:text-[0.85em]"
      >
        {taglines[wordIndex]}
      </motion.span>
    </AnimatePresence>
  );
};

const timezonesList = [
  { value: "-12:00", label: "(GMT-12:00) International Date Line West" },
  { value: "-11:00", label: "(GMT-11:00) Midway Island, Samoa" },
  { value: "-10:00", label: "(GMT-10:00) Hawaii" },
  { value: "-09:00", label: "(GMT-09:00) Alaska" },
  { value: "-08:00", label: "(GMT-08:00) Pacific Time" },
  { value: "-07:00", label: "(GMT-07:00) Mountain Time" },
  { value: "-06:00", label: "(GMT-06:00) Central Time" },
  { value: "-05:00", label: "(GMT-05:00) Eastern Time" },
  { value: "-04:00", label: "(GMT-04:00) Atlantic Time" },
  { value: "-03:30", label: "(GMT-03:30) Newfoundland" },
  { value: "-03:00", label: "(GMT-03:00) Greenland, Brasilia" },
  { value: "-02:00", label: "(GMT-02:00) Mid-Atlantic" },
  { value: "-01:00", label: "(GMT-01:00) Azores, Cape Verde Is." },
  { value: "+00:00", label: "(GMT+00:00) London, Lisbon, Casablanca" },
  { value: "+01:00", label: "(GMT+01:00) Paris, Berlin, Rome" },
  { value: "+02:00", label: "(GMT+02:00) Cairo, Athens, Istanbul" },
  { value: "+03:00", label: "(GMT+03:00) Moscow, Riyadh, Baghdad" },
  { value: "+03:30", label: "(GMT+03:30) Tehran" },
  { value: "+04:00", label: "(GMT+04:00) Abu Dhabi, Muscat" },
  { value: "+04:30", label: "(GMT+04:30) Kabul" },
  { value: "+05:00", label: "(GMT+05:00) Islamabad, Karachi" },
  { value: "+05:30", label: "(GMT+05:30) New Delhi, Mumbai" },
  { value: "+05:45", label: "(GMT+05:45) Kathmandu" },
  { value: "+06:00", label: "(GMT+06:00) Almaty, Dhaka" },
  { value: "+06:30", label: "(GMT+06:30) Yangon" },
  { value: "+07:00", label: "(GMT+07:00) Jakarta (WIB), Bangkok, Hanoi" },
  { value: "+08:00", label: "(GMT+08:00) Bali (WITA), Singapore, Beijing" },
  { value: "+09:00", label: "(GMT+09:00) Papua (WIT), Tokyo, Seoul" },
  { value: "+09:30", label: "(GMT+09:30) Adelaide, Darwin" },
  { value: "+10:00", label: "(GMT+10:00) Sydney, Melbourne, Brisbane" },
  { value: "+11:00", label: "(GMT+11:00) Magadan, Solomon Is." },
  { value: "+12:00", label: "(GMT+12:00) Auckland, Wellington, Fiji" },
  { value: "+13:00", label: "(GMT+13:00) Nuku'alofa" }
];

export default function Home() {
  const { data: session, status } = useSession();
  const [anonQuota, setAnonQuota] = useState<{ remaining: number; limit: number } | null>(null);
  const [lang, setLang] = useState<Language>('en');
  const t = dictionaries[lang];

  useEffect(() => {
    const savedLang = localStorage.getItem('fyurl_lang');
    if (savedLang === 'id' || savedLang === 'en') {
      setLang(savedLang);
    } else {
      fetch('https://ipapi.co/json/')
        .then(res => res.json())
        .then(data => {
          if (data.country_code === 'ID') {
            setLang('id');
            localStorage.setItem('fyurl_lang', 'id');
          } else {
            setLang('en');
            localStorage.setItem('fyurl_lang', 'en');
          }
        })
        .catch(() => {
          if (typeof navigator !== 'undefined' && navigator.language.toLowerCase().includes('id')) {
            setLang('id');
            localStorage.setItem('fyurl_lang', 'id');
          }
        });
    }
  }, []);

  // Fetch anonymous quota
  useEffect(() => {
    if (status === 'unauthenticated') {
      fetch('/api/quota')
        .then(res => res.json())
        .then(data => {
          if (!data.isUnlimited) {
            setAnonQuota({ remaining: data.remaining, limit: data.limit });
          }
        })
        .catch(console.error);
    } else {
      setAnonQuota(null);
    }
  }, [status]);

  // Handle URL errors (e.g. from middleware redirect on 404)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const error = urlParams.get('error');
      const status = urlParams.get('status');

      if (error === 'lookup_failed') {
        setShowNotFoundModal(true);
        
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (error === 'expired') {
        setShowExpiredModal(true);
        
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [lang]);

  const [showNotFoundModal, setShowNotFoundModal] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  useEffect(() => {
    if (!session) {
      const hasSeenModal = localStorage.getItem('fyurl_modal_seen');
      if (!hasSeenModal) {
        setShowFeatureModal(true);
        localStorage.setItem('fyurl_modal_seen', 'true');
      }
    }
  }, [session]);

  const EXPIRATION_OPTIONS = [
    { value: '1d', label: t.exp1d },
    { value: '3d', label: t.exp3d },
    { value: '7d', label: t.exp7d },
    { value: '30d', label: t.exp30d },
    { value: 'custom', label: t.expCustom },
  ];

  const [activeTab, setActiveTab] = useState<'shortener' | 'qr' | 'scan'>('shortener');
  const [longUrl, setLongUrl] = useState('');
  const [qrText, setQrText] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [title, setTitle] = useState('');
  const [expiresIn, setExpiresIn] = useState('3d');
  const [customDays, setCustomDays] = useState('60');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDomainDropdownOpen, setIsDomainDropdownOpen] = useState(false);
  const [qrFgColor, setQrFgColor] = useState('#000000');
  const [qrBgColor, setQrBgColor] = useState('#ffffff');
  const [transparentBg, setTransparentBg] = useState(false);
  const [qrLogo, setQrLogo] = useState<string>('/logo/fyurl-logo-tp.png');
  const [qrShortLink, setQrShortLink] = useState<string | null>(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [qrMode, setQrMode] = useState<'generate' | 'scan'>('generate');
  const [scannedQrResult, setScannedQrResult] = useState<string | null>(null);
  const [isScanningQr, setIsScanningQr] = useState(false);
  const scanFileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ shortCode: string; domain: string } | null>(null);
  
  interface RecentLink {
    shortCode: string;
    domain: string;
    longUrl: string;
    createdAt: number;
  }
  const [recentLinks, setRecentLinks] = useState<RecentLink[]>([]);
  const [copied, setCopied] = useState(false);
  const [requirePassword, setRequirePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [requireSchedule, setRequireSchedule] = useState(false);
  const [unlockAt, setUnlockAt] = useState('');
  const [timezone, setTimezone] = useState('+07:00');
  const [isTimezoneDropdownOpen, setIsTimezoneDropdownOpen] = useState(false);
  
  // Custom OG state
  const [requireOg, setRequireOg] = useState(false);
  const [ogTitle, setOgTitle] = useState('');
  const [ogDescription, setOgDescription] = useState('');
  const [ogImage, setOgImage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [defaultDomain, setDefaultDomain] = useState('link.byfayiz.web.id');
  const [customDomains, setCustomDomains] = useState<any[]>([]);
  const [domainId, setDomainId] = useState('');

  const [aliasAvailable, setAliasAvailable] = useState<boolean | null>(null);
  const [checkingAlias, setCheckingAlias] = useState(false);
  const [aliasSuggestions, setAliasSuggestions] = useState<string[]>([]);
  const [aliasExpiresAt, setAliasExpiresAt] = useState<string | null>(null);

  // Live Camera Scanner States
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  
  useEffect(() => {
    if (!customAlias) {
      setAliasAvailable(null);
      return;
    }
    
    if (!/^[a-zA-Z0-9-_]+$/.test(customAlias)) {
      setAliasAvailable(false);
      return;
    }

    const checkAlias = async () => {
      setCheckingAlias(true);
      try {
        const res = await fetch(`/api/check-alias?alias=${customAlias}&domainId=${domainId || ''}`);
        const data = await res.json();
        setAliasAvailable(data.available);
        setAliasSuggestions(data.suggestions || []);
        setAliasExpiresAt(data.expiresAt || null);
      } catch (e) {
        setAliasAvailable(null);
        setAliasSuggestions([]);
        setAliasExpiresAt(null);
      } finally {
        setCheckingAlias(false);
      }
    };

    const timeoutId = setTimeout(checkAlias, 500);
    return () => clearTimeout(timeoutId);
  }, [customAlias, domainId]);

  useEffect(() => {
    const currentHost = window.location.host.replace(/^www\./, '');
    setDefaultDomain(currentHost);
    
    // Fetch custom domains (public system domains + user's own domains if logged in)
    fetch('/api/domains')
      .then(res => res.json())
      .then(data => {
        if (data.data) {
           const verifiedDomains = data.data.filter((d: any) => 
             (d.status === 'verified' || d.status === 'active' || d.status === 'Active') && 
             d.domain !== currentHost
           );
           setCustomDomains(verifiedDomains);
           const primary = verifiedDomains.find((d: any) => d.isPrimary);
           if (primary) {
             setDomainId(primary.id);
           }
        }
      })
      .catch(console.error);

    const savedLinks = localStorage.getItem('fyurl_recent_links');
    if (savedLinks) {
      try {
        setRecentLinks(JSON.parse(savedLinks));
      } catch (e) {}
    }
  }, []);

  const handleGenerateTrackableQr = async () => {
    let finalUrl = qrText.trim();
    if (!finalUrl) return;

    if (!/^https?:\/\//i.test(finalUrl)) {
      if (!finalUrl.includes('.') || finalUrl.includes(' ')) {
         setQrShortLink(finalUrl);
         return;
      }
      finalUrl = `https://${finalUrl}`;
    }

    setIsGeneratingQr(true);
    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ longUrl: finalUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        setQrShortLink(`https://${defaultDomain}/${data.data.shortCode}`);
      } else {
        setQrShortLink(finalUrl);
      }
    } catch (err) {
      setQrShortLink(finalUrl);
    } finally {
      setIsGeneratingQr(false);
    }
  };

  useEffect(() => {
    let stream: MediaStream | null = null;
    let isActive = true;

    if (activeTab === 'scan' && isCameraActive) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then((s) => {
          if (!isActive) {
            s.getTracks().forEach(t => t.stop());
            return;
          }
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(e => console.error("Video play error:", e));
          }
          setCameraError(null);
          
          const tick = () => {
            if (!isActive) return;
            if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
              const canvas = canvasRef.current;
              const context = canvas.getContext("2d", { willReadFrequently: true });
              if (context) {
                canvas.width = videoRef.current.videoWidth;
                canvas.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
                if (code) {
                  setScannedQrResult(code.data);
                  setIsCameraActive(false);
                  toast.success(lang === 'id' ? "QR Code berhasil terdeteksi!" : "QR Code detected!");
                  return;
                }
              }
            }
            if (isActive) {
               requestRef.current = requestAnimationFrame(tick);
            }
          };
          requestRef.current = requestAnimationFrame(tick);
        })
        .catch((err) => {
          console.error("Camera access error:", err);
          if (isActive) {
            setCameraError(lang === 'id' ? 'Gagal mengakses kamera. Pastikan izin kamera diberikan.' : 'Failed to access camera. Please check permissions.');
            setIsCameraActive(false);
          }
        });
    }

    return () => {
      isActive = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [activeTab, isCameraActive, lang]);

  const handleScanQr = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsScanningQr(true);
    setScannedQrResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) {
          setIsScanningQr(false);
          return;
        }
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0, img.width, img.height);
        
        const imageData = context.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          setScannedQrResult(code.data);
          toast.success(lang === 'id' ? "QR Code berhasil diterjemahkan!" : "QR Code decoded successfully!");
        } else {
          toast.error(lang === 'id' ? "QR Code tidak terdeteksi pada gambar." : "No QR Code detected in image.");
        }
        setIsScanningQr(false);
      };
      img.onerror = () => {
        setIsScanningQr(false);
        toast.error("Gagal memuat gambar.");
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    setCopied(false);

    try {
      let finalUrl = longUrl.trim();
      if (!/^https?:\/\//i.test(finalUrl)) {
        finalUrl = `https://${finalUrl}`;
      }

      const finalExpiresIn = expiresIn === 'custom' ? `${customDays}d` : expiresIn;
      
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          longUrl: finalUrl, 
          title: title || undefined,
          customAlias: customAlias || undefined, 
          expiresIn: finalExpiresIn || undefined,
          password: requirePassword && password ? password : undefined,
          unlockAt: requireSchedule && unlockAt ? new Date(`${unlockAt}:00${timezone}`).toISOString() : undefined,
          ogTitle: requireOg && ogTitle ? ogTitle : undefined,
          ogDescription: requireOg && ogDescription ? ogDescription : undefined,
          ogImage: requireOg && ogImage ? ogImage : undefined,
          domainId: domainId || undefined,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create short link');
      }
      
      const newDomain = domainId ? customDomains.find(d => d.id === domainId)?.domain || defaultDomain : defaultDomain;
      setResult({
        shortCode: data.data.shortCode,
        domain: newDomain
      });
      
      const newRecentLink: RecentLink = {
        shortCode: data.data.shortCode,
        domain: newDomain,
        longUrl: finalUrl,
        createdAt: Date.now()
      };
      setRecentLinks(prev => {
        const updated = [newRecentLink, ...prev.filter(l => l.shortCode !== newRecentLink.shortCode)].slice(0, 3);
        localStorage.setItem('fyurl_recent_links', JSON.stringify(updated));
        return updated;
      });
      
      // Clear form except for result
      setLongUrl('');
      setCustomAlias('');
      setTitle('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(`${result.domain}/${result.shortCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    
    const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `qr-${result?.shortCode}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    // Track QR Download
    fetch('/api/track-qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shortUrl: result?.shortCode })
    }).catch(console.error);
  };

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-primary-100 selection:text-primary-900 font-sans overflow-x-hidden relative w-full">
      {/* Background Decorative Orbs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary-400/20 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] rounded-full bg-blue-400/20 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-indigo-400/10 blur-[150px]" />
      </div>
      {/* Navigation */}
      {session ? (
        <UserNavbar user={session.user} />
      ) : (
      <nav className="border-b border-border bg-white fixed top-0 w-full z-50 transition-all">
        <div className="w-full px-4 sm:px-10 lg:px-16 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center shrink-0 group cursor-pointer" onClick={() => setResult(null)}>
            <img src="/logo/fyurl-horizontal.png" alt="Fyurl" className="h-7 sm:h-10 w-auto object-contain group-hover:scale-105 transition-transform" />
          </div>
          
          <div className="flex items-center gap-2 sm:gap-6 shrink-0">
            <button
              onClick={() => {
                const newLang = lang === 'en' ? 'id' : 'en';
                setLang(newLang);
                localStorage.setItem('fyurl_lang', newLang);
              }}
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline font-semibold">{lang === 'en' ? 'EN / ID' : 'ID / EN'}</span>
              <span className="sm:hidden font-semibold">{lang.toUpperCase()}</span>
            </button>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button 
                onClick={() => setShowDonationModal(true)}
                className="inline-flex items-center justify-center p-1.5 sm:px-4 sm:py-2 border border-transparent rounded-lg shadow-sm text-xs sm:text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 hover:shadow-md hover:-translate-y-0.5" 
                title={t.donation}
              >
                <HandCoins className="w-4 h-4 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline-block">{t.donation}</span>
              </button>
              <button onClick={() => signIn()} className="inline-flex items-center justify-center px-3 sm:px-4 py-1.5 sm:py-2 border border-slate-200 rounded-lg shadow-sm text-xs sm:text-sm font-bold sm:font-medium text-slate-700 bg-white hover:bg-slate-50 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-200 hover:shadow-md hover:-translate-y-0.5">
                Login
              </button>
            </div>
          </div>
        </div>
      </nav>
      )}

      {/* Hero Section */}
      <main className="pt-32 md:pt-40 pb-20 px-6 sm:px-10 lg:px-16 w-full flex-1 flex flex-col justify-center relative z-10">
        <div className="text-center max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
          <h1 className="w-full text-[2.75rem] leading-tight sm:text-6xl md:text-7xl lg:text-[6.5rem] font-extrabold text-slate-900 tracking-tight mb-4 sm:mb-6 flex flex-col md:flex-row items-center justify-center gap-y-2 md:gap-x-4 md:whitespace-nowrap overflow-visible max-w-full">
            <span>{t.makeEveryLink}</span>
            <div className="flex justify-center items-center overflow-visible min-h-[1.5em] relative w-full md:w-auto px-4 md:px-0">
              <TaglineRotator taglines={t.taglines} />
            </div>
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 mb-24 leading-relaxed max-w-2xl mx-auto font-medium">
            {t.heroDesc}
          </p>
        </div>

        {/* Action Area (Form or Result) */}
        <div className="w-full max-w-[1400px] mx-auto relative z-10 animate-in zoom-in-95 duration-500 delay-150">
          
          {/* Tabs */}
          <div className="flex bg-white/80 backdrop-blur-xl p-1.5 sm:p-2 rounded-2xl sm:rounded-full border border-slate-200/60 w-full sm:w-fit mx-auto shadow-sm mb-8 sm:mb-10 items-center justify-between sm:justify-center gap-1 sm:gap-0">
            <button
              onClick={() => setActiveTab('shortener')}
              className={`flex-1 sm:flex-none px-2 sm:px-8 py-2.5 sm:py-3 text-xs sm:text-base font-bold rounded-xl sm:rounded-full transition-all duration-300 border whitespace-nowrap flex items-center justify-center ${activeTab === 'shortener' ? 'bg-white text-primary-700 shadow-md border-slate-200/50 scale-100' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50 border-transparent scale-95'}`}
            >
              <span className="sm:hidden">Link</span>
              <span className="hidden sm:inline">Custom Link</span>
            </button>
            <button
              onClick={() => setActiveTab('qr')}
              className={`flex-1 sm:flex-none px-2 sm:px-8 py-2.5 sm:py-3 text-xs sm:text-base font-bold rounded-xl sm:rounded-full transition-all duration-300 flex items-center justify-center border whitespace-nowrap ${activeTab === 'qr' ? 'bg-white text-primary-700 shadow-md border-slate-200/50 scale-100' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50 border-transparent scale-95'}`}
            >
              <QrCode className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2.5" />
              <span className="sm:hidden">{lang === 'id' ? 'Buat QR' : 'QR'}</span>
              <span className="hidden sm:inline">{t.qrGenerator}</span>
            </button>
            <button
              onClick={() => setActiveTab('scan')}
              className={`flex-1 sm:flex-none px-2 sm:px-8 py-2.5 sm:py-3 text-xs sm:text-base font-bold rounded-xl sm:rounded-full transition-all duration-300 flex items-center justify-center border whitespace-nowrap ${activeTab === 'scan' ? 'bg-white text-primary-700 shadow-md border-slate-200/50 scale-100' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50 border-transparent scale-95'}`}
            >
              <Scan className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2.5" />
              <span className="sm:hidden">{lang === 'id' ? 'Cek QR' : 'Scan'}</span>
              <span className="hidden sm:inline">{lang === 'id' ? 'Cek Isi QR' : 'Decode QR'}</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-200/60 relative overflow-hidden">
            
            {activeTab === 'shortener' && (
              !result ? (
              <form onSubmit={handleSubmit} className="p-6 sm:p-10">
                {anonQuota && (
                  <div className="mb-6 w-full animate-in fade-in zoom-in duration-300">
                    {anonQuota.remaining > 0 ? (
                      <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm p-4 rounded-xl flex items-start gap-3">
                        <span className="text-xl">⚠️</span>
                        <div>
                          <p className="font-bold mb-1">
                            {lang === 'id' ? `Sisa kuota gratis: ${anonQuota.remaining}/${anonQuota.limit} link.` : `Free quota remaining: ${anonQuota.remaining}/${anonQuota.limit} links.`}
                          </p>
                          <p>
                            <Link href="/login" className="underline font-bold hover:text-amber-800">Login</Link> {lang === 'id' ? 'sekarang untuk buat link tanpa batas!' : 'now to create unlimited links!'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-xl flex items-start gap-3">
                        <Shield className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold mb-1">
                            {lang === 'id' ? 'Kuota gratis habis!' : 'Free quota exceeded!'}
                          </p>
                          <p>
                            <Link href="/login" className="underline font-bold hover:text-red-800">Login</Link> {lang === 'id' ? 'untuk lanjut membuat link lagi.' : 'to continue creating links.'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {error && (
                  <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 flex items-start gap-3">
                    <Shield className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
                
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label htmlFor="longUrl" className="block text-sm font-bold text-slate-800">
                        {lang === 'id' ? 'URL Tujuan' : 'Destination URL'} <span className="text-red-500">*</span>
                      </label>
                      <span className="text-xs font-mono text-slate-500 hidden sm:inline-block">{lang === 'id' ? 'Protokol HTTPS divalidasi otomatis' : 'HTTPS protocol automatically validated'}</span>
                    </div>
                    <div className="relative flex items-center">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Globe className="h-5 w-5 text-slate-500" />
                      </div>
                      <input
                        id="longUrl"
                        type="text"
                        inputMode="url"
                        required
                        placeholder="https://www.instagram.com/fyurl.id"
                        value={longUrl}
                        onChange={(e) => setLongUrl(e.target.value)}
                        className={`block w-full pl-12 pr-28 py-4 text-sm font-medium text-slate-800 border border-slate-200/60 rounded-xl focus:ring-2 focus:ring-primary-500 transition-all bg-slate-50/80 placeholder-slate-400 ${!longUrl ? 'opacity-70 focus:opacity-100' : 'opacity-100'}`}
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const text = await navigator.clipboard.readText();
                            setLongUrl(text);
                          } catch (err) {}
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 sm:px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-blue-200/50"
                      >
                        <Clipboard className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                        <span className="hidden sm:inline">Paste</span>
                        <span className="hidden sm:inline-block text-[10px] bg-blue-100 px-1 rounded ml-0.5 font-mono">⌘V</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label htmlFor="customAlias" className="block text-sm font-bold text-slate-800">
                          {t.customAlias} <span className="text-slate-400 font-normal">{t.optional}</span>
                        </label>
                        {customAlias && (
                          <span className="text-xs font-medium flex items-center gap-1">
                            {checkingAlias ? (
                              <span className="text-slate-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> {lang === 'id' ? 'Mengecek...' : 'Checking...'}</span>
                            ) : aliasAvailable === true ? (
                              <span className="text-blue-600 flex items-center gap-1"><div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>{lang === 'id' ? 'Tersedia' : 'Available'} ✓</span>
                            ) : aliasAvailable === false ? (
                              <span className="text-red-500 flex items-center gap-1"><div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>{lang === 'id' ? 'Tidak Tersedia' : 'Unavailable'} ✗</span>
                            ) : null}
                          </span>
                        )}
                      </div>
                      <div className="flex shadow-sm rounded-xl focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent transition-all">
                        {customDomains.length > 0 ? (
                            <div 
                              className="relative flex items-stretch border-r-0 border-slate-200/60"
                              tabIndex={0}
                              onBlur={(e) => {
                                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                  setIsDomainDropdownOpen(false);
                                }
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => setIsDomainDropdownOpen(!isDomainDropdownOpen)}
                                className="inline-flex items-center justify-between pl-3 sm:pl-4 pr-2 sm:pr-3 py-3.5 sm:py-4 border border-r-0 border-slate-200/60 rounded-l-xl bg-slate-100 text-slate-800 font-bold text-xs sm:text-base focus:outline-none w-auto max-w-[120px] sm:max-w-[240px] hover:bg-slate-200 transition-colors shrink-0"
                              >
                                <span className="truncate mr-1.5 sm:mr-2">
                                  {domainId ? customDomains.find(d => d.id === domainId)?.domain : defaultDomain}
                                </span>
                                <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 text-slate-500 shrink-0 transition-transform duration-200 ${isDomainDropdownOpen ? 'rotate-180' : ''}`} />
                              </button>
  
                              <AnimatePresence>
                                {isDomainDropdownOpen && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    transition={{ duration: 0.15, ease: "easeOut" }}
                                    className="absolute z-30 left-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl overflow-y-auto max-h-60"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setDomainId("");
                                        setIsDomainDropdownOpen(false);
                                      }}
                                      className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between ${
                                        domainId === "" ? 'bg-primary-50 text-primary-700 font-bold' : 'text-slate-700 hover:bg-slate-50 font-medium'
                                      }`}
                                    >
                                      <span className="truncate">{defaultDomain}</span>
                                      {domainId === "" && <CheckCircle2 className="w-4 h-4 text-primary-600 shrink-0 ml-2" />}
                                    </button>
                                    {customDomains.map(d => (
                                      <button
                                        key={d.id}
                                        type="button"
                                        onClick={() => {
                                          setDomainId(d.id);
                                          setIsDomainDropdownOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between border-t border-slate-100 ${
                                          domainId === d.id ? 'bg-primary-50 text-primary-700 font-bold' : 'text-slate-700 hover:bg-slate-50 font-medium'
                                        }`}
                                      >
                                        <span className="truncate">{d.domain}</span>
                                        {domainId === d.id && <CheckCircle2 className="w-4 h-4 text-primary-600 shrink-0 ml-2" />}
                                      </button>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                        ) : (
                          <span className="inline-flex items-center px-4 py-4 border border-r-0 border-slate-200/60 rounded-l-xl bg-slate-100 text-slate-800 font-bold text-xs sm:text-base whitespace-nowrap max-w-[100px] truncate">
                            {defaultDomain}
                          </span>
                        )}
                        <input
                          id="customAlias"
                          type="text"
                          placeholder={lang === 'id' ? 'bebas-pilih' : 'your-brand'}
                          value={customAlias}
                          onChange={(e) => setCustomAlias(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                          className="flex-1 block w-full px-3 sm:px-4 py-3.5 sm:py-4 text-sm sm:text-base font-semibold text-slate-800 border border-slate-200/60 border-l-0 rounded-none rounded-r-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white placeholder-slate-400"
                        />
                      </div>
                      <AnimatePresence>
                        {aliasAvailable === false && (aliasExpiresAt || aliasSuggestions.length > 0) && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            className="bg-red-50 border border-red-100 rounded-xl p-3 overflow-hidden text-xs"
                          >
                            {aliasExpiresAt && (
                              <p className="text-red-700 font-medium mb-2 flex items-start gap-1.5">
                                <Clock className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>
                                  {lang === 'id' 
                                    ? `Custom link ini masih dipakai. Akan tersedia kembali pada: ${new Date(aliasExpiresAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}` 
                                    : `This custom link is in use. It will be available again on: ${new Date(aliasExpiresAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}`
                                  }
                                </span>
                              </p>
                            )}
                            {aliasSuggestions.length > 0 && (
                              <div className="text-red-700">
                                <p className="mb-1.5 font-medium">{lang === 'id' ? 'Coba saran ini:' : 'Try these suggestions:'}</p>
                                <div className="flex flex-wrap gap-2">
                                  {aliasSuggestions.map(s => (
                                    <button
                                      key={s}
                                      type="button"
                                      onClick={() => setCustomAlias(s)}
                                      className="px-2.5 py-1 bg-white border border-red-200 rounded-md text-red-600 hover:bg-red-50 transition-colors font-mono"
                                    >
                                      {s}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <p className="mt-2 text-xs text-slate-500 leading-relaxed max-w-xs">
                        {lang === 'id' ? 'Biarin kosong aja kalau mau dibikinin kode otomatis.' : 'Leave blank for an auto-generated random code.'}
                      </p>
                    </div>
  
                    <div>
                      <label htmlFor="title" className="block text-sm font-bold text-slate-800 mb-2">
                        {t.linkTitle} <span className="text-slate-400 font-normal">{t.optional}</span>
                      </label>
                      <input
                        id="title"
                        type="text"
                        placeholder={lang === 'id' ? 'Follow Kami' : 'Follow Us'}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="block w-full px-4 py-4 text-sm font-medium text-slate-800 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-slate-50/80 placeholder-slate-400"
                      />
                      <p className="mt-2 text-xs text-slate-500 leading-relaxed max-w-xs">
                        {lang === 'id' ? 'Bakal muncul pas loading redirect atau pas ngisi password.' : 'Appears on the redirect page or password protection.'}
                      </p>
                    </div>
                  </div>
  
                  <div>
                    <label className="block text-sm font-bold text-slate-800 mb-3">
                      {lang === 'id' ? 'Kedaluwarsa Link' : 'Link Expiration'} <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-nowrap gap-1 min-[360px]:gap-1.5 sm:gap-2 w-full">
                      {[
                        { v: '1d', l: lang === 'id' ? '24 Jam' : '24 Hours' },
                        { v: '3d', l: lang === 'id' ? '3 Hari (Bawaan)' : '3 Days (Default)' },
                        { v: '7d', l: lang === 'id' ? '7 Hari' : '7 Days' },
                        { v: '30d', l: lang === 'id' ? '30 Hari' : '30 Days' },
                        { v: 'never', l: lang === 'id' ? 'Selamanya ∞' : 'Forever ∞' }
                      ].map((opt) => (
                        <button
                          key={opt.v}
                          type="button"
                          onClick={() => setExpiresIn(opt.v)}
                          className={`flex-1 py-2 sm:py-3 px-0.5 sm:px-2 rounded-lg sm:rounded-xl text-[9px] min-[360px]:text-[10px] sm:text-sm font-semibold transition-all flex flex-col items-center justify-center gap-0.5 sm:gap-1 border ${
                            expiresIn === opt.v 
                              ? 'bg-[#0047cc] text-white border-[#0047cc] shadow-md' 
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-0.5 sm:gap-1.5 whitespace-nowrap w-full">
                            {expiresIn === opt.v && <Check className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 shrink-0" />}
                            
                            {/* Desktop Text */}
                            <span className="hidden sm:inline text-center">{opt.l.split(' (')[0]}</span>
                            
                            {/* Mobile Text */}
                            <span className="sm:hidden text-center flex justify-center items-center h-full">
                              {opt.v === 'never' ? <Infinity className="w-4 h-4" /> : opt.l.split(' (')[0]}
                            </span>
                          </div>
                          
                          {/* Subtitle only visible on Desktop */}
                          {opt.l.includes('(') && (
                            <span className={`hidden sm:block text-[10px] ${expiresIn === opt.v ? 'text-blue-200' : 'text-slate-400'}`}>
                              ({opt.l.split(' (')[1]}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Password Protection */}
                  <div className="border-t border-slate-200/60 pt-2 overflow-visible">
                    <div className="py-3 sm:py-4 flex items-start sm:items-center justify-between cursor-pointer" onClick={() => setRequirePassword(!requirePassword)}>
                      <div className="flex items-start gap-4">
                        <div className="bg-blue-100/50 p-2.5 rounded-xl border border-blue-200/50 shrink-0 mt-0.5 sm:mt-0">
                          <Lock className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-[15px] text-slate-800">{lang === 'id' ? 'Atur Kata Sandi' : 'Set Password'}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">{lang === 'id' ? 'Cuma pengunjung yang tau password yang bisa ngebuka link ini.' : 'Only visitors with the password can access the destination.'}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={requirePassword}
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${requirePassword ? 'bg-[#0047cc]' : 'bg-slate-200'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${requirePassword ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>

                    <AnimatePresence>
                      {requirePassword && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden border-t border-slate-200/60"
                        >
                          <div className="py-4 px-1 -mx-1 bg-transparent">
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="h-4 w-4 text-slate-400" />
                              </div>
                              <input
                                type={showPassword ? "text" : "password"}
                                required={requirePassword}
                                minLength={4}
                                placeholder="SecurePass@2025!"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`block w-full pl-11 pr-12 py-3.5 text-sm font-medium border rounded-xl focus:outline-none focus:ring-2 focus:ring-inset transition-all bg-slate-50/80 ${requirePassword && password.length > 0 && password.length < 4 ? 'border-red-400 focus:ring-red-400 text-red-600 placeholder-red-300' : 'border-slate-200/60 focus:ring-primary-500 placeholder-slate-400'}`}
                              />
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setShowPassword(!showPassword); }}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                              >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </button>
                            </div>
                            <div className="flex flex-col gap-1.5 mt-3">
                              <p className={`text-[11px] font-medium flex items-start gap-1.5 ${requirePassword && password.length > 0 && password.length < 4 ? 'text-red-500' : 'text-slate-500'}`}>
                                <ShieldAlert className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                {lang === 'id' ? 'Minimal 4 karakter (huruf/angka/simbol bebas).' : 'Minimum 4 characters (any).'}
                              </p>
                              <p className="text-[11px] text-blue-600 font-medium flex items-start gap-1.5 font-mono">
                                <Shield className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                {lang === 'id' ? 'Pengunjung bakal ngeliat halaman login aman (AES 256-bit).' : 'Visitors will see a 256-bit AES secure authentication dialog.'}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Time-Lock / Scheduled Access */}
                  <div className={`border-t border-slate-200/60 pt-2 ${isTimezoneDropdownOpen ? 'relative z-20' : 'overflow-visible'}`}>
                    <div className="py-3 sm:py-4 flex items-start sm:items-center justify-between cursor-pointer" onClick={() => setRequireSchedule(!requireSchedule)}>
                      <div className="flex items-start gap-4">
                        <div className="bg-indigo-100/50 p-2.5 rounded-xl border border-indigo-200/50 shrink-0 mt-0.5 sm:mt-0">
                          <Clock className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-[15px] text-slate-800">{lang === 'id' ? 'Atur Jadwal (Kunci Waktu)' : 'Schedule (Time Lock)'}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">{lang === 'id' ? 'Kunci Link hingga batas waktu rilis yang ditentukan tercapai.' : 'Lock link until a specific release time is reached.'}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={requireSchedule}
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${requireSchedule ? 'bg-[#0047cc]' : 'bg-slate-200'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${requireSchedule ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>

                    <AnimatePresence>
                      {requireSchedule && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className={`border-t border-slate-200/60 ${isTimezoneDropdownOpen ? 'overflow-visible' : 'overflow-hidden'}`}
                        >
                          <div className="py-4 px-1 -mx-1 bg-transparent">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="relative border border-slate-200/60 rounded-xl focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 transition-all bg-slate-50/80 focus-within:bg-white overflow-hidden">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                  <Calendar className="h-4.5 w-4.5 text-blue-500" />
                                </div>
                                <input
                                  type="datetime-local"
                                  required={requireSchedule}
                                  value={unlockAt}
                                  onChange={(e) => setUnlockAt(e.target.value)}
                                  min={new Date().toISOString().slice(0, 16)}
                                  className="block w-full pl-11 pr-4 py-3.5 text-sm font-medium text-slate-800 bg-transparent border-0 focus:ring-0 outline-none min-h-[50px] cursor-pointer font-mono"
                                  style={{ colorScheme: 'light' }}
                                />
                              </div>
                              <div 
                                className="flex items-center gap-2 px-3 py-2 border border-slate-200/60 rounded-xl bg-slate-50/50 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 transition-all focus-within:bg-white relative cursor-pointer"
                                tabIndex={0}
                                onBlur={(e) => {
                                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                    setIsTimezoneDropdownOpen(false);
                                  }
                                }}
                                onClick={() => setIsTimezoneDropdownOpen(!isTimezoneDropdownOpen)}
                              >
                                <Globe className="w-4.5 h-4.5 text-slate-400 shrink-0 absolute left-3 pointer-events-none" />
                                
                                <div className="w-full pl-7 pr-8 py-1.5 bg-transparent border-0 text-xs font-semibold text-slate-700 outline-none truncate">
                                  {timezonesList.find(t => t.value === timezone)?.label || '(GMT+07:00) Jakarta (WIB)'}
                                </div>
                                
                                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 absolute right-3 transition-transform duration-200 ${isTimezoneDropdownOpen ? 'rotate-180' : ''}`} />
                                
                                <AnimatePresence>
                                  {isTimezoneDropdownOpen && (
                                    <motion.div
                                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                      animate={{ opacity: 1, y: 0, scale: 1 }}
                                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                      transition={{ duration: 0.15, ease: "easeOut" }}
                                      className="absolute z-50 left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-y-auto max-h-60 min-w-[280px]"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {timezonesList.map(tz => (
                                        <button
                                          key={tz.value}
                                          type="button"
                                          onClick={() => {
                                            setTimezone(tz.value);
                                            setIsTimezoneDropdownOpen(false);
                                          }}
                                          className={`w-full text-left px-4 py-2.5 text-xs transition-colors flex items-center justify-between border-b border-slate-50 last:border-0 ${
                                            timezone === tz.value ? 'bg-primary-50 text-primary-700 font-bold' : 'text-slate-700 hover:bg-slate-50 font-medium'
                                          }`}
                                        >
                                          <span className="truncate">{tz.label}</span>
                                          {timezone === tz.value && <CheckCircle2 className="w-4 h-4 text-primary-600 shrink-0 ml-2" />}
                                        </button>
                                      ))}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-4 leading-relaxed">
                              {lang === 'id' ? 'Link bakal nampilin hitungan mundur seru dan otomatis ngebuka sendiri pas waktunya tiba.' : 'The link will display an interactive countdown and open automatically at the scheduled time.'}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Custom Link Preview (OG) Toggle */}
                  <div className="border-t border-slate-200/60 pt-2 overflow-visible">
                    <div className="py-3 sm:py-4 flex items-start sm:items-center justify-between cursor-pointer" onClick={() => setRequireOg(!requireOg)}>
                      <div className="flex items-start gap-4">
                        <div className="bg-sky-100/50 p-2.5 rounded-xl border border-sky-200/50 shrink-0 mt-0.5 sm:mt-0">
                          <Share2 className="h-5 w-5 text-sky-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-[15px] text-slate-800">{lang === 'id' ? 'Custom Link Preview (SEO & OpenGraph)' : 'Custom Link Preview (SEO)'}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">{lang === 'id' ? 'Sesuaikan judul, ringkasan, dan kartu banner saat Link dibagikan.' : 'Customize title, description, and image for social media.'}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={requireOg}
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${requireOg ? 'bg-[#0047cc]' : 'bg-slate-200'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${requireOg ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                    
                    <AnimatePresence>
                      {requireOg && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden border-t border-slate-200/60"
                        >
                          <div className="py-4 px-1 -mx-1 bg-transparent grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-4">
                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                  Preview Title
                                </label>
                                <input
                                  type="text"
                                  value={ogTitle}
                                  onChange={(e) => setOgTitle(e.target.value)}
                                  placeholder="Indonesia Digital Summit 2025 • Konferensi Teknologi"
                                  className="block w-full px-4 py-2.5 text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200/60 rounded-xl focus:ring-2 focus:ring-inset focus:ring-primary-500 focus:bg-white outline-none transition-all placeholder-slate-400"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                  Preview Description
                                </label>
                                <textarea
                                  value={ogDescription}
                                  onChange={(e) => setOgDescription(e.target.value)}
                                  placeholder={lang === 'id' ? "Temukan peta jalan inovasi AI, keamanan siber, dan ekonomi digital terkini bersama 50+ pembicara..." : "Discover the AI innovation roadmap, cybersecurity, and digital economy with 50+ speakers..."}
                                  rows={3}
                                  className="block w-full px-4 py-2.5 text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200/60 rounded-xl focus:ring-2 focus:ring-inset focus:ring-primary-500 focus:bg-white outline-none transition-all resize-none placeholder-slate-400"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                  Preview Image (Max 2MB)
                                </label>
                                <div className="mt-1 flex items-center justify-center w-full">
                                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300/80 rounded-xl cursor-pointer bg-slate-50/50 hover:bg-slate-100/80 transition-colors relative overflow-hidden group">
                                    {ogImage ? (
                                      <div className="absolute inset-0 w-full h-full">
                                        <img src={ogImage} alt="Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                          <span className="text-white text-xs font-bold bg-slate-900/60 px-3 py-1.5 rounded-lg shadow-sm">Ubah Gambar</span>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col items-center justify-center p-4 text-center">
                                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-2">
                                          <Upload className="w-5 h-5" />
                                        </div>
                                        <p className="mb-1 text-xs text-slate-700 font-bold">{lang === 'id' ? 'Klik buat upload banner atau seret gambar ke sini' : 'Click to upload banner or drag image here'}</p>
                                        <p className="text-[10px] text-slate-500 font-mono">Mendukung format PNG, JPG, WebP rasio 1.91:1 (1200 × 630px)</p>
                                      </div>
                                    )}
                                    <input 
                                      type="file" 
                                      className="hidden" 
                                      accept="image/png, image/jpeg, image/webp"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          if (file.size > 2 * 1024 * 1024) {
                                            toast.error("File is too large. Max size is 2MB.");
                                            return;
                                          }
                                          const reader = new FileReader();
                                          reader.onload = (event) => {
                                            setOgImage(event.target?.result as string);
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                    />
                                  </label>
                                </div>
                                {ogImage && (
                                  <button
                                    type="button"
                                    onClick={() => setOgImage(null)}
                                    className="mt-2 text-xs font-bold text-red-500 hover:text-red-600 flex items-center justify-end w-full"
                                  >
                                    Hapus Gambar
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            {/* Live Social Media Card Mockup */}
                            <div className="hidden lg:flex flex-col h-full">
                              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider text-right">
                                LIVE SOCIAL MEDIA CARD MOCKUP
                              </label>
                              <div className="flex-1 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex flex-col pointer-events-none">
                                <div className="aspect-[1.91/1] w-full bg-slate-200 relative">
                                  {ogImage ? (
                                    <img src={ogImage} alt="Mockup" className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                                      <Globe className="w-12 h-12 opacity-20" />
                                    </div>
                                  )}
                                  <div className="absolute bottom-2 left-2 bg-slate-900/70 backdrop-blur-sm px-2 py-1 rounded text-[10px] text-white font-bold tracking-wide">
                                    {defaultDomain}
                                  </div>
                                </div>
                                <div className="p-4 flex-1 flex flex-col bg-slate-100/50">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1 truncate">{domainId ? customDomains.find(d => d.id === domainId)?.domain : defaultDomain}</span>
                                  <h4 className="font-bold text-slate-900 text-sm leading-tight mb-1 line-clamp-1">{ogTitle || (lang === 'id' ? 'Pratinjau Judul Link' : 'Link Title Preview')}</h4>
                                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{ogDescription || (lang === 'id' ? 'Ini deskripsi yang bakal muncul pas link kamu disebar di sosmed...' : 'This is a preview of the description that will appear when your link is shared on social media...')}</p>
                                </div>
                              </div>
                              <p className="text-center text-[10px] text-slate-400 mt-2 font-mono">
                                {lang === 'id' ? 'Pratinjau otomatis di WhatsApp, Telegram, X, dan iMessage.' : 'Automatic preview on WhatsApp, Telegram, X, and iMessage.'}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Custom QR Logo */}
                  <div className="border-t border-slate-200/60 pt-2 overflow-hidden transition-all">
                    <div className="py-3 sm:py-4 flex items-start sm:items-center justify-between cursor-pointer" onClick={() => {
                        if (qrLogo === '/logo/fyurl-logo-tp.png') {
                            if (fileInputRef.current) fileInputRef.current.click();
                        } else {
                            setQrLogo('/logo/fyurl-logo-tp.png');
                            if (fileInputRef.current) fileInputRef.current.value = '';
                        }
                    }}>
                      <div className="flex items-start gap-4">
                        <div className="bg-indigo-100/50 p-2.5 rounded-xl border border-indigo-200/50 shrink-0 mt-0.5 sm:mt-0">
                          <QrCode className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-[15px] text-slate-800">{lang === 'id' ? 'Logo Kode QR Kustom' : 'Custom QR Code Logo'} <span className="text-slate-400 font-normal">{t.optional}</span></h3>
                          <p className="text-xs text-slate-500 mt-0.5">{lang === 'id' ? 'Taruh logo brand kamu atau watermark persis di tengah-tengah QR code.' : 'Embed your brand avatar or watermark in the center of the QR barcode.'}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-md shrink-0">{lang === 'id' ? 'Tersedia' : 'Available'}</span>
                    </div>

                    <div className="pb-4 sm:pb-5">
                      <div className="bg-transparent flex flex-col sm:flex-row items-center gap-4">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-white flex items-center justify-center shrink-0 border border-blue-100 p-2 shadow-sm overflow-hidden pointer-events-none">
                          <QRCodeCanvas 
                            value="https://fyurl.id/preview" 
                            size={96}
                            level="H"
                            imageSettings={qrLogo ? {
                              src: qrLogo,
                              height: 28,
                              width: 28,
                              excavate: true,
                            } : undefined}
                          />
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                          <h4 className="font-bold text-sm text-slate-800 mb-0.5">{lang === 'id' ? 'Pilih file logo (mendingan pakai PNG transparan)' : 'Select logo file (Transparent PNG recommended)'}</h4>
                          <p className="text-xs text-slate-500 font-mono">{lang === 'id' ? 'Maksimal 1MB • Rasio 1:1 persegi' : 'Max 1MB • 1:1 Square Ratio'}</p>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <input 
                            ref={fileInputRef}
                            type="file"
                            accept="image/png, image/jpeg, image/webp"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 1 * 1024 * 1024) {
                                  toast.error("File is too large. Max size is 1MB.");
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  setQrLogo(event.target?.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors border border-slate-200/60"
                          >
                            Pilih Berkas
                          </button>
                          {qrLogo !== '/logo/fyurl-logo-tp.png' && (
                              <span className="text-xs font-mono text-slate-500 truncate max-w-[100px]" title="logo">logo_custom</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 text-center">
                  <button
                    type="submit"
                    disabled={loading || !longUrl || (requirePassword && password.length < 4) || aliasAvailable === false || (anonQuota !== null && anonQuota.remaining <= 0)}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-12 py-4 text-base font-bold text-white bg-[#0047cc] hover:bg-blue-700 rounded-xl transition-all focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-70 disabled:cursor-not-allowed group shadow-lg shadow-blue-500/30"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        {t.shortening}
                      </>
                    ) : (
                      <>
                        {lang === 'id' ? 'Buat Link' : 'Make It'}
                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                  <p className="mt-4 text-[11px] font-mono text-slate-500">
                    {lang === 'id' ? 'Tekan' : 'Press'} <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">Enter ↵</span> • {lang === 'id' ? 'Udah siap banget buat disebar ke mana-mana' : 'Ready to share directly to your communication channels'}
                  </p>
                </div>
              </form>
            ) : (
              <div className="p-6 sm:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6 mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-foreground mb-8">{t.linkReady}</h2>
                  
                  <div className="flex flex-col md:flex-row gap-8 items-center md:items-stretch text-left">
                  <div className="flex-1 flex flex-col justify-center min-w-0">
                    <p className="text-sm font-semibold text-muted-foreground mb-3">{t.shortLinkText}</p>
                    <div className="flex shadow-sm rounded-xl overflow-hidden border border-primary-200 bg-white mb-6">
                      <div className="flex-1 px-4 py-3 truncate text-primary-700 font-medium text-base sm:text-lg flex items-center min-w-0">
                        <span className="truncate">{result.domain.replace(/^www\./, '')}/{result.shortCode}</span>
                      </div>
                      <button
                        onClick={handleCopy}
                        className="px-4 sm:px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium transition-colors flex items-center shrink-0"
                      >
                        {copied ? (
                          <><CheckCircle2 className="w-5 h-5 sm:mr-2" /> <span className="hidden sm:inline">{t.copied}</span></>
                        ) : (
                          <><Copy className="w-5 h-5 sm:mr-2" /> <span className="hidden sm:inline">{t.copy}</span></>
                        )}
                      </button>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-2">
                      <button
                        onClick={() => setResult(null)}
                        className="text-primary-600 hover:text-primary-700 font-medium flex-1 flex items-center justify-center transition-colors group bg-primary-50 px-4 py-3 rounded-xl border border-primary-100"
                      >
                        <ArrowRight className="w-4 h-4 mr-2 rotate-180 group-hover:-translate-x-1 transition-transform" />
                        {t.createAnother}
                      </button>
                      <button
                        onClick={() => setShowDonationModal(true)}
                        className="text-amber-700 hover:text-amber-800 font-medium flex-1 flex items-center justify-center transition-colors group bg-amber-50 hover:bg-amber-100 px-4 py-3 rounded-xl border border-amber-200"
                      >
                        <HandCoins className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform text-amber-500" />
                        {lang === 'id' ? 'Traktir Kopi (Donasi)' : 'Support via Donation'}
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center bg-white p-6 rounded-2xl shadow-sm border border-border shrink-0 md:w-[280px] w-full max-w-[280px]">
                    <div className="mb-6 bg-muted/10 rounded-xl p-2 w-full flex justify-center aspect-square">
                      <QRCodeCanvas 
                        id="qr-canvas"
                        value={`https://${result.domain}/${result.shortCode}`} 
                        size={1024}
                        style={{ width: '100%', height: '100%', maxWidth: '220px', maxHeight: '220px' }}
                        level="H"
                        includeMargin={true}
                        className="rounded-lg"
                        imageSettings={{
                          src: qrLogo,
                          height: 200,
                          width: 200,
                          excavate: true,
                        }}
                      />
                    </div>
                    <button
                      onClick={handleDownloadQR}
                      className="inline-flex items-center justify-center px-4 py-2 border border-border rounded-xl text-xs font-semibold text-foreground hover:bg-muted transition-colors w-full"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {t.downloadQR}
                    </button>
                  </div>
                </div>
                </div>
              </div>
              )
            )}
            
            {activeTab === 'qr' && (
              <div className="p-6 sm:p-10 animate-in fade-in duration-300">
                    <div className="mb-8">
                      <label htmlFor="qrText" className="block text-sm font-semibold text-foreground mb-2">
                    {t.textOrUrl} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="qrText"
                    placeholder={t.textOrUrlPlaceholder}
                    value={qrText}
                    onChange={(e) => {
                      setQrText(e.target.value);
                      setQrShortLink(null);
                    }}
                    className="block w-full px-4 py-4 text-base border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-muted/30 focus:bg-white resize-none min-h-[120px]"
                  />
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={handleGenerateTrackableQr}
                      disabled={isGeneratingQr || !qrText.trim()}
                      className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all focus:outline-none"
                    >
                      {isGeneratingQr ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {lang === 'id' ? 'Memproses...' : 'Processing...'}</>
                      ) : (
                        lang === 'id' ? 'Buat QR Code' : 'Generate QR Code'
                      )}
                    </button>
                  </div>
                </div>

                <div className="mb-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
                  <div className="col-span-2 sm:col-span-2">
                    <label className="block text-sm font-semibold text-foreground mb-2">{t.uploadLogo}</label>
                    <div className="flex items-center gap-2">
                      <input 
                        ref={fileInputRef}
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 2 * 1024 * 1024) {
                              toast.error("File is too large. Please upload an image smaller than 2MB.");
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setQrLogo(event.target?.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 border border-border rounded-xl p-1 bg-white cursor-pointer"
                      />
                      {qrLogo !== '/logo/fyurl-logo-tp.png' && (
                        <button
                          type="button"
                          onClick={() => {
                            setQrLogo('/logo/fyurl-logo-tp.png');
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="p-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border border-red-200 transition-colors"
                          title="Remove custom logo"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="col-span-1">
                    <label className="block text-sm font-semibold text-foreground mb-2">{t.qrColor}</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="color" 
                        value={qrFgColor} 
                        onChange={(e) => setQrFgColor(e.target.value)}
                        className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0 shadow-sm"
                      />
                    </div>
                  </div>
                  <div className="col-span-1">
                    <label className="block text-sm font-semibold text-foreground mb-2">{t.background}</label>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex items-center gap-2">
                        <input 
                          type="color" 
                          value={qrBgColor} 
                          onChange={(e) => setQrBgColor(e.target.value)}
                          disabled={transparentBg}
                          className={`w-10 h-10 rounded-xl cursor-pointer border-0 p-0 shadow-sm ${transparentBg ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                      </div>
                      <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={transparentBg} 
                          onChange={(e) => setTransparentBg(e.target.checked)} 
                          className="w-4 h-4 rounded border-gray-300 accent-primary-600 cursor-pointer" 
                        />
                        {t.transparent}
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center p-4 sm:p-8 bg-muted/20 rounded-2xl border border-border border-dashed min-h-[480px] w-full">
                  {qrShortLink ? (
                    <>
                      <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-border mb-6 w-full max-w-[340px] flex justify-center aspect-square">
                        <QRCodeCanvas 
                          id="qr-canvas-standalone"
                          value={qrShortLink} 
                          size={1024}
                          style={{ width: '100%', height: '100%', maxWidth: '300px', maxHeight: '300px' }}
                          level="H"
                          includeMargin={true}
                          fgColor={qrFgColor}
                          bgColor={transparentBg ? 'rgba(255,255,255,0)' : qrBgColor}
                          imageSettings={qrLogo ? {
                            src: qrLogo,
                            height: 200,
                            width: 200,
                            excavate: true,
                          } : undefined}
                        />
                      </div>
                      <button
                        onClick={() => {
                          const canvas = document.getElementById('qr-canvas-standalone') as HTMLCanvasElement;
                          if (!canvas) return;
                          const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
                          const downloadLink = document.createElement('a');
                          downloadLink.href = pngUrl;
                          downloadLink.download = `qr-code.png`;
                          document.body.appendChild(downloadLink);
                          downloadLink.click();
                          document.body.removeChild(downloadLink);
                        }}
                        className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-all focus:outline-none"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {t.downloadQRCode}
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground opacity-60">
                      <QrCode className="w-16 h-16 mb-4 stroke-1" />
                      <p className="font-medium text-center">{lang === 'id' ? 'Klik Bikin QR buat mulai.' : 'Click Generate to create a QR Code.'}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'scan' && (
              <div className="p-6 sm:p-10 animate-in fade-in duration-300">
                <div className="flex flex-col items-center justify-center min-h-[480px]">
                    {!isCameraActive && !scannedQrResult && (
                      <div className="flex flex-col items-center">
                        <div className="mb-6 bg-white p-6 rounded-full shadow-sm border border-slate-100 text-primary-600">
                          <Scan className="w-12 h-12" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2 text-center">
                          {lang === 'id' ? 'Scan QR Code' : 'Scan QR Code'}
                        </h3>
                        <p className="text-slate-500 text-center max-w-sm mb-8 text-sm">
                          {lang === 'id' ? 'Arahkan kamera ke QR Code untuk menerjemahkan isinya secara instan.' : 'Point your camera at a QR code to decode it instantly.'}
                        </p>
                        
                        <button
                          onClick={() => {
                            setScannedQrResult(null);
                            setIsCameraActive(true);
                          }}
                          className="inline-flex items-center justify-center px-8 py-3.5 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-primary-600 hover:bg-primary-700 transition-all focus:outline-none mb-4 w-full sm:w-auto"
                        >
                          <Scan className="w-5 h-5 mr-2" />
                          {lang === 'id' ? 'Mulai Scan Kamera' : 'Start Camera Scan'}
                        </button>
                      </div>
                    )}

                    {isCameraActive && (
                      <div className="flex flex-col items-center w-full max-w-md">
                        <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden mb-6 border-4 border-slate-100 shadow-lg">
                          <video ref={videoRef} playsInline className="absolute top-0 left-0 w-full h-full object-cover" />
                          <div className="absolute inset-0 pointer-events-none border-[40px] border-black/40 z-10 flex items-center justify-center">
                            <div className="w-full h-full border-2 border-dashed border-white/70 relative">
                               <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-primary-500 -mt-1 -ml-1"></div>
                               <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-primary-500 -mt-1 -mr-1"></div>
                               <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-primary-500 -mb-1 -ml-1"></div>
                               <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-primary-500 -mb-1 -mr-1"></div>
                            </div>
                          </div>
                          <canvas ref={canvasRef} className="hidden" />
                        </div>
                        
                        {cameraError && (
                          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 text-center border border-red-100 w-full">
                            {cameraError}
                          </div>
                        )}
                        
                        <button
                          onClick={() => setIsCameraActive(false)}
                          className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors mb-2 text-sm"
                        >
                          {lang === 'id' ? 'Batal Scan' : 'Cancel Scan'}
                        </button>
                      </div>
                    )}

                    {scannedQrResult && (
                      <div className="w-full max-w-lg bg-white rounded-xl border border-primary-200 shadow-sm p-4 sm:p-5 animate-in fade-in slide-in-from-bottom-4 mb-8">
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-xs font-bold text-primary-600 uppercase tracking-wider">
                            {lang === 'id' ? 'Hasil Terjemahan:' : 'Decoded Result:'}
                          </label>
                          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold flex items-center">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Sukses
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3">
                          <div className="flex-1 bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200 text-slate-800 text-sm break-all font-mono whitespace-pre-wrap min-h-[60px]">
                            {scannedQrResult}
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(scannedQrResult);
                              toast.success(lang === 'id' ? 'Berhasil disalin!' : 'Copied to clipboard!');
                            }}
                            className="p-3 sm:p-4 bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-xl transition-colors border border-primary-100 shrink-0 flex items-center justify-center gap-2"
                            title="Copy result"
                          >
                            <Copy className="w-5 h-5" />
                            <span className="sm:hidden font-medium">{lang === 'id' ? 'Salin Hasil' : 'Copy Result'}</span>
                          </button>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-center">
                           <button
                            onClick={() => {
                              setScannedQrResult(null);
                              setIsCameraActive(true);
                            }}
                            className="text-primary-600 hover:text-primary-700 text-sm font-bold flex items-center transition-colors"
                           >
                             <Scan className="w-4 h-4 mr-1.5" />
                             {lang === 'id' ? 'Scan QR Lainnya' : 'Scan Another QR'}
                           </button>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex flex-col items-center border-t border-slate-200/60 pt-6 w-full max-w-md">
                      <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wider">
                        {lang === 'id' ? 'Atau unggah file gambar' : 'Or upload an image file'}
                      </p>
                      <input 
                        ref={scanFileInputRef}
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleScanQr}
                        className="hidden"
                      />
                      <button
                        onClick={() => scanFileInputRef.current?.click()}
                        disabled={isScanningQr || isCameraActive}
                        className="inline-flex items-center justify-center px-6 py-2.5 border border-slate-200 rounded-lg shadow-sm text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isScanningQr ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {lang === 'id' ? 'Memproses...' : 'Processing...'}</>
                        ) : (
                          <><Upload className="w-4 h-4 mr-2 text-slate-500" /> {lang === 'id' ? 'Pilih File QR (JPG/PNG)' : 'Select QR File (JPG/PNG)'}</>
                        )}
                      </button>
                    </div>

                  </div>
              </div>
            )}
            
          </div>

          {recentLinks.length > 0 && (
            <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-lg font-bold text-slate-800">
                  {lang === 'id' ? 'Link Terakhir' : 'Recent Links'}
                </h3>
                <button 
                  onClick={() => {
                    setRecentLinks([]);
                    localStorage.removeItem('fyurl_recent_links');
                  }}
                  className="text-sm text-slate-500 hover:text-red-500 font-medium transition-colors"
                >
                  {lang === 'id' ? 'Hapus Riwayat' : 'Clear History'}
                </button>
              </div>
              
              <div className="space-y-3">
                {recentLinks.map((link) => (
                  <div key={link.shortCode} className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-xl p-3 sm:p-4 flex flex-row gap-3 sm:gap-4 items-center shadow-sm hover:shadow-md transition-shadow group">
                    <div className="bg-slate-50 p-1.5 sm:p-2 rounded-lg border border-slate-100 shrink-0 relative overflow-hidden group-hover:border-primary-100 transition-colors">
                      <QRCodeCanvas 
                        id={`qr-history-${link.shortCode}`}
                        value={`https://${link.domain}/${link.shortCode}`} 
                        size={64}
                        level="H"
                        includeMargin={false}
                        className="rounded"
                        imageSettings={{
                          src: '/logo/fyurl-logo-tp.png',
                          x: undefined,
                          y: undefined,
                          height: 16,
                          width: 16,
                          excavate: true,
                        }}
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0 text-left w-full">
                      <div className="flex items-center justify-start gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                        <a 
                          href={`https://${link.domain}/${link.shortCode}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="font-bold text-primary-700 hover:text-primary-800 text-base sm:text-lg truncate transition-colors"
                        >
                          {link.domain}/{link.shortCode}
                        </a>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`${link.domain}/${link.shortCode}`);
                            toast.success(lang === 'id' ? 'Disalin!' : 'Copied!');
                          }}
                          className="p-1 sm:p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors shrink-0"
                          title="Copy"
                        >
                          <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                      <div className="text-xs sm:text-sm text-slate-500 truncate flex items-center justify-start gap-1">
                        <ArrowRight className="w-3 h-3 shrink-0" />
                        <span className="truncate" title={link.longUrl}>{link.longUrl}</span>
                      </div>
                    </div>
                    
                    <div className="shrink-0 flex items-center gap-2">
                      <button
                        onClick={() => {
                          const canvas = document.createElement('canvas');
                          // Download QR code image from the canvas
                          const downloadLink = document.createElement('a');
                          const qrCanvas = document.getElementById(`qr-history-${link.shortCode}`) as HTMLCanvasElement;
                          if (qrCanvas) {
                            downloadLink.href = qrCanvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
                            downloadLink.download = `qr-${link.shortCode}.png`;
                            document.body.appendChild(downloadLink);
                            downloadLink.click();
                            document.body.removeChild(downloadLink);
                          }
                        }}
                        className="p-2 sm:px-4 sm:py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">{lang === 'id' ? 'Unduh QR' : 'Download QR'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Features & Security Info */}
          <div className="mt-12 sm:mt-16 pt-8 border-t border-slate-200/60 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-3">
                {lang === 'id' ? 'Kenapa Memilih Fyurl?' : 'Why Choose Fyurl?'}
              </h2>
              <p className="text-slate-500 max-w-2xl mx-auto">
                {lang === 'id' 
                  ? 'Bukan sekadar pemendek link biasa. Ada perlindungan berlapis buat ngamanin data kamu.' 
                  : 'More than just a URL shortener. Equipped with advanced security features to protect your data.'}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">
                  {lang === 'id' ? 'Keamanan AES-256' : 'AES-256 Security'}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {lang === 'id' 
                    ? 'Link diproteksi password pakai standar enkripsi tinggi. Aman banget buat jaga privasi.' 
                    : 'Password-protected links use industry-standard encryption. Visitor privacy and destinations are secure.'}
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">
                  {lang === 'id' ? 'Kendali Waktu Penuh' : 'Full Time Control'}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {lang === 'id' 
                    ? 'Atur sendiri kapan link mulai aktif atau mati. Cocok banget buat rilis karya, event, atau promo eksklusif.' 
                    : 'Set when links activate and expire. Use countdown timers for exclusive campaigns and launches.'}
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">
                  {lang === 'id' ? 'Domain & Branding' : 'Domain & Branding'}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {lang === 'id' 
                    ? 'Gampang banget buat pakai domain sendiri dan atur pratinjau sosmed (OpenGraph) biar kelihatan lebih pro.' 
                    : 'Use your own custom domains and customize social media previews (OpenGraph) for a professional look.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>



      {/* Login Features Modal */}
      <AnimatePresence>
        {showFeatureModal && !session && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="p-5 sm:p-8 relative">
              <button 
                onClick={() => {
                  setShowFeatureModal(false);
                }}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex justify-center mb-4 sm:mb-6">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary-100 text-primary-600 rounded-2xl rotate-3 flex items-center justify-center shadow-inner">
                  <Zap className="w-7 h-7 sm:w-8 sm:h-8 -rotate-3" />
                </div>
              </div>
              
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-2 sm:mb-3">
                {lang === 'id' ? 'Cobain Fitur Premium Gratis!' : 'Upgrade Your Experience!'}
              </h3>
              <p className="text-sm sm:text-base text-slate-500 text-center mb-5 sm:mb-8 font-medium">
                {lang === 'id' ? 'Yuk login sekarang buat nikmatin semua fitur keren Fyurl, 100% gratis!' : 'Login now to unlock all exclusive Fyurl features for free.'}
              </p>
              
              <div className="space-y-4 sm:space-y-5 mb-6 sm:mb-10 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-100">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="bg-white p-1.5 sm:p-2 rounded-full shadow-sm border border-slate-100 shrink-0">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm sm:text-base">{lang === 'id' ? 'Manajemen Link & QR Code' : 'Link & QR Code Management'}</h4>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">{lang === 'id' ? 'Gampang banget buat ngedit, hapus, atau mantau semua link & QR code bikinanmu.' : 'Edit, delete, and monitor all links and QR codes you have created.'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="bg-white p-1.5 sm:p-2 rounded-full shadow-sm border border-slate-100 shrink-0">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm sm:text-base">{lang === 'id' ? 'Statistik Pengunjung Detail' : 'Detailed Visitor Statistics'}</h4>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">{lang === 'id' ? 'Bisa kepoin jumlah klik, asal negara, sampai perangkat yang dipakai pengunjungmu.' : 'Know how many clicks, devices & countries your visitors come from.'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="bg-white p-1.5 sm:p-2 rounded-full shadow-sm border border-slate-100 shrink-0">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm sm:text-base">{lang === 'id' ? 'Pakai Domain Sendiri' : 'Your Own Custom Domain'}</h4>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">{lang === 'id' ? 'Bikin link makin kece dan tepercaya pakai domain kamu sendiri (misal: link.namakamu.com).' : 'Use your own domain (e.g. link.yourname.com) for branding.'}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => {
                    setShowFeatureModal(false);
                  }}
                  className="flex-1 py-3 sm:py-3.5 px-4 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors order-2 sm:order-1"
                >
                  {lang === 'id' ? 'Nanti Aja' : 'Try Later'}
                </button>
                <button 
                  onClick={() => signIn()}
                  className="flex-1 py-3 sm:py-3.5 px-4 rounded-xl font-bold text-white bg-primary-600 hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/30 hover:shadow-primary-600/50 hover:-translate-y-0.5 order-1 sm:order-2 flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
                  {lang === 'id' ? 'Login Sekarang' : 'Login Now'}
                </button>
              </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Not Found Modal */}
      <AnimatePresence>
        {showNotFoundModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative"
            >
              <button 
                onClick={() => setShowNotFoundModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="p-8 text-center">
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center shadow-inner">
                    <ShieldAlert className="w-10 h-10" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-slate-900 mb-3">
                  {lang === 'id' ? 'Link Tidak Ditemukan' : 'Link Not Found'}
                </h3>
                
                <p className="text-slate-500 mb-8 font-medium">
                  {lang === 'id' 
                    ? 'Waduh! Link yang dicari mungkin udah dihapus, mati, atau emang nggak pernah ada. Selow, jangan panik!' 
                    : 'Oops! The link you are looking for might have been deleted, expired, or never existed. But don\'t worry!'}
                </p>
                
                <button 
                  onClick={() => {
                    setShowNotFoundModal(false);
                    const input = document.querySelector('input[type="url"]') as HTMLInputElement;
                    if (input) {
                      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      setTimeout(() => input.focus(), 500);
                    }
                  }}
                  className="w-full py-4 px-4 rounded-xl font-bold text-white bg-primary-600 hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/30 hover:shadow-primary-600/50 hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <LinkIcon className="w-5 h-5" />
                  {lang === 'id' ? 'Buat Link Anda Sendiri' : 'Create Your Own Link'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Expired Modal */}
      <AnimatePresence>
        {showExpiredModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative"
            >
              <button 
                onClick={() => setShowExpiredModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="p-8 text-center">
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center shadow-inner">
                    <Clock className="w-10 h-10" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-slate-900 mb-3">
                  {lang === 'id' ? 'Link Kedaluwarsa' : 'Link Expired'}
                </h3>
                
                <p className="text-slate-500 mb-8 font-medium">
                  {lang === 'id' 
                    ? 'Yaaah, link-nya udah kelewat batas waktu dan udah nggak bisa diakses lagi deh.' 
                    : 'The link you are trying to reach has expired and is no longer accessible.'}
                </p>
                
                <button 
                  onClick={() => {
                    setShowExpiredModal(false);
                    const input = document.querySelector('input[type="url"]') as HTMLInputElement;
                    if (input) {
                      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      setTimeout(() => input.focus(), 500);
                    }
                  }}
                  className="w-full py-4 px-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  {lang === 'id' ? 'Buat Short Link Anda Sendiri' : 'Create Your Own Short Link'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Donation Modal */}
      <DonationModal 
        isOpen={showDonationModal} 
        onClose={() => setShowDonationModal(false)} 
        lang={lang} 
      />
    </div>
  );
}
