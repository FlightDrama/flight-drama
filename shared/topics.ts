export type TopicGroup = "Airlines" | "Airports" | "Aircraft" | "Stories";

export type TopicDefinition = {
  slug: string;
  label: string;
  search: string;
  group: TopicGroup;
  description: string;
};

export const TOPICS: TopicDefinition[] = [
  { slug: "ryanair", label: "Ryanair", search: "Ryanair", group: "Airlines", description: "Latest Ryanair routes, operations, passenger stories and airline news." },
  { slug: "british-airways", label: "British Airways", search: "British Airways", group: "Airlines", description: "The latest British Airways fleet, route, passenger and operational coverage." },
  { slug: "easyjet", label: "easyJet", search: "easyJet", group: "Airlines", description: "easyJet news, aircraft updates, route launches and passenger stories." },
  { slug: "emirates", label: "Emirates", search: "Emirates", group: "Airlines", description: "Emirates news, cabin updates, route stories and Dubai hub coverage." },
  { slug: "jet2", label: "Jet2", search: "Jet2", group: "Airlines", description: "Jet2 flights, package-holiday routes, passenger news and operational updates." },
  { slug: "virgin-atlantic", label: "Virgin Atlantic", search: "Virgin Atlantic", group: "Airlines", description: "Virgin Atlantic fleet, long-haul routes, cabin and passenger coverage." },
  { slug: "wizz-air", label: "Wizz Air", search: "Wizz Air", group: "Airlines", description: "Wizz Air route, fleet, passenger and low-cost aviation news." },
  { slug: "tui-airways", label: "TUI Airways", search: "TUI", group: "Airlines", description: "TUI Airways holiday-flight, fleet and passenger travel coverage." },
  { slug: "aer-lingus", label: "Aer Lingus", search: "Aer Lingus", group: "Airlines", description: "Aer Lingus route, fleet and Ireland travel news." },
  { slug: "lufthansa", label: "Lufthansa", search: "Lufthansa", group: "Airlines", description: "Lufthansa Group route, aircraft and operational news." },
  { slug: "air-france", label: "Air France", search: "Air France", group: "Airlines", description: "Air France network, cabin, fleet and passenger stories." },
  { slug: "klm", label: "KLM", search: "KLM", group: "Airlines", description: "KLM operations, routes, Schiphol travel and fleet coverage." },
  { slug: "qatar-airways", label: "Qatar Airways", search: "Qatar Airways", group: "Airlines", description: "Qatar Airways routes, aircraft, cabin and Doha hub news." },
  { slug: "united-airlines", label: "United Airlines", search: "United Airlines", group: "Airlines", description: "United Airlines network, aircraft, customer and operational coverage." },
  { slug: "american-airlines", label: "American Airlines", search: "American Airlines", group: "Airlines", description: "American Airlines network, crew, aircraft and passenger stories." },
  { slug: "delta-air-lines", label: "Delta Air Lines", search: "Delta", group: "Airlines", description: "Delta Air Lines routes, operations, fleet and airport news." },
  { slug: "heathrow", label: "Heathrow", search: "Heathrow", group: "Airports", description: "Flights, terminals, disruption and travel news from Heathrow Airport." },
  { slug: "gatwick", label: "Gatwick", search: "Gatwick", group: "Airports", description: "The latest Gatwick Airport, airline, route and passenger stories." },
  { slug: "manchester-airport", label: "Manchester Airport", search: "Manchester Airport", group: "Airports", description: "Manchester Airport flights, terminals, routes and travel updates." },
  { slug: "birmingham-airport", label: "Birmingham Airport", search: "Birmingham Airport", group: "Airports", description: "Birmingham Airport flights, routes, terminal and passenger coverage." },
  { slug: "bristol-airport", label: "Bristol Airport", search: "Bristol Airport", group: "Airports", description: "Bristol Airport routes, disruption, airline and regional travel updates." },
  { slug: "leeds-bradford", label: "Leeds Bradford Airport", search: "Leeds Bradford", group: "Airports", description: "Leeds Bradford flights, diversions, routes and Yorkshire travel news." },
  { slug: "liverpool-john-lennon", label: "Liverpool John Lennon Airport", search: "Liverpool Airport", group: "Airports", description: "Liverpool flights, routes, airlines and airport-operation stories." },
  { slug: "newcastle-airport", label: "Newcastle Airport", search: "Newcastle Airport", group: "Airports", description: "Newcastle Airport route, airline and North East travel coverage." },
  { slug: "edinburgh-airport", label: "Edinburgh Airport", search: "Edinburgh Airport", group: "Airports", description: "Edinburgh Airport routes, airlines, disruption and Scotland travel news." },
  { slug: "glasgow-airport", label: "Glasgow Airport", search: "Glasgow Airport", group: "Airports", description: "Glasgow Airport flights, routes and passenger travel updates." },
  { slug: "dublin-airport", label: "Dublin Airport", search: "Dublin Airport", group: "Airports", description: "Dublin Airport airlines, routes, terminal and Ireland travel coverage." },
  { slug: "luton-airport", label: "London Luton Airport", search: "Luton Airport", group: "Airports", description: "Luton Airport low-cost airline, route and passenger stories." },
  { slug: "stansted-airport", label: "London Stansted Airport", search: "Stansted Airport", group: "Airports", description: "Stansted Airport airlines, routes and operational aviation updates." },
  { slug: "boeing-737", label: "Boeing 737", search: "737", group: "Aircraft", description: "Boeing 737 fleet, safety, engineering and airline operations news." },
  { slug: "airbus-a320", label: "Airbus A320", search: "A320", group: "Aircraft", description: "Airbus A320 family aircraft, airlines and operational news." },
  { slug: "airbus-a380", label: "Airbus A380", search: "A380", group: "Aircraft", description: "Airbus A380 routes, fleet developments and passenger aviation stories." },
  { slug: "emergency-landing", label: "Emergency Landings", search: "Emergency Landing", group: "Stories", description: "Verified aviation incidents, diversions and emergency landing coverage." },
  { slug: "new-routes", label: "New Routes", search: "New Routes", group: "Stories", description: "New airline routes, destination launches and schedule developments." },
];

export const TOPIC_GROUPS: TopicGroup[] = ["Airlines", "Airports", "Aircraft", "Stories"];

export function getTopic(slug: string | undefined): TopicDefinition | undefined {
  return TOPICS.find((topic) => topic.slug === slug);
}
