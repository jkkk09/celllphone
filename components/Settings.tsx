
import React, { useRef } from 'react';
import { ChevronLeft, User, Shield, Zap, Info, Camera } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsProps {
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;
  onBack: () => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, setSettings, onBack }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setSettings({ ...settings, userAvatar: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const isBase64 = (str?: string) => str?.startsWith('data:image');

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-white">
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        onChange={handleAvatarUpload} 
        className="hidden" 
      />

      {/* Header */}
      <div className="h-16 pt-6 pb-1 px-3 bg-black/60 ios-blur flex items-center border-b border-white/10">
        <button onClick={onBack} className="p-1 text-slate-400 flex items-center gap-0.5 font-bold text-[11px] pixel-font">
          <ChevronLeft size={16} />
          <span>返回</span>
        </button>
        <div className="flex-1 text-center font-bold text-white text-[12px] pixel-font">設定</div>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
        {/* Profile Section */}
        <section className="space-y-3">
          <label className="px-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest pixel-font">我的個人檔案</label>
          
          <div className="flex flex-col items-center gap-4 py-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="relative group w-20 h-20"
            >
              <div className="w-full h-full bg-[#1a1a1a] rounded-2xl flex items-center justify-center text-3xl border border-white/10 overflow-hidden shadow-xl">
                {isBase64(settings.userAvatar) ? (
                  <img src={settings.userAvatar} className="w-full h-full object-cover" alt="avatar" />
                ) : (
                  settings.userAvatar || '👤'
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={20} className="text-white" />
              </div>
            </button>
            <div className="w-full space-y-1.5 px-3">
               <input 
                  value={settings.userName}
                  onChange={(e) => setSettings({...settings, userName: e.target.value})}
                  className="w-full text-center text-[13px] font-bold outline-none bg-transparent text-white border-b border-white/5 pb-1 focus:border-white/20 transition-colors"
                  placeholder="您的姓名"
                />
            </div>
          </div>
        </section>

        {/* AI Configuration */}
        <section className="space-y-1.5">
          <label className="px-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest pixel-font">AI 智能設定</label>
          <div className="bg-[#151515] rounded-xl overflow-hidden border border-white/5 divide-y divide-white/5">
            <div className="flex items-center gap-2.5 p-3">
              <Zap className="text-amber-500" size={16} />
              <div className="flex-1">
                <select 
                  value={settings.model}
                  onChange={(e) => setSettings({...settings, model: e.target.value})}
                  className="w-full text-[11px] text-blue-400 bg-transparent outline-none cursor-pointer"
                >
                  <option value="gemini-3-flash-preview">Flash (極速)</option>
                  <option value="gemini-3-pro-preview">Pro (進階)</option>
                </select>
              </div>
            </div>
            <div className="p-3 space-y-1.5">
              <div className="flex items-center gap-2.5">
                <Shield className="text-blue-500" size={16} />
                <span className="text-[11px] font-medium pixel-font text-slate-300">系統角色設定</span>
              </div>
              <textarea 
                value={settings.systemInstruction}
                onChange={(e) => setSettings({...settings, systemInstruction: e.target.value})}
                className="w-full h-20 bg-black/40 border border-white/5 rounded-lg p-2 text-[10px] text-slate-400 outline-none resize-none"
                placeholder="設定 AI 的性格與規則..."
              />
            </div>
          </div>
        </section>

        {/* Security Info */}
        <section className="space-y-1.5">
          <label className="px-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest pixel-font">API 安全</label>
          <div className="bg-[#151515] rounded-xl p-3 border border-white/5">
            <div className="flex items-start gap-2">
              <Info className="text-slate-500 mt-0.5" size={14} />
              <p className="text-[10px] text-slate-500 leading-tight">
                API 金鑰已透過環境變數安全管理。
              </p>
            </div>
          </div>
        </section>

        <div className="text-center pb-8 opacity-40">
          <p className="text-[8px] text-slate-500 pixel-font tracking-tighter">Gemini OS v1.1.0 PIXEL BLACK</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;