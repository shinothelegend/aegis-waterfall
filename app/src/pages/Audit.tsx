import { BadgeCard } from '../components/BadgeCard';
import type { BadgeItem } from '../hooks/useCheckpointData';

interface AuditProps {
  attestationAddress: string;
  loadingBadges: boolean;
  badges: BadgeItem[];
}

export function Audit({ attestationAddress, loadingBadges, badges }: AuditProps) {
  return (
    <div className="space-y-6">
      {!attestationAddress ? (
        <div className="text-center py-20 bg-[#050505] border border-white/5 rounded-xl">
          <span className="material-symbols-outlined text-5xl text-slate-600 mb-4 font-mono">workspace_premium</span>
          <h3 className="text-base font-bold text-slate-400 font-mono">Settings Configuration Required</h3>
          <p className="text-slate-500 text-xs mt-1 font-mono">Configure the Attestation Contract Address in the header bar to browse attendee badges.</p>
        </div>
      ) : loadingBadges ? (
        <div className="text-center py-20 font-mono">
          <span className="material-symbols-outlined text-4xl text-cyan-500 animate-spin mb-4">sync</span>
          <p className="text-slate-400 text-xs">Querying blockchain attestation logs...</p>
        </div>
      ) : badges.length === 0 ? (
        <div className="text-center py-20 bg-[#050505] border border-white/5 rounded-xl font-mono">
          <span className="material-symbols-outlined text-5xl text-slate-600 mb-4">workspace_premium</span>
          <h3 className="text-base font-bold text-slate-400">No SBT Badges Issued Yet</h3>
          <p className="text-slate-500 text-xs mt-1">SBTs are autonomously minted by the agent upon attendee check-in.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {badges.map((badge) => (
            <BadgeCard key={badge.tokenId} badge={badge} />
          ))}
        </div>
      )}
    </div>
  );
}
