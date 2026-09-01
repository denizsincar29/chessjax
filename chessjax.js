// chessjax — доступный рендер шахматных позиций и партий для скринридеров.
//
// Использование (имя кастомного элемента обязано содержать дефис):
//   <chessjax-board id="carlsen" pgn="Carlsen.pgn" move="25"></chessjax-board>
//   <chessjax-board fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"></chessjax-board>
//   <button chess="carlsen" move="29">29-й ход</button> — переключение доски из текста.
//
// Подключение самодостаточное: <script type="module" src="chessjax.js"></script>.
// Движок ходов (применение SAN к позиции) — вендоренная копия chess.js 0.13.4
// (vendor/chess.js); страница может подставить свой движок как globalThis.Chess.

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

// Язык по умолчанию — модульная переменная, а не поле chessjax: компонент
// может апгрейдиться при customElements.define раньше инициализации экспортов.
let defaultLanguage = "ru";
const FILES = "abcdefgh";
const RANKS = "87654321";

// --- i18n -----------------------------------------------------------------

const I18N = {
  ru: {
    board: "Шахматная доска",
    col: "колонка",
    row: "ряд",
    pieces: { k: "король", q: "ферзь", r: "ладья", b: "слон", n: "конь", p: "пешка" },
    gender: { k: "m", q: "m", r: "f", b: "m", n: "m", p: "f" },
    color: { m: { w: "белый", b: "чёрный" }, f: { w: "белая", b: "чёрная" } },
    white: "Белые",
    black: "Чёрные",
    none: "нет фигур",
    turn: (c) => (c === "w" ? "Ход белых" : "Ход чёрных"),
    start: "Начальная позиция",
    move: "Ход",
    prev: "Предыдущий ход",
    next: "Следующий ход",
    play: "Показать ходы по порядку",
    stop: "Остановить показ ходов",
    restart: "В начало",
    fullscreen: "Во весь экран",
    exitFullscreen: "Выйти из полноэкранного режима",
    fullscreenOn: "Полноэкранный режим",
    fullscreenOff: "Полноэкранный режим выключен",
    gameAnalysis: "Анализ партии",
    gameAnalysisOn: "Анализ партии включён",
    gameAnalysisOff: "Анализ партии выключен",
    roosterOn: "Скрытый режим роустера включён",
    roosterOff: "Роустер выключен",
    analyzing: "Идёт анализ…",
    score: "Оценка",
    bestMove: "Лучший ход",
    mateIn: (n) => "мат в " + n,
    analysisCleared: "Анализ снят",
    analysisError: "Анализ: не удалось загрузить движок",
    verdict: {
      great: "Прекрасный ход",
      good: "Хороший ход",
      interesting: "Интересный ход",
      inaccuracy: "Неточность",
      mistake: "Ошибка",
      blunder: "Грубая ошибка",
    },
    rooster: {
      great: "Ооо, прекрасно!",
      greatCapture: (p) => "Ооо, прекрасно съел " + { p: "пешку", n: "коня", b: "слона", r: "ладью", q: "ферзя", k: "короля" }[p] + "!",
      good: "Неплохо!",
      interesting: "О, интересно...",
      inaccuracy: "Так себе, но вроде ладно...",
      mistake: "Хм, не лучшая идея...",
      blunder: "Ход полная хрень!",
    },
    adv: { w: "Преимущество белых", b: "Преимущество чёрных" },
    equalPosition: "Позиция равная",
    intro: "Шахматная доска. Для взаимодействия включите режим редактирования NVDA или режим форм JAWS. Клавиша H — инструкция по управлению.",
    help: [
      "Навигация по доске. Стрелки вверх, вниз, влево и вправо — перейти на соседнюю клетку. На клетке с фигурой вы услышите фигуру и координаты.",
      "Ходы и комментарии. Контрол и стрелки влево и вправо — предыдущий и следующий ход. Ход озвучивается фигурой и координатами, после него читается комментарий из записи партии.",
      "Воспроизведение. Пробел — автоматический просмотр ходов с начала партии. Контрол и пробел — продолжить с текущего хода, повторное нажатие — пауза.",
      "Варианты и эта справка. Если у хода есть альтернативные ходы в скобках доллар — клавиша V их проигрывает, повторное нажатие показывает финал, клавиша эскейп возвращает в партию. Под доской: в начало, предыдущий ход, автопросмотр, следующий ход, во весь экран, лучший ход, анализ партии. Клавиша F — увеличить доску на весь экран, повторное нажатие или эскейп — вернуть. Клавиша B — лучший ход в текущей позиции: оценка и ход движка. Клавиша A — анализ партии: каждый ход с вердиктом и преимуществом, повторное нажатие — выключить. Удерживайте A две секунды — скрытый режим роустера с неформальными вердиктами. Клавиша H — следующий раздел инструкции, после последнего она закрывается.",
    ],
    helpEnd: "Инструкция закрыта.",
    commentLabel: "Комментарий",
    variationLabel: "Вариант",
    pressV: "есть вариант — клавиша V проиграть",
    noVariation: "У этого хода нет варианта.",
    variationEnd: "Финал варианта",
    variationExit: "Выход из варианта",
    by: { w: "Белые", b: "Чёрные" },
    takes: "бьёт",
    castleShort: "короткая рокировка",
    castleLong: "длинная рокировка",
    check: "шах",
    checkmate: "мат",
    promotes: "превращение в",
    empty: "пустое поле",
    langName: "Русский",
  },
  en: {
    board: "Chessboard",
    col: "file",
    row: "rank",
    pieces: { k: "king", q: "queen", r: "rook", b: "bishop", n: "knight", p: "pawn" },
    gender: { k: "m", q: "f", r: "f", b: "m", n: "m", p: "f" },
    color: { m: { w: "white", b: "black" }, f: { w: "white", b: "black" } },
    white: "White",
    black: "Black",
    none: "no pieces",
    turn: (c) => (c === "w" ? "White to move" : "Black to move"),
    start: "Starting position",
    move: "Move",
    prev: "Previous move",
    next: "Next move",
    play: "Play through moves",
    stop: "Stop playing moves",
    restart: "Back to start",
    fullscreen: "Fullscreen",
    exitFullscreen: "Exit fullscreen",
    fullscreenOn: "Fullscreen mode",
    fullscreenOff: "Fullscreen mode off",
    gameAnalysis: "Game analysis",
    gameAnalysisOn: "Game analysis on",
    gameAnalysisOff: "Game analysis off",
    roosterOn: "Hidden rooster mode on",
    roosterOff: "Rooster mode off",
    analyzing: "Analyzing…",
    score: "Score",
    bestMove: "Best move",
    mateIn: (n) => "mate in " + n,
    analysisCleared: "Analysis cleared",
    analysisError: "Analysis: could not load engine",
    verdict: {
      great: "Brilliant move",
      good: "Good move",
      interesting: "Interesting move",
      inaccuracy: "Inaccuracy",
      mistake: "Mistake",
      blunder: "Blunder",
    },
    rooster: {
      great: "Oh, brilliant!",
      greatCapture: (p, pieces) => "Oh, brilliantly gobbled the " + pieces[p] + "!",
      good: "Not bad!",
      interesting: "Hmm, interesting...",
      inaccuracy: "Meh, fine I guess...",
      mistake: "Hmm, not your best idea...",
      blunder: "That move is total crap!",
    },
    adv: { w: "White advantage", b: "Black advantage" },
    equalPosition: "Equal position",
    intro: "Chessboard. To interact, switch NVDA to focus mode or JAWS to forms mode. Press H for usage instructions.",
    help: [
      "Board navigation. Arrow up, down, left and right move to a neighbouring square. On a square with a piece you hear the piece and its coordinates.",
      "Moves and comments. Control plus arrow left and right step to the previous and next move. Each move is announced with the piece and squares, followed by the comment from the game record.",
      "Playback. Space starts automatic playthrough from the beginning of the game. Control plus space continues from the current move; pressing again pauses.",
      "Variations and this help. If a move has alternative moves in dollar brackets, press V to play them, press V again to jump to the variation end, press escape to return to the game. Below the board: restart, previous move, play, next move, fullscreen, best move, game analysis. Press F for fullscreen, press again or escape to exit. Press B for the best move in the current position: score and the engine's move. Press A to toggle game analysis: each move with a verdict and the advantage; press again to turn off. Hold A for two seconds to enable the hidden rooster mode with informal verdicts. Press H for the next help section; after the last one it closes.",
    ],
    helpEnd: "Help closed.",
    commentLabel: "Comment",
    variationLabel: "Variation",
    pressV: "a variation is available — press V to play it",
    noVariation: "This move has no variation.",
    variationEnd: "Variation end",
    variationExit: "Left the variation",
    by: { w: "White", b: "Black" },
    takes: "takes",
    castleShort: "short castling",
    castleLong: "long castling",
    check: "check",
    checkmate: "checkmate",
    promotes: "promotes to",
    empty: "empty square",
    langName: "English",
  },
  de: {
    board: "Schachbrett",
    col: "Linie",
    row: "Reihe",
    pieces: { k: "König", q: "Dame", r: "Turm", b: "Läufer", n: "Springer", p: "Bauer" },
    gender: { k: "m", q: "f", r: "m", b: "m", n: "m", p: "m" },
    color: { m: { w: "weißer", b: "schwarzer" }, f: { w: "weiße", b: "schwarze" } },
    white: "Weiß",
    black: "Schwarz",
    none: "keine Figuren",
    turn: (c) => (c === "w" ? "Weiß am Zug" : "Schwarz am Zug"),
    start: "Anfangsposition",
    move: "Zug",
    prev: "Vorheriger Zug",
    next: "Nächster Zug",
    play: "Züge nacheinander",
    stop: "Anzeige stoppen",
    restart: "Zum Anfang",
    fullscreen: "Vollbild",
    exitFullscreen: "Vollbild beenden",
    fullscreenOn: "Vollbildmodus",
    fullscreenOff: "Vollbildmodus aus",
    gameAnalysis: "Partieanalyse",
    gameAnalysisOn: "Partieanalyse an",
    gameAnalysisOff: "Partieanalyse aus",
    roosterOn: "Versteckter Hahn-Modus an",
    roosterOff: "Hahn-Modus aus",
    analyzing: "Analyse läuft…",
    score: "Bewertung",
    bestMove: "Bester Zug",
    mateIn: (n) => "Matt in " + n,
    analysisCleared: "Analyse entfernt",
    analysisError: "Analyse: Engine konnte nicht geladen werden",
    verdict: {
      great: "Großer Zug",
      good: "Guter Zug",
      interesting: "Interessanter Zug",
      inaccuracy: "Ungenauigkeit",
      mistake: "Fehler",
      blunder: "Schwerer Fehler",
    },
    rooster: {
      great: "Oh, großartig!",
      greatCapture: (p, pieces) => "Oh, großartig den " + pieces[p] + " geschlagen!",
      good: "Nicht schlecht!",
      interesting: "Hmm, interessant...",
      inaccuracy: "Naja, geht so...",
      mistake: "Hmm, keine gute Idee...",
      blunder: "Der Zug ist totaler Mist!",
    },
    adv: { w: "Weißer Vorteil", b: "Schwarzer Vorteil" },
    equalPosition: "Ausgeglichene Stellung",
    intro: "Schachbrett. Zum Bedienen NVDA in den Fokusmodus oder JAWS in den Formularmodus schalten. Taste H — Bedienungsanleitung.",
    help: [
      "Brett-Navigation. Pfeil hoch, runter, links und rechts — benachbarte Felder. Auf einem Feld mit einer Figur hören Sie die Figur und die Koordinaten.",
      "Züge und Kommentare. Strg plus Pfeil links und rechts — vorheriger und nächster Zug. Der Zug wird mit Figur und Feldern angesagt, danach der Kommentar aus der Partie.",
      "Wiedergabe. Leertaste — automatisches Abspielen der Züge von Anfang an. Strg und Leertaste — vom aktuellen Zug weiter; erneut drücken — Pause.",
      "Varianten und diese Hilfe. Hat ein Zug alternative Züge in Dollar-Klammern — Taste V spielt sie ab, erneut drücken springt zum Variantenende, Escape führt zur Partie zurück. Unter dem Brett: zum Anfang, vorheriger Zug, Abspielen, nächster Zug, Vollbild, bester Zug, Partieanalyse. Taste F — Vollbild, erneut drücken oder Escape — verlassen. Taste B — bester Zug in der aktuellen Stellung: Bewertung und Engine-Zug. Taste A — Partieanalyse: jeder Zug mit Urteil und Vorteil; erneut drücken — aus. Taste A zwei Sekunden gedrückt halten — versteckter Hahn-Modus mit lockeren Urteilen. Taste H — nächster Hilfeabschnitt; nach dem letzten schließt er sich.",
    ],
    helpEnd: "Hilfe geschlossen.",
    commentLabel: "Kommentar",
    variationLabel: "Variante",
    pressV: "eine Variante ist verfügbar — Taste V zum Abspielen",
    noVariation: "Dieser Zug hat keine Variante.",
    variationEnd: "Varianten-Ende",
    variationExit: "Variante verlassen",
    by: { w: "Weiß", b: "Schwarz" },
    takes: "schlägt",
    castleShort: "kurze Rochade",
    castleLong: "lange Rochade",
    check: "Schach",
    checkmate: "Schachmatt",
    promotes: "Umwandlung in",
    empty: "leeres Feld",
    langName: "Deutsch",
  },
  tr: {
    board: "Satranç tahtası",
    col: "sütun",
    row: "sıra",
    pieces: { k: "şah", q: "vezir", r: "kale", b: "fil", n: "at", p: "piyon" },
    gender: { k: "m", q: "f", r: "f", b: "m", n: "m", p: "m" },
    color: { m: { w: "beyaz", b: "siyah" }, f: { w: "beyaz", b: "siyah" } },
    white: "Beyaz",
    black: "Siyah",
    none: "taş yok",
    turn: (c) => (c === "w" ? "Beyaz oynar" : "Siyah oynar"),
    start: "Başlangıç konumu",
    move: "Hamle",
    prev: "Önceki hamle",
    next: "Sonraki hamle",
    play: "Hamleleri sırayla göster",
    stop: "Gösterimi durdur",
    restart: "Başa dön",
    fullscreen: "Tam ekran",
    exitFullscreen: "Tam ekrandan çık",
    fullscreenOn: "Tam ekran modu",
    fullscreenOff: "Tam ekran modu kapalı",
    gameAnalysis: "Oyun analizi",
    gameAnalysisOn: "Oyun analizi açık",
    gameAnalysisOff: "Oyun analizi kapalı",
    roosterOn: "Gizli horoz modu açık",
    roosterOff: "Horoz modu kapalı",
    analyzing: "Analiz ediliyor…",
    score: "Değerlendirme",
    bestMove: "En iyi hamle",
    mateIn: (n) => n + " hamlede mat",
    analysisCleared: "Analiz kaldırıldı",
    analysisError: "Analiz: motor yüklenemedi",
    verdict: {
      great: "Harika hamle",
      good: "İyi hamle",
      interesting: "İlginç hamle",
      inaccuracy: "Yanlışlık",
      mistake: "Hata",
      blunder: "Büyük hata",
    },
    rooster: {
      great: "Oh, harika!",
      greatCapture: (p, pieces) => "Oh, " + pieces[p] + " almak harika!",
      good: "Fena değil!",
      interesting: "Hmm, ilginç...",
      inaccuracy: "Eh, idare eder...",
      mistake: "Hmm, iyi fikir değil...",
      blunder: "Bu hamle tam bir çöp!",
    },
    adv: { w: "Beyaz avantaj", b: "Siyah avantaj" },
    equalPosition: "Konum dengede",
    intro: "Satranç tahtası. Etkileşim için NVDA'da odak moduna veya JAWS'ta form moduna geçin. Kullanım talimatları için H tuşu.",
    help: [
      "Tahta gezinme. Yukarı, aşağı, sol ve sağ oklar — komşu kareye geçer. Taş olan karede taşı ve koordinatları duyarsınız.",
      "Hamleler ve yorumlar. Kontrol ve sol/sağ oklar — önceki ve sonraki hamle. Hamle taş ve karelerle okunur, ardından kayıttaki yorum söylenir.",
      "Oynatma. Boşluk — hamleleri baştan otomatik oynatır. Kontrol ve boşluk — mevcut hamleden devam eder; tekrar basın — duraklatır.",
      "Varyantlar ve bu yardım. Hamlede dolar köşeli parantez içinde alternatif hamleler varsa V tuşu oynatır, tekrar basmak varyantın sonuna atlar, Escape oyuna döner. Tahtanın altında: başa dön, önceki hamle, oynat, sonraki hamle, tam ekran, en iyi hamle, oyun analizi. F tuşu — tam ekran, tekrar basmak veya Escape — çıkış. B tuşu — mevcut pozisyondaki en iyi hamle: değerlendirme ve motor hamlesi. A tuşu — oyun analizi: her hamle için yorum ve avantaj; tekrar basın — kapatır. A tuşuna iki saniye basılı tutun — gayriresmî yorumlar veren gizli horoz modu. H tuşu — sonraki yardım bölümü; sonuncusundan sonra kapanır.",
    ],
    helpEnd: "Yardım kapatıldı.",
    commentLabel: "Yorum",
    variationLabel: "Varyant",
    pressV: "varyant var — oynatmak için V tuşu",
    noVariation: "Bu hamlenin varyantı yok.",
    variationEnd: "Varyant sonu",
    variationExit: "Varyanttan çıkıldı",
    by: { w: "Beyaz", b: "Siyah" },
    takes: "alır",
    castleShort: "kısa rok",
    castleLong: "uzun rok",
    check: "şah",
    checkmate: "mat",
    promotes: "terfi",
    empty: "boş kare",
    langName: "Türkçe",
  },
};

