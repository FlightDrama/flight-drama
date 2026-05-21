import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// ─── Seed Authors ─────────────────────────────────────────────────────────────
await connection.execute(`DELETE FROM authors`);
await connection.execute(`INSERT INTO authors (id, name, slug, bio, avatar, twitterHandle) VALUES
(1, 'Josh', 'josh', 'Senior aviation journalist and commercial pilot with 12 years of experience covering the global aviation industry.', 'https://api.dicebear.com/7.x/avataaars/svg?seed=josh', '@JoshFlightDrama'),
(2, 'Sarah Mitchell', 'sarah-mitchell', 'Aviation safety analyst and former air traffic controller. Passionate about making aviation accessible to everyone.', 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah', '@SarahAviationHQ'),
(3, 'Marcus Webb', 'marcus-webb', 'Military aviation specialist and defence correspondent. Covers fighter jets, military operations, and aerospace technology.', 'https://api.dicebear.com/7.x/avataaars/svg?seed=marcus', '@MarcusWebbAero'),
(4, 'Priya Sharma', 'priya-sharma', 'Travel and airline industry reporter. Covers passenger experience, airline routes, and airport developments worldwide.', 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya', '@PriyaFlyHigh')`);

// ─── Seed Categories ──────────────────────────────────────────────────────────
await connection.execute(`DELETE FROM categories`);
await connection.execute(`INSERT INTO categories (id, name, slug, description, colour) VALUES
(1, 'All News', 'all-news', 'The latest aviation news from around the world', '#f5c518'),
(2, 'Commercial Aviation', 'commercial-aviation', 'Airlines, airports, routes, and passenger experience', '#3b82f6'),
(3, 'Military Aviation', 'military-aviation', 'Fighter jets, military operations, and defence aerospace', '#ef4444'),
(4, 'Flight Training', 'flight-training', 'Pilot training, licences, and flight schools', '#22c55e'),
(5, 'Aircraft Tech', 'aircraft-tech', 'Aircraft engineering, new models, and aerospace innovation', '#8b5cf6'),
(6, 'Aviation Incidents', 'aviation-incidents', 'Incident reports, investigations, and safety analysis', '#f97316'),
(7, 'Space & Future', 'space-future', 'Space travel, eVTOL, and the future of aviation', '#06b6d4')`);

// ─── Seed Forum Boards ────────────────────────────────────────────────────────
await connection.execute(`DELETE FROM forum_boards`);
await connection.execute(`INSERT INTO forum_boards (id, name, slug, description, icon, sortOrder) VALUES
(1, 'Commercial Aviation', 'commercial-aviation', 'Discuss airlines, airports, routes, and passenger experiences', 'Plane', 1),
(2, 'Military Tech', 'military-tech', 'Fighter jets, military aircraft, and defence aviation news', 'Shield', 2),
(3, 'Flight Training', 'flight-training', 'Tips, advice, and discussion for student pilots and instructors', 'GraduationCap', 3),
(4, 'Aviation Incidents', 'aviation-incidents', 'Discuss reported incidents, near misses, and safety investigations', 'AlertTriangle', 4),
(5, 'Spotting & Photography', 'spotting-photography', 'Share your best aircraft spotting photos and locations', 'Camera', 5),
(6, 'General Chat', 'general-chat', 'Off-topic aviation banter and community chat', 'MessageCircle', 6)`);

// ─── Seed Newsletter Subscribers ──────────────────────────────────────────────
await connection.execute(`DELETE FROM newsletter_subscribers`);
await connection.execute(`INSERT INTO newsletter_subscribers (email, name, status, source, welcomeEmailSent) VALUES
('demo1@example.com', 'Alex Johnson', 'active', 'homepage', true),
('demo2@example.com', 'Emma Wilson', 'active', 'article', true),
('demo3@example.com', 'Tom Harris', 'active', 'homepage', true),
('demo4@example.com', 'Lucy Brown', 'active', 'forum', true),
('demo5@example.com', 'James Davis', 'active', 'homepage', false),
('demo6@example.com', 'Sophie Taylor', 'unsubscribed', 'homepage', true),
('demo7@example.com', 'Oliver Martin', 'active', 'article', true),
('demo8@example.com', 'Chloe Anderson', 'active', 'homepage', true),
('demo9@example.com', 'Harry Thompson', 'active', 'social', true),
('demo10@example.com', 'Isla White', 'active', 'homepage', false)`);

// ─── Seed Ad Slots ────────────────────────────────────────────────────────────
await connection.execute(`DELETE FROM ad_slots`);
await connection.execute(`INSERT INTO ad_slots (position, label, content, linkUrl, isActive, advertiser) VALUES
('homepage-banner', 'Homepage Top Banner', '<div style="background:#f5c518;padding:20px;text-align:center;font-weight:bold;color:#000">✈ Book Your Flight Training Today — From £99</div>', 'https://example.com/flight-training', true, 'SkyHigh Flight Academy'),
('sidebar-top', 'Sidebar Top Rectangle', '<div style="background:#1a1a1a;padding:15px;text-align:center;color:#f5c518;border:2px solid #f5c518">Aviation Headsets from £299 →</div>', 'https://example.com/headsets', true, 'AviationGear UK'),
('article-mid', 'Article Mid-Content', '<div style="background:#000;padding:15px;text-align:center;color:#fff;border-left:4px solid #f5c518">FlightRadar24 Premium — Track Every Flight Live</div>', 'https://flightradar24.com', true, 'FlightRadar24')`);

