import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { X, Copy, Check, QrCode } from 'lucide-react';
import { Button } from './Button';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  surveyId: string;
}

export const ShareDialog: React.FC<ShareDialogProps> = ({ isOpen, onClose, surveyId }) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Construct the URL. Using HashRouter, so we need the hash.
  const origin = window.location.origin;
  const pathname = window.location.pathname;
  // Ensure we handle trailing slashes correctly
  const basePath = pathname.endsWith('/') ? pathname : pathname + '/';
  const surveyUrl = `${origin}${basePath}#/take/${surveyId}`;

  // QR Code API (using public API for simplicity)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(surveyUrl)}&color=2563eb`;

  const handleCopy = () => {
    navigator.clipboard.writeText(surveyUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-blue-600" />
            {t('share_title')}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-slate-500 text-sm">{t('share_desc')}</p>

          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200">
            <img 
              src={qrCodeUrl} 
              alt="Survey QR Code" 
              className="w-48 h-48 rounded-lg shadow-sm bg-white p-2"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('label_link')}</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                readOnly 
                value={surveyUrl} 
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none"
              />
              <Button onClick={handleCopy} variant={copied ? "primary" : "outline"} className="shrink-0">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? t('copied') : t('btn_copy')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
