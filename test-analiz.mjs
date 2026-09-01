// Анализ позиции движком Stockfish (клавиша A / кнопка Σ) — chessjax v0.5.0.
// Движок грузится с jsdelivr (npm/stockfish@10.0.2) лениво: до первого
// запроса анализа никаких сетевых обращений к нему быть не должно.
// Запуск: node test-analiz.mjs (playwright + chromium, локальный http-сервер).
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import http from "node:http";
import { extname } from "node:path";

const dir = fileURLToPath(new URL("./", import.meta.url));
const mime = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css" };
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

// Сетевые запросы к движку (loader/wasm с jsdelivr).
const sfReqs = [];
page.on("request", (r) => {
  if (r.url().includes("stockfish")) sfReqs.push(r.url());
});

await page.goto(base + "/", { waitUntil: "domcontentloaded" });
await page.waitForSelector("#demo .chessjax-board", { timeout: 30000 });

// Кнопки управления: ⏮ ← → ▶ ⛶ Σ — ровно 6.
{
  const n = await page.locator("#demo .chessjax-controls .chessjax-btn").count();
  check("контролы: 6 кнопок (⏮ ← → ▶ ⛶ Σ)", n === 6, "count=" + n);
}

// Ленивая загрузка: до первого запроса анализа запросов к Stockfish нет.
check("ленивая загрузка: до A запросов к движку нет", sfReqs.length === 0, sfReqs.join(" | "));

async function liveText() {
  return (await page.locator("#demo .chessjax-live").textContent() || "").trim();
}
async function hlCount() {
  return page.locator("#demo .chessjax-cell.analysis-move").count();
}

// Дождаться результата анализа: либо озвучка результата, либо подсветка,
// либо (на провал) — текст ошибки движка.
async function waitAnalysis(timeout = 60000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    const [text, hl] = await Promise.all([liveText(), hlCount()]);
    if (hl >= 2 && text.includes("Лучший ход")) return { text, hl };
    if (text.includes("Анализ снят") && hl === 0) return { text, hl };
    if (text.includes("не удалось загрузить движок")) return { text, hl, err: true };
    await page.waitForTimeout(400);
  }
  return { text: await liveText(), hl: await hlCount(), timeout: true };
}

async function pressA() {
  await page.locator('#demo .chessjax-cell[data-square="a8"]').focus();
  await page.keyboard.press("a");
}

// Клавиша A — анализ стартует (озвучка «Идёт анализ…») и приходит результат.
{
  await pressA();
  const t0 = Date.now();
  const pre = await liveText();
  check("A: заявлен запрос к движку (ленивая загрузка сработала)", sfReqs.length >= 1, sfReqs.length + " reqs");
  const res = await waitAnalysis();
  const ms = Date.now() - t0;
  check("A: результат — оценка и лучший ход", !res.timeout && !res.err, JSON.stringify({ ms, text: res.text, hl: res.hl, err: errors.join(" | ") }));
  check("A: озвучено «Лучший ход»", res.text.includes("Лучший ход"), res.text);
  check("A: подсвечено 2 клетки", res.hl === 2, "hl=" + res.hl);

  // a11y подсветки: aria-label лучшей клетки помечен как «лучший ход».
  const labels = await page.locator("#demo .chessjax-cell.analysis-move").evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));
  const tagged = labels.filter((l) => l && l.toLowerCase().includes("лучший ход"));
  check("A: aria-label подсвеченных клеток помечен «лучший ход»", tagged.length === labels.length, labels.join(" | "));
}

// Повторное A — анализ снимается.
{
  await pressA();
  const t0 = Date.now();
  let text = await liveText();
  let hl = await hlCount();
  while (Date.now() - t0 < 3000 && !(text.includes("Анализ снят") && hl === 0)) {
    await page.waitForTimeout(200);
    [text, hl] = await Promise.all([liveText(), hlCount()]);
  }
  check("повторное A: «Анализ снят», подсветка убрана", text.includes("Анализ снят") && hl === 0, text + " / hl=" + hl);
}

// Кнопка Σ — анализ снова работает.
{
  const before = sfReqs.length;
  await page.click("#demo .chessjax-controls .chessjax-btn:has-text('Σ')");
  const res = await waitAnalysis();
  check("кнопка Σ: результат получен", !res.timeout && !res.err, JSON.stringify({ text: res.text, hl: res.hl }));
  check("кнопка Σ: новые запросы к движку (переиспользуется, был-кэш)", sfReqs.length >= before, sfReqs.length + " vs " + before);
}

// Esc — снимает анализ.
{
  await page.locator('#demo .chessjax-cell[data-square="a8"]').focus();
  await page.keyboard.press("Escape");
  const t0 = Date.now();
  let text = await liveText();
  let hl = await hlCount();
  while (Date.now() - t0 < 3000 && !(text.includes("Анализ снят") && hl === 0)) {
    await page.waitForTimeout(200);
    [text, hl] = await Promise.all([liveText(), hlCount()]);
  }
  check("Esc: «Анализ снят», подсветка убрана", text.includes("Анализ снят") && hl === 0, text + " / hl=" + hl);
}

console.log(`\n=== ${failed === 0 ? "ALL PASS" : failed + " FAILURES"} ===`);
console.log("page errors:", errors.join(" | ") || "none");
await browser.close();
server.close();
process.exit(failed === 0 ? 0 : 1);
