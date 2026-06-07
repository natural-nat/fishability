export interface Bait {
  name: string;
  condition: 'all' | 'low-light' | 'active' | 'cold' | 'warm' | 'cloudy' | 'clear';
}

/** Kinds of water bodies a species realistically lives in (drives Local view). */
export type WaterType = 'pond' | 'lake' | 'river' | 'coldwater' | 'bigwater';

export const WATER_TYPES: WaterType[] = ['pond', 'lake', 'river', 'coldwater', 'bigwater'];

export const WATER_TYPE_LABELS: Record<WaterType, string> = {
  pond:      'Pond',
  lake:      'Lake',
  river:     'River',
  coldwater: 'Cold Stream',
  bigwater:  'Big Water',
};

/** Longer description shown when a water type is selected. */
export const WATER_TYPE_HINTS: Record<WaterType, string> = {
  pond:      'Small still warm-water ponds & small lakes',
  lake:      'Larger lakes and reservoirs',
  river:     'Rivers, streams & slow-moving water',
  coldwater: 'Cold trout/salmon streams & deep cold lakes',
  bigwater:  'Great Lakes, large reservoirs & big rivers',
};

export interface Species {
  id: string;
  name: string;
  scientificName: string;
  /** Wikimedia Commons filename — USFWS / Duane Raver / Knepp field-guide illustrations */
  illustration: string;
  tempMin: number;
  tempOpt: [number, number];
  tempMax: number;
  feedingPeak: 'dawn-dusk' | 'dusk' | 'night' | 'dawn' | 'any';
  pressurePref: 'rising' | 'stable' | 'any';
  baits: Bait[];
  habitat: string;
  tip: string;
  peakMonths: number[];
  /** Baseline ease × abundance, 1 (very hard/rare) → 10 (everywhere/eager) */
  catchability: number;
  typicalSize: string;
  trophySize: string;
  /** Approximate range in North America */
  range: { latMin: number; latMax: number; lonMin: number; lonMax: number };
}

