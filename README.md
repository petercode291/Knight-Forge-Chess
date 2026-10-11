# Knight Forge Chess — Local Two-Player Edition

A responsive pass-and-play chess website built with HTML, CSS and JavaScript.

## Features
- Two-player play on one device with editable player names
- Three time controls: Classic (30 minutes), Rapid (10 minutes + 5 seconds/move), Blitz (5 minutes + 3 seconds/move)
- Live chess clocks, pause/resume and timeout result
- Legal chess rules through chess.js: castling, en passant, promotion, check, checkmate and draws
- Move history, captured pieces, undo and board flip
- Match replay with move-by-move controls and a scrubber
- Save matches in browser local storage; replay or delete saved games
- Responsive desktop and mobile layout

## Run locally
Open `index.html` in a modern browser. If ES modules are blocked for local files, run a local server:
`python -m http.server 8000`
Then visit `http://localhost:8000`.

## Publish with GitHub Pages
1. Create a GitHub repository.
2. Upload `index.html`, `styles.css`, and `script.js` to the repository root.
3. Open Settings → Pages.
4. Select Deploy from a branch, choose `main` and `/(root)`, then Save.
5. Wait for the Pages URL to become available.

## Dependency / connectivity
The chess rules engine is loaded as an ES module from jsDelivr (`chess.js` 1.4.0), so an internet connection is required when the site loads. GitHub Pages can host the static site without a backend.

## Notes
- Saved matches are stored locally in the browser that created them. They do not sync between devices or browsers.
- Replay mode temporarily pauses the live clock and resumes it when returning to the live board.
- Time is measured in the browser; keep the tab open and active for the most accurate clock behaviour.
