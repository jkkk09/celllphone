
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, Send, Plus, UserPlus, X, Smile, MoreHorizontal, 
  Camera, CheckCheck, ChevronRight, MapPin, Phone, Gift, Image as ImageIcon,
  MessageSquare, Users, Compass, User, CreditCard, Wallet, Heart
} from 'lucide-react';
import { Message, AppSettings, Friend } from '../types';
import { createChatSession, sendMessageStreaming } from '../services/geminiService';

// --- 標準單色功能圖示組件 ---

const ActionIconWrapper = ({ icon: Icon, color, label, onClick }: { icon: any, color: string, label: string, onClick: () => void }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-1.5 group">
    <div className={`w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm active:bg-gray-100 transition-colors`}>
      <Icon size={26} className={color} strokeWidth={1.5} />
    </div>
    <span className="text-[11px] text-slate-500 font-medium">{label}</span>
  </button>
);

// --- 元件主體 ---

interface ChatAppProps {
  settings: AppSettings;
  onBack: () => void;
}

type MainTab = 'CHATS' | 'CONTACTS' | 'DISCOVER' | 'ME';
type AppView = 'MAIN' | 'CONVERSATION' | 'ADD_FRIEND';

const ChatApp: React.FC<ChatAppProps> = ({ settings, onBack }) => {
  const [view, setView] = useState<AppView>('MAIN');
  const [activeTab, setActiveTab] = useState<MainTab>('CHATS');
  const [activeFriendId, setActiveFriendId] = useState<string | null>(null);
  
  const [friends, setFriends] = useState<Friend[]>(() => {
    const saved = localStorage.getItem('gemini_friends');
    return saved ? JSON.parse(saved) : [
      { id: 'default', name: 'Gemini AI', avatar: '✨', persona: settings.systemInstruction }
    ];
  });
  
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('gemini_messages');
    return saved ? JSON.parse(saved) : [];
  });

  // 追蹤已開啟過的聊天室 ID，確保退出後聊天列表依然存在該好友
  const [activeChatIds, setActiveChatIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('gemini_active_chats');
    return saved ? JSON.parse(saved) : ['default'];
  });

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [newFriend, setNewFriend] = useState({ name: '', avatar: '👤', persona: '' });
  
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showStickerPanel, setShowStickerPanel] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showFriendDetail, setShowFriendDetail] = useState(false);
  
  const [customStickers, setCustomStickers] = useState<string[]>(() => {
    const saved = localStorage.getItem('gemini_custom_stickers');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNote, setTransferNote] = useState('轉帳給您');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatSessionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const friendAvatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('gemini_friends', JSON.stringify(friends));
  }, [friends]);

  useEffect(() => {
    localStorage.setItem('gemini_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('gemini_active_chats', JSON.stringify(activeChatIds));
  }, [activeChatIds]);

  useEffect(() => {
    localStorage.setItem('gemini_custom_stickers', JSON.stringify(customStickers));
  }, [customStickers]);

  useEffect(() => {
    if (view === 'CONVERSATION' && activeFriendId) {
      const friend = friends.find(f => f.id === activeFriendId);
      if (friend) {
        chatSessionRef.current = createChatSession(friend.persona, settings.model);
        // 進入聊天室即標記為活躍聊天室
        if (!activeChatIds.includes(activeFriendId)) {
          setActiveChatIds(prev => [...prev, activeFriendId]);
        }
      }
    }
  }, [view, activeFriendId, settings.model, friends]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, view]);

  const activeFriend = useMemo(() => friends.find(f => f.id === activeFriendId), [friends, activeFriendId]);
  const currentMessages = useMemo(() => messages.filter(m => m.friendId === activeFriendId), [messages, activeFriendId]);

  // 聊天列表：包含有訊息的聊天室，以及點擊開啟過/新創建好友的聊天室
  const chatList = useMemo(() => {
    return friends.filter(f => activeChatIds.includes(f.id));
  }, [friends, activeChatIds]);

  const isBase64 = (str?: string) => str?.startsWith('data:image');

  const handleAddFriend = () => {
    if (!newFriend.name.trim()) return;
    const friendId = Date.now().toString();
    const friend: Friend = {
      id: friendId,
      name: newFriend.name,
      avatar: newFriend.avatar,
      persona: newFriend.persona || settings.systemInstruction
    };
    setFriends(prev => [...prev, friend]);
    // 創建好友後自動加入聊天列表清單
    setActiveChatIds(prev => [...prev, friendId]);
    setNewFriend({ name: '', avatar: '👤', persona: '' });
    setView('MAIN');
    setActiveTab('CHATS'); // 自動跳轉到聊天列表
  };

  const updateFriendData = (id: string, updates: Partial<Friend>) => {
    setFriends(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handleSend = async (customContent?: string, type: 'text' | 'transfer' | 'sticker' | 'image' | 'location' | 'gift' | 'call' = 'text', data?: any) => {
    const textToSend = customContent || input;
    if (!textToSend.trim() && type === 'text') return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      type,
      content: textToSend,
      stickerUrl: type === 'sticker' ? data?.url : undefined,
      imageUrl: type === 'image' ? data?.url : undefined,
      transferData: type === 'transfer' ? data : undefined,
      locationData: type === 'location' ? data : undefined,
      giftData: type === 'gift' ? data : undefined,
      timestamp: Date.now(),
      friendId: activeFriendId!
    };

    setMessages(prev => [...prev, userMessage]);
    if (type === 'text') setInput('');
    setIsTyping(true);

    const modelMessageId = (Date.now() + 1).toString();
    const initialModelMessage: Message = {
      id: modelMessageId,
      role: 'model',
      content: '',
      timestamp: Date.now(),
      friendId: activeFriendId!
    };
    
    setMessages(prev => [...prev, initialModelMessage]);

    try {
      let fullResponse = '';
      let prompt = userMessage.content;
      let imageToPass = type === 'image' ? data?.url : undefined;
      
      if (type === 'transfer') {
        prompt = `我剛剛轉帳了 ¥${data.amount} 給你，備註是：${data.note}。請查收。`;
      } else if (type === 'location') {
        prompt = `我分享了我的位置：${data.address}。`;
      } else if (type === 'gift') {
        prompt = `我送了你一份禮物：${data.item}。`;
      } else if (type === 'call') {
        prompt = `我撥打了一通語音電話給你。`;
      }
        
      const stream = sendMessageStreaming(chatSessionRef.current, prompt, imageToPass, settings.model);
      
      for await (const chunk of stream) {
        fullResponse += chunk;
        setMessages(prev => prev.map(m => 
          m.id === modelMessageId ? { ...m, content: fullResponse } : m
        ));
      }
    } catch (error) {
      setMessages(prev => prev.map(m => 
        m.id === modelMessageId ? { ...m, content: "發送失敗，請重試。" } : m
      ));
    } finally {
      setIsTyping(false);
    }
  };

  const handleTransferSubmit = () => {
    if (!transferAmount || isNaN(Number(transferAmount))) return;
    handleSend(`轉帳 ¥${transferAmount}`, 'transfer', {
      amount: transferAmount,
      note: transferNote,
      isReceived: false
    });
    setShowTransferModal(false);
    setTransferAmount('');
    setTransferNote('轉帳給您');
  };

  const handleLocationSend = () => {
    const mockLocation = {
      address: "台北市信義區 101 大樓",
      lat: 25.0339,
      lng: 121.5644
    };
    handleSend(`[位置] ${mockLocation.address}`, 'location', mockLocation);
    setShowActionMenu(false);
  };

  const handleGiftSend = () => {
    const gifts = [
      { item: "咖啡券", image: "☕" },
      { item: "電影票", image: "🎟️" },
      { item: "生日蛋糕", image: "🎂" },
      { item: "紅包", image: "🧧" }
    ];
    const randomGift = gifts[Math.floor(Math.random() * gifts.length)];
    handleSend(`[禮物] ${randomGift.item}`, 'gift', randomGift);
    setShowActionMenu(false);
  };

  const handleCallSend = () => {
    handleSend("語音通話", 'call');
    setShowActionMenu(false);
  };

  const handleStickerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setCustomStickers(prev => [reader.result as string, ...prev]);
    };
    reader.readAsDataURL(file);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      handleSend('發送了圖片', 'image', { url: reader.result as string });
      setShowActionMenu(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFriendAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeFriendId) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      updateFriendData(activeFriendId, { avatar: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const deleteFriend = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFriends(prev => prev.filter(f => f.id !== id));
    setMessages(prev => prev.filter(m => m.friendId !== id));
    setActiveChatIds(prev => prev.filter(cid => cid !== id));
    if (activeFriendId === id) setView('MAIN');
  };

  const renderTransferBubble = (msg: Message) => (
    <div className={`flex flex-col w-52 rounded-2xl overflow-hidden shadow-sm border border-slate-400 bg-slate-800`}>
      <div className="p-3 flex items-start gap-3">
        <div className="bg-white/20 p-2 rounded-full"><CreditCard color="white" size={20} /></div>
        <div className="flex flex-col">
          <span className="text-white text-[13px] font-bold">¥{msg.transferData?.amount}</span>
          <span className="text-white/80 text-[10px] truncate">{msg.transferData?.note}</span>
        </div>
      </div>
      <div className="bg-black/20 px-3 py-1 flex justify-between items-center">
        <span className="text-white/60 text-[8px] font-medium">轉帳訊息</span>
        {msg.role === 'user' && (
          <div className="flex items-center gap-1 opacity-60">
            <span className="text-[7px] text-white">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
            </span>
            <CheckCheck size={10} className="text-white" />
          </div>
        )}
      </div>
    </div>
  );

  const renderLocationBubble = (msg: Message) => (
    <div className="flex flex-col w-52 rounded-2xl overflow-hidden shadow-sm border border-gray-200 bg-white">
      <div className="h-24 bg-slate-50 flex items-center justify-center relative overflow-hidden">
        <MapPin size={28} className="text-slate-800 z-10" />
      </div>
      <div className="p-2 bg-white">
        <div className="text-[11px] font-bold text-slate-800 truncate">{msg.locationData?.address}</div>
        <div className="text-[9px] text-slate-400">位置分享</div>
      </div>
    </div>
  );

  const renderGiftBubble = (msg: Message) => (
    <div className="flex flex-col w-44 rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-slate-50 p-3 items-center text-center space-y-2">
      <div className="text-3xl grayscale">{msg.giftData?.image}</div>
      <div className="text-[12px] font-bold text-slate-700">{msg.giftData?.item}</div>
      <div className="text-[9px] text-slate-400">收到了一份禮物</div>
    </div>
  );

  const renderCallBubble = (msg: Message) => (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl shadow-sm text-[12px] ${msg.role === 'user' ? 'bg-black text-white' : 'bg-white text-black border border-gray-200'}`}>
      <Phone size={14} className={msg.role === 'user' ? 'text-white' : 'text-slate-600'} />
      <span className="font-medium">語音通話 (已結束)</span>
      {msg.role === 'user' && (
        <div className="flex items-center gap-0.5 ml-1 opacity-50 scale-75">
          <span className="text-[8px]">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
          <CheckCheck size={10} />
        </div>
      )}
    </div>
  );

  const renderAvatar = (avatar: string, size = "w-10 h-10") => (
    <div className={`${size} rounded-md bg-gray-200 border border-black/5 flex items-center justify-center text-sm shrink-0 overflow-hidden`}>
      {isBase64(avatar) ? (
        <img src={avatar} className="w-full h-full object-cover grayscale" alt="avatar" />
      ) : (
        <span className="grayscale">{avatar}</span>
      )}
    </div>
  );

  const getPageTitle = () => {
    if (view === 'CONVERSATION') return activeFriend?.name;
    if (view === 'ADD_FRIEND') return '添加朋友';
    switch (activeTab) {
      case 'CHATS': return '聊天';
      case 'CONTACTS': return '通訊錄';
      case 'DISCOVER': return '發現';
      case 'ME': return '我';
      default: return '聊天';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f0f0f0] text-slate-900 relative font-sans">
      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleStickerUpload} className="hidden" />
      <input type="file" accept="image/*" ref={imageInputRef} onChange={handleImageSelect} className="hidden" />
      <input type="file" accept="image/*" ref={friendAvatarInputRef} onChange={handleFriendAvatarUpload} className="hidden" />

      {/* Header */}
      <div className="h-16 pt-6 pb-1 px-3 bg-[#f0f0f0] flex items-center border-b border-gray-200 z-50">
        <div className="w-10">
          {(view === 'CONVERSATION' || view === 'ADD_FRIEND') ? (
            <button onClick={() => setView('MAIN')} className="p-1 text-slate-700 flex items-center">
              <ChevronLeft size={22} />
            </button>
          ) : (
            <button onClick={onBack} className="p-1 text-slate-400">
              <ChevronLeft size={20} />
            </button>
          )}
        </div>
        <div className="flex-1 text-center font-bold text-slate-900 text-[15px]">{getPageTitle()}</div>
        <div className="w-10 flex justify-end">
          {view === 'MAIN' && activeTab === 'CONTACTS' ? (
            <button onClick={() => setView('ADD_FRIEND')} className="text-slate-800"><UserPlus size={20} /></button>
          ) : view === 'CONVERSATION' ? (
            <button onClick={() => setShowFriendDetail(true)} className="text-slate-800"><MoreHorizontal size={20} /></button>
          ) : view === 'MAIN' && activeTab === 'CHATS' ? (
             <button className="text-slate-800"><Plus size={20} /></button>
          ) : null}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {view === 'MAIN' && activeTab === 'CHATS' && (
          <div className="divide-y divide-gray-100 bg-white min-h-full">
            {chatList.length === 0 && (
              <div className="text-center py-20 text-slate-300 text-xs font-medium">暫無聊天</div>
            )}
            {chatList.map(friend => {
               const friendMessages = messages.filter(m => m.friendId === friend.id);
               const lastMsg = friendMessages[friendMessages.length - 1];
               return (
                <div 
                  key={friend.id}
                  onClick={() => { setActiveFriendId(friend.id); setView('CONVERSATION'); }}
                  className="p-3 flex items-center gap-3 active:bg-gray-100 transition-colors cursor-pointer"
                >
                  {renderAvatar(friend.avatar, "w-12 h-12")}
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="font-bold text-[14px] text-slate-900">{friend.name}</span>
                      {lastMsg && (
                        <span className="text-[10px] text-slate-400">
                           {new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </span>
                      )}
                    </div>
                    <div className="text-[12px] text-slate-400 truncate">
                      {lastMsg ? lastMsg.content : "開始聊天吧"}
                    </div>
                  </div>
                </div>
               );
            })}
          </div>
        )}

        {view === 'MAIN' && activeTab === 'CONTACTS' && (
          <div className="space-y-4">
            <div className="bg-white divide-y divide-gray-100">
              <div onClick={() => setView('ADD_FRIEND')} className="p-3 flex items-center gap-3 active:bg-gray-100 cursor-pointer">
                <div className="w-10 h-10 bg-slate-700 rounded-md flex items-center justify-center text-white">
                  <UserPlus size={20} />
                </div>
                <span className="text-sm font-medium">新的朋友</span>
              </div>
              <div className="p-3 flex items-center gap-3 active:bg-gray-100 cursor-pointer">
                <div className="w-10 h-10 bg-slate-800 rounded-md flex items-center justify-center text-white">
                  <Users size={20} />
                </div>
                <span className="text-sm font-medium">群聊</span>
              </div>
            </div>
            <div className="bg-white divide-y divide-gray-100">
              {friends.map(friend => (
                <div 
                  key={friend.id}
                  onClick={() => { setActiveFriendId(friend.id); setView('CONVERSATION'); }}
                  className="p-3 flex items-center gap-3 active:bg-gray-100 cursor-pointer"
                >
                  {renderAvatar(friend.avatar, "w-10 h-10")}
                  <span className="text-sm font-medium">{friend.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'MAIN' && activeTab === 'DISCOVER' && (
          <div className="space-y-4 pt-2">
            <div className="bg-white p-3 flex items-center justify-between active:bg-gray-100 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="text-slate-800"><Compass size={22} /></div>
                <span className="text-sm font-medium">朋友圈</span>
              </div>
              <ChevronRight size={16} className="text-gray-300" />
            </div>
            <div className="bg-white p-3 flex items-center justify-between active:bg-gray-100 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="text-slate-600"><Send size={20} /></div>
                <span className="text-sm font-medium">看一看</span>
              </div>
              <ChevronRight size={16} className="text-gray-300" />
            </div>
          </div>
        )}

        {view === 'MAIN' && activeTab === 'ME' && (
          <div className="space-y-4">
            <div className="bg-white p-4 flex items-center gap-4 active:bg-gray-100 cursor-pointer">
              {renderAvatar(settings.userAvatar || '👤', "w-16 h-16")}
              <div className="flex-1">
                <div className="font-bold text-lg mb-1">{settings.userName}</div>
                <div className="text-[12px] text-slate-400">微訊號: user_01</div>
              </div>
              <ChevronRight size={20} className="text-gray-300" />
            </div>
            <div className="bg-white divide-y divide-gray-100">
               <div className="p-3 flex items-center justify-between active:bg-gray-100 cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="text-slate-700"><Heart size={20} /></div>
                  <span className="text-sm">我的收藏</span>
                </div>
                <ChevronRight size={16} className="text-gray-300" />
              </div>
              <div className="p-3 flex items-center justify-between active:bg-gray-100 cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="text-slate-900"><Wallet size={20} /></div>
                  <span className="text-sm">我的錢包</span>
                </div>
                <ChevronRight size={16} className="text-gray-300" />
              </div>
            </div>
          </div>
        )}

        {view === 'CONVERSATION' && (
          <div ref={scrollRef} className="flex-1 h-full px-3 py-4 space-y-4 pb-24 bg-white min-h-full">
            {currentMessages.length === 0 && (
              <div className="text-center py-10 text-slate-300 text-[12px] font-medium">暫無訊息</div>
            )}
            {currentMessages.map((msg) => (
              <div key={msg.id} className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {renderAvatar(msg.role === 'user' ? settings.userAvatar || '👤' : activeFriend?.avatar || '✨')}
                
                {msg.type === 'transfer' ? renderTransferBubble(msg) :
                 msg.type === 'location' ? renderLocationBubble(msg) :
                 msg.type === 'gift' ? renderGiftBubble(msg) :
                 msg.type === 'call' ? renderCallBubble(msg) :
                 msg.type === 'sticker' ? (
                   <div className="max-w-[120px] rounded-lg overflow-hidden p-1 grayscale">
                     <img src={msg.stickerUrl} alt="Sticker" className="w-full h-auto" />
                   </div>
                 ) : msg.type === 'image' ? (
                   <div className="max-w-[70%] rounded-lg overflow-hidden shadow-sm relative border border-black/5 bg-white p-1 grayscale">
                     <img src={msg.imageUrl} className="w-full h-auto rounded-md" alt="Sent" />
                   </div>
                 ) : (
                   <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed relative shadow-sm ${
                     msg.role === 'user' 
                       ? 'bg-black text-white' 
                       : 'bg-white text-black border border-gray-200'
                   }`}>
                     <div className="break-words inline">{msg.content || (msg.role === 'model' && isTyping && "正在輸入...")}</div>
                     {msg.role === 'user' && (
                       <span className="inline-flex items-center gap-1 ml-2 opacity-50 select-none align-bottom translate-y-0.5 whitespace-nowrap">
                         <span className="text-[9px] leading-none">
                           {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                         </span>
                         <CheckCheck size={12} className="text-white" />
                       </span>
                     )}
                   </div>
                 )}
              </div>
            ))}
          </div>
        )}

        {view === 'ADD_FRIEND' && (
          <div className="p-4 space-y-4 bg-white min-h-full">
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center text-4xl border border-gray-100 shadow-inner overflow-hidden grayscale">
                {newFriend.avatar}
              </div>
              <div className="flex gap-3 grayscale">
                {['👤', '🧑', '👩', '🤖', '🦊', '🐶'].map(emoji => (
                  <button key={emoji} onClick={() => setNewFriend({...newFriend, avatar: emoji})} className={`text-xl p-2 rounded-lg transition-all ${newFriend.avatar === emoji ? 'bg-gray-100 scale-110' : 'opacity-40'}`}>{emoji}</button>
                ))}
              </div>
            </div>
            <input value={newFriend.name} onChange={e => setNewFriend({...newFriend, name: e.target.value})} placeholder="朋友名稱..." className="w-full bg-[#f7f7f7] rounded-xl p-3 text-[14px] outline-none text-slate-900 border border-gray-100" />
            <textarea value={newFriend.persona} onChange={e => setNewFriend({...newFriend, persona: e.target.value})} placeholder="設定角色性格..." className="w-full h-32 bg-[#f7f7f7] rounded-xl p-3 text-[14px] outline-none text-slate-900 border border-gray-100 resize-none" />
            <button onClick={handleAddFriend} disabled={!newFriend.name} className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold text-[14px]">添加朋友</button>
          </div>
        )}
      </div>

      {/* Input Bar & + Menu */}
      {view === 'CONVERSATION' && (
        <div className="bg-[#f7f7f7] border-t border-gray-200 pb-8 px-1">
          <div className="p-2 flex items-end gap-2">
            <button className="p-1.5 text-slate-600 mb-0.5"><Phone size={24} strokeWidth={1.5} /></button>
            <div className="flex-1 min-h-[36px] bg-white rounded-md px-3 py-1.5 border border-gray-200 flex items-center">
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} onFocus={() => { setShowStickerPanel(false); setShowActionMenu(false); }} placeholder="輸入訊息..." className="w-full bg-transparent outline-none text-[14px]" />
            </div>
            <button onClick={() => { setShowStickerPanel(!showStickerPanel); setShowActionMenu(false); }} className="p-1.5 text-slate-600 mb-0.5"><Smile size={24} strokeWidth={1.5} /></button>
            {input.trim() ? (
               <button onClick={() => handleSend()} className="p-1.5 px-3 rounded bg-slate-800 text-white font-bold text-[13px] mb-0.5">發送</button>
            ) : (
               <button onClick={() => { setShowActionMenu(!showActionMenu); setShowStickerPanel(false); }} className="p-1.5 text-slate-600 mb-0.5">
                <Plus size={24} className={showActionMenu ? 'rotate-45 transition-transform' : 'transition-transform'} strokeWidth={1.5} />
               </button>
            )}
          </div>

          {(showActionMenu || showStickerPanel) && (
            <div className="h-48 bg-[#f7f7f7] border-t border-gray-200 p-4 animate-in slide-in-from-bottom-2">
              {showActionMenu && (
                <div className="grid grid-cols-4 gap-y-6">
                  <ActionIconWrapper icon={ImageIcon} color="text-slate-800" label="照片" onClick={() => imageInputRef.current?.click()} />
                  <ActionIconWrapper icon={CreditCard} color="text-slate-800" label="轉帳" onClick={() => { setShowTransferModal(true); setShowActionMenu(false); }} />
                  <ActionIconWrapper icon={MapPin} color="text-slate-800" label="位置" onClick={handleLocationSend} />
                  <ActionIconWrapper icon={Phone} color="text-slate-800" label="語音通話" onClick={handleCallSend} />
                  <ActionIconWrapper icon={Gift} color="text-slate-800" label="禮物" onClick={handleGiftSend} />
                </div>
              )}
              {showStickerPanel && (
                <div className="grid grid-cols-4 gap-3 h-full overflow-y-auto custom-scrollbar grayscale">
                   <button onClick={() => fileInputRef.current?.click()} className="aspect-square bg-white rounded-xl flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-gray-200"><Plus size={24} /><span className="text-[10px] font-bold mt-1">添加</span></button>
                   {customStickers.map((url, idx) => (
                    <button key={idx} onClick={() => handleSend('發送了貼圖', 'sticker', { url })} className="aspect-square bg-white rounded-xl overflow-hidden p-1"><img src={url} className="w-full h-full object-contain" alt="sticker" /></button>
                   ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bottom Navigation */}
      {view === 'MAIN' && (
        <div className="h-14 bg-[#f7f7f7] border-t border-gray-200 flex items-center justify-around pb-1">
          <button onClick={() => setActiveTab('CHATS')} className={`flex flex-col items-center gap-0.5 ${activeTab === 'CHATS' ? 'text-slate-900' : 'text-slate-400'}`}>
            <MessageSquare size={24} strokeWidth={activeTab === 'CHATS' ? 2 : 1.5} />
            <span className="text-[10px] font-medium">聊天</span>
          </button>
          <button onClick={() => setActiveTab('CONTACTS')} className={`flex flex-col items-center gap-0.5 ${activeTab === 'CONTACTS' ? 'text-slate-900' : 'text-slate-400'}`}>
            <Users size={24} strokeWidth={activeTab === 'CONTACTS' ? 2 : 1.5} />
            <span className="text-[10px] font-medium">通訊錄</span>
          </button>
          <button onClick={() => setActiveTab('DISCOVER')} className={`flex flex-col items-center gap-0.5 ${activeTab === 'DISCOVER' ? 'text-slate-900' : 'text-slate-400'}`}>
            <Compass size={24} strokeWidth={activeTab === 'DISCOVER' ? 2 : 1.5} />
            <span className="text-[10px] font-medium">發現</span>
          </button>
          <button onClick={() => setActiveTab('ME')} className={`flex flex-col items-center gap-0.5 ${activeTab === 'ME' ? 'text-slate-900' : 'text-slate-400'}`}>
            <User size={24} strokeWidth={activeTab === 'ME' ? 2 : 1.5} />
            <span className="text-[10px] font-medium">我</span>
          </button>
        </div>
      )}

      {/* Modals */}
      {showFriendDetail && activeFriend && (
        <div className="absolute inset-0 z-[110] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-[240px] rounded-2xl p-5 space-y-5 animate-in slide-in-from-top-4 shadow-2xl">
            <div className="flex justify-between items-center"><h3 className="text-[15px] font-bold text-slate-800">詳細資料</h3><button onClick={() => setShowFriendDetail(false)}><X size={18} /></button></div>
            <div className="flex flex-col items-center gap-4">
              <button onClick={() => friendAvatarInputRef.current?.click()} className="relative w-20 h-20 shadow-inner">
                <div className="w-full h-full bg-gray-50 rounded-2xl flex items-center justify-center text-3xl border border-gray-100 overflow-hidden grayscale">
                  {isBase64(activeFriend.avatar) ? <img src={activeFriend.avatar} className="w-full h-full object-cover" alt="f-avatar" /> : activeFriend.avatar}
                </div>
              </button>
              <input value={activeFriend.name} onChange={(e) => updateFriendData(activeFriendId!, { name: e.target.value })} className="w-full bg-[#f7f7f7] rounded-lg p-2 text-[13px] font-bold outline-none text-center border border-gray-100" />
              <button onClick={() => setShowFriendDetail(false)} className="w-full py-2.5 bg-slate-800 text-white rounded-lg font-bold text-[14px] shadow-sm">保存修改</button>
              <button onClick={(e) => { deleteFriend(activeFriendId!, e as any); setShowFriendDetail(false); }} className="w-full py-1.5 text-red-700 text-[11px] font-medium">刪除朋友</button>
            </div>
          </div>
        </div>
      )}

      {showTransferModal && (
        <div className="absolute inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white w-full rounded-2xl p-5 space-y-4 shadow-2xl max-w-[260px]">
            <div className="flex justify-between items-center"><h3 className="text-[15px] font-bold text-slate-800">轉帳給 {activeFriend?.name}</h3><button onClick={() => setShowTransferModal(false)}><X size={18} /></button></div>
            <div className="space-y-4 text-center">
              <input type="number" value={transferAmount} onChange={e => setTransferAmount(e.target.value)} placeholder="0.00" className="w-full text-3xl font-bold text-slate-900 outline-none text-center bg-transparent py-2 border-b border-gray-100" />
              <input value={transferNote} onChange={e => setTransferNote(e.target.value)} placeholder="備註..." className="w-full bg-[#f7f7f7] rounded-xl p-3 text-[13px] outline-none border border-gray-100" />
              <button onClick={handleTransferSubmit} disabled={!transferAmount} className="w-full py-3.5 bg-slate-800 text-white rounded-xl font-bold shadow-md active:scale-95 transition-transform">確認轉帳</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatApp;
