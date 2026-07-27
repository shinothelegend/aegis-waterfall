export function SkeletonPulse({ className = '' }: { className?: string }) {
  return (
    <div 
      className={`bg-gradient-to-r from-slate-900 via-[#0d1222] to-slate-900 bg-[length:200%_100%] animate-pulse rounded ${className}`}
      style={{ animationDuration: '1.6s' }}
    />
  );
}

export function MetricsCardSkeleton() {
  return (
    <div className="glass-panel rounded-xl p-6 border border-white/5 relative">
      <div className="flex justify-between items-center mb-4">
        <SkeletonPulse className="h-4 w-28" />
        <SkeletonPulse className="h-4 w-4 rounded-full" />
      </div>
      <div className="mt-4 mb-2">
        <SkeletonPulse className="h-3 w-36 mb-2" />
        <div className="flex items-end gap-2">
          <SkeletonPulse className="h-9 w-24" />
          <SkeletonPulse className="h-4 w-8" />
        </div>
      </div>
      <div className="mt-6">
        <div className="flex justify-between mb-2">
          <SkeletonPulse className="h-3 w-32" />
          <SkeletonPulse className="h-3 w-8" />
        </div>
        <SkeletonPulse className="h-1.5 w-full rounded-full" />
      </div>
    </div>
  );
}

export function AuditItemSkeleton() {
  return (
    <div className="bg-[#05070d]/60 border border-white/5 rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <SkeletonPulse className="w-9 h-9 rounded" />
          <div className="space-y-1.5">
            <SkeletonPulse className="h-3.5 w-24" />
            <SkeletonPulse className="h-2.5 w-16" />
          </div>
        </div>
        <SkeletonPulse className="h-4 w-12 rounded" />
      </div>
      <div className="pt-2 border-t border-white/5">
        <SkeletonPulse className="h-2.5 w-full mb-1" />
        <SkeletonPulse className="h-2.5 w-3/4" />
      </div>
    </div>
  );
}

export function BadgeCardSkeleton() {
  return (
    <div className="bg-[#0e0e12]/80 border border-white/5 rounded-lg p-4 flex flex-col items-center gap-4">
      <SkeletonPulse className="w-24 h-24 rounded-full" />
      <div className="w-full text-center space-y-2">
        <SkeletonPulse className="h-3.5 w-2/3 mx-auto" />
        <SkeletonPulse className="h-2.5 w-1/3 mx-auto" />
        <div className="border-t border-white/5 pt-3 space-y-2 mt-2">
          <div className="flex justify-between">
            <SkeletonPulse className="h-2.5 w-10" />
            <SkeletonPulse className="h-2.5 w-16" />
          </div>
          <div className="flex justify-between">
            <SkeletonPulse className="h-2.5 w-12" />
            <SkeletonPulse className="h-2.5 w-14" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-4 flex flex-col gap-6">
        <MetricsCardSkeleton />
        <div className="glass-panel rounded-xl p-6 border border-white/10 space-y-4">
          <div className="flex justify-between items-center">
            <SkeletonPulse className="h-4 w-24" />
            <SkeletonPulse className="h-3 w-3 rounded-full" />
          </div>
          <div className="space-y-3">
            <AuditItemSkeleton />
            <AuditItemSkeleton />
          </div>
        </div>
      </div>
      <div className="lg:col-span-4 flex flex-col gap-6">
        <div className="glass-panel rounded-xl p-4 h-[350px] flex flex-col justify-between">
          <SkeletonPulse className="h-6 w-1/2" />
          <div className="space-y-2 flex-1 mt-4">
            <SkeletonPulse className="h-3 w-full" />
            <SkeletonPulse className="h-3 w-5/6" />
            <SkeletonPulse className="h-3 w-4/5" />
          </div>
        </div>
        <div className="glass-panel rounded-xl p-4 h-[250px] flex flex-col justify-between">
          <SkeletonPulse className="h-6 w-1/3" />
          <div className="space-y-2 flex-1 mt-4">
            <SkeletonPulse className="h-3 w-2/3" />
            <SkeletonPulse className="h-8 w-full" />
          </div>
        </div>
      </div>
      <div className="lg:col-span-4">
        <div className="glass-panel rounded-xl p-6 h-[400px] flex flex-col justify-between">
          <SkeletonPulse className="h-5 w-2/3" />
          <div className="space-y-4 my-6 flex-1">
            <SkeletonPulse className="h-8 w-full" />
            <SkeletonPulse className="h-8 w-full" />
            <SkeletonPulse className="h-8 w-full" />
          </div>
          <SkeletonPulse className="h-10 w-full rounded" />
        </div>
      </div>
    </div>
  );
}
