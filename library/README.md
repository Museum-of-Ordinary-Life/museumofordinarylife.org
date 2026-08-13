# Museum of Ordinary Life — Library / Reading Room

The Library is a quiet digital reading room inside the Museum of Ordinary Life.

Public route: `/library/`

> It may be a website, but you can still sit down.

## Purpose

The Library is for material that helps explain ordinary life: books, essays, field notes, Museum documents, references, contributed writing, and eventually selected material from the collection.

The first version is intentionally sparse. Empty shelves and an empty table are valid states; the site should not invent holdings simply to make the room look full.

## Files

```text
/library/
├── README.md
├── index.html             # Library markup
├── library.css            # reading-room layout and responsive styles
├── library.js             # room art, panels, shelves, notebook, quiet mode
├── data/
│   └── shelves.json       # current shelf definitions and holdings
└── assets/
    └── reading-room/
        ├── part-01.txt
        ├── ...
        └── part-08d.txt   # encoded WebP image data, assembled in the browser
```

## Current behavior

The room currently provides four simple actions:

- **Browse the shelves** — reads `data/shelves.json` and reports current shelf contents honestly.
- **On the table** — a small future surface for material the Museum is currently reading, noticing, or using; currently empty.
- **Notebook** — an ephemeral textarea for the visitor. Nothing typed there is submitted, saved, synced, or sent anywhere; reloading or closing the page clears it.
- **Quiet mode** — reduces the interface so the reading-room scene can sit mostly on its own.

The information panel opens from the left so it does not compete with the Library introduction on the right side of the room.

## Shelves

`data/shelves.json` is the source for the current shelf list. As of 2026-08-12 the shelves are:

- Ordinary Life
- Home & Domestic Life
- Work & Labor
- Cities & Public Life
- Technology & Interfaces
- Archives & Memory
- Museum Publications
- Field Notes

Each shelf has an `items` array. Leave it empty until there is a real item to add.

## Reading-room image

The current illustrated reading-room background is an optimized WebP. Because it was initially written to GitHub through a text-only connector path, its encoded data is split across `assets/reading-room/part-*.txt`. `library.js` fetches those chunks, joins and decodes them, creates a browser object URL, and assigns that image to the room.

This is a transport workaround, not a preferred long-term asset format. When normal binary file editing through Git/VS Code is convenient, the image can be replaced with a conventional file such as `assets/reading-room.webp` and the loader simplified. If that happens, update this README at the same time.

## Compatibility with the former Café

The Library replaced the Collection Lounge / Café. `/cafe/` now redirects here. The main Museum and Help Desk keep some old words such as `cafe`, `coffee`, and `rest` as compatibility aliases, but the destination is the Library.

The retired Café source is documented in `../cafe/README.md` and is not part of the active Library implementation.

## Design principles

Keep the Library simple, quiet, and ordinary rather than monumental or game-like. Prefer a small number of clear interactions, real material over filler, breathing room over interface density, and explicit permission before collection material appears in a Library-specific display context.

When Library behavior, routes, data, assets, or file structure change, update this README alongside the code.
