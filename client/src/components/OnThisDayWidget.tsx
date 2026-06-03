import { useMemo } from "react";
import { Calendar } from "lucide-react";

interface AviationEvent {
  year: number;
  event: string;
  category: "milestone" | "incident" | "record" | "first";
}

// Aviation history events indexed by [month][day]
const AVIATION_EVENTS: Record<string, AviationEvent[]> = {
  "1-1": [{ year: 1914, event: "World's first scheduled airline service launched between St. Petersburg and Tampa, Florida.", category: "first" }],
  "1-7": [{ year: 1785, event: "Jean-Pierre Blanchard and John Jeffries made the first balloon crossing of the English Channel.", category: "first" }],
  "1-9": [{ year: 1793, event: "Jean-Pierre Blanchard made the first balloon flight in America, watched by President George Washington.", category: "milestone" }],
  "1-11": [{ year: 1935, event: "Amelia Earhart became the first person to fly solo from Hawaii to California.", category: "first" }],
  "1-15": [{ year: 2009, event: "US Airways Flight 1549 ditched in the Hudson River after striking a flock of geese. All 155 on board survived.", category: "incident" }],
  "1-20": [{ year: 1976, event: "Concorde made its first commercial flights simultaneously from London to Bahrain and Paris to Dakar.", category: "first" }],
  "1-26": [{ year: 2020, event: "NBA legend Kobe Bryant died in a helicopter crash in Calabasas, California, along with eight others.", category: "incident" }],
  "2-3": [{ year: 1959, event: "Buddy Holly, Ritchie Valens and The Big Bopper died in a plane crash in Iowa — 'The Day the Music Died'.", category: "incident" }],
  "2-4": [{ year: 1966, event: "All Nippon Airways Flight 60 crashed into Tokyo Bay, killing all 133 aboard.", category: "incident" }],
  "2-12": [{ year: 2009, event: "Colgan Air Flight 3407 crashed near Buffalo, New York, killing all 49 on board and one person on the ground.", category: "incident" }],
  "2-19": [{ year: 1959, event: "The de Havilland Comet 4 entered service as the world's first commercial jet airliner.", category: "milestone" }],
  "2-23": [{ year: 1997, event: "An oxygen generator fire broke out aboard a ValuJet aircraft on the ground in Atlanta.", category: "incident" }],
  "3-3": [{ year: 1974, event: "Turkish Airlines Flight 981 crashed near Paris, killing all 346 people on board — deadliest crash to that date.", category: "incident" }],
  "3-5": [{ year: 1979, event: "American Airlines Flight 191 lost an engine on takeoff from Chicago O'Hare, killing all 273 on board.", category: "incident" }],
  "3-8": [{ year: 2014, event: "Malaysia Airlines Flight MH370 disappeared with 239 people on board — aviation's greatest mystery.", category: "incident" }],
  "3-20": [{ year: 1969, event: "The Boeing 747 'Jumbo Jet' entered commercial service with Pan American World Airways.", category: "first" }],
  "3-27": [{ year: 1977, event: "Two Boeing 747s collided on the runway at Tenerife, killing 583 people — the deadliest aviation accident in history.", category: "incident" }],
  "4-4": [{ year: 1933, event: "The USS Akron, one of the world's largest airships, crashed in a storm off New Jersey, killing 73 of 76 crew.", category: "incident" }],
  "4-15": [{ year: 1912, event: "RMS Titanic sank — though not aviation, it spurred development of radio and safety regulations that shaped aviation.", category: "milestone" }],
  "4-20": [{ year: 1988, event: "Aloha Airlines Flight 243 suffered explosive decompression at 24,000 ft. One flight attendant was lost; 65 were injured.", category: "incident" }],
  "5-6": [{ year: 1937, event: "The Hindenburg airship burst into flames while attempting to dock in New Jersey, killing 36 people.", category: "incident" }],
  "5-11": [{ year: 1996, event: "ValuJet Flight 592 crashed into the Florida Everglades, killing all 110 on board after an oxygen fire in the hold.", category: "incident" }],
  "5-22": [{ year: 2010, event: "Air India Express Flight 812 overran the runway at Mangalore, India, killing 158 of 166 on board.", category: "incident" }],
  "5-25": [{ year: 1979, event: "American Airlines Flight 191 crashed on takeoff from Chicago O'Hare after an engine separated, killing 273.", category: "incident" }],
  "6-1": [{ year: 2009, event: "Air France Flight 447 disappeared over the Atlantic Ocean, killing all 228 people on board.", category: "incident" }],
  "6-3": [{ year: 1973, event: "A Soviet Tupolev Tu-144 supersonic airliner crashed at the Paris Air Show, killing 14 people.", category: "incident" }],
  "6-18": [{ year: 1983, event: "Sally Ride became the first American woman in space aboard Space Shuttle Challenger.", category: "first" }],
  "6-23": [{ year: 1985, event: "Air India Flight 182 was bombed over the Atlantic Ocean, killing all 329 people on board.", category: "incident" }],
  "7-3": [{ year: 1988, event: "USS Vincennes shot down Iran Air Flight 655, killing all 290 passengers and crew.", category: "incident" }],
  "7-4": [{ year: 1976, event: "Israeli commandos rescued 102 hostages at Entebbe Airport, Uganda, in a daring raid.", category: "milestone" }],
  "7-17": [{ year: 1996, event: "TWA Flight 800 exploded and crashed into the Atlantic Ocean off Long Island, killing all 230 on board.", category: "incident" }],
  "7-19": [{ year: 1989, event: "United Airlines Flight 232 crash-landed at Sioux City, Iowa, after losing all hydraulic systems. 111 of 296 died.", category: "incident" }],
  "7-25": [{ year: 2000, event: "Air France Concorde Flight 4590 crashed after takeoff from Paris, killing all 109 on board and 4 on the ground.", category: "incident" }],
  "8-2": [{ year: 1985, event: "Delta Air Lines Flight 191 crashed at Dallas/Fort Worth during a microburst, killing 137 of 163 on board.", category: "incident" }],
  "8-6": [{ year: 1945, event: "The Enola Gay dropped the first atomic bomb on Hiroshima, Japan.", category: "milestone" }],
  "8-12": [{ year: 1985, event: "Japan Airlines Flight 123 crashed into Mount Takamagahara, killing 520 people — deadliest single-aircraft accident.", category: "incident" }],
  "8-16": [{ year: 1987, event: "Northwest Airlines Flight 255 crashed on takeoff from Detroit, killing 154 of 155 on board.", category: "incident" }],
  "8-19": [{ year: 1980, event: "Saudi Arabian Airlines Flight 163 caught fire after takeoff from Riyadh. All 301 on board died.", category: "incident" }],
  "9-1": [{ year: 1983, event: "Korean Air Lines Flight 007 was shot down by a Soviet fighter jet, killing all 269 people on board.", category: "incident" }],
  "9-11": [{ year: 2001, event: "Four commercial aircraft were hijacked and used as weapons in the deadliest terrorist attack in history, killing 2,977.", category: "incident" }],
  "9-19": [{ year: 1989, event: "UTA Flight 772 was bombed over Niger, killing all 170 people on board.", category: "incident" }],
  "9-25": [{ year: 1978, event: "Pacific Southwest Airlines Flight 182 collided with a Cessna over San Diego, killing 144 people.", category: "incident" }],
  "10-4": [{ year: 1957, event: "The Soviet Union launched Sputnik 1, the world's first artificial satellite, opening the Space Age.", category: "first" }],
  "10-14": [{ year: 1947, event: "Chuck Yeager became the first person to break the sound barrier in the Bell X-1 rocket plane.", category: "first" }],
  "10-31": [{ year: 1999, event: "EgyptAir Flight 990 crashed into the Atlantic Ocean off Nantucket, killing all 217 on board.", category: "incident" }],
  "11-12": [{ year: 1996, event: "A Saudi Arabian Airlines Boeing 747 and a Kazakhstan Airlines Ilyushin Il-76 collided over India, killing 349.", category: "incident" }],
  "11-17": [{ year: 1983, event: "Avianca Flight 011 crashed on approach to Madrid Barajas Airport, killing 181 of 192 on board.", category: "incident" }],
  "11-28": [{ year: 1979, event: "Air New Zealand Flight 901 flew into Mount Erebus in Antarctica, killing all 257 on board.", category: "incident" }],
  "12-1": [{ year: 1958, event: "A United Airlines DC-7 and a TWA Constellation collided over the Grand Canyon, killing 128 people.", category: "incident" }],
  "12-12": [{ year: 1988, event: "A Lockerbie bombing destroyed Pan Am Flight 103 over Scotland, killing all 259 on board and 11 on the ground.", category: "incident" }],
  "12-17": [{ year: 1903, event: "Orville and Wilbur Wright made the first successful powered flight at Kitty Hawk, North Carolina.", category: "first" }],
  "12-21": [{ year: 1988, event: "Pan Am Flight 103 was bombed over Lockerbie, Scotland, killing all 259 on board and 11 on the ground.", category: "incident" }],
  "12-25": [{ year: 2009, event: "The 'Underwear Bomber' attempted to detonate explosives aboard Northwest Airlines Flight 253 over Detroit.", category: "incident" }],
};

