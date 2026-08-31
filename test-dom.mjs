// DOM-проверка рендера в реальном браузере (playwright). Локально:
//   playwright install chromium  →  node test-dom.mjs
// Модульные скрипты не грузятся по file://, поэтому раздаём страницу
// через локальный http-сервер на случайном порту.
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
    const name = path === "/" ? "index.html" : path.slice(1);
    const data = await readFile(dir + name);
    res.writeHead(200, { "Content-Type": mime[extname(name)] || "text/plain" });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const url = "http://127.0.0.1:" + server.address().port + "/index.html";

let failed = 0;
function check(name, cond, detail = "") {
  console.log((cond ? "ok   " : "FAIL ") + name + (cond ? "" : " " + detail));
  if (!cond) failed++;
}

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

await page.goto(url, { waitUntil: "domcontentloaded" });
try {
  await page.waitForSelector(".chessjax-board");
} catch (e) {
  console.log("board not found. pageerrors:", errors.join(" | ") || "none");
  console.log("error box:", await page.locator("#error").textContent().catch(() => "n/a"));
  console.log("scripts loaded:", await page.evaluate(() => performance.getEntriesByType("resource").map(r => r.name.split("/").pop()).join(",")));
  throw e;
}

const rows = await page.locator(".chessjax-board tr").count();
const cells = await page.locator(".chessjax-board td").count();
check("таблица: 9 строк (заголовок + 8)", rows === 9, "rows=" + rows);
check("таблица: 64 клетки", cells === 64, "cells=" + cells);

const a1 = await page.locator('.chessjax-board td[aria-label^="a1"]').getAttribute("aria-label");
const e8 = await page.locator('.chessjax-board td[aria-label^="e8"]').getAttribute("aria-label");
const e4 = await page.locator('.chessjax-board td[aria-label^="e4"]').getAttribute("aria-label");
check("a1 = белая ладья", a1 === "a1, белая ладья", a1);
check("e8 = чёрный король", e8 === "e8, чёрный король", e8);
check("e4 пустое поле", e4 === "e4", e4);

const summary = await page.locator(".chessjax-summary").textContent();
check("резюме позиции", summary.includes("Белые: король e1, ферзь d1") && summary.includes("Ход белых"), summary);

// Невалидный FEN — показываем ошибку, таблица не падает.
await page.locator("#fen").fill("broken fen");
await page.locator("#apply").click();
const err = await page.locator("#error").textContent();
check("ошибка на битом FEN", err.includes("chessjax"), err);

console.log("pageerrors:", errors.join(" | ") || "none");
await browser.close();
console.log(failed === 0 ? "Все DOM-проверки прошли." : "Провалов: " + failed);
process.exit(failed === 0 ? 0 : 1);
