// Outfit engine: picks clothes from the wardrobe for the weather, in a Stockholm style.

export const CATEGORIES = [
  { id: 'top', label: 'Tops', one: 'Top', hint: 'T-shirts, shirts, long sleeves, thermals' },
  { id: 'mid', label: 'Mid layers', one: 'Mid layer', hint: 'Knits, hoodies, cardigans, overshirts' },
  { id: 'outer', label: 'Outerwear', one: 'Outerwear', hint: 'Coats, parkas, jackets, rain shells, blazers' },
  { id: 'bottom', label: 'Bottoms', one: 'Bottoms', hint: 'Trousers, jeans, skirts, shorts' },
  { id: 'shoes', label: 'Shoes', one: 'Shoes', hint: 'Sneakers, boots, smart shoes, sandals' },
  { id: 'acc', label: 'Accessories', one: 'Accessory', hint: 'Beanies, scarves, gloves' },
];

// Subtypes and sensible defaults the form fills in (you can change them).
export const SUBTYPES = {
  top: [
    { id: 'tee', label: 'T-shirt', warmth: 1, formality: 1 },
    { id: 'longsleeve', label: 'Long sleeve', warmth: 2, formality: 1 },
    { id: 'shirt', label: 'Shirt / blouse', warmth: 2, formality: 2 },
    { id: 'thermal', label: 'Thermal / merino base', warmth: 3, formality: 1 },
  ],
  mid: [
    { id: 'knit', label: 'Knit / sweater', warmth: 3, formality: 2 },
    { id: 'hoodie', label: 'Hoodie / sweatshirt', warmth: 3, formality: 1 },
    { id: 'cardigan', label: 'Cardigan', warmth: 2, formality: 2 },
    { id: 'overshirt', label: 'Overshirt / fleece', warmth: 2, formality: 1 },
  ],
  outer: [
    { id: 'coat', label: 'Wool coat', warmth: 4, formality: 3 },
    { id: 'parka', label: 'Parka / puffer', warmth: 5, formality: 1, waterproof: true },
    { id: 'jacket', label: 'Jacket', warmth: 3, formality: 2 },
    { id: 'shell', label: 'Rain shell / trench', warmth: 2, formality: 2, waterproof: true },
    { id: 'blazer', label: 'Blazer', warmth: 2, formality: 3 },
  ],
  bottom: [
    { id: 'trousers', label: 'Trousers / chinos', warmth: 2, formality: 2 },
    { id: 'jeans', label: 'Jeans', warmth: 2, formality: 1 },
    { id: 'skirt', label: 'Skirt / dress', warmth: 1, formality: 2 },
    { id: 'shorts', label: 'Shorts', warmth: 1, formality: 1 },
  ],
  shoes: [
    { id: 'sneakers', label: 'Sneakers', warmth: 2, formality: 1 },
    { id: 'boots', label: 'Boots', warmth: 4, formality: 2, waterproof: true },
    { id: 'smart', label: 'Smart shoes / loafers', warmth: 2, formality: 3 },
    { id: 'sandals', label: 'Sandals', warmth: 1, formality: 1 },
  ],
  acc: [
    { id: 'hat', label: 'Beanie / hat', warmth: 3, formality: 1 },
    { id: 'scarf', label: 'Scarf', warmth: 3, formality: 2 },
    { id: 'gloves', label: 'Gloves / mittens', warmth: 3, formality: 2 },
    { id: 'other', label: 'Other', warmth: 1, formality: 2 },
  ],
};

