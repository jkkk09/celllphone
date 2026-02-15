
import React from 'react';
import { Battery, Wifi, Signal } from 'lucide-react';

interface PhoneFrameProps {
  children: React.ReactNode;
  onHomePress: () => void;
}

const PhoneFrame: React.FC<PhoneFrameProps> = ({ children, onHomePress }) => {
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="relative w-[260px] h-[540px] bg-black rounded-[2.5rem] p-1.5 shadow-2xl border-[6px] border-slate-800 overflow-hidden ring-1 ring-slate-400">
      {/* Top Status Bar Area */}
      <div className="absolute top-0 left-0 right-0 h-8 flex justify-between items-center px-5 z-50 text-white font-medium text-[10px]">
        <div className="w-1/4">{formattedTime}</div>
        
        {/* Dynamic Island / Notch */}
        <div className="w-[70px] h-4 bg-black rounded-full flex items-center justify-center gap-1">
           <div className="w-1 h-1 rounded-full bg-slate-800"></div>
           <div className="w-2.5 h-0.5 rounded-full bg-slate-800"></div>
        </div>

        <div className="w-1/4 flex justify-end gap-1">
          <Signal size={10} />
          <Wifi size={10} />
          <Battery size={10} />
        </div>
      </div>

      {/* Main Screen Content */}
      <div className="relative w-full h-full rounded-[1.8rem] overflow-hidden bg-white">
        {children}
      </div>

      {/* Home Indicator */}
      <div 
        className="absolute bottom-1 left-1/2 -translate-x-1/2 w-20 h-1 bg-slate-400/50 rounded-full cursor-pointer hover:bg-slate-300 transition-colors z-50"
        onClick={onHomePress}
      />
    </div>
  );
};

export default PhoneFrame;