function pieceLabel(piece, lang) {
  const t = I18N[lang] || I18N.ru;
  return t.color[t.gender[piece.piece]][piece.color] + " " + t.pieces[piece.piece];
}

// --- FEN ------------------------------------------------------------------

export function parseFen(fen) {
  if (typeof fen !== "string") throw new Error("chessjax: FEN должен быть строкой");
  const parts = fen.trim().split(/\s+/);
  if (parts.length < 2 || parts.length > 6) throw new Error("chessjax: неверное число полей FEN");
  const [placement, sideToMove, castling = "-", ep = "-", halfmove = "0", fullmove = "1"] = parts;
  if (sideToMove !== "w" && sideToMove !== "b") throw new Error("chessjax: неверный ход в FEN");

  const board = new Map();
  const ranks = placement.split("/");
  if (ranks.length !== 8) throw new Error("chessjax: в FEN должно быть 8 рядов");
  for (let r = 0; r < 8; r++) {
    let file = 0;
    for (const ch of ranks[r]) {
      if (file >= 8) throw new Error("chessjax: ряд длиннее 8 полей");
      if (ch >= "1" && ch <= "8") { file += Number(ch); continue; }
      const low = ch.toLowerCase();
      if (!I18N.ru.pieces[low]) throw new Error("chessjax: неизвестная фигура «" + ch + "»");
      board.set(FILES[file] + RANKS[r], { color: ch === low ? "b" : "w", piece: low });
      file += 1;
    }
    if (file !== 8) throw new Error("chessjax: ряд короче 8 полей");
  }
  return { board, sideToMove, castling, ep, halfmove: Number(halfmove) || 0, fullmove: Number(fullmove) || 1 };
}