// ─── Seed 92 Articles ─────────────────────────────────────────────────────────
await connection.execute(`DELETE FROM articles`);
await connection.execute(`DELETE FROM redirects`);

const aviationImages = [
  'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80',
  'https://images.unsplash.com/photo-1529074963764-98f45c47344b?w=800&q=80',
  'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=800&q=80',
  'https://images.unsplash.com/photo-1474302770737-173ee21bab63?w=800&q=80',
  'https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=800&q=80',
  'https://images.unsplash.com/photo-1569629743817-70d8db6c323b?w=800&q=80',
  'https://images.unsplash.com/photo-1583416750470-965b2707b355?w=800&q=80',
  'https://images.unsplash.com/photo-1601024445121-e5b82f020549?w=800&q=80',
  'https://images.unsplash.com/photo-1559628233-100c798642d4?w=800&q=80',
  'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80',
];

const articles = [
  // Original WP articles (matching the posts seen in screenshots)
  { title: "Why Cargo Planes are Older Than Their Pilots: Economics, Safety, and the Future of Freight", slug: "why-cargo-planes-are-older-than-their-pilots", wpSlug: "why-cargo-planes-are-older-than-their-pilots-economics-safety-and-the-future-of-freight", categoryId: 2, authorId: 1, postType: "article", isFeatured: false, isBreaking: false, views: 52 },
  { title: "Why the Boeing 757 Still Has No Replacement", slug: "why-the-boeing-757-still-has-no-replacement", wpSlug: "why-the-boeing-757-still-has-no-replacement", categoryId: 5, authorId: 1, postType: "article", isFeatured: true, isBreaking: false, views: 23 },
  { title: "44 Years Ago, a DC-10 Slid Off a Boston Runway Into the Harbor — Two Passengers Were Never Found", slug: "44-years-ago-dc-10-boston-runway-harbor", wpSlug: "44-years-ago-a-dc-10-slid-off-a-boston-runway-into-the-harbor-two-passengers-were-never-found", categoryId: 6, authorId: 1, postType: "article", isFeatured: false, isBreaking: false, views: 126 },
  { title: "Flight Attendant Pay Structure: When Flight Attendants Actually Get Paid", slug: "flight-attendant-pay-structure", wpSlug: "flight-attendant-pay-structure-when-flight-attendants-actually-get-paid", categoryId: 2, authorId: 1, postType: "article", isFeatured: false, isBreaking: false, views: 61 },
  { title: "American Airlines Is Adding New Flights to Florida's Luxury Gulf Coast", slug: "american-airlines-new-flights-florida-gulf-coast", wpSlug: "american-airlines-is-adding-new-flights-to-floridas-luxury-gulf-coast", categoryId: 2, authorId: 4, postType: "article", isFeatured: false, isBreaking: false, views: 20 },
  { title: "Why Airlines Still Fly the A340 Even Though It Burns More Fuel Than Anything Else", slug: "why-airlines-still-fly-the-a340", wpSlug: "why-airlines-still-fly-the-a340-even-though-it-burns-more-fuel-than-anything-else", categoryId: 5, authorId: 1, postType: "article", isFeatured: true, isBreaking: false, views: 89 },
  { title: "Delta Flight 234 Emergency Landing in Dublin: What Really Happened at 36,000 Feet", slug: "delta-flight-234-emergency-landing-dublin", wpSlug: "delta-flight-234-emergency-landing-in-dublin-what-really-happened-at-36000-feet", categoryId: 6, authorId: 2, postType: "breaking", isFeatured: true, isBreaking: true, views: 312 },
  // Additional articles to reach 92 total
  { title: "The Last Flying Boeing 727: Why This 60-Year-Old Jet Is Still in the Air", slug: "last-flying-boeing-727", wpSlug: "the-last-flying-boeing-727", categoryId: 5, authorId: 1, postType: "article", isFeatured: false, isBreaking: false, views: 178 },
  { title: "Inside the World's Longest Commercial Flight: Singapore to New York", slug: "worlds-longest-commercial-flight-singapore-new-york", wpSlug: "inside-the-worlds-longest-commercial-flight", categoryId: 2, authorId: 4, postType: "article", isFeatured: true, isBreaking: false, views: 445 },
  { title: "How Air Traffic Controllers Handle 45,000 Flights Per Day", slug: "how-air-traffic-controllers-handle-45000-flights", wpSlug: "how-air-traffic-controllers-handle-45000-flights-per-day", categoryId: 2, authorId: 2, postType: "article", isFeatured: false, isBreaking: false, views: 234 },
  { title: "The F-35 vs F-22: Which Fighter Jet Would Win in a Dogfight?", slug: "f35-vs-f22-which-fighter-jet-wins-dogfight", wpSlug: "f35-vs-f22-which-fighter-jet-wins-dogfight", categoryId: 3, authorId: 3, postType: "article", isFeatured: true, isBreaking: false, views: 891 },
  { title: "Why Pilots Always Land Into the Wind (And What Happens When They Don't)", slug: "why-pilots-always-land-into-the-wind", wpSlug: "why-pilots-always-land-into-the-wind", categoryId: 4, authorId: 1, postType: "article", isFeatured: false, isBreaking: false, views: 156 },
  { title: "The Miracle on the Hudson: 15 Years Later, What We Still Don't Know", slug: "miracle-on-the-hudson-15-years-later", wpSlug: "miracle-on-the-hudson-15-years-later", categoryId: 6, authorId: 2, postType: "article", isFeatured: false, isBreaking: false, views: 567 },
  { title: "Ryanair's Secret to Making Money on £9.99 Flights", slug: "ryanairs-secret-to-making-money-cheap-flights", wpSlug: "ryanairs-secret-to-making-money-on-cheap-flights", categoryId: 2, authorId: 4, postType: "article", isFeatured: false, isBreaking: false, views: 723 },
  { title: "What Really Happens When a Bird Strikes a Jet Engine at 500mph", slug: "what-happens-bird-strike-jet-engine", wpSlug: "what-really-happens-when-a-bird-strikes-a-jet-engine", categoryId: 6, authorId: 1, postType: "article", isFeatured: false, isBreaking: false, views: 389 },
  { title: "The Concorde Crash: How a Piece of Metal Brought Down the World's Fastest Airliner", slug: "concorde-crash-how-metal-brought-down-fastest-airliner", wpSlug: "the-concorde-crash", categoryId: 6, authorId: 2, postType: "article", isFeatured: false, isBreaking: false, views: 1204 },
  { title: "Boeing 737 MAX: The Full Story of How Greed Grounded a Fleet", slug: "boeing-737-max-full-story-greed-grounded-fleet", wpSlug: "boeing-737-max-full-story", categoryId: 5, authorId: 1, postType: "article", isFeatured: true, isBreaking: false, views: 2341 },
  { title: "How to Get Your Private Pilot Licence in the UK: A Complete Guide", slug: "how-to-get-private-pilot-licence-uk", wpSlug: "how-to-get-private-pilot-licence-uk", categoryId: 4, authorId: 2, postType: "article", isFeatured: false, isBreaking: false, views: 445 },
  { title: "The Airbus A380 Is Being Retired — Here's Why That's a Tragedy", slug: "airbus-a380-being-retired-tragedy", wpSlug: "airbus-a380-being-retired", categoryId: 5, authorId: 1, postType: "article", isFeatured: false, isBreaking: false, views: 678 },
  { title: "United Airlines Just Became the First US Airline to Order the A350", slug: "united-airlines-first-us-airline-order-a350", wpSlug: "united-airlines-first-us-airline-order-a350", categoryId: 2, authorId: 4, postType: "breaking", isFeatured: false, isBreaking: true, views: 234 },
  { title: "The Martin-Baker Ejection Seat That Has Saved 7,826 Lives", slug: "martin-baker-ejection-seat-saved-7826-lives", wpSlug: "martin-baker-ejection-seat", categoryId: 3, authorId: 3, postType: "article", isFeatured: false, isBreaking: false, views: 567 },
  { title: "Southwest Airlines Banned a Cessna From Flying for 60 Days — Here's Why", slug: "southwest-airlines-banned-cessna-60-days", wpSlug: "southwest-airlines-banned-cessna-60-days", categoryId: 6, authorId: 2, postType: "article", isFeatured: false, isBreaking: false, views: 189 },
  { title: "A Robot Flew on a Passenger Plane for the First Time — Here's What Happened", slug: "robot-flew-passenger-plane-first-time", wpSlug: "robot-flew-passenger-plane-first-time", categoryId: 7, authorId: 1, postType: "article", isFeatured: false, isBreaking: false, views: 445 },
  { title: "Airline Pilots Are Now Making So Much Some Captains Earn Nearly £500,000 a Year", slug: "airline-pilots-earning-500000-year", wpSlug: "airline-pilots-earning-500000-year", categoryId: 2, authorId: 4, postType: "article", isFeatured: true, isBreaking: false, views: 1567 },
  { title: "This McDonald's Lets You Eat Inside a Real Boeing 727", slug: "mcdonalds-eat-inside-boeing-727", wpSlug: "mcdonalds-eat-inside-boeing-727", categoryId: 2, authorId: 4, postType: "article", isFeatured: false, isBreaking: false, views: 892 },
  { title: "They Kept This Cessna Flying for 60 Days Without Landing — Here's How", slug: "cessna-flying-60-days-without-landing", wpSlug: "cessna-flying-60-days-without-landing", categoryId: 5, authorId: 1, postType: "article", isFeatured: false, isBreaking: false, views: 334 },
  { title: "The Deadliest Aviation Disaster You've Never Heard Of", slug: "deadliest-aviation-disaster-youve-never-heard-of", wpSlug: "deadliest-aviation-disaster-youve-never-heard-of", categoryId: 6, authorId: 2, postType: "article", isFeatured: false, isBreaking: false, views: 2100 },
  { title: "How SpaceX Is Changing Commercial Aviation Forever", slug: "spacex-changing-commercial-aviation-forever", wpSlug: "spacex-changing-commercial-aviation-forever", categoryId: 7, authorId: 1, postType: "article", isFeatured: false, isBreaking: false, views: 456 },
  { title: "The World's Most Dangerous Airport: Lukla, Nepal", slug: "worlds-most-dangerous-airport-lukla-nepal", wpSlug: "worlds-most-dangerous-airport-lukla-nepal", categoryId: 2, authorId: 4, postType: "article", isFeatured: false, isBreaking: false, views: 789 },
  { title: "What Happens to Your Body at 35,000 Feet", slug: "what-happens-to-your-body-at-35000-feet", wpSlug: "what-happens-to-your-body-at-35000-feet", categoryId: 2, authorId: 2, postType: "article", isFeatured: false, isBreaking: false, views: 1234 },
  { title: "The Pilot Who Landed a Plane With No Engines — Twice", slug: "pilot-landed-plane-no-engines-twice", wpSlug: "pilot-landed-plane-no-engines-twice", categoryId: 6, authorId: 2, postType: "article", isFeatured: true, isBreaking: false, views: 3456 },
  { title: "Inside Heathrow's Secret Underground World", slug: "inside-heathrows-secret-underground-world", wpSlug: "inside-heathrows-secret-underground-world", categoryId: 2, authorId: 4, postType: "article", isFeatured: false, isBreaking: false, views: 567 },
  { title: "Why the SR-71 Blackbird Is Still the Fastest Plane Ever Built", slug: "sr-71-blackbird-fastest-plane-ever-built", wpSlug: "sr-71-blackbird-fastest-plane-ever-built", categoryId: 3, authorId: 3, postType: "article", isFeatured: true, isBreaking: false, views: 1890 },
  { title: "The Truth About How Airlines Make Their Money (It's Not Ticket Sales)", slug: "truth-about-how-airlines-make-money", wpSlug: "truth-about-how-airlines-make-money", categoryId: 2, authorId: 4, postType: "article", isFeatured: false, isBreaking: false, views: 2345 },
  { title: "Easyjet vs Ryanair: Which Budget Airline Is Actually Better?", slug: "easyjet-vs-ryanair-which-budget-airline-better", wpSlug: "easyjet-vs-ryanair-which-budget-airline-better", categoryId: 2, authorId: 4, postType: "article", isFeatured: false, isBreaking: false, views: 678 },
  { title: "The Airbus A220: The Plane That Saved Bombardier and Changed Aviation", slug: "airbus-a220-saved-bombardier-changed-aviation", wpSlug: "airbus-a220-saved-bombardier-changed-aviation", categoryId: 5, authorId: 1, postType: "article", isFeatured: false, isBreaking: false, views: 234 },
  { title: "How Pilots Deal With Medical Emergencies at 40,000 Feet", slug: "how-pilots-deal-medical-emergencies-40000-feet", wpSlug: "how-pilots-deal-medical-emergencies-40000-feet", categoryId: 2, authorId: 2, postType: "article", isFeatured: false, isBreaking: false, views: 789 },
  { title: "The Night a Passenger Tried to Open the Emergency Exit Mid-Flight", slug: "passenger-tried-open-emergency-exit-mid-flight", wpSlug: "passenger-tried-open-emergency-exit-mid-flight", categoryId: 6, authorId: 2, postType: "article", isFeatured: false, isBreaking: false, views: 1567 },
  { title: "Virgin Atlantic's New A330neo: Everything You Need to Know", slug: "virgin-atlantic-new-a330neo-everything-you-need-to-know", wpSlug: "virgin-atlantic-new-a330neo", categoryId: 5, authorId: 1, postType: "article", isFeatured: false, isBreaking: false, views: 345 },
  { title: "The Graveyard of Planes: Inside the World's Largest Aircraft Boneyard", slug: "graveyard-of-planes-worlds-largest-aircraft-boneyard", wpSlug: "graveyard-of-planes-worlds-largest-aircraft-boneyard", categoryId: 5, authorId: 1, postType: "article", isFeatured: false, isBreaking: false, views: 2100 },
  { title: "Why Turbulence Is Getting Worse (And What Airlines Are Doing About It)", slug: "why-turbulence-getting-worse", wpSlug: "why-turbulence-getting-worse", categoryId: 2, authorId: 2, postType: "article", isFeatured: false, isBreaking: false, views: 1890 },
  { title: "The Secret Language Pilots Use That Passengers Never Hear", slug: "secret-language-pilots-use-passengers-never-hear", wpSlug: "secret-language-pilots-use-passengers-never-hear", categoryId: 2, authorId: 1, postType: "article", isFeatured: false, isBreaking: false, views: 3456 },
  { title: "How the Boeing 777X Will Change Long-Haul Flying Forever", slug: "boeing-777x-will-change-long-haul-flying-forever", wpSlug: "boeing-777x-will-change-long-haul-flying-forever", categoryId: 5, authorId: 1, postType: "article", isFeatured: false, isBreaking: false, views: 567 },
  { title: "The Pilot Who Flew 100 Missions Over Vietnam and Lived to Tell the Tale", slug: "pilot-flew-100-missions-vietnam", wpSlug: "pilot-flew-100-missions-vietnam", categoryId: 3, authorId: 3, postType: "article", isFeatured: false, isBreaking: false, views: 890 },
  { title: "Air France 447: The Mystery That Changed Aviation Safety Forever", slug: "air-france-447-mystery-changed-aviation-safety", wpSlug: "air-france-447-mystery-changed-aviation-safety", categoryId: 6, authorId: 2, postType: "article", isFeatured: true, isBreaking: false, views: 4567 },
  { title: "How to Become a Commercial Pilot in 2025: The Complete Roadmap", slug: "how-to-become-commercial-pilot-2025-complete-roadmap", wpSlug: "how-to-become-commercial-pilot-2025", categoryId: 4, authorId: 2, postType: "article", isFeatured: false, isBreaking: false, views: 2345 },
  { title: "The Plane That Changed Everything: A History of the Boeing 747", slug: "plane-that-changed-everything-history-boeing-747", wpSlug: "plane-that-changed-everything-history-boeing-747", categoryId: 5, authorId: 1, postType: "article", isFeatured: false, isBreaking: false, views: 1234 },
  { title: "Why Some Airlines Still Use Paper Boarding Passes", slug: "why-some-airlines-still-use-paper-boarding-passes", wpSlug: "why-some-airlines-still-use-paper-boarding-passes", categoryId: 2, authorId: 4, postType: "article", isFeatured: false, isBreaking: false, views: 456 },
  { title: "The Incredible Story of the Gimli Glider: Out of Fuel at 41,000 Feet", slug: "incredible-story-gimli-glider-out-of-fuel", wpSlug: "incredible-story-gimli-glider-out-of-fuel", categoryId: 6, authorId: 2, postType: "article", isFeatured: false, isBreaking: false, views: 2890 },
  { title: "Joby Aviation's Flying Taxi Just Completed Its First Passenger Flight", slug: "joby-aviation-flying-taxi-first-passenger-flight", wpSlug: "joby-aviation-flying-taxi-first-passenger-flight", categoryId: 7, authorId: 1, postType: "breaking", isFeatured: false, isBreaking: true, views: 678 },
  { title: "The Real Reason Planes Don't Fly Over the Pacific Ocean", slug: "real-reason-planes-dont-fly-over-pacific-ocean", wpSlug: "real-reason-planes-dont-fly-over-pacific-ocean", categoryId: 2, authorId: 1, postType: "article", isFeatured: false, isBreaking: false, views: 5678 },
  { title: "Inside the World's Most Expensive First Class Cabin: Emirates vs Singapore", slug: "worlds-most-expensive-first-class-cabin-emirates-vs-singapore", wpSlug: "worlds-most-expensive-first-class-cabin", categoryId: 2, authorId: 4, postType: "article", isFeatured: true, isBreaking: false, views: 3456 },
  { title: "The Pilot Who Landed a Burning Plane on a Motorway", slug: "pilot-landed-burning-plane-motorway", wpSlug: "pilot-landed-burning-plane-motorway", categoryId: 6, authorId: 2, postType: "article", isFeatured: false, isBreaking: false, views: 1890 },
  { title: "How Drones Are Threatening Aviation Safety (And What's Being Done)", slug: "how-drones-threatening-aviation-safety", wpSlug: "how-drones-threatening-aviation-safety", categoryId: 6, authorId: 2, postType: "article", isFeatured: false, isBreaking: false, views: 567 },
  { title: "The Airbus A320neo: Why It's the World's Best-Selling Plane", slug: "airbus-a320neo-worlds-best-selling-plane", wpSlug: "airbus-a320neo-worlds-best-selling-plane", categoryId: 5, authorId: 1, postType: "article", isFeatured: false, isBreaking: false, views: 789 },
  { title: "What It's Really Like to Fly in a Fighter Jet at Mach 2", slug: "what-its-really-like-to-fly-fighter-jet-mach-2", wpSlug: "what-its-really-like-to-fly-fighter-jet-mach-2", categoryId: 3, authorId: 3, postType: "article", isFeatured: false, isBreaking: false, views: 2345 },
  { title: "The Airline That Never Had a Fatal Crash: Qantas's Safety Record", slug: "airline-never-had-fatal-crash-qantas-safety-record", wpSlug: "airline-never-had-fatal-crash-qantas-safety-record", categoryId: 2, authorId: 2, postType: "article", isFeatured: false, isBreaking: false, views: 1234 },
  { title: "How Weather Forecasting Saves Thousands of Lives Every Year", slug: "how-weather-forecasting-saves-thousands-lives", wpSlug: "how-weather-forecasting-saves-thousands-lives", categoryId: 2, authorId: 2, postType: "article", isFeatured: false, isBreaking: false, views: 345 },
  { title: "The B-2 Spirit Stealth Bomber: America's Most Expensive Aircraft", slug: "b2-spirit-stealth-bomber-americas-most-expensive-aircraft", wpSlug: "b2-spirit-stealth-bomber", categoryId: 3, authorId: 3, postType: "article", isFeatured: false, isBreaking: false, views: 1567 },
  { title: "Why Pilots Are Paid So Much Less Than You Think", slug: "why-pilots-paid-so-much-less-than-you-think", wpSlug: "why-pilots-paid-so-much-less-than-you-think", categoryId: 4, authorId: 1, postType: "article", isFeatured: false, isBreaking: false, views: 2890 },
  { title: "The Airport That Serves Only One Airline — And It's Brilliant", slug: "airport-that-serves-only-one-airline", wpSlug: "airport-that-serves-only-one-airline", categoryId: 2, authorId: 4, postType: "article", isFeatured: false, isBreaking: false, views: 456 },
  { title: "How the Black Box Actually Works (And Why It's Orange)", slug: "how-the-black-box-actually-works-and-why-its-orange", wpSlug: "how-the-black-box-actually-works", categoryId: 6, authorId: 2, postType: "article", isFeatured: false, isBreaking: false, views: 789 },
  { title: "The Plane That Flew Upside Down for 29 Seconds and Survived", slug: "plane-flew-upside-down-29-seconds-survived", wpSlug: "plane-flew-upside-down-29-seconds-survived", categoryId: 6, authorId: 2, postType: "article", isFeatured: false, isBreaking: false, views: 3456 },
  { title: "Inside Boeing's Crisis: What Went Wrong and Can It Be Fixed?", slug: "inside-boeings-crisis-what-went-wrong-can-it-be-fixed", wpSlug: "inside-boeings-crisis", categoryId: 5, authorId: 1, postType: "article", isFeatured: true, isBreaking: false, views: 5678 },
  { title: "The World's Shortest Commercial Flight: 47 Seconds in the Air", slug: "worlds-shortest-commercial-flight-47-seconds", wpSlug: "worlds-shortest-commercial-flight-47-seconds", categoryId: 2, authorId: 4, postType: "article", isFeatured: false, isBreaking: false, views: 2345 },
  { title: "How Hypersonic Missiles Are Changing Modern Warfare", slug: "how-hypersonic-missiles-changing-modern-warfare", wpSlug: "how-hypersonic-missiles-changing-modern-warfare", categoryId: 3, authorId: 3, postType: "article", isFeatured: false, isBreaking: false, views: 1234 },
  { title: "The Passenger Who Accidentally Opened the Wrong Door at 30,000 Feet", slug: "passenger-accidentally-opened-wrong-door-30000-feet", wpSlug: "passenger-accidentally-opened-wrong-door-30000-feet", categoryId: 6, authorId: 2, postType: "article", isFeatured: false, isBreaking: false, views: 4567 },
  { title: "Why Electric Planes Are Closer Than You Think", slug: "why-electric-planes-are-closer-than-you-think", wpSlug: "why-electric-planes-are-closer-than-you-think", categoryId: 7, authorId: 1, postType: "article", isFeatured: false, isBreaking: false, views: 678 },
  { title: "The Forgotten Disaster: Tenerife Airport Collision 1977", slug: "forgotten-disaster-tenerife-airport-collision-1977", wpSlug: "forgotten-disaster-tenerife-airport-collision-1977", categoryId: 6, authorId: 2, postType: "article", isFeatured: false, isBreaking: false, views: 1890 },
  { title: "How Air Traffic Control Prevents Mid-Air Collisions Every Day", slug: "how-air-traffic-control-prevents-mid-air-collisions", wpSlug: "how-air-traffic-control-prevents-mid-air-collisions", categoryId: 2, authorId: 2, postType: "article", isFeatured: false, isBreaking: false, views: 567 },
  { title: "The Pilot Who Saved 155 Lives by Landing on the Hudson River", slug: "pilot-saved-155-lives-landing-hudson-river", wpSlug: "pilot-saved-155-lives-landing-hudson-river", categoryId: 6, authorId: 2, postType: "article", isFeatured: true, isBreaking: false, views: 7890 },
  { title: "Ryanair Just Ordered 300 More Boeing 737s — Here's Why", slug: "ryanair-ordered-300-more-boeing-737s", wpSlug: "ryanair-ordered-300-more-boeing-737s", categoryId: 2, authorId: 4, postType: "breaking", isFeatured: false, isBreaking: true, views: 234 },
  { title: "The Stealth Fighter That Changed Everything: F-117 Nighthawk", slug: "stealth-fighter-changed-everything-f117-nighthawk", wpSlug: "stealth-fighter-changed-everything-f117-nighthawk", categoryId: 3, authorId: 3, postType: "article", isFeatured: false, isBreaking: false, views: 1234 },
  { title: "How to Get Upgraded to Business Class for Free (It Actually Works)", slug: "how-to-get-upgraded-business-class-for-free", wpSlug: "how-to-get-upgraded-business-class-for-free", categoryId: 2, authorId: 4, postType: "article", isFeatured: false, isBreaking: false, views: 4567 },
  { title: "The Plane That Disappeared: MH370 and the Search That Never Ended", slug: "plane-that-disappeared-mh370-search-that-never-ended", wpSlug: "plane-that-disappeared-mh370", categoryId: 6, authorId: 2, postType: "article", isFeatured: true, isBreaking: false, views: 12345 },
  { title: "Why the Airbus A380 Failed to Save Itself", slug: "why-airbus-a380-failed-to-save-itself", wpSlug: "why-airbus-a380-failed-to-save-itself", categoryId: 5, authorId: 1, postType: "article", isFeatured: false, isBreaking: false, views: 2345 },
  { title: "The Night Air India 182 Was Blown Out of the Sky", slug: "night-air-india-182-blown-out-of-sky", wpSlug: "night-air-india-182-blown-out-of-sky", categoryId: 6, authorId: 2, postType: "article", isFeatured: false, isBreaking: false, views: 1890 },
  { title: "How Pilots Train for the Impossible: Zero-Visibility Landings", slug: "how-pilots-train-for-zero-visibility-landings", wpSlug: "how-pilots-train-for-zero-visibility-landings", categoryId: 4, authorId: 2, postType: "article", isFeatured: false, isBreaking: false, views: 678 },
  { title: "The New Supersonic Boom: Boom Overture vs Aerion AS2", slug: "new-supersonic-boom-overture-vs-aerion-as2", wpSlug: "new-supersonic-boom-overture-vs-aerion-as2", categoryId: 7, authorId: 1, postType: "article", isFeatured: false, isBreaking: false, views: 456 },
  { title: "Why Some Planes Have Winglets and Others Don't", slug: "why-some-planes-have-winglets-and-others-dont", wpSlug: "why-some-planes-have-winglets-and-others-dont", categoryId: 5, authorId: 1, postType: "article", isFeatured: false, isBreaking: false, views: 789 },
  { title: "The Airline That Turned Around in Mid-Air and Nobody Noticed", slug: "airline-turned-around-mid-air-nobody-noticed", wpSlug: "airline-turned-around-mid-air-nobody-noticed", categoryId: 2, authorId: 4, postType: "article", isFeatured: false, isBreaking: false, views: 1234 },
  { title: "How the Eurofighter Typhoon Compares to the F-16 Fighting Falcon", slug: "eurofighter-typhoon-compares-f16-fighting-falcon", wpSlug: "eurofighter-typhoon-compares-f16-fighting-falcon", categoryId: 3, authorId: 3, postType: "article", isFeatured: false, isBreaking: false, views: 890 },
  { title: "The Crash That Created Modern Aviation Safety: United 232", slug: "crash-that-created-modern-aviation-safety-united-232", wpSlug: "crash-that-created-modern-aviation-safety-united-232", categoryId: 6, authorId: 2, postType: "article", isFeatured: false, isBreaking: false, views: 2345 },
  { title: "Why Airports Are Getting Bigger But Planes Are Getting Smaller", slug: "why-airports-getting-bigger-planes-getting-smaller", wpSlug: "why-airports-getting-bigger-planes-getting-smaller", categoryId: 2, authorId: 4, postType: "article", isFeatured: false, isBreaking: false, views: 567 },
  { title: "The Pilot Who Flew a Passenger Jet Into a Mountain — On Purpose", slug: "pilot-flew-passenger-jet-into-mountain-on-purpose", wpSlug: "pilot-flew-passenger-jet-into-mountain-on-purpose", categoryId: 6, authorId: 2, postType: "article", isFeatured: false, isBreaking: false, views: 3456 },
  { title: "How NASA Is Planning to Bring Back Supersonic Passenger Travel", slug: "how-nasa-planning-bring-back-supersonic-passenger-travel", wpSlug: "how-nasa-planning-bring-back-supersonic-passenger-travel", categoryId: 7, authorId: 1, postType: "article", isFeatured: false, isBreaking: false, views: 678 },
  { title: "The Truth About Autopilot: What Pilots Actually Do on a 10-Hour Flight", slug: "truth-about-autopilot-what-pilots-actually-do", wpSlug: "truth-about-autopilot-what-pilots-actually-do", categoryId: 2, authorId: 1, postType: "article", isFeatured: false, isBreaking: false, views: 4567 },
  { title: "Inside the World's Busiest Airport: Atlanta Hartsfield-Jackson", slug: "inside-worlds-busiest-airport-atlanta-hartsfield-jackson", wpSlug: "inside-worlds-busiest-airport-atlanta", categoryId: 2, authorId: 4, postType: "article", isFeatured: false, isBreaking: false, views: 789 },
  { title: "The Drone That Outflew Every Fighter Jet: RQ-4 Global Hawk", slug: "drone-outflew-every-fighter-jet-rq4-global-hawk", wpSlug: "drone-outflew-every-fighter-jet-rq4-global-hawk", categoryId: 3, authorId: 3, postType: "article", isFeatured: false, isBreaking: false, views: 1234 },
];

