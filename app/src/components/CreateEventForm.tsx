import { useState } from 'react';

interface CreateEventFormProps {
  onCreateEvent: (title: string, desc: string, price: string, date: string, location: string, duration: string) => void;
}

export function CreateEventForm({ onCreateEvent }: CreateEventFormProps) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('10');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [duration, setDuration] = useState('2');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateEvent(title, desc, price, date, location, duration);
    setTitle('');
    setDesc('');
    setLocation('');
  };

  return (
    <div className="glass-panel rounded-xl p-6 border border-white/10 relative">
      <h3 className="font-title-md text-sm font-semibold text-white flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-purple-400">add_box</span>
        Deploy Escrow Event
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-3 text-xs">
        <div>
          <label className="block text-[9px] text-slate-500 font-bold mb-1 tracking-wider uppercase">Event Title</label>
          <input 
            type="text" 
            placeholder="e.g. ETHGlobal Neo-Tokyo" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-[#050505] border border-white/10 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
            required
          />
        </div>
        <div>
          <label className="block text-[9px] text-slate-500 font-bold mb-1 tracking-wider uppercase">Description</label>
          <textarea 
            placeholder="Escrow parameters and venue info..." 
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={2}
            className="w-full bg-[#050505] border border-white/10 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[9px] text-slate-500 font-bold mb-1 tracking-wider uppercase">Deposit (USDC)</label>
            <input 
              type="number" 
              placeholder="50" 
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-[#050505] border border-white/10 rounded px-3 py-2 text-slate-200 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-[9px] text-slate-500 font-bold mb-1 tracking-wider uppercase">Hours Duration</label>
            <input 
              type="number" 
              placeholder="2" 
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full bg-[#050505] border border-white/10 rounded px-3 py-2 text-slate-200 focus:outline-none"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-[9px] text-slate-500 font-bold mb-1 tracking-wider uppercase">Start Date & Time</label>
          <input 
            type="datetime-local" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-[#050505] border border-white/10 rounded px-3 py-2 text-slate-400 focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-[9px] text-slate-500 font-bold mb-1 tracking-wider uppercase">Location</label>
          <input 
            type="text" 
            placeholder="e.g. Roppongi Hills, Tokyo" 
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full bg-[#050505] border border-white/10 rounded px-3 py-2 text-slate-200 focus:outline-none"
            required
          />
        </div>
        <button 
          type="submit"
          className="w-full mt-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:brightness-110 text-black font-bold py-2.5 rounded transition shadow-lg active:scale-95"
        >
          Deploy Escrow
        </button>
      </form>
    </div>
  );
}