export function fenSummary(parsed, lang = "ru") {
  const t = I18N[lang] || I18N.ru;
  const groups = { w: {}, b: {} };
  for (const [square, piece] of parsed.board) {
    (groups[piece.color][piece.piece] ||= []).push(square);
  }
  const order = ["k", "q", "r", "b", "n", "p"];
  const label = (lists) =>
    order
      .map((type) => (lists[type] ? pluralize(t.pieces[type], lists[type].length, lang) + " " + lists[type].join(" ") : null))
      .filter(Boolean)
      .join(", ");
  return (
    t.white + ": " + (label(groups.w) || t.none) + ". " +
    t.black + ": " + (label(groups.b) || t.none) + ". " +
    t.turn(parsed.sideToMove) + "."
  );
}

function pluralize(noun, n, lang) {
  if (lang !== "ru") return noun;
  if (noun === "пешка") return n === 1 ? "пешка" : "пешки";
  if (noun === "конь") return n === 1 ? "конь" : "кони";
  if (noun === "слон") return n === 1 ? "слон" : "слоны";
  if (noun === "ладья") return n === 1 ? "ладья" : "ладьи";
  return noun;
}

// --- Движок ходов (chess.js) ------------------------------------------------
// Сначала host-движок из globalThis.Chess (если встроен страницей), иначе —
// вендоренная копия chess.js 0.13.4 (vendor/chess.js). Локальный вендор делает
// библиотеку самодостаточной: ни CDN, ни внешних зависимостей при подключении.

let enginePromise = null;
function engine() {
  if (globalThis.Chess) return Promise.resolve(globalThis.Chess);
  if (!enginePromise) {
    enginePromise = import("./vendor/chess.js").then((m) => {
      globalThis.Chess = m.Chess;
      return m.Chess;
    });
  }
  return enginePromise;
}

// --- PGN -------------------------------------------------------------------

// Разбирает ходы PGN (SAN) без вариантов/комментариев; возвращает массив SAN.
// Понимает и «17. Rd8#», и слитное «17.Rd8#».
export function parsePgnMoves(pgn) {
  const noComments = pgn
    .replace(/\[[^\]]*\]/g, " ") // теги [Event "…"]
    .replace(/\{[^}]*\}/g, " ") // комментарии {…}
    .replace(/\([^)]*\)/g, " "); // варианты (…)
  const tokens = noComments.split(/[\s;]+/).filter(Boolean);
  const san = [];
  for (let token of tokens) {
    if (/^(\d+)\.\.\.$/.test(token)) continue;
    if (/^(\d+)\.(.+)$/.test(token)) token = token.replace(/^(\d+)\./, ""); // «17.Rd8#»
    else if (/^\d+\.$/.test(token)) continue;
    if (/^[01]-[01]$/.test(token) || token === "1/2-1/2" || token === "*") continue;
    if (token.includes(".")) continue;
    san.push(token);
  }
  return san;
}

// Применяет ходы SAN к стартовой позиции. Возвращает массив {fen, move}:
// позиция после каждого полухода; элемент 0 — начальная позиция.
export async function applyPgn(sanMoves, startFen = START_FEN) {
  const Chess = await engine();
  const chess = new Chess(startFen);
  const positions = [{ fen: chess.fen(), move: null }];
  for (const san of sanMoves) {
    const move = chess.move(san);
    if (!move) break;
    positions.push({ fen: chess.fen(), move });
  }
  return positions;
}

// Извлекает из комментария $[ … ] — альтернативную линию (SAN-ходы варианта).
// Остаток текста остаётся читаемым комментарием.
export function splitComment(text) {
  const m = /\$\[([^\]]*)\]/.exec(text || "");
  if (!m) return { comment: (text || "").trim() || null, variation: null };
  const variation = m[1].split(/\s+/).filter(Boolean);
  const rest = (text.replace(m[0], "") || "").trim() || null;
  return { comment: rest, variation };
}

