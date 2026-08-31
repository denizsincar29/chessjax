import { parseFen, fenSummary } from "./chessjax.js";

let failed = 0;
function check(name, cond, detail = "") {
  if (cond) console.log("ok   " + name);
  else { failed++; console.log("FAIL " + name + " " + detail); }
}

const start = parseFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
check("start: 32 фигуры", start.board.size === 32, "got " + start.board.size);
check("start: a1 белая ладья", JSON.stringify(start.board.get("a1")) === JSON.stringify({ color: "w", piece: "r" }));
check("start: e8 чёрный король", JSON.stringify(start.board.get("e8")) === JSON.stringify({ color: "b", piece: "k" }));
check("start: e4 пусто", start.board.get("e4") === undefined);
check("start: ход белых", start.sideToMove === "w");
check("start: fullmove 1", start.fullmove === 1);

const e4 = parseFen("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1");
check("e4: белая пешка e4", JSON.stringify(e4.board.get("e4")) === JSON.stringify({ color: "w", piece: "p" }));
check("e4: e2 пусто", e4.board.get("e2") === undefined);
check("e4: ход чёрных", e4.sideToMove === "b");
check("e4: ep e3", e4.ep === "e3");

const summary = fenSummary(start);
check("summary: белые перечислены", summary.includes("Белые: король e1, ферзь d1"), summary);
check("summary: чёрные перечислены", summary.includes("Чёрные: король e8, ферзь d8"), summary);

const bad = [
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR",       // нет хода
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP w KQkq - 0 1",    // 7 рядов
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNRR w KQkq - 0 1", // ряд длиннее 8
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR x KQkq - 0 1",  // плохой ход
];
for (const fen of bad) {
  try { parseFen(fen); check("bad FEN rejected: " + fen, false, "не выбросил"); }
  catch (e) { check("bad FEN rejected: " + fen.slice(0, 20) + "…", true); }
}

console.log(failed === 0 ? "\nВсе проверки прошли." : "\nПровалов: " + failed);
process.exit(failed === 0 ? 0 : 1);
