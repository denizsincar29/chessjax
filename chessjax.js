// chessjax — доступный рендер шахматных позиций и партий для скринридеров.
//
// Использование (имя кастомного элемента обязано содержать дефис):
//   <chessjax-board id="carlsen" pgn="Carlsen.pgn" move="25"></chessjax-board>
//   <chessjax-board fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"></chessjax-board>
//   <button chess="carlsen" move="29">29-й ход</button> — переключение доски из текста.
//
// Подключение самодостаточное: <script type="module" src="chessjax.js"></script>.
// Движок ходов (применение SAN к позиции) — вендоренная копия chess.js 0.13.4
// (vendor/chess.js); страница может подставить свой движок как globalThis.Chess.

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

// Язык по умолчанию — модульная переменная, а не поле chessjax: компонент
// может апгрейдиться при customElements.define раньше инициализации экспортов.
let defaultLanguage = "ru";
const FILES = "abcdefgh";
const RANKS = "87654321";

// --- i18n -----------------------------------------------------------------

const I18N = {
  ru: {
    board: "Шахматная доска",
    col: "колонка",
    row: "ряд",
    pieces: { k: "король", q: "ферзь", r: "ладья", b: "слон", n: "конь", p: "пешка" },
    gender: { k: "m", q: "f", r: "f", b: "m", n: "m", p: "f" },
    color: { m: { w: "белый", b: "чёрный" }, f: { w: "белая", b: "чёрная" } },
    white: "Белые",
    black: "Чёрные",
    none: "нет фигур",
    turn: (c) => (c === "w" ? "Ход белых" : "Ход чёрных"),
    start: "Начальная позиция",
    move: "Ход",
    prev: "Предыдущий ход",
    next: "Следующий ход",
    play: "Показать ходы по порядку",
    stop: "Остановить показ ходов",
    restart: "В начало",
    by: { w: "Белые", b: "Чёрные" },
    takes: "бьёт",
    castleShort: "короткая рокировка",
    castleLong: "длинная рокировка",
    check: "шах",
    checkmate: "мат",
    promotes: "превращение в",
    empty: "пустое поле",
    langName: "Русский",
  },
  en: {
    board: "Chessboard",
    col: "file",
    row: "rank",
    pieces: { k: "king", q: "queen", r: "rook", b: "bishop", n: "knight", p: "pawn" },
    gender: { k: "m", q: "f", r: "f", b: "m", n: "m", p: "f" },
    color: { m: { w: "white", b: "black" }, f: { w: "white", b: "black" } },
    white: "White",
    black: "Black",
    none: "no pieces",
    turn: (c) => (c === "w" ? "White to move" : "Black to move"),
    start: "Starting position",
    move: "Move",
    prev: "Previous move",
    next: "Next move",
    play: "Play through moves",
    stop: "Stop playing moves",
    restart: "Back to start",
    by: { w: "White", b: "Black" },
    takes: "takes",
    castleShort: "short castling",
    castleLong: "long castling",
    check: "check",
    checkmate: "checkmate",
    promotes: "promotes to",
    empty: "empty square",
    langName: "English",
  },
  de: {
    board: "Schachbrett",
    col: "Linie",
    row: "Reihe",
    pieces: { k: "König", q: "Dame", r: "Turm", b: "Läufer", n: "Springer", p: "Bauer" },
    gender: { k: "m", q: "f", r: "m", b: "m", n: "m", p: "m" },
    color: { m: { w: "weißer", b: "schwarzer" }, f: { w: "weiße", b: "schwarze" } },
    white: "Weiß",
    black: "Schwarz",
    none: "keine Figuren",
    turn: (c) => (c === "w" ? "Weiß am Zug" : "Schwarz am Zug"),
    start: "Anfangsposition",
    move: "Zug",
    prev: "Vorheriger Zug",
    next: "Nächster Zug",
    play: "Züge nacheinander",
    stop: "Anzeige stoppen",
    restart: "Zum Anfang",
    by: { w: "Weiß", b: "Schwarz" },
    takes: "schlägt",
    castleShort: "kurze Rochade",
    castleLong: "lange Rochade",
    check: "Schach",
    checkmate: "Schachmatt",
    promotes: "Umwandlung in",
    empty: "leeres Feld",
    langName: "Deutsch",
  },
  tr: {
    board: "Satranç tahtası",
    col: "sütun",
    row: "sıra",
    pieces: { k: "şah", q: "vezir", r: "kale", b: "fil", n: "at", p: "piyon" },
    gender: { k: "m", q: "f", r: "f", b: "m", n: "m", p: "m" },
    color: { m: { w: "beyaz", b: "siyah" }, f: { w: "beyaz", b: "siyah" } },
    white: "Beyaz",
    black: "Siyah",
    none: "taş yok",
    turn: (c) => (c === "w" ? "Beyaz oynar" : "Siyah oynar"),
    start: "Başlangıç konumu",
    move: "Hamle",
    prev: "Önceki hamle",
    next: "Sonraki hamle",
    play: "Hamleleri sırayla göster",
    stop: "Gösterimi durdur",
    restart: "Başa dön",
    by: { w: "Beyaz", b: "Siyah" },
    takes: "alır",
    castleShort: "kısa rok",
    castleLong: "uzun rok",
    check: "şah",
    checkmate: "mat",
    promotes: "terfi",
    empty: "boş kare",
    langName: "Türkçe",
  },
};

