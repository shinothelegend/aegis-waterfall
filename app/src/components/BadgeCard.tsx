import type { BadgeItem } from '../hooks/useCheckpointData';

interface BadgeCardProps {
  badge: BadgeItem;
  onClick: () => void;
}

export function BadgeCard({ badge, onClick }: BadgeCardProps) {
  return (
    <div 
      onClick={onClick}
      className="bg-[#070b16]/90 border border-white/5 rounded-xl p-4 flex flex-col items-center gap-3 hover:border-cyan-500/30 transition-all duration-300 group cursor-pointer hover:shadow-[0_0_15px_rgba(6,182,212,0.08)] hover:-translate-y-0.5 active:scale-98"
    >
      <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center p-3 group-hover:border-cyan-500/20 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all duration-300 overflow-hidden">
        <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: badge.svg }} />
      </div>
      <div className="text-center w-full">
        <h4 className="font-display text-xs font-bold text-white truncate">{badge.name}</h4>
        <p className="font-mono text-[9px] text-cyan-400 mt-1 uppercase tracking-wider">SBT #{badge.tokenId}</p>
        
        <div className="mt-3 pt-3 border-t border-white/5 text-[9px] text-slate-500 text-left space-y-1">
          {badge.attributes.map((attr, idx) => (
            <div key={idx} className="flex justify-between items-center">
              <span className="font-mono text-[8px] uppercase">{attr.trait_type}:</span>
              <span className="font-mono text-white truncate max-w-[100px] font-bold">{attr.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
