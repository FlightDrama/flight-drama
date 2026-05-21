/**
 * Flight Drama — Forum Seed Script
 * Seeds the forum with vibrant threads and replies from believable aviation community members.
 */

import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// ─── Fake Users ───────────────────────────────────────────────────────────────
// We'll insert fake users into the users table with believable aviation usernames
await conn.execute("DELETE FROM forum_replies");
await conn.execute("DELETE FROM forum_threads");

// Use existing user ID 1 as base, but create fake user records for forum display
// We'll use IDs 100+ to avoid conflicts with real users
const fakeUsers = [
  { id: 100, openId: "fake-737captain",    name: "737Captain_UK",      email: "737captain@fake.fd" },
  { id: 101, openId: "fake-planespotter",  name: "PlaneSpotter_MCR",   email: "planespotter@fake.fd" },
  { id: 102, openId: "fake-avgeek",        name: "AvGeek_Heathrow",    email: "avgeek@fake.fd" },
  { id: 103, openId: "fake-flightdeck",    name: "FlightDeckFred",     email: "flightdeck@fake.fd" },
  { id: 104, openId: "fake-turbofan",      name: "TurboFan_77W",       email: "turbofan@fake.fd" },
  { id: 105, openId: "fake-gatwickgaz",    name: "GatwickGaz",         email: "gatwickgaz@fake.fd" },
  { id: 106, openId: "fake-a380lover",     name: "A380Lover",          email: "a380lover@fake.fd" },
  { id: 107, openId: "fake-ppl_student",   name: "PPL_Student_2024",   email: "pplstudent@fake.fd" },
  { id: 108, openId: "fake-atc_retired",   name: "RetiredATC_EGLL",    email: "atcretired@fake.fd" },
  { id: 109, openId: "fake-ramprat",       name: "RampRat_LHR",        email: "ramprat@fake.fd" },
  { id: 110, openId: "fake-contrailchaser",name: "ContrailChaser",     email: "contrail@fake.fd" },
  { id: 111, openId: "fake-mach2mike",     name: "Mach2Mike",          email: "mach2@fake.fd" },
  { id: 112, openId: "fake-taxiway_tim",   name: "TaxiwayTim",         email: "taxiwaytim@fake.fd" },
  { id: 113, openId: "fake-boeing_or_bust",name: "BoeingOrBust",       email: "boeing@fake.fd" },
  { id: 114, openId: "fake-airbus_andy",   name: "AirbusAndy_MAN",     email: "airbusandy@fake.fd" },
  { id: 115, openId: "fake-nightstop",     name: "NightStop_Crew",     email: "nightstop@fake.fd" },
  { id: 116, openId: "fake-flightaware",   name: "FlightAware_Fan",    email: "flightaware@fake.fd" },
  { id: 117, openId: "fake-squawk7700",    name: "Squawk7700",         email: "squawk7700@fake.fd" },
  { id: 118, openId: "fake-v1rotate",      name: "V1_Rotate",          email: "v1rotate@fake.fd" },
  { id: 119, openId: "fake-holdingshort",  name: "HoldingShort_BHX",  email: "holdingshort@fake.fd" },
  { id: 120, openId: "fake-capt_obvious",  name: "CaptObvious_B77W",   email: "captobvious@fake.fd" },
  { id: 121, openId: "fake-ife_addict",    name: "IFE_Addict",         email: "ifeaddict@fake.fd" },
  { id: 122, openId: "fake-flapslever",    name: "FlapsLever",         email: "flapslever@fake.fd" },
  { id: 123, openId: "fake-seatmap_nerd",  name: "SeatmapNerd",        email: "seatmap@fake.fd" },
  { id: 124, openId: "fake-groundspeed",   name: "GroundSpeed_450",    email: "groundspeed@fake.fd" },
];

// Insert fake users (ignore if already exist)
for (const u of fakeUsers) {
  await conn.execute(
    "INSERT IGNORE INTO users (id, openId, name, email, loginMethod, role) VALUES (?, ?, ?, ?, 'fake', 'user')",
    [u.id, u.openId, u.name, u.email]
  );
}
console.log(`✅ Inserted ${fakeUsers.length} fake users`);

// ─── Helper ───────────────────────────────────────────────────────────────────
const randomUser = (exclude = []) => {
  const pool = fakeUsers.filter(u => !exclude.includes(u.id));
  return pool[Math.floor(Math.random() * pool.length)];
};

const daysAgo = (d) => new Date(Date.now() - d * 86400000);
const hoursAgo = (h) => new Date(Date.now() - h * 3600000);

// ─── Threads + Replies ────────────────────────────────────────────────────────
// Board IDs: 1=Commercial, 2=Military, 3=Flight Training, 4=Incidents, 5=Spotting, 6=General

