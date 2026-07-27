import { BadgeCard } from '../components/BadgeCard';
import { BadgeCardSkeleton } from '../components/Skeletons';
import type { BadgeItem } from '../hooks/useCheckpointData';

interface AuditProps {
  attestationAddress: string;
  loadingBadges: boolean;
  badges: BadgeItem[];
  onSelectBadge: (badge: BadgeItem) => void;
}

export function Audit({ attestationAddress, loadingBadges, badges, onSelectBadge }: AuditProps) {
  return (
    <div className="space-y-6">
      {!attestationAddress ? (
        <div className="text-center py-20 bg-[#05070f] border border-white/5 rounded-xl">
          <span className="material-symbols-outlined text-5xl text-slate-600 mb-4 font-mono">workspace_premium</span>
          <h3 className="text-sm font-bold text-slate-400 font-mono uppercase tracking-wider">Settings Configuration Required</h3>
          <p className="text-slate-500 text-xs mt-1.5 font-mono">Configure the Attestation Contract Address in the header bar to browse attendee badges.</p>
        </div>
      ) : loadingBadges ? (
        <div className="space-y-4">
          <p className="text-slate-400 text-xs font-mono mb-2 uppercase tracking-wide">&gt; Syncing on-chain attestation tokens...</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <BadgeCardSkeleton />
            <BadgeCardSkeleton />
            <BadgeCardSkeleton />
            <BadgeCardSkeleton />
          </div>
        </div>
      ) : badges.length === 0 ? (
        <div className="text-center py-20 bg-[#05070f] border border-white/5 rounded-xl font-mono">
          <span className="material-symbols-outlined text-5xl text-slate-600 mb-4">workspace_premium</span>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">No SBT Badges Issued Yet</h3>
          <p className="text-slate-500 text-xs mt-1.5">SBTs are autonomously minted by the agent upon attendee check-in.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {badges.map((badge) => (
            <BadgeCard 
              key={badge.tokenId} 
              badge={badge} 
              onClick={() => onSelectBadge(badge)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
