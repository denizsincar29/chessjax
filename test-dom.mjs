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
  const cells = await page.locator(".chessjax-board .chessjax-cell").count();
  const th = await page.locator(".chessjax-board th").count();
  check("демо: 64 клетки", cells === 64, "cells=" + cells);
  check("демо: доска не таблица (нет th)", th === 0, "th=" + th);

  // Клавиши внутри ведёт доска, и скринридер обязан отдавать их ей, а не листать
  // документ стрелками. Фокусируемого div'а для этого мало: NVDA включает режим
  // форм на фокус-событии только для известных ролей, и toolbar среди предков
  // фокуса — одна из них (в отличие от role="application", который в списке
  // NVDA отсутствует). Имя роли переопределено, чтобы не звучало «панель
  // инструментов».
  const boardRole = await page.evaluate(() => {
    const el = document.querySelector(".chessjax-board");
    return {
      role: el.getAttribute("role"),
      roledescription: el.getAttribute("aria-roledescription"),
      label: el.getAttribute("aria-label"),
    };
  });
  check("демо: доска — тулбар (NVDA уходит в режим форм)", boardRole.role === "toolbar", JSON.stringify(boardRole));
  check("демо: роль объявлена как доска, а не «панель инструментов»",
    /доска/i.test(boardRole.roledescription || ""), boardRole.roledescription);
  check("демо: у доски есть имя", /доска/i.test(boardRole.label || ""), boardRole.label);

  const a1 = await page.locator('.chessjax-cell[data-square="a1"]').getAttribute("aria-label");
  check("демо: a1 = Белая ладья A1", a1 === "Белая ладья A1", a1);
  const d1 = await page.locator('.chessjax-cell[data-square="d1"]').getAttribute("aria-label");
  check("демо: d1 = Белый ферзь D1 (ферзь м.р.)", d1 === "Белый ферзь D1", d1);
  const e4 = await page.locator('.chessjax-cell[data-square="e4"]').getAttribute("aria-label");
  check("демо: e4 (пустая) = E4", e4 === "E4", e4);

  // Фигура нарисована инлайн-SVG, но скринридеру он не адресован: имя клетки
  // берётся из aria-label, а картинка спрятана в aria-hidden. Иначе NVDA в
  // режиме чтения произносит фигуру поверх подписи — дважды.
  const glyph = await page.evaluate(() => {
    const cell = document.querySelector('.chessjax-cell[data-square="d1"]');
    const svg = cell.firstElementChild;
    return {
      tag: svg ? svg.tagName.toLowerCase() : null,
      cls: svg ? svg.getAttribute("class") : null,
      hidden: svg ? svg.getAttribute("aria-hidden") : null,
      focusable: svg ? svg.getAttribute("focusable") : null,
      viewBox: svg ? svg.getAttribute("viewBox") : null,
      shapes: svg ? svg.querySelectorAll("path, circle").length : 0,
      markup: svg ? svg.innerHTML : "",
      cellText: cell.textContent.trim(),
      rect: svg ? { w: Math.round(svg.getBoundingClientRect().width), h: Math.round(svg.getBoundingClientRect().height) } : null,
      cellRect: { w: Math.round(cell.getBoundingClientRect().width), h: Math.round(cell.getBoundingClientRect().height) },
      styleTag: !!document.getElementById("chessjax-styles"),
    };
  });
  check("демо: фигура — svg с классом chessjax-piece, спрятанный от скринридера",
    glyph.tag === "svg" && glyph.cls === "chessjax-piece" &&
    glyph.hidden === "true" && glyph.focusable === "false",
    JSON.stringify({ tag: glyph.tag, cls: glyph.cls, hidden: glyph.hidden }));
  check("демо: svg ферзя d1 нарисован (viewBox 45×45, есть контуры)",
    glyph.viewBox === "0 0 45 45" && glyph.shapes >= 3,
    JSON.stringify({ viewBox: glyph.viewBox, shapes: glyph.shapes }));
  check("демо: клетка не несёт текста — координаты рисует CSS из data-атрибутов",
    glyph.cellText === "" && glyph.markup.indexOf("<") === 0, JSON.stringify(glyph.cellText));
  // Без стилей svg без width/height разворачивается в 300×150 и ломает сетку —
  // поэтому проверяем не только наличие узла, но и его реальный размер.
  check("демо: стили доски вставлены, фигура вписана в клетку",
    glyph.styleTag && !!glyph.rect && glyph.rect.w === glyph.rect.h &&
    Math.abs(glyph.rect.w / glyph.cellRect.w - 0.92) < 0.05,
    JSON.stringify({ rect: glyph.rect, cell: glyph.cellRect }));
  const d8 = await page.evaluate(() => {
    const cell = document.querySelector('.chessjax-cell[data-square="d8"]');
    const svg = cell.firstElementChild;
    return { markup: svg ? svg.innerHTML : "", square: cell.dataset.square };
  });
  check("демо: белая и чёрная фигуры — разная разметка",
    !!d8.markup && d8.markup !== glyph.markup,
    "d8=" + d8.markup.length + "Б d1=" + glyph.markup.length + "Б");
  const coords = await page.evaluate(() => {
    const f = document.querySelector('.chessjax-cell[data-square="a1"]');
    const s = document.querySelector('.chessjax-cell[data-square="h8"]');
    return { file: f.classList.contains("coord-file"), rank: f.classList.contains("coord-rank"),
             dataFile: f.dataset.file, dataRank: f.dataset.rank, h8file: s.classList.contains("coord-file") };
  });
  check("демо: координаты — классы и data-атрибуты на краевых клетках",
    coords.file && coords.rank && coords.dataFile === "a" && coords.dataRank === "1" && !coords.h8file,
    JSON.stringify(coords));
  // Тёмная клетка — та, у которой сумма вертикали и горизонтали чётная: a1
  // тёмная, h1 светлая. Иначе доска выглядит перевёрнутой по цвету.
  const squares = await page.evaluate(() => {
    const of = (sq) => document.querySelector('.chessjax-cell[data-square="' + sq + '"]').className;
    return { a1: /square-dark/.test(of("a1")), h1: /square-light/.test(of("h1")),
             a8: /square-light/.test(of("a8")), h8: /square-dark/.test(of("h8")) };
  });
  check("демо: цвет клеток как на настоящей доске (a1 тёмная, h1 светлая)",
    squares.a1 && squares.h1 && squares.a8 && squares.h8, JSON.stringify(squares));
  const summary = await page.locator(".chessjax-summary").textContent();
  check("демо: summary «Ход белых»", summary.includes("Ход белых"), summary);

  // Fullscreen: клавиша F включает режим на весь экран, эскейп — выключает.
  await page.locator('.chessjax-cell[data-square="a8"]').focus();
  await page.keyboard.press("f");
  await page.waitForTimeout(400);
  const fsOn = await page.evaluate(() => {
    const board = document.querySelector("chessjax-board");
    return { el: !!document.fullscreenElement, match: board ? board.matches(":fullscreen") : false };
  });
  check("fullscreen: F включает режим", fsOn.el && fsOn.match, JSON.stringify(fsOn));
  const liveFs = await page.locator(".chessjax-live").textContent();
  check("fullscreen: озвучка «Полноэкранный режим»", liveFs.includes("Полноэкранный"), liveFs);
  const fsBtn = await page.locator('.chessjax-btn[aria-label="Выйти из полноэкранного режима"]').count();
  check("fullscreen: кнопка ⛶ стала «Выйти из…»", fsBtn === 1, "fsBtn=" + fsBtn);
  // Выход тем же путём toggleFullscreen: повторное F → document.exitFullscreen()
  // (в headless Chromium Escape не вызывает системный выход из fullscreen).
  await page.keyboard.press("f");
  await page.waitForTimeout(400);
  const fsOff = await page.evaluate(() => document.fullscreenElement);
  check("fullscreen: повторное F выключает режим", fsOff === null, "fullscreenElement=" + fsOff);
  const liveFsOff = await page.locator(".chessjax-live").textContent();
  check("fullscreen: озвучка выключения", liveFsOff.includes("выключен"), liveFsOff);

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
  const b5 = await page.locator('.chessjax-cell[data-square="b5"]').getAttribute("aria-label");
  check("story: 10-й ход — конь белых на b5", b5 === "Белый конь B5", b5);
  const summary = await page.locator(".chessjax-summary").textContent();
  check("story: после 10-го хода ход чёрных", summary.includes("Ход чёрных"), summary);

  // Анонс перед доской: невидимая область, которую скринридер читает при
  // листании документа, — «Шахматная доска, область» и подсказка про Enter.
  const introEl = page.locator("chessjax-board .chessjax-board-intro");
  check("анонс: элемент перед доской есть", (await introEl.count()) === 1);
  const introInfo = await page.evaluate(() => {
    const board = document.querySelector("chessjax-board");
    const el = board.querySelector(".chessjax-board-intro");
    const grid = board.querySelector(".chessjax-board");
    return {
      role: el.getAttribute("role"),
      tabindex: el.getAttribute("tabindex"),
      label: el.getAttribute("aria-label"),
      before: el.compareDocumentPosition(grid) & Node.DOCUMENT_POSITION_FOLLOWING ? true : false,
      width: el.getBoundingClientRect().width,
    };
  });
  check("анонс: роль «область»", introInfo.role === "region", introInfo.role);
  check("анонс: доступен с клавиатуры", introInfo.tabindex === "0", String(introInfo.tabindex));
  check("анонс: назван и подсказывает Enter",
    /Шахматная доска/.test(introInfo.label || "") && /Enter/.test(introInfo.label || ""), introInfo.label);
  check("анонс: стоит перед сеткой", introInfo.before);
  check("анонс: скрыт визуально", introInfo.width <= 1, String(introInfo.width));

  // Enter на анонсе — фокус в доску, на активную клетку.
  await introEl.focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(200);
  const afterEnter = await page.evaluate(() => {
    const a = document.activeElement;
    return { cls: a.className, square: a.getAttribute("data-square") };
  });
  check("Enter на анонсе ставит фокус в клетку", /chessjax-cell/.test(afterEnter.cls || ""), JSON.stringify(afterEnter));

  // И этот фокус — внутри области-приложения: именно туда скринридер отдаёт
  // клавиши, поэтому стрелки после Enter ходят по клеткам, а не по тексту.
  const insideApp = await page.evaluate(() => {
    const app = document.querySelector(".chessjax-board");
    return !!(app && document.activeElement && app.contains(document.activeElement));
  });
  check("Enter на анонсе вводит фокус внутрь приложения", insideApp);

  // Клик по клетке — тоже вход в доску: фокус встаёт на неё. Кликаем по a8:
  // дальше идут проверки стрелок, которые считают клетку a8 активной.
  await page.locator('.chessjax-cell[data-square="a8"]').click();
  await page.waitForTimeout(200);
  const afterClick = await page.evaluate(() => {
    const a = document.activeElement;
    return { square: a.getAttribute("data-square"), tabindex: a.getAttribute("tabindex") };
  });
  check("клик по клетке ставит фокус и tabindex", afterClick.square === "a8" && afterClick.tabindex === "0", JSON.stringify(afterClick));

  // Овервью по входу фокуса: «Шахматная доска. …». Подсказка не должна звать
  // вручную включать режим редактирования NVDA: с v0.6.5 NVDA включает его сам
  // на фокусе, а NVDA+Space по такой подсказке вернул бы человека в режим
  // чтения и отобрал у доски стрелки.
  await page.locator('.chessjax-cell[data-square="a8"]').focus();
  await page.waitForTimeout(200);
  const intro = await page.locator(".chessjax-live").textContent();
  check("intro по фокусу: Шахматная доска", intro.includes("Шахматная доска"), intro);
  check("intro не зовёт включать режим NVDA руками", !/режим редактирования NVDA/.test(intro), intro);
  check("intro оставляет запасной путь для JAWS", /JAWS/.test(intro), intro);

  // Стрелки ↑/↓ — по клеткам (roving tabindex): a8 → a7 → a8.
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(80);
  const cur1 = await page.evaluate(() => document.activeElement.getAttribute("data-square"));
  check("стрелка вниз: a8 → a7", cur1 === "a7", cur1);
  const a7 = await page.locator('.chessjax-cell[data-square="a7"]').getAttribute("aria-label");
  check("a7 озвучен (Чёрная пешка A7)", a7 === "Чёрная пешка A7", a7);
  await page.keyboard.press("ArrowUp");
  await page.waitForTimeout(80);
  const cur2 = await page.evaluate(() => document.activeElement.getAttribute("data-square"));
  check("стрелка вверх: a7 → a8", cur2 === "a8", cur2);

  // Стрелки ←/→ — как ↑/↓, по клеткам (roving tabindex): a8 → b8 → a8;
  // до конца ряда и обратно — a8 … h8 → g8.
  await page.locator('.chessjax-cell[data-square="a8"]').focus();
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(80);
  const curR = await page.evaluate(() => document.activeElement.getAttribute("data-square"));
  check("стрелка вправо: a8 → b8", curR === "b8", curR);
  await page.keyboard.press("ArrowLeft");
  await page.waitForTimeout(80);
  const curL = await page.evaluate(() => document.activeElement.getAttribute("data-square"));
  check("стрелка влево: b8 → a8", curL === "a8", curL);
  for (let i = 0; i < 7; i++) {
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(25);
  }
  const curR7 = await page.evaluate(() => document.activeElement.getAttribute("data-square"));
  check("стрелка вправо до конца ряда: a8 → h8", curR7 === "h8", curR7);
  await page.keyboard.press("ArrowLeft");
  await page.waitForTimeout(80);
  const curL2 = await page.evaluate(() => document.activeElement.getAttribute("data-square"));
  check("стрелка влево: h8 → g8", curL2 === "g8", curL2);

  // Ctrl+←/→ — перемотка ходов с озвучкой фигуры. Доска на 10-м ходу белых
  // (10.Nxb5); вправо → 10...cxb5 (чёрные), влево → снова белые.
  // Номер хода тут намеренно не звучит: ход озвучивается малословно, без
  // номера (номер и цвет слышны только в паузе авто-шоу) — поэтому проверяем
  // фигуру и поле, а не номер.
  await page.keyboard.press("Control+ArrowRight");
  await page.waitForTimeout(250);
  const liveR = await page.locator(".chessjax-live").textContent();
  check("Ctrl+вправо: ход чёрных, пешка бьёт b5", liveR.includes("чёрная") && liveR.includes("b5"), liveR);
  await page.keyboard.press("Control+ArrowLeft");
  await page.waitForTimeout(250);
  const liveL = await page.locator(".chessjax-live").textContent();
  check("Ctrl+влево: ход белых, конь бьёт b5", liveL.includes("белый") && liveL.includes("b5"), liveL);
  check("Ctrl+влево: названа фигура (конь)", liveL.includes("конь"), liveL);

  // Фокус остаётся на той же клетке после смены хода Ctrl+стрелкой.
  await page.keyboard.press("ArrowDown"); // g8 → g7
  await page.waitForTimeout(80);
  await page.keyboard.press("Control+ArrowRight"); // смена хода, фокус должен вернуться на g7
  await page.waitForTimeout(250);
  const still = await page.evaluate(() => document.activeElement.getAttribute("data-square"));
  check("фокус восстановлен на g7 после смены хода Ctrl+стрелкой", still === "g7", still);

  // Регрессия (живой баг Дениза 13.09): ход не пересобирает клетки. Раньше
  // _show() звал replaceChildren, сфокусированная клетка исчезала, и скринридер
  // на каждом ходе заново объявлял контейнер («Шахматная доска, Шахматная
  // доска, раздел»), а буквенные клавиши доски терялись.
  const b5Before = await page.evaluate(() => {
    const cell = document.querySelector('.chessjax-cell[data-square="b5"]');
    const svg = cell.firstElementChild;
    return { label: cell.getAttribute("aria-label"), markup: svg ? svg.innerHTML : "" };
  });
  await page.evaluate(() => {
    window.__cells = {};
    for (const c of document.querySelectorAll(".chessjax-cell")) window.__cells[c.dataset.square] = c;
  });
  await page.keyboard.press("Control+ArrowLeft"); // назад: 10.Nxb5 — на b5 снова конь
  await page.waitForTimeout(250);
  const afterMove = await page.evaluate(() => {
    const cells = document.querySelectorAll(".chessjax-cell");
    let same = 0;
    for (const c of cells) if (window.__cells[c.dataset.square] === c) same++;
    return {
      total: cells.length,
      same,
      focused: document.activeElement.dataset.square || null,
      b5: (() => {
        const cell = document.querySelector('.chessjax-cell[data-square="b5"]');
        const svg = cell.firstElementChild;
        return { label: cell.getAttribute("aria-label"), markup: svg ? svg.innerHTML : "" };
      })(),
      isSvg: !!document.querySelector('.chessjax-cell[data-square="b5"] svg.chessjax-piece'),
    };
  });
  check("ход не пересобирает клетки (те же 64 узла)",
    afterMove.total === 64 && afterMove.same === 64, JSON.stringify({ total: afterMove.total, same: afterMove.same }));
  check("фокус пережил ход (не улетел в body)", afterMove.focused === "g7", afterMove.focused);
  check("клетка b5 перекрашена после хода",
    afterMove.b5.label !== b5Before.label && /конь/i.test(afterMove.b5.label) &&
    afterMove.isSvg && afterMove.b5.markup !== b5Before.markup,
    JSON.stringify({ was: b5Before.label, now: afterMove.b5.label,
                     svg: afterMove.isSvg, redrawn: afterMove.b5.markup !== b5Before.markup }));
  // Возвращаем доску на 10...cxb5 — на этой позиции стоят следующие проверки.
  await page.keyboard.press("Control+ArrowRight");
  await page.waitForTimeout(250);

  // Справка по H: разделы листаются по кругу, после последнего — закрытие.
  await page.locator('.chessjax-cell[data-square="a7"]').focus();
  await page.waitForTimeout(150);
  await page.keyboard.press("h");
  await page.waitForTimeout(150);
  const help1 = await page.locator(".chessjax-live").textContent();
  const helpOpen = await page.locator(".chessjax-help").isVisible().catch(() => false);
  check("H: открыта справка (раздел навигации)", helpOpen && help1.includes("Навигация"), help1);
  await page.keyboard.press("h");
  await page.waitForTimeout(150);
  const help2 = await page.locator(".chessjax-live").textContent();
  check("H: раздел ходов и комментариев", help2.toLowerCase().includes("комментар") && help2.toLowerCase().includes("контрол"), help2);
  await page.keyboard.press("h");
  await page.waitForTimeout(150);
  const help3 = await page.locator(".chessjax-live").textContent();
  check("H: раздел воспроизведения", help3.includes("Пробел"), help3);
  await page.keyboard.press("h");
  await page.keyboard.press("h");
  await page.waitForTimeout(150);
  const helpClosed = await page.locator(".chessjax-help").isVisible().catch(() => false);
  const helpEnd = await page.locator(".chessjax-live").textContent();
  check("H: после разделов справка закрыта", !helpClosed && helpEnd.includes("закрыта"), helpEnd);

  // Пробел — продолжить с текущего хода (клавиши поменялись в v0.6.1:
  // с начала партии играет Ctrl+Пробел). Тик озвучивает следующий ход —
  // 11.Bxb5+.
  await page.locator('.chessjax-cell[data-square="a7"]').focus();
  await page.keyboard.press("Space");
  await page.waitForTimeout(3200);
  const spaceMove = await page.locator(".chessjax-live").textContent();
  check("Пробел: продолжил с текущего хода (слон бьёт b5)", spaceMove.includes("слон") && spaceMove.includes("b5"), spaceMove);
  // Второй Пробел — пауза, и только тут слышны номер хода и цвет.
  await page.keyboard.press("Space");
  await page.waitForTimeout(250);
  const spacePause = await page.locator(".chessjax-live").textContent();
  check("Пробел: пауза с номером хода и цветом", spacePause.includes("Остановлено") && /бел|чёрн/.test(spacePause), spacePause);

  // Кнопка текста move=17 → доска показывает мат: ладья белых на d8, озвучка «мат».
  await page.locator('button[chess="morphy"][move="17"]').click();
  await page.waitForTimeout(250);
  const d8 = await page.locator('.chessjax-cell[data-square="d8"]').getAttribute("aria-label");
  check("story: после move=17 ладья на d8", d8 === "Белая ладья D8", d8);
  const live = await page.locator(".chessjax-live").textContent();
  check("story: озвучен мат ладьёй на d8", live.includes("мат") && live.includes("ладья") && live.includes("d8"), live);

  // Кнопка текста move=16 (жертва ферзя) — озвучка «шах».
  await page.locator('button[chess="morphy"][move="16"]').click();
  await page.waitForTimeout(250);
  const live16 = await page.locator(".chessjax-live").textContent();
  check("story: озвучен шах ферзём на b8", live16.includes("ферзь") && live16.includes("b8") && live16.includes("шах"), live16);

  // Кнопка навигации «предыдущий» работает (подпись в aria-label, не в тексте).
  await page.locator('.chessjax-btn[aria-label="Предыдущий ход"]').click();
  await page.waitForTimeout(250);
  const livePrev = await page.locator(".chessjax-live").textContent();
  check("story: prev озвучил 15-й ход (конь бьёт d7)", livePrev.includes("конь") && livePrev.includes("d7"), livePrev);

  check("story: нет pageerrors", errors.length === 0, errors.join(" | "));
  await page.close();
}

