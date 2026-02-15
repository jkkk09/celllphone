
import React from 'react';
import { MessageSquare, Book, Settings, Camera, Music, Phone, Mail, Compass } from 'lucide-react';
import { AppScreen } from '../types';

interface AppIconProps {
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick: () => void;
}

const AppIcon: React.FC<AppIconProps> = ({ icon, label, color, onClick }) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center gap-1 group"
  >
    <div className={`${color} w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-[0_2px_0_rgba(0,0,0,0.5)] transition-transform active:scale-90 border border-white/10`}>
      {/* Fix: Use React.ReactElement<any> to resolve the "size does not exist in type Partial<unknown>" TypeScript error for cloned Lucide icons */}
      {React.cloneElement(icon as React.ReactElement<any>, { size: 20, strokeWidth: 2.5 })}
    </div>
    <span className="text-white text-[9px] font-bold pixel-font opacity-90 truncate w-full px-0.5">{label}</span>
  </button>
);

interface HomeScreenProps {
  onOpenApp: (app: AppScreen) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onOpenApp }) => {
  return (
    <div className="w-full h-full bg-[#121212] relative flex flex-col pt-10 px-3 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-full h-full bg-gradient-radial from-blue-500 to-transparent blur-3xl"></div>
      </div>

      {/* App Grid */}
      <div className="grid grid-cols-4 gap-y-5 z-10">
        <AppIcon 
          icon={<MessageSquare />} 
          label="聊天" 
          color="bg-[#1a1a1a]" 
          onClick={() => onOpenApp(AppScreen.CHAT)} 
        />
        <AppIcon 
          icon={<Book />} 
          label="世界書" 
          color="bg-[#1a1a1a]" 
          onClick={() => onOpenApp(AppScreen.WORLD_BOOK)} 
        />
        <AppIcon 
          icon={<Settings />} 
          label="設定" 
          color="bg-[#1a1a1a]" 
          onClick={() => onOpenApp(AppScreen.SETTINGS)} 
        />
        <AppIcon icon={<Camera />} label="相機" color="bg-[#1a1a1a]" onClick={() => {}} />
        <AppIcon icon={<Music />} label="音樂" color="bg-[#1a1a1a]" onClick={() => {}} />
        <AppIcon icon={<Phone />} label="電話" color="bg-[#1a1a1a]" onClick={() => {}} />
        <AppIcon icon={<Mail />} label="郵件" color="bg-[#1a1a1a]" onClick={() => {}} />
        <AppIcon icon={<Compass />} label="瀏覽器" color="bg-[#1a1a1a]" onClick={() => {}} />
      </div>

      {/* Dock Area */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] h-14 bg-black/40 ios-blur rounded-2xl flex items-center justify-around px-1 border border-white/5 shadow-2xl">
         <div className="bg-[#222] w-9 h-9 rounded-lg flex items-center justify-center text-green-500 border border-white/5"><Phone size={18} /></div>
         <div className="bg-[#222] w-9 h-9 rounded-lg flex items-center justify-center text-blue-400 border border-white/5"><Compass size={18} /></div>
         <div className="bg-[#222] w-9 h-9 rounded-lg flex items-center justify-center text-white border border-white/5"><Mail size={18} /></div>
         <div className="bg-white/10 w-9 h-9 rounded-lg flex items-center justify-center text-white border border-white/20" onClick={() => onOpenApp(AppScreen.CHAT)}><MessageSquare size={18} /></div>
      </div>
    </div>
  );
};

export default HomeScreen;