// A Stockholm wardrobe is mostly neutrals with the occasional accent.
export const COLOURS = [
  { id: 'black', label: 'Black', hex: '#141414', neutral: true, family: 'dark' },
  { id: 'charcoal', label: 'Charcoal', hex: '#3b3d40', neutral: true, family: 'dark' },
  { id: 'navy', label: 'Navy', hex: '#1f2a44', neutral: true, family: 'dark' },
  { id: 'grey', label: 'Grey', hex: '#8d8d8a', neutral: true, family: 'mid' },
  { id: 'denim', label: 'Denim', hex: '#4b6a8e', neutral: true, family: 'mid' },
  { id: 'white', label: 'White', hex: '#f6f5f1', neutral: true, family: 'light' },
  { id: 'cream', label: 'Cream', hex: '#ece3cf', neutral: true, family: 'light' },
  { id: 'beige', label: 'Beige', hex: '#d3bf9d', neutral: true, family: 'earth' },
  { id: 'camel', label: 'Camel', hex: '#b08655', neutral: true, family: 'earth' },
  { id: 'brown', label: 'Brown', hex: '#5d4333', neutral: true, family: 'earth' },
  { id: 'olive', label: 'Olive', hex: '#5d613c', neutral: true, family: 'earth' },
  { id: 'burgundy', label: 'Burgundy', hex: '#6b1f2e', neutral: false, family: 'accent' },
  { id: 'green', label: 'Green', hex: '#2f6b47', neutral: false, family: 'accent' },
  { id: 'blue', label: 'Blue', hex: '#2f63b5', neutral: false, family: 'accent' },
  { id: 'red', label: 'Red', hex: '#c03a2b', neutral: false, family: 'accent' },
  { id: 'yellow', label: 'Yellow', hex: '#e2b733', neutral: false, family: 'accent' },
  { id: 'orange', label: 'Orange', hex: '#d97a2c', neutral: false, family: 'accent' },
  { id: 'pink', label: 'Pink', hex: '#e7a1b5', neutral: false, family: 'accent' },
  { id: 'purple', label: 'Purple', hex: '#6a4c93', neutral: false, family: 'accent' },
  { id: 'pattern', label: 'Pattern', hex: 'repeating-linear-gradient(45deg,#1f2a44 0 4px,#f6f5f1 4px 8px)', neutral: false, family: 'accent' },
];
export const colourById = Object.fromEntries(COLOURS.map((c) => [c.id, c]));

export const OCCASIONS = [
  { id: 'casual', label: 'Casual', formality: 1 },
  { id: 'work', label: 'Work', formality: 2 },
  { id: 'dressy', label: 'Dinner / dressy', formality: 3 },
];

export const WARMTH_LABELS = ['', 'Very light', 'Light', 'Medium', 'Warm', 'Very warm'];

// Suggest a colour from a photo's average RGB.
export function nearestColour([r, g, b]) {
  const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  let best = null;
  let bestD = Infinity;
  for (const c of COLOURS) {
    if (!c.hex.startsWith('#')) continue;
    const [cr, cg, cb] = hexToRgb(c.hex);
    const d = 2 * (r - cr) ** 2 + 4 * (g - cg) ** 2 + 3 * (b - cb) ** 2;
    if (d < bestD) { bestD = d; best = c; }
  }
  return best.id;
}

// ---------- What the weather calls for ----------

const BANDS = [
  // design temp (coldest "feels like" while you're out) => targets
  { min: 20, id: 'warm', label: 'Warm', core: 1, top: 1, mid: [0, 2], outer: [0, 2], bottom: 1, shoes: 1.5, acc: {} },
  { min: 14, id: 'mild', label: 'Mild', core: 3, top: 1.5, mid: [0.5, 2], outer: [0.3, 2], bottom: 2, shoes: 2, acc: {} },
  { min: 8, id: 'cool', label: 'Cool', core: 5.5, top: 2, mid: [0.7, 2.5], outer: [1, 3], bottom: 2, shoes: 2, acc: {} },
  { min: 2, id: 'chilly', label: 'Chilly', core: 7.5, top: 2, mid: [1, 3], outer: [1, 3.5], bottom: 2, shoes: 2.5, acc: { scarf: 0.6 } },
  { min: -5, id: 'cold', label: 'Cold', core: 9.5, top: 2.5, mid: [1, 3.5], outer: [1, 4.5], bottom: 2.5, shoes: 3.5, acc: { hat: 1, scarf: 1, gloves: 1 } },
  { min: -Infinity, id: 'freezing', label: 'Freezing', core: 12, top: 3, mid: [1, 4.5], outer: [1, 5], bottom: 3, shoes: 4.5, acc: { hat: 1, scarf: 1, gloves: 1 } },
];

export function needsFor(w) {
  const designTemp = w.feelsMin;
  const band = BANDS.find((b) => designTemp >= b.min);
  const n = {
    band,
    designTemp,
    slots: {
      top: { p: 1, target: band.top },
      mid: { p: band.mid[0], target: band.mid[1] },
      outer: { p: band.outer[0], target: band.outer[1] },
      bottom: { p: 1, target: band.bottom },
      shoes: { p: 1, target: band.shoes },
    },
    acc: { ...band.acc },
  };
  // Rain means a waterproof outer layer, even when it's warm.
  if (w.wet) n.slots.outer.p = 1;
  // Wind makes a jacket worthwhile in mild weather and a hat welcome when it's chilly.
  if (w.windy && designTemp < 18) n.slots.outer.p = Math.max(n.slots.outer.p, 0.8);
  if (w.windy && designTemp < 6) n.acc.hat = 1;
  if (designTemp < 0) n.acc.gloves = 1;
  return n;
}

