import type { Material, MaterialCategory } from "@/types";

/** Category metadata (labels only — icons/colors live in the UI layer). */
export const MATERIAL_CATEGORIES: { value: MaterialCategory; label: string }[] = [
  { value: "cement", label: "Cement & concrete" },
  { value: "blocks", label: "Blocks & bricks" },
  { value: "roofing", label: "Roofing" },
  { value: "steel", label: "Steel & iron rods" },
  { value: "aggregates", label: "Sand, stone & gravel" },
  { value: "timber", label: "Timber & wood" },
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "paint", label: "Paint & finishes" },
  { value: "tools", label: "Tools & equipment" },
  { value: "doors-windows", label: "Doors & windows" },
  { value: "tiles", label: "Tiles & flooring" },
];

export const CATEGORY_LABEL: Record<MaterialCategory, string> = Object.fromEntries(
  MATERIAL_CATEGORIES.map((c) => [c.value, c.label]),
) as Record<MaterialCategory, string>;

type Row = [
  name: string,
  category: MaterialCategory,
  brand: string,
  price: number,
  unit: string,
  supplier: string,
  region: string,
  rating: number,
  reviews: number,
  deliveryDays: number,
  description: string,
  popular?: boolean,
];

const ROWS: Row[] = [
  // cement
  ["Ghacem Super Rapid 42.5R", "cement", "Ghacem", 95, "50kg bag", "BuildPro Depot", "Greater Accra", 4.8, 214, 1, "Ghana's trusted high-early-strength cement — ideal for columns, beams and fast-track work.", true],
  ["Diamond Cement 42.5N", "cement", "Diamond", 88, "50kg bag", "Tema Cement Hub", "Greater Accra", 4.6, 156, 1, "General-purpose Portland cement for blockwork, plastering and foundations."],
  ["Dangote 3X Cement", "cement", "Dangote", 92, "50kg bag", "Kumasi Hardware Centre", "Ashanti", 4.7, 189, 2, "Triple-strength cement with excellent setting and durability.", true],
  ["CIMAF Supaset", "cement", "CIMAF", 90, "50kg bag", "Northern Builders Supply", "Northern", 4.5, 98, 2, "Fast-setting cement popular for casting and precast works."],
  // blocks
  ["6-inch solid sandcrete block", "blocks", "BuildPro", 6.5, "piece", "BuildPro Depot", "Greater Accra", 4.5, 132, 2, "Load-bearing 6\" solid block for external and structural walls.", true],
  ["5-inch hollow block", "blocks", "BuildPro", 5.5, "piece", "BuildPro Depot", "Greater Accra", 4.4, 88, 2, "Lightweight hollow block for partition and infill walls."],
  ["4-inch partition block", "blocks", "Kumasi Blocks", 4.5, "piece", "Kumasi Hardware Centre", "Ashanti", 4.3, 61, 2, "Slim block for internal partitions — quick to lay, easy to plaster."],
  ["Burnt clay brick", "blocks", "Ashanti Clay", 3.2, "piece", "Kumasi Hardware Centre", "Ashanti", 4.6, 47, 3, "Traditional fired-clay brick with a warm finish and great thermal mass."],
  // roofing
  ["Aluzinc roofing sheet 0.45mm", "roofing", "Domod", 185, "3.6m sheet", "Tema Steel & Roofing", "Greater Accra", 4.7, 143, 2, "Corrosion-resistant aluzinc long-span sheet — the standard for modern roofs.", true],
  ["Long-span aluminium sheet 0.55mm", "roofing", "Aluworks", 235, "3.6m sheet", "Tema Steel & Roofing", "Greater Accra", 4.8, 121, 3, "Premium aluminium roofing — lightweight, durable and rustproof."],
  ["Roofing nails (galvanised)", "roofing", "BuildPro", 26, "kg", "BuildPro Depot", "Greater Accra", 4.4, 74, 1, "Twisted-shank galvanised nails with rubber washers."],
  ["Aluminium ridge cap", "roofing", "Domod", 90, "3m length", "Tema Steel & Roofing", "Greater Accra", 4.5, 39, 3, "Matching ridge cap to finish the roof apex neatly."],
  // steel
  ["12mm iron rod (Y12)", "steel", "Tema Steel", 96, "12m length", "Tema Steel & Roofing", "Greater Accra", 4.7, 167, 2, "High-yield deformed reinforcement bar for columns and beams.", true],
  ["16mm iron rod (Y16)", "steel", "Tema Steel", 162, "12m length", "Tema Steel & Roofing", "Greater Accra", 4.7, 132, 2, "Heavy reinforcement bar for foundations and load-bearing frames."],
  ["10mm iron rod (Y10)", "steel", "Tema Steel", 72, "12m length", "Tema Steel & Roofing", "Greater Accra", 4.6, 90, 2, "Reinforcement bar for slabs, lintels and stirrups."],
  ["8mm iron rod (R8)", "steel", "Tema Steel", 46, "12m length", "Tema Steel & Roofing", "Greater Accra", 4.5, 61, 2, "Mild-steel bar commonly used for stirrups and links."],
  ["BRC welded mesh A142", "steel", "Tema Steel", 430, "sheet", "Tema Steel & Roofing", "Greater Accra", 4.6, 44, 3, "Welded reinforcement mesh for ground-floor slabs and screeds."],
  ["Binding wire", "steel", "BuildPro", 24, "kg", "BuildPro Depot", "Greater Accra", 4.3, 52, 1, "Soft annealed wire for tying reinforcement."],
  // aggregates
  ["Sharp sand (tipper trip)", "aggregates", "AccraQuarry", 1250, "5-ton trip", "BuildPro Depot", "Greater Accra", 4.4, 118, 2, "Clean, well-graded sharp sand for concrete and mortar. Delivered by tipper.", true],
  ["Quarry stone chippings 3/4\"", "aggregates", "AccraQuarry", 1450, "5-ton trip", "BuildPro Depot", "Greater Accra", 4.5, 96, 2, "Crushed granite chippings for structural concrete."],
  ["Pit sand / plastering sand", "aggregates", "AccraQuarry", 980, "5-ton trip", "BuildPro Depot", "Greater Accra", 4.2, 63, 2, "Fine sand ideal for plastering and blockwork mortar."],
  ["Laterite (gravel)", "aggregates", "AccraQuarry", 900, "5-ton trip", "BuildPro Depot", "Greater Accra", 4.1, 41, 3, "Compactable laterite for filling, sub-base and access roads."],
  // timber
  ["Wawa board 1x12", "timber", "Kumasi Timber", 85, "12ft piece", "Kumasi Hardware Centre", "Ashanti", 4.4, 77, 3, "Affordable softwood board for formwork and general carpentry.", true],
  ["Odum plank 2x6", "timber", "Kumasi Timber", 165, "12ft piece", "Kumasi Hardware Centre", "Ashanti", 4.7, 58, 4, "Durable hardwood plank for structural and finish joinery."],
  ["2x4 wawa (roofing member)", "timber", "Kumasi Timber", 42, "12ft length", "Kumasi Hardware Centre", "Ashanti", 4.3, 66, 3, "Standard timber member for roof trusses and framing."],
  ["Plywood 18mm", "timber", "BuildPro", 320, "4x8 sheet", "BuildPro Depot", "Greater Accra", 4.5, 84, 2, "General-purpose 18mm plywood for formwork and furniture."],
  ["Marine plywood 18mm", "timber", "BuildPro", 490, "4x8 sheet", "BuildPro Depot", "Greater Accra", 4.7, 39, 3, "Water-resistant marine ply for kitchens, wardrobes and wet areas."],
  // plumbing
  ["PVC pressure pipe 4\"", "plumbing", "Duraplast", 78, "6m length", "AquaBuild Plumbing", "Greater Accra", 4.5, 92, 2, "Rigid PVC pipe for soil and waste drainage.", true],
  ["PVC pipe 2\"", "plumbing", "Duraplast", 46, "6m length", "AquaBuild Plumbing", "Greater Accra", 4.4, 71, 2, "Waste pipe for sinks, basins and general plumbing."],
  ["Poly water tank 1,000L", "plumbing", "Duraplast", 1250, "piece", "AquaBuild Plumbing", "Greater Accra", 4.8, 143, 3, "UV-stabilised polytank with cover — reliable household storage.", true],
  ["Water closet (WC) set", "plumbing", "Twyford", 950, "set", "AquaBuild Plumbing", "Greater Accra", 4.6, 58, 3, "Complete close-coupled toilet set with cistern and fittings."],
  ["Stainless kitchen sink", "plumbing", "Twyford", 420, "piece", "AquaBuild Plumbing", "Greater Accra", 4.4, 34, 3, "Single-bowl stainless sink with drainer and waste."],
  ["PPR fittings pack", "plumbing", "Duraplast", 120, "pack", "AquaBuild Plumbing", "Greater Accra", 4.3, 27, 2, "Assorted hot/cold PPR elbows, tees and sockets."],
  // electrical
  ["Electrical cable 2.5mm²", "electrical", "Nexans", 520, "100m roll", "BrightVolt Electricals", "Greater Accra", 4.7, 108, 2, "Single-core copper cable for socket circuits.", true],
  ["Electrical cable 1.5mm²", "electrical", "Nexans", 380, "100m roll", "BrightVolt Electricals", "Greater Accra", 4.6, 84, 2, "Copper cable for lighting circuits."],
  ["Consumer unit (12-way)", "electrical", "Schneider", 290, "piece", "BrightVolt Electricals", "Greater Accra", 4.6, 46, 3, "Distribution board with main switch and MCBs."],
  ["Double socket outlet", "electrical", "MK", 35, "piece", "BrightVolt Electricals", "Greater Accra", 4.4, 63, 2, "13A twin switched socket, screwless finish."],
  ["LED bulb 9W (pack of 4)", "electrical", "Philips", 60, "pack", "BrightVolt Electricals", "Greater Accra", 4.5, 91, 1, "Warm-white energy-saving bulbs, B22 fitting.", true],
  ["PVC conduit pipe 20mm", "electrical", "Duraplast", 18, "3m length", "BrightVolt Electricals", "Greater Accra", 4.2, 38, 2, "Surface/concealed conduit for cable protection."],
  // paint
  ["Emulsion paint (matt) 4L", "paint", "Azar", 180, "4L bucket", "ColourCraft Paints", "Greater Accra", 4.5, 96, 2, "Smooth interior matt emulsion with great coverage.", true],
  ["Weatherguard exterior 4L", "paint", "Azar", 235, "4L bucket", "ColourCraft Paints", "Greater Accra", 4.7, 72, 2, "Durable exterior paint that resists rain and UV."],
  ["Gloss oil paint 4L", "paint", "Coral", 220, "4L bucket", "ColourCraft Paints", "Greater Accra", 4.4, 41, 2, "High-gloss enamel for doors, metal and trim."],
  ["Primer / undercoat 4L", "paint", "Coral", 160, "4L bucket", "ColourCraft Paints", "Greater Accra", 4.3, 33, 2, "Sealing undercoat for a smooth topcoat finish."],
  ["Skim / wall putty", "paint", "Azar", 140, "20kg bag", "ColourCraft Paints", "Greater Accra", 4.4, 28, 2, "Fine wall filler for a glassy smooth surface before painting."],
  ["Roller & brush set", "paint", "ColourCraft", 75, "set", "ColourCraft Paints", "Greater Accra", 4.2, 54, 1, "Complete painting kit: roller, tray and brushes."],
  // tools
  ["Wheelbarrow (heavy duty)", "tools", "Jefferson", 420, "piece", "BuildPro Depot", "Greater Accra", 4.6, 87, 2, "Rugged builder's wheelbarrow with pneumatic tyre.", true],
  ["Digging shovel", "tools", "Jefferson", 85, "piece", "BuildPro Depot", "Greater Accra", 4.4, 62, 1, "Forged-steel shovel with hardwood handle."],
  ["Head pan (pack of 2)", "tools", "BuildPro", 90, "pack", "BuildPro Depot", "Greater Accra", 4.2, 44, 1, "Galvanised head pans for carrying mortar and aggregates."],
  ["Bricklaying trowel", "tools", "Jefferson", 45, "piece", "BuildPro Depot", "Greater Accra", 4.5, 51, 1, "Stainless trowel for blockwork and plastering."],
  ["Spirit level 1.2m", "tools", "Stanley", 110, "piece", "BuildPro Depot", "Greater Accra", 4.7, 66, 1, "Aluminium box level with three vials."],
  ["Cordless drill 18V", "tools", "Bosch", 650, "piece", "BuildPro Depot", "Greater Accra", 4.8, 112, 2, "Brushless drill/driver with 2 batteries and charger.", true],
  ["Angle grinder 4.5\"", "tools", "Bosch", 480, "piece", "BuildPro Depot", "Greater Accra", 4.6, 73, 2, "Powerful grinder for cutting steel, tiles and blocks."],
  ["Safety boots (steel toe)", "tools", "Vaultex", 180, "pair", "BuildPro Depot", "Greater Accra", 4.4, 58, 2, "Steel-toe site boots with slip-resistant sole."],
  ["Safety helmet + gloves set", "tools", "Vaultex", 65, "set", "BuildPro Depot", "Greater Accra", 4.3, 47, 1, "Basic PPE kit for the site."],
  // doors-windows
  ["Flush door (internal)", "doors-windows", "Doormart", 380, "piece", "Kumasi Hardware Centre", "Ashanti", 4.4, 39, 4, "Hollow-core internal door, primed and ready to hang.", true],
  ["Steel security door", "doors-windows", "Doormart", 1850, "piece", "Kumasi Hardware Centre", "Ashanti", 4.7, 52, 5, "Reinforced entry door with multi-point lock."],
  ["Aluminium sliding window", "doors-windows", "Aluworks", 920, "piece", "Tema Steel & Roofing", "Greater Accra", 4.6, 33, 5, "Glazed sliding window with mosquito net track."],
  ["Wooden window frame", "doors-windows", "Kumasi Timber", 260, "piece", "Kumasi Hardware Centre", "Ashanti", 4.2, 21, 4, "Odum window frame, ready for glazing."],
  // tiles
  ["Ceramic floor tile 40x40", "tiles", "Time Ceramics", 95, "box (1.6m²)", "BuildPro Depot", "Greater Accra", 4.5, 88, 2, "Hard-wearing matt floor tile — box covers ~1.6m².", true],
  ["Ceramic wall tile 30x60", "tiles", "Time Ceramics", 88, "box (1.4m²)", "BuildPro Depot", "Greater Accra", 4.4, 57, 2, "Glossy wall tile for kitchens and bathrooms."],
  ["Porcelain tile 60x60", "tiles", "Royal Ceramics", 145, "box (1.4m²)", "BuildPro Depot", "Greater Accra", 4.7, 64, 3, "Premium rectified porcelain for living areas.", true],
  ["Tile adhesive", "tiles", "Weber", 75, "25kg bag", "BuildPro Depot", "Greater Accra", 4.5, 43, 2, "Strong cement-based adhesive for floor and wall tiles."],
  ["Tile grout (5kg)", "tiles", "Weber", 45, "5kg bag", "BuildPro Depot", "Greater Accra", 4.3, 29, 2, "Fine grout for neat, water-resistant joints."],
];

export const MATERIALS: Material[] = ROWS.map((r, i) => {
  const [name, category, brand, price, unit, supplierName, region, rating, reviewsCount, deliveryDays, description, popular] = r;
  return {
    id: `mat-${String(i + 1).padStart(3, "0")}`,
    name,
    category,
    brand,
    price,
    unit,
    supplierName,
    region,
    rating,
    reviewsCount,
    inStock: true,
    description,
    deliveryDays,
    popular: !!popular,
  };
});

export function getMaterialById(id: string): Material | undefined {
  return MATERIALS.find((m) => m.id === id);
}