function pieceLabel(piece, lang) {
  const t = I18N[lang] || I18N.ru;
  return t.color[t.gender[piece.piece]][piece.color] + " " + t.pieces[piece.piece];
}

// --- FEN ------------------------------------------------------------------

export function parseFen(fen) {
  if (typeof fen !== "string") throw new Error("chessjax: FEN должен быть строкой");
  const parts = fen.trim().split(/\s+/);
  if (parts.length < 2 || parts.length > 6) throw new Error("chessjax: неверное число полей FEN");
  const [placement, sideToMove, castling = "-", ep = "-", halfmove = "0", fullmove = "1"] = parts;
  if (sideToMove !== "w" && sideToMove !== "b") throw new Error("chessjax: неверный ход в FEN");

  const board = new Map();
  const ranks = placement.split("/");
  if (ranks.length !== 8) throw new Error("chessjax: в FEN должно быть 8 рядов");
  for (let r = 0; r < 8; r++) {
    let file = 0;
    for (const ch of ranks[r]) {
      if (file >= 8) throw new Error("chessjax: ряд длиннее 8 полей");
      if (ch >= "1" && ch <= "8") { file += Number(ch); continue; }
      const low = ch.toLowerCase();
      if (!I18N.ru.pieces[low]) throw new Error("chessjax: неизвестная фигура «" + ch + "»");
      board.set(FILES[file] + RANKS[r], { color: ch === low ? "b" : "w", piece: low });
      file += 1;
    }
    if (file !== 8) throw new Error("chessjax: ряд короче 8 полей");
  }
  return { board, sideToMove, castling, ep, halfmove: Number(halfmove) || 0, fullmove: Number(fullmove) || 1 };
}

export function fenSummary(parsed, lang = "ru") {
  const t = I18N[lang] || I18N.ru;
  const groups = { w: {}, b: {} };
  for (const [square, piece] of parsed.board) {
    (groups[piece.color][piece.piece] ||= []).push(square);
  }
  const order = ["k", "q", "r", "b", "n", "p"];
  const label = (lists) =>
    order
      .map((type) => (lists[type] ? pluralize(t.pieces[type], lists[type].length, lang) + " " + lists[type].join(" ") : null))
      .filter(Boolean)
      .join(", ");
  return (
    t.white + ": " + (label(groups.w) || t.none) + ". " +
    t.black + ": " + (label(groups.b) || t.none) + ". " +
    t.turn(parsed.sideToMove) + "."
  );
}

function pluralize(noun, n, lang) {
  if (lang !== "ru") return noun;
  if (noun === "пешка") return n === 1 ? "пешка" : "пешки";
  if (noun === "конь") return n === 1 ? "конь" : "кони";
  if (noun === "слон") return n === 1 ? "слон" : "слоны";
  if (noun === "ладья") return n === 1 ? "ладья" : "ладьи";
  return noun;
}

// --- Движок ходов (chess.js) ------------------------------------------------
// Сначала host-движок из globalThis.Chess (если встроен страницей), иначе —
// вендоренная копия chess.js 0.13.4 (vendor/chess.js). Локальный вендор делает
// библиотеку самодостаточной: ни CDN, ни внешних зависимостей при подключении.