// ---------- Scoring ----------

function daysSince(iso, now) {
  if (!iso) return Infinity;
  return (now - new Date(iso).getTime()) / 86400000;
}

function scoreOutfit(o, w, needs, formality, now) {
  let score = 0;
  const pieces = Object.values(o).filter(Boolean);
  const core = ['top', 'mid', 'outer'].reduce((s, k) => s + (o[k] ? o[k].warmth : 0), 0);
  score -= Math.abs(core - needs.band.core) * 1.6;

  for (const [slot, spec] of Object.entries(needs.slots)) {
    const it = o[slot];
    if (!it) continue;
    score -= Math.abs(it.warmth - spec.target) * 0.6;
  }

  // Weather rules
  if (w.wet) {
    if (o.outer && !o.outer.waterproof) score -= 3;
    if (o.shoes && !o.shoes.waterproof) score -= 1.2;
  }
  if (w.slushy && o.shoes) {
    if (o.shoes.subtype !== 'boots') score -= 2.5;
    if (!o.shoes.waterproof) score -= 2;
  }
  const t = needs.designTemp;
  if (o.bottom && o.bottom.subtype === 'shorts' && t < 18) score -= 8;
  if (o.shoes && o.shoes.subtype === 'sandals' && (t < 17 || w.wet)) score -= 8;
  if (o.bottom && o.bottom.subtype === 'skirt' && t < 0) score -= 1;
  if (o.shoes && o.shoes.subtype === 'boots' && t >= 16 && !w.wet) score -= 2;
  if (o.outer && o.outer.subtype === 'blazer' && (t < 10 || w.wet)) score -= 4;
  if (o.mid && o.outer && o.mid.subtype === 'hoodie' && o.outer.subtype === 'coat') score -= 0.5;

  // Style: neutrals with at most one accent, tonal looks, matching formality.
  const colours = pieces.map((p) => colourById[p.colour] || colourById.grey);
  const accents = colours.filter((c) => !c.neutral).length;
  if (accents > 1) score -= 3 * (accents - 1);
  if (accents === 1) score += 0.4;
  const fam = {};
  for (const c of colours) if (c.neutral) fam[c.family] = (fam[c.family] || 0) + 1;
  if (Math.max(0, ...Object.values(fam)) >= 3) score += 1;
  const families = Object.keys(fam).length;
  if (families >= 4) score -= 1;
  // A brown/camel next to black is fine; navy next to black on the core layers is less so.
  if (o.bottom && o.top && o.bottom.colour === o.top.colour && o.top.colour !== 'white' && o.top.colour !== 'black') score -= 0.3;

  const fs = pieces.filter((p) => p.category !== 'acc').map((p) => p.formality);
  for (const f of fs) score -= Math.abs(f - formality) * 1.1;
  if (formality >= 2 && o.bottom && o.bottom.subtype === 'shorts') score -= 3;
  if (formality >= 2 && o.mid && o.mid.subtype === 'hoodie') score -= 1.5;
  if (fs.length && Math.max(...fs) - Math.min(...fs) >= 2) score -= 1.5;

  // Freshness: avoid repeats from the last few days.
  for (const p of pieces) {
    const d = daysSince(p.lastWorn, now);
    if (p.category === 'acc' || p.category === 'outer' || p.category === 'shoes') {
      if (d < 1) score -= 0.3;
      continue;
    }
    if (d < 1) score -= 3;
    else if (d < 3) score -= 1.5;
    else if (d < 6) score -= 0.4;
    score -= Math.min(p.wornCount || 0, 30) * 0.02;
  }
  return score;
}

// Deterministic random numbers so the same day shows the same outfit until you shuffle.
function rng(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

function weightedPick(list, weightFn, rand) {
  if (!list.length) return null;
  const ws = list.map(weightFn);
  const total = ws.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < list.length; i++) {
    r -= ws[i];
    if (r <= 0) return list[i];
  }
  return list[list.length - 1];
}

