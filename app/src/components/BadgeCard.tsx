import type { BadgeItem } from '../hooks/useCheckpointData';

interface BadgeCardProps {
  badge: BadgeItem;
}

export function BadgeCard({ badge }: BadgeCardProps) {
  return (
    <div className="bg-[#0e0e12]/80 border border-white/5 rounded-lg p-4 flex flex-col items-center gap-3 hover:border-purple-500/30 transition-all group">
      <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center p-3 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all overflow-hidden">
        <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: badge.svg }} />
      </div>
      <div className="text-center w-full">
        <h4 className="font-mono text-xs font-bold text-white truncate">{badge.name}</h4>
        <p className="font-mono text-[10px] text-slate-500 mt-1">SBT #{badge.tokenId}</p>
        
        <div className="mt-3 pt-3 border-t border-white/5 text-[9px] text-slate-500 text-left space-y-1">
          {badge.attributes.map((attr, idx) => (
            <div key={idx} className="flex justify-between items-center">
              <span>{attr.trait_type}:</span>
              <span className="font-mono text-white truncate max-w-[100px]">{attr.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
