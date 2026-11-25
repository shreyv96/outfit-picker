import * as db from './db.js';
import { STOCKHOLM, fetchForecast, summarizeDay, describeCode, getDeviceLocation } from './weather.js';
import {
  CATEGORIES, SUBTYPES, COLOURS, colourById, OCCASIONS, WARMTH_LABELS,
  nearestColour, suggestOutfits, tipsFor, slotLabel,
} from './outfit.js';
import { SAMPLE_ITEMS } from './sample.js';

// ---------- State ----------
const store = {
  get(k, d) { try { const v = localStorage.getItem('op.' + k); return v === null ? d : JSON.parse(v); } catch (_) { return d; } },
  set(k, v) { try { localStorage.setItem('op.' + k, JSON.stringify(v)); } catch (_) {} },
};

const state = {
  tab: 'today',
  items: [],
  filter: 'all',
  dayOffset: 0,
  occasion: store.get('occasion', 'casual'),
  shuffle: 0,
  weather: null, // { data, offline, at }
  weatherError: null,
  loc: store.get('loc', STOCKHOLM),
  editing: null,
};

const $ = (sel, root = document) => root.querySelector(sel);
const view = $('#view');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Object URLs for photos, cached per item.
const photoUrls = new Map();
function photoUrl(item) {
  if (!item.photo) return null;
  const cached = photoUrls.get(item.id);
  if (cached && cached.blob === item.photo) return cached.url;
  if (cached) URL.revokeObjectURL(cached.url);
  const url = URL.createObjectURL(item.photo);
  photoUrls.set(item.id, { blob: item.photo, url });
  return url;
}

function swatchStyle(colourId) {
  const c = colourById[colourId] || colourById.grey;
  return c.hex.startsWith('#') ? `background:${c.hex}` : `background:${c.hex}`;
}

function thumb(item, cls = '') {
  const url = photoUrl(item);
  if (url) return `<div class="thumb ${cls}"><img src="${url}" alt="${esc(item.name)}" loading="lazy"></div>`;
  const sub = (SUBTYPES[item.category] || []).find((s) => s.id === item.subtype);
  return `<div class="thumb ${cls} nophoto" style="${swatchStyle(item.colour)}"><span>${esc(sub ? sub.label : item.name)}</span></div>`;
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 2600);
}

// ---------- Navigation ----------
function setTab(tab) {
  state.tab = tab;
  document.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  render();
  window.scrollTo(0, 0);
}

function render() {
  const titles = { today: 'Today', wardrobe: 'Wardrobe', add: state.editing ? 'Edit item' : 'Add item' };
  $('#title').textContent = titles[state.tab];
  if (state.tab === 'today') renderToday();
  else if (state.tab === 'wardrobe') renderWardrobe();
  else renderForm();
}

// ---------- Today ----------
async function loadWeather(force = false) {
  if (state.weather && !force) return;
  state.weatherError = null;
  try {
    state.weather = await fetchForecast(state.loc);
  } catch (e) {
    state.weatherError = 'Could not load the weather. Check your connection and try again.';
  }
}

function weekdayName(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
}