// Применяет PGN целиком, сохраняя комментарии ({…}) и варианты ($[…]) из
// встроенного парсера chess.js (get_comments). Вариант заменяет ход, после
// которого стоит комментарий: играется с позиции до хода (move.before) и
// хранится как массив move-объектов. При сбое парсинга — старый путь без
// комментариев (applyPgn). Возвращает массив {fen, move, comment, variation,
// variationFen}; элемент 0 — начальная позиция.
export async function applyPgnFull(pgn, startFen = START_FEN) {
  const Chess = await engine();
  const mk = () => [{ fen: null, move: null, comment: null, variation: null, variationFen: null }];
  const positions = mk();
  const chess = new Chess(startFen);
  positions[0].fen = chess.fen();

  let sanMoves = null;
  let byFen = new Map();
  if (typeof chess.load_pgn === "function") {
    try {
      const ok = chess.load_pgn(pgn, { sloppy: true });
      if (ok) {
        // load_pgn не хранит before/after в verbose-истории — воспроизводим
        // ходы своим движком, чтобы у каждого move были координаты хода.
        sanMoves = chess.history({ verbose: true }).map((m) => m.san);
        for (const c of chess.get_comments()) {
          const { comment, variation } = splitComment(c.comment);
          byFen.set(c.fen, { comment, variation });
        }
      }
    } catch { /* фолбэк ниже */ }
  }
  if (sanMoves === null) sanMoves = parsePgnMoves(pgn);

  const chess2 = new Chess(startFen);
  positions.length = 1;
  positions[0].fen = chess2.fen();
  for (const san of sanMoves) {
    // У chess.js 0.13.4 move-объекты не хранят before/after — фен позиции
    // до хода снимаем сами, до применения.
    const beforeFen = chess2.fen();
    const move = chess2.move(san);
    if (!move) break;
    const afterFen = chess2.fen();
    const ann = byFen.get(afterFen);
    let variation = null;
    let variationFen = null;
    if (ann && ann.variation) {
      // Вариант = альтернатива ходу move: стартует из позиции до него.
      const chessV = new Chess(beforeFen);
      variation = [];
      for (const vs of ann.variation) {
        const vm = chessV.move(vs);
        if (!vm) break;
        variation.push({ ...vm, before: beforeFen, after: chessV.fen() });
      }
      if (variation.length === 0) variation = null;
      else variationFen = beforeFen;
    }
    positions.push({ fen: afterFen, move, comment: ann ? ann.comment : null, variation, variationFen });
  }
  return positions;
}

// Позиция после moveSpec: "25" — после 25-го хода белых, "25.5" — после ответа чёрных.
export function positionIndex(moveSpec) {
  if (moveSpec === "0" || moveSpec === "start") return 0;
  const m = /^(\d+)(?:\.(\d+))?$/.exec(String(moveSpec).trim());
  if (!m) return 0;
  const base = Number(m[1]);
  return base >= 1 ? base * 2 - 1 + (Number(m[2]) >= 5 ? 1 : 0) : 0;
}

// --- Рендер таблицы и резюме -------------------------------------------------

export function renderBoard(container, fen, opts = {}) {
  const lang = opts.language || "ru";
  const parsed = parseFen(fen);
  container.replaceChildren(renderGrid(parsed, lang), renderSummary(parsed, lang));
}

// Доска — div-сетка, а НЕ HTML-таблица: NVDA в таблицах объявляет координаты
// («строка N, столбец M») и заголовки строк/колонок, что многословно. Здесь
// каждая клетка — фокусируемый div с aria-label «Чёрная пешка B7» / пустая «E5»,
// скринридер читает только его. Заголовки не нужны: координату несёт сама клетка.
function renderGrid(parsed, lang, opts = {}) {
  const activeSquare = opts.activeSquare;
  const highlight = opts.highlight; // Set квадратов хода варианта — подсветка
  const board = document.createElement("div");
  board.className = "chessjax-board";

  for (let r = 0; r < 8; r++) {
    const rank = RANKS[r];
    for (let f = 0; f < 8; f++) {
      const file = FILES[f];
      const square = file + rank;
      const cell = document.createElement("div");
      cell.className = "chessjax-cell " + ((f + r) % 2 === 0 ? "square-dark" : "square-light");
      if (highlight && highlight.has(square)) cell.classList.add("variant-highlight");
      cell.dataset.square = square;
      // roving tabindex: только активная клетка в порядке таба, остальные доступны стрелками.
      cell.tabIndex = square === activeSquare ? 0 : -1;
      const piece = parsed.board.get(square);
      if (piece) {
        cell.classList.add("has-piece", "piece-" + piece.color);
        cell.textContent = GLYPH[piece.color === "w" ? piece.piece.toUpperCase() : piece.piece];
        // «Чёрный ферзь D5» — фигура (с родом из i18n) перед координатой.
        const label = pieceLabel(piece, lang);
        cell.setAttribute("aria-label", label.charAt(0).toUpperCase() + label.slice(1) + " " + square.toUpperCase());
      } else {
        cell.textContent = " ";
        cell.setAttribute("aria-label", square.toUpperCase());
      }
      board.appendChild(cell);
    }
  }
  return board;
}

function renderSummary(parsed, lang) {
  const p = document.createElement("p");
  p.className = "chessjax-summary";
  p.textContent = fenSummary(parsed, lang);
  return p;
}

const GLYPH = {
  K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
  k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟",
};

// --- Озвучка хода -----------------------------------------------------------

function moveSpeech(move, lang) {
  const t = I18N[lang] || I18N.ru;
  // Рокировка — цвет того, кто рокирует: «Белые, короткая рокировка».
  if (move.flags.includes("k")) return t.by[move.color] + ", " + t.castleShort;
  if (move.flags.includes("q")) return t.by[move.color] + ", " + t.castleLong;
  // Фигура и цвет всегда называются: «белая пешка e2-e4», «чёрный конь c3 бьёт b5».
  const fig = pieceLabel({ piece: move.piece, color: move.color }, lang);
  let s = move.captured
    ? fig + " " + move.from + " " + t.takes + " " + move.to
    : fig + " " + move.from + "-" + move.to;
  if (move.promotion) s += ", " + t.promotes + " " + t.pieces[move.promotion];
  if (move.san.includes("#")) s += ", " + t.checkmate;
  else if (move.san.includes("+")) s += ", " + t.check;
  return s;
}

function speak(el, text) {
  el.textContent = "";
  setTimeout(() => { el.textContent = text; }, 60);
}

