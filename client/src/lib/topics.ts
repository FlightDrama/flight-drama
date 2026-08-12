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
  { slug: "heathrow", label: "Heathrow", search: "Heathrow", group: "Airports", description: "Flights, terminals, disruption and travel news from Heathrow Airport." },
  { slug: "gatwick", label: "Gatwick", search: "Gatwick", group: "Airports", description: "The latest Gatwick Airport, airline, route and passenger stories." },
  { slug: "manchester-airport", label: "Manchester Airport", search: "Manchester Airport", group: "Airports", description: "Manchester Airport flights, terminals, routes and travel updates." },
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
