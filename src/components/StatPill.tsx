export const StatPill = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col items-center px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 min-w-[72px]">
    <span className="text-xs opacity-50 leading-tight">{label}</span>
    <span className="text-sm font-semibold leading-tight mt-0.5">{value}</span>
  </div>
);
