// DOM-проверка в реальном браузере (playwright). Локально:
//   playwright install chromium  →  node test-dom.mjs
// Модульные скрипты не грузятся по file://, поэтому раздаём страницы
// через локальный http-сервер на случайном порту.
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import http from "node:http";
import { extname } from "node:path";

const dir = fileURLToPath(new URL("./", import.meta.url));
const mime = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".pgn": "text/plain; charset=utf-8" };
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

async function openPage(path) {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push("[console] " + m.text()); });
  await page.goto(base + path, { waitUntil: "domcontentloaded" });
  try {
    await page.waitForSelector(".chessjax-board");
  } catch (e) {
    console.log("board not found on", path);
    console.log("errors:", errors.join(" | ") || "none");
    const errBox = await page.locator(".chessjax-error, #error").first().textContent().catch(() => "n/a");
    console.log("errbox:", errBox);
    throw e;
  }
  return { page, errors };
}

// --- index.html: демо по FEN ------------------------------------------------

{
  const { page, errors } = await openPage("/");
  const rows = await page.locator(".chessjax-board tr").count();
  const cells = await page.locator(".chessjax-board td").count();
  check("демо: 9 строк", rows === 9, "rows=" + rows);
  check("демо: 64 клетки", cells === 64, "cells=" + cells);

  const a1 = await page.locator('td[data-square="a1"]').getAttribute("aria-label");
  check("демо: a1 = Белая ладья A1", a1 === "Белая ладья A1", a1);
  const e4 = await page.locator('td[data-square="e4"]').getAttribute("aria-label");
  check("демо: e4 (пустая) = E4", e4 === "E4", e4);
  const summary = await page.locator(".chessjax-summary").textContent();
  check("демо: summary «Ход белых»", summary.includes("Ход белых"), summary);

  // Смена языка через select.
  await page.selectOption("#lang", "en");
  await page.waitForTimeout(200);
  const summaryEn = await page.locator(".chessjax-summary").textContent();
  check("демо: английский summary", summaryEn.includes("White to move"), summaryEn);

  // Невалидный FEN — ошибка на доске, без падения.
  await page.locator("#fen").fill("broken fen");
  await page.locator("#apply").click();
  const err = await page.locator(".chessjax-error").textContent();
  check("демо: ошибка на битом FEN", err.includes("chessjax"), err);

  check("демо: нет pageerrors", errors.length === 0, errors.join(" | "));
  await page.close();
}

// --- examples/story.html: PGN + кнопки-ходы + озвучка -------------------------

{
  const { page, errors } = await openPage("/examples/story.html");

  // Доска загружена с pgn и показан 10-й ход белых (10.Nxb5) — конь белых на b5.
  await page.waitForTimeout(400);
  const b5 = await page.locator('td[data-square="b5"]').getAttribute("aria-label");
  check("story: 10-й ход — конь белых на b5", b5 === "Белый конь B5", b5);
  const summary = await page.locator(".chessjax-summary").textContent();
  check("story: после 10-го хода ход чёрных", summary.includes("Ход чёрных"), summary);

  // Навигация по клеткам стрелками (roving tabindex): a8 → b8 → b7 → a7.
  await page.locator('td[data-square="a8"]').focus();
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(50);
  const cur1 = await page.evaluate(() => document.activeElement.getAttribute("data-square"));
  check("стрелка вправо: a8 → b8", cur1 === "b8", cur1);
  const b8 = await page.locator('td[data-square="b8"]').getAttribute("aria-label");
  check("b8 озвучен (Чёрный конь B8)", b8 === "Чёрный конь B8", b8);
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(50);
  const cur2 = await page.evaluate(() => document.activeElement.getAttribute("data-square"));
  check("стрелка вниз: b8 → b7", cur2 === "b7", cur2);
  // После 9...b5 на b7 пусто — озвучка просто координатой.
  const b7 = await page.locator('td[data-square="b7"]').getAttribute("aria-label");
  check("b7 (пустая) озвучен как B7", b7 === "B7", b7);
  await page.keyboard.press("ArrowLeft");
  await page.waitForTimeout(50);
  const cur3 = await page.evaluate(() => document.activeElement.getAttribute("data-square"));
  check("стрелка влево: b7 → a7", cur3 === "a7", cur3);
  const a7 = await page.locator('td[data-square="a7"]').getAttribute("aria-label");
  check("a7 озвучен (Чёрная пешка A7)", a7 === "Чёрная пешка A7", a7);

  // Фокус остаётся на той же клетке после смены хода: программный клик по кнопке
  // (не мышью) не уводит фокус, перерисовка восстанавливает его на активной клетке.
  await page.evaluate(() => document.querySelector('.chessjax-btn[aria-label="Предыдущий ход"]').click());
  await page.waitForTimeout(250);
  const still = await page.evaluate(() => document.activeElement.getAttribute("data-square"));
  check("фокус восстановлен на a7 после смены хода", still === "a7", still);

  // Кнопка текста move=17 → доска показывает мат: ладья белых на d8, озвучка «мат».
  await page.locator('button[chess="morphy"][move="17"]').click();
  await page.waitForTimeout(250);
  const d8 = await page.locator('td[data-square="d8"]').getAttribute("aria-label");
  check("story: после move=17 ладья на d8", d8 === "Белая ладья D8", d8);
  const live = await page.locator(".chessjax-live").textContent();
  check("story: озвучка мата", live.includes("мат") && live.includes("17"), live);

  // Кнопка текста move=16 (жертва ферзя) — озвучка «шах».
  await page.locator('button[chess="morphy"][move="16"]').click();
  await page.waitForTimeout(250);
  const live16 = await page.locator(".chessjax-live").textContent();
  check("story: озвучка шаха на 16-м", live16.includes("16") && live16.includes("шах"), live16);

  // Кнопка навигации «предыдущий» работает (подпись в aria-label, не в тексте).
  await page.locator('.chessjax-btn[aria-label="Предыдущий ход"]').click();
  await page.waitForTimeout(250);
  const livePrev = await page.locator(".chessjax-live").textContent();
  check("story: prev озвучил 15-й ход", livePrev.includes("15"), livePrev);

  check("story: нет pageerrors", errors.length === 0, errors.join(" | "));
  await page.close();
}

await browser.close();
console.log(failed === 0 ? "Все DOM-проверки прошли." : "Провалов: " + failed);
process.exit(failed === 0 ? 0 : 1);
