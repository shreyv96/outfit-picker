# Outfit Picker

A home-screen web app for iPhone and Android that keeps an inventory of your clothes and suggests an outfit for the day's weather, styled for Stockholm: a neutral palette with at most one accent colour, practical layering, and boots when it's slushy.

## Using it

1. Open the app's web address on your phone.
2. **iPhone (Safari):** tap Share, then *Add to Home Screen*. **Android (Chrome):** tap the ⋮ menu, then *Install app* or *Add to Home screen*.
3. Add your clothes from the **Add** tab with a photo. The app guesses the colour and fills in sensible warmth and dressiness, which you can adjust.
4. The **Today** tab shows the weather and an outfit. Pick *Casual*, *Work* or *Dinner*, tap *Shuffle* for another option, and *I'm wearing this* so it mixes things up over the next days.

Your wardrobe is stored only on your phone. Use **Settings → Save backup** now and then, and **Restore backup** on a new phone.

## How outfits are chosen

- The coldest "feels like" temperature between 07:00 and 21:00 sets how many layers you need (warm, mild, cool, chilly, cold, freezing).
- Rain calls for a waterproof outer layer, slush calls for boots, wind adds a hat and a windproof layer, and below zero adds gloves.
- Style scoring prefers neutrals with at most one accent colour, tonal outfits, and pieces of similar dressiness for the occasion.
- Pieces worn in the last few days are pushed down the list.

Weather comes from [Open-Meteo](https://open-meteo.com/) (free, no key).

## Code

Plain HTML, CSS and JavaScript with no build step, so GitHub Pages can host it as-is.

- `js/outfit.js`: categories, colours and the outfit engine
- `js/weather.js`: forecast and the daily summary
- `js/db.js`: on-device storage (IndexedDB)
- `js/app.js`: screens
- `sw.js`: offline support. Bump `VERSION` when files change.

To run it locally: `python3 -m http.server` in this folder, then open http://localhost:8000.