async function renderToday() {
  if (!state.weather && !state.weatherError) {
    view.innerHTML = `<div class="loading">Checking the weather in ${esc(state.loc.name)}…</div>`;
    await loadWeather();
    if (state.tab !== 'today') return;
  }
  if (state.weatherError) {
    view.innerHTML = `<div class="card empty"><p>${esc(state.weatherError)}</p><button class="btn" id="retry">Try again</button></div>`;
    $('#retry').onclick = async () => { state.weatherError = null; state.weather = null; renderToday(); };
    return;
  }
  const w = summarizeDay(state.weather.data, state.dayOffset);
  const desc = describeCode(w.code);
  const result = suggestOutfits(state.items, w, { occasion: state.occasion, seed: String(state.shuffle) });
  const tips = tipsFor(w, result.needs);
  const outfit = result.outfits.length ? result.outfits[state.shuffle % result.outfits.length] : null;

  const dayTabs = [0, 1].map((d) => `<button class="seg ${state.dayOffset === d ? 'on' : ''}" data-day="${d}">${d === 0 ? 'Today' : 'Tomorrow'}</button>`).join('');
  const occ = OCCASIONS.map((o) => `<button class="chip ${state.occasion === o.id ? 'on' : ''}" data-occ="${o.id}">${o.label}</button>`).join('');

  let outfitHtml;
  if (!state.items.length) {
    outfitHtml = `<div class="card empty">
      <h3>Your wardrobe is empty</h3>
      <p>Add your clothes with a photo and the app will dress you for the weather. Start with 8 to 10 everyday pieces: a coat, a rain jacket, a knit or two, jeans, trousers, a few tops, sneakers and boots.</p>
      <div class="row"><button class="btn primary" data-go="add">Add your first item</button>
      <button class="btn" id="sample">Try a sample wardrobe</button></div></div>`;
  } else if (!outfit) {
    outfitHtml = `<div class="card empty"><p>Add at least one top and one pair of bottoms to get an outfit.</p><button class="btn primary" data-go="add">Add item</button></div>`;
  } else {
    const order = ['outer', 'mid', 'top', 'bottom', 'shoes'];
    const pieces = order.filter((k) => outfit[k]).map((k) => outfit[k]).concat(outfit.acc);
    outfitHtml = `<div class="card outfit">
      <div class="outfit-grid">${pieces.map((p) => `<button class="piece" data-edit="${p.id}">${thumb(p)}<div class="piece-label"><span class="cat">${esc(labelForSlot(p))}</span><span class="name">${esc(p.name)}</span></div></button>`).join('')}</div>
      <div class="row actions"><button class="btn" id="shuffle">↻ Shuffle</button><button class="btn primary" id="wear">✓ I'm wearing this</button></div>
    </div>`;
  }

  const missingHtml = state.items.length && result.missing.length
    ? `<div class="card hint"><strong>For days like this, it would help to add:</strong> ${result.missing.map(slotLabel).join(', ')}.</div>` : '';

  view.innerHTML = `
    <div class="segs">${dayTabs}</div>
    <section class="card weather">
      <div class="w-main">
        <div class="w-icon">${desc.icon}</div>
        <div>
          <div class="w-temp">${Math.round(w.tMin)}° to ${Math.round(w.tMax)}°</div>
          <div class="w-sub">${desc.label}. Feels like ${Math.round(w.feelsMin)}°</div>
        </div>
      </div>
      <div class="w-meta">
        <span>☂ ${Math.round(w.precipProb)}%</span>
        <span>💨 ${Math.round(w.windMax)} m/s</span>
        <span>🌅 ${w.sunrise.slice(11, 16)}–${w.sunset.slice(11, 16)}</span>
      </div>
      <div class="w-foot">${esc(state.loc.name)} · ${weekdayName(w.date)} · <b>${result.needs.band.label}</b>${state.weather.offline ? ' · offline, last saved forecast' : ''}</div>
    </section>
    <div class="chips">${occ}</div>
    ${outfitHtml}
    ${missingHtml}
    ${tips.length ? `<section class="card tips"><h3>Tips for the day</h3><ul>${tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></section>` : ''}
  `;

  view.querySelectorAll('[data-day]').forEach((b) => (b.onclick = () => { state.dayOffset = Number(b.dataset.day); state.shuffle = 0; renderToday(); }));
  view.querySelectorAll('[data-occ]').forEach((b) => (b.onclick = () => { state.occasion = b.dataset.occ; store.set('occasion', state.occasion); state.shuffle = 0; renderToday(); }));
  view.querySelectorAll('[data-go]').forEach((b) => (b.onclick = () => { state.editing = null; setTab(b.dataset.go); }));
  view.querySelectorAll('[data-edit]').forEach((b) => (b.onclick = () => editItem(b.dataset.edit)));
  const sample = $('#sample');
  if (sample) sample.onclick = loadSample;
  const sh = $('#shuffle');
  if (sh) sh.onclick = () => { state.shuffle++; renderToday(); };
  const wear = $('#wear');
  if (wear) wear.onclick = () => wearOutfit(outfit, w.date);
}

function labelForSlot(p) {
  const sub = (SUBTYPES[p.category] || []).find((s) => s.id === p.subtype);
  return sub ? sub.label : (CATEGORIES.find((c) => c.id === p.category) || {}).one;
}

async function wearOutfit(outfit, date) {
  const pieces = ['outer', 'mid', 'top', 'bottom', 'shoes'].map((k) => outfit[k]).filter(Boolean).concat(outfit.acc);
  const when = new Date(date + 'T08:00:00').toISOString();
  for (const p of pieces) {
    const it = state.items.find((i) => i.id === p.id);
    if (!it) continue;
    it.lastWorn = when;
    it.wornCount = (it.wornCount || 0) + 1;
    await db.putItem(it);
  }
  await db.addLog({ date, itemIds: pieces.map((p) => p.id), occasion: state.occasion });
  toast('Saved. The app will mix things up over the next few days.');
}

async function loadSample() {
  for (const s of SAMPLE_ITEMS) await db.putItem({ ...s, id: db.newId(), sample: true, createdAt: new Date().toISOString(), wornCount: 0 });
  await refreshItems();
  toast('Sample wardrobe added. You can remove it in Settings.');
  renderToday();
}

// ---------- Wardrobe ----------
function renderWardrobe() {
  const filters = [{ id: 'all', label: 'All' }, ...CATEGORIES];
  const items = state.items
    .filter((i) => state.filter === 'all' || i.category === state.filter)
    .sort((a, b) => (CATEGORIES.findIndex((c) => c.id === a.category) - CATEGORIES.findIndex((c) => c.id === b.category)) || a.name.localeCompare(b.name));
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c.id, state.items.filter((i) => i.category === c.id).length]));
  view.innerHTML = `
    <div class="chips scroll">${filters.map((f) => `<button class="chip ${state.filter === f.id ? 'on' : ''}" data-f="${f.id}">${f.label}${f.id !== 'all' ? ` <small>${counts[f.id]}</small>` : ` <small>${state.items.length}</small>`}</button>`).join('')}</div>
    ${items.length ? `<div class="grid">${items.map((i) => `
      <button class="tile" data-edit="${i.id}">
        ${thumb(i)}
        <div class="tile-label"><span class="name">${esc(i.name)}</span>
        <span class="meta"><i class="dot" style="${swatchStyle(i.colour)}"></i>${WARMTH_LABELS[i.warmth]}${i.waterproof ? ' · ☂' : ''}</span></div>
      </button>`).join('')}</div>`
      : `<div class="card empty"><p>${state.items.length ? 'Nothing in this category yet.' : 'No clothes yet.'}</p><button class="btn primary" data-go="add">Add item</button></div>`}
  `;
  view.querySelectorAll('[data-f]').forEach((b) => (b.onclick = () => { state.filter = b.dataset.f; renderWardrobe(); }));
  view.querySelectorAll('[data-edit]').forEach((b) => (b.onclick = () => editItem(b.dataset.edit)));
  view.querySelectorAll('[data-go]').forEach((b) => (b.onclick = () => { state.editing = null; setTab('add'); }));
}