let enginePromise = null;
function engine() {
  if (globalThis.Chess) return Promise.resolve(globalThis.Chess);
  if (!enginePromise) {
    enginePromise = import("./vendor/chess.js").then((m) => {
      globalThis.Chess = m.Chess;
      return m.Chess;
    });
  }
  return enginePromise;
}

// --- PGN -------------------------------------------------------------------

// Разбирает ходы PGN (SAN) без вариантов/комментариев; возвращает массив SAN.
// Понимает и «17. Rd8#», и слитное «17.Rd8#».
export function parsePgnMoves(pgn) {
  const noComments = pgn
    .replace(/\[[^\]]*\]/g, " ") // теги [Event "…"]
    .replace(/\{[^}]*\}/g, " ") // комментарии {…}
    .replace(/\([^)]*\)/g, " "); // варианты (…)
  const tokens = noComments.split(/[\s;]+/).filter(Boolean);
  const san = [];
  for (let token of tokens) {
    if (/^(\d+)\.\.\.$/.test(token)) continue;
    if (/^(\d+)\.(.+)$/.test(token)) token = token.replace(/^(\d+)\./, ""); // «17.Rd8#»
    else if (/^\d+\.$/.test(token)) continue;
    if (/^[01]-[01]$/.test(token) || token === "1/2-1/2" || token === "*") continue;
    if (token.includes(".")) continue;
    san.push(token);
  }
  return san;
}

// Применяет ходы SAN к стартовой позиции. Возвращает массив {fen, move}:
// позиция после каждого полухода; элемент 0 — начальная позиция.
export async function applyPgn(sanMoves, startFen = START_FEN) {
  const Chess = await engine();
  const chess = new Chess(startFen);
  const positions = [{ fen: chess.fen(), move: null }];
  for (const san of sanMoves) {
    const move = chess.move(san);
    if (!move) break;
    positions.push({ fen: chess.fen(), move });
  }
  return positions;
}

// Позиция после moveSpec: "25" — после 25-го хода белых, "25.5" — после ответа чёрных.
export function positionIndex(moveSpec) {
  if (moveSpec === "0" || moveSpec === "start") return 0;
  const m = /^(\d+)(?:\.(\d+))?$/.exec(String(moveSpec).trim());
  if (!m) return 0;
  const base = Number(m[1]);
  return base >= 1 ? base * 2 - 1 + (Number(m[2]) >= 5 ? 1 : 0) : 0;
}

// --- Рендер таблицы и резюме -------------------------------------------------

export function renderBoard(container, fen, opts = {}) {
  const lang = opts.language || "ru";
  const parsed = parseFen(fen);
  container.replaceChildren(renderTable(parsed, lang), renderSummary(parsed, lang));
}

