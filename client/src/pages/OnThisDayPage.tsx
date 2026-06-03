import { useState, useMemo } from "react";
import { Link } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { AVIATION_EVENTS, CATEGORY_COLOURS, CATEGORY_LABELS } from "@/components/OnThisDayWidget";
import type { AviationEvent } from "@/components/OnThisDayWidget";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const CATEGORY_ICONS: Record<string, string> = {
  first: "✈",
  milestone: "🏆",
  incident: "⚠",
  record: "📋",
};

interface DayEvent {
  day: number;
  events: AviationEvent[];
}

export default function OnThisDayPage() {
  const today = useMemo(() => new Date(), []);
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());

  // Build events for the selected month
  const monthEvents = useMemo<DayEvent[]>(() => {
    const days = DAYS_IN_MONTH[selectedMonth];
    const result: DayEvent[] = [];
    for (let d = 1; d <= days; d++) {
      const key = `${selectedMonth + 1}-${d}`;
      const events = AVIATION_EVENTS[key] ?? [];
      result.push({ day: d, events });
    }
    return result;
  }, [selectedMonth]);

  // Events for selected day
  const selectedDayEvents = useMemo(() => {
    if (!selectedDay) return [];
    const key = `${selectedMonth + 1}-${selectedDay}`;
    return AVIATION_EVENTS[key] ?? [];
  }, [selectedMonth, selectedDay]);

  // Count events per category for the month
  const monthStats = useMemo(() => {
    const stats = { first: 0, milestone: 0, incident: 0, record: 0, total: 0 };
    monthEvents.forEach(({ events }) => {
      events.forEach(ev => {
        stats[ev.category]++;
        stats.total++;
      });
    });
    return stats;
  }, [monthEvents]);

  const prevMonth = () => {
    setSelectedMonth((m) => (m === 0 ? 11 : m - 1));
    setSelectedDay(null);
  };
  const nextMonth = () => {
    setSelectedMonth((m) => (m === 11 ? 0 : m + 1));
    setSelectedDay(null);
  };

  const isToday = (day: number) =>
    day === today.getDate() && selectedMonth === today.getMonth();

  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]">
      <Navigation />
      <main className="container py-8 max-w-6xl">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-[oklch(0.85_0.18_95)]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[oklch(0.45_0_0)]">Flight Drama</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">On This Day in Aviation</h1>
          <p className="text-sm text-[oklch(0.50_0_0)] max-w-2xl">
            365 days of aviation history — from the Wright Brothers' first flight to the Tenerife disaster, Concorde's last flight, and everything in between.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Calendar + day list */}
          <div className="lg:col-span-2 space-y-6">
            {/* Month navigation */}
            <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.20_0_0)] rounded-xl overflow-hidden">
              {/* Month header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[oklch(0.18_0_0)]">
                <button
                  onClick={prevMonth}
                  className="p-1.5 rounded hover:bg-[oklch(0.20_0_0)] transition-colors text-[oklch(0.55_0_0)] hover:text-white"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="text-center">
                  <h2 className="text-lg font-black text-white">{MONTHS[selectedMonth]}</h2>
                  <div className="flex items-center gap-3 mt-1 justify-center">
                    {(["first", "milestone", "incident", "record"] as const).map(cat => (
                      monthStats[cat] > 0 && (
                        <span key={cat} className="text-[10px] font-bold" style={{ color: CATEGORY_COLOURS[cat] }}>
                          {CATEGORY_ICONS[cat]} {monthStats[cat]}
                        </span>
                      )
                    ))}
                  </div>
                </div>
                <button
                  onClick={nextMonth}
                  className="p-1.5 rounded hover:bg-[oklch(0.20_0_0)] transition-colors text-[oklch(0.55_0_0)] hover:text-white"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Day grid */}
              <div className="p-4">
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                    <div key={i} className="text-center text-[10px] font-black text-[oklch(0.35_0_0)] py-1">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {/* Offset for first day of month (approximate — use Mon start) */}
                  {Array.from({ length: getMonthOffset(selectedMonth) }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {monthEvents.map(({ day, events }) => {
                    const hasEvent = events.length > 0;
                    const isSelected = selectedDay === day;
                    const isTodayDay = isToday(day);
                    const primaryCategory = events[0]?.category;

                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDay(isSelected ? null : day)}
                        className={`relative aspect-square rounded flex flex-col items-center justify-center text-xs font-bold transition-all ${
                          isSelected
                            ? "ring-2 scale-105"
                            : "hover:bg-[oklch(0.18_0_0)]"
                        } ${!hasEvent ? "text-[oklch(0.35_0_0)]" : "text-white"}`}
                        style={{
                          backgroundColor: isSelected
                            ? (primaryCategory ? CATEGORY_COLOURS[primaryCategory] + "20" : "oklch(0.18 0 0)")
                            : undefined,
                          outline: isSelected && primaryCategory
                            ? `2px solid ${CATEGORY_COLOURS[primaryCategory]}`
                            : isTodayDay
                            ? "2px solid oklch(0.85 0.18 95)"
                            : undefined,
                        }}
                      >
                        <span className={isTodayDay && !isSelected ? "text-[oklch(0.85_0.18_95)]" : ""}>{day}</span>
                        {hasEvent && (
                          <div className="flex gap-0.5 mt-0.5">
                            {events.slice(0, 2).map((ev, i) => (
                              <div
                                key={i}
                                className="w-1 h-1 rounded-full"
                                style={{ backgroundColor: CATEGORY_COLOURS[ev.category] }}
                              />
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Legend */}
              <div className="px-4 pb-4 flex flex-wrap gap-3">
                {(["first", "milestone", "incident", "record"] as const).map(cat => (
                  <div key={cat} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLOURS[cat] }} />
                    <span className="text-[10px] text-[oklch(0.45_0_0)]">{CATEGORY_LABELS[cat]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* All events for the month as a list */}
            <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.20_0_0)] rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-[oklch(0.18_0_0)]">
                <h3 className="text-xs font-black uppercase tracking-widest text-[oklch(0.45_0_0)]">
                  All {MONTHS[selectedMonth]} Events — {monthStats.total} total
                </h3>
              </div>
              <div className="divide-y divide-[oklch(0.16_0_0)] max-h-[500px] overflow-y-auto">
                {monthEvents.filter(d => d.events.length > 0).map(({ day, events }) => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`w-full text-left px-5 py-3 hover:bg-[oklch(0.16_0_0)] transition-colors ${selectedDay === day ? "bg-[oklch(0.16_0_0)]" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="shrink-0 w-8 h-8 rounded flex items-center justify-center text-xs font-black"
                        style={{
                          backgroundColor: CATEGORY_COLOURS[events[0].category] + "20",
                          color: CATEGORY_COLOURS[events[0].category],
                        }}
                      >
                        {day}
                      </div>
                      <div className="flex-1 min-w-0">
                        {events.map((ev, i) => (
                          <div key={i} className={i > 0 ? "mt-1.5" : ""}>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span
                                className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded"
                                style={{ backgroundColor: CATEGORY_COLOURS[ev.category] + "20", color: CATEGORY_COLOURS[ev.category] }}
                              >
                                {CATEGORY_LABELS[ev.category]}
                              </span>
                              <span className="text-[10px] font-black text-[oklch(0.85_0.18_95)]">{ev.year}</span>
                            </div>
                            <p className="text-xs text-[oklch(0.65_0_0)] leading-relaxed line-clamp-2">{ev.event}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </button>
                ))}
                {monthStats.total === 0 && (
                  <div className="px-5 py-8 text-center text-[oklch(0.40_0_0)] text-sm">No events recorded for this month.</div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Selected day detail + month quick-jump */}
          <div className="space-y-5">
            {/* Selected day detail */}
            {selectedDay && selectedDayEvents.length > 0 ? (
              <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.20_0_0)] rounded-xl overflow-hidden">
                <div
                  className="px-5 py-4 border-b border-[oklch(0.18_0_0)]"
                  style={{ background: `linear-gradient(135deg, ${CATEGORY_COLOURS[selectedDayEvents[0].category]}15, transparent)` }}
                >
                  <div className="text-xs font-black uppercase tracking-widest text-[oklch(0.45_0_0)] mb-1">
                    {MONTHS[selectedMonth]} {selectedDay}
                  </div>
                  <div className="text-2xl font-black text-white">
                    {selectedDayEvents.length === 1
                      ? `${selectedDayEvents[0].year}`
                      : `${selectedDayEvents.length} events`}
                  </div>
                </div>
                <div className="divide-y divide-[oklch(0.18_0_0)]">
                  {selectedDayEvents.map((ev, i) => (
                    <div key={i} className="px-5 py-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded"
                          style={{ backgroundColor: CATEGORY_COLOURS[ev.category] + "20", color: CATEGORY_COLOURS[ev.category] }}
                        >
                          {CATEGORY_LABELS[ev.category]}
                        </span>
                        <span className="text-sm font-black text-[oklch(0.85_0.18_95)]">{ev.year}</span>
                      </div>
                      <p className="text-sm text-[oklch(0.72_0_0)] leading-relaxed">{ev.event}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : selectedDay ? (
              <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.20_0_0)] rounded-xl p-5 text-center">
                <div className="text-3xl mb-2 opacity-30">✈</div>
                <p className="text-sm text-[oklch(0.45_0_0)]">No recorded aviation events for {MONTHS[selectedMonth]} {selectedDay}.</p>
              </div>
            ) : (
              <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.20_0_0)] rounded-xl p-5 text-center">
                <Calendar className="w-8 h-8 text-[oklch(0.30_0_0)] mx-auto mb-2" />
                <p className="text-sm text-[oklch(0.45_0_0)]">Select a day on the calendar to see what happened in aviation history.</p>
              </div>
            )}

            {/* Month quick-jump */}
            <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.20_0_0)] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[oklch(0.18_0_0)]">
                <h3 className="text-xs font-black uppercase tracking-widest text-[oklch(0.45_0_0)]">Jump to Month</h3>
              </div>
              <div className="p-3 grid grid-cols-3 gap-1.5">
                {MONTHS.map((month, i) => {
                  const count = Object.keys(AVIATION_EVENTS).filter(k => k.startsWith(`${i + 1}-`)).length;
                  return (
                    <button
                      key={month}
                      onClick={() => { setSelectedMonth(i); setSelectedDay(null); }}
                      className={`px-2 py-2 rounded text-xs font-bold transition-colors ${
                        selectedMonth === i
                          ? "bg-[oklch(0.85_0.18_95)] text-black"
                          : "bg-[oklch(0.18_0_0)] text-[oklch(0.55_0_0)] hover:text-white hover:bg-[oklch(0.22_0_0)]"
                      }`}
                    >
                      <div>{month.slice(0, 3)}</div>
                      <div className={`text-[9px] mt-0.5 ${selectedMonth === i ? "text-black/70" : "text-[oklch(0.40_0_0)]"}`}>{count} days</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Today's event shortcut */}
            {(() => {
              const todayKey = `${today.getMonth() + 1}-${today.getDate()}`;
              const todayEvents = AVIATION_EVENTS[todayKey] ?? [];
              if (todayEvents.length === 0) return null;
              return (
                <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.20_0_0)] rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-[oklch(0.18_0_0)] flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[oklch(0.85_0.18_95)] animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-widest text-[oklch(0.85_0.18_95)]">Today</span>
                    <span className="text-xs text-[oklch(0.45_0_0)]">{today.toLocaleDateString("en-GB", { day: "numeric", month: "long" })}</span>
                  </div>
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ backgroundColor: CATEGORY_COLOURS[todayEvents[0].category] + "20", color: CATEGORY_COLOURS[todayEvents[0].category] }}>
                        {CATEGORY_LABELS[todayEvents[0].category]}
                      </span>
                      <span className="text-[10px] font-black text-[oklch(0.85_0.18_95)]">{todayEvents[0].year}</span>
                    </div>
                    <p className="text-xs text-[oklch(0.65_0_0)] leading-relaxed">{todayEvents[0].event}</p>
                    {selectedMonth !== today.getMonth() && (
                      <button
                        onClick={() => { setSelectedMonth(today.getMonth()); setSelectedDay(today.getDate()); }}
                        className="mt-2 text-[10px] font-bold text-[oklch(0.85_0.18_95)] hover:underline"
                      >
                        View today →
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// Get day-of-week offset for the first day of a month (Mon=0)
function getMonthOffset(month: number): number {
  // Use year 2026 as reference (non-leap year, consistent)
  const year = month === 1 ? 2024 : 2026; // Use 2024 for Feb (leap year) to show 29 days
  const firstDay = new Date(year, month, 1).getDay();
  // Convert Sun=0 to Mon=0
  return firstDay === 0 ? 6 : firstDay - 1;
}
