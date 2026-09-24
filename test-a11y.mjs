// Проверка доступности доски: до Enter на анонсе клетки отсутствуют в дереве
// доступности (aria-hidden), Enter открывает доску и ставит фокус на клетку,
// Escape закрывает и возвращает фокус на анонс.
//
// Гоняется на jsdom — playwright на этой машине нет. jsdom не моделирует
// режим обзора NVDA, но разметку (aria-hidden / aria-expanded / activeElement)
// проверяет честно: именно эти три атрибута и решают, попадёт ли сетка в
// дерево доступности.
//
//   node --experimental-vm-modules test-a11y.mjs   (нужен jsdom в NODE_PATH)
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

let failed = 0;
function check(name, cond, detail = "") {
  console.log((cond ? "ok   " : "FAIL ") + name + (cond ? "" : " " + detail));
  if (!cond) failed++;
}

const src = readFileSync(new URL("./chessjax-inline.js", import.meta.url), "utf8");
const dom = new JSDOM(
  `<!doctype html><html><body><chessjax-board id="b" fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" controls="none"></chessjax-board></body></html>`,
  { runScripts: "outside-only", pretendToBeVisual: true, url: "https://example.test/" }
);
const { window } = dom;
window.eval(src);

const board = window.document.getElementById("b");
const waitFor = async (fn, label) => {
  for (let i = 0; i < 200; i++) {
    if (fn()) return true;
    await new Promise((r) => setTimeout(r, 25));
  }
  check("доска построилась: " + label, false, "не дождались");
  return false;
};
if (!(await waitFor(() => board._tableWrap && board._boardIntro, "внутренние узлы"))) {
  console.log("\n" + failed + " провал(ов)");
  process.exit(1);
}

// Перечисление армии («Белые: король e1, ферзь d1, ладьи a1 h1…») — подпись
// для зрячего. Проверяем, что оно вне дерева доступности: иначе на каждом
// фокусе анонса скринридер выдаёт стену текста перед партией.
check("подпись позиции в aria-hidden", board._summary.getAttribute("aria-hidden") === "true");
check(
  "анонс не содержит перечисления армии",
  !/король|ферзь|ладь/i.test(board._boardIntro.textContent),
  board._boardIntro.textContent
);
if (!(await waitFor(() => board._tableWrap.querySelector(".chessjax-cell"), "клетки"))) {
  console.log("\n" + failed + " провал(ов)");
  process.exit(1);
}

const intro = board._boardIntro;
const wrap = board._tableWrap;
const cell = (sq) => wrap.querySelector(`[data-square="${sq}"]`);
const key = (el, k) => el.dispatchEvent(new window.KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));

// 1. До Enter.
check("до Enter: клетки aria-hidden", wrap.getAttribute("aria-hidden") === "true", String(wrap.getAttribute("aria-hidden")));
check("до Enter: анонс свёрнут", intro.getAttribute("aria-expanded") === "false", String(intro.getAttribute("aria-expanded")));
check("до Enter: фокус не в клетке", !wrap.contains(window.document.activeElement));

// 2. Enter на анонсе.
intro.focus();
key(intro, "Enter");
check("Enter: клетки раскрыты", wrap.getAttribute("aria-hidden") === "false", String(wrap.getAttribute("aria-hidden")));
check("Enter: анонс развёрнут", intro.getAttribute("aria-expanded") === "true", String(intro.getAttribute("aria-expanded")));
check("Enter: фокус на клетке a1", window.document.activeElement === cell("a1"), String(window.document.activeElement && window.document.activeElement.dataset.square));
check("Enter: ровно одна клетка в tab-порядке",
  wrap.querySelectorAll('.chessjax-cell[tabindex="0"]').length === 1,
  String(wrap.querySelectorAll('.chessjax-cell[tabindex="0"]').length));

// 3. Стрелка — навигация работает и клетки на месте. Вверх с a1 ведёт на a2:
// больший номер горизонтали, как и просил Дениз («стрелка вверх а1 а2 а3»).
// Вниз с a1 — упор в край, доска на месте.
key(cell("a1"), "ArrowDown");
check("стрелка вниз с a1 упирается в край", window.document.activeElement === cell("a1"), String(window.document.activeElement && window.document.activeElement.dataset.square));
key(cell("a1"), "ArrowUp");
check("стрелка вверх: фокус на a2", window.document.activeElement === cell("a2"), String(window.document.activeElement && window.document.activeElement.dataset.square));
check("стрелка: доска осталась раскрытой", wrap.getAttribute("aria-hidden") === "false");

// 4. Escape — снова скрыто, фокус на анонсе.
key(window.document.activeElement, "Escape");
check("Escape: клетки снова aria-hidden", wrap.getAttribute("aria-hidden") === "true", String(wrap.getAttribute("aria-hidden")));
check("Escape: анонс свёрнут", intro.getAttribute("aria-expanded") === "false", String(intro.getAttribute("aria-expanded")));
check("Escape: фокус вернулся на анонс", window.document.activeElement === intro);

// 5. Повторный Enter открывает заново.
key(intro, "Enter");
check("повторный Enter: раскрыто снова", wrap.getAttribute("aria-hidden") === "false" && intro.getAttribute("aria-expanded") === "true");
check("повторный Enter: фокус на клетке", wrap.contains(window.document.activeElement));

// 6. Клик по клетке — тот же вход.
key(intro, "Escape");
cell("d2").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
check("клик: фокус на d2", window.document.activeElement === cell("d2"), String(window.document.activeElement && window.document.activeElement.dataset.square));
check("клик: доска раскрыта", wrap.getAttribute("aria-hidden") === "false");

// 7. Русская раскладка. У Дениза клавиатура в русской раскладке: браузер тогда
// отдаёт e.key = «р» («R» на своей физической позиции), и до правки буквенные
// хоткеи молчали все разом. Ключ к раскладке — физический e.code, поэтому
// нажимаем так, как это делает русская раскладка, и ждём ту же реакцию.
const keyTy = (el, code, ch) => el.dispatchEvent(new window.KeyboardEvent("keydown", {
  key: ch, code, bubbles: true, cancelable: true,
}));
key(intro, "Escape");
key(intro, "Enter");
check("перед проверкой раскладки: фокус в клетке", wrap.contains(window.document.activeElement));
const grid = wrap.querySelector(".chessjax-board");
keyTy(window.document.activeElement, "KeyR", "р");
check("русская раскладка: R переворачивает доску", !!board._flipped, String(board._flipped));
// Поворот — это класс .flipped, а сам transform задаёт CSS-правило; jsdom
// правила не считает, поэтому проверяем класс, а геометрию меряет живой
// прогон check-layout-live.py в настоящем Chromium.
check("русская раскладка: доска помечена flipped", grid.classList.contains("flipped"), grid.className);
keyTy(window.document.activeElement, "KeyR", "р");
check("русская раскладка: повторное R возвращает как было", !board._flipped, String(board._flipped));
// Статус позиции — вторая буква, проверяем что и она дошла: вывод идёт в
// live-регион, поэтому смотрим текст, а не факт вызова.
const live = board._live;
const liveBefore = live.textContent;
keyTy(window.document.activeElement, "KeyS", "ы");
await new Promise((r) => setTimeout(r, 150));
check("русская раскладка: S произносит статус", live.textContent && live.textContent !== liveBefore, live.textContent.slice(0, 70));

console.log(failed ? "\n" + failed + " провал(ов)" : "\nвсё зелёное");
process.exit(failed ? 1 : 0);