export const SPECIES: Species[] = [
  {
    id: 'largemouth-bass',
    name: 'Largemouth Bass',
    scientificName: 'Micropterus salmoides',
    illustration: 'Largemouth bass - DPLA - (white background).jpg',
    tempMin: 5, tempOpt: [18, 27], tempMax: 35,
    feedingPeak: 'dawn-dusk', pressurePref: 'stable',
    baits: [
      { name: 'Plastic Worm', condition: 'all' },
      { name: 'Topwater Popper', condition: 'low-light' },
      { name: 'Crankbait', condition: 'active' },
      { name: 'Spinnerbait', condition: 'cloudy' },
      { name: 'Jig', condition: 'cold' },
    ],
    habitat: 'Shallow cover — lily pads, fallen logs, dock pilings',
    tip: 'Work the edges of structure at first light before the sun hits the water.',
    peakMonths: [4, 5, 6, 7, 8, 9, 10],
    catchability: 4, typicalSize: '1–4 lb', trophySize: '8 lb+',
    range: { latMin: 24, latMax: 49, lonMin: -125, lonMax: -67 },
  },
  {
    id: 'smallmouth-bass',
    name: 'Smallmouth Bass',
    scientificName: 'Micropterus dolomieu',
    illustration: 'Smallmouth bass.png',
    tempMin: 4, tempOpt: [15, 24], tempMax: 32,
    feedingPeak: 'dawn-dusk', pressurePref: 'rising',
    baits: [
      { name: 'Tube Jig', condition: 'all' },
      { name: 'Ned Rig', condition: 'all' },
      { name: 'Crankbait', condition: 'active' },
      { name: 'Inline Spinner', condition: 'clear' },
      { name: 'Live Crayfish', condition: 'all' },
    ],
    habitat: 'Rocky points, gravel flats, river current seams',
    tip: 'Smallmouth patrol rocky structure and current breaks. Rising pressure triggers aggressive feeding.',
    peakMonths: [4, 5, 6, 7, 8, 9, 10],
    catchability: 4, typicalSize: '1–3 lb', trophySize: '5 lb+',
    range: { latMin: 33, latMax: 50, lonMin: -100, lonMax: -67 },
  },
  {
    id: 'rainbow-trout',
    name: 'Rainbow Trout',
    scientificName: 'Oncorhynchus mykiss',
    illustration: 'Oncorhynchus mykiss mid res 150dpi whiteBG.jpg',
    tempMin: 0, tempOpt: [10, 18], tempMax: 24,
    feedingPeak: 'dawn-dusk', pressurePref: 'stable',
    baits: [
      { name: 'PowerBait', condition: 'all' },
      { name: 'Rooster Tail Spinner', condition: 'all' },
      { name: 'Live Worm', condition: 'all' },
      { name: 'Dry Fly', condition: 'active' },
      { name: 'Small Crankbait', condition: 'active' },
    ],
    habitat: 'Cold clear water — mountain streams, tailwaters, stocked lakes',
    tip: 'Rainbow trout are cold-water fish. Early spring and fall are prime. Overcast days fish all day.',
    peakMonths: [1, 2, 3, 4, 10, 11, 12],
    catchability: 4, typicalSize: '1–3 lb', trophySize: '8 lb+',
    range: { latMin: 34, latMax: 62, lonMin: -130, lonMax: -67 },
  },
  {
    id: 'brown-trout',
    name: 'Brown Trout',
    scientificName: 'Salmo trutta',
    illustration: 'Brown trout FWS white background.jpg',
    tempMin: 1, tempOpt: [12, 19], tempMax: 25,
    feedingPeak: 'dusk', pressurePref: 'stable',
    baits: [
      { name: 'Rapala Minnow', condition: 'all' },
      { name: 'Dry Fly', condition: 'low-light' },
      { name: 'Nightcrawler', condition: 'all' },
      { name: 'Mepps Spinner', condition: 'active' },
    ],
    habitat: 'Deeper pools, undercut banks, cool tailwaters',
    tip: 'Big browns feed almost exclusively at dusk and after dark. Night fishing in summer is legendary.',
    peakMonths: [3, 4, 5, 9, 10, 11],
    catchability: 2, typicalSize: '1–4 lb', trophySize: '12 lb+',
    range: { latMin: 33, latMax: 56, lonMin: -125, lonMax: -67 },
  },
  {
    id: 'brook-trout',
    name: 'Brook Trout',
    scientificName: 'Salvelinus fontinalis',
    illustration: 'Brook trout.jpg',
    tempMin: 0, tempOpt: [8, 16], tempMax: 20,
    feedingPeak: 'dawn-dusk', pressurePref: 'stable',
    baits: [
      { name: 'Small Spinner', condition: 'all' },
      { name: 'Live Worm', condition: 'all' },
      { name: 'Dry Fly', condition: 'low-light' },
      { name: 'Small Streamer', condition: 'active' },
    ],
    habitat: 'Small cold mountain streams, beaver ponds, spring-fed creeks',
    tip: 'Brookies love the coldest, clearest water. Small streams in shaded valleys are best.',
    peakMonths: [3, 4, 5, 9, 10, 11],
    catchability: 3, typicalSize: '0.5–1.5 lb', trophySize: '4 lb+',
    range: { latMin: 36, latMax: 60, lonMin: -95, lonMax: -67 },
  },
  {
    id: 'lake-trout',
    name: 'Lake Trout',
    scientificName: 'Salvelinus namaycush',
    illustration: 'Lake trout.jpg',
    tempMin: 0, tempOpt: [6, 13], tempMax: 18,
    feedingPeak: 'dawn-dusk', pressurePref: 'stable',
    baits: [
      { name: 'Deep Jigging Spoon', condition: 'all' },
      { name: 'Lake Trout Tube Jig', condition: 'all' },
      { name: 'Trolled Spoon', condition: 'active' },
      { name: 'Live Cisco', condition: 'cold' },
    ],
    habitat: 'Deep, cold, clear lakes — suspends over deep basins',
    tip: 'Lakers hold deep most of the year. In early spring after ice-out they cruise shallow; later, jig deep structure.',
    peakMonths: [1, 2, 3, 4, 11, 12],
    catchability: 2, typicalSize: '4–10 lb', trophySize: '25 lb+',
    range: { latMin: 41, latMax: 60, lonMin: -125, lonMax: -67 },
  },
  {
    id: 'cutthroat-trout',
    name: 'Cutthroat Trout',
    scientificName: 'Oncorhynchus clarkii',
    illustration: 'Oncorhynchus clarkii.jpg',
    tempMin: 0, tempOpt: [9, 16], tempMax: 22,
    feedingPeak: 'dawn-dusk', pressurePref: 'stable',
    baits: [
      { name: 'Dry Fly', condition: 'active' },
      { name: 'Small Spinner', condition: 'all' },
      { name: 'Live Worm', condition: 'all' },
      { name: 'Woolly Bugger', condition: 'low-light' },
    ],
    habitat: 'Cold western streams, high-mountain lakes, beaver ponds',
    tip: 'Cutthroat are willing surface feeders. A drifted dry fly in a mountain stream is hard to beat.',
    peakMonths: [6, 7, 8, 9, 10],
    catchability: 3, typicalSize: '1–3 lb', trophySize: '6 lb+',
    range: { latMin: 36, latMax: 49, lonMin: -125, lonMax: -104 },
  },
  {
    id: 'landlocked-salmon',
    name: 'Landlocked Salmon',
    scientificName: 'Salmo salar',
    illustration: 'Salmo salar.jpg',
    tempMin: 0, tempOpt: [8, 15], tempMax: 20,
    feedingPeak: 'dawn-dusk', pressurePref: 'stable',
    baits: [
      { name: 'Trolled Smelt', condition: 'all' },
      { name: 'Streamer Fly', condition: 'low-light' },
      { name: 'Flutter Spoon', condition: 'active' },
      { name: 'Live Smelt', condition: 'cold' },
    ],
    habitat: 'Cold deep northern lakes; follows smelt schools near the surface after ice-out',
    tip: 'Troll near the surface right after ice-out, then go deeper as the water warms. They chase smelt.',
    peakMonths: [4, 5, 6, 9, 10],
    catchability: 2, typicalSize: '2–4 lb', trophySize: '8 lb+',
    range: { latMin: 41, latMax: 48, lonMin: -95, lonMax: -67 },
  },
  {
    id: 'walleye',
    name: 'Walleye',
    scientificName: 'Sander vitreus',
    illustration: 'Walleye fish stizostedion canadense.jpg',
    tempMin: 2, tempOpt: [15, 22], tempMax: 28,
    feedingPeak: 'dusk', pressurePref: 'stable',
    baits: [
      { name: 'Jig + Live Minnow', condition: 'all' },
      { name: 'Nightcrawler Harness', condition: 'all' },
      { name: 'Walleye Crankbait', condition: 'active' },
      { name: 'Blade Bait', condition: 'cold' },
    ],
    habitat: 'Murky mid-depth water, rock piles, avoiding bright light',
    tip: 'Walleye are highly light-sensitive. Fish after sunset or on overcast days near rock humps.',
    peakMonths: [3, 4, 5, 6, 9, 10, 11],
    catchability: 3, typicalSize: '1–3 lb', trophySize: '8 lb+',
    range: { latMin: 38, latMax: 60, lonMin: -110, lonMax: -67 },
  },
  {
    id: 'sauger',
    name: 'Sauger',
    scientificName: 'Sander canadensis',
    illustration: 'Saugernctc.jpg',
    tempMin: 2, tempOpt: [14, 21], tempMax: 27,
    feedingPeak: 'dusk', pressurePref: 'stable',
    baits: [
      { name: 'Jig + Minnow', condition: 'all' },
      { name: 'Blade Bait', condition: 'cold' },
      { name: 'Soft Plastic Grub', condition: 'active' },
    ],
    habitat: 'Big-river current, deep wing dams, turbid tailwaters',
    tip: 'Sauger tolerate murky river current better than walleye. Work jigs along the bottom near wing dams.',
    peakMonths: [3, 4, 5, 10, 11],
    catchability: 3, typicalSize: '0.75–2 lb', trophySize: '4 lb+',
    range: { latMin: 36, latMax: 49, lonMin: -110, lonMax: -77 },
  },
  {
    id: 'muskellunge',
    name: 'Muskellunge',
    scientificName: 'Esox masquinongy',
    illustration: 'Muskellunge (Duane Raver).png',
    tempMin: 4, tempOpt: [15, 22], tempMax: 30,
    feedingPeak: 'dawn-dusk', pressurePref: 'rising',
    baits: [
      { name: 'Large Jerkbait', condition: 'all' },
      { name: 'Bucktail Spinner', condition: 'all' },
      { name: 'Topwater Bait', condition: 'low-light' },
      { name: 'Large Swimbait', condition: 'active' },
    ],
    habitat: 'Large lakes and rivers, weed edges, deep timber',
    tip: 'Muskie are the "fish of ten thousand casts." Rare and elusive — patience and big presentations are key.',
    peakMonths: [5, 6, 9, 10, 11],
    catchability: 1, typicalSize: '10–20 lb', trophySize: '40 lb+',
    range: { latMin: 38, latMax: 52, lonMin: -97, lonMax: -67 },
  },
  {
    id: 'northern-pike',
    name: 'Northern Pike',
    scientificName: 'Esox lucius',
    illustration: 'Esox lucius1.jpg',
    tempMin: 2, tempOpt: [10, 20], tempMax: 28,
    feedingPeak: 'dawn-dusk', pressurePref: 'any',
    baits: [
      { name: 'Large Spoon', condition: 'all' },
      { name: 'Spinnerbait', condition: 'all' },
      { name: 'Large Swimbait', condition: 'active' },
      { name: 'Sucker Minnow (dead bait)', condition: 'cold' },
    ],
    habitat: 'Shallow weedy bays, vegetation edges, ambush points',
    tip: 'Pike are aggressive in cool water. Post-ice-out spring fishing can be spectacular along weed lines.',
    peakMonths: [3, 4, 5, 6, 9, 10, 11],
    catchability: 3, typicalSize: '3–8 lb', trophySize: '20 lb+',
    range: { latMin: 41, latMax: 60, lonMin: -125, lonMax: -67 },
  },
  {
    id: 'chain-pickerel',
    name: 'Chain Pickerel',
    scientificName: 'Esox niger',
    illustration: 'Chain pickerel (Duane Raver).png',
    tempMin: 2, tempOpt: [10, 20], tempMax: 28,
    feedingPeak: 'dawn-dusk', pressurePref: 'any',
    baits: [
      { name: 'Spinnerbait', condition: 'all' },
      { name: 'Spoon', condition: 'all' },
      { name: 'Soft Jerkbait', condition: 'active' },
      { name: 'Live Minnow', condition: 'cold' },
    ],
    habitat: 'Weedy shallows, lily pads, slow rivers and ponds',
    tip: 'Pickerel ambush from weed edges. A spinnerbait burned along grass lines triggers reaction strikes.',
    peakMonths: [3, 4, 5, 10, 11, 12],
    catchability: 4, typicalSize: '1–2 lb', trophySize: '4 lb+',
    range: { latMin: 28, latMax: 47, lonMin: -95, lonMax: -67 },
  },
  {
    id: 'channel-catfish',
    name: 'Channel Catfish',
    scientificName: 'Ictalurus punctatus',
    illustration: 'Ictalurus punctatus (white background).png',
    tempMin: 8, tempOpt: [22, 30], tempMax: 36,
    feedingPeak: 'night', pressurePref: 'any',
    baits: [
      { name: 'Cut Shad', condition: 'all' },
      { name: 'Chicken Liver', condition: 'warm' },
      { name: 'Stink Bait Dip', condition: 'warm' },
      { name: 'Live Nightcrawler', condition: 'all' },
    ],
    habitat: 'Deep river holes, reservoir flats, slow current bends',
    tip: 'Channel cats feed almost entirely by smell. Strong-scented bait after dark in warm water is the formula.',
    peakMonths: [5, 6, 7, 8, 9, 10],
    catchability: 4, typicalSize: '2–8 lb', trophySize: '20 lb+',
    range: { latMin: 24, latMax: 49, lonMin: -110, lonMax: -67 },
  },
  {
    id: 'flathead-catfish',
    name: 'Flathead Catfish',
    scientificName: 'Pylodictis olivaris',
    illustration: 'Flathead catfish (white background).jpg',
    tempMin: 10, tempOpt: [24, 30], tempMax: 35,
    feedingPeak: 'night', pressurePref: 'any',
    baits: [
      { name: 'Live Bluegill', condition: 'all' },
      { name: 'Live Bait', condition: 'all' },
      { name: 'Cut Bait', condition: 'warm' },
    ],
    habitat: 'Deep timber-filled river holes, log jams',
    tip: 'Flatheads want live bait. Fish a lively sunfish near submerged timber after dark.',
    peakMonths: [5, 6, 7, 8, 9],
    catchability: 2, typicalSize: '5–20 lb', trophySize: '50 lb+',
    range: { latMin: 25, latMax: 43, lonMin: -100, lonMax: -75 },
  },
  {
    id: 'blue-catfish',
    name: 'Blue Catfish',
    scientificName: 'Ictalurus furcatus',
    illustration: 'Blue catfish ictalurus furcatus fish (white background).jpg',
    tempMin: 5, tempOpt: [20, 28], tempMax: 34,
    feedingPeak: 'night', pressurePref: 'any',
    baits: [
      { name: 'Cut Shad', condition: 'all' },
      { name: 'Skipjack Herring', condition: 'all' },
      { name: 'Cut Bait', condition: 'warm' },
    ],
    habitat: 'Main-river channels, deep flats, reservoir points',
    tip: 'Big blues roam open water. Drift fresh cut shad across deep flats and channel edges.',
    peakMonths: [4, 5, 6, 9, 10, 11],
    catchability: 3, typicalSize: '5–20 lb', trophySize: '50 lb+',
    range: { latMin: 25, latMax: 42, lonMin: -100, lonMax: -76 },
  },
  {
    id: 'brown-bullhead',
    name: 'Brown Bullhead',
    scientificName: 'Ameiurus nebulosus',
    illustration: 'Brown bullhead fish ameiurus nebulosus (white background).jpg',
    tempMin: 6, tempOpt: [18, 27], tempMax: 33,
    feedingPeak: 'night', pressurePref: 'any',
    baits: [
      { name: 'Nightcrawler', condition: 'all' },
      { name: 'Cut Bait', condition: 'all' },
      { name: 'Chicken Liver', condition: 'warm' },
    ],
    habitat: 'Soft-bottomed ponds, slow rivers, weedy shallows',
    tip: 'Bullheads feed by smell on the bottom after dark. A nightcrawler on the bottom is all it takes.',
    peakMonths: [4, 5, 6, 7, 8, 9],
    catchability: 4, typicalSize: '0.5–1.5 lb', trophySize: '3 lb+',
    range: { latMin: 28, latMax: 49, lonMin: -125, lonMax: -67 },
  },
  {
    id: 'yellow-perch',
    name: 'Yellow Perch',
    scientificName: 'Perca flavescens',
    illustration: 'Yellow perch fish perca flavescens.jpg',
    tempMin: 2, tempOpt: [14, 22], tempMax: 28,
    feedingPeak: 'dawn-dusk', pressurePref: 'stable',
    baits: [
      { name: 'Small Jig + Minnow', condition: 'all' },
      { name: 'Worm on Hook', condition: 'all' },
      { name: 'Small Soft Plastic', condition: 'active' },
      { name: 'Ice Jig', condition: 'cold' },
    ],
    habitat: 'Mid-depth open water, weed edges, sandy bottoms',
    tip: 'Perch school by size. Once you locate a school they bite fast. A great ice-fishing target.',
    peakMonths: [1, 2, 3, 4, 10, 11, 12],
    catchability: 5, typicalSize: '0.3–0.8 lb', trophySize: '1.5 lb+',
    range: { latMin: 36, latMax: 60, lonMin: -110, lonMax: -67 },
  },
  {
    id: 'white-perch',
    name: 'White Perch',
    scientificName: 'Morone americana',
    illustration: 'Whiteperchnctc (white background).jpg',
    tempMin: 4, tempOpt: [15, 23], tempMax: 29,
    feedingPeak: 'dawn-dusk', pressurePref: 'stable',
    baits: [
      { name: 'Small Jig', condition: 'all' },
      { name: 'Live Worm', condition: 'all' },
      { name: 'Small Spinner', condition: 'active' },
      { name: 'Grass Shrimp', condition: 'all' },
    ],
    habitat: 'Open water and tidal rivers of the Northeast, schooling near bottom',
    tip: 'White perch travel in big schools. Find one and you can fill a bucket — great eating, too.',
    peakMonths: [4, 5, 6, 9, 10],
    catchability: 4, typicalSize: '0.3–0.7 lb', trophySize: '1.5 lb+',
    range: { latMin: 35, latMax: 47, lonMin: -85, lonMax: -67 },
  },
  {
    id: 'white-crappie',
    name: 'White Crappie',
    scientificName: 'Pomoxis annularis',
    illustration: 'White crappie pomoxis annularis (white background).jpg',
    tempMin: 6, tempOpt: [16, 24], tempMax: 30,
    feedingPeak: 'dawn-dusk', pressurePref: 'stable',
    baits: [
      { name: 'Small Jig (1/16 oz)', condition: 'all' },
      { name: 'Live Minnow', condition: 'all' },
      { name: 'Tube Bait', condition: 'cold' },
    ],
    habitat: 'Brush piles, standing timber, creek channels',
    tip: 'Crappie hold tight to brush. Vertical-jig a minnow around submerged timber at first light.',
    peakMonths: [3, 4, 5, 9, 10],
    catchability: 4, typicalSize: '0.5–1 lb', trophySize: '2.5 lb+',
    range: { latMin: 26, latMax: 46, lonMin: -100, lonMax: -75 },
  },
  {
    id: 'bluegill',
    name: 'Bluegill',
    scientificName: 'Lepomis macrochirus',
    illustration: 'Lepomis macrochirus.jpg',
    tempMin: 8, tempOpt: [20, 28], tempMax: 35,
    feedingPeak: 'dawn-dusk', pressurePref: 'stable',
    baits: [
      { name: 'Worm on Small Hook', condition: 'all' },
      { name: 'Cricket', condition: 'warm' },
      { name: 'Small Popper', condition: 'low-light' },
      { name: 'Tiny Jig (1/32 oz)', condition: 'all' },
    ],
    habitat: 'Shallow nearshore vegetation, spawning beds, dock shade',
    tip: 'Bluegill school heavily. Once you find one you find dozens — the best fish for beginners and kids.',
    peakMonths: [4, 5, 6, 7, 8, 9, 10],
    catchability: 5, typicalSize: '0.25–0.75 lb', trophySize: '1.5 lb+',
    range: { latMin: 25, latMax: 48, lonMin: -122, lonMax: -67 },
  },
  {
    id: 'pumpkinseed',
    name: 'Pumpkinseed',
    scientificName: 'Lepomis gibbosus',
    illustration: 'Lepomis gibbosus2 (white background).jpg',
    tempMin: 8, tempOpt: [18, 26], tempMax: 32,
    feedingPeak: 'dawn-dusk', pressurePref: 'stable',
    baits: [
      { name: 'Worm on Small Hook', condition: 'all' },
      { name: 'Small Jig', condition: 'all' },
      { name: 'Cricket', condition: 'warm' },
    ],
    habitat: 'Weedy shallows, docks, ponds',
    tip: 'A classic panfish — a worm under a bobber near weeds keeps the action steady. Great for kids.',
    peakMonths: [4, 5, 6, 7, 8, 9],
    catchability: 5, typicalSize: '0.2–0.5 lb', trophySize: '1 lb+',
    range: { latMin: 30, latMax: 49, lonMin: -95, lonMax: -67 },
  },
  {
    id: 'redear-sunfish',
    name: 'Redear Sunfish',
    scientificName: 'Lepomis microlophus',
    illustration: 'Redearsunfishnctc (white background).jpg',
    tempMin: 10, tempOpt: [20, 28], tempMax: 34,
    feedingPeak: 'dawn-dusk', pressurePref: 'stable',
    baits: [
      { name: 'Red Worm', condition: 'all' },
      { name: 'Small Jig', condition: 'all' },
      { name: 'Cricket', condition: 'warm' },
      { name: 'Grub', condition: 'all' },
    ],
    habitat: 'Bottom near shell beds, southern ponds and lakes',
    tip: "Redear ('shellcracker') feed on snails near bottom — fish a worm right on the deck.",
    peakMonths: [3, 4, 5, 6, 9, 10],
    catchability: 4, typicalSize: '0.5–1 lb', trophySize: '2.5 lb+',
    range: { latMin: 25, latMax: 40, lonMin: -100, lonMax: -75 },
  },
  {
    id: 'common-carp',
    name: 'Common Carp',
    scientificName: 'Cyprinus carpio',
    illustration: 'Common carp (white background).jpg',
    tempMin: 4, tempOpt: [18, 28], tempMax: 35,
    feedingPeak: 'any', pressurePref: 'any',
    baits: [
      { name: 'Sweet Corn', condition: 'all' },
      { name: 'Dough Bait', condition: 'warm' },
      { name: 'Boilie', condition: 'all' },
      { name: 'Bread', condition: 'all' },
    ],
    habitat: 'Shallow mud flats, slow rivers, urban ponds',
    tip: 'Carp root along soft bottoms. Chum with corn and fish a tight line on the bottom.',
    peakMonths: [4, 5, 6, 7, 8, 9, 10],
    catchability: 4, typicalSize: '3–10 lb', trophySize: '25 lb+',
    range: { latMin: 25, latMax: 50, lonMin: -125, lonMax: -67 },
  },
  {
    id: 'white-bass',
    name: 'White Bass',
    scientificName: 'Morone chrysops',
    illustration: 'Morone chrysops white bass fish (white background).jpg',
    tempMin: 6, tempOpt: [16, 24], tempMax: 30,
    feedingPeak: 'dawn-dusk', pressurePref: 'rising',
    baits: [
      { name: 'Small Spoon', condition: 'active' },
      { name: 'Inline Spinner', condition: 'active' },
      { name: 'Jig', condition: 'all' },
      { name: 'Live Minnow', condition: 'all' },
    ],
    habitat: 'Open-water schools, river mouths during spawn runs',
    tip: 'White bass run upriver in spring and chase shad schools. Cast spoons into surface boils.',
    peakMonths: [3, 4, 5, 9, 10],
    catchability: 4, typicalSize: '0.75–1.5 lb', trophySize: '3 lb+',
    range: { latMin: 28, latMax: 49, lonMin: -100, lonMax: -75 },
  },
  {
    id: 'striped-bass',
    name: 'Striped Bass',
    scientificName: 'Morone saxatilis',
    illustration: 'Striped bass morone saxatilis fish (white background).jpg',
    tempMin: 4, tempOpt: [12, 22], tempMax: 28,
    feedingPeak: 'dawn-dusk', pressurePref: 'stable',
    baits: [
      { name: 'Live Shad', condition: 'all' },
      { name: 'Bucktail Jig', condition: 'active' },
      { name: 'Topwater Plug', condition: 'low-light' },
      { name: 'Umbrella Rig', condition: 'all' },
    ],
    habitat: 'Open water and tailraces of large reservoirs, following shad schools',
    tip: 'Landlocked stripers chase shad in open water. Watch for surface boils and birds at dawn.',
    peakMonths: [3, 4, 5, 6, 9, 10, 11],
    catchability: 3, typicalSize: '5–15 lb', trophySize: '30 lb+',
    range: { latMin: 28, latMax: 42, lonMin: -100, lonMax: -73 },
  },
  {
    id: 'bowfin',
    name: 'Bowfin',
    scientificName: 'Amia calva',
    illustration: 'Amia calva (white background).jpg',
    tempMin: 8, tempOpt: [20, 30], tempMax: 36,
    feedingPeak: 'dawn-dusk', pressurePref: 'any',
    baits: [
      { name: 'Cut Bait', condition: 'all' },
      { name: 'Live Minnow', condition: 'all' },
      { name: 'Spinnerbait', condition: 'active' },
      { name: 'Soft Plastic', condition: 'warm' },
    ],
    habitat: 'Weedy backwaters, swamps, slow vegetated rivers',
    tip: 'Bowfin are prehistoric brawlers. They hammer cut bait and lures in warm, weedy backwaters — a hard fight.',
    peakMonths: [5, 6, 7, 8, 9],
    catchability: 2, typicalSize: '2–5 lb', trophySize: '10 lb+',
    range: { latMin: 28, latMax: 46, lonMin: -98, lonMax: -73 },
  },
  {
    id: 'american-shad',
    name: 'American Shad',
    scientificName: 'Alosa sapidissima',
    illustration: 'American shad fish alosa sapidissima (white background).jpg',
    tempMin: 8, tempOpt: [13, 19], tempMax: 24,
    feedingPeak: 'dawn-dusk', pressurePref: 'stable',
    baits: [
      { name: 'Shad Dart', condition: 'all' },
      { name: 'Flutter Spoon', condition: 'active' },
      { name: 'Small Jig', condition: 'all' },
    ],
    habitat: 'Coastal rivers during the spring spawning run',
    tip: 'Shad pour into coastal rivers each spring. Swing a bright shad dart in the current during the run.',
    peakMonths: [4, 5, 6],
    catchability: 3, typicalSize: '2–4 lb', trophySize: '6 lb+',
    range: { latMin: 30, latMax: 46, lonMin: -82, lonMax: -67 },
  },
];

