import type { BadgeItem } from '../hooks/useCheckpointData';

interface BadgeCardProps {
  badge: BadgeItem;
  onClick: () => void;
}

export function BadgeCard({ badge, onClick }: BadgeCardProps) {
  return (
    <div 
      onClick={onClick}
      className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-4 flex flex-col items-center gap-3 hover:border-zinc-500 transition-all duration-300 group cursor-pointer hover:-translate-y-0.5 active:scale-98"
    >
      <div className="w-24 h-24 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center p-3 group-hover:border-zinc-500 transition-all duration-300 overflow-hidden">
        <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: badge.svg }} />
      </div>
      <div className="text-center w-full">
        <h4 className="font-brand text-xs font-bold text-white truncate">{badge.name}</h4>
        <p className="font-brand text-[9px] text-zinc-400 mt-1 uppercase tracking-wider">SBT #{badge.tokenId}</p>
        
        <div className="mt-3 pt-3 border-t border-zinc-900 text-[9px] text-zinc-500 text-left space-y-1">
          {badge.attributes.map((attr, idx) => (
            <div key={idx} className="flex justify-between items-center font-brand">
              <span className="text-[8px] uppercase text-zinc-500">{attr.trait_type}:</span>
              <span className="text-zinc-300 truncate max-w-[100px] font-bold">{attr.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
