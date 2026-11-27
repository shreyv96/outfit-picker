// AI stylist: Claude looks at the day's best outfits (with photos) and the whole
// wardrobe, picks or improves one in a Stockholm style, and explains why.
import Anthropic from '../vendor/anthropic-sdk.js';
import { SUBTYPES, CATEGORIES, colourById, OCCASIONS, WARMTH_LABELS } from './outfit.js';

const MODEL = 'claude-opus-5-5';
const KEY_STORAGE = 'op.anthropicKey';
const SLOTS = ['outer', 'mid', 'top', 'bottom', 'shoes'];

export function getApiKey() {
  try { return localStorage.getItem(KEY_STORAGE) || ''; } catch (_) { return ''; }
}
export function setApiKey(key) {
  try {
    if (key) localStorage.setItem(KEY_STORAGE, key.trim());
    else localStorage.removeItem(KEY_STORAGE);
  } catch (_) {}
}

const SYSTEM = `You are a personal stylist in Stockholm, Sweden, dressing one person from their own wardrobe for the day.

Stockholm style: Scandinavian minimalism. Mostly neutrals (black, charcoal, navy, grey, white, cream, beige, camel, brown, olive), clean lines, good fabrics, relaxed but put-together, with at most one accent colour or pattern. Tonal and monochrome outfits work well. Outerwear matters a lot because it is what people see for half the year. Practicality wins: people walk, cycle and take the tunnelbana, so shoes must handle slush and ice, and coats must handle wind off the water. Indoors are warm, so the layers under the coat should look good on their own.

You receive the weather while the person is out, the occasion, their full wardrobe as a list, and up to five candidate outfits that a rule-based engine already checked for warmth and rain. Photos are attached for items in the candidates when available. Judge the candidates on style and weather fit, then choose the best one. You may improve it by swapping in any item from the wardrobe list, but keep it warm and dry enough for the weather: never drop a needed coat, waterproof layer or boots to make it look better. Prefer items not worn in the last few days.

Rules for the answer:
- Use only item ids from the wardrobe list. Use an empty string for a slot you leave empty.
- Every outfit needs a top, bottoms and shoes if the wardrobe has them.
- score is a whole number from 1 to 10 for your final outfit: 9-10 sharp and right for the weather, 7-8 good, 5-6 fine but forgettable, below 5 something is off.
- headline is a short verdict, at most 8 words.
- why is 2 to 3 plain sentences on what makes it work in Stockholm today, naming the pieces.
- tips are up to 3 short, concrete styling touches using what they own (tuck, roll sleeves, which scarf, what to leave at home). No shopping advice unless something essential for the weather is missing.
- Write in plain, friendly English. No emoji.`;

const SCHEMA = {
  type: 'object',
  properties: {
    outfit: {
      type: 'object',
      properties: {
        outer: { type: 'string' },
        mid: { type: 'string' },
        top: { type: 'string' },
        bottom: { type: 'string' },
        shoes: { type: 'string' },
        accessories: { type: 'array', items: { type: 'string' } },
      },
      required: ['outer', 'mid', 'top', 'bottom', 'shoes', 'accessories'],
      additionalProperties: false,
    },
    based_on_candidate: { type: 'integer' },
    score: { type: 'integer' },
    headline: { type: 'string' },
    why: { type: 'string' },
    tips: { type: 'array', items: { type: 'string' } },
  },
  required: ['outfit', 'based_on_candidate', 'score', 'headline', 'why', 'tips'],
  additionalProperties: false,
};

function subLabel(it) {
  const s = (SUBTYPES[it.category] || []).find((x) => x.id === it.subtype);
  return s ? s.label : (CATEGORIES.find((c) => c.id === it.category) || {}).one;
}

function describeItem(it, shortId, now) {
  const days = it.lastWorn ? Math.floor((now - new Date(it.lastWorn).getTime()) / 86400000) : null;
  return `${shortId}: ${it.name} | ${subLabel(it)} | ${(colourById[it.colour] || {}).label || it.colour} | warmth ${WARMTH_LABELS[it.warmth].toLowerCase()} | ${['', 'casual', 'smart casual', 'smart'][it.formality]}${it.waterproof ? ' | waterproof' : ''}${days === null ? '' : ` | last worn ${days === 0 ? 'today' : `${days} day${days > 1 ? 's' : ''} ago`}`}`;
}

function describeWeather(w, needs) {
  const parts = [
    `${w.date}${w.isToday ? ' (today)' : ' (tomorrow)'}`,
    `temperature ${Math.round(w.tMin)} to ${Math.round(w.tMax)} °C, feels like down to ${Math.round(w.feelsMin)} °C`,
    `chance of precipitation ${Math.round(w.precipProb)}%, total ${w.precipSum.toFixed(1)} mm${w.snowSum > 0 ? `, snow ${w.snowSum.toFixed(1)} cm` : ''}`,
    `wind up to ${Math.round(w.windMax)} m/s, gusts ${Math.round(w.gustMax)} m/s`,
    `sunrise ${w.sunrise.slice(11, 16)}, sunset ${w.sunset.slice(11, 16)}`,
  ];
  const flags = [w.wet && 'wet', w.slushy && 'slushy streets', w.icy && 'icy', w.windy && 'windy'].filter(Boolean);
  if (flags.length) parts.push(`conditions: ${flags.join(', ')}`);
  parts.push(`engine's warmth band: ${needs.band.label.toLowerCase()}`);
  return parts.join('\n');
}

