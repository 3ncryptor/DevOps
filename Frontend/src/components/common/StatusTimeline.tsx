import { cn } from "@/lib/utils";
import { OrderStatusBadge } from "./Badge";

interface TimelineEntry {
  status: string;
  changedAt: string;
  actorRole?: string;
  notes?: string;
}

interface StatusTimelineProps {
  entries: TimelineEntry[];
  className?: string;
}

export function StatusTimeline({ entries, className }: StatusTimelineProps) {
  const sorted = [...entries].sort(
    (a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime(),
  );

  return (
    <div className={cn("space-y-0", className)}>
      {sorted.map((entry, i) => {
        const isLast = i === sorted.length - 1;
        return (
          <div key={i} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "mt-1 h-3 w-3 rounded-full border-2 shrink-0",
                  isLast ? "border-black bg-black" : "border-gray-300 bg-white",
                )}
              />
              {!isLast && <div className="w-px flex-1 bg-gray-200 my-1" />}
            </div>
            <div className={cn("pb-4", isLast && "pb-0")}>
              <div className="flex items-center gap-2 flex-wrap">
                <OrderStatusBadge status={entry.status} />
                <span className="text-xs text-gray-400">
                  {new Date(entry.changedAt).toLocaleString()}
                </span>
                {entry.actorRole && (
                  <span className="text-xs text-gray-400">
                    by {entry.actorRole}
                  </span>
                )}
              </div>
              {entry.notes && (
                <p className="mt-1 text-xs text-gray-500">{entry.notes}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