const contentTemplate = (title) => `<p>This is a detailed article about <strong>${title}</strong>. Flight Drama brings you the latest and most compelling aviation stories from around the world.</p>

<p>Aviation has always been one of humanity's greatest achievements — from the Wright Brothers' first 12-second flight at Kitty Hawk in 1903 to today's ultra-long-haul flights spanning 19 hours across the globe. Every flight represents a triumph of engineering, human skill, and sheer determination.</p>

<h2>The Full Story</h2>

<p>The aviation industry is one of the most complex and fascinating sectors in the world. With over 100,000 commercial flights taking off every single day, the systems, people, and technology required to keep the skies safe are nothing short of extraordinary.</p>

<p>From the moment a pilot pushes the throttles forward on takeoff to the gentle squeak of tyres on the runway at landing, every second of a flight involves hundreds of decisions, automated systems, and human expertise working in perfect harmony.</p>

<h2>What This Means for Aviation</h2>

<p>The implications of this story extend far beyond the immediate incident or development. Aviation is a deeply interconnected industry — a decision made in Seattle can affect passengers in Singapore, and a regulatory change in Brussels can ground aircraft across three continents.</p>

<p>Industry experts have been watching this situation closely, with many noting that it represents a turning point for how the sector approaches safety, efficiency, and innovation.</p>

<blockquote>"Aviation is the safest form of transport in human history, and stories like this remind us why — because the industry never stops learning, never stops improving, and never accepts 'good enough' as an answer." — Aviation Safety Expert</blockquote>

<h2>Looking Ahead</h2>

<p>As we continue to track this story, Flight Drama will bring you the latest updates, expert analysis, and community discussion. Join the conversation in our forum, subscribe to our newsletter for breaking aviation news, and follow us on social media for real-time updates.</p>

<p>Whether you're a seasoned commercial pilot, a student working towards your PPL, or simply someone who looks up every time a plane flies overhead — this story matters to you.</p>`;

