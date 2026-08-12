# Museum of Ordinary Life — website

Public static website for **museumofordinarylife.org**.

The repository root mirrors the deployed web root. There is no framework and no build step required for normal editing.

```text
/
├── index.html
├── CNAME
├── .nojekyll
├── robots.txt
├── sitemap.xml
├── favicon.png
├── apple-touch-icon.png
├── data/
│   └── helpdesk.json
├── js/
│   └── helpdesk.js
└── cafe/
    ├── index.html
    ├── cafe.css
    ├── cafe.js
    ├── README.md
    └── data/
        ├── scenes.json
        └── scene.example.json
```

Clone with GitHub Desktop or Git, edit in VS Code, preview with a local static server, then commit and push to `main` when ready to publish.

The Help Desk currently matches questions locally in the visitor's browser. The Café reads its display program from `cafe/data/scenes.json`.