// Small JPEGs keep the request quick and cheap.
async function smallJpegBase64(blob, max = 384) {
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
  } finally {
    URL.revokeObjectURL(url);
  }
}

export class StylistError extends Error {
  constructor(message, kind) { super(message); this.kind = kind; }
}

export async function askStylist({ items, outfits, weather, needs, occasion }) {
  const apiKey = getApiKey();
  if (!apiKey) throw new StylistError('Add your Anthropic API key in Settings to use the stylist.', 'nokey');

  const now = Date.now();
  const shortIds = new Map();
  const byShort = new Map();
  items.forEach((it, i) => { const s = `i${i + 1}`; shortIds.set(it.id, s); byShort.set(s, it); });

  const candidates = outfits.slice(0, 5);
  const content = [];
  const occ = (OCCASIONS.find((o) => o.id === occasion) || OCCASIONS[0]).label;
  content.push({
    type: 'text',
    text: `Weather while out:\n${describeWeather(weather, needs)}\n\nOccasion: ${occ}\n\nWardrobe:\n${items.map((it) => describeItem(it, shortIds.get(it.id), now)).join('\n')}`,
  });
  const cText = candidates.map((o, i) => {
    const pieces = SLOTS.map((s) => (o[s] ? `${s} ${shortIds.get(o[s].id)}` : null)).filter(Boolean);
    const acc = (o.acc || []).map((a) => shortIds.get(a.id));
    return `Candidate ${i + 1}: ${pieces.join(', ')}${acc.length ? `, accessories ${acc.join(' ')}` : ''}`;
  }).join('\n');
  content.push({ type: 'text', text: `Candidate outfits:\n${cText}` });

  // Photos of the items that appear in the candidates.
  const inCandidates = new Map();
  for (const o of candidates) for (const p of [...SLOTS.map((s) => o[s]), ...(o.acc || [])]) if (p && p.photo) inCandidates.set(p.id, p);
  for (const p of [...inCandidates.values()].slice(0, 20)) {
    try {
      const data = await smallJpegBase64(p.photo);
      content.push({ type: 'text', text: `Photo of ${shortIds.get(p.id)} (${p.name}):` });
      content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data } });
    } catch (_) { /* skip unreadable photo */ }
  }
  content.push({ type: 'text', text: 'Pick and, if it helps, improve the best outfit for today.' });

  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true, maxRetries: 1 });
  let response;
  try {
    response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: SCHEMA } },
      system: SYSTEM,
      messages: [{ role: 'user', content }],
    });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) throw new StylistError('Your API key was not accepted. Check it in Settings.', 'auth');
    if (err instanceof Anthropic.PermissionDeniedError) throw new StylistError('This API key is not allowed to use the stylist model.', 'auth');
    if (err instanceof Anthropic.RateLimitError) throw new StylistError('Too many requests right now. Try again in a minute.', 'rate');
    if (err instanceof Anthropic.APIConnectionError) throw new StylistError('Could not reach the stylist. Check your connection.', 'network');
    if (err instanceof Anthropic.APIError) throw new StylistError(`The stylist had a problem (${err.status || 'error'}). Try again later.`, 'api');
    throw new StylistError('Something went wrong asking the stylist.', 'unknown');
  }

  if (response.stop_reason === 'refusal') throw new StylistError("The stylist couldn't answer this one. Try shuffling.", 'refusal');
  const text = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  let parsed;
  try { parsed = JSON.parse(text); } catch (_) { throw new StylistError('The stylist sent an answer the app could not read. Try again.', 'parse'); }

  // Map short ids back to real items, and ignore anything that doesn't fit its slot.
  const pick = (sid, cat) => { const it = byShort.get(sid); return it && it.category === cat ? it : null; };
  const outfit = { acc: [] };
  for (const s of SLOTS) outfit[s] = pick(parsed.outfit[s], s);
  for (const a of parsed.outfit.accessories || []) { const it = pick(a, 'acc'); if (it && !outfit.acc.includes(it)) outfit.acc.push(it); }

  // If the answer is missing essentials, fall back to the candidate it was based on.
  const base = candidates[(parsed.based_on_candidate || 1) - 1] || candidates[0];
  for (const s of ['top', 'bottom', 'shoes']) if (!outfit[s] && base && base[s]) outfit[s] = base[s];

  return {
    outfit,
    score: Math.max(1, Math.min(10, Math.round(parsed.score || 0))),
    headline: String(parsed.headline || ''),
    why: String(parsed.why || ''),
    tips: (parsed.tips || []).slice(0, 3).map(String),
    model: response.model,
  };
}
