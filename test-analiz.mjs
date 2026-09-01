// Анализ chessjax v0.6.0: лучший ход (B/★), анализ партии (A/Σ), скрытый
// роаст (долгое A 2 сек). Вердикт ходу идёт в polite-регион .chessjax-verdict-live
// ПОСЛЕ озвучки хода (.chessjax-live). Движок Stockfish с jsdelivr грузится лениво —
// до первого запроса анализа никаких сетевых обращений к нему быть не должно.
// Запуск: node test-analiz.mjs (playwright + chromium, локальный http-сервер).
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import http from "node:http";
import { extname } from "node:path";

const dir = fileURLToPath(new URL("./", import.meta.url));
const mime = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".pgn": "text/plain" };
const server = http.createServer(async (req, res) => {
  try {
    const path = new URL(req.url, "http://x").pathname;
    const name = path === "/" ? "index.html" : path.replace(/^\/+/, "");
    const data = await readFile(dir + name);
    res.writeHead(200, { "Content-Type": mime[extname(name)] || "text/plain" });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = "http://127.0.0.1:" + server.address().port;

let failed = 0;
function check(name, cond, detail = "") {
  console.log((cond ? "ok   " : "FAIL ") + name + (cond ? "" : " " + detail));
  if (!cond) failed++;
}

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push("[console] " + m.text()); });
const sfReqs = [];
page.on("request", (r) => { if (r.url().includes("stockfish")) sfReqs.push(r.url()); });

// Доска с партией (Опера-партия Морфи) — для вердиктов ходам нужны ходы.
await page.goto(base + "/examples/story.html", { waitUntil: "domcontentloaded" });
await page.waitForSelector("#morphy .chessjax-board", { timeout: 30000 });
const sel = "#morphy";

{
  const n = await page.locator(sel + " .chessjax-controls .chessjax-btn").count();
  check("контролы: 7 кнопок (⏮ ← → ▶ ⛶ ★ Σ)", n === 7, "count=" + n);
}
check("ленивая загрузка: до первого запроса анализа запросов к движку нет", sfReqs.length === 0, sfReqs.join(" | "));

async function live() {
  return (await page.locator(sel + " .chessjax-live").textContent() || "").trim();
}
async function verdictLive() {
  return (await page.locator(sel + " .chessjax-verdict-live").textContent() || "").trim();
}
async function hl() {
  return page.locator(sel + " .chessjax-cell.analysis-move").count();
}
async function focusCell() {
  await page.locator(sel + ' .chessjax-cell[data-square="a8"]').focus();
}
async function waitFor(pred, timeout = 40000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    if (await pred()) return true;
    await page.waitForTimeout(300);
  }
  return false;
}
const VERDICT = /Прекрасный ход|Хороший ход|Интересный ход|Неточность|Ошибка|Грубая ошибка|Позиция равная|Преимущество/;
const ROAST = /Ооо|прекрасно съел|Ням|утиль|Вау, вот это ход|Мастерски|Красота|Неплохо|Норм|Сойдёт|О, интересно|Хм, любопытно|Что-то задумал|Так себе|Не уверен|лучше|не лучшая идея|Рискованно|Ой\.\.\.|полная хрень|Что ты делаешь|Это провал|Преимущество|Позиция равная/;

// B: лучший ход в текущей позиции + подсветка 2 клеток + a11y-пометка.
{
  await focusCell();
  await page.keyboard.press("b");
  const t0 = Date.now();
  check("B: заявлен запрос к движку (ленивая загрузка сработала)", sfReqs.length >= 1, sfReqs.length + " reqs");
  const ok = await waitFor(async () => /Лучший ход/.test(await live()));
  check("B: результат — оценка и лучший ход", ok, JSON.stringify({ ms: Date.now() - t0, text: await live() }));
  check("B: подсвечено 2 клетки", (await hl()) === 2, "hl=" + (await hl()));
  const labels = await page.locator(sel + " .chessjax-cell.analysis-move").evaluateAll((els) => els.map((e) => e.getAttribute("aria-label") || ""));
  check("B: aria-label подсвеченных клеток помечен «лучший ход»", labels.every((l) => l.toLowerCase().includes("лучший ход")), labels.join(" | "));
}

// Esc — снимает подсветку.
{
  await focusCell();
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
  check("Esc: подсветка убрана", (await hl()) === 0, "hl=" + (await hl()));
}

// Короткое A — анализ партии включён.
{
  await focusCell();
  await page.keyboard.press("a");
  await page.waitForTimeout(150);
  check("A (короткое): режим анализа партии включён", (await live()).includes("Анализ партии включён"), await live());
}

// Навигация вперёд → вердикт движка ходу.
{
  await page.click(sel + ' .chessjax-controls .chessjax-btn[aria-label="Следующий ход"]');
  const t0 = Date.now();
  const ok = await waitFor(async () => VERDICT.test(await verdictLive()));
  check("ход вперёд: вердикт движка", ok, JSON.stringify({ ms: Date.now() - t0, text: await verdictLive() }));
}

// Долгое A (2 сек) — скрытый роаст.
{
  await focusCell();
  await page.keyboard.down("a");
  await page.waitForTimeout(2200);
  await page.keyboard.up("a");
  await page.waitForTimeout(150);
  check("A (долгое 2 сек): скрытый роаст включён", (await live()).includes("Скрытый режим роаста включён"), await live());
}

// Ход вперёд → неформальный вердикт роаста (в polite-регион).
{
  await page.click(sel + ' .chessjax-controls .chessjax-btn[aria-label="Следующий ход"]');
  const t0 = Date.now();
  const ok = await waitFor(async () => ROAST.test(await verdictLive()));
  check("роаст: неформальный вердикт", ok, JSON.stringify({ ms: Date.now() - t0, text: await verdictLive() }));
}

// Долгое A ещё раз — роаст выключен.
{
  await focusCell();
  await page.keyboard.down("a");
  await page.waitForTimeout(2200);
  await page.keyboard.up("a");
  await page.waitForTimeout(150);
  check("A (долгое): роаст выключен", (await live()).includes("Режим роаста выключен"), await live());
}

// Короткое A — анализ партии выключен (роаст не оставил режим).
{
  await focusCell();
  await page.keyboard.press("a");
  await page.waitForTimeout(150);
  check("A (короткое): анализ партии выключен", (await live()).includes("Анализ партии выключен"), await live());
}

// Кнопка ★ — лучший ход снова работает.
{
  await page.click(sel + ' .chessjax-controls .chessjax-btn[aria-label="Лучший ход"]');
  const ok = await waitFor(async () => /Лучший ход/.test(await live()));
  check("кнопка ★: результат получен", ok, await live());
}

const fatal = errors.filter((e) => !/An unknown error/.test(e));
check("нет фатальных ошибок консоли", fatal.length === 0, fatal.join(" | "));

console.log(`\n=== ${failed === 0 ? "ALL PASS" : failed + " FAILURES"} ===`);
console.log("page errors:", errors.join(" | ") || "none");
await browser.close();
server.close();
process.exit(failed === 0 ? 0 : 1);
