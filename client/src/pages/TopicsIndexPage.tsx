import { Link } from "wouter";
import { Compass, Plane, Building2, PlaneTakeoff, Newspaper } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { TOPICS, TOPIC_GROUPS, type TopicGroup } from "@/lib/topics";

const GROUP_ICONS: Record<TopicGroup, typeof Plane> = {
  Airlines: Plane,
  Airports: Building2,
  Aircraft: PlaneTakeoff,
  Stories: Newspaper,
};

export default function TopicsIndexPage() {
  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]">
      <Navigation />
      <main className="container py-8 sm:py-10">
        <div className="mb-8 max-w-3xl">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[oklch(0.85_0.18_95)]">
            <Compass className="h-3.5 w-3.5" /> Explore Flight Drama
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Follow the airspace that matters to you</h1>
          <p className="mt-3 text-base leading-relaxed text-[oklch(0.60_0_0)]">Jump straight into the airlines, airports, aircraft and aviation stories you care about. Each topic hub is kept in latest-first order.</p>
        </div>

        <div className="space-y-10">
          {TOPIC_GROUPS.map((group) => {
            const Icon = GROUP_ICONS[group];
            const groupTopics = TOPICS.filter((topic) => topic.group === group);
            return (
              <section key={group} aria-labelledby={`${group.toLowerCase()}-topics`}>
                <div className="mb-4 flex items-center gap-2">
                  <Icon className="h-4 w-4 text-[oklch(0.85_0.18_95)]" />
                  <h2 id={`${group.toLowerCase()}-topics`} className="text-sm font-black uppercase tracking-[0.16em] text-white">{group}</h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {groupTopics.map((topic) => (
                    <Link key={topic.slug} href={`/topic/${topic.slug}`} className="group rounded-lg border border-[oklch(0.22_0_0)] bg-[oklch(0.13_0_0)] p-4 transition-colors hover:border-[oklch(0.85_0.18_95)]/60 hover:bg-[oklch(0.15_0_0)]">
                      <h3 className="font-black text-white group-hover:text-[oklch(0.85_0.18_95)]">{topic.label}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-[oklch(0.55_0_0)]">{topic.description}</p>
                      <span className="mt-4 inline-flex text-xs font-bold text-[oklch(0.85_0.18_95)]">View latest coverage →</span>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
}
