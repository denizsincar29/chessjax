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

const src = readFileSync(new URL("./chessjax.js", import.meta.url), "utf8");
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

// 3. Стрелка — навигация работает и клетки на месте.
key(cell("a1"), "ArrowDown");
check("стрелка: фокус на a2", window.document.activeElement === cell("a2"), String(window.document.activeElement && window.document.activeElement.dataset.square));
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

console.log(failed ? "\n" + failed + " провал(ов)" : "\nвсё зелёное");
process.exit(failed ? 1 : 0);
