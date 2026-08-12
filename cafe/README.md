# Museum of Ordinary Life — Collection Lounge / Café v0.1

## Location
The lounge lives at `/cafe/`.

- `/cafe/index.html` — Collection Lounge / Café
- `/cafe/cafe.css` — room design
- `/cafe/cafe.js` — collection-program renderer and lounge controls
- `/cafe/data/scenes.json` — live café program (currently empty)
- `/cafe/data/scene.example.json` — example record only; it is not loaded by the site

## What v0.1 does
- Public Café links from the Museum navigation, start-here area, and footer.
- Typing `cafe`, `coffee`, or `rest` on the main Museum page opens `/cafe/`.
- Renders a quiet architectural lounge using HTML/CSS; no stock or generated collection media.
- Window 01 and Projection 01 are intentionally empty until eligible collection media is added.
- Reads `/cafe/data/scenes.json` and supports image/video display plus opt-in room audio.
- Only records with `cafeDisplay: true` are eligible.
- Includes a local-only table notebook. Its text is not saved or submitted.
- Includes quiet mode and honors `prefers-reduced-motion`.

## Adding a collection view later
Add an object based on `/cafe/data/scene.example.json` to the `scenes` array in `scenes.json`, update the accession metadata and media paths, and confirm the contribution has explicit permission for Café/ambient display.

Recommended media placement:

`/collection/<ACCESSION-ID>/...`

The renderer understands `surface: "window"`, `surface: "projector"`, and `surface: "room-sound"`.

Audio never autoplays. Visitors must turn it on.
