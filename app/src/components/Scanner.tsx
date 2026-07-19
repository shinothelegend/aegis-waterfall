import { useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import type { EventItem } from '../hooks/useCheckpointData';

interface ScannerProps {
  events: EventItem[];
  selectedEventId: string | null;
  onSelectEvent: (eventId: string | null) => void;
  onCheckIn: (attendeeAddr: string) => void;
}

export function Scanner({ events, selectedEventId, onSelectEvent, onCheckIn }: ScannerProps) {
  const [manualAddress, setManualAddress] = useState('');

  const startScanner = () => {
    const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 }, false);
    scanner.render((decodedText: string) => {
      if (decodedText.startsWith("0x") && decodedText.length === 42) {
        onCheckIn(decodedText);
        scanner.clear();
      } else {
        alert("Invalid QR Code content. Must be an EVM address.");
      }
    }, () => {
      // silent fail
    });
  };

  return (
    <div className="glass-panel rounded-xl p-6 relative overflow-hidden group border border-white/5">
      <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-400/5 blur-xl"></div>
      <div className="flex items-center justify-between mb-4 relative z-10">
        <h3 className="font-title-md text-sm font-semibold text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-cyan-400">qr_code_scanner</span>
          Gatekeeper Scanner
        </h3>
        <div className="flex items-center gap-2 bg-[#0e0e12] px-2.5 py-0.5 rounded border border-white/10">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></div>
          <span className="font-mono text-[10px] text-slate-400 uppercase">Scanner Ready</span>
        </div>
      </div>

      <div className="relative w-full aspect-video bg-[#050505] rounded-lg border border-white/10 overflow-hidden mt-4">
        <div className="absolute inset-0 bg-[#0A0A0A] bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:10px_10px]"></div>
        <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-cyan-400"></div>
        <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-cyan-400"></div>
        <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-cyan-400"></div>
        <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-cyan-400"></div>
        <div className="scanline"></div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-24 h-24 border border-white/10 flex items-center justify-center">
            <span className="font-mono text-[9px] text-slate-600 text-center uppercase">Scan<br/>Ticket</span>
          </div>
        </div>
        <div id="reader" className="absolute inset-0 w-full h-full opacity-80"></div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex gap-2">
          <select 
            onChange={(e) => onSelectEvent(e.target.value || null)} 
            value={selectedEventId || ''}
            className="flex-1 bg-[#050505] border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="">-- Select Active Event --</option>
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </select>
          <button 
            onClick={startScanner} 
            disabled={!selectedEventId}
            className="bg-cyan-500 hover:bg-cyan-600 disabled:brightness-50 text-black px-3 rounded font-bold text-xs shrink-0 transition-all active:scale-95"
          >
            Start Cam
          </button>
        </div>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Or input Address manually (0x...)" 
            value={manualAddress}
            onChange={(e) => setManualAddress(e.target.value)}
            className="flex-1 bg-[#050505] border border-white/10 rounded px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
          />
          <button 
            onClick={() => {
              onCheckIn(manualAddress);
              setManualAddress('');
            }}
            disabled={!selectedEventId || !manualAddress.startsWith("0x")}
            className="bg-white/5 border border-white/10 text-white hover:bg-white/10 disabled:opacity-40 px-3 py-1.5 rounded font-bold text-xs transition-all"
          >
            Check In
          </button>
        </div>
      </div>
    </div>
  );
}