export function suggestOutfits(items, w, { occasion = 'casual', seed = '' } = {}) {
  const needs = needsFor(w);
  const formality = (OCCASIONS.find((o) => o.id === occasion) || OCCASIONS[0]).formality;
  const now = Date.now();
  const rand = rng(`${seed}|${w.date}|${occasion}|${items.length}`);
  const by = {};
  for (const c of CATEGORIES) by[c.id] = items.filter((i) => i.category === c.id);
  const accBy = {};
  for (const s of SUBTYPES.acc) accBy[s.id] = by.acc.filter((i) => i.subtype === s.id);

  const missing = [];
  for (const slot of ['top', 'bottom', 'shoes']) if (!by[slot].length) missing.push(slot);
  if (needs.slots.outer.p >= 1 && !by.outer.length) missing.push('outer');
  if (w.wet && by.outer.length && !by.outer.some((i) => i.waterproof)) missing.push('waterproof-outer');
  if (w.slushy && by.shoes.length && !by.shoes.some((i) => i.subtype === 'boots')) missing.push('boots');
  if (needs.band.core >= 7.5 && !by.mid.length) missing.push('mid');
  for (const a of Object.keys(needs.acc)) if (needs.acc[a] >= 1 && !accBy[a].length) missing.push(a);

  if (!by.top.length || !by.bottom.length) return { needs, outfits: [], missing };

  const closeness = (target) => (it) => Math.exp(-Math.abs(it.warmth - target) * 0.9) + 0.05;
  const seen = new Set();
  const candidates = [];
  for (let n = 0; n < 500; n++) {
    const o = {};
    for (const [slot, spec] of Object.entries(needs.slots)) {
      if (!by[slot].length) continue;
      if (spec.p < 1 && rand() > spec.p) continue;
      o[slot] = weightedPick(by[slot], closeness(spec.target), rand);
    }
    const key = ['top', 'mid', 'outer', 'bottom', 'shoes'].map((k) => (o[k] ? o[k].id : '-')).join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    candidates.push({ o, score: scoreOutfit(o, w, needs, formality, now) + rand() * 0.6 });
  }
  candidates.sort((a, b) => b.score - a.score);

  // Accessories: pick ones that keep the outfit to one accent colour.
  const outfits = candidates.slice(0, 25).map(({ o, score }) => {
    const hasAccent = Object.values(o).some((p) => p && !(colourById[p.colour] || {}).neutral);
    const accs = [];
    for (const [type, p] of Object.entries(needs.acc)) {
      if (!accBy[type].length || p < 1) continue;
      const pick = weightedPick(
        accBy[type],
        (it) => {
          const c = colourById[it.colour] || {};
          return (hasAccent && !c.neutral ? 0.1 : 1) * (0.5 + it.warmth / 5);
        },
        rand
      );
      if (pick) accs.push(pick);
    }
    return { ...o, acc: accs, score };
  });
  return { needs, outfits, missing };
}

// ---------- Tips for the day ----------

function hhmm(iso) {
  return iso ? iso.slice(11, 16) : '';
}

export function tipsFor(w, needs) {
  const tips = [];
  const sunsetHour = w.sunset ? Number(w.sunset.slice(11, 13)) + Number(w.sunset.slice(14, 16)) / 60 : 24;
  if (sunsetHour < 16.5) tips.push(`Sunset at ${hhmm(w.sunset)}, so you'll be out in the dark. A reflector (reflex) on your coat or bag keeps you visible.`);
  if (w.icy) tips.push('Freeze and thaw today: expect ice on the pavements, so wear soles with grip.');
  else if (w.slushy) tips.push('Slush on the streets: boots beat sneakers today.');
  if (w.wet && w.windy) tips.push(`Rain with gusts up to ${Math.round(w.gustMax)} m/s. An umbrella won't survive that, so use a hood.`);
  else if (w.wet) tips.push(`${Math.round(w.precipProb)}% chance of rain. Bring an umbrella or wear your shell.`);
  else if (w.windy) tips.push(`Windy, gusts up to ${Math.round(w.gustMax)} m/s. A windproof outer layer matters more than a thick one.`);
  if (w.tMax - w.tMin >= 6) tips.push(`It goes from ${Math.round(w.tMin)}° to ${Math.round(w.tMax)}°. Wear layers you can take off.`);
  if (['cold', 'freezing', 'chilly'].includes(needs.band.id)) tips.push('Layer the Swedish way: a thin base, a warm knit and a windproof coat. Indoors are warm here, so the coat comes off and you still look put together.');
  if (needs.band.id === 'freezing') tips.push('Below −5° wool beats cotton, and a merino base layer makes a big difference.');
  if (w.code <= 1 && needs.band.min >= 14) tips.push('Sunny. Sunglasses and a light jacket for the evening by the water.');
  return tips;
}

export function slotLabel(slot) {
  const map = {
    top: 'a top', bottom: 'some bottoms', shoes: 'shoes', outer: 'a coat or jacket', mid: 'a knit or other mid layer',
    'waterproof-outer': 'a waterproof jacket or shell', boots: 'boots', hat: 'a beanie', scarf: 'a scarf', gloves: 'gloves',
  };
  return map[slot] || slot;
}
