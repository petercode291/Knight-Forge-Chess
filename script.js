import { Chess } from "https://cdn.jsdelivr.net/npm/chess.js@1.4.0/+esm";

const $ = (id) => document.getElementById(id);
const game = new Chess();
const PIECES = {
  w: { k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙" },
  b: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" },
};
const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const MODES = {
  classic: { label: "Classic", base: 1800, increment: 0, display: "30 min" },
  rapid: { label: "Rapid", base: 600, increment: 5, display: "10 min" },
  blitz: { label: "Blitz", base: 300, increment: 3, display: "5 min" },
};
let names = { w: "Player 1", b: "Player 2" },
  mode = "blitz",
  clocks = { w: 300, b: 300 };
let selected = null,
  targets = [],
  flipped = false,
  lastMove = null;
let running = false,
  paused = true,
  activeColor = "w",
  timerId = null,
  lastTick = 0;
let pendingPromotion = null,
  matchStarted = false,
  matchEnded = false;
let initialSnapshot = null,
  replayData = null,
  replayIndex = 0,
  replayGame = null;

function toast(msg) {
  $("toast").textContent = msg;
  $("toast").classList.add("show");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => $("toast").classList.remove("show"), 2200);
}
function fmt(seconds) {
  seconds = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
function snapshot() {
  return {
    names: { ...names },
    mode,
    clocks: { ...clocks },
    moves: game
      .history({ verbose: true })
      .map((m) => ({ from: m.from, to: m.to, promotion: m.promotion })),
    initial: initialSnapshot,
    finalFen: game.fen(),
    result: $("game-status").textContent,
    created: Date.now(),
  };
}
function saveArchive(record) {
  let all = JSON.parse(localStorage.getItem("knightForgeMatches") || "[]");
  all.unshift(record);
  all = all.slice(0, 30);
  localStorage.setItem("knightForgeMatches", JSON.stringify(all));
  updateSavedCount();
}
function getArchive() {
  try {
    return JSON.parse(localStorage.getItem("knightForgeMatches") || "[]");
  } catch {
    return [];
  }
}
function updateSavedCount() {
  $("saved-count").textContent = getArchive().length;
}
function startClock() {
  if (matchEnded) return;
  running = true;
  paused = false;
  lastTick = Date.now();
  clearInterval(timerId);
  timerId = setInterval(tick, 100);
  renderClocks();
  renderStatus();
}
function stopClock() {
  running = false;
  clearInterval(timerId);
  timerId = null;
  renderClocks();
}
function tick() {
  if (!running || paused || matchEnded) return;
  const now = Date.now();
  const elapsed = (now - lastTick) / 1000;
  lastTick = now;
  clocks[activeColor] -= elapsed;
  if (clocks[activeColor] <= 0) {
    clocks[activeColor] = 0;
    stopClock();
    matchEnded = true;
    const winner = activeColor === "w" ? "Black" : "White";
    finishMatch(
      `${winner} wins on time`,
      `${names[activeColor === "w" ? "b" : "w"]} wins — the opponent ran out of time.`,
      "⏱",
    );
    return;
  }
  renderClocks();
}
function renderClocks() {
  ["w", "b"].forEach((color) => {
    const el = $(color === "w" ? "white-clock" : "black-clock");
    el.textContent = fmt(clocks[color]);
    el.classList.toggle(
      "active",
      running && !paused && activeColor === color && !matchEnded,
    );
    el.classList.toggle("low", clocks[color] <= 30);
  });
}
function renderCoordinates() {
  const files = flipped ? [...FILES].reverse() : FILES;
  const ranks = flipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];
  ["files-top", "files-bottom"].forEach(
    (id) => ($(id).innerHTML = files.map((x) => `<span>${x}</span>`).join("")),
  );
  ["ranks-left", "ranks-right"].forEach(
    (id) => ($(id).innerHTML = ranks.map((x) => `<span>${x}</span>`).join("")),
  );
}
function orderSquares() {
  const ranks = flipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1],
    files = flipped ? [...FILES].reverse() : FILES;
  return ranks.flatMap((r) => files.map((f) => f + r));
}
function kingSquare(color) {
  const b = game.board();
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (b[r][c]?.type === "k" && b[r][c].color === color)
        return FILES[c] + (8 - r);
  return null;
}
function renderBoard() {
  renderCoordinates();
  const map = new Map();
  game.board().forEach((row, r) =>
    row.forEach((p, c) => {
      if (p) map.set(FILES[c] + (8 - r), p);
    }),
  );
  $("chessboard").innerHTML = "";
  const check = game.isCheck() ? kingSquare(game.turn()) : null;
  orderSquares().forEach((sq) => {
    const file = FILES.indexOf(sq[0]),
      rank = +sq[1],
      p = map.get(sq),
      cell = document.createElement("div");
    cell.className = `square ${(file + rank) % 2 === 0 ? "light" : "dark"}`;
    cell.dataset.square = sq;
    cell.setAttribute("role", "gridcell");
    if (selected === sq) cell.classList.add("selected");
    if (lastMove && (lastMove.from === sq || lastMove.to === sq))
      cell.classList.add("last");
    if (check === sq) cell.classList.add("check");
    if (targets.includes(sq)) {
      cell.classList.add("legal");
      if (p) cell.classList.add("has-piece");
    }
    if (p) {
      const span = document.createElement("span");
      span.className = `piece ${p.color === "w" ? "white" : "black"}`;
      span.textContent = PIECES[p.color][p.type];
      span.draggable = true;
      span.addEventListener("dragstart", (e) => {
        if (p.color !== game.turn() || matchEnded || !matchStarted) {
          e.preventDefault();
          return;
        }
        select(sq);
        e.dataTransfer.setData("text/plain", sq);
      });
      cell.appendChild(span);
    }
    cell.addEventListener("click", () => squareClick(sq));
    cell.addEventListener("dragover", (e) => e.preventDefault());
    cell.addEventListener("drop", (e) => {
      e.preventDefault();
      const from = e.dataTransfer.getData("text/plain");
      if (from) tryMove(from, sq);
    });
    $("chessboard").appendChild(cell);
  });
  renderPlayers();
  renderMoves();
  renderClocks();
}
function renderPlayers() {
  $("white-name").textContent = names.w;
  $("black-name").textContent = names.b;
  $("turn-name").textContent = game.turn() === "w" ? names.w : names.b;
  $("turn-icon").textContent = game.turn() === "w" ? "♔" : "♚";
  $("turn-chip").textContent = game.turn() === "w" ? "WHITE" : "BLACK";
  const hist = game.history({ verbose: true });
  $("white-captured").textContent = hist
    .filter((m) => m.color === "w" && m.captured)
    .map((m) => PIECES.b[m.captured])
    .join(" ");
  $("black-captured").textContent = hist
    .filter((m) => m.color === "b" && m.captured)
    .map((m) => PIECES.w[m.captured])
    .join(" ");
  $("white-player-bar").style.opacity =
    matchStarted && activeColor === "w" && !paused && !matchEnded ? "1" : ".88";
  $("black-player-bar").style.opacity =
    matchStarted && activeColor === "b" && !paused && !matchEnded ? "1" : ".88";
}
function renderStatus() {
  let title = matchStarted ? "In progress" : "Match not started",
    detail = matchStarted
      ? "Clock is running. Make your move."
      : "Choose a time control and start a new match.";
  if (paused && matchStarted && !matchEnded) {
    title = "Match paused";
    detail = "Resume by starting a new match or make a move after resuming.";
  }
  if (game.isCheckmate()) {
    title = "Checkmate";
    detail = `${game.turn() === "w" ? names.b : names.w} wins the match.`;
  } else if (game.isStalemate()) {
    title = "Draw by stalemate";
    detail = "No legal moves remain, and the king is not in check.";
  } else if (game.isThreefoldRepetition()) {
    title = "Draw by repetition";
    detail = "The position has repeated three times.";
  } else if (game.isInsufficientMaterial()) {
    title = "Draw — insufficient material";
    detail = "There is not enough material to force checkmate.";
  } else if (game.isDraw()) {
    title = "Draw";
    detail = "The game has ended in a draw.";
  } else if (game.isCheck()) {
    title = "Check!";
    detail = `${game.turn() === "w" ? names.w : names.b}, your king is under attack.`;
  }
  if (matchEnded && !game.isGameOver() && title === "In progress") {
    title = "Time expired";
    detail = "The game ended on time.";
  }
  $("game-status").textContent = title;
  $("status-detail").textContent = detail;
  $("status-dot").style.background = matchEnded
    ? "#d9b979"
    : paused
      ? "#d9b979"
      : "#8bc89a";
  $("panel-title").innerHTML = matchEnded
    ? "Well<br><em>played.</em>"
    : matchStarted
      ? "Stay<br><em>focused.</em>"
      : "Ready<br><em>when you are.</em>";
  $("panel-subtitle").textContent = matchEnded
    ? "A good game is worth remembering."
    : matchStarted
      ? "Keep your eyes on the board and your time."
      : "Set up your match, take your seats, and let the game begin.";
  $("board-hint").textContent = matchEnded
    ? "Match complete · Start a new match to play again"
    : paused && matchStarted
      ? "Match paused · Start a new match for another game"
      : "Select a piece to see legal moves · " +
        (game.turn() === "w" ? names.w : names.b) +
        " to move";
  $("pause-match").textContent = paused ? "▶ Resume" : "Ⅱ Pause";
  $("pause-match").disabled = !matchStarted || matchEnded;
  renderPlayers();
  renderClocks();
}
function select(sq) {
  const p = game.get(sq);
  if (!p || p.color !== game.turn() || matchEnded || !matchStarted || paused)
    return;
  selected = sq;
  targets = game.moves({ square: sq, verbose: true }).map((m) => m.to);
  renderBoard();
}
function squareClick(sq) {
  if (!matchStarted || paused || matchEnded || pendingPromotion) return;
  if (selected && targets.includes(sq)) {
    tryMove(selected, sq);
    return;
  }
  const p = game.get(sq);
  if (p && p.color === game.turn()) {
    select(sq);
    return;
  }
  selected = null;
  targets = [];
  renderBoard();
}
function tryMove(from, to) {
  if (!matchStarted || paused || matchEnded) return;
  const candidates = game
    .moves({ square: from, verbose: true })
    .filter((m) => m.to === to);
  if (!candidates.length) {
    const p = game.get(to);
    if (p && p.color === game.turn()) select(to);
    return;
  }
  if (candidates.some((m) => m.promotion)) {
    openPromotion(from, to, game.turn());
    return;
  }
  makeMove({ from, to });
}
function openPromotion(from, to, color) {
  pendingPromotion = { from, to };
  $("promotion-options").innerHTML = "";
  ["q", "r", "b", "n"].forEach((type) => {
    const b = document.createElement("button");
    b.className = "promotion-choice";
    b.textContent = PIECES[color][type];
    b.addEventListener("click", () => {
      const move = pendingPromotion;
      pendingPromotion = null;
      $("promotion-modal").classList.add("hidden");
      makeMove({ ...move, promotion: type });
    });
    $("promotion-options").appendChild(b);
  });
  $("promotion-modal").classList.remove("hidden");
}
function makeMove(move) {
  try {
    const result = game.move(move);
    if (!result) return;
    lastMove = { from: result.from, to: result.to };
    selected = null;
    targets = [];
    clocks[result.color] =
      Math.max(0, clocks[result.color]) + MODES[mode].increment;
    activeColor = game.turn();
    lastTick = Date.now();
    renderBoard();
    renderStatus();
    if (game.isCheckmate()) {
      stopClock();
      matchEnded = true;
      renderStatus();
      finishMatch(
        "Checkmate",
        `${result.color === "w" ? names.w : names.b} wins by checkmate.`,
        "♛",
      );
    } else if (game.isDraw()) {
      stopClock();
      matchEnded = true;
      renderStatus();
      finishMatch(
        "Game drawn",
        `The match ended by ${game.isStalemate() ? "stalemate" : game.isThreefoldRepetition() ? "threefold repetition" : game.isInsufficientMaterial() ? "insufficient material" : "draw"}.`,
        "½",
      );
    } else if (game.isCheck()) toast("Check!");
  } catch (e) {
    console.error(e);
    toast("That move is not legal.");
  }
}
function renderMoves() {
  const h = game.history();
  $("move-count").textContent =
    `${h.length} ${h.length === 1 ? "move" : "moves"}`;
  if (!h.length) {
    $("move-list").innerHTML =
      '<div class="empty">Your match moves will appear here.</div>';
    return;
  }
  let out = "";
  for (let i = 0; i < h.length; i += 2)
    out += `<div class="move-row"><span class="move-number">${Math.floor(i / 2) + 1}.</span><span class="move-san">${h[i]}</span><span class="move-san">${h[i + 1] || ""}</span></div>`;
  $("move-list").innerHTML = out;
  $("move-list").scrollTop = $("move-list").scrollHeight;
}
function finishMatch(title, copy, symbol) {
  $("game-status").textContent = title;
  $("status-detail").textContent = copy;
  $("result-title").textContent = title;
  $("result-copy").textContent = copy;
  $("result-symbol").textContent = symbol;
  $("result-modal").classList.remove("hidden");
}
function resetMatch(startNow = true) {
  stopClock();
  game.reset();
  selected = null;
  targets = [];
  lastMove = null;
  pendingPromotion = null;
  matchEnded = false;
  paused = !startNow;
  matchStarted = true;
  clocks = { w: MODES[mode].base, b: MODES[mode].base };
  activeColor = "w";
  initialSnapshot = { names: { ...names }, mode, clocks: { ...clocks } };
  $("promotion-modal").classList.add("hidden");
  $("result-modal").classList.add("hidden");
  renderBoard();
  renderStatus();
  if (startNow) startClock();
}
function openSetup() {
  $("input-white").value = names.w;
  $("input-black").value = names.b;
  document.querySelector(`input[name="setup-mode"][value="${mode}"]`).checked =
    true;
  $("setup-modal").classList.remove("hidden");
}
function replayFrom(record) {
  replayData = record;
  replayIndex = 0;
  replayGame = new Chess();
  $("replay-label").textContent =
    `${record.names.w} vs ${record.names.b} · ${MODES[record.mode]?.label || "Chess"}`;
  $("replay-range").max = record.moves.length;
  $("replay-range").value = 0;
  $("replay-modal").classList.remove("hidden");
  drawReplay();
}
function drawReplay() {
  if (!replayData) return;
  replayGame = new Chess();
  for (let i = 0; i < replayIndex; i++) replayGame.move(replayData.moves[i]);
  const board = replayGame.board(),
    map = new Map();
  board.forEach((row, r) =>
    row.forEach((p, c) => {
      if (p) map.set(FILES[c] + (8 - r), p);
    }),
  );
  $("chessboard").innerHTML = "";
  const ranks = flipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1],
    files = flipped ? [...FILES].reverse() : FILES;
  ranks
    .flatMap((r) => files.map((f) => f + r))
    .forEach((sq) => {
      const f = FILES.indexOf(sq[0]),
        rank = +sq[1],
        p = map.get(sq),
        cell = document.createElement("div");
      cell.className = `square ${(f + rank) % 2 === 0 ? "light" : "dark"}`;
      if (
        replayIndex &&
        replayData.moves[replayIndex - 1] &&
        (replayData.moves[replayIndex - 1].from === sq ||
          replayData.moves[replayIndex - 1].to === sq)
      )
        cell.classList.add("last");
      if (p) {
        const span = document.createElement("span");
        span.className = `piece ${p.color === "w" ? "white" : "black"}`;
        span.textContent = PIECES[p.color][p.type];
        cell.appendChild(span);
      }
      $("chessboard").appendChild(cell);
    });
  renderCoordinates();
  $("replay-step").textContent =
    replayIndex === 0
      ? "Starting position"
      : `Move ${replayIndex} of ${replayData.moves.length}`;
  $("replay-range").value = replayIndex;
  $("board-hint").textContent =
    `Replay mode · ${replayIndex === 0 ? "Starting position" : `After move ${replayIndex}`}`;
}
function openSaved() {
  const list = $("saved-list"),
    all = getArchive();
  list.innerHTML = "";
  if (!all.length) {
    list.innerHTML =
      '<div class="saved-empty">No saved matches yet. Save a completed or ongoing game to keep it here.</div>';
  }
  all.forEach((m, i) => {
    const item = document.createElement("div");
    item.className = "saved-item";
    const info = document.createElement("div");
    info.className = "saved-info";
    const strong = document.createElement("strong");
    strong.textContent = `${m.names.w} vs ${m.names.b}`;
    const small = document.createElement("small");
    small.textContent = `${MODES[m.mode]?.label || "Chess"} · ${m.moves.length} half-moves · ${new Date(m.created).toLocaleString()}`;
    info.append(strong, small);
    const replay = document.createElement("button");
    replay.textContent = "REPLAY";
    replay.addEventListener("click", () => {
      $("saved-modal").classList.add("hidden");
      replayFrom(m);
    });
    const del = document.createElement("button");
    del.textContent = "DELETE";
    del.addEventListener("click", () => {
      const a = getArchive();
      a.splice(i, 1);
      localStorage.setItem("knightForgeMatches", JSON.stringify(a));
      openSaved();
      updateSavedCount();
    });
    item.append(info, replay, del);
    list.appendChild(item);
  });
  $("saved-modal").classList.remove("hidden");
}
function restoreLiveBoard() {
  renderBoard();
  renderStatus();
}
$("start-match").addEventListener("click", () => {
  names.w = $("input-white").value.trim() || "Player 1";
  names.b = $("input-black").value.trim() || "Player 2";
  mode = document.querySelector('input[name="setup-mode"]:checked').value;
  document
    .querySelectorAll(".preset")
    .forEach((b) => b.classList.toggle("active", b.dataset.mode === mode));
  $("mode-caption").textContent = mode.toUpperCase();
  $("setup-modal").classList.add("hidden");
  resetMatch(true);
  toast(`${MODES[mode].label} match started`);
});
$("setup-close").addEventListener("click", () => {
  $("setup-modal").classList.add("hidden");
  if (!matchStarted) resetMatch(false);
});
$("new-match").addEventListener("click", () => openSetup());
$("pause-match").addEventListener("click", () => {
  if (!matchStarted || matchEnded) return;
  if (paused) {
    startClock();
    toast("Clock resumed");
  } else {
    paused = true;
    stopClock();
    renderStatus();
    toast("Match paused");
  }
});
$("undo-move").addEventListener("click", () => {
  if (!matchStarted || matchEnded || paused) {
    toast("Undo is available during a live match.");
    return;
  }
  if (!game.undo()) {
    toast("No moves to undo.");
    return;
  }
  const hist = game.history({ verbose: true });
  lastMove = hist.length
    ? { from: hist[hist.length - 1].from, to: hist[hist.length - 1].to }
    : null;
  activeColor = game.turn();
  selected = null;
  targets = [];
  lastTick = Date.now();
  renderBoard();
  renderStatus();
  toast("Last move undone");
});
$("flip-board").addEventListener("click", () => {
  flipped = !flipped;
  if ($("replay-modal").classList.contains("hidden")) renderBoard();
  else drawReplay();
});
$("save-match").addEventListener("click", () => {
  if (!matchStarted) {
    toast("Start a match before saving.");
    return;
  }
  saveArchive(snapshot());
  toast("Match saved on this device");
});
$("replay-open").addEventListener("click", () => {
  if (!matchStarted) {
    toast("Start a match before replaying.");
    return;
  }
  const record = snapshot();
  stopClock();
  paused = true;
  replayFrom(record);
});
$("replay-close").addEventListener("click", () => {
  $("replay-modal").classList.add("hidden");
  restoreLiveBoard();
  if (!matchEnded && matchStarted) {
    paused = false;
    startClock();
  }
});
$("replay-done").addEventListener("click", () => $("replay-close").click());
$("replay-start").addEventListener("click", () => {
  replayIndex = 0;
  drawReplay();
});
$("replay-end").addEventListener("click", () => {
  replayIndex = replayData.moves.length;
  drawReplay();
});
$("replay-prev").addEventListener("click", () => {
  replayIndex = Math.max(0, replayIndex - 1);
  drawReplay();
});
$("replay-next").addEventListener("click", () => {
  replayIndex = Math.min(replayData.moves.length, replayIndex + 1);
  drawReplay();
});
$("replay-range").addEventListener("input", (e) => {
  replayIndex = +e.target.value;
  drawReplay();
});
$("saved-open").addEventListener("click", openSaved);
$("saved-close").addEventListener("click", () =>
  $("saved-modal").classList.add("hidden"),
);
$("rematch").addEventListener("click", () => {
  $("result-modal").classList.add("hidden");
  openSetup();
});
$("result-replay").addEventListener("click", () => {
  $("result-modal").classList.add("hidden");
  const rec = snapshot();
  replayFrom(rec);
});
document.querySelectorAll(".preset").forEach((btn) =>
  btn.addEventListener("click", () => {
    if (matchStarted && !matchEnded) {
      toast("Choose a time control when starting a new match.");
      return;
    }
    mode = btn.dataset.mode;
    document
      .querySelectorAll(".preset")
      .forEach((b) => b.classList.toggle("active", b === btn));
    $("mode-caption").textContent = mode.toUpperCase();
    clocks = { w: MODES[mode].base, b: MODES[mode].base };
    renderClocks();
  }),
);
window.addEventListener("beforeunload", () => stopClock());
updateSavedCount();
mode = "blitz";
clocks = { w: 300, b: 300 };
renderBoard();
renderStatus();
openSetup();