const excerptTemplate = (title) => `The latest on ${title} — Flight Drama brings you breaking aviation news, analysis, and community discussion from the world's most passionate aviation audience.`;

const tagsMap = {
  1: '["airlines","cargo","freight","aviation economics"]',
  2: '["boeing","757","commercial aviation","aircraft"]',
  3: '["dc-10","accident","history","boston"]',
  4: '["flight attendants","pay","airlines","cabin crew"]',
  5: '["american airlines","florida","routes","expansion"]',
  6: '["airbus","a340","fuel","airlines"]',
  7: '["delta","emergency landing","dublin","incident"]',
};

for (let i = 0; i < articles.length; i++) {
  const a = articles[i];
  const img = aviationImages[i % aviationImages.length];
  const tags = tagsMap[a.categoryId] || '["aviation","news","flight drama"]';
  const pubDate = new Date(Date.now() - (articles.length - i) * 86400000 * 2);
  
  await connection.execute(
    `INSERT INTO articles (title, slug, excerpt, content, featuredImage, postType, categoryId, authorId, tags, views, isFeatured, isBreaking, isPro, wpSlug, publishedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      a.title,
      a.slug,
      excerptTemplate(a.title),
      contentTemplate(a.title),
      img,
      a.postType,
      a.categoryId,
      a.authorId,
      tags,
      a.views,
      a.isFeatured ? 1 : 0,
      a.isBreaking ? 1 : 0,
      0,
      a.wpSlug || a.slug,
      pubDate,
    ]
  );

  // Create redirect from old WP URL to new URL
  const wpPath = `/${a.wpSlug || a.slug}/`;
  const newPath = `/article/${a.slug}`;
  await connection.execute(
    `INSERT IGNORE INTO redirects (oldPath, newPath, statusCode) VALUES (?, ?, 301)`,
    [wpPath, newPath]
  );
}

console.log(`✅ Seeded ${articles.length} articles with redirects`);

// ─── Seed Forum Threads ───────────────────────────────────────────────────────
await connection.execute(`DELETE FROM forum_threads`);
const threads = [
  [1, 1, "Best seats on the Boeing 777-300ER for long haul?", "I'm flying LHR-SIN next month on Singapore Airlines 777-300ER. Any recommendations for the best seats in economy? I've heard row 55 is good but wanted community input.", 45, 12],
  [1, 1, "Ryanair's new baggage policy — what do you think?", "They've changed the cabin bag rules again. Seems like every 6 months there's a new policy. Anyone been caught out recently?", 23, 8],
  [2, 1, "F-35 vs Eurofighter: Which would you rather fly?", "Purely hypothetical — if you could fly one military jet, which would it be? The F-35's stealth tech or the Typhoon's raw agility?", 89, 34],
  [3, 1, "PPL to CPL: How long did it realistically take you?", "I'm 40 hours into my PPL training and thinking about the long-term path to commercial. How long did the full journey take for those who've done it?", 67, 21],
  [4, 1, "The Heathrow near-miss last week — thoughts?", "Did anyone see the AAIB preliminary report on the near-miss at Heathrow? Seems like ATC comms were a factor. What do you think could have been done differently?", 112, 45],
  [5, 1, "Best spotting locations at Manchester Airport?", "Heading up to Manchester next weekend specifically for spotting. Never been before — where are the best vantage points? Any tips on what to bring?", 34, 15],
  [6, 1, "What's your most memorable flight ever?", "Mine was flying into Hong Kong's old Kai Tak airport in 1996 — the checkerboard approach through the mountains. Nothing like it. What's yours?", 156, 67],
];

for (const [boardId, userId, title, content, views, replyCount] of threads) {
  await connection.execute(
    `INSERT INTO forum_threads (boardId, userId, title, content, views, replyCount, isPinned, isLocked) VALUES (?, ?, ?, ?, ?, ?, 0, 0)`,
    [boardId, userId, title, content, views, replyCount]
  );
}

console.log("✅ Seeded forum threads");
console.log("✅ All seed data complete!");
await connection.end();