function editItem(id) {
  const it = state.items.find((i) => i.id === id);
  if (!it) return;
  state.editing = { ...it };
  setTab('add');
}

// ---------- Add / edit form ----------
function blankItem() {
  const cat = state.filter !== 'all' ? state.filter : 'top';
  const sub = SUBTYPES[cat][0];
  return { id: null, name: '', category: cat, subtype: sub.id, colour: 'black', warmth: sub.warmth, waterproof: !!sub.waterproof, formality: sub.formality, photo: null };
}

function renderForm() {
  if (!state.editing) state.editing = blankItem();
  const it = state.editing;
  const isNew = !it.id;
  const url = it.photo ? URL.createObjectURL(it.photo) : null;
  const subs = SUBTYPES[it.category];
  view.innerHTML = `
    <form id="itemForm" class="form" autocomplete="off">
      <label class="photo-pick ${url ? 'has' : ''}">
        ${url ? `<img src="${url}" alt="">` : `<span class="ph-icon">📷</span><span>Take or choose a photo</span><small>Lay it flat or hang it against a plain wall</small>`}
        <input type="file" accept="image/*" id="photoInput" hidden>
      </label>
      ${url ? `<button type="button" class="link" id="removePhoto">Remove photo</button>` : ''}

      <div class="field"><span class="lbl">Type of clothing</span>
        <div class="chips wrap">${CATEGORIES.map((c) => `<button type="button" class="chip ${it.category === c.id ? 'on' : ''}" data-cat="${c.id}">${c.one}</button>`).join('')}</div>
      </div>
      <div class="field"><span class="lbl">Kind</span>
        <div class="chips wrap">${subs.map((s) => `<button type="button" class="chip ${it.subtype === s.id ? 'on' : ''}" data-sub="${s.id}">${s.label}</button>`).join('')}</div>
      </div>
      <label class="field"><span class="lbl">Name</span>
        <input type="text" id="name" value="${esc(it.name)}" placeholder="e.g. Grey merino crewneck" maxlength="60">
      </label>
      <div class="field"><span class="lbl">Main colour ${it._autoColour ? '<small>(guessed from the photo)</small>' : ''}</span>
        <div class="swatches">${COLOURS.map((c) => `<button type="button" class="sw ${it.colour === c.id ? 'on' : ''}" data-col="${c.id}" title="${c.label}" aria-label="${c.label}" style="background:${c.hex}"></button>`).join('')}</div>
        <small class="muted">${esc(colourById[it.colour].label)}</small>
      </div>
      <div class="field"><span class="lbl">Warmth: <b id="warmthLbl">${WARMTH_LABELS[it.warmth]}</b></span>
        <input type="range" min="1" max="5" step="1" id="warmth" value="${it.warmth}">
        <div class="range-ends"><small>T-shirt</small><small>Winter parka</small></div>
      </div>
      <div class="field"><span class="lbl">How dressy</span>
        <div class="chips">${[[1, 'Casual'], [2, 'Smart casual'], [3, 'Smart']].map(([v, l]) => `<button type="button" class="chip ${it.formality === v ? 'on' : ''}" data-form="${v}">${l}</button>`).join('')}</div>
      </div>
      <label class="toggle"><input type="checkbox" id="waterproof" ${it.waterproof ? 'checked' : ''}><span>Waterproof or good in rain and slush</span></label>

      <div class="row form-actions">
        <button type="submit" class="btn primary">${isNew ? 'Add to wardrobe' : 'Save changes'}</button>
        ${isNew ? '' : `<button type="button" class="btn danger" id="delete">Delete</button>`}
      </div>
      ${isNew ? '' : `<p class="muted small">${it.wornCount ? `Worn ${it.wornCount} time${it.wornCount > 1 ? 's' : ''}, last on ${new Date(it.lastWorn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}.` : 'Not worn yet.'}</p>`}
    </form>`;

  const form = $('#itemForm');
  const syncName = () => { it.name = $('#name').value; };
  $('#name').oninput = syncName;
  $('#photoInput').onchange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const { blob, rgb } = await processPhoto(file);
      syncName();
      it.photo = blob;
      if (isNew || it._autoColour !== false) { it.colour = nearestColour(rgb); it._autoColour = true; }
      renderForm();
    } catch (err) {
      toast('Could not read that photo. Try another one.');
    }
  };
  const rm = $('#removePhoto');
  if (rm) rm.onclick = () => { syncName(); it.photo = null; renderForm(); };
  form.querySelectorAll('[data-cat]').forEach((b) => (b.onclick = () => {
    syncName();
    it.category = b.dataset.cat;
    applySubtype(it, SUBTYPES[it.category][0].id);
    renderForm();
  }));
  form.querySelectorAll('[data-sub]').forEach((b) => (b.onclick = () => { syncName(); applySubtype(it, b.dataset.sub); renderForm(); }));
  form.querySelectorAll('[data-col]').forEach((b) => (b.onclick = () => { syncName(); it.colour = b.dataset.col; it._autoColour = false; renderForm(); }));
  form.querySelectorAll('[data-form]').forEach((b) => (b.onclick = () => { syncName(); it.formality = Number(b.dataset.form); renderForm(); }));
  $('#warmth').oninput = (e) => { it.warmth = Number(e.target.value); $('#warmthLbl').textContent = WARMTH_LABELS[it.warmth]; };
  $('#waterproof').onchange = (e) => { it.waterproof = e.target.checked; };
  const del = $('#delete');
  if (del) del.onclick = async () => {
    if (del.dataset.confirm !== '1') { del.dataset.confirm = '1'; del.textContent = 'Tap again to delete'; return; }
    await db.deleteItem(it.id);
    await refreshItems();
    state.editing = null;
    toast('Deleted');
    setTab('wardrobe');
  };
  form.onsubmit = async (e) => {
    e.preventDefault();
    syncName();
    const sub = SUBTYPES[it.category].find((s) => s.id === it.subtype);
    const colourName = colourById[it.colour].label;
    const item = {
      id: it.id || db.newId(),
      name: it.name.trim() || `${colourName} ${sub ? sub.label.split(' / ')[0].toLowerCase() : 'item'}`,
      category: it.category,
      subtype: it.subtype,
      colour: it.colour,
      warmth: it.warmth,
      waterproof: !!it.waterproof,
      formality: it.formality,
      photo: it.photo || null,
      createdAt: it.createdAt || new Date().toISOString(),
      lastWorn: it.lastWorn || null,
      wornCount: it.wornCount || 0,
      sample: it.sample || false,
    };
    await db.putItem(item);
    await refreshItems();
    toast(isNew ? `Added ${item.name}` : 'Saved');
    if (isNew) {
      // Stay on the form for fast entry, keeping the category.
      state.editing = null;
      state.filter = item.category;
      const next = blankItem();
      state.editing = next;
      renderForm();
      window.scrollTo(0, 0);
    } else {
      state.editing = null;
      setTab('wardrobe');
    }
  };
}