function renderTable(parsed, lang) {
  const t = I18N[lang] || I18N.ru;
  const table = document.createElement("table");
  table.className = "chessjax-board";
  table.setAttribute("aria-label", t.board);

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  const corner = document.createElement("th");
  corner.setAttribute("aria-hidden", "true");
  headRow.appendChild(corner);
  for (const f of FILES) {
    const th = document.createElement("th");
    th.scope = "col";
    th.textContent = f;
    th.setAttribute("aria-label", t.col + " " + f);
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  for (let r = 0; r < 8; r++) {
    const rank = RANKS[r];
    const tr = document.createElement("tr");
    const th = document.createElement("th");
    th.scope = "row";
    th.textContent = rank;
    th.setAttribute("aria-label", t.row + " " + rank);
    tr.appendChild(th);

    for (let f = 0; f < 8; f++) {
      const file = FILES[f];
      const square = file + rank;
      const td = document.createElement("td");
      td.className = (f + r) % 2 === 0 ? "square-dark" : "square-light";
      const piece = parsed.board.get(square);
      if (piece) {
        td.classList.add("has-piece", "piece-" + piece.color);
        td.textContent = GLYPH[piece.color === "w" ? piece.piece.toUpperCase() : piece.piece];
        td.setAttribute("aria-label", square + ", " + pieceLabel(piece, lang));
      } else {
        td.textContent = " ";
        td.setAttribute("aria-label", square + ", " + t.empty);
      }
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  return table;
}

function renderSummary(parsed, lang) {
  const p = document.createElement("p");
  p.className = "chessjax-summary";
  p.textContent = fenSummary(parsed, lang);
  return p;
}

const GLYPH = {
  K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
  k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟",
};

// --- Озвучка хода -----------------------------------------------------------

function moveSpeech(move, lang) {
  const t = I18N[lang] || I18N.ru;
  if (move.flags.includes("k")) return t.castleShort;
  if (move.flags.includes("q")) return t.castleLong;
  let s = move.from + "-" + move.to;
  if (move.captured) s = move.from + " " + t.takes + " " + move.to;
  if (move.promotion) s += ", " + t.promotes + " " + t.pieces[move.promotion];
  if (move.san.includes("#")) s += ", " + t.checkmate;
  else if (move.san.includes("+")) s += ", " + t.check;
  return s;
}

function speak(el, text) {
  el.textContent = "";
  setTimeout(() => { el.textContent = text; }, 60);
}

// --- Веб-компонент <chessjax-board> ------------------------------------------

const registeredBoards = new Set();

// В node (тесты) HTMLElement нет — компонент объявляем только в браузере.
if (typeof HTMLElement !== "undefined") {
class ChessboardElement extends HTMLElement {
  static observedAttributes = ["fen", "pgn", "move", "lang", "controls"];

  constructor() {
    super();
    this._positions = null;
    this._idx = 0;
    this._timer = null;
    this._root = this.attachShadow ? null : this; // Shadow DOM отключён: таблица должна оставаться в светлом DOM для скринридеров.
  }

  get lang() {
    return this.getAttribute("lang") || defaultLanguage;
  }

  connectedCallback() {
    if (!this._root) this._root = this;
    registeredBoards.add(this);
    this._renderShell();
    this._load();
  }

  disconnectedCallback() {
    registeredBoards.delete(this);
    if (this._timer) clearInterval(this._timer);
  }

  attributeChangedCallback(name, _old, value) {
    if (!this.isConnected) return;
    if (name === "lang") { this._load(); return; }
    this._load();
  }

  _renderShell() {
    const lang = this.lang;
    const t = I18N[lang] || I18N.ru;
    this.replaceChildren();

    const wrap = document.createElement("div");
    wrap.className = "chessjax";

    this._tableWrap = document.createElement("div");
    this._tableWrap.className = "chessjax-board-wrap";
    wrap.appendChild(this._tableWrap);

    this._summary = document.createElement("p");
    this._summary.className = "chessjax-summary";
    wrap.appendChild(this._summary);

    const controls = document.createElement("div");
    controls.className = "chessjax-controls";
    controls.setAttribute("role", "group");
    controls.setAttribute("aria-label", t.board);
    this._btnRestart = mkButton(t.restart, "⏮", () => this.goTo("start"));
    this._btnPrev = mkButton(t.prev, "←", () => this.prev());
    this._btnPlay = mkButton(t.play, "▶", () => this.togglePlay());
    this._btnNext = mkButton(t.next, "→", () => this.next());
    controls.append(this._btnRestart, this._btnPrev, this._btnPlay, this._btnNext);
    wrap.appendChild(controls);

    this._live = document.createElement("p");
    this._live.className = "chessjax-live";
    this._live.setAttribute("aria-live", "assertive");
    wrap.appendChild(this._live);

    this.appendChild(wrap);
  }

  async _load() {
    const lang = this.lang;
    const controlsHidden = this.getAttribute("controls") === "none";
    const controls = this.querySelector(".chessjax-controls");
    if (controls) controls.hidden = controlsHidden;

    const pgnSrc = this.getAttribute("pgn") || this.getAttribute("pgn-src");
    if (pgnSrc) {
      try {
        const res = await fetch(pgnSrc);
        if (!res.ok) throw new Error("HTTP " + res.status);
        const pgn = await res.text();
        this._positions = await applyPgn(parsePgnMoves(pgn));
      } catch (e) {
        this._positions = null;
        this._renderError("PGN: " + e.message);
        return;
      }
    } else if (this.hasAttribute("fen")) {
      try {
        parseFen(this.getAttribute("fen")); // быстрая валидация со своими ошибками
        const Chess = await engine();
        const chess = new Chess(this.getAttribute("fen"));
        this._positions = [{ fen: chess.fen(), move: null }];
      } catch (e) {
        this._positions = null;
        this._renderError("FEN: " + e.message);
        return;
      }
    } else {
      this._positions = [{ fen: START_FEN, move: null }];
    }

    this._idx = 0;
    const moveSpec = this.getAttribute("move");
    if (moveSpec && this._positions.length > 1) this.goTo(moveSpec, { silent: true });
    else this._show();
  }

  _renderError(msg) {
    const lang = this.lang;
    this._tableWrap.replaceChildren();
    const p = document.createElement("p");
    p.className = "chessjax-error";
    p.textContent = msg;
    this._tableWrap.appendChild(p);
    if (this._summary) this._summary.textContent = "";
    if (this._live) speak(this._live, msg);
  }

  _show({ announce = false } = {}) {
    const lang = this.lang;
    if (!this._positions) return;
    const pos = this._positions[Math.min(this._idx, this._positions.length - 1)];
    const parsed = parseFen(pos.fen);
    this._tableWrap.replaceChildren(renderTable(parsed, lang));
    this._summary.textContent = fenSummary(parsed, lang);
    this._updateButtons();
    if (announce) {
      if (this._idx === 0) speak(this._live, I18N[lang].start);
      else {
        const color = this._positions[this._idx].move.color;
        const text = I18N[lang].move + " " + Math.ceil(this._idx / 2) + ": " +
          I18N[lang].by[color] + " — " + moveSpeech(this._positions[this._idx].move, lang);
        speak(this._live, text);
      }
    }
  }

  _updateButtons() {
    if (!this._positions) return;
    this._btnPrev.disabled = this._idx <= 0;
    this._btnNext.disabled = this._idx >= this._positions.length - 1;
    this._btnRestart.disabled = this._idx === 0;
  }

  // Публичное API: вызывается и кнопками навигации, и внешними кнопками текста.

  goTo(moveSpec, opts = {}) {
    const target = positionIndex(moveSpec);
    if (this._positions) this._idx = Math.min(target, this._positions.length - 1);
    this._show({ announce: opts.silent ? false : true });
  }

  next() {
    if (this._positions && this._idx < this._positions.length - 1) {
      this._idx += 1;
      this._show({ announce: true });
    }
  }

  prev() {
    if (this._positions && this._idx > 0) {
      this._idx -= 1;
      this._show({ announce: true });
    }
  }

  togglePlay() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
      this._btnPlay.textContent = "▶";
      this._btnPlay.setAttribute("aria-label", I18N[this.lang].play);
      return;
    }
    if (this._idx >= this._positions.length - 1) this._idx = 0;
    const step = () => {
      if (this._idx >= this._positions.length - 1) {
        this.togglePlay();
        return;
      }
      this.next();
    };
    this._timer = setInterval(step, 2500);
    this._btnPlay.textContent = "⏸";
    this._btnPlay.setAttribute("aria-label", I18N[this.lang].stop);
  }
}

if (typeof customElements !== "undefined") {
  customElements.define("chessjax-board", ChessboardElement);
}

}  // guard: HTMLElement

function mkButton(label, glyph, onClick) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "chessjax-btn";
  b.textContent = glyph;
  b.setAttribute("aria-label", label);
  b.addEventListener("click", onClick);
  return b;
}

// --- Кнопки-ходы в тексте: <button chess="id" move="N"> ----------------------
// Один делегат на документ: клик по такой кнопке переключает доску с этим id.

function wireStoryButtons() {
  document.addEventListener("click", (event) => {
    const btn = event.target.closest("button[chess][move]");
    if (!btn) return;
    const board = document.getElementById(btn.getAttribute("chess"));
    if (board && typeof board.goTo === "function") {
      board.goTo(btn.getAttribute("move"));
    }
  });
}
if (typeof document !== "undefined") wireStoryButtons();

// --- Публичный API ------------------------------------------------------------

export const chessjax = {
  settings: { language: "ru" },

  setLanguage(lang) {
    this.settings.language = lang;
    defaultLanguage = lang;
    for (const board of registeredBoards) board._load();
  },

  languages() {
    return Object.entries(I18N).map(([code, t]) => ({ code, name: t.langName }));
  },

  renderBoard,
  parseFen,
  fenSummary,
  parsePgnMoves,
  applyPgn,
  positionIndex,
};

export default chessjax;
