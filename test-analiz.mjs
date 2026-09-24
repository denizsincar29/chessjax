// Анализ chessjax v0.6.1: лучший ход (B/★), анализ партии (A/Σ), скрытый
// роаст (долгое A 2 сек). Вердикт ходу идёт в polite-регион .chessjax-verdict-live
// ПОСЛЕ озвучки хода (.chessjax-live); величину преимущества цифрой НЕ озвучиваем —
// её маркирует квадрат-тон (playAdvantageTone). Пробел — продолжить/пауза,
// Ctrl+Пробел — с начала, Ctrl+↑/↓ — скорость автопросмотра.
// Движок Stockfish с jsdelivr грузится лениво — до первого запроса анализа никаких
// сетевых обращений к нему быть не должно.
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
// Тон оценки — метка длиной 50 мс, а не полусекундный гул (фидбек Дениза 13.09:
// «тон слишком длинный, буквально 50 мс делай пик»). Настоящий Web Audio в
// headless не послушать, поэтому подменяем AudioContext подклассом, который
// записывает, на сколько осциллятор просил себя остановить: osc.stop(t0 + Δ).
await page.addInitScript(() => {
  const Orig = window.AudioContext || window.webkitAudioContext;
  if (!Orig) return;
  window.__toneSpans = [];
  window.AudioContext = class extends Orig {
    createOscillator() {
      const osc = super.createOscillator();
      const stop = osc.stop.bind(osc);
      const self = this;
      osc.stop = (t) => {
        if (typeof t === "number") window.__toneSpans.push(+(t - self.currentTime).toFixed(4));
        return stop(t);
      };
      return osc;
    }
  };
});
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
  // Восемь, а не семь: к семи прежним добавилась «Действия с позицией»
  // (скачать FEN/PGN, копировать) — проверка просто отстала от доски.
  check("контролы: 8 кнопок (⏮ ← → ▶ ⛶ ★ Σ ☰)", n === 8, "count=" + n);
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
// Банки фраз живут в словаре (I18N.ru), и правки текста не должны ломать тест:
// вытаскиваем все фразы из самого модуля и собираем из них регулярку. Фразы-функции
// вызываем с образцом контекста { p, t } — как это делает доска при взятии.
const BANKS = await page.evaluate(async () => {
  const m = await import(new URL("../chessjax.js", location.href).href);
  const t = m.I18N.ru;
  // Фразу-функцию зовём для каждой фигуры: текст зависит от взятой фигуры
  // («пешка отправилась в утиль» / «ферзь отправился в утиль»).
  const flatten = (bank) =>
    (Array.isArray(bank) ? bank : [bank])
      .flatMap((entry) => {
        if (typeof entry !== "function") return [entry];
        return ["k", "q", "r", "b", "n", "p"].map((p) => {
          try {
            return entry({ p, t });
          } catch {
            return null;
          }
        });
      })
      .filter((s) => typeof s === "string" && s);
  return {
    verdict: Object.values(t.verdict).flatMap(flatten),
    roast: Object.values(t.roast).flatMap(flatten),
  };
});
const anyOf = (phrases) =>
  new RegExp(phrases.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"));
const VERDICT = anyOf(BANKS.verdict);
const ROAST = anyOf(BANKS.roast);
console.log(`фраз в словаре: вердиктов ${BANKS.verdict.length}, роаста ${BANKS.roast.length}`);

// B: лучший ход в текущей позиции + подсветка 2 клеток + a11y-пометка.
{
  await focusCell();
  await page.keyboard.press("b");
  const t0 = Date.now();
  // Запрос уходит из асинхронного обработчика, а модуль движка тянется с CDN —
  // проверка «сразу после нажатия» ловит гонку. Ждём запрос.
  const asked = await waitFor(() => sfReqs.length >= 1, 10000);
  check("B: заявлен запрос к движку (ленивая загрузка сработала)", asked, sfReqs.length + " reqs");
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

  // Тон оценки звучит на каждом ходу — и обязан быть вспышкой в 50 мс.
  const spans = await page.evaluate(() => window.__toneSpans || []);
  check("тон оценки играет на ходу", spans.length >= 1, "spans=" + JSON.stringify(spans));
  check("тон оценки — 50 мс, не длиннее",
    spans.length >= 1 && spans.every((s) => Math.abs(s - 0.05) < 0.02),
    "spans=" + JSON.stringify(spans));
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

// v0.6.1: обмен клавиш — Пробел = продолжить/пауза, Ctrl+Пробел = с начала,
// Ctrl+↑/↓ — скорость автопросмотра. (Доска стартует с move-атрибута,
// поэтому сначала Ctrl+Пробел сбрасывает в начало.)
{
  await focusCell();

  // Разгоняем до минимума (3×Ctrl+↑: 2500→2000→1500→1000) и проверяем объявление.
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press("Control+ArrowUp");
    await page.waitForTimeout(120);
  }
  check("Ctrl+↑: скорость ускорена до 1 секунды", /Скорость показа: 1 секунд/.test(await live()), await live());

  await page.keyboard.press("Control+ArrowDown");
  await page.waitForTimeout(120);
  check("Ctrl+↓: скорость замедлена до 1.5", /Скорость показа: 1\.5 секунды/.test(await live()), await live());

  // Ctrl+Пробел — автопросмотр с начала (был «продолжить/пауза», стал «с начала»).
  await page.keyboard.press("Control+Space");
  const okStart = await waitFor(async () => /Начальная позиция/.test(await live()), 8000);
  check("Ctrl+Пробел: просмотр с начала", okStart, await live());
  await page.waitForTimeout(150);
  const btnStop = sel + ' .chessjax-controls .chessjax-btn[aria-label="Остановить показ ходов"]';
  check("Ctrl+Пробел: автопросмотр запущен", (await page.locator(btnStop).count()) === 1, "");

  // Ждём один ход (интервал 1.5с; idx 1..2 = «ход 1 белых») и пауза Пробелом — слышен номер хода.
  await page.waitForTimeout(1800);
  await page.keyboard.press(" ");
  const okPause = await waitFor(async () => /Остановлено на ходе 1 белых/.test(await live()), 8000);
  check("Пробел: пауза с номером хода", okPause, await live());
  check("Пробел: кнопка вернулась ▶", (await page.locator(sel + ' .chessjax-controls .chessjax-btn[aria-label="Показать ходы по порядку"]').count()) === 1, "");

  // Пробел — продолжение с текущего хода (был «с начала», стал «продолжить/пауза»).
  await page.keyboard.press(" ");
  await page.waitForTimeout(150);
  check("Пробел: продолжение с текущего хода", (await page.locator(btnStop).count()) === 1, "");

  // Не оставляем таймер: пауза.
  await page.keyboard.press(" ");
  await page.waitForTimeout(150);
}

// Кнопка ★ — лучший ход снова работает.
{
  await page.click(sel + ' .chessjax-controls .chessjax-btn[aria-label="Лучший ход"]');
  const ok = await waitFor(async () => /Лучший ход/.test(await live()));
  check("кнопка ★: результат получен", ok, await live());
}

// 404 от посторонних ресурсов (иконки, внешние бинарники движка) — не ошибка
// доски: страница живёт, ходы и вердикты считаются. Фатальной считаем только
// ошибку, которую доска могла вызвать сама.
const fatal = errors.filter((e) => !/An unknown error/.test(e) && !/404/.test(e));
check("нет фатальных ошибок консоли", fatal.length === 0, fatal.join(" | "));

console.log(`\n=== ${failed === 0 ? "ALL PASS" : failed + " FAILURES"} ===`);
console.log("page errors:", errors.join(" | ") || "none");
await browser.close();
server.close();
process.exit(failed === 0 ? 0 : 1);