function applySubtype(it, subId) {
  const sub = SUBTYPES[it.category].find((s) => s.id === subId) || SUBTYPES[it.category][0];
  it.subtype = sub.id;
  it.warmth = sub.warmth;
  it.formality = sub.formality;
  it.waterproof = !!sub.waterproof;
}

// Shrink photos so the wardrobe stays small, and guess the main colour from the centre.
async function processPhoto(file) {
  const img = await new Promise((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = URL.createObjectURL(file);
  });
  const max = 900;
  const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);
  URL.revokeObjectURL(img.src);
  const cw = Math.max(1, Math.round(w * 0.3));
  const ch = Math.max(1, Math.round(h * 0.3));
  const data = ctx.getImageData(Math.round((w - cw) / 2), Math.round((h - ch) / 2), cw, ch).data;
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < data.length; i += 16) { r += data[i]; g += data[i + 1]; b += data[i + 2]; n++; }
  const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.82));
  return { blob, rgb: [r / n, g / n, b / n] };
}

// ---------- Settings ----------
function openSettings() {
  const sheet = $('#sheet');
  const usingDevice = state.loc.name !== STOCKHOLM.name;
  const hasSamples = state.items.some((i) => i.sample);
  sheet.innerHTML = `
    <div class="sheet-inner">
      <div class="sheet-head"><h2>Settings</h2><button class="icon-btn" id="closeSheet" aria-label="Close">✕</button></div>
      <h3>Weather location</h3>
      <div class="chips"><button class="chip ${!usingDevice ? 'on' : ''}" id="locSthlm">Stockholm</button><button class="chip ${usingDevice ? 'on' : ''}" id="locDevice">Use my location</button></div>
      <h3>Backup</h3>
      <p class="muted small">Your wardrobe lives only on this phone. Save a backup file now and then, for example to iCloud Drive or Google Drive, so you can restore it on a new phone.</p>
      <div class="row"><button class="btn" id="exportBtn">Save backup</button><label class="btn">Restore backup<input type="file" accept="application/json,.json" id="importInput" hidden></label></div>
      ${hasSamples ? `<h3>Sample wardrobe</h3><div class="row"><button class="btn" id="clearSamples">Remove sample items</button></div>` : ''}
      <h3>About</h3>
      <p class="muted small">${state.items.length} items. Weather by <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a>. Nothing leaves your device except the weather lookup for your location.</p>
    </div>`;
  sheet.showModal();
  $('#closeSheet').onclick = () => sheet.close();
  $('#locSthlm').onclick = () => setLocation(STOCKHOLM);
  $('#locDevice').onclick = async () => {
    try { setLocation(await getDeviceLocation()); }
    catch (_) { toast('Location permission was not given. Using Stockholm.'); }
  };
  $('#exportBtn').onclick = exportBackup;
  $('#importInput').onchange = importBackup;
  const cs = $('#clearSamples');
  if (cs) cs.onclick = async () => {
    for (const i of state.items.filter((x) => x.sample)) await db.deleteItem(i.id);
    await refreshItems();
    sheet.close();
    toast('Sample items removed');
    render();
  };
}

