// Seed dataset. Images are fetched at runtime (see src/api/images.js) — only
// search queries are stored here, never image URLs, per the assignment's
// "images must come from an API" requirement.

export const destinations = [
  {
    id: "kyoto",
    name: "Kyoto",
    country: "Japan",
    region: "Asia",
    lat: 35.0116,
    lon: 135.7681,
    tagline: "A thousand years of temples, gardens, and quiet ritual.",
    description:
      "Once the imperial capital, Kyoto keeps its history close: wooden machiya streets, moss gardens shaped over centuries, and over a thousand Buddhist temples and Shinto shrines still in daily use. Best experienced on foot, slowly.",
    tags: ["culture", "temples", "food", "gardens"],
    bestMonths: [3, 4, 10, 11],
    imageQuery: "Kyoto Japan temple street",
    places: [
      { name: "Fushimi Inari Taisha", note: "Thousands of vermilion torii gates climbing the mountain.", imageQuery: "Fushimi Inari torii gates" },
      { name: "Kinkaku-ji", note: "The gold-leafed pavilion reflected in its pond.", imageQuery: "Kinkaku-ji golden pavilion" },
      { name: "Arashiyama Bamboo Grove", note: "A quiet path through towering green stalks.", imageQuery: "Arashiyama bamboo grove" },
      { name: "Gion District", note: "Preserved wooden teahouses and the occasional geiko.", imageQuery: "Gion Kyoto street evening" },
    ],
  },
  {
    id: "marrakech",
    name: "Marrakech",
    country: "Morocco",
    region: "Africa",
    lat: 31.6295,
    lon: -7.9811,
    tagline: "Red walls, souks that never quite end, and the Atlas on the horizon.",
    description:
      "Marrakech layers Berber, Arab, and French influence into one dense old city. Expect labyrinthine souks, riads built around hidden courtyards, and the call to prayer rolling across rooftops at dusk.",
    tags: ["markets", "architecture", "food", "desert"],
    bestMonths: [3, 4, 5, 10, 11],
    imageQuery: "Marrakech medina rooftops",
    places: [
      { name: "Jemaa el-Fnaa", note: "The main square — food stalls, musicians, storytellers after dark.", imageQuery: "Jemaa el-Fnaa square evening" },
      { name: "Bahia Palace", note: "Intricate tilework and carved cedar ceilings.", imageQuery: "Bahia Palace courtyard" },
      { name: "Jardin Majorelle", note: "A cobalt-blue garden once owned by Yves Saint Laurent.", imageQuery: "Jardin Majorelle blue garden" },
      { name: "Koutoubia Mosque", note: "The city's tallest minaret, visible from most rooftops.", imageQuery: "Koutoubia Mosque Marrakech" },
    ],
  },
  {
    id: "lisbon",
    name: "Lisbon",
    country: "Portugal",
    region: "Europe",
    lat: 38.7223,
    lon: -9.1393,
    tagline: "Hills, tiled facades, and the Atlantic light at every turn.",
    description:
      "Built across seven hills above the Tagus, Lisbon moves at the pace of its old trams. Azulejo tiles cover entire building fronts, miradouros open onto river views, and every neighbourhood has its own fado bar.",
    tags: ["coastal", "history", "food", "nightlife"],
    bestMonths: [4, 5, 6, 9, 10],
    imageQuery: "Lisbon Portugal tiled street tram",
    places: [
      { name: "Belém Tower", note: "A fortified 16th-century tower guarding the river mouth.", imageQuery: "Belem Tower Lisbon" },
      { name: "Alfama District", note: "The oldest quarter — narrow lanes, fado drifting from doorways.", imageQuery: "Alfama Lisbon narrow streets" },
      { name: "Jerónimos Monastery", note: "Manueline stonework, and the birthplace of pastéis de nata.", imageQuery: "Jeronimos Monastery Lisbon" },
      { name: "Miradouro da Graça", note: "A hilltop terrace looking over the whole city.", imageQuery: "Miradouro da Graca Lisbon view" },
    ],
  },
  {
    id: "queenstown",
    name: "Queenstown",
    country: "New Zealand",
    region: "Oceania",
    lat: -45.0312,
    lon: 168.6626,
    tagline: "A lake town ringed by mountains, built for people who don't sit still.",
    description:
      "On the shore of Lake Wakatipu, under the jagged Remarkables range, Queenstown built its reputation on bungee jumping and jet boats — but it's just as good for a slow hike or a glass of Central Otago pinot.",
    tags: ["adventure", "mountains", "lakes", "wine"],
    bestMonths: [12, 1, 2, 3],
    imageQuery: "Queenstown New Zealand lake mountains",
    places: [
      { name: "Lake Wakatipu", note: "A glacial lake that never quite sits still — a natural seiche.", imageQuery: "Lake Wakatipu Queenstown" },
      { name: "The Remarkables", note: "A jagged range that lights up gold at sunset.", imageQuery: "The Remarkables mountain range" },
      { name: "Skyline Gondola", note: "A cable car up to sweeping views and a luge track.", imageQuery: "Skyline Gondola Queenstown" },
      { name: "Arrowtown", note: "A gold-rush village fifteen minutes out of town.", imageQuery: "Arrowtown New Zealand autumn" },
    ],
  },
  {
    id: "oaxaca",
    name: "Oaxaca",
    country: "Mexico",
    region: "North America",
    lat: 17.0732,
    lon: -96.7266,
    tagline: "Mezcal, mole, and some of the most textured craft in the Americas.",
    description:
      "Oaxaca City sits in a valley thick with Zapotec and Mixtec history. It's a centre for textiles, ceramics, and a food culture built on seven kinds of mole — plus the ruins of Monte Albán just outside town.",
    tags: ["food", "craft", "history", "markets"],
    bestMonths: [10, 11, 2, 3],
    imageQuery: "Oaxaca Mexico colorful street",
    places: [
      { name: "Monte Albán", note: "Zapotec ruins on a leveled mountaintop above the valley.", imageQuery: "Monte Alban ruins Oaxaca" },
      { name: "Santo Domingo Church", note: "A gold-leaf interior that took over a century to finish.", imageQuery: "Santo Domingo church Oaxaca" },
      { name: "Mercado Benito Juárez", note: "Mole pastes, chapulines, and chocolate ground to order.", imageQuery: "Oaxaca market mole chocolate" },
      { name: "Hierve el Agua", note: "Mineral formations that look like frozen waterfalls.", imageQuery: "Hierve el Agua Oaxaca" },
    ],
  },
  {
    id: "reykjavik",
    name: "Reykjavík",
    country: "Iceland",
    region: "Europe",
    lat: 64.1466,
    lon: -21.9426,
    tagline: "A small, colourful capital at the edge of glaciers and lava fields.",
    description:
      "The world's northernmost capital of its size, Reykjavík is compact enough to walk in an afternoon — and a base for geysers, waterfalls, and the Northern Lights just outside the city limits.",
    tags: ["nature", "coastal", "adventure"],
    bestMonths: [6, 7, 8, 9],
    imageQuery: "Reykjavik Iceland colorful houses",
    places: [
      { name: "Hallgrímskirkja", note: "A basalt-column-shaped church that anchors the skyline.", imageQuery: "Hallgrimskirkja church Reykjavik" },
      { name: "Golden Circle", note: "Geysir, Þingvellir, and Gullfoss in one loop from the city.", imageQuery: "Gullfoss waterfall Iceland" },
      { name: "Sky Lagoon", note: "A geothermal pool built into the coastline.", imageQuery: "Sky Lagoon Iceland geothermal pool" },
      { name: "Old Harbour", note: "Whale-watching boats and the city's best seafood shacks.", imageQuery: "Reykjavik old harbour boats" },
    ],
  },
  {
    id: "jaipur",
    name: "Jaipur",
    country: "India",
    region: "Asia",
    lat: 26.9124,
    lon: 75.7873,
    tagline: "The Pink City — forts, palaces, and bazaars stacked in sandstone.",
    description:
      "Planned in 1727 on a strict grid and painted terracotta-pink for a royal visit, Jaipur is Rajasthan's showpiece: hilltop forts, mirrored palace halls, and bazaars selling block-print textiles and gemstones.",
    tags: ["history", "architecture", "markets"],
    bestMonths: [10, 11, 12, 1, 2],
    imageQuery: "Jaipur India pink city fort",
    places: [
      { name: "Amber Fort", note: "A hilltop fort of sandstone and marble above a lake.", imageQuery: "Amber Fort Jaipur" },
      { name: "Hawa Mahal", note: "A honeycombed pink facade of 953 small windows.", imageQuery: "Hawa Mahal Jaipur facade" },
      { name: "City Palace", note: "Still home to the former royal family, part museum.", imageQuery: "City Palace Jaipur courtyard" },
      { name: "Jantar Mantar", note: "An 18th-century astronomical observatory of stone instruments.", imageQuery: "Jantar Mantar Jaipur observatory" },
    ],
  },
  {
    id: "cape-town",
    name: "Cape Town",
    country: "South Africa",
    region: "Africa",
    lat: -33.9249,
    lon: 18.4241,
    tagline: "Mountain, coastline, and vineyards, all inside city limits.",
    description:
      "Cape Town sits between Table Mountain and the Atlantic, with penguin colonies, wine estates, and the old Bo-Kaap neighbourhood all within a short drive of downtown.",
    tags: ["mountains", "coastal", "wine", "wildlife"],
    bestMonths: [11, 12, 1, 2, 3],
    imageQuery: "Cape Town Table Mountain coastline",
    places: [
      { name: "Table Mountain", note: "A cable car to a flat summit with views across two oceans.", imageQuery: "Table Mountain Cape Town" },
      { name: "Bo-Kaap", note: "Cobbled streets of brightly painted Cape Malay houses.", imageQuery: "Bo-Kaap colorful houses Cape Town" },
      { name: "Boulders Beach", note: "A protected colony of African penguins on white sand.", imageQuery: "Boulders Beach penguins" },
      { name: "Cape Winelands", note: "Stellenbosch and Franschhoek, an hour from the city.", imageQuery: "Stellenbosch vineyards South Africa" },
    ],
  },
];

export function getDestinationById(id) {
  return destinations.find((d) => d.id === id);
}

export const allRegions = [...new Set(destinations.map((d) => d.region))].sort();
export const allTags = [...new Set(destinations.flatMap((d) => d.tags))].sort();
