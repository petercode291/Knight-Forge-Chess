<div align="center">

# ♞ Knight Forge Chess

### A refined, local two-player chess experience.

**Play face-to-face on one device. Choose your time control, make your moves, and replay the match.**

[![Play Knight Forge](https://img.shields.io/badge/PLAY%20NOW-Knight%20Forge-d9b979?style=for-the-badge&logo=github&logoColor=111827)](https://petercode291.github.io/Knight-Forge-Chess/)
[![GitHub repo](https://img.shields.io/badge/GitHub-Repository-24292f?style=for-the-badge&logo=github)](https://github.com/petercode291/Knight-Forge-Chess)

</div>

---

## ♟️ About

**Knight Forge Chess** is a browser-based chess game designed for two people playing on the same device. It combines a clean, premium-dark interface with a full chess rules engine, practical time controls, match replay, and locally saved games.

No account or backend is required. Open the website, set up the players, choose a time control, and play.

## ✨ Features

- **Local two-player gameplay** — White and Black take turns on the same board and device.
- **Custom player names** — Set names for both players before a match begins.
- **Three time controls**
  - **Classic:** 30 minutes, no increment.
  - **Rapid:** 10 minutes, with a 5-second increment per move.
  - **Blitz:** 5 minutes, with a 3-second increment per move.
- **Live chess clocks** — Separate clocks switch automatically after each legal move, with pause/resume and timeout handling.
- **Chess rules and validation** — Legal moves, check, checkmate, stalemate, castling, en passant, pawn promotion, and draw detection.
- **Move history** — Review the moves played in the current match.
- **Captured pieces** — Keep track of pieces captured by each side.
- **Undo move** — Take back the most recent move during a live match.
- **Board orientation** — Flip the board whenever you want.
- **Match replay** — Step through a game move by move or jump to a position using the replay slider.
- **Saved matches** — Save, review, replay, and delete games stored in your browser.
- **Responsive design** — Comfortable to use on desktop, tablet, and mobile screens.

## 🚀 Play online

Start playing here:

**[https://petercode291.github.io/Knight-Forge-Chess/](https://petercode291.github.io/Knight-Forge-Chess/)**

## 🧰 Built with

| Technology | Purpose |
| --- | --- |
| HTML5 | Page structure and accessible interface |
| CSS3 | Layout, responsive styling, and visual design |
| JavaScript (ES Modules) | Game interface, clocks, replay, and match management |
| [chess.js 1.4.0](https://github.com/jhlywa/chess.js) | Chess rules, legal move generation, and game-state validation |
| Browser Local Storage | Saving matches on the current device |

## 🖥️ Run locally

You can run Knight Forge Chess locally with a lightweight static server.

1. **Clone the repository:**

   ```bash
   git clone https://github.com/petercode291/Knight-Forge-Chess.git
   ```

2. **Open the project folder:**

   ```bash
   cd Knight-Forge-Chess
   ```

3. **Start a local server** (Python is one option):

   ```bash
   python -m http.server 8000
   ```

4. **Open the game** in your browser:

   ```text
   http://localhost:8000
   ```

> **Note:** The chess rules engine is imported from jsDelivr as an ES module. An internet connection is required when the game loads. Opening the project through a local server avoids browser restrictions that can affect JavaScript modules opened directly from a `file://` URL.

## 🌐 Deploy with GitHub Pages

Knight Forge Chess is a static website and can be hosted using GitHub Pages.

1. Push the project files (`index.html`, `styles.css`, and `script.js`) to the repository.
2. Open the repository's **Settings** tab.
3. Select **Pages** from the sidebar.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and the `/ (root)` folder.
6. Click **Save** and wait for GitHub Pages to finish deploying.

Once deployment is complete, visit:

**https://petercode291.github.io/Knight-Forge-Chess/**

## 💾 Saved games and privacy

- Saved matches are kept in the browser's **Local Storage** on the device where they were saved.
- Saved matches are not uploaded to a server and do not automatically sync between browsers or devices.
- Clearing the browser's site data may remove locally saved matches.
- The game does not require player accounts.

## ⚠️ Current scope

Knight Forge Chess is built for **pass-and-play on a single device**. It does not currently provide online multiplayer, account-based profiles, cloud synchronization, or a server-hosted match history.

For accurate clock behaviour, keep the game tab open while playing. Browser throttling or a device going to sleep may affect timer updates.

## 🤝 Contributing

Suggestions, bug reports, and improvements are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make your changes and test the game in a browser.
4. Submit a pull request describing the improvement.

For bugs, include the browser/device details and steps to reproduce the issue.

## 📄 License

No license is currently specified for this repository. If you intend to accept contributions or allow reuse, consider adding a `LICENSE` file with the license you choose.

---

<div align="center">

**Knight Forge Chess** · Two players. One board. Your next move.

[Play the game](https://petercode291.github.io/Knight-Forge-Chess/) · [View source](https://github.com/petercode291/Knight-Forge-Chess)

</div>
