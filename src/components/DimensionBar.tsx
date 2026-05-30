export const DimensionBar = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) => (
  <div className="flex items-center gap-2 text-sm">
    <span className="w-24 shrink-0 text-xs text-right opacity-60">{label}</span>
    <div className="flex-1 h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${value}%`, backgroundColor: color }}
      />
    </div>
    <span className="w-8 text-xs font-mono opacity-80">{value}</span>
  </div>
);
