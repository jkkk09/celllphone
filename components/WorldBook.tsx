
import React, { useState } from 'react';
import { ChevronLeft, Plus, Trash2, Search } from 'lucide-react';
import { WorldEntry } from '../types';
import { generateWorldImage } from '../services/geminiService';

const WorldBook: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [entries, setEntries] = useState<WorldEntry[]>(() => {
    const saved = localStorage.getItem('world_entries');
    return saved ? JSON.parse(saved) : [
      { id: '1', title: '新東京', category: '地點', description: '建立在舊東京廢墟之上的賽博龐克都市。', imageUrl: 'https://picsum.photos/seed/cyber/400/300' }
    ];
  });
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newEntry, setNewEntry] = useState({ title: '', category: '', description: '' });
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);

  const saveEntries = (newEntries: WorldEntry[]) => {
    setEntries(newEntries);
    localStorage.setItem('world_entries', JSON.stringify(newEntries));
  };

  const handleAdd = async () => {
    if (!newEntry.title) return;
    setIsGeneratingImg(true);
    
    const imageUrl = await generateWorldImage(newEntry.title + " " + newEntry.description);
    
    const entry: WorldEntry = {
      id: Date.now().toString(),
      ...newEntry,
      imageUrl
    };

    saveEntries([entry, ...entries]);
    setNewEntry({ title: '', category: '', description: '' });
    setIsAdding(false);
    setIsGeneratingImg(false);
  };

  const filtered = entries.filter(e => 
    e.title.toLowerCase().includes(search.toLowerCase()) || 
    e.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="h-16 pt-6 pb-1 px-3 bg-black/60 ios-blur flex items-center border-b border-white/10">
        <button onClick={onBack} className="p-1 text-slate-400 flex items-center gap-0.5 font-bold text-[11px] pixel-font">
          <ChevronLeft size={16} />
          <span>返回</span>
        </button>
        <div className="flex-1 text-center font-bold text-white text-[12px] pixel-font">世界書</div>
        <button 
          onClick={() => setIsAdding(true)}
          className="p-1 text-white"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {!isAdding ? (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜尋傳說..."
                className="w-full bg-[#1a1a1a] rounded-lg py-1.5 pl-8 pr-3 text-[11px] border border-white/10 outline-none text-white pixel-font"
              />
            </div>

            {filtered.map(entry => (
              <div key={entry.id} className="bg-[#151515] rounded-xl overflow-hidden shadow-2xl border border-white/5">
                {entry.imageUrl && (
                  <img src={entry.imageUrl} alt={entry.title} className="w-full h-24 object-cover opacity-80" />
                )}
                <div className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[8px] uppercase font-bold text-emerald-500 tracking-wider pixel-font">{entry.category}</span>
                      <h3 className="font-bold text-white text-xs pixel-font">{entry.title}</h3>
                    </div>
                    <button 
                      onClick={() => saveEntries(entries.filter(e => e.id !== entry.id))}
                      className="text-slate-600 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <p className="text-slate-400 text-[10px] mt-1 leading-snug line-clamp-3 font-medium">{entry.description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#1a1a1a] rounded-xl p-4 shadow-2xl border border-white/10 space-y-3">
            <h3 className="font-bold text-white text-xs pixel-font">新增條目</h3>
            <div className="space-y-2">
              <input 
                placeholder="標題"
                className="w-full bg-transparent border-b border-white/10 py-1 outline-none text-[11px] text-white"
                value={newEntry.title}
                onChange={e => setNewEntry({...newEntry, title: e.target.value})}
              />
              <input 
                placeholder="分類 (如：角色、地點)"
                className="w-full bg-transparent border-b border-white/10 py-1 outline-none text-[11px] text-white"
                value={newEntry.category}
                onChange={e => setNewEntry({...newEntry, category: e.target.value})}
              />
              <textarea 
                placeholder="詳細描述..."
                className="w-full bg-[#222] border border-white/5 rounded-lg p-2 outline-none text-[11px] min-h-[60px] text-white"
                value={newEntry.description}
                onChange={e => setNewEntry({...newEntry, description: e.target.value})}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button 
                onClick={() => setIsAdding(false)}
                className="flex-1 py-2 bg-[#222] text-slate-400 rounded-lg font-bold text-[11px] pixel-font"
              >
                取消
              </button>
              <button 
                onClick={handleAdd}
                disabled={isGeneratingImg}
                className="flex-1 py-2 bg-white text-black rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 pixel-font"
              >
                {isGeneratingImg ? '產生中...' : '建立'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorldBook;