// --- examples/variations.html: комментарии + $[…] вариант ---------------------

{
  const { page, errors } = await openPage("/examples/variations.html");
  await page.waitForTimeout(400);

  // Доска стартует на move=2 → после 2.Nf3; там комментарий и вариант.
  await page.locator('.chessjax-cell[data-square="a8"]').focus();
  await page.waitForTimeout(200);

  // Назад-вперёд, чтобы озвучился ход 2.Nf3 с комментарием.
  await page.keyboard.press("Control+ArrowLeft");
  await page.waitForTimeout(200);
  await page.keyboard.press("Control+ArrowRight");
  await page.waitForTimeout(250);
  const liveC = await page.locator(".chessjax-live").textContent();
  check("var: комментарий после 2.Nf3 озвучен", liveC.includes("Комментарий") && liveC.includes("итальянская партия"), liveC);
  check("var: подсказка «клавиша V»", liveC.includes("клавиша V"), liveC);

  // V — вход в вариант: первый ход Bc4, слон на c4, клетки хода подсвечены.
  await page.keyboard.press("v");
  await page.waitForTimeout(250);
  const liveV = await page.locator(".chessjax-live").textContent();
  check("var: V — «Вариант: Слон…»", liveV.includes("Вариант") && liveV.toLowerCase().includes("слон"), liveV);
  const c4 = await page.locator('.chessjax-cell[data-square="c4"]').getAttribute("aria-label");
  check("var: слон белых на c4", c4 === "Белый слон C4", c4);
  const hlTo = await page.locator('.chessjax-cell[data-square="c4"]').evaluate((el) => el.classList.contains("variant-highlight"));
  check("var: клетка c4 подсвечена", hlTo, "no highlight on c4");
  const hlFrom = await page.locator('.chessjax-cell[data-square="f1"]').evaluate((el) => el.classList.contains("variant-highlight"));
  check("var: клетка f1 подсвечена (from)", hlFrom, "no highlight on f1");

  // V повторно — финал варианта (последний ход Nc6).
  await page.keyboard.press("v");
  await page.waitForTimeout(250);
  const liveEnd = await page.locator(".chessjax-live").textContent();
  check("var: повторное V — финал варианта", liveEnd.includes("Финал"), liveEnd);

  // Esc — выход из варианта, возврат в основную линию.
  await page.keyboard.press("Escape");
  await page.waitForTimeout(250);
  const liveEsc = await page.locator(".chessjax-live").textContent();
  check("var: Esc — выход из варианта", liveEsc.includes("Выход из варианта"), liveEsc);

  // Ход без варианта: V → «У этого хода нет варианта.»
  await page.keyboard.press("Control+ArrowRight"); // после 2...Nc6 — варианта нет
  await page.waitForTimeout(250);
  await page.keyboard.press("v");
  await page.waitForTimeout(250);
  const liveNo = await page.locator(".chessjax-live").textContent();
  check("var: V на ход без варианта — «нет варианта»", liveNo.includes("нет варианта"), liveNo);

  check("var: нет pageerrors", errors.length === 0, errors.join(" | "));
  await page.close();
}

await browser.close();
console.log(failed === 0 ? "Все DOM-проверки прошли." : "Провалов: " + failed);
process.exit(failed === 0 ? 0 : 1);
