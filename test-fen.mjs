import { readFileSync } from "node:fs";
import { parseFen, fenSummary, parsePgnMoves, positionIndex, applyPgn, applyPgnFull, splitComment } from "./chessjax.js";

// Движок ходов для applyPgn берём тот же, что и в браузере — вендоренную
// копию vendor/chess.js (engine() грузит её, если globalThis.Chess не задан).
globalThis.Chess = null;

let failed = 0;
function check(name, cond, detail = "") {
  if (cond) console.log("ok   " + name);
  else { failed++; console.log("FAIL " + name + " " + detail); }
}

const start = parseFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
check("start: 32 фигуры", start.board.size === 32, "got " + start.board.size);
check("start: a1 белая ладья", JSON.stringify(start.board.get("a1")) === JSON.stringify({ color: "w", piece: "r" }));
check("start: e8 чёрный король", JSON.stringify(start.board.get("e8")) === JSON.stringify({ color: "b", piece: "k" }));
check("start: ход белых", start.sideToMove === "w");

const summary = fenSummary(start);
check("summary ru: белые перечислены", summary.includes("Белые: король e1, ферзь d1"), summary);
check("summary en: white king e1", fenSummary(start, "en").includes("White: king e1, queen d1"));

const bad = [
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR",
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP w KQkq - 0 1",
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNRR w KQkq - 0 1",
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR x KQkq - 0 1",
];
for (const fen of bad) {
  try { parseFen(fen); check("bad FEN rejected: " + fen, false, "не выбросил"); }
  catch (e) { check("bad FEN rejected", true); }
}

// PGN
const morphyPgn = readFileSync(new URL("./examples/morphy.pgn", import.meta.url), "utf8");
const san = parsePgnMoves(morphyPgn);
check("morphy: 33 полухода", san.length === 33, "got " + san.length);
check("morphy: первый ход e4", san[0] === "e4", san[0]);
check("morphy: слитный номер «17.Rd8#» распознан", san[32] === "Rd8#", san[32]);

check("positionIndex 0 = старт", positionIndex("0") === 0);
check("positionIndex 1 = после 1.e4", positionIndex("1") === 1);
check("positionIndex 1.5 = после ответа чёрных", positionIndex("1.5") === 2);
check("positionIndex 17 = 33-й полуход", positionIndex("17") === 33);
check("positionIndex garbage = 0", positionIndex("abc") === 0);

const positions = await applyPgn(san);
check("applyPgn: 34 позиции (старт + 33 хода)", positions.length === 34, "got " + positions.length);
check("applyPgn: мат в конце", positions[33].move.san.includes("#"), positions[33].move.san);
check("applyPgn: 17-й ход белых = полуход 33", positions[33].move.color === "w", positions[33].move.color);

// Комментарии и варианты ($[…])
const { comment: c1, variation: v1 } = splitComment("просто текст");
check("splitComment: без $[] — только комментарий", c1 === "просто текст" && v1 === null);
const { comment: c2, variation: v2 } = splitComment(" $[Nxe5 Qe7] конь жертвует пешку");
check("splitComment: $[] вынут из текста", c2 === "конь жертвует пешку", c2);
check("splitComment: вариант — список SAN", JSON.stringify(v2) === JSON.stringify(["Nxe5", "Qe7"]), v2);

const varPgn = "1. e4 e5 2. Nf3 { $[Bc4 Nc6] классика: итальянская партия} Nc6 3. Bc4 {классика} Nf6";
const full = await applyPgnFull(varPgn);
check("applyPgnFull: 7 позиций (старт + 6 ходов)", full.length === 7, "got " + full.length);
const nf3 = full[3]; // после 2.Nf3 (комментарий привязан к позиции после хода)
check("applyPgnFull: комментарий у 2.Nf3", nf3.comment === "классика: итальянская партия", nf3.comment);
check("applyPgnFull: вариант 2 хода", nf3.variation && nf3.variation.length === 2, nf3.variation && nf3.variation.length);
check("applyPgnFull: вариант начинается из позиции до хода (Bc4)", nf3.variation[0].san === "Bc4", nf3.variation && nf3.variation[0].san);
check("applyPgnFull: второй ход варианта Nc6", nf3.variation[1] && nf3.variation[1].san === "Nc6", nf3.variation && nf3.variation[1].san);
check("applyPgnFull: variationFen = позиция до хода", nf3.variationFen === full[2].fen, nf3.variationFen);
check("applyPgnFull: без варианта — variation null", full[5].comment === "классика" && full[5].variation === null, full[5].comment);

const morphyFull = await applyPgnFull(morphyPgn);
check("applyPgnFull: morphy без комментариев — 34 позиции", morphyFull.length === 34, "got " + morphyFull.length);
check("applyPgnFull: morphy мат в конце", morphyFull[33].move.san.includes("#"), morphyFull[33].move.san);

console.log(failed === 0 ? "\nВсе проверки прошли." : "\nПровалов: " + failed);
process.exit(failed === 0 ? 0 : 1);
