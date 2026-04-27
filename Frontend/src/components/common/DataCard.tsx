import { cn } from "@/lib/utils";

interface DataCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: { value: number; label?: string };
  className?: string;
}

export function DataCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  className,
}: DataCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-gray-100 bg-white p-5 flex flex-col gap-3",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          {title}
        </p>
        {icon && <div className="text-gray-300">{icon}</div>}
      </div>
      <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
      {(subtitle || trend) && (
        <div className="flex items-center gap-2">
          {trend && (
            <span
              className={cn(
                "text-xs font-semibold",
                trend.value >= 0 ? "text-green-600" : "text-red-600",
              )}
            >
              {trend.value >= 0 ? "+" : ""}
              {trend.value}%
            </span>
          )}
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
      )}
    </div>
  );
}