// --- Звуки ходов -------------------------------------------------------------
// Деревянные записи с sounddino.com (free / royalty-free / no attribution),
// нарезанные в sound/*.mp3. Разные фигуры — реальные удары разного веса
// (пешка звучит легче ладьи), взятие и рокировка — отдельными звуками.
const SOUND_FILE = { p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king" };

let audioCtx = null;
const soundCache = new Map();

function getAudioCtx() {
  if (!audioCtx && typeof AudioContext !== "undefined") {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function loadSoundFile(name) {
  if (soundCache.has(name)) return Promise.resolve(soundCache.get(name));
  const ctx = getAudioCtx();
  if (!ctx) return Promise.resolve(null);
  const url = new URL("./sound/" + name + ".mp3", import.meta.url).href;
  return fetch(url)
    .then((r) => (r.ok ? r.arrayBuffer() : null))
    .then((ab) => (ab ? ctx.decodeAudioData(ab) : null))
    .then((buf) => { soundCache.set(name, buf); return buf; })
    .catch(() => null);
}

// AudioContext создаётся/возобновляется по юзер-жесту (клик по кнопке
// навигации или ▶) — и в авто-шоу звук продолжает работать.
function playSound(name, opts = {}) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();
  loadSoundFile(name).then((buf) => {
    if (!buf) return;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = opts.gain || 1;
    src.connect(g).connect(ctx.destination);
    src.start(ctx.currentTime + (opts.delay || 0));
  });
}

// AudioContext можно разблокировать только в юзер-жесте. Авто-шоу (▶) первый
// звук даёт из setInterval — уже вне жеста, поэтому разблокируем контекст
// прямо в обработчиках кликов по кнопкам навигации.
function unlockAudio() {
  const ctx = getAudioCtx();
  if (ctx && ctx.state === "suspended") ctx.resume();
}

// --- Анализ Stockfish ----------------------------------------------------------
// Движок — Stockfish 10 (wasm) с jsdelivr (loader 62 КБ + был 358 КБ). Chrome
// блокирует прямой new Worker(cross-origin), поэтому loader качаем через fetch
// (у jsdelivr CORS *), в код подставляем абсолютный был-URL и запускаем
// Blob-worker; был движок качает сам из своего worker'а. Один инстанс на
// страницу, создаётся лениво — только при первом запросе анализа.
const SF_LOADER = "https://cdn.jsdelivr.net/npm/stockfish@10.0.2/src/stockfish.js";
const SF_WASM = "https://cdn.jsdelivr.net/npm/stockfish@10.0.2/src/stockfish.wasm";
const ANALYSIS_DEPTH = 12;

let analyzerPromise = null;
let analyzerSeq = 0;
let activeAnalysis = null; // { seq, board }

function getAnalyzer() {
  if (!analyzerPromise) {
    analyzerPromise = createAnalyzer().catch((err) => {
      analyzerPromise = null; // при сбое дать ретрай следующему запросу
      throw err;
    });
  }
  return analyzerPromise;
}

function createAnalyzer() {
  return fetch(SF_LOADER)
    .then((res) => {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.text();
    })
    .then((code) => {
      const marker = "var Module={wasmBinaryFile:WasmPath}";
      if (!code.includes(marker)) throw new Error("неподдерживаемый loader");
      code = code.replace(marker, "var Module={wasmBinaryFile:" + JSON.stringify(SF_WASM) + "}");
      const blob = new Blob([code], { type: "text/javascript" });
      const worker = new Worker(URL.createObjectURL(blob));
      return new Promise((resolve, reject) => {
        worker.onmessage = (e) => {
          if (typeof e.data === "string" && e.data.startsWith("uciok")) resolve(worker);
        };
        worker.onerror = () => reject(new Error("не удалось запустить движок"));
        worker.postMessage("uci");
        setTimeout(() => reject(new Error("движок не ответил")), 30000);
      });
    });
}

// Promise-версия одного расчёта: резолвится {type, value, best, bestmove}.
// Следующий запрос прерывает предыдущий (stop); lastInfo — последнее info с pv
// (лучший ход по ходу расчёта), bestmove — финальный ответ движка.
function analyzePosition(fen) {
  return getAnalyzer().then((worker) => {
    if (activeAnalysis) worker.postMessage("stop"); // прерываем предыдущий расчёт
    const seq = ++analyzerSeq;
    activeAnalysis = { seq };
    return new Promise((resolve, reject) => {
      let lastInfo = null;
      worker.onmessage = (e) => {
        const line = typeof e.data === "string" ? e.data : "";
        if (activeAnalysis && activeAnalysis.seq === seq) {
          if (line.startsWith("info")) {
            const r = parseInfo(line);
            if (r) lastInfo = r;
          } else if (line.startsWith("bestmove")) {
            const done = activeAnalysis;
            activeAnalysis = null;
            const bestmove = (line.match(/bestmove\s+(\S+)/) || [])[1] || null;
            resolve({
              type: lastInfo ? lastInfo.type : null,
              value: lastInfo ? lastInfo.value : 0,
              best: lastInfo ? lastInfo.best : bestmove,
              bestmove,
            });
          }
        }
      };
      worker.onerror = () => reject(new Error("worker error"));
      worker.postMessage("position fen " + fen);
      worker.postMessage("go depth " + ANALYSIS_DEPTH);
    });
  });
}

// Очередь расчётов с кэшем. Один worker на страницу, запросы выполняются строго
// последовательно; приоритетные (лучший ход по B) встают в начало очереди.
// Результат кэшируется по FEN — повторные запросы той же позиции дешёвые.
const analysisCache = new Map(); // fen → Promise<result>
const analysisQueue = []; // {fen, resolve, reject, priority}
let analysisRunning = false;

function requestAnalysis(fen, { priority = false } = {}) {
  if (analysisCache.has(fen)) return analysisCache.get(fen);
  const p = new Promise((resolve, reject) => {
    const job = { fen, resolve, reject, priority };
    if (priority) analysisQueue.unshift(job);
    else analysisQueue.push(job);
    pumpAnalysis();
  });
  analysisCache.set(fen, p); // кэшируем promise сразу — дубликатов fen не копим
  return p;
}

function pumpAnalysis() {
  if (analysisRunning || analysisQueue.length === 0) return;
  const job = analysisQueue.shift();
  analysisRunning = true;
  analyzePosition(job.fen).then(
    (result) => {
      analysisRunning = false;
      job.resolve(result);
      pumpAnalysis();
    },
    (err) => {
      analysisRunning = false;
      analysisCache.delete(job.fen); // дать ретрай следующему запросу
      job.reject(err);
      pumpAnalysis();
    }
  );
}

// Оценка позиции в сотых пешки из перспективы стороны, которая ходит.
// Мат → большая величина ±(100000 − 100·N).
function scoreToCp(r) {
  if (!r) return 0;
  if (r.type === "mate") {
    return r.value > 0 ? 100000 - 100 * r.value : -(100000 - 100 * Math.abs(r.value));
  }
  return r.value;
}

function parseInfo(line) {
  const m = /score\s+(cp|mate)\s+(-?\d+)/.exec(line);
  if (!m) return null;
  const pv = /\bpv\s+(\S+)/.exec(line);
  if (!pv) return null;
  return { type: m[1], value: Number(m[2]), best: pv[1] };
}

// --- Веб-компонент <chessjax-board> ------------------------------------------

const registeredBoards = new Set();

// В node (тесты) HTMLElement нет — компонент объявляем только в браузере.
if (typeof HTMLElement !== "undefined") {
class ChessboardElement extends HTMLElement {
  static observedAttributes = ["fen", "pgn", "move", "lang", "controls"];

  constructor() {
    super();
    this._positions = null;
    this._idx = 0;
    this._timer = null;
    this._helpIdx = 0; // 0 = справка закрыта; 1..N = открыт раздел
    this._variant = null; // режим варианта: {positions, idx} альтернативной линии
    this._activeSquare = "a8"; // roving tabindex: клетка, с которой начинают навигацию стрелками
    this._wasFull = false; // прошлое состояние fullscreen — чтобы озвучивать только реальные переходы
    this._analysis = null; // результат анализа: {type, value, best} последнего info с pv
    this._analyzing = false; // идёт ли расчёт прямо сейчас
    this._analysisFen = null; // фен позиции, по которой запущен текущий анализ
    this._analysisMode = "off"; // анализ партии: вердикт каждому ходу при навигации
    this._rooster = false; // скрытый режим роустера: неформальные вердикты
    this._aLongTimer = null; // таймер длинного нажатия A (2 сек → роустер)
    this._aLongDone = false; // сработало ли длинное нажатие — чтобы keyup не дёрнул режим партии
    this._root = this.attachShadow ? null : this; // Shadow DOM отключён: таблица должна оставаться в светлом DOM для скринридеров.
  }

  get lang() {
    return this.getAttribute("lang") || defaultLanguage;
  }

  connectedCallback() {
    if (!this._root) this._root = this;
    registeredBoards.add(this);
    this._renderShell();
    this._initialized = true;
    this._load();
    this._onFsChange = () => this._updateFullButton();
    document.addEventListener("fullscreenchange", this._onFsChange);
  }

  disconnectedCallback() {
    registeredBoards.delete(this);
    if (this._timer) clearInterval(this._timer);
    if (this._onFsChange) document.removeEventListener("fullscreenchange", this._onFsChange);
  }

  attributeChangedCallback(name, _old, value) {
    // В момент upgrade (innerHTML, статичный HTML) атрибуты приходят раньше
    // connectedCallback — _tableWrap ещё нет, а начальные значения обработает
    // сам connectedCallback. Здесь реагируем только на runtime-изменения.
    if (!this.isConnected || !this._initialized) return;
    this._load();
  }

  _renderShell() {
    const lang = this.lang;
    const t = I18N[lang] || I18N.ru;
    this.replaceChildren();

    const wrap = document.createElement("div");
    wrap.className = "chessjax";

    this._tableWrap = document.createElement("div");
    this._tableWrap.className = "chessjax-board-wrap";
    wrap.appendChild(this._tableWrap);

    this._summary = document.createElement("p");
    this._summary.className = "chessjax-summary";
    wrap.appendChild(this._summary);

    const controls = document.createElement("div");
    controls.className = "chessjax-controls";
    controls.setAttribute("role", "group");
    controls.setAttribute("aria-label", t.board);
    this._btnRestart = mkButton(t.restart, "⏮", () => { unlockAudio(); this.goTo("start"); });
    this._btnPrev = mkButton(t.prev, "←", () => { unlockAudio(); this.prev(); });
    this._btnPlay = mkButton(t.play, "▶", () => { unlockAudio(); this.togglePlay(); });
    this._btnNext = mkButton(t.next, "→", () => { unlockAudio(); this.next(); });
    this._btnFull = mkButton(t.fullscreen, "⛶", () => { unlockAudio(); this.toggleFullscreen(); });
    this._btnBest = mkButton(t.bestMove, "★", () => { unlockAudio(); this._announceBest(); });
    this._btnAnalyze = mkButton(t.gameAnalysis, "Σ", () => { unlockAudio(); this.toggleGameAnalysis(); });
    controls.append(this._btnRestart, this._btnPrev, this._btnPlay, this._btnNext, this._btnFull, this._btnBest, this._btnAnalyze);
    wrap.appendChild(controls);

    this._live = document.createElement("p");
    this._live.className = "chessjax-live";
    this._live.setAttribute("aria-live", "assertive");
    wrap.appendChild(this._live);

    // Справка по клавишам: видимая для зрячих, для скринридера озвучивается
    // через _live. Открывается/листается клавишей H.
    this._help = document.createElement("p");
    this._help.className = "chessjax-help";
    this._help.setAttribute("role", "note");
    this._help.hidden = true;
    wrap.appendChild(this._help);

    this.appendChild(wrap);

    // Клавиши навешиваем один раз на постоянный контейнер — при перерисовке
    // доски (replaceChildren) слушатель на самом _tableWrap сохраняется.
    this._tableWrap.addEventListener("keydown", (e) => this._onBoardKeydown(e));
    this._tableWrap.addEventListener("keyup", (e) => this._onBoardKeyup(e));
    this._tableWrap.addEventListener("focusin", (e) => this._onFocusIn(e));
  }

  async _load() {
    const lang = this.lang;
    const controlsHidden = this.getAttribute("controls") === "none";
    const controls = this.querySelector(".chessjax-controls");
    if (controls) controls.hidden = controlsHidden;

    const pgnSrc = this.getAttribute("pgn") || this.getAttribute("pgn-src");
    if (pgnSrc) {
      try {
        const res = await fetch(pgnSrc);
        if (!res.ok) throw new Error("HTTP " + res.status);
        const pgn = await res.text();
        this._positions = await applyPgnFull(pgn);
      } catch (e) {
        this._positions = null;
        this._renderError("PGN: " + e.message);
        return;
      }
    } else if (this.hasAttribute("fen")) {
      try {
        parseFen(this.getAttribute("fen")); // быстрая валидация со своими ошибками
        const Chess = await engine();
        const chess = new Chess(this.getAttribute("fen"));
        this._positions = [{ fen: chess.fen(), move: null }];
      } catch (e) {
        this._positions = null;
        this._renderError("FEN: " + e.message);
        return;
      }
    } else {
      this._positions = [{ fen: START_FEN, move: null }];
    }

    this._idx = 0;
    const moveSpec = this.getAttribute("move");
    if (moveSpec && this._positions.length > 1) this.goTo(moveSpec, { silent: true });
    else this._show();
  }

  _renderError(msg) {
    const lang = this.lang;
    this._tableWrap.replaceChildren();
    const p = document.createElement("p");
    p.className = "chessjax-error";
    p.textContent = msg;
    this._tableWrap.appendChild(p);
    if (this._summary) this._summary.textContent = "";
    if (this._live) speak(this._live, msg);
  }

  // Текущая позиция: в режиме варианта — ход варианта, иначе — ход партии.
  get _current() {
    return this._variant
      ? this._variant.positions[this._variant.idx]
      : this._positions[Math.min(this._idx, this._positions.length - 1)];
  }

  _show({ announce = false } = {}) {
    const lang = this.lang;
    if (!this._positions) return;
    const t = I18N[lang] || I18N.ru;
    const pos = this._current;
    const parsed = parseFen(pos.fen);
    // Анализ привязан к позиции: при смене хода подсветка и расчёт слетают.
    if (this._analysisFen !== pos.fen) {
      this._analysis = null;
      this._analyzing = false;
    }

    // Подсветка клеток хода варианта (откуда → куда) — визуальная пометка.
    let highlight = null;
    if (this._variant && pos.move) highlight = new Set([pos.move.from, pos.move.to]);

    const activeEl = document.activeElement;
    const hadCellFocus = !!(activeEl && activeEl.closest && activeEl.closest(".chessjax-cell") && this._tableWrap.contains(activeEl));
    const grid = renderGrid(parsed, lang, { activeSquare: this._activeSquare, highlight });
    this._tableWrap.replaceChildren(grid);
    // Фокус был на клетке — восстанавливаем на той же координате после перерисовки.
    if (hadCellFocus) {
      const cell = grid.querySelector(`[data-square="${this._activeSquare}"]`);
      if (cell) cell.focus();
    }

    this._summary.textContent = fenSummary(parsed, lang);
    this._updateButtons();
    if (announce) {
      if (this._variant) {
        if (pos.move) {
          let text = t.variationLabel + ": " + moveSpeech(pos.move, lang);
          if (this._variant.idx === 1 && this._variant.comment) text += ". " + this._variant.comment;
          if (this._variant.idx === this._variant.positions.length - 1) text += ". " + t.variationEnd;
          speak(this._live, text);
        } else speak(this._live, t.variationLabel);
      } else if (this._idx === 0) speak(this._live, t.start);
      else {
        // «Ход N» одинаков для пары полуходов (белые+чёрные): номер меняется
        // только с новым ходом. Цвет и фигура — в самом описании хода.
        let text = t.move + " " + Math.ceil(this._idx / 2) + ": " + moveSpeech(pos.move, lang);
        if (pos.comment) text += ". " + t.commentLabel + ": " + pos.comment;
        if (pos.variation && pos.variation.length) text += ". " + t.pressV;
        speak(this._live, text);
        // Анализ партии: вердикт движка + преимущество по каждому ходу; префетч
        // следующей позиции, чтобы вердикт при авто-шоу приходил без пауз.
        if (this._analysisMode === "on" && pos.move) {
          this._announceVerdict(pos.move, this._idx);
          const ni = this._idx + 1;
          if (ni < this._positions.length) requestAnalysis(this._positions[ni].fen);
        }
      }
    }
  }

  // Клавиши доски (фокус на клетке, NVDA в режиме форм):
  //   ↑/↓/←/→ — по клеткам; Ctrl+←/→ — перемотка ходов (озвучка + звук);
  //   Пробел — автопросмотр с начала; Ctrl+Пробел — с текущего хода / пауза;
  //   V — проиграть вариант (повторно — финал); Esc — выйти из варианта;
  //   H — справка по разделам.
  _onBoardKeydown(e) {
    const key = e.key;
    const mod = e.ctrlKey || e.metaKey;
    if ((key === "ArrowUp" || key === "ArrowDown" || key === "ArrowLeft" || key === "ArrowRight") && !mod && !e.altKey) {
      e.preventDefault();
      let dr = 0, df = 0;
      if (key === "ArrowUp") dr = -1;
      else if (key === "ArrowDown") dr = 1;
      else if (key === "ArrowLeft") df = -1;
      else df = 1;
      const rankIdx = RANKS.indexOf(this._activeSquare[1]);
      const fileIdx = FILES.indexOf(this._activeSquare[0]);
      const nr = rankIdx + dr;
      const nf = fileIdx + df;
      if (nr < 0 || nr > 7 || nf < 0 || nf > 7) return;
      this._activeSquare = FILES[nf] + RANKS[nr];
      this._applyActiveTabindex();
      return;
    }
    if ((key === "ArrowLeft" || key === "ArrowRight") && mod) {
      e.preventDefault();
      if (key === "ArrowLeft") this.prev();
      else this.next();
      return;
    }
    if (key === " " && !mod && !e.altKey) {
      e.preventDefault();
      this.playFromStart();
      return;
    }
    if (key === " " && mod) {
      e.preventDefault();
      this.togglePlay();
      return;
    }
    if (key === "v" || key === "V") {
      e.preventDefault();
      this.toggleVariation();
      return;
    }
    if (key === "Escape") {
      if (this._variant) {
        e.preventDefault();
        this.exitVariation();
      } else if (this._analysis || this._analyzing) {
        e.preventDefault();
        this._clearAnalysis();
      }
      return;
    }
    if (key === "h" || key === "H") {
      e.preventDefault();
      this.toggleHelp();
      return;
    }
    if (key === "f" || key === "F") {
      e.preventDefault();
      this.toggleFullscreen();
      return;
    }
    if (key === "a" || key === "A") {
      e.preventDefault();
      if (e.repeat) return; // авто-повтор клавиши не считаем
      if (this._aLongTimer) clearTimeout(this._aLongTimer);
      this._aLongDone = false;
      this._aLongTimer = setTimeout(() => {
        this._aLongDone = true;
        this._aLongTimer = null;
        unlockAudio();
        this.toggleRooster();
      }, 2000);
      return;
    }
    if (key === "b" || key === "B") {
      e.preventDefault();
      unlockAudio();
      this._announceBest();
      return;
    }
  }

  // Короткое нажатие A (меньше 2 секунд) — анализ партии. Длинное нажатие
  // (2 секунды) уже обработано таймером в keydown, здесь keyup его не дублирует.
  _onBoardKeyup(e) {
    if ((e.key === "a" || e.key === "A") && !this._aLongDone) {
      if (this._aLongTimer) {
        clearTimeout(this._aLongTimer);
        this._aLongTimer = null;
      }
      unlockAudio();
      this.toggleGameAnalysis();
    }
  }

  // Полноэкранный режим: клавиша F или кнопка ⛶ под доской. Внутренний esc
  // браузера выходит из fullscreen сам; кнопка и F — только включают/выключают.
  toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else if (this._root && this._root.requestFullscreen) {
      this._root.requestFullscreen().catch(() => {});
    } else {
      speak(this._live, I18N[this.lang].fullscreenOff);
    }
  }

  // После изменения fullscreen (событие на документе) обновляем подпись кнопки
  // и озвучиваем переход. Озвучка — только при реальной смене состояния.
  _updateFullButton() {
    const t = I18N[this.lang] || I18N.ru;
    const isFull = document.fullscreenElement === this._root;
    this._btnFull.setAttribute("aria-label", isFull ? t.exitFullscreen : t.fullscreen);
    if (isFull !== this._wasFull) {
      this._wasFull = isFull;
      speak(this._live, isFull ? t.fullscreenOn : t.fullscreenOff);
    }
  }

  // Автопросмотр с начала партии: сбрасываем позицию и запускаем показ.
  playFromStart() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
    this._variant = null;
    this._idx = 0;
    this._show({ announce: true }); // сразу «Начальная позиция», дальше тики озвучивают ходы
    this.togglePlay();
  }

  // H листает разделы справки по кругу: 1 → 2 → 3 → закрыть → 1…
  toggleHelp() {
    const t = I18N[this.lang] || I18N.ru;
    const sections = t.help || [];
    if (this._helpIdx === 0) this._helpIdx = 1;
    else if (this._helpIdx < sections.length) this._helpIdx += 1;
    else this._helpIdx = 0;
    if (this._helpIdx === 0) {
      this._help.hidden = true;
      speak(this._live, t.helpEnd);
      return;
    }
    const text = sections[this._helpIdx - 1];
    this._help.textContent = text;
    this._help.hidden = false;
    speak(this._live, text);
  }

  // V: вход в вариант (альтернативная линия текущего хода), повторное V —
  // финал, Esc — выход. Вариант играется с позиции ДО хода (variationFen),
  // заменяя его; после него озвучивается комментарий автора.
  toggleVariation() {
    const t = I18N[this.lang] || I18N.ru;
    if (this._variant) {
      this._variant.idx = this._variant.positions.length - 1;
      this._show({ announce: true });
      return;
    }
    const pos = this._current;
    if (!pos || !pos.variation || !pos.variationFen) {
      speak(this._live, t.noVariation);
      return;
    }
    const positions = [{ fen: pos.variationFen, move: null }];
    for (const m of pos.variation) positions.push({ fen: m.after, move: m });
    this._variant = { positions, idx: 1, comment: pos.comment };
    this._show({ announce: true });
  }

  exitVariation() {
    const t = I18N[this.lang] || I18N.ru;
    this._variant = null;
    this._show({ announce: false });
    speak(this._live, t.variationExit);
  }

  // Овервью — при входе фокуса на доску снаружи (не при переходе между клетками).
  _onFocusIn(e) {
    const rt = e.relatedTarget;
    if (rt && rt.closest && this._tableWrap.contains(rt)) return;
    const t = I18N[this.lang] || I18N.ru;
    speak(this._live, t.intro);
  }

  _applyActiveTabindex() {
    for (const c of this._tableWrap.querySelectorAll(".chessjax-cell")) {
      c.tabIndex = c.dataset.square === this._activeSquare ? 0 : -1;
    }
    const target = this._tableWrap.querySelector(`[data-square="${this._activeSquare}"]`);
    if (target) target.focus();
  }

  _atStart() {
    return this._variant ? this._variant.idx <= 0 : this._idx <= 0;
  }

  _atEnd() {
    return this._variant
      ? this._variant.idx >= this._variant.positions.length - 1
      : this._idx >= this._positions.length - 1;
  }

  _updateButtons() {
    if (!this._positions) return;
    this._btnPrev.disabled = this._atStart();
    this._btnNext.disabled = this._atEnd();
    this._btnRestart.disabled = this._idx === 0 && !this._variant;
  }

  // Звук хода. Рокировка — король + отложенная ладья; взятие — отдельный
  // удар; обычный ход — деревянный звук конкретной фигуры (пешка легче ладьи).
  // sound="off" отключает все звуки на доске.
  _playMoveSound(move = null) {
    if (this.getAttribute("sound") === "off") return;
    const m = move || (this._current && this._current.move);
    if (!m) return;
    const flags = m.flags || "";
    if (flags.includes("k") || flags.includes("q")) {
      playSound(SOUND_FILE.k);
      playSound(SOUND_FILE.r, { delay: 0.18 });
    } else if (flags.includes("c") || m.captured) {
      playSound("capture");
    } else {
      playSound(SOUND_FILE[m.piece] || "move");
    }
  }

  // Анализ партии (клавиша A / кнопка Σ): каждый ход при навигации озвучивается
  // с вердиктом движка и преимуществом. Повторное нажатие — выключить.
  toggleGameAnalysis() {
    this._analysisMode = this._analysisMode === "on" ? "off" : "on";
    const t = I18N[this.lang] || I18N.ru;
    if (this._analysisMode === "on") {
      speak(this._live, this._rooster ? t.roosterOn : t.gameAnalysisOn);
      if (this._current) requestAnalysis(this._current.fen); // прогреть движок и текущую позицию
    } else {
      speak(this._live, t.gameAnalysisOff);
    }
  }

  // Скрытый режим роустера: удержание A 2 секунды. Движок хвалит/ругает ходы
  // неформально; включает анализ партии, если тот был выключен.
  toggleRooster() {
    this._rooster = !this._rooster;
    const t = I18N[this.lang] || I18N.ru;
    if (this._rooster) {
      this._analysisMode = "on";
      speak(this._live, t.roosterOn);
      if (this._current) requestAnalysis(this._current.fen);
    } else {
      speak(this._live, t.roosterOff);
    }
  }

  // Лучший ход в текущей позиции (клавиша B / кнопка ★): оценка, ход движка,
  // подсветка поля. Приоритетный запрос — обходит очередь вердиктов.
  async _announceBest() {
    const t = I18N[this.lang] || I18N.ru;
    if (!this._positions || !this._current) {
      speak(this._live, t.analysisError);
      return;
    }
    const fen = this._current.fen;
    this._analyzing = true;
    this._analysisFen = fen;
    speak(this._live, t.analyzing);
    try {
      const r = await requestAnalysis(fen, { priority: true });
      if (!this.isConnected || this._analysisFen !== fen || !this._current || this._current.fen !== fen) return;
      this._analyzing = false;
      this._analysis = r;
      const best = r.bestmove || r.best;
      if (best && best !== "(none)") {
        this._applyAnalysisHighlight();
        speak(this._live, t.score + " " + this._scoreText(r, t) + ", " + t.bestMove + " " + this._moveText(best) + ".");
      } else {
        speak(this._live, t.analysisCleared);
      }
    } catch (e) {
      if (!this.isConnected) return;
      this._analyzing = false;
      speak(this._live, t.analysisError);
    }
  }

  // Вердикт ходу в режиме анализа партии: сравнивает ход с лучшим ходом движка,
  // иначе — потеря в оценке между позицией до и после хода.
  async _announceVerdict(move, idx) {
    const prevPos = this._positions[idx - 1];
    const curPos = this._positions[idx];
    if (!prevPos || !curPos) return;
    const actualUci = move.from + move.to + (move.promotion || "");
    let prevR = null;
    let curR = null;
    try {
      [prevR, curR] = await Promise.all([requestAnalysis(prevPos.fen), requestAnalysis(curPos.fen)]);
    } catch {
      return; // движок не ответил — вердикта не будет
    }
    if (!this.isConnected || this._variant || this._idx !== idx || !prevR) return;
    const t = I18N[this.lang] || I18N.ru;
    const verdict = this._verdictFor(actualUci, prevR, curR);
    let vText;
    if (this._rooster) {
      vText =
        verdict === "great" && move.captured && typeof t.rooster.greatCapture === "function"
          ? t.rooster.greatCapture(move.captured, t.pieces)
          : t.rooster[verdict];
    } else {
      vText = t.verdict[verdict];
    }
    const curCp = curR ? -scoreToCp(curR) : scoreToCp(prevR);
    speak(this._live, vText + ". " + this._advantageText(curCp, move.color, t));
  }

  _verdictFor(actualUci, prevR, curR) {
    const best = prevR && (prevR.bestmove || prevR.best);
    if (best && best !== "(none)" && actualUci === best) return "great";
    const prevCp = scoreToCp(prevR);
    const curCp = curR ? -scoreToCp(curR) : prevCp;
    const loss = prevCp - curCp;
    if (loss <= 20) return "good";
    if (loss <= 100) return "interesting";
    if (loss <= 250) return "inaccuracy";
    if (loss <= 500) return "mistake";
    return "blunder";
  }

  // Преимущество в сотых пешки из перспективы ходящего. Цвет — сторона, которая
  // впереди: если ходящий проигрывает (cp<0), лидер — его соперник.
  _advantageText(cp, moverColor, t) {
    if (Math.abs(cp) < 50) return t.equalPosition;
    const leader = cp >= 0 ? moverColor : moverColor === "w" ? "b" : "w";
    return t.adv[leader] + ": +" + (Math.abs(cp) / 100).toFixed(1);
  }

  _scoreText(r, t) {
    if (!r) return "0.0";
    if (r.type === "mate") return typeof t.mateIn === "function" ? t.mateIn(r.value) : t.mateIn + " " + r.value;
    const v = r.value / 100;
    if (v === 0) return "0.0";
    return (v > 0 ? "+" : "−") + Math.abs(v).toFixed(1);
  }

  _moveText(uci) {
    return uci.slice(0, 2).toUpperCase() + "-" + uci.slice(2, 4).toUpperCase();
  }

  // Подсветка клеток лучшего хода: класс для зрячих + пометка в aria-label
  // для скринридера («E2, лучший ход»).
  _applyAnalysisHighlight() {
    const r = this._analysis;
    const grid = this._tableWrap && this._tableWrap.querySelector(".chessjax-board");
    if (!r || !grid) return;
    const t = I18N[this.lang] || I18N.ru;
    grid.querySelectorAll(".analysis-move").forEach((c) => c.classList.remove("analysis-move"));
    let parsed = null;
    for (const sq of [r.best.slice(0, 2), r.best.slice(2, 4)]) {
      const cell = grid.querySelector(`[data-square="${sq}"]`);
      if (!cell) continue;
      cell.classList.add("analysis-move");
      if (parsed === null) parsed = parseFen(this._current.fen);
      const piece = parsed.board.get(sq);
      let base;
      if (piece) {
        const label = pieceLabel(piece, this.lang);
        base = label.charAt(0).toUpperCase() + label.slice(1) + " " + sq.toUpperCase();
      } else {
        base = sq.toUpperCase();
      }
      cell.setAttribute("aria-label", base + ", " + t.bestMove);
    }
  }

  _clearAnalysis() {
    const t = I18N[this.lang] || I18N.ru;
    this._analysis = null;
    this._analyzing = false;
    this._analysisFen = null;
    this._show({ announce: false }); // перерисовка снимает классы подсветки
    speak(this._live, t.analysisCleared);
  }

  // Публичное API: вызывается и кнопками навигации, и внешними кнопками текста.

  goTo(moveSpec, opts = {}) {
    const prevIdx = this._idx;
    this._variant = null; // внешний переход всегда в основной линии партии
    const target = positionIndex(moveSpec);
    if (this._positions) this._idx = Math.min(target, this._positions.length - 1);
    this._show({ announce: opts.silent ? false : true });
    // При загрузке (silent) звука нет — до первого клика AudioContext ещё
    // заблокирован, да и это шум при открытии страницы.
    if (!opts.silent && this._idx !== prevIdx) this._playMoveSound();
  }

  next() {
    if (!this._positions) return;
    if (this._variant) {
      if (this._variant.idx < this._variant.positions.length - 1) {
        this._variant.idx += 1;
        this._show({ announce: true });
        this._playMoveSound();
      }
      return;
    }
    if (this._idx < this._positions.length - 1) {
      this._idx += 1;
      this._show({ announce: true });
      this._playMoveSound();
    }
  }

  prev() {
    if (!this._positions) return;
    if (this._variant) {
      if (this._variant.idx > 0) {
        const undone = this._variant.positions[this._variant.idx].move; // звук отыгранного хода
        this._variant.idx -= 1;
        this._show({ announce: true });
        this._playMoveSound(undone);
      }
      return;
    }
    if (this._idx > 0) {
      const undone = this._positions[this._idx].move; // звук отыгранного хода
      this._idx -= 1;
      this._show({ announce: true });
      this._playMoveSound(undone);
    }
  }

  togglePlay() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
      this._btnPlay.textContent = "▶";
      this._btnPlay.setAttribute("aria-label", I18N[this.lang].play);
      return;
    }
    if (this._atEnd()) {
      if (this._variant) this._variant.idx = 0;
      else this._idx = 0;
    }
    const step = () => {
      if (this._atEnd()) {
        this.togglePlay();
        return;
      }
      this.next();
    };
    this._timer = setInterval(step, 2500);
    this._btnPlay.textContent = "⏸";
    this._btnPlay.setAttribute("aria-label", I18N[this.lang].stop);
  }
}