const threads = [

  // ── BOARD 1: Commercial Aviation ──────────────────────────────────────────
  {
    boardId: 1, userId: 100,
    title: "Best seats on the Boeing 777-300ER for long haul?",
    content: "Flying LHR-SIN next month on Singapore Airlines 77W. Any recommendations for the best seats in economy? I've heard row 55 is good but wanted community input. I'm 6'2\" so legroom is a priority.",
    views: 312, createdAt: daysAgo(14),
    replies: [
      { userId: 101, content: "Row 55 is solid — exit row so good legroom. Just be aware the middle seats don't have under-seat storage. Book it ASAP, they go fast.", createdAt: daysAgo(14) },
      { userId: 106, content: "I always go for the bulkhead on SQ. 11A/K on the upper deck if you can swing business. But for economy, the back of the plane is actually quieter than people think.", createdAt: daysAgo(13) },
      { userId: 123, content: "Use SeatGuru before you book anything. The 77W config varies by airline. SQ's version is one of the better ones — 3-3-3 in economy which is standard.", createdAt: daysAgo(13) },
      { userId: 115, content: "As cabin crew I'd say avoid the last 3 rows — you'll hear the galley all night and the seats don't recline fully. Middle of the plane is best for turbulence too.", createdAt: daysAgo(12) },
      { userId: 100, content: "Thanks all — went with 55A in the end. Will report back!", createdAt: daysAgo(10) },
      { userId: 121, content: "The IFE on SQ is genuinely one of the best in the world. Whatever seat you get, you'll be entertained. Enjoy the flight!", createdAt: daysAgo(9) },
    ]
  },
  {
    boardId: 1, userId: 114,
    title: "Ryanair's new carry-on policy — has anyone been caught out?",
    content: "They've changed the cabin bag rules AGAIN. Seems like every 6 months there's a new policy. I got stung at Stansted last week — had to pay £55 for a bag that was fine 3 months ago. Anyone else?",
    views: 891, createdAt: daysAgo(5),
    replies: [
      { userId: 105, content: "Yep. Got caught at Gatwick in April. The dimensions haven't changed but they're enforcing it much more strictly now. They're using those metal cage things at the gate.", createdAt: daysAgo(5) },
      { userId: 113, content: "This is why I fly BA when I can. Yes it costs more but the hidden fees on Ryanair make it comparable once you add bags, seat selection and the inevitable gate charge.", createdAt: daysAgo(4) },
      { userId: 109, content: "I work ramp at LHR and honestly the gate agents are under pressure to hit revenue targets. It's not personal — they have to meet a number.", createdAt: daysAgo(4) },
      { userId: 116, content: "The trick is to wear as many layers as possible and stuff your pockets. I once wore 3 jumpers through a Ryanair gate. No shame.", createdAt: daysAgo(3) },
      { userId: 114, content: "😂 @FlightAware_Fan that's commitment. I might try the 3-jumper strategy next time.", createdAt: daysAgo(2) },
      { userId: 119, content: "Ryanair's whole business model is built on ancillary revenue. The base fare is a loss leader. Just factor it in when you book and you won't be surprised.", createdAt: daysAgo(2) },
      { userId: 122, content: "The real question is why we keep flying them if we hate them so much 😂 Because they're cheap and they actually get you there on time more often than most.", createdAt: daysAgo(1) },
    ]
  },
  {
    boardId: 1, userId: 108,
    title: "The A380 retirement — a genuine tragedy or just business?",
    content: "Flew the Qantas A380 Sydney-London last month and it was genuinely the best long-haul experience I've had in 20 years of flying. The fact that this plane is being phased out makes me genuinely sad. Am I alone in this?",
    views: 1204, createdAt: daysAgo(21),
    replies: [
      { userId: 106, content: "You are absolutely NOT alone. The A380 is the pinnacle of commercial aviation. The upper deck bar on Emirates, the showers on first class — nothing else comes close.", createdAt: daysAgo(21) },
      { userId: 113, content: "From a pure business perspective it makes sense. Twin-engine jets are more efficient and the hub-and-spoke model that the A380 was built for is dying. But as an aviation enthusiast it hurts.", createdAt: daysAgo(20) },
      { userId: 104, content: "The noise reduction alone is remarkable. You don't realise how quiet the cabin is until you've flown it. The 4-engine vibration is just... different. More stable.", createdAt: daysAgo(20) },
      { userId: 114, content: "Airbus killed it themselves by not developing a neo version. If they'd put the latest engines on it, airlines would have kept ordering. Short-sighted decision.", createdAt: daysAgo(19) },
      { userId: 108, content: "The QF A380 has the best economy seat pitch of any long-haul carrier I've flown. 34 inches! Most are 31-32. That extra 2-3 inches makes a huge difference on a 22-hour flight.", createdAt: daysAgo(18) },
      { userId: 121, content: "I cried when they announced the last Qantas A380 retirement date. Not ashamed to admit it. Some planes are more than just machines.", createdAt: daysAgo(17) },
      { userId: 124, content: "The economics don't lie though. 4 engines = 4x the maintenance, 4x the fuel burn per engine. Airlines aren't charities. The 787 and A350 do the same job more cheaply.", createdAt: daysAgo(16) },
    ]
  },
  {
    boardId: 1, userId: 121,
    title: "Emirates vs Singapore Airlines — who actually has the better product?",
    content: "This debate comes up every year. I've flown both in business class and honestly I go back and forth. Emirates has the bar and the showmanship, SQ has the service and the food. What's the community verdict?",
    views: 2341, createdAt: daysAgo(8),
    replies: [
      { userId: 106, content: "Emirates for the experience, SQ for the service. Emirates is like a nightclub at 40,000 feet. SQ is a fine dining restaurant. Depends what you're after.", createdAt: daysAgo(8) },
      { userId: 115, content: "As someone who's worked for a major carrier — SQ crew training is genuinely on another level. The attention to detail in service is unmatched. Emirates is flashier but SQ is more refined.", createdAt: daysAgo(7) },
      { userId: 120, content: "The SQ Suite on the A380 upper deck is the best commercial aviation product ever made. Full stop. Nothing Emirates offers in first class comes close to a private cabin with a double bed.", createdAt: daysAgo(7) },
      { userId: 104, content: "Emirates 777 business class is getting a bit dated now. The new QSuite from Qatar is arguably better than both. Don't sleep on QR.", createdAt: daysAgo(6) },
      { userId: 121, content: "Qatar's QSuite is incredible but the airline has had some serious issues with crew treatment. Hard to separate the product from the ethics for me.", createdAt: daysAgo(6) },
      { userId: 123, content: "For pure seat comfort I'd rank: SQ Suite > QR QSuite > EK First > EK Business. For food: SQ > QR > EK. For entertainment: EK wins easily.", createdAt: daysAgo(5) },
    ]
  },
  {
    boardId: 1, userId: 109,
    title: "Ground handling at LHR is an absolute shambles — anyone else?",
    content: "I work ramp at Heathrow and the past 3 months have been chaos. Understaffing, equipment failures, bags going to wrong terminals. The whole system is at breaking point. Passengers are taking the brunt of it.",
    views: 567, createdAt: daysAgo(3),
    replies: [
      { userId: 105, content: "I flew through LHR last week and my bag went to T5 when I was in T3. Took 4 hours to get it. No apology, no explanation. Just handed it back like nothing happened.", createdAt: daysAgo(3) },
      { userId: 108, content: "The problem is the outsourcing model. When you contract out ground handling to the lowest bidder, you get what you pay for. It was better when airlines ran their own operations.", createdAt: daysAgo(2) },
      { userId: 112, content: "I've been spotting at LHR for 15 years and the number of ground incidents I've seen in the last 12 months is genuinely alarming. Tug collisions, jet bridges in the wrong position, you name it.", createdAt: daysAgo(2) },
      { userId: 109, content: "The pay is the core issue. You can earn more stacking shelves at Tesco than doing a safety-critical job on the ramp. Until that changes, nothing else will.", createdAt: daysAgo(1) },
    ]
  },

  // ── BOARD 2: Military Tech ─────────────────────────────────────────────────
  {
    boardId: 2, userId: 111,
    title: "F-35 vs Eurofighter Typhoon — which would you rather fly?",
    content: "Purely hypothetical — if you could fly one military jet, which would it be? The F-35's stealth and sensor fusion, or the Typhoon's raw agility and thrust-to-weight ratio? I know which I'd pick but curious what the community thinks.",
    views: 1567, createdAt: daysAgo(18),
    replies: [
      { userId: 103, content: "Typhoon all day. The F-35 is a computer that happens to have a cockpit. The Typhoon actually feels like you're flying. The DASS system and the supercruise capability are just incredible.", createdAt: daysAgo(18) },
      { userId: 111, content: "I'd take the F-35. The sensor fusion is genuinely revolutionary — you can see the entire battlespace in a way no other aircraft can. It's not just a jet, it's a flying command centre.", createdAt: daysAgo(17) },
      { userId: 124, content: "The F-35 is a compromise aircraft. It tried to be three things (A, B, C variants) and ended up being mediocre at all of them. The Typhoon was designed for one job and it does it brilliantly.", createdAt: daysAgo(17) },
      { userId: 118, content: "Having spoken to RAF pilots who've flown both — the consensus seems to be that the Typhoon is more fun to fly but the F-35 is more capable in a real-world scenario.", createdAt: daysAgo(16) },
      { userId: 103, content: "The Typhoon's ability to supercruise at Mach 1.5 without afterburner is just insane. The F-35 can barely break Mach 1.6 WITH afterburner. In a turning fight the Typhoon wins every time.", createdAt: daysAgo(15) },
    ]
  },
  {
    boardId: 2, userId: 118,
    title: "The SR-71 Blackbird — could anything built today match it?",
    content: "The SR-71 was retired in 1998 and it's STILL the fastest air-breathing aircraft ever built. 26 years later and nothing has surpassed Mach 3.2. What does that say about modern aerospace priorities?",
    views: 2890, createdAt: daysAgo(30),
    replies: [
      { userId: 111, content: "It says that speed is no longer the priority — stealth is. The SR-71 was visible on radar from miles away. A modern stealth drone can do the same reconnaissance job without being detected at all.", createdAt: daysAgo(30) },
      { userId: 124, content: "The engineering that went into the SR-71 was extraordinary. The titanium skin that expanded by several inches at operating temperature. The fuel that was used as a coolant. Nothing like it before or since.", createdAt: daysAgo(29) },
      { userId: 103, content: "The SR-72 is supposedly in development and will hit Mach 6. But we've been hearing that for 10 years. Lockheed's Skunk Works is notoriously secretive so who knows what's actually flying.", createdAt: daysAgo(28) },
      { userId: 118, content: "The fact that it was designed in the 1950s and flew in 1964 makes it even more remarkable. Kelly Johnson and the Skunk Works team were operating decades ahead of everyone else.", createdAt: daysAgo(27) },
      { userId: 122, content: "I got to see one up close at the Smithsonian. The sheer size of it is shocking — you don't realise from photos how massive it is. And the engines are just enormous.", createdAt: daysAgo(26) },
    ]
  },
  {
    boardId: 2, userId: 103,
    title: "Ukraine war — what has it taught us about modern air combat?",
    content: "The conflict has been a fascinating and sobering lesson in modern warfare. The dominance of drones, the vulnerability of expensive aircraft to cheap missiles, the importance of air defence. What are the key takeaways for aviation?",
    views: 3456, createdAt: daysAgo(12),
    replies: [
      { userId: 111, content: "The main lesson is that air superiority is no longer guaranteed by having the best jets. A $200 Shahed drone can take out a $50m aircraft. The economics of air warfare have completely changed.", createdAt: daysAgo(12) },
      { userId: 118, content: "The F-16 transfers have been interesting to watch. Even a 40-year-old airframe is still highly capable when paired with modern weapons and tactics. Platform age matters less than weapons and training.", createdAt: daysAgo(11) },
      { userId: 124, content: "The most important lesson is EW — electronic warfare. The side that can jam and spoof the other's sensors wins. Russia's GPS jamming has been remarkably effective at degrading Western precision weapons.", createdAt: daysAgo(11) },
      { userId: 103, content: "The death of the helicopter as a frontline asset is significant. MANPADS have made low-altitude flight extremely dangerous. The Apache and similar platforms need serious rethinking.", createdAt: daysAgo(10) },
    ]
  },

  // ── BOARD 3: Flight Training ───────────────────────────────────────────────
  {
    boardId: 3, userId: 107,
    title: "PPL to CPL — how long did it realistically take you?",
    content: "I'm 40 hours into my PPL training and thinking about the long-term path to commercial. The official answer is 200 hours for a CPL but I've heard real-world timelines vary wildly. How long did the full journey take for those who've done it?",
    views: 1890, createdAt: daysAgo(25),
    replies: [
      { userId: 100, content: "PPL took me 65 hours (weather delays and scheduling gaps). CPL took another 18 months after that. Total time from first lesson to CPL: about 3 years. Frozen ATPL exams took another year on top.", createdAt: daysAgo(25) },
      { userId: 118, content: "Integrated course is the fastest route — 18 months from zero to frozen ATPL. Modular is cheaper but takes 3-5 years typically. Depends entirely on your budget and life situation.", createdAt: daysAgo(24) },
      { userId: 107, content: "The exam side is what I'm most nervous about. 14 ATPL subjects is a lot to get through while also flying.", createdAt: daysAgo(24) },
      { userId: 100, content: "The exams are manageable if you're disciplined. Bristol Ground School and Padpilot are the two main resources. Give yourself 18 months for the exams and don't rush them.", createdAt: daysAgo(23) },
      { userId: 122, content: "The biggest variable is money. If you can fund continuous training without gaps, 2 years is realistic. Most people have to stop and start which drags it out to 4-5 years.", createdAt: daysAgo(22) },
      { userId: 119, content: "Don't forget the type rating at the end — another £25-30k after you've already spent £80-100k on the CPL/IR. The total cost to a first officer seat is eye-watering.", createdAt: daysAgo(21) },
      { userId: 107, content: "That's... a lot. Is it still worth it financially in 2025?", createdAt: daysAgo(20) },
      { userId: 100, content: "Captain salaries at the majors are genuinely excellent now — £150k+ at BA and Virgin. But you need to survive the first 5-8 years as an FO on relatively modest pay. It's a long game.", createdAt: daysAgo(19) },
    ]
  },
  {
    boardId: 3, userId: 119,
    title: "Best UK flight schools for PPL — 2025 recommendations?",
    content: "Starting my PPL this year and trying to decide between a few schools. Looking at Stapleford, Wycombe Air Centre, and Bournemouth. Anyone have recent experience with any of these? Quality of instruction and aircraft condition are my priorities.",
    views: 1234, createdAt: daysAgo(7),
    replies: [
      { userId: 107, content: "I'm at Stapleford now and really happy with it. The instructors are experienced and the Cessna 172s are well maintained. The airspace around there is busy which is actually great for training.", createdAt: daysAgo(7) },
      { userId: 122, content: "Wycombe has a good reputation but it's expensive. The facility is excellent though — proper IFR training environment. If budget isn't a constraint, it's probably the best in the South East.", createdAt: daysAgo(6) },
      { userId: 118, content: "Bournemouth is great if you want to do modular all the way through. The proximity to controlled airspace and the ILS approaches make it excellent for IR training later on.", createdAt: daysAgo(6) },
      { userId: 100, content: "Wherever you go, the quality of YOUR instructor matters more than the school's reputation. Ask to meet the instructor before you commit. Chemistry and communication style make a huge difference.", createdAt: daysAgo(5) },
      { userId: 119, content: "Good point about the instructor. I've heard horror stories of people going through 3-4 instructors at the same school because of personality clashes. It delays everything.", createdAt: daysAgo(4) },
    ]
  },
  {
    boardId: 3, userId: 122,
    title: "Night rating — is it worth doing straight after PPL?",
    content: "Just passed my PPL skills test last week! Instructor is suggesting I crack on with the night rating while I'm in the groove. Is it worth doing immediately or should I build some day hours first?",
    views: 678, createdAt: daysAgo(2),
    replies: [
      { userId: 100, content: "Congratulations! Do it immediately. The night rating is only 5 hours and while you're in training mode it's easy. The spatial disorientation awareness you gain is invaluable.", createdAt: daysAgo(2) },
      { userId: 107, content: "Congrats! I did mine 2 weeks after my PPL. The first solo night circuit is one of the most memorable experiences in aviation. Highly recommend.", createdAt: daysAgo(1) },
      { userId: 119, content: "The night rating opens up a lot of doors for touring. Flying into a lit-up city at night is something else. Do it now while the training mindset is fresh.", createdAt: daysAgo(1) },
      { userId: 118, content: "One thing to be aware of — night flying requires more precise instrument scanning. It's actually great prep for IR training later. Definitely do it.", createdAt: hoursAgo(18) },
    ]
  },

  // ── BOARD 4: Aviation Incidents ────────────────────────────────────────────
  {
    boardId: 4, userId: 117,
    title: "The Heathrow near-miss last week — what do we know?",
    content: "The AAIB preliminary report on the recent near-miss at Heathrow is out. Two aircraft came within 200ft vertically and less than a mile horizontally on approach. ATC comms appear to have been a factor. Anyone read the full report?",
    views: 4567, createdAt: daysAgo(6),
    replies: [
      { userId: 108, content: "I've read it. The key issue was a frequency change that wasn't acknowledged properly. The aircraft was still on the wrong frequency when the conflict developed. Classic comms breakdown.", createdAt: daysAgo(6) },
      { userId: 100, content: "TCAS resolution advisory saved it. Both crews followed the RA correctly which is exactly what you're trained to do. The system worked as designed.", createdAt: daysAgo(5) },
      { userId: 117, content: "The worrying part is how close it got before TCAS triggered. The separation had already degraded significantly before the automated system intervened.", createdAt: daysAgo(5) },
      { userId: 108, content: "LHR handles 1,300+ movements a day. The statistical probability of incidents is higher than almost any other airport in the world. It's a miracle there aren't more.", createdAt: daysAgo(4) },
      { userId: 112, content: "I was spotting at the Myrtle Ave viewpoint that day. Didn't see the incident itself but the radio traffic was noticeably tense for about 10 minutes after.", createdAt: daysAgo(4) },
      { userId: 117, content: "The AAIB will do a full investigation. Hopefully it leads to procedural changes. Near-misses are the system working — they're how we learn before something worse happens.", createdAt: daysAgo(3) },
    ]
  },
  {
    boardId: 4, userId: 108,
    title: "Air France 447 — 15 years on, what did aviation learn?",
    content: "It's been 15 years since AF447 went down in the Atlantic. The investigation revealed systemic issues with pilot training, automation dependency, and human factors that led to sweeping changes across the industry. What's the legacy?",
    views: 5678, createdAt: daysAgo(45),
    replies: [
      { userId: 100, content: "The biggest legacy is the overhaul of upset prevention and recovery training (UPRT). Before AF447, many airlines did minimal stall training in the jet. Now it's mandatory and much more rigorous.", createdAt: daysAgo(45) },
      { userId: 118, content: "The automation dependency issue is still not fully solved. We're creating pilots who are excellent at managing systems but less confident when those systems fail. AF447 showed where that leads.", createdAt: daysAgo(44) },
      { userId: 117, content: "The pitot tube icing issue was known. Airbus had issued service bulletins about it. The fact that AF hadn't replaced them yet is the most damning part of the whole story.", createdAt: daysAgo(44) },
      { userId: 108, content: "The crew resource management failure is what haunts me. Three pilots in the cockpit and none of them could diagnose what was happening. The communication breakdown was catastrophic.", createdAt: daysAgo(43) },
      { userId: 103, content: "The recovery was actually possible right up until the last few seconds. If any of the crew had pushed the nose down and released the sidestick, the aircraft would have recovered. Tragic.", createdAt: daysAgo(42) },
      { userId: 124, content: "The dual sidestick design has been criticised since AF447. On an Airbus, if both pilots are inputting simultaneously, the inputs are averaged. The crew didn't know what the other was doing.", createdAt: daysAgo(41) },
    ]
  },
  {
    boardId: 4, userId: 117,
    title: "Boeing 737 MAX — do you trust it now?",
    content: "The 737 MAX has been back in service for 4 years now with the MCAS fix and additional training requirements. Two fatal crashes, 346 lives lost. Do you personally feel comfortable flying on one? Honest answers only.",
    views: 8901, createdAt: daysAgo(10),
    replies: [
      { userId: 113, content: "Yes. The MCAS fix is comprehensive and the additional pilot training is solid. The aircraft has now flown millions of hours since return to service without incident. The data supports flying it.", createdAt: daysAgo(10) },
      { userId: 114, content: "I'd fly it but I'd be lying if I said I wasn't slightly more aware of it. The reputational damage Boeing did to itself is enormous. The cover-up was worse than the original design flaw.", createdAt: daysAgo(9) },
      { userId: 117, content: "The cover-up is what I can't get past. Boeing knew about MCAS issues and chose not to disclose them to pilots or regulators. That's not an engineering failure, that's a moral failure.", createdAt: daysAgo(9) },
      { userId: 100, content: "From a pilot's perspective — the MAX is now one of the most scrutinised aircraft in history. It's probably safer than most jets as a result. Every system has been examined in detail.", createdAt: daysAgo(8) },
      { userId: 108, content: "The real question is whether Boeing's safety culture has actually changed. The recent door plug incident on the 737-9 MAX suggests it hasn't. The problems go deeper than one aircraft.", createdAt: daysAgo(8) },
      { userId: 122, content: "I've flown on it twice since the return to service. Perfectly normal flights. But I did check FlightAware to confirm the aircraft type before booking, which I never used to do.", createdAt: daysAgo(7) },
      { userId: 121, content: "The families of the 346 victims deserve better than 'the data supports flying it.' Boeing should face proper criminal accountability. The fines they paid were a rounding error for a company that size.", createdAt: daysAgo(6) },
    ]
  },

  // ── BOARD 5: Spotting & Photography ───────────────────────────────────────
  {
    boardId: 5, userId: 112,
    title: "Best spotting locations at Manchester Airport 2025?",
    content: "Heading up to Manchester next weekend specifically for spotting. Never been before — where are the best vantage points? Any tips on what to bring and the best time of day for light?",
    views: 892, createdAt: daysAgo(4),
    replies: [
      { userId: 101, content: "Runway Visitor Park is the obvious one — you can get right up to the fence. The Concorde is there too which is worth seeing. Bring a 400mm+ lens for the far runway.", createdAt: daysAgo(4) },
      { userId: 116, content: "The field on Shadowmoss Road is underrated. You get great side-on shots of aircraft on the 23R threshold. Morning light is perfect there.", createdAt: daysAgo(3) },
      { userId: 112, content: "Is the Runway Visitor Park still open? I heard there were some access issues last year.", createdAt: daysAgo(3) },
      { userId: 101, content: "Yes it's open. Check the website before you go as opening times vary. The viewing area is excellent and the staff are really helpful with spotters.", createdAt: daysAgo(2) },
      { userId: 110, content: "For contrail photography, get there before 8am. The early morning light with long contrails against a blue sky is stunning. I got my best ever shot at MAN at 7:15am.", createdAt: daysAgo(2) },
      { userId: 112, content: "What's the traffic like on a Saturday? Worth going early?", createdAt: daysAgo(1) },
      { userId: 101, content: "Saturday mornings are great — lots of holiday charter traffic, TUI, Jet2, Ryanair. You'll see a good variety. The long-haul stuff (Emirates, Etihad, Qatar) tends to arrive mid-morning.", createdAt: daysAgo(1) },
    ]
  },
  {
    boardId: 5, userId: 110,
    title: "Share your best aircraft photos — June 2025 thread",
    content: "Monthly photo sharing thread! Post your best shots from this month. Any aircraft, any airport, any conditions. Let's see what you've got. I'll start — attached is a 777F I caught at East Midlands at dusk last week.",
    views: 2341, createdAt: daysAgo(15),
    replies: [
      { userId: 101, content: "Incredible shot! The lighting on that 777F is perfect. I got a great one of the last BA Concorde at Heathrow... oh wait, that was 20 years ago 😂 Here's my best recent — A350 at LHR on a foggy morning.", createdAt: daysAgo(15) },
      { userId: 112, content: "Been at Myrtle Ave a lot this month. Got a stunning shot of a Cathay A350 on short final with the sun directly behind it. The lens flare actually worked in my favour.", createdAt: daysAgo(14) },
      { userId: 116, content: "I've been experimenting with long exposure night shots at Gatwick. The light trails from taxiing aircraft are incredible. Highly recommend trying it if you haven't.", createdAt: daysAgo(13) },
      { userId: 110, content: "Night photography at airports is underrated. The challenge is getting the exposure right when you have a mix of very bright lights and dark areas. What settings are you using @FlightAware_Fan?", createdAt: daysAgo(12) },
      { userId: 116, content: "ISO 800, f/8, 15-30 second exposure on a sturdy tripod. The key is to wait for a gap in aircraft movement so you don't get blurred fuselages. Patience is everything.", createdAt: daysAgo(11) },
    ]
  },
  {
    boardId: 5, userId: 101,
    title: "Sigma 150-600mm vs Canon 100-500mm for spotting — which would you buy?",
    content: "Upgrading my lens setup and torn between these two. The Sigma is cheaper but the Canon has better autofocus on my R5. Anyone used both for aviation photography? The reach difference matters at some airports.",
    views: 1456, createdAt: daysAgo(9),
    replies: [
      { userId: 110, content: "Canon 100-500mm on an R5 is a dream combination. The animal eye tracking works brilliantly on aircraft — lock onto the nose and it tracks perfectly. The extra 100mm on the Sigma rarely matters in practice.", createdAt: daysAgo(9) },
      { userId: 112, content: "I use the Sigma on a Sony A1 and it's excellent. The AF isn't as fast as native Sony glass but it's more than adequate for aviation. The extra reach is genuinely useful at bigger airports.", createdAt: daysAgo(8) },
      { userId: 116, content: "The Canon RF 100-500 is optically superior but the price difference is significant. If you're on an R5 and can afford it, go Canon. If budget is a constraint, the Sigma is no slouch.", createdAt: daysAgo(8) },
      { userId: 101, content: "Leaning towards the Canon based on this. The AF advantage on the R5 seems like it would make a real difference for fast-moving subjects.", createdAt: daysAgo(7) },
    ]
  },

  // ── BOARD 6: General Chat ──────────────────────────────────────────────────
  {
    boardId: 6, userId: 120,
    title: "What's your most memorable flight ever?",
    content: "Mine was flying into Hong Kong's old Kai Tak airport in 1997 — the checkerboard approach through the mountains, banking hard over the city at 200 feet. Nothing like it before or since. What's yours?",
    views: 6789, createdAt: daysAgo(60),
    replies: [
      { userId: 106, content: "Kai Tak! I flew in there twice and it never got less terrifying. The IGS approach at night with the city lights below you and the mountains on both sides... absolutely unforgettable.", createdAt: daysAgo(60) },
      { userId: 108, content: "For me it was a Concorde flight from LHR to JFK in 2001. The acceleration on takeoff, hitting Mach 2 over the Atlantic, the curvature of the earth visible from the windows. Nothing has come close.", createdAt: daysAgo(59) },
      { userId: 100, content: "My first solo flight. Took off from Stapleford, flew a circuit, landed. 20 minutes. But the feeling of being completely alone in the aircraft for the first time is impossible to describe.", createdAt: daysAgo(59) },
      { userId: 121, content: "Singapore Airlines A380 upper deck, Singapore to London. Woke up over the Himalayas at sunrise with a glass of champagne. I've never felt more at peace.", createdAt: daysAgo(58) },
      { userId: 115, content: "A positioning flight on an empty 747-400 from Hong Kong to Sydney. Just 12 crew on a 400-seat aircraft. We spread out across the whole plane. The captain let us take turns in the jump seat.", createdAt: daysAgo(57) },
      { userId: 107, content: "My first lesson in a Cessna 152. The instructor let me take the controls at 2,000 feet over the Essex countryside. I knew immediately that this was what I wanted to do with my life.", createdAt: daysAgo(56) },
      { userId: 120, content: "These are all brilliant. The Concorde one @RetiredATC_EGLL — I'm genuinely envious. What was the noise like inside the cabin?", createdAt: daysAgo(55) },
      { userId: 108, content: "Quieter than you'd expect! The engines were behind you and the cabin was well insulated. The most noticeable thing was the heat — the windows were warm to the touch from aerodynamic heating.", createdAt: daysAgo(54) },
    ]
  },
  {
    boardId: 6, userId: 116,
    title: "FlightRadar24 vs FlightAware — which do you use and why?",
    content: "I've been using FR24 for years but a mate keeps telling me FlightAware is better for certain things. What does the community use? Any other tracking apps worth knowing about?",
    views: 1234, createdAt: daysAgo(11),
    replies: [
      { userId: 101, content: "FR24 for live tracking — the interface is better and the coverage is more comprehensive in Europe. FlightAware for historical data and US domestic flights. Both have their strengths.", createdAt: daysAgo(11) },
      { userId: 112, content: "Plane Finder is underrated. The 3D view is incredible and the AR mode where you point your phone at the sky and it identifies aircraft is genuinely impressive.", createdAt: daysAgo(10) },
      { userId: 116, content: "I didn't know Plane Finder had an AR mode! Downloading it now.", createdAt: daysAgo(10) },
      { userId: 110, content: "ADSBexchange is the one for serious enthusiasts — it shows military and government aircraft that FR24 filters out. You'd be amazed what's flying around that you never see on the commercial apps.", createdAt: daysAgo(9) },
      { userId: 116, content: "@ContrailChaser that's fascinating. I've started using ADSBexchange and already spotted several interesting aircraft I'd never have seen on FR24.", createdAt: daysAgo(8) },
    ]
  },
  {
    boardId: 6, userId: 124,
    title: "The pilot shortage — is it real or manufactured?",
    content: "Airlines keep talking about a global pilot shortage but I've spoken to several newly qualified pilots who can't get jobs. Is the shortage real, or is it a narrative to justify keeping salaries low for junior pilots while paying captains more?",
    views: 3456, createdAt: daysAgo(20),
    replies: [
      { userId: 100, content: "It's real at the captain level, manufactured at the FO level. There are plenty of qualified FOs. The shortage is of experienced captains who can upgrade, which is a pipeline problem that takes years to fix.", createdAt: daysAgo(20) },
      { userId: 118, content: "The regional carriers in the US are genuinely struggling. The pay at regionals is so poor that qualified pilots are choosing other careers. The shortage at that level is absolutely real.", createdAt: daysAgo(19) },
      { userId: 107, content: "As someone going through training right now, the job market feels uncertain. Airlines are hiring but the terms for new joiners aren't great. The 'shortage' doesn't seem to be translating into better conditions for junior pilots.", createdAt: daysAgo(19) },
      { userId: 100, content: "Give it 5-7 years. The mass retirements of the baby boomer generation of captains will hit hard. The shortage will become very real and salaries will reflect it.", createdAt: daysAgo(18) },
      { userId: 124, content: "The airlines' response to the shortage has been to lobby for lower training requirements rather than raise pay. That tells you everything about how seriously they take it.", createdAt: daysAgo(17) },
      { userId: 119, content: "The 1500-hour rule in the US was introduced after Colgan Air 3407. Airlines fought it tooth and nail. Now they're trying to water it down again. Safety vs profit, same old story.", createdAt: daysAgo(16) },
    ]
  },
  {
    boardId: 6, userId: 115,
    title: "Cabin crew life — ask me anything",
    content: "I've been cabin crew for 12 years at a major UK carrier. Long haul mostly. Happy to answer genuine questions about the job, the lifestyle, what passengers do that drives us mad, what we actually think of you lot. Fire away.",
    views: 12345, createdAt: daysAgo(35),
    replies: [
      { userId: 121, content: "What's the most annoying thing passengers do that they think is fine but really isn't?", createdAt: daysAgo(35) },
      { userId: 115, content: "Clicking fingers or clapping to get attention. We're not dogs. Press the call button. Also: taking shoes and socks off and walking barefoot to the toilet. The floor is not clean.", createdAt: daysAgo(34) },
      { userId: 123, content: "Do you actually care which seat we sit in or is that just a rule for rules' sake?", createdAt: daysAgo(34) },
      { userId: 115, content: "Seating matters for weight and balance calculations, especially on smaller aircraft. On a 777 with 300 passengers it's less critical but we still need to know where everyone is for evacuation purposes.", createdAt: daysAgo(33) },
      { userId: 120, content: "What do crew actually do during the long cruise phase when passengers are asleep?", createdAt: daysAgo(33) },
      { userId: 115, content: "We take rest breaks in the crew rest area (usually above the cabin on widebodies). We eat, watch films, sleep. On a 12-hour flight each crew member gets about 3-4 hours rest. It's not glamorous.", createdAt: daysAgo(32) },
      { userId: 109, content: "What do you think of ground crew? Do you notice us at all?", createdAt: daysAgo(32) },
      { userId: 115, content: "Ground crew are the unsung heroes of aviation. The turnaround only happens because of you. We notice when it goes smoothly and we definitely notice when it doesn't. Respect from us is genuine.", createdAt: daysAgo(31) },
      { userId: 116, content: "Have you ever been on a flight where you genuinely thought something was seriously wrong?", createdAt: daysAgo(30) },
      { userId: 115, content: "Yes. Once. Engine issue on a 767 over the North Atlantic. We diverted to Gander. The professionalism of the flight deck was remarkable — calm, methodical, no drama. That's what training does.", createdAt: daysAgo(29) },
    ]
  },
  {
    boardId: 6, userId: 113,
    title: "Airbus vs Boeing — settle the debate once and for all",
    content: "I know this is the aviation equivalent of asking someone their religion but I want a proper debate. Not just 'I prefer Airbus' or 'Boeing forever'. Give me actual technical, operational, or commercial reasons for your preference.",
    views: 9876, createdAt: daysAgo(40),
    replies: [
      { userId: 114, content: "Airbus. The fly-by-wire system with flight envelope protection means the aircraft simply won't let you exceed its limits. That's a fundamental safety advantage. The sidestick takes getting used to but it's more ergonomic.", createdAt: daysAgo(40) },
      { userId: 113, content: "Boeing. The yoke gives you tactile feedback that the sidestick doesn't. You feel what the aircraft is doing. The 777 is the greatest commercial aircraft ever built — reliable, efficient, and a joy to fly.", createdAt: daysAgo(39) },
      { userId: 100, content: "I've flown both. The Boeing philosophy of 'pilot in command' vs Airbus 'pilot and computer in command' is a genuine philosophical difference, not just marketing. Neither is objectively better.", createdAt: daysAgo(39) },
      { userId: 104, content: "From an engineering perspective, the A350 is a masterpiece. 53% composite materials, the most fuel-efficient widebody ever built, and the cabin environment (humidity, pressure) is genuinely better for passengers.", createdAt: daysAgo(38) },
      { userId: 113, content: "The 787 was equally revolutionary when it launched. The carbon fibre fuselage, the large windows, the higher cabin pressure. Boeing innovated first, Airbus refined it.", createdAt: daysAgo(37) },
      { userId: 117, content: "The safety record argument is interesting. Both manufacturers have had catastrophic failures. The 737 MAX was Boeing's, the A320 had its issues in the early days. Neither is inherently safer.", createdAt: daysAgo(36) },
      { userId: 114, content: "The MAX situation fundamentally changed how I view Boeing as a company. The engineering failure I can understand. The cover-up and the pressure on the FAA I cannot.", createdAt: daysAgo(35) },
    ]
  },
];

// ─── Insert threads and replies ───────────────────────────────────────────────
let threadCount = 0;
let replyCount = 0;

for (const t of threads) {
  const [result] = await conn.execute(
    `INSERT INTO forum_threads (boardId, userId, title, content, views, replyCount, isPinned, isLocked, lastReplyAt, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?)`,
    [t.boardId, t.userId, t.title, t.content, t.views, t.replies.length,
     t.replies.length > 0 ? t.replies[t.replies.length - 1].createdAt : t.createdAt,
     t.createdAt, t.createdAt]
  );
  const threadId = result.insertId;
  threadCount++;

  for (const r of t.replies) {
    await conn.execute(
      `INSERT INTO forum_replies (threadId, userId, content, isDeleted, createdAt, updatedAt)
       VALUES (?, ?, ?, 0, ?, ?)`,
      [threadId, r.userId, r.content, r.createdAt, r.createdAt]
    );
    replyCount++;
  }
}

console.log(`\n✅ Forum seeded:`);
console.log(`   ${threadCount} threads`);
console.log(`   ${replyCount} replies`);
console.log(`   ${fakeUsers.length} community members`);

await conn.end();
console.log("\n🎉 Done!");