function setLocation(loc) {
  state.loc = loc;
  store.set('loc', loc);
  state.weather = null;
  $('#sheet').close();
  if (state.tab === 'today') renderToday();
}

const blobToDataUrl = (blob) => new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(blob); });
const dataUrlToBlob = async (url) => (await fetch(url)).blob();

async function exportBackup() {
  const items = await db.getItems();
  const out = [];
  for (const i of items) out.push({ ...i, photo: i.photo ? await blobToDataUrl(i.photo) : null });
  const log = await db.getLog();
  const json = JSON.stringify({ app: 'outfit-picker', version: 1, exportedAt: new Date().toISOString(), items: out, log });
  const name = `wardrobe-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const file = new File([json], name, { type: 'application/json' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'Wardrobe backup' }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

async function importBackup(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (data.app !== 'outfit-picker' || !Array.isArray(data.items)) throw new Error('bad file');
    let n = 0;
    for (const i of data.items) {
      await db.putItem({ ...i, photo: i.photo ? await dataUrlToBlob(i.photo) : null });
      n++;
    }
    await refreshItems();
    $('#sheet').close();
    toast(`Restored ${n} items`);
    render();
  } catch (_) {
    toast("That doesn't look like a wardrobe backup file.");
  }
}

// ---------- Boot ----------
async function refreshItems() {
  state.items = await db.getItems();
}

async function boot() {
  document.querySelectorAll('.tabs button').forEach((b) => (b.onclick = () => {
    if (b.dataset.tab === 'add') state.editing = null;
    setTab(b.dataset.tab);
  }));
  $('#settingsBtn').onclick = openSettings;
  $('#sheet').addEventListener('click', (e) => { if (e.target.id === 'sheet') e.target.close(); });
  await refreshItems();
  render();
  db.requestPersistence();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  // Refresh the forecast when you come back to the app later in the day.
  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) hiddenAt = Date.now();
    else if (hiddenAt && Date.now() - hiddenAt > 30 * 60 * 1000) { state.weather = null; if (state.tab === 'today') renderToday(); }
  });
}

boot();