if (typeof customElements !== "undefined") {
  customElements.define("chessjax-board", ChessboardElement);
}

}  // guard: HTMLElement

function mkButton(label, glyph, onClick) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "chessjax-btn";
  b.textContent = glyph;
  b.setAttribute("aria-label", label);
  b.addEventListener("click", onClick);
  return b;
}

// --- Кнопки-ходы в тексте: <button chess="id" move="N"> ----------------------
// Один делегат на документ: клик по такой кнопке переключает доску с этим id.

function wireStoryButtons() {
  document.addEventListener("click", (event) => {
    const btn = event.target.closest("button[chess][move]");
    if (!btn) return;
    const board = document.getElementById(btn.getAttribute("chess"));
    if (board && typeof board.goTo === "function") {
      unlockAudio();
      board.goTo(btn.getAttribute("move"));
    }
  });
}
if (typeof document !== "undefined") wireStoryButtons();

// --- Публичный API ------------------------------------------------------------

export const chessjax = {
  settings: { language: "ru" },

  setLanguage(lang) {
    this.settings.language = lang;
    defaultLanguage = lang;
    for (const board of registeredBoards) board._load();
  },

  languages() {
    return Object.entries(I18N).map(([code, t]) => ({ code, name: t.langName }));
  },

  renderBoard,
  parseFen,
  fenSummary,
  parsePgnMoves,
  applyPgn,
  applyPgnFull,
  splitComment,
  positionIndex,
};

export default chessjax;
