import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/_core/hooks/useAuth";

export default function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: unread, refetch: refetchCount } = trpc.notifications.unreadCount.useQuery(
    undefined,
    { enabled: isAuthenticated, refetchInterval: 30000 }
  );
  const { data: notifications, refetch: refetchList } = trpc.notifications.list.useQuery(
    undefined,
    { enabled: isAuthenticated && open }
  );
  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => { refetchCount(); refetchList(); }
  });

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    setOpen(!open);
    if (!open && unread?.count && unread.count > 0) {
      // Mark all as read when opening
      setTimeout(() => markRead.mutate({}), 1500);
    }
  };

  if (!isAuthenticated) return null;

  const count = unread?.count ?? 0;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 text-[oklch(0.55_0_0)] hover:text-[oklch(0.85_0.18_95)] transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 leading-none">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[oklch(0.13_0_0)] border border-[oklch(0.22_0_0)] rounded-lg shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[oklch(0.18_0_0)]">
            <span className="text-xs font-black uppercase tracking-widest text-[oklch(0.55_0_0)]">Notifications</span>
            {count > 0 && (
              <button
                onClick={() => markRead.mutate({})}
                className="text-xs text-[oklch(0.85_0.18_95)] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {!notifications?.length ? (
              <div className="px-4 py-8 text-center">
                <p className="text-2xl mb-2">✈</p>
                <p className="text-xs text-[oklch(0.45_0_0)]">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n: any) => (
                <div
                  key={n.id}
                  className={`flex gap-3 px-4 py-3 border-b border-[oklch(0.16_0_0)] last:border-0 ${!n.isRead ? "bg-[oklch(0.85_0.18_95)]/5" : ""}`}
                >
                  <span className="text-xl leading-none mt-0.5 shrink-0">{n.icon ?? "🔔"}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold leading-tight mb-0.5 ${!n.isRead ? "text-white" : "text-[oklch(0.65_0_0)]"}`}>
                      {n.title}
                    </p>
                    {n.message && (
                      <p className="text-xs text-[oklch(0.45_0_0)] leading-relaxed line-clamp-2">{n.message}</p>
                    )}
                    <p className="text-[10px] text-[oklch(0.35_0_0)] mt-1">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
