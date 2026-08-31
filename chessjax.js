// chessjax — доступный рендер шахматных позиций для скринридеров.
// Вход: FEN. Выход: семантическая HTML-таблица 8×8 + текстовое резюме позиции.

const FILES = "abcdefgh";
const RANKS = "87654321";

const PIECE_NAME = {
  k: "король",
  q: "ферзь",
  r: "ладья",
  b: "слон",
  n: "конь",
  p: "пешка",
};

// Род фигуры нужен для согласования цвета: «чёрный король», но «чёрная ладья».
const GENDER = { k: "m", q: "f", r: "f", b: "m", n: "m", p: "f" };
const COLOR_WORD = { m: { w: "белый", b: "чёрный" }, f: { w: "белая", b: "чёрная" } };

function pieceLabel(color, piece) {
  return COLOR_WORD[GENDER[piece]][color] + " " + PIECE_NAME[piece];
}

const GLYPH = {
  K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
  k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟",
};

export function parseFen(fen) {
  if (typeof fen !== "string") throw new Error("chessjax: FEN должен быть строкой");
  const parts = fen.trim().split(/\s+/);
  if (parts.length < 2 || parts.length > 6) {
    throw new Error("chessjax: неверное число полей FEN");
  }
  const [placement, sideToMove, castling = "-", ep = "-", halfmove = "0", fullmove = "1"] = parts;

  if (sideToMove !== "w" && sideToMove !== "b") {
    throw new Error("chessjax: неверный ход в FEN — ожидалось w или b");
  }

  const board = new Map();
  const ranks = placement.split("/");
  if (ranks.length !== 8) {
    throw new Error("chessjax: в FEN должно быть 8 рядов");
  }

  for (let r = 0; r < 8; r++) {
    let file = 0;
    for (const ch of ranks[r]) {
      if (file >= 8) throw new Error("chessjax: ряд длиннее 8 полей");
      if (ch >= "1" && ch <= "8") {
        file += Number(ch);
        continue;
      }
      const low = ch.toLowerCase();
      if (!PIECE_NAME[low]) throw new Error("chessjax: неизвестная фигура «" + ch + "»");
      const square = FILES[file] + RANKS[r];
      board.set(square, { color: ch === low ? "b" : "w", piece: low });
      file += 1;
    }
    if (file !== 8) throw new Error("chessjax: ряд короче 8 полей");
  }

  return {
    board,
    sideToMove,
    castling,
    ep,
    halfmove: Number(halfmove) || 0,
    fullmove: Number(fullmove) || 1,
  };
}

export function fenSummary(parsed) {
  const groups = { w: { k: [], q: [], r: [], b: [], n: [], p: [] }, b: { k: [], q: [], r: [], b: [], n: [], p: [] } };
  for (const [square, piece] of parsed.board) {
    groups[piece.color][piece.piece].push(square);
  }
  const order = ["k", "q", "r", "b", "n", "p"];
  const label = (color, lists) =>
    order
      .map((type) => {
        const squares = lists[type];
        return squares.length === 0 ? null : pluralize(PIECE_NAME[type], squares.length) + " " + squares.join(" ");
      })
      .filter(Boolean)
      .join(", ");
  return "Белые: " + (label("w", groups.w) || "нет фигур") + ". Чёрные: " + (label("b", groups.b) || "нет фигур") + ".";
}

function pluralize(noun, n) {
  if (noun === "пешка") return n === 1 ? "пешка" : "пешки";
  if (noun === "конь") return n === 1 ? "конь" : "кони";
  return noun;
}

export function renderBoard(container, fen) {
  const parsed = parseFen(fen);
  container.replaceChildren(renderTable(parsed), renderSummary(parsed));
}

function renderTable(parsed) {
  const table = document.createElement("table");
  table.className = "chessjax-board";
  table.setAttribute("aria-label", "Шахматная доска");

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  const corner = document.createElement("th");
  corner.setAttribute("aria-hidden", "true");
  headRow.appendChild(corner);
  for (const f of FILES) {
    const th = document.createElement("th");
    th.scope = "col";
    th.textContent = f;
    th.setAttribute("aria-label", "колонка " + f);
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
    th.setAttribute("aria-label", "ряд " + rank);
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
        td.setAttribute("aria-label", square + ", " + pieceLabel(piece.color, piece.piece));
      } else {
        td.textContent = " ";
        td.setAttribute("aria-label", square);
      }
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  return table;
}

function renderSummary(parsed) {
  const p = document.createElement("p");
  p.className = "chessjax-summary";
  p.textContent = fenSummary(parsed) + " Ход " + (parsed.sideToMove === "w" ? "белых" : "чёрных") + ".";
  return p;
}