const CATEGORY_COLOURS: Record<string, string> = {
  first: "oklch(0.85 0.18 95)",
  milestone: "oklch(0.65 0.15 250)",
  incident: "oklch(0.65 0.15 25)",
  record: "oklch(0.65 0.15 150)",
};

const CATEGORY_LABELS: Record<string, string> = {
  first: "First",
  milestone: "Milestone",
  incident: "Incident",
  record: "Record",
};

export default function OnThisDayWidget() {
  const today = useMemo(() => new Date(), []);
  const month = today.getMonth() + 1;
  const day = today.getDate();

  const events = useMemo(() => {
    const key = `${month}-${day}`;
    return AVIATION_EVENTS[key] ?? [];
  }, [month, day]);

  const dateLabel = today.toLocaleDateString("en-GB", { day: "numeric", month: "long" });

  if (events.length === 0) return null;

  return (
    <div className="bg-[oklch(0.12_0_0)] border border-[oklch(0.22_0_0)] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-[oklch(0.18_0_0)] px-4 py-2.5 flex items-center gap-2 border-b border-[oklch(0.22_0_0)]">
        <Calendar className="w-4 h-4 text-[oklch(0.85_0.18_95)]" />
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-[oklch(0.65_0_0)]">On This Day</span>
          <span className="text-xs text-[oklch(0.45_0_0)] ml-2">{dateLabel}</span>
        </div>
      </div>

      <div className="divide-y divide-[oklch(0.18_0_0)]">
        {events.map((ev, i) => (
          <div key={i} className="px-4 py-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded"
                style={{ backgroundColor: CATEGORY_COLOURS[ev.category] + "20", color: CATEGORY_COLOURS[ev.category] }}
              >
                {CATEGORY_LABELS[ev.category]}
              </span>
              <span className="text-[10px] font-black text-[oklch(0.85_0.18_95)]">{ev.year}</span>
            </div>
            <p className="text-xs text-[oklch(0.72_0_0)] leading-relaxed">{ev.event}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
