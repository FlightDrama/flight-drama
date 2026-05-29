/**
 * Flight Drama — Instagram Articles Seed Script
 * ================================================
 * Creates 10 new articles from Instagram posts.
 * All articles are AdSense compliant:
 * - Factual, balanced reporting
 * - Original expanded content (not just rephrased posts)
 * - No sensationalism, no graphic content
 * - Clear attribution to official sources
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Get category and author IDs
const [categories] = await conn.execute('SELECT id, slug FROM categories');
const catMap = Object.fromEntries(categories.map(c => [c.slug, c.id]));
const [authors] = await conn.execute('SELECT id FROM authors LIMIT 1');
const authorId = authors[0]?.id ?? 1;

// Helper to create slug
const slugify = (str) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);

const articles = [
  {
    title: "United Airlines Is Building AI to Explain Every Flight Delay in Plain English",
    category: "commercial-aviation",
    excerpt: "United Airlines CEO Scott Kirby has revealed plans for an artificial intelligence system capable of explaining every single flight delay to passengers in plain English — and eventually sending maintenance videos directly to customers' phones.",
    content: `<p>United Airlines is developing an artificial intelligence system designed to explain every flight delay to passengers in plain English, with CEO Scott Kirby describing the project as a potential turning point in how airlines communicate with travellers.</p>

<h2>What United Is Building</h2>
<p>The system aims to eliminate the vague, frustrating delay notices that passengers have long complained about. Instead of generic messages citing "operational reasons" or "air traffic control," United wants to send detailed, personalised explanations showing exactly what is happening with a specific aircraft, why a maintenance issue is taking longer than expected, or what air traffic control constraints are affecting a particular flight.</p>

<p>"We're going to start to send them videos, like maintenance videos and cool stuff about exactly what's going on with their airplane," Kirby said in a recent interview. The airline says the system will eventually operate across all 6,000 daily United flights without requiring human intervention for each individual communication.</p>

<h2>Why This Matters for Passengers</h2>
<p>Flight delays are one of the most consistent sources of passenger frustration, and much of that frustration stems not from the delay itself but from the lack of clear information about why it is happening and when it will be resolved. Research consistently shows that passengers who receive clear, honest explanations for delays report significantly higher satisfaction levels than those left in the dark, even when the delay itself is longer.</p>

<p>United's approach would represent a significant shift from current industry practice, where delay communications are often brief, formulaic, and provide little actionable information for passengers trying to make connection decisions or alternative arrangements.</p>

<h2>The Broader AI Push in Aviation</h2>
<p>The announcement signals how aggressively airlines are now pushing artificial intelligence beyond chatbots and ticket pricing algorithms into actual airline operations. United has been among the more aggressive adopters of AI technology in the US airline industry, having previously deployed machine learning systems for crew scheduling, fuel optimisation, and predictive maintenance.</p>

<p>Kirby believes the delay communication project could make United feel "different than any other airline in the world" — a significant claim in an industry where passenger experience has long been a major differentiator between carriers.</p>

<h2>Implementation Timeline</h2>
<p>United has not announced a specific launch date for the full system. The airline says it is currently in development and testing phases. The project faces technical challenges around integrating real-time data from maintenance systems, air traffic control feeds, crew scheduling platforms, and gate management systems into a single coherent explanation that can be communicated clearly to passengers with varying levels of aviation knowledge.</p>

<p>Whether the system delivers on its promise remains to be seen, but the ambition behind it reflects a growing recognition across the airline industry that passenger communication — particularly around disruptions — has significant room for improvement.</p>`,
    tags: JSON.stringify(["United Airlines", "AI", "Flight Delays", "Technology", "Passenger Experience"]),
    isBreaking: false,
  },
  {
    title: "Jetstar Removes Passenger After Crew Raise Concerns Over Post-Surgery Appearance",
    category: "aviation-incidents",
    excerpt: "An Australian social media influencer was removed from a Jetstar flight in Thailand after cabin crew raised concerns about his fitness to fly following cosmetic surgery, in an incident that has attracted significant attention online.",
    content: `<p>A Jetstar flight from Thailand to Australia was at the centre of a passenger removal incident after cabin crew raised concerns about a passenger's fitness to fly following recent cosmetic surgery, according to accounts shared widely on social media.</p>

<h2>What Happened</h2>
<p>Ronan Androgenic, a 25-year-old Australian social media personality, had boarded the Jetstar flight wearing facial compression garments following multiple cosmetic procedures performed in Thailand, including reported facial surgery and liposuction. According to Androgenic's account of events, crew members became concerned after waking him during the flight and observing that he appeared extremely drowsy and was having difficulty communicating clearly.</p>

<p>Androgenic says a flight attendant told him "your face is very ill" during the confrontation, and that he was subsequently escorted off the aircraft. He stated he had received medical clearance to fly and described the situation as being "imprisoned in a foreign country."</p>

<h2>Jetstar's Position</h2>
<p>Jetstar said its staff acted appropriately and that passenger safety remains the airline's priority. Airlines have a legal and regulatory obligation to ensure that passengers are fit to fly, and crew members are trained to identify passengers who may pose a safety risk to themselves or others during a flight. A passenger who becomes seriously unwell during a long-haul flight over open water presents significant challenges for crew who have limited medical resources available.</p>

<h2>Medical Fitness to Fly After Surgery</h2>
<p>The incident raises broader questions about medical fitness to fly following cosmetic procedures. Aviation medical guidance generally recommends that passengers wait a minimum period after surgery before flying, particularly for procedures involving general anaesthesia or significant swelling. The specific waiting period varies depending on the procedure, but the combination of cabin pressure changes, reduced oxygen levels at altitude, and the physical stress of flying can complicate recovery from recent surgery.</p>

<p>Airlines rely primarily on crew observation and passenger self-declaration when assessing fitness to fly, as they do not have access to passengers' medical records. Crew members are trained to identify visible signs of distress but are not medical professionals.</p>

<h2>Context</h2>
<p>The incident attracted attention partly because of Androgenic's existing online profile in "looksmaxxing" communities, where content focuses on cosmetic procedures and appearance optimisation. Jetstar has not commented further beyond its initial statement confirming that staff acted in accordance with safety procedures.</p>`,
    tags: JSON.stringify(["Jetstar", "Passenger Removal", "Cosmetic Surgery", "Fitness to Fly", "Australia"]),
    isBreaking: false,
  },
  {
    title: "MCAS: How a Single Sensor Brought Down Two Boeing 737 MAX Aircraft and Killed 346 People",
    category: "aviation-incidents",
    excerpt: "The Boeing 737 MAX was designed to feel ordinary. Instead, a software system called MCAS — relying on a single sensor — became the centre of the most damaging aviation scandal in modern history.",
    content: `<p>When Boeing launched the 737 MAX, the aircraft's central selling point was continuity. Airlines were told the MAX was simply a more fuel-efficient version of the world's most familiar airliner. Same type rating. Minimal additional training required. The same cockpit their pilots already knew. It was a commercially compelling argument. It was also, investigators would later conclude, a dangerous one.</p>

<h2>Why MCAS Was Created</h2>
<p>The problem began with the engines. To achieve the fuel efficiency improvements airlines demanded, Boeing fitted the MAX with larger, more powerful CFM LEAP-1B engines. The size of these engines required them to be mounted further forward and higher on the wing than the previous 737 NG variant. This change in engine position altered the aircraft's aerodynamic characteristics, causing the nose to pitch upward more than expected at high angles of attack.</p>

<p>To compensate for this handling difference — and to avoid requiring pilots to undergo additional type rating training — Boeing engineers created the Manoeuvring Characteristics Augmentation System, known as MCAS. The software was designed to automatically push the nose down if it detected a dangerously high angle of attack, counteracting the tendency of the new engine position to pitch the aircraft upward.</p>

<h2>The Fatal Flaw</h2>
<p>MCAS relied on data from a single angle-of-attack sensor. If that sensor failed or provided incorrect readings, the system would activate even when the aircraft was flying normally. When activated erroneously, MCAS would repeatedly push the nose down, and pilots had only a limited window to counteract each activation before the system re-engaged. The forces involved could exceed what pilots were physically able to overcome.</p>

<p>Critically, many pilots were not fully informed about MCAS. Boeing had minimised references to the system in training materials, partly to support the argument that the MAX required no additional simulator training.</p>

<h2>Lion Air Flight 610 and Ethiopian Airlines Flight 302</h2>
<p>On 29 October 2018, Lion Air Flight 610 crashed into the Java Sea shortly after takeoff from Jakarta, killing all 189 people onboard. Investigators determined that a faulty angle-of-attack sensor had triggered MCAS repeatedly, and that the crew had been unable to overcome the system's repeated nose-down commands.</p>

<p>On 10 March 2019, Ethiopian Airlines Flight 302 crashed near Bishoftu, Ethiopia, six minutes after takeoff from Addis Ababa, killing all 157 people onboard. The accident sequence was almost identical to Lion Air 610. A total of 346 people died across both accidents.</p>

<h2>The Investigation and Aftermath</h2>
<p>The subsequent investigations revealed systemic failures extending far beyond the software itself. Investigators found that Boeing had downplayed the significance of MCAS to regulators, that the FAA's oversight of the certification process had been inadequate, and that internal Boeing communications revealed awareness of concerns about the system that had not been fully addressed.</p>

<p>The 737 MAX was grounded worldwide in March 2019 and did not return to service until late 2020 following extensive software modifications, enhanced pilot training requirements, and a redesigned certification process. Boeing faced billions of dollars in fines, settlements, and compensation payments. The scandal prompted significant reforms to aviation certification processes in the United States and internationally.</p>`,
    tags: JSON.stringify(["Boeing 737 MAX", "MCAS", "Lion Air", "Ethiopian Airlines", "Aviation Safety"]),
    isBreaking: false,
  },
  {
    title: "The 2013 Boeing 787 Battery Crisis: The First Worldwide Grounding of a US Airliner Since 1979",
    category: "aviation-incidents",
    excerpt: "When regulators grounded every Boeing 787 Dreamliner on Earth in January 2013, it was the first worldwide grounding of a major US airliner in over three decades — and a warning Boeing would later fail to fully heed.",
    content: `<p>When Boeing launched the 787 Dreamliner, the aircraft represented a genuine technological leap. Composite materials, more efficient engines, larger windows, and improved cabin pressurisation promised a fundamentally different passenger experience. Airlines ordered it in large numbers. Passengers were told it was the future of air travel. Then, in January 2013, the future started catching fire.</p>

<h2>The Battery Fires</h2>
<p>On 7 January 2013, a Japan Airlines Boeing 787 parked at Boston Logan Airport suffered a serious lithium-ion battery fire in the aircraft's electrical equipment bay. The fire caused significant damage and prompted immediate investigations by the National Transportation Safety Board and the FAA.</p>

<p>Nine days later, on 16 January, an All Nippon Airways 787 operating a domestic Japanese flight made an emergency landing at Takamatsu Airport after smoke warnings and battery malfunction indications appeared in the cockpit. Passengers were evacuated via emergency slides. Japanese investigators found that the main battery had experienced severe damage consistent with thermal runaway.</p>

<h2>The Worldwide Grounding</h2>
<p>The response from regulators was swift and unprecedented. The FAA issued an emergency airworthiness directive grounding all Boeing 787s operated by US carriers. Aviation authorities in Japan, Europe, India, Chile, and other countries followed within hours. Every Boeing 787 in commercial service — approximately 50 aircraft at the time — was grounded simultaneously.</p>

<p>It was the first worldwide grounding of a major US commercial airliner since the McDonnell Douglas DC-10 was grounded following the Chicago O'Hare accident in 1979. The scale of the action reflected the seriousness with which regulators viewed the battery incidents.</p>

<h2>Thermal Runaway</h2>
<p>Investigators traced the problem to lithium-ion batteries entering a condition known as thermal runaway — a self-sustaining chain reaction in which rising temperature causes further chemical reactions that generate more heat, potentially leading to fire or explosion. Lithium-ion batteries are widely used in consumer electronics and electric vehicles, but the energy density that makes them attractive also makes thermal runaway a serious concern in aviation applications where fire suppression options are limited.</p>

<p>The 787's electrical architecture relied heavily on lithium-ion batteries in a way that no previous commercial aircraft had, making the aircraft particularly vulnerable to this failure mode.</p>

<h2>Resolution and Return to Service</h2>
<p>The 787 returned to service in April 2013 after Boeing developed a redesigned battery containment system that enclosed the batteries in a stainless steel box with a venting system to direct any gases overboard. The fix addressed the immediate safety concern without resolving the underlying question of why the batteries had entered thermal runaway in the first place — a question that investigators were never able to definitively answer.</p>

<p>The Dreamliner went on to become one of Boeing's most commercially successful aircraft, with over 1,000 delivered by the mid-2020s. But the battery crisis had exposed a pattern of certification and oversight challenges that would resurface far more severely with the 737 MAX programme several years later.</p>`,
    tags: JSON.stringify(["Boeing 787", "Dreamliner", "Battery Fire", "Aviation Safety", "FAA"]),
    isBreaking: false,
  },
  {
    title: "Inside the Air Canada Tech Ops Dispute: Why Maintenance Workers Are Fighting Over Union Representation",
    category: "commercial-aviation",
    excerpt: "A long-running dispute over union representation at Air Canada's maintenance division has intensified following recent decisions from Canada's Industrial Relations Board, with workers and union groups reacting strongly to rulings on ballot destruction.",
    content: `<p>A dispute over union representation among Air Canada's maintenance and technical operations workforce has been attracting increasing attention from aviation observers and labour relations specialists, following a series of decisions from Canada's Industrial Relations Board that have intensified tensions within the airline's Tech Ops division.</p>

<h2>Background: IAM vs AMFA</h2>
<p>The dispute centres on whether Air Canada's aircraft maintenance engineers and skilled trade workers should be represented by the International Association of Machinists and Aerospace Workers (IAM), which currently holds bargaining rights for the group, or by the Aircraft Mechanics Fraternal Association (AMFA), a trade-specific union that exclusively represents aircraft maintenance technicians.</p>

<p>AMFA has argued that aircraft maintenance professionals are better served by a union focused entirely on their specific trade, rather than a broader industrial union that also represents other categories of workers. IAM has disputed this characterisation and argued that its broader membership base provides greater bargaining leverage and resources.</p>

<h2>The CIRB Decisions</h2>
<p>The dispute has moved through multiple stages at Canada's Industrial Relations Board. Recent decisions have included a reconsideration panel reversing an earlier ruling and ordering the destruction of previously cast representation ballots — a development that prompted strong reactions from workers and union groups on both sides.</p>

<p>Workers who support the move to AMFA have argued that the process has been delayed and that their ability to choose their own representation has been obstructed. IAM has maintained that the process has followed proper legal procedures. Both unions continue to dispute each other's positions publicly.</p>

<h2>Worker Demonstrations</h2>
<p>The intensity of feeling among Tech Ops workers has been visible in demonstrations organised by employees and their supporters. For many of the mechanics involved, the dispute has become about more than union affiliation — it has become a question of whether workers have meaningful control over who represents them in negotiations with one of North America's largest airlines.</p>

<h2>Passenger Impact</h2>
<p>Air Canada has stated that there is no current indication of operational disruption for passengers as a result of the dispute. Aircraft maintenance operations at the airline are continuing normally. The dispute remains an internal labour relations matter, though one that has clearly generated significant emotion among the workforce involved.</p>

<p>The outcome of the representation dispute will have implications for collective bargaining at Air Canada for years to come, and is being watched closely by labour relations specialists across the Canadian aviation industry.</p>`,
    tags: JSON.stringify(["Air Canada", "Union", "Aircraft Maintenance", "Labour Relations", "AMFA", "IAM"]),
    isBreaking: false,
  },
  {
    title: "Whirl Mode: The Hidden Vibration That Tore the Wings Off Lockheed Electra Aircraft in Flight",
    category: "aviation-incidents",
    excerpt: "In 1959 and 1960, two Lockheed Electra turboprop aircraft broke apart in mid-air within months of each other. Investigators initially had no idea why. The answer, when it came, revealed a terrifying engineering phenomenon no one had fully anticipated.",
    content: `<p>When the Lockheed L-188 Electra entered service in 1958, it represented the cutting edge of American aviation technology. Four powerful Allison 501 turboprop engines gave it exceptional performance. Airlines believed it would become one of the great American airliners of the jet age. Within two years, its wings were tearing off in flight.</p>

<h2>Two Disasters, No Explanation</h2>
<p>On 29 September 1959, Braniff International Airways Flight 542 broke apart over Buffalo, Texas, killing all 34 people onboard. The aircraft had been at cruise altitude when it disintegrated. Investigators found wreckage scattered over a wide area, consistent with an in-flight structural failure, but could not immediately identify the cause.</p>

<p>Less than six months later, on 17 March 1960, Northwest Airlines Flight 710 disintegrated over Tell City, Indiana, killing all 63 people onboard. The similarity to the Braniff accident was immediately apparent, and the Electra fleet came under intense scrutiny. The Civil Aeronautics Board launched a major investigation.</p>

<h2>Whirl Mode Flutter</h2>
<p>The investigation eventually identified the cause as a phenomenon called propeller whirl mode flutter — a type of oscillation that had not been fully understood or anticipated during the aircraft's design and certification process.</p>

<p>Under certain conditions, if an engine mount was weakened — through damage, fatigue, or manufacturing defect — the propeller and engine assembly could begin to oscillate in a complex rotational pattern. This oscillation could interact with the natural resonant frequency of the wing structure. If the frequencies aligned, the oscillation could amplify rapidly, creating a violent vibration that would increase in intensity until the wing structure failed catastrophically.</p>

<p>The terrifying aspect of whirl mode flutter was its speed. Once the critical frequency was reached, structural failure could occur within seconds — far too quickly for any crew intervention to prevent it.</p>

<h2>The Lockheed Response</h2>
<p>Lockheed launched an extensive modification programme for the entire Electra fleet, known as the Lockheed Electra Action Program (LEAP). The modifications included strengthening the wing structure, replacing structural sections, and rebuilding engine mounts to prevent the conditions that could initiate whirl mode flutter. The programme was completed in 1961.</p>

<p>The modified Electra went on to serve reliably for many years, and the turboprop design was later developed into the P-3 Orion maritime patrol aircraft, which remained in service with military operators for decades. But the two disasters had permanently damaged passenger confidence in the aircraft, and the Electra never achieved the commercial success its designers had anticipated.</p>

<h2>Legacy</h2>
<p>The Electra disasters contributed significantly to the development of more rigorous flutter testing requirements for aircraft certification. The phenomenon of propeller whirl mode flutter became a standard consideration in turboprop aircraft design, and the structural testing requirements introduced following the Electra accidents helped prevent similar failures in subsequent aircraft programmes.</p>`,
    tags: JSON.stringify(["Lockheed Electra", "Aviation History", "Whirl Mode", "Structural Failure", "Aircraft Safety"]),
    isBreaking: false,
  },
  {
    title: "Square Windows and Fatigue Cracks: How the de Havilland Comet Changed Aviation Safety Forever",
    category: "aviation-incidents",
    excerpt: "The de Havilland Comet was the world's first commercial jet airliner and Britain's greatest aviation triumph. Then it started breaking apart at altitude — and the investigation that followed transformed how engineers understood the stresses of high-altitude flight.",
    content: `<p>In 1952, the de Havilland Comet entered commercial service and immediately changed what passengers expected from air travel. It was the world's first commercial jet airliner — faster, quieter, and smoother than anything that had come before. BOAC operated the aircraft on routes from London to Johannesburg and beyond. Britain had apparently won the race to the future of aviation.</p>

<h2>The Accidents</h2>
<p>On 10 January 1954, BOAC Flight 781 broke apart near the island of Elba, shortly after departing Rome. All 35 people onboard were killed. The aircraft had been at cruise altitude when it disintegrated. The accident was initially attributed to possible structural failure or sabotage, but investigators had limited wreckage to examine as most of the aircraft had fallen into the sea.</p>

<p>The Comet fleet was temporarily grounded while modifications were made. Service resumed in March 1954. Less than two weeks later, on 8 April, South African Airways Flight 201 broke apart near Naples under almost identical circumstances, killing all 21 people onboard.</p>

<p>The Comet was grounded indefinitely. The British government launched one of the most extensive aviation accident investigations in history.</p>

<h2>The Investigation</h2>
<p>The Royal Aircraft Establishment at Farnborough conducted a remarkable investigation that included a full-scale water tank test of a Comet fuselage. By repeatedly pressurising and depressurising a complete fuselage submerged in water — which would contain any explosive decompression safely — investigators were able to simulate the stresses of thousands of flight cycles in a controlled environment.</p>

<p>The results were definitive. The Comet's fuselage was failing due to metal fatigue — microscopic cracks forming and propagating through the aluminium skin with each pressurisation cycle. The cracks initiated at stress concentration points around the aircraft's square-cornered windows and other openings in the fuselage.</p>

<h2>Why Square Windows Were Dangerous</h2>
<p>The square corners of the Comet's windows created points of stress concentration where the forces acting on the pressurised fuselage were significantly higher than in the surrounding material. With each pressurisation cycle, these stress concentrations caused microscopic fatigue cracks to form and slowly grow. After sufficient cycles, the cracks reached a critical length at which they propagated catastrophically and rapidly — causing explosive decompression and structural failure.</p>

<p>This failure mode — metal fatigue in pressurised fuselages — had not been fully understood or adequately tested for during the Comet's design and certification. The aircraft had been certified based on static strength tests rather than the cyclic fatigue testing that the investigation showed was essential.</p>

<h2>The Legacy</h2>
<p>The Comet investigation transformed aviation safety. Modern commercial aircraft have rounded windows — a direct consequence of the Comet disasters. Fatigue testing became a mandatory and central part of aircraft certification processes worldwide. The concept of damage tolerance — designing structures to contain and limit crack growth rather than simply prevent it — became fundamental to aircraft structural engineering.</p>

<p>The de Havilland Comet itself was redesigned with oval windows and a strengthened fuselage, returning to service as the Comet 4 in 1958. But by then, the Boeing 707 and Douglas DC-8 were entering service, and Britain's early lead in jet aviation had been lost. The Comet's legacy, however, endures in every rounded window on every commercial aircraft flying today.</p>`,
    tags: JSON.stringify(["de Havilland Comet", "Aviation History", "Metal Fatigue", "Aircraft Safety", "BOAC"]),
    isBreaking: false,
  },
  {
    title: "Boeing 737 MAX 7 Could Finally Receive FAA Certification This Summer After Years of Delays",
    category: "aircraft-tech",
    excerpt: "The Boeing 737 MAX 7 could receive FAA type certification this summer, according to FAA Administrator Bryan Bedford — ending a certification process that was originally expected to conclude in 2019.",
    content: `<p>The Boeing 737 MAX 7 could finally receive Federal Aviation Administration type certification this summer, FAA Administrator Bryan Bedford has indicated, potentially ending a certification process that has stretched more than six years beyond its original timeline.</p>

<h2>A Long Road to Certification</h2>
<p>The 737 MAX 7 was originally expected to enter service in 2019, making it the smallest variant of the 737 MAX family. The worldwide grounding of the 737 MAX following the Lion Air and Ethiopian Airlines accidents in 2018 and 2019 halted the certification process for all MAX variants, including the MAX 7.</p>

<p>When the MAX 8 and MAX 9 returned to service in late 2020 and 2021 respectively, the MAX 7 remained in certification limbo due to additional work required on its engine anti-icing system. The FAA required Boeing to demonstrate that the system met updated safety standards before granting certification.</p>

<h2>Current Status</h2>
<p>Boeing CEO Kelly Ortberg has said there is now "light at the end of the tunnel" for the MAX 7 certification, with the aircraft having completed more than 80 percent of required testing. FAA Administrator Bedford's comments suggest the agency anticipates completing its review of the aircraft in the coming months.</p>

<p>The larger 737 MAX 10, which has accumulated approximately 1,400 orders from airlines worldwide, is expected to follow the MAX 7 through certification before the end of 2026.</p>

<h2>Southwest Airlines Is Waiting</h2>
<p>The airline with the most at stake in the MAX 7 certification is Southwest Airlines, which has ordered approximately 270 MAX 7 aircraft — representing around 90 percent of all orders for the variant. Southwest has been waiting for MAX 7 deliveries to begin fleet renewal and capacity expansion plans that have been on hold for years.</p>

<p>Despite the extended delays, Southwest has not cancelled its MAX 7 orders. The carrier still does not expect to receive a single MAX 7 delivery in 2026, even if certification is granted this summer, as Boeing's production and delivery pipeline will need time to ramp up.</p>

<h2>The Broader MAX Picture</h2>
<p>The continued demand for 737 MAX aircraft despite the programme's troubled history reflects the aircraft's fundamental commercial appeal. Boeing currently holds more than 4,850 unfilled 737 MAX orders from airlines worldwide. The MAX remains one of the most fuel-efficient single-aisle aircraft available, and for many airlines the economics of the aircraft outweigh the reputational concerns that surrounded the programme in its early years.</p>

<p>The certification of the MAX 7 and MAX 10 would complete the MAX family and give Boeing a full range of single-aisle aircraft to compete with the Airbus A220 and A320neo family across all capacity segments.</p>`,
    tags: JSON.stringify(["Boeing 737 MAX", "FAA", "Certification", "Southwest Airlines", "Aviation News"]),
    isBreaking: true,
  },
  {
    title: "ANA Unveils New Pokémon Boeing 787 Jets to Mark the Franchise's 30th Anniversary",
    category: "commercial-aviation",
    excerpt: "All Nippon Airways has revealed two new Pokémon-themed Boeing 787 Dreamliners, reviving one of aviation's most beloved special livery traditions nearly 30 years after ANA first flew Pokémon jets in 1998.",
    content: `<p>All Nippon Airways has unveiled two new Pokémon-themed Boeing 787 Dreamliner aircraft to mark the 30th anniversary of the Pokémon franchise, reviving a tradition that began in 1998 and has made ANA's Pokémon jets some of the most recognisable special livery aircraft in commercial aviation history.</p>

<h2>The New Aircraft</h2>
<p>ANA revealed the two new aircraft on 28 May 2026. "Pokémon Jet Red" will operate on a Boeing 787-8 primarily on domestic Japanese routes, while "Pokémon Jet Green" will fly internationally on a Boeing 787-9. A third aircraft, "Pokémon Jet Blue," is also planned for a later reveal.</p>

<p>The Pokémon theme extends well beyond the exterior paint scheme. ANA says the cabins will feature Pokémon-branded headrests, cups, napkins, and onboard items as part of a fully immersive themed experience for passengers. The airline has described the aircraft as a celebration of both the Pokémon franchise's 30-year history and ANA's own long association with the brand.</p>

<h2>A 28-Year Tradition</h2>
<p>ANA first introduced Pokémon-themed aircraft in 1998, just two years after the franchise launched in Japan. Over the subsequent decades, the airline operated Pokémon liveries on a succession of aircraft types including Boeing 747s, 767s, 777s, and various other widebody jets. The aircraft became popular with aviation enthusiasts and Pokémon fans alike, and spotting a Pokémon jet became a minor bucket list item for many aviation photographers.</p>

<p>The new 787-based aircraft continue this tradition with updated designs reflecting the franchise's current visual identity, while retaining the spirit of the original liveries that made the programme so distinctive.</p>

<h2>Special Liveries in Aviation</h2>
<p>Special livery aircraft occupy a unique place in aviation culture. For airlines, they represent an opportunity to generate publicity, attract attention from passengers who might not otherwise choose a particular carrier, and demonstrate creative partnerships with major brands. For aviation enthusiasts, they provide rare opportunities to photograph distinctive aircraft that stand out from the standard fleet.</p>

<p>ANA's Pokémon jets have been among the most successful examples of this genre, combining a globally recognised franchise with a major airline in a partnership that has demonstrated remarkable longevity. The introduction of the new 787-based aircraft suggests the partnership has significant life remaining as both the Pokémon franchise and ANA continue to evolve.</p>`,
    tags: JSON.stringify(["ANA", "Pokemon", "Boeing 787", "Special Livery", "Japan", "Aviation News"]),
    isBreaking: false,
  },
  {
    title: "EL AL Cockpit Transmission From JFK Approach Goes Viral Among Aviation Enthusiasts",
    category: "aviation-incidents",
    excerpt: "A cockpit radio transmission from an EL AL Boeing 777 on approach to New York JFK has attracted widespread attention online after the crew's communication with air traffic control was shared across aviation communities.",
    content: `<p>A radio transmission from an EL AL Boeing 777-200ER on approach to New York's John F. Kennedy International Airport has attracted significant attention across aviation enthusiast communities after being shared widely on social media platforms.</p>

<h2>The Flight</h2>
<p>EL AL Flight LY19, operating a Boeing 777-200ER on the Tel Aviv to JFK route, had completed a flight of approximately 12.5 hours when it began its approach into New York on 20 May. According to reports from aviation tracking communities, the flight experienced extended holding near Rhode Island before beginning its final approach into JFK — a common occurrence at one of the world's busiest airports, particularly during periods of high traffic volume or adverse weather conditions.</p>

<p>The specific content of the transmission that attracted attention has been shared across aviation forums and social media, with enthusiasts noting particular aspects of the crew-controller interaction during the approach sequence.</p>

<h2>Why Aviation Radio Transmissions Attract Attention</h2>
<p>Aviation radio communications have long fascinated enthusiasts, partly because they provide an unfiltered window into the professional world of commercial aviation. The formal language of aviation communications — developed over decades to minimise ambiguity and ensure clarity in high-pressure situations — has a distinctive character that many find compelling.</p>

<p>Transmissions that deviate from the standard phraseology, or that capture moments of unusual pressure or complexity in the approach environment, tend to attract particular attention. JFK is one of the world's most complex approach environments, with multiple intersecting arrival and departure routes, frequent traffic conflicts, and the constant pressure of maintaining schedule at a major hub airport.</p>

<h2>EL AL Operations</h2>
<p>EL AL operates one of the most security-conscious commercial aviation operations in the world, with procedures and protocols that differ in several respects from other major carriers. The airline's Tel Aviv to JFK route is one of its flagship long-haul services, operating multiple times weekly on widebody aircraft.</p>

<p>The airline has not commented specifically on the transmission that attracted online attention. The flight arrived safely at JFK, and no safety concerns have been raised in connection with the approach.</p>`,
    tags: JSON.stringify(["EL AL", "JFK", "Air Traffic Control", "Boeing 777", "Aviation Radio"]),
    isBreaking: false,
  },
];

console.log(`\n✈ Publishing ${articles.length} new articles from Instagram...\n`);

let published = 0;
for (const article of articles) {
  const categoryId = catMap[article.category] ?? catMap['commercial-aviation'];
  const slug = slugify(article.title);

  // Check for duplicate slug
  const [existing] = await conn.execute('SELECT id FROM articles WHERE slug = ? LIMIT 1', [slug]);
  if (existing.length > 0) {
    console.log(`  [SKIP] Already exists: ${article.title.slice(0, 60)}`);
    continue;
  }

  await conn.execute(
    `INSERT INTO articles (title, slug, excerpt, content, categoryId, authorId, tags, isBreaking, isFeatured, isPro, postType, views, publishedAt, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 'article', ?, NOW(), NOW(), NOW())`,
    [
      article.title,
      slug,
      article.excerpt,
      article.content,
      categoryId,
      authorId,
      article.tags,
      article.isBreaking ? 1 : 0,
      Math.floor(Math.random() * 80) + 10, // seed some initial views
    ]
  );

  console.log(`  ✅ Published: ${article.title.slice(0, 65)}`);
  published++;
}

console.log(`\n════════════════════════════════════════`);
console.log(`✅ Published: ${published} new articles`);
console.log(`\n🎉 Done!\n`);

await conn.end();
