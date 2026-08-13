# Museum of Ordinary Life — website

Public static website for **museumofordinarylife.org**.

This repository is the canonical source for the present-day Museum website. GitHub Pages publishes directly from the `main` branch at the repository root. There is no framework and no build step required for normal editing.

## Current structure

```text
/
├── index.html                     # main Museum site
├── CNAME                          # museumofordinarylife.org
├── .nojekyll
├── robots.txt
├── sitemap.xml
├── favicon.png
├── apple-touch-icon.png
├── data/
│   ├── helpdesk-core.json         # Help Desk shared configuration
│   ├── helpdesk-entries-01.json   # curated Help Desk entries
│   ├── helpdesk-entries-02.json
│   ├── helpdesk-entries-03.json
│   ├── helpdesk-entries-04.json
│   ├── helpdesk-entries-05.json
│   └── helpdesk.json              # combined compatibility copy
├── js/
│   ├── helpdesk.js                # Help Desk bootstrap / compatibility layer
│   └── helpdesk-core.js           # local matching and visitor-services UI
├── library/
│   ├── README.md
│   ├── index.html
│   ├── library.css
│   ├── library.js
│   ├── data/
│   │   └── shelves.json
│   └── assets/
│       └── reading-room/          # encoded reading-room image chunks
└── cafe/
    ├── README.md                  # retired Café prototype notes
    ├── index.html                 # compatibility redirect to /library/
    ├── cafe.css                   # retained legacy prototype source
    ├── cafe.js                    # retained legacy prototype source
    └── data/                      # retained legacy prototype data
```

## Publishing workflow

Clone with GitHub Desktop or Git, edit in VS Code, preview with a local static server, then commit and push to `main` when ready to publish. GitHub Pages serves the repository root at `https://museumofordinarylife.org/` with HTTPS enforced.

The active Library / Reading Room lives at `/library/`. The former `/cafe/` URL redirects there so old links and bookmarks keep working.

## Help Desk

The Help Desk runs locally in the visitor's browser. `js/helpdesk-core.js` contains the matcher and interface logic. Curated knowledge is split across `data/helpdesk-core.json` and the numbered `data/helpdesk-entries-*.json` files. `data/helpdesk.json` remains as a combined compatibility copy.

Old Café phrasing such as “Where's the café?” is intentionally retained as a legacy alias and now routes visitors to the Library.

## Documentation maintenance

Documentation is part of the change.

When a change adds, removes, renames, or materially changes a page, directory, route, workflow, data format, public behavior, deployment step, or maintenance procedure, update the relevant README and repository-structure notes in the same work. Keep documentation short, accurate, and anchored to the files and behavior that actually exist.

If it is unclear whether a change affects documentation, check before treating the work as complete.
