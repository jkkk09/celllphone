
import React, { useState, useEffect } from 'react';
import { AppScreen, AppSettings } from './types';
import PhoneFrame from './components/PhoneFrame';
import HomeScreen from './components/HomeScreen';
import ChatApp from './components/ChatApp';
import WorldBook from './components/WorldBook';
import Settings from './components/Settings';

const DEFAULT_SETTINGS: AppSettings = {
  userName: '我',
  userAvatar: '👤', // 預設使用 Emoji
  systemInstruction: '你是一個友善且聰明的 AI 助手，住在這台未來的智慧型手機裡。',
  model: 'gemini-3-flash-preview',
  theme: 'dark',
};

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(AppScreen.HOME);
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('gemini_os_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('gemini_os_settings', JSON.stringify(settings));
  }, [settings]);

  const renderScreen = () => {
    switch (currentScreen) {
      case AppScreen.CHAT:
        return <ChatApp settings={settings} onBack={() => setCurrentScreen(AppScreen.HOME)} />;
      case AppScreen.WORLD_BOOK:
        return <WorldBook onBack={() => setCurrentScreen(AppScreen.HOME)} />;
      case AppScreen.SETTINGS:
        return <Settings settings={settings} setSettings={setSettings} onBack={() => setCurrentScreen(AppScreen.HOME)} />;
      case AppScreen.HOME:
      default:
        return <HomeScreen onOpenApp={(app) => setCurrentScreen(app)} />;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-200">
      <PhoneFrame onHomePress={() => setCurrentScreen(AppScreen.HOME)}>
        {renderScreen()}
      </PhoneFrame>
    </div>
  );
};

export default App;