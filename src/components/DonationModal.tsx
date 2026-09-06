'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, HandCoins } from 'lucide-react';
import { dictionaries, Language } from '@/lib/i18n';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export default function DonationModal({ isOpen, onClose, lang }: DonationModalProps) {
  const t = dictionaries[lang];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          
          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md sm:max-w-lg md:max-w-xl z-[101] p-4 sm:p-0"
          >
            <div className="bg-white rounded-3xl shadow-2xl flex flex-col relative border border-slate-100 max-h-[90dvh] sm:max-h-[95vh] overflow-y-auto custom-scrollbar">
              
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="bg-gradient-to-br from-primary-50 to-white px-6 pt-10 pb-6 flex flex-col items-center text-center">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                  {t.donationTitle || (lang === 'id' ? 'Makasi Supportnya!' : 'Thank You For Your Support!')}
                </h3>
                <p className="text-sm text-slate-600 sm:text-base max-w-md">
                  {t.donationDesc || (lang === 'id' ? 'Donasi kamu ngebantu banget buat bayar server supaya Fyurl bisa terus gratis dipake siapa aja.' : 'Your donation means the world to us and helps keep our servers running and this platform free for everyone.')}
                </p>
              </div>

              <div className="px-6 py-5 flex flex-col items-center border-t border-slate-100 bg-slate-50/50">
                <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full font-bold text-xs uppercase tracking-wider">
                  QRIS FYURL
                </div>
                <img 
                  src="/logo/qris.png" 
                  alt="QRIS Donation" 
                  className="w-full max-w-sm max-h-[45vh] sm:max-h-[400px] h-auto object-contain rounded-xl mb-6 shadow-sm border border-slate-200 bg-white"
                />
                <p className="text-xs sm:text-sm text-slate-500 font-medium text-center px-4">
                  {t.scanQrisText || (lang === 'id' ? 'Tinggal scan aja QRIS di atas pakai e-wallet atau m-banking andalan kamu.' : 'Scan the QRIS code above using your favorite e-wallet or m-banking app.')}
                </p>
              </div>

              <div className="px-6 pb-6 pt-4 bg-slate-50/50 flex flex-col">
                <div className="relative flex justify-center text-xs mb-4">
                  <span className="bg-slate-50/50 px-2 text-slate-400 font-medium">
                    {t.outsideIndo || (lang === 'id' ? 'Atau kamu lagi di luar Indonesia?' : 'Are you outside Indonesia?')}
                  </span>
                  <div className="absolute inset-0 flex items-center -z-10">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                </div>

                <a 
                  href="https://saweria.co/payes" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#E5B53A] hover:bg-[#D4A633] transition-all focus:outline-none hover:shadow-md hover:-translate-y-0.5"
                >
                  <Globe className="w-4 h-4 mr-2" />
                  {t.donateSaweria || (lang === 'id' ? 'Donasi via Saweria' : 'Donate via Saweria')}
                </a>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
