
export enum AppScreen {
  HOME = 'HOME',
  CHAT = 'CHAT',
  WORLD_BOOK = 'WORLD_BOOK',
  SETTINGS = 'SETTINGS'
}

export interface Friend {
  id: string;
  name: string;
  avatar: string; // 可以是 Emoji 或 Base64 圖片
  persona: string; // 好友的人設 (System Instruction)
  lastMessage?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  type?: 'text' | 'transfer' | 'sticker' | 'image' | 'location' | 'gift' | 'call'; 
  content: string;
  stickerUrl?: string; 
  imageUrl?: string; 
  transferData?: {
    amount: string;
    note: string;
    isReceived: boolean;
  };
  locationData?: {
    address: string;
    lat: number;
    lng: number;
  };
  giftData?: {
    item: string;
    image: string;
  };
  timestamp: number;
  friendId: string; 
}

export interface WorldEntry {
  id: string;
  title: string;
  category: string;
  description: string;
  imageUrl?: string;
}

export interface AppSettings {
  userName: string;
  userAvatar?: string; // 新增：使用者自定義頭像 (Base64)
  systemInstruction: string;
  model: string;
  theme: 'light' | 'dark';
}
