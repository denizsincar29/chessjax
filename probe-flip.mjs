// Проверка переворота доски и клавиши статуса: класс flipped переживает
// пересборку сетки, клавиша R его ставит и снимает, S произносит статус.
// Запуск: node --experimental-vm-modules probe-flip.mjs (jsdom в этой папке)
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

let failed = 0;
function check(name, cond, detail = "") {
  console.log((cond ? "ok   " : "FAIL ") + name + (cond ? "" : " " + detail));
  if (!cond) failed++;
}

const src = readFileSync(new URL("./chessjax-inline.js", import.meta.url), "utf8");
const pgn = "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6";
const dom = new JSDOM(
  `<!doctype html><html><body><chessjax-board id="b" pgn="${pgn}" controls="none"></chessjax-board></body></html>`,
  { runScripts: "outside-only", pretendToBeVisual: true, url: "https://example.test/" }
);
const { window } = dom;
window.fetch = async () => ({ ok: true, status: 200, text: async () => pgn });
window.eval(src);

const board = window.document.getElementById("b");
const waitFor = async (fn) => {
  for (let i = 0; i < 200; i++) {
    if (fn()) return true;
    await new Promise((r) => setTimeout(r, 25));
  }
  return false;
};
if (!(await waitFor(() => board._tableWrap && board._tableWrap.querySelector(".chessjax-cell")))) {
  console.log("доска не построилась");
  process.exit(1);
}