// ─── Image URL ──────────────────────────────────────────────────────────────────

/** Build a Wikimedia Commons thumbnail URL from a filename. Works directly in <img src>. */
export function illustrationUrl(file: string, width = 500): string {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${width}`;
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

export interface SpeciesScore {
  conditions: number;        // 0–10 — how favorable conditions are for this species right now
  conditionsRating: string;  // Poor / Fair / Good / Excellent
  catchChance: number;       // 0–10 — realistic chance, conditions blended with catchability
  chanceRating: string;      // Very Low / Low / Moderate / High
  baits: string[];
  note: string;
  optimalTime: string;       // ideal time window, always populated
  inSeason: boolean;
}

function timeScore(species: Species, datetime: string, sunrise: string, sunset: string): number {
  const t    = new Date(datetime).getTime();
  const rise = new Date(sunrise).getTime();
  const set  = new Date(sunset).getTime();
  const isNight    = t < rise || t > set;
  const dawnWindow = Math.abs(t - rise) < 90 * 60000;
  const duskWindow = Math.abs(t - set)  < 90 * 60000;
  const isMorning  = t > rise && t < rise + 3 * 3600000;
  const isEvening  = t > set - 3 * 3600000 && t < set;

  switch (species.feedingPeak) {
    case 'dawn-dusk':
      if (dawnWindow || duskWindow) return 3;
      if (isMorning || isEvening) return 2;
      if (isNight) return 1;
      return 0;
    case 'dusk':
      if (duskWindow) return 3;
      if (isEvening) return 2;
      if (isNight) return 1;
      return 0;
    case 'dawn':
      if (dawnWindow) return 3;
      if (isMorning) return 2;
      return 0;
    case 'night':
      if (isNight) return 3;
      if (dawnWindow || duskWindow) return 2;
      return 0;
    default: return 2;
  }
}

function tempScore(species: Species, temp: number): number {
  const [lo, hi] = species.tempOpt;
  if (temp < species.tempMin || temp > species.tempMax) return 0;
  if (temp >= lo && temp <= hi) return 4;
  const dist = Math.min(Math.abs(temp - lo), Math.abs(temp - hi));
  if (dist <= 3) return 3;
  if (dist <= 6) return 2;
  return 1;
}

function conditionsScoreFn(species: Species, pressureTrend: number, cloudCover: number): number {
  let score = 0;
  if (species.pressurePref === 'rising' && pressureTrend > 0.5) score += 2;
  else if (species.pressurePref === 'stable' && Math.abs(pressureTrend) <= 1) score += 2;
  else if (species.pressurePref === 'any') score += 2;
  else if (pressureTrend > -0.5) score += 1;
  if (cloudCover >= 30) score += 1;
  return score;
}

function pickBaits(
  species: Species, temp: number, datetime: string,
  sunrise: string, sunset: string, cloudCover: number, pressureTrend: number,
): string[] {
  const t          = new Date(datetime).getTime();
  const rise       = new Date(sunrise).getTime();
  const set        = new Date(sunset).getTime();
  const isNight    = t < rise || t > set;
  const isDawnDusk = Math.abs(t - rise) < 90 * 60000 || Math.abs(t - set) < 90 * 60000;
  const isLowLight = isNight || isDawnDusk || cloudCover > 60;
  const isActive   = pressureTrend > 0 && temp >= species.tempOpt[0] && temp <= species.tempOpt[1];
  const isCold     = temp < species.tempOpt[0];

  return species.baits
    .filter(b => {
      if (b.condition === 'all') return true;
      if (b.condition === 'low-light' && isLowLight) return true;
      if (b.condition === 'active' && isActive) return true;
      if (b.condition === 'cold' && isCold) return true;
      if (b.condition === 'warm' && !isCold) return true;
      if (b.condition === 'cloudy' && cloudCover > 50) return true;
      if (b.condition === 'clear' && cloudCover < 30) return true;
      return false;
    })
    .slice(0, 3)
    .map(b => b.name);
}

export function optimalTimeHint(species: Species, sunrise: string, sunset: string): string {
  const pad   = (n: number) => String(n).padStart(2, '0');
  const riseH = sunrise ? new Date(sunrise).getHours() : 6;
  const setH  = sunset  ? new Date(sunset).getHours()  : 20;
  switch (species.feedingPeak) {
    case 'dawn-dusk':
      return `${pad(riseH)}:00–${pad(riseH + 1)}:30 or ${pad(setH - 1)}:00–${pad(setH + 1)}:00`;
    case 'dusk':
      return `${pad(setH - 1)}:00–${pad(setH + 1)}:30 around sunset`;
    case 'dawn':
      return `${pad(riseH)}:00–${pad(riseH + 1)}:30 at first light`;
    case 'night':
      return `after ${pad(setH + 1)}:00 when fully dark`;
    default:
      return 'feeds throughout the day';
  }
}

// Catchability 1–5 → weighting applied to the conditions score
const CATCH_FACTOR: Record<number, number> = { 1: 0.1, 2: 0.3, 3: 0.5, 4: 0.75, 5: 1.0 };

/** Recommended main-line weight per species (keyed by id) */
export const RECOMMENDED_LINE: Record<string, string> = {
  'largemouth-bass':   '8–15 lb mono (go heavier in thick cover)',
  'smallmouth-bass':   '6–10 lb mono or fluorocarbon',
  'rainbow-trout':     '4–6 lb light mono',
  'brown-trout':       '4–8 lb fluorocarbon',
  'brook-trout':       '2–4 lb ultralight',
  'lake-trout':        '10–20 lb braid for deep jigging',
  'cutthroat-trout':   '4–6 lb light mono',
  'landlocked-salmon': '6–10 lb mono for trolling',
  'walleye':           '6–10 lb mono or fluorocarbon',
  'sauger':            '6–8 lb mono',
  'muskellunge':       '50–80 lb braid + heavy wire leader',
  'northern-pike':     '20–30 lb braid + wire/heavy fluoro leader',
  'chain-pickerel':    '8–12 lb mono + heavy leader (teeth)',
  'channel-catfish':   '15–30 lb mono',
  'flathead-catfish':  '30–50 lb braid',
  'blue-catfish':      '30–50 lb braid',
  'brown-bullhead':    '6–10 lb mono',
  'yellow-perch':      '2–6 lb light line',
  'white-perch':       '4–6 lb light line',
  'white-crappie':     '4–6 lb light line',
  'bluegill':          '2–4 lb ultralight',
  'pumpkinseed':       '2–4 lb ultralight',
  'redear-sunfish':    '4–6 lb light line',
  'common-carp':       '10–15 lb mono',
  'white-bass':        '6–10 lb mono',
  'striped-bass':      '15–25 lb mono or braid',
  'bowfin':            '15–30 lb abrasion-resistant braid',
  'american-shad':     '6–8 lb light line',
};

/** Water-body types each species realistically inhabits, keyed by id.
    Used by Local view to narrow the regional list to what's actually in
    the specific body of water you picked. */
export const SPECIES_WATERS: Record<string, WaterType[]> = {
  'largemouth-bass':   ['pond', 'lake', 'river'],
  'smallmouth-bass':   ['lake', 'river'],
  'rainbow-trout':     ['coldwater', 'lake'],
  'brown-trout':       ['coldwater', 'river'],
  'brook-trout':       ['coldwater'],
  'lake-trout':        ['coldwater', 'bigwater'],
  'cutthroat-trout':   ['coldwater'],
  'landlocked-salmon': ['coldwater', 'bigwater'],
  'walleye':           ['lake', 'river', 'bigwater'],
  'sauger':            ['river', 'bigwater'],
  'muskellunge':       ['lake', 'river', 'bigwater'],
  'northern-pike':     ['pond', 'lake', 'river'],
  'chain-pickerel':    ['pond', 'lake', 'river'],
  'channel-catfish':   ['pond', 'lake', 'river'],
  'flathead-catfish':  ['river', 'bigwater'],
  'blue-catfish':      ['river', 'bigwater'],
  'brown-bullhead':    ['pond', 'lake', 'river'],
  'yellow-perch':      ['pond', 'lake', 'river'],
  'white-perch':       ['lake', 'river', 'bigwater'],
  'white-crappie':     ['pond', 'lake', 'river'],
  'bluegill':          ['pond', 'lake', 'river'],
  'pumpkinseed':       ['pond', 'lake'],
  'redear-sunfish':    ['pond', 'lake'],
  'common-carp':       ['pond', 'lake', 'river'],
  'white-bass':        ['lake', 'river', 'bigwater'],
  'striped-bass':      ['bigwater'],
  'bowfin':            ['pond', 'river'],
  'american-shad':     ['river', 'bigwater'],
};

/** Water types for a species (defaults to the common pond/lake/river set). */
export function speciesWaters(id: string): WaterType[] {
  return SPECIES_WATERS[id] ?? ['pond', 'lake', 'river'];
}

export function scoreSpecies(
  species: Species, temp: number, datetime: string,
  pressureTrend: number, cloudCover: number, sunrise: string, sunset: string,
): SpeciesScore {
  const t = tempScore(species, temp);
  const d = timeScore(species, datetime, sunrise, sunset);
  const c = conditionsScoreFn(species, pressureTrend, cloudCover);
  const conditions = Math.min(10, t + d + c);

  const conditionsRating =
    conditions >= 8 ? 'Excellent' :
    conditions >= 6 ? 'Good' :
    conditions >= 4 ? 'Fair' : 'Poor';

  // Realistic catch chance blends current conditions with the species' baseline catchability
  const catchChance = Math.round(conditions * (CATCH_FACTOR[species.catchability] ?? 0.5));
  const chanceRating =
    catchChance >= 6 ? 'High' :
    catchChance >= 4 ? 'Moderate' :
    catchChance >= 2 ? 'Low' : 'Very Low';

  const baits = pickBaits(species, temp, datetime, sunrise, sunset, cloudCover, pressureTrend);

  let note: string;
  if (temp < species.tempMin)      note = `Water too cold. ${species.name} is nearly dormant below ${species.tempMin}°C.`;
  else if (temp > species.tempMax) note = `Too warm. ${species.name} has moved to deep, oxygenated water.`;
  else if (d === 0 && species.feedingPeak !== 'any')
    note = `Off-peak hours — ${species.name} feeds primarily at ${species.feedingPeak === 'dawn-dusk' ? 'dawn and dusk' : species.feedingPeak}.`;
  else if (pressureTrend < -1.5)   note = 'Falling pressure is suppressing feeding. Try slow presentations near bottom structure.';
  else                             note = species.tip;

  const inSeason = species.peakMonths.includes(
    new Date(datetime.split('T')[0] + 'T12:00:00').getMonth() + 1
  );

  const optimalTime = optimalTimeHint(species, sunrise, sunset);

  return { conditions, conditionsRating, catchChance, chanceRating, baits, note, optimalTime, inSeason };
}