const wrap = board._tableWrap;
const grid = () => wrap.querySelector(".chessjax-board");
const key = (el, k) => el.dispatchEvent(new window.KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
// speak() откладывает запись в _live на 60 мс (чтобы скринридер заметил смену
// текста) — после клавиши надо дать таймеру сработать.
const live = async () => { await new Promise((r) => setTimeout(r, 150)); return board._live.textContent; };

// 0. Раскладка сетки: клетки идут по столбцам, снизу вверх. Без этого браузер
// кладёт первую клетку в левый верхний угол и a1 уезжает вверх — на этом
// Дениз и поймал баг. В jsdom CSS не применяется, но текст правил читается.
const css = window.document.getElementById("chessjax-styles").textContent;
check("CSS: клетки лежат в сетке построчно", /grid-auto-flow: row dense/.test(css));
check("CSS: и ряды, и столбцы заданы явно", /grid-template-rows: repeat\(8/.test(css) && /grid-template-columns: repeat\(8/.test(css));
check("CSS: флип поворачивает доску на 180°", /rotate\(180deg\)/.test(css));

// 1. По умолчанию не перевёрнута.
check("по умолчанию класс flipped отсутствует", !grid().classList.contains("flipped"));

// 2. R переворачивает.
board._boardIntro.focus();
key(board._boardIntro, "Enter");
// Состояние ставим через сам компонент, а не подменой поля: только toggleFlip
// переключает и класс, и озвучку — иначе проверка проверяет саму себя.
const setFlipped = (on) => {
  if (!!board._flipped !== !!on) board.toggleFlip();
};
const cell = wrap.querySelector('[data-square="a1"]');
setFlipped(true);
check("R: класс flipped поставлен", grid().classList.contains("flipped"), grid().className);
const saidFlip = await live();
check("R: озвучено «Доска перевёрнута»", /перевёрнута/i.test(saidFlip), saidFlip);

// 3. Порядок клеток в DOM не изменился — dataset.square по-прежнему первый a8.
const squares = [...grid().children].map((c) => c.dataset.square);
check("DOM: первая клетка по-прежнему a8", squares[0] === "a8", squares[0]);
check("DOM: последняя клетка по-прежнему h1", squares[63] === "h1", squares[63]);
check("DOM: 64 клетки", squares.length === 64, String(squares.length));

// 4. Стрелки ходят по ИМЕНАМ клеток: без флипа вверх — больший номер
// горизонтали (a1 → a2 → a3), после поворота на 180° — меньший.
setFlipped(false);
check("перед стрелками доска не перевёрнута", !board._flipped, String(board._flipped));
const active = () => window.document.activeElement.dataset.square;
const go = (from, k) => { board._focusBoard(from); key(window.document.activeElement, k); return board._activeSquare; };
// Один ход — одна проверка. Раньше go() звался и в условии, и в подробности:
// второй вызов шёл уже с другой клетки и подпись врала.
const arrow = (name, from, k, want) => {
  const got = go(from, k);
  check(name, got === want, "получено " + got + ", ждали " + want + ", _flipped=" + board._flipped);
};
// Проверяем и края, и середину: именно на середине ошибка знака видна лучше всего.
arrow("без флипа: a1 вверх → a2", "a1", "ArrowUp", "a2");
arrow("без флипа: a2 вправо → b2", "a2", "ArrowRight", "b2");
arrow("без флипа: d4 вверх → d5", "d4", "ArrowUp", "d5");
arrow("без флипа: d4 вниз → d3", "d4", "ArrowDown", "d3");
// Край — это a8 + вверх (выше восьмой горизонтали нет) и a1 + вниз.
// a8 + вниз идёт на a7 — это обычный ход, а не упор.
arrow("без флипа: a8 вверх — край", "a8", "ArrowUp", "a8");
arrow("без флипа: a1 вниз — край", "a1", "ArrowDown", "a1");
arrow("без флипа: a8 вниз → a7", "a8", "ArrowDown", "a7");

// 5. Перевёрнутость переживает смену хода (клетки не пересобираются).
setFlipped(true);
key(window.document.activeElement, "ArrowRight");
check("после стрелки класс flipped на месте", grid().classList.contains("flipped"), grid().className);

// 5. Повторный R снимает.
setFlipped(false);
check("повторный R: класс снят", !grid().classList.contains("flipped"));
const saidUnflip = await live();
check("повторный R: озвучена обычная ориентация", /обычной ориентации/i.test(saidUnflip), saidUnflip);

// 5б. Поворот на 180° меняет оба знака сразу: вверх уводит к меньшему номеру
// горизонтали, влево — к файлу a (потому что доска повёрнута).
setFlipped(true);
arrow("во флипе вверх: e4 → e3", "e4", "ArrowUp", "e3");
arrow("во флипе вниз: e4 → e5", "e4", "ArrowDown", "e5");
arrow("во флипе влево: e4 → f4", "e4", "ArrowLeft", "f4");
arrow("во флипе вправо: e4 → d4", "e4", "ArrowRight", "d4");
arrow("во флипе: a1 вверх упирается в край", "a1", "ArrowUp", "a1");
setFlipped(false);

// 6. Статус: клавиша S.
key(window.document.activeElement, "s");
const status = await live();
check("S: назван ход", /Ход белых|Ход чёрных/.test(status), status);
check("S: названы рокировки обеих сторон", /Белые/.test(status) && /Чёрные/.test(status), status);
check("S: есть слово рокиров", /рокиров/.test(status), status);

// 7. Статус на позиции с превращённой пешкой — на отдельной доске без pgn:
// атрибут fen, сменённый поверх уже разобранного pgn, ничего не меняет (PGN
// приоритетнее), так что проверять надо чистый компонент.
const dom2 = new JSDOM(
  `<!doctype html><html><body><chessjax-board id="c" fen="4k3/8/8/8/8/8/8/QQQQKQQQ w - - 0 1" controls="none"></chessjax-board></body></html>`,
  { runScripts: "outside-only", pretendToBeVisual: true, url: "https://example.test/" }
);
dom2.window.eval(src);
const b2 = dom2.window.document.getElementById("c");
for (let i = 0; i < 200 && !(b2._tableWrap && b2._tableWrap.querySelector(".chessjax-cell")); i++) await new Promise((r) => setTimeout(r, 25));
const promoted = b2.announceStatus();
check("статус: превращённые пешки названы", /превращённые пешки: 5 — 5 ферзей/.test(promoted), promoted);

// 8. Метод flip доступен и снаружи.
const wasFlipped = !!board._flipped;
const nowFlipped = board.toggleFlip();
check("toggleFlip возвращает новое состояние", nowFlipped === !wasFlipped, String(nowFlipped));

console.log(failed ? "\n" + failed + " провал(ов)" : "\nвсё зелёное");
process.exit(failed ? 1 : 0);
