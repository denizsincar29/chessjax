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

// Экспортируется: тесты берут банки фраз прямо отсюда, чтобы список проверяемых
// вердиктов не расходился с содержимым словаря.
export const I18N = {
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
    paused: "Остановлено",
    pausedAt: (n, c) => "Остановлено на ходе " + n + " " + (c === "w" ? "белых" : "чёрных"),
    speedAt: (s) => "Скорость показа: " + (s >= 5 ? s + " секунд" : s === 1 ? s + " секунда" : s + " секунды") + " на ход",
    restart: "В начало",
    fullscreen: "Во весь экран",
    exitFullscreen: "Выйти из полноэкранного режима",
    fullscreenOn: "Полноэкранный режим",
    fullscreenOff: "Полноэкранный режим выключен",
    gameAnalysis: "Анализ партии",
    gameAnalysisOn: "Анализ партии включён",
    gameAnalysisOff: "Анализ партии выключен",
    roastOn: "Скрытый режим роаста включён",
    roastOff: "Режим роаста выключен",
    analyzing: "Идёт анализ…",
    score: "Оценка",
    bestMove: "Лучший ход",
    mateIn: (n) => "мат в " + n,
    analysisCleared: "Анализ снят",
    analysisError: "Анализ: не удалось загрузить движок",
    // Винительный падеж — для фраз о взятии: «съел пешку», «утащил ферзя».
    acc: { k: "короля", q: "ферзя", r: "ладью", b: "слона", n: "коня", p: "пешку" },
    verdict: {
      great: ["Прекрасный ход", "Сильнейшее продолжение", "Лучший ход в позиции", "Точно в цель", "Именно то, что нужно"],
      good: ["Хороший ход", "Крепкий ход", "Разумное продолжение", "Верное решение", "Достойно"],
      interesting: ["Интересный ход", "Любопытная идея", "Неочевидно, но возможно", "Ход на засыпку", "Есть замысел"],
      inaccuracy: ["Неточность", "Можно было точнее", "Не самое сильное продолжение", "Чуть хуже, чем следовало", "Позиция слегка ухудшилась"],
      mistake: ["Ошибка", "Заметная потеря", "Так играть не стоит", "Упускает преимущество", "Позиция ухудшилась"],
      blunder: ["Грубая ошибка", "Зевок", "Серьёзная потеря", "Позиция резко ухудшилась", "Дорогостоящая ошибка"],
    },
    roast: {
      great: ["Ооо, прекрасно!", "Вау, вот это ход!", "Мастерски!", "Красота!", "Ну ты даёшь!", "Снимаю шляпу!", "Это по-королевски!"],
      greatCapture: [
        (c) => "Ооо, прекрасно съел " + c.t.acc[c.p] + "!",
        (c) => "Ням, " + c.t.pieces[c.p] + (c.t.gender[c.p] === "f" ? " была вкусная!" : " был вкусный!"),
        (c) => "И " + c.t.pieces[c.p] + (c.t.gender[c.p] === "f" ? " отправилась" : " отправился") + " в утиль!",
        (c) => "Хоп — и " + c.t.acc[c.p] + " с доски!",
        (c) => "Спасибо за " + c.t.acc[c.p] + "!",
        (c) => "Утащил " + c.t.acc[c.p] + " прямо из-под носа!",
      ],
      good: ["Неплохо!", "Норм!", "Сойдёт!", "Смотри-ка, умеешь!", "Так и надо!"],
      interesting: ["О, интересно...", "Хм, любопытно...", "Что-то задумал...", "Интрига!", "А это уже любопытно..."],
      inaccuracy: ["Так себе, но вроде ладно...", "Не уверен в этом...", "Могло быть и лучше...", "Куда-то не туда...", "Ну, почти..."],
      mistake: ["Хм, не лучшая идея...", "Рискованно...", "Ой...", "Это зря...", "Что-то пошло не так..."],
      blunder: ["Ход полная хрень!", "Что ты делаешь?!", "Это провал!", "Зевок века!", "Доска в шоке!", "Мда, красиво слил..."],
    },
    adv: { w: "Преимущество белых", b: "Преимущество чёрных" },
    equalPosition: "Позиция равная",
    intro: "Шахматная доска. Стрелки ведут по клеткам, клавиша H — инструкция по управлению. В JAWS, если стрелки не работают, включите режим форм.",
    // Анонс перед доской: его читает скринридер, листая документ стрелками.
    boardIntro: "Шахматная доска, область. Нажмите Enter, чтобы взаимодействовать с доской.",
    help: [
      "Навигация по доске. Стрелки вверх, вниз, влево и вправо — перейти на соседнюю клетку. На клетке с фигурой вы услышите фигуру и координаты. Если доска ещё не слушает клавиши, нажмите Enter на её анонсе или щёлкните по доске — фокус встанет на клетку.",
      "Ходы и комментарии. Контрол и стрелки влево и вправо — предыдущий и следующий ход. Ход озвучивается фигурой и координатами, после него читается комментарий из записи партии.",
      "Воспроизведение. Пробел — продолжить с текущего хода или пауза с объявлением номера хода. Контрол и пробел — автоматический просмотр с начала партии. Контрол и стрелки вверх и вниз — быстрее и медленнее.",
      "Варианты и эта справка. Если у хода есть альтернативные ходы в скобках доллар — клавиша V их проигрывает, повторное нажатие показывает финал, клавиша эскейп возвращает в партию. Под доской: в начало, предыдущий ход, автопросмотр, следующий ход, во весь экран, лучший ход, анализ партии. Клавиша F — увеличить доску на весь экран, повторное нажатие или эскейп — вернуть. Клавиша B — лучший ход в текущей позиции: оценка и ход движка. Клавиша A — анализ партии: каждый ход с вердиктом, величина преимущества маркируется тоном, повторное нажатие — выключить. Удерживайте A две секунды — скрытый режим роаста с неформальными вердиктами. Клавиша H — следующий раздел инструкции, после последнего она закрывается.",
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
    paused: "Stopped",
    pausedAt: (n, c) => "Stopped at move " + n + " " + (c === "w" ? "white" : "black"),
    speedAt: (s) => "Playback speed: " + s + " seconds per move",
    restart: "Back to start",
    fullscreen: "Fullscreen",
    exitFullscreen: "Exit fullscreen",
    fullscreenOn: "Fullscreen mode",
    fullscreenOff: "Fullscreen mode off",
    gameAnalysis: "Game analysis",
    gameAnalysisOn: "Game analysis on",
    gameAnalysisOff: "Game analysis off",
    roastOn: "Hidden roast mode on",
    roastOff: "Roast mode off",
    analyzing: "Analyzing…",
    score: "Score",
    bestMove: "Best move",
    mateIn: (n) => "mate in " + n,
    analysisCleared: "Analysis cleared",
    analysisError: "Analysis: could not load engine",
    acc: { k: "king", q: "queen", r: "rook", b: "bishop", n: "knight", p: "pawn" },
    verdict: {
      great: ["Brilliant move", "Strongest continuation", "Best move in the position", "Spot on", "Exactly right"],
      good: ["Good move", "Solid move", "Sensible continuation", "Reasonable choice", "Well played"],
      interesting: ["Interesting move", "A curious idea", "Unclear but playable", "There is an idea here", "Bold choice"],
      inaccuracy: ["Inaccuracy", "Could have been more precise", "Not the strongest continuation", "Slightly worse than needed", "The position drifts a little"],
      mistake: ["Mistake", "A noticeable loss", "That is not the way", "The advantage slips away", "The position gets worse"],
      blunder: ["Blunder", "A real howler", "Heavy loss", "The position collapses", "A costly mistake"],
    },
    roast: {
      great: ["Oh, brilliant!", "Wow, what a move!", "Masterful!", "Beautiful!", "Take a bow!", "Now that is chess!", "Royalty only!"],
      greatCapture: [
        (c) => "Oh, brilliantly gobbled the " + c.t.acc[c.p] + "!",
        (c) => "Yum, that " + c.t.acc[c.p] + " was tasty!",
        (c) => "And the " + c.t.acc[c.p] + " goes straight to the bin!",
        (c) => "Snatched the " + c.t.acc[c.p] + " right from under the nose!",
        (c) => "Thanks for the " + c.t.acc[c.p] + "!",
        (c) => "The " + c.t.acc[c.p] + " is simply gone!",
      ],
      good: ["Not bad!", "Alright!", "Fine!", "Look at you!", "Keep it up!"],
      interesting: ["Hmm, interesting...", "Curious...", "What are you plotting?", "Now it gets spicy...", "Bold..."],
      inaccuracy: ["Meh, fine I guess...", "Not sure about that...", "Could be better...", "Slightly off target...", "Almost, but not quite..."],
      mistake: ["Hmm, not your best idea...", "Risky...", "Uh-oh...", "That hurts a little...", "Something went wrong here..."],
      blunder: ["That move is total crap!", "What are you doing?!", "A total disaster!", "Blunder of the century!", "The board is in shock!", "Well, that was a gift..."],
    },
    adv: { w: "White advantage", b: "Black advantage" },
    equalPosition: "Equal position",
    intro: "Chessboard. The arrows move over the squares, press H for usage instructions. In JAWS, if the arrows do not work, switch to forms mode.",
    boardIntro: "Chessboard, region. Press Enter to interact with the board.",
    help: [
      "Board navigation. Arrow up, down, left and right move to a neighbouring square. On a square with a piece you hear the piece and its coordinates. If the board does not take keys yet, press Enter on its announcement or click the board — the focus lands on a square.",
      "Moves and comments. Control plus arrow left and right step to the previous and next move. Each move is announced with the piece and squares, followed by the comment from the game record.",
      "Playback. Space continues from the current move or pauses and announces the move number. Control plus space starts automatic playthrough from the beginning of the game. Control plus arrow up and down makes playback faster and slower.",
      "Variations and this help. If a move has alternative moves in dollar brackets, press V to play them, press V again to jump to the variation end, press escape to return to the game. Below the board: restart, previous move, play, next move, fullscreen, best move, game analysis. Press F for fullscreen, press again or escape to exit. Press B for the best move in the current position: score and the engine's move. Press A to toggle game analysis: each move with a verdict; the advantage is signaled by a tone; press again to turn off. Hold A for two seconds to enable the hidden roast mode with informal verdicts. Press H for the next help section; after the last one it closes.",
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
    paused: "Angehalten",
    pausedAt: (n, c) => "Angehalten bei Zug " + n + " " + (c === "w" ? "Weiß" : "Schwarz"),
    speedAt: (s) => "Geschwindigkeit: " + s + " Sekunden pro Zug",
    restart: "Zum Anfang",
    fullscreen: "Vollbild",
    exitFullscreen: "Vollbild beenden",
    fullscreenOn: "Vollbildmodus",
    fullscreenOff: "Vollbildmodus aus",
    gameAnalysis: "Partieanalyse",
    gameAnalysisOn: "Partieanalyse an",
    gameAnalysisOff: "Partieanalyse aus",
    roastOn: "Versteckter Roast-Modus an",
    roastOff: "Roast-Modus aus",
    analyzing: "Analyse läuft…",
    score: "Bewertung",
    bestMove: "Bester Zug",
    mateIn: (n) => "Matt in " + n,
    analysisCleared: "Analyse entfernt",
    analysisError: "Analyse: Engine konnte nicht geladen werden",
    acc: { k: "den König", q: "die Dame", r: "den Turm", b: "den Läufer", n: "den Springer", p: "den Bauern" },
    verdict: {
      great: ["Großartiger Zug", "Stärkste Fortsetzung", "Bester Zug der Stellung", "Genau ins Ziel", "Genau richtig"],
      good: ["Guter Zug", "Solider Zug", "Vernünftige Fortsetzung", "Richtige Entscheidung", "Ordentlich gespielt"],
      interesting: ["Interessanter Zug", "Neugierige Idee", "Unklar, aber spielbar", "Da steckt eine Idee drin", "Mutige Wahl"],
      inaccuracy: ["Ungenauigkeit", "Etwas präziser wäre möglich", "Nicht die stärkste Fortsetzung", "Etwas schwächer als nötig", "Die Stellung verschlechtert sich leicht"],
      mistake: ["Fehler", "Deutlicher Verlust", "So spielt man nicht", "Der Vorteil rutscht weg", "Die Stellung wird schlechter"],
      blunder: ["Schwerer Fehler", "Grober Patzer", "Harter Verlust", "Die Stellung bricht zusammen", "Teurer Fehler"],
    },
    roast: {
      great: ["Oh, großartig!", "Wow, was für ein Zug!", "Meisterhaft!", "Wunderschön!", "Hut ab!", "Königlich!", "Das ist Schach!"],
      greatCapture: [
        (c) => "Oh, großartig — " + c.t.acc[c.p] + " geschlagen!",
        (c) => { const a = c.t.gender[c.p] === "f" ? "Die " : "Der "; return "Mmh, " + a + c.t.pieces[c.p] + " war lecker!"; },
        (c) => { const a = c.t.gender[c.p] === "f" ? "die " : "der "; return "Und " + a + c.t.pieces[c.p] + " ab in die Tonne!"; },
        (c) => "Hat " + c.t.acc[c.p] + " direkt vor der Nase weggeschnappt!",
        (c) => "Danke für " + c.t.acc[c.p] + "!",
        (c) => { const a = c.t.gender[c.p] === "f" ? "Die " : "Der "; return a + c.t.pieces[c.p] + " ist einfach weg!"; },
      ],
      good: ["Nicht schlecht!", "Passt schon!", "In Ordnung!", "Sieh an, du kannst es!", "Weiter so!"],
      interesting: ["Hmm, interessant...", "Neugierig...", "Was planst du?", "Jetzt wird es spannend...", "Mutig..."],
      inaccuracy: ["Naja, geht so...", "Bin nicht sicher...", "Könnte besser sein...", "Knapp daneben...", "Fast, aber nur fast..."],
      mistake: ["Hmm, keine gute Idee...", "Riskant...", "Autsch...", "Das tut ein bisschen weh...", "Da lief etwas schief..."],
      blunder: ["Der Zug ist totaler Mist!", "Was machst du da?!", "Totale Katastrophe!", "Patzer des Jahrhunderts!", "Das Brett ist geschockt!", "Na, das war ein Geschenk..."],
    },
    adv: { w: "Weißer Vorteil", b: "Schwarzer Vorteil" },
    equalPosition: "Ausgeglichene Stellung",
    intro: "Schachbrett. Die Pfeiltasten führen über die Felder, Taste H — Bedienungsanleitung. In JAWS bei Bedarf in den Formularmodus schalten.",
    boardIntro: "Schachbrett, Bereich. Enter drücken, um mit dem Brett zu arbeiten.",
    help: [
      "Brett-Navigation. Pfeil hoch, runter, links und rechts — benachbarte Felder. Auf einem Feld mit einer Figur hören Sie die Figur und die Koordinaten. Nimmt das Brett noch keine Tasten an, Enter auf der Ankündigung drücken oder das Brett anklicken — der Fokus landet auf einem Feld.",
      "Züge und Kommentare. Strg plus Pfeil links und rechts — vorheriger und nächster Zug. Der Zug wird mit Figur und Feldern angesagt, danach der Kommentar aus der Partie.",
      "Wiedergabe. Leertaste — vom aktuellen Zug weiter oder Pause mit Angabe der Zugnummer. Strg und Leertaste — automatisches Abspielen von Anfang an. Strg und Pfeil hoch und runter — schneller und langsamer.",
      "Varianten und diese Hilfe. Hat ein Zug alternative Züge in Dollar-Klammern — Taste V spielt sie ab, erneut drücken springt zum Variantenende, Escape führt zur Partie zurück. Unter dem Brett: zum Anfang, vorheriger Zug, Abspielen, nächster Zug, Vollbild, bester Zug, Partieanalyse. Taste F — Vollbild, erneut drücken oder Escape — verlassen. Taste B — bester Zug in der aktuellen Stellung: Bewertung und Engine-Zug. Taste A — Partieanalyse: jeder Zug mit Urteil, der Vorteil wird durch einen Ton markiert; erneut drücken — aus. Taste A zwei Sekunden gedrückt halten — versteckter Roast-Modus mit lockeren Urteilen. Taste H — nächster Hilfeabschnitt; nach dem letzten schließt er sich.",
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
    paused: "Durduruldu",
    pausedAt: (n, c) => "Zug " + n + " " + (c === "w" ? "beyaz" : "siyah") + " durduruldu",
    speedAt: (s) => "Gösterim hızı: hamle başına " + s + " saniye",
    restart: "Başa dön",
    fullscreen: "Tam ekran",
    exitFullscreen: "Tam ekrandan çık",
    fullscreenOn: "Tam ekran modu",
    fullscreenOff: "Tam ekran modu kapalı",
    gameAnalysis: "Oyun analizi",
    gameAnalysisOn: "Oyun analizi açık",
    gameAnalysisOff: "Oyun analizi kapalı",
    roastOn: "Gizli roast modu açık",
    roastOff: "Roast modu kapalı",
    analyzing: "Analiz ediliyor…",
    score: "Değerlendirme",
    bestMove: "En iyi hamle",
    mateIn: (n) => n + " hamlede mat",
    analysisCleared: "Analiz kaldırıldı",
    analysisError: "Analiz: motor yüklenemedi",
    acc: { k: "şahı", q: "veziri", r: "kaleyi", b: "fili", n: "atı", p: "piyonu" },
    verdict: {
      great: ["Harika hamle", "En güçlü devam", "Konumun en iyi hamlesi", "Tam isabet", "Tam da gereken"],
      good: ["İyi hamle", "Sağlam hamle", "Mantıklı devam", "Doğru karar", "Fena değil"],
      interesting: ["İlginç hamle", "Merak uyandıran fikir", "Belirsiz ama oynanabilir", "Bir fikir var", "Cesur seçim"],
      inaccuracy: ["Yanlışlık", "Daha isabetli olabilirdi", "En güçlü devam değil", "Gerektiğinden biraz zayıf", "Konum biraz bozuldu"],
      mistake: ["Hata", "Belirgin kayıp", "Böyle oynanmaz", "Avantaj kaçıyor", "Konum kötüleşti"],
      blunder: ["Büyük hata", "Ağır gaf", "Ciddi kayıp", "Konum çöküyor", "Pahalı hata"],
    },
    roast: {
      great: ["Oh, harika!", "Vay canına, ne hamle!", "Ustalıkla!", "Çok güzel!", "Şapka çıkarıyorum!", "Şahane!", "İşte satranç bu!"],
      greatCapture: [
        (c) => "Oh, " + c.t.acc[c.p] + " almak harika!",
        (c) => "Mmm, o " + c.t.pieces[c.p] + " çok lezzetliydi!",
        (c) => "Ve " + c.t.pieces[c.p] + " çöpe gitti!",
        (c) => "Burnunun dibinden " + c.t.acc[c.p] + " kaptı!",
        (c) => c.t.acc[c.p] + " için teşekkürler!",
        (c) => "Ve " + c.t.pieces[c.p] + " bir anda yok oldu!",
      ],
      good: ["Fena değil!", "Okey!", "İdare eder!", "Bak sen, yapabiliyorsun!", "Böyle devam!"],
      interesting: ["Hmm, ilginç...", "Merak uyandırdı...", "Ne planlıyorsun?", "Şimdi işler kızışıyor...", "Cesur..."],
      inaccuracy: ["Eh, idare eder...", "Emin değilim...", "Daha iyi olabilirdi...", "Hedefi biraz şaştı...", "Neredeyse, ama değil..."],
      mistake: ["Hmm, iyi fikir değil...", "Riskli...", "Eyvah...", "Bu biraz can yakar...", "Burada bir şeyler ters gitti..."],
      blunder: ["Bu hamle tam bir çöp!", "Ne yapıyorsun?!", "Tam bir felaket!", "Yüzyılın gafı!", "Tahta şokta!", "Eh, bu bir hediyeydi..."],
    },
    adv: { w: "Beyaz avantaj", b: "Siyah avantaj" },
    equalPosition: "Konum dengede",
    intro: "Satranç tahtası. Oklar kareler üzerinde gezinir, kullanım talimatları için H tuşuna basın. JAWS'ta oklar çalışmazsa form moduna geçin.",
    boardIntro: "Satranç tahtası, bölge. Tahtayla etkileşim için Enter'a basın.",
    help: [
      "Tahta gezinme. Yukarı, aşağı, sol ve sağ oklar — komşu kareye geçer. Taş olan karede taşı ve koordinatları duyarsınız. Tahta henüz tuşları almıyorsa, duyurusunda Enter'a basın veya tahtaya tıklayın — odak bir kareye gelir.",
      "Hamleler ve yorumlar. Kontrol ve sol/sağ oklar — önceki ve sonraki hamle. Hamle taş ve karelerle okunur, ardından kayıttaki yorum söylenir.",
      "Oynatma. Boşluk — mevcut hamleden devam eder veya hamle numarasıyla duraklatır. Kontrol ve boşluk — baştan otomatik oynatır. Kontrol ve yukarı/aşağı oklar — hızlandırır ve yavaşlatır.",
      "Varyantlar ve bu yardım. Hamlede dolar köşeli parantez içinde alternatif hamleler varsa V tuşu oynatır, tekrar basmak varyantın sonuna atlar, Escape oyuna döner. Tahtanın altında: başa dön, önceki hamle, oynat, sonraki hamle, tam ekran, en iyi hamle, oyun analizi. F tuşu — tam ekran, tekrar basmak veya Escape — çıkış. B tuşu — mevcut pozisyondaki en iyi hamle: değerlendirme ve motor hamlesi. A tuşu — oyun analizi: her hamle için yorum, avantaj bir tonla işaretlenir; tekrar basın — kapatır. A tuşuna iki saniye basılı tutun — gayriresmî yorumlar veren gizli roast modu. H tuşu — sonraki yardım bölümü; sonuncusundan sonra kapanır.",
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
//
// Клавиши доска ведёт сама (стрелки ходят по клеткам), значит скринридер обязан
// уйти из режима чтения в режим форм — иначе стрелки листают документ, а не
// клетки. NVDA решает это на фокус-событии (source/browseMode.py,
// BrowseModeTreeInterceptor.shouldPassThrough) и переключается только для
// известного набора ролей: editable, list/listitem, tree/treeitem, slider,
// combobox, tabcontrol, menubar, popupmenu, spinbutton, строка/ячейка таблицы —
// либо когда среди ПРЕДКОВ фокуса есть toolbar. role="application" в этот
// список не входит и на потомков не влияет: на живом NVDA доска с ним так и
// осталась в режиме чтения. Поэтому доска — toolbar (стрелки внутри тулбара
// NVDA и так отдаёт приложению). Чтобы скринридер не говорил «панель
// инструментов», имя роли переопределено: aria-roledescription он произносит
// вместо роли, а aria-label даёт доске имя для списка элементов.
// --- Стили -------------------------------------------------------------------
// chessjax самодостаточен: странице достаточно тега <chessjax-board fen="…">,
// чтобы получить готовую доску — сетку, клетки, фигуры, координаты, полный
// экран. Раньше здесь была только фигура с координатами, а сетка 8×8 жила в
// chessjax/style.css — теме демо-страницы, которую приходилось копировать
// каждому, кто вставлял доску; забыл скопировать — получил столбик фигур
// вместо позиции (так и вышло в облаке mdcloud). Один <style> на документ,
// специфичность низкая — тема страницы (например
// .preview .chessjax-cell.square-dark) переопределяет цвета и размер своими
// правилами. Сторона клетки — переменная --chessjax-square (по умолчанию 52px),
// её же читает сетка, так что доска масштабируется целиком.
// Контраст координат привязан к штатной паре square-dark/square-light: если
// страница красит клетки иначе, координаты могут оказаться малоконтрастными.
const BOARD_CSS = `
.chessjax-board {
  display: grid;
  grid-template-columns: repeat(8, var(--chessjax-square, 52px));
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.22);
}
.chessjax-cell {
  position: relative;
  width: var(--chessjax-square, 52px);
  height: var(--chessjax-square, 52px);
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.7rem;
}
/* Цвета клеток — умолчание; страница вправе перекрасить их своими правилами. */
.chessjax-cell.square-dark { background: #769656; }
.chessjax-cell.square-light { background: #eeeed2; }
.chessjax-cell.piece-w { color: #fff; text-shadow: 0 0 2px #000; }
.chessjax-cell.piece-b { color: #000; text-shadow: 0 0 2px #fff; }
.chessjax-cell.variant-highlight { box-shadow: inset 0 0 0 3px #f59e0b; }
.chessjax-cell.analysis-move { box-shadow: inset 0 0 0 3px #3b82f6; }
/* Фигура занимает почти всю клетку; drop-shadow даёт объём, из-за которого
   белые фигуры не сливаются со светлой клеткой. */
.chessjax-piece {
  width: 92%;
  height: 92%;
  display: block;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.28));
}
/* Координаты по нижнему и левому краю — генерация CSS (::after/::before на
   data-атрибутах). В DOM их нет: клетка по-прежнему названа только aria-label,
   скринридер к координатам не возвращается. Размер в em — клетка уже задаёт
   кегль пропорционально своей стороне (в т.ч. в полном экране). */
.chessjax-cell.coord-file::after,
.chessjax-cell.coord-rank::before {
  position: absolute;
  font-size: 0.44em;
  font-weight: 700;
  line-height: 1;
  pointer-events: none;
  user-select: none;
}
.chessjax-cell.coord-file::after { content: attr(data-file); right: 3px; bottom: 2px; }
.chessjax-cell.coord-rank::before { content: attr(data-rank); left: 3px; top: 2px; }
.chessjax-cell.square-dark.coord-file::after,
.chessjax-cell.square-dark.coord-rank::before { color: #eeeed2; }
.chessjax-cell.square-light.coord-file::after,
.chessjax-cell.square-light.coord-rank::before { color: #769656; }
/* Строка с положением, кнопки и живая область — тоже доскино: странице не
   должно быть дела до того, как они разложены. */
.chessjax-summary { font-size: 0.9rem; max-width: 560px; }
.chessjax-controls { display: flex; gap: 0.4rem; margin-top: 0.5rem; }
.chessjax-btn { min-width: 44px; }
.chessjax-btn:disabled { opacity: 0.4; cursor: default; }
.chessjax-live { min-height: 1.2em; margin: 0.4rem 0 0; font-size: 0.9rem; }
/* У подсказки страница вправе нарисовать свою полосу слева — цвета здесь не
   трогаем, только место. */
.chessjax-help {
  margin: 0.5rem 0 0;
  font-size: 0.9rem;
  max-width: 560px;
}
.chessjax-error {
  font-size: 0.9rem;
  border: 1px solid currentColor;
  border-radius: 6px;
  padding: 0.5rem 0.7rem;
}
/* Полноэкранный режим (клавиша F или кнопка ⛶ под доской): доска растягивается
   на весь экран, фигуры увеличиваются. Контент выравниваем по верху, а не по
   центру: при центрировании переполнение режет и верх, и низ — строки с инфой
   (ход/анализ) под кнопками уходят за экран. */
chessjax-board:fullscreen {
  background: #14181c;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  overflow-y: auto;
}
chessjax-board:fullscreen .chessjax-board {
  width: min(64vh, 92vw);
  height: min(64vh, 92vw);
  margin: 0 auto;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  grid-auto-rows: minmax(0, 1fr);
  border-width: 2px;
}
chessjax-board:fullscreen .chessjax-cell {
  width: 100%;
  height: 100%;
  font-size: min(5vh, 5vw);
}
chessjax-board:fullscreen .chessjax-summary,
chessjax-board:fullscreen .chessjax-live,
chessjax-board:fullscreen .chessjax-help {
  max-width: min(86vh, 92vw);
  margin-left: auto;
  margin-right: auto;
  text-align: center;
  font-size: 1.1rem;
}
chessjax-board:fullscreen .chessjax-controls { justify-content: center; }
chessjax-board:fullscreen .chessjax-btn { min-width: 56px; min-height: 48px; font-size: 1.4rem; }
`;

function ensureBoardStyles() {
  if (document.getElementById("chessjax-styles")) return;
  const style = document.createElement("style");
  style.id = "chessjax-styles";
  style.textContent = BOARD_CSS;
  document.head.appendChild(style);
}

function renderGrid(parsed, lang, opts = {}) {
  ensureBoardStyles();
  const t = I18N[lang] || I18N.ru;
  const board = document.createElement("div");
  board.className = "chessjax-board";
  board.setAttribute("role", "toolbar");
  board.setAttribute("aria-roledescription", t.board);
  board.setAttribute("aria-label", t.board);

  for (let r = 0; r < 8; r++) {
    const rank = RANKS[r];
    for (let f = 0; f < 8; f++) {
      const cell = document.createElement("div");
      // Тёмная клетка — та, у которой сумма номера вертикали и горизонтали
      // чётная: a1 тёмная, h1 светлая. Индексы здесь обратные (r=0 — это
      // восьмая горизонталь), отсюда +1.
      cell.className = "chessjax-cell " + ((f + r + 1) % 2 === 0 ? "square-dark" : "square-light");
      cell.dataset.square = FILES[f] + rank;
      // Координаты для глаз — их рисует CSS из этих атрибутов, в DOM их нет.
      cell.dataset.file = FILES[f];
      cell.dataset.rank = rank;
      if (r === 7) cell.classList.add("coord-file");
      if (f === 0) cell.classList.add("coord-rank");
      board.appendChild(cell);
    }
  }
  applyPosition(board, parsed, lang, opts);
  return board;
}

// Расстановка на уже существующих клетках: узлы не пересоздаются, меняется
// только их содержимое. Это не косметика — на каждом ходе доска раньше
// собиралась заново (replaceChildren), сфокусированная клетка исчезала, и
// скринридер на новом фокусе заново объявлял контейнер («Шахматная доска,
// Шахматная доска, раздел») прежде чем прочитать ход. Теперь фокус и режим форм
// переживают ход, а буквенные клавиши доски (V, F, B, A, H) не теряются.
function applyPosition(board, parsed, lang, opts = {}) {
  const activeSquare = opts.activeSquare;
  const highlight = opts.highlight; // Set квадратов хода варианта — подсветка
  for (const cell of board.children) {
    const square = cell.dataset.square;
    const piece = parsed.board.get(square);
    // roving tabindex: только активная клетка в порядке таба, остальные доступны стрелками.
    cell.tabIndex = square === activeSquare ? 0 : -1;
    cell.classList.toggle("variant-highlight", !!(highlight && highlight.has(square)));
    cell.classList.toggle("has-piece", !!piece);
    if (piece) cell.classList.add("piece-" + piece.color);
    else cell.classList.remove("piece-w", "piece-b");
    // Дети клетки (глиф) пересобираются, только если фигура на ней правда
    // сменилась: лишние правки DOM — лишние события для скринридера.
    const want = piece ? piece.color + piece.piece : "";
    if (cell.dataset.piece !== want) {
      cell.dataset.piece = want;
      cell.replaceChildren();
      if (piece) {
        // Фигура — только для глаз. Скринридеру её читать нечего: клетка
        // названа aria-label'ом, а фигуру он произносил бы поверх («чёрный
        // конь» дважды либо «U+265E»). Для этого и aria-hidden. Юникод-глиф
        // остаётся фоллбэком на случай фигуры, для которой картинки нет.
        const key = piece.color === "w" ? piece.piece.toUpperCase() : piece.piece;
        const img = pieceNode(key);
        if (img) {
          // Фигура не должна попадаться на пути стрелок: «обзор → фигура
          // (картинка без имени) → клетка» — лишняя остановка без единого
          // слова, и NVDA на ней молчит. Как в Desmos: графический
          // калькулятор стрелкой вниз пропускается. Заодно это сбрасывает
          // подсветку NVDA на клетку — её aria-label он и произносит.
          cell.setAttribute("role", "img");
          cell.appendChild(img);
        } else {
          const glyph = document.createElement("span");
          glyph.setAttribute("aria-hidden", "true");
          glyph.textContent = GLYPH[key];
          cell.appendChild(glyph);
        }
      } else {
        cell.appendChild(document.createTextNode(" "));
      }
    }
    // «Чёрный ферзь D5» — фигура (с родом из i18n) перед координатой.
    const label = piece
      ? (() => {
          const l = pieceLabel(piece, lang);
          return l.charAt(0).toUpperCase() + l.slice(1) + " " + square.toUpperCase();
        })()
      : square.toUpperCase();
    if (cell.getAttribute("aria-label") !== label) cell.setAttribute("aria-label", label);
  }
}

function renderSummary(parsed, lang) {
  const p = document.createElement("p");
  p.className = "chessjax-summary";
  p.textContent = fenSummary(parsed, lang);
  return p;
}

// Фигуры — инлайн-SVG (набор Cburnett, Wikimedia Commons, свободная лицензия).
// Юникод-глифы рисуются разными шрифтами по-разному, а часть из них браузер
// подменяет эмодзи-вариантом — вместо контурной фигуры получается цветная
// картинка. SVG выглядит одинаково везде и масштабируется вместе с клеткой.
// Храним только внутренности <svg> (viewBox 0 0 45 45 задаёт pieceNode): так
// все 12 фигур укладываются в ~11 КБ и не требуют ни одного внешнего запроса.
const PIECE_IMAGE = {
  "K": "<g fill=\"none\" fill-rule=\"evenodd\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"><path stroke-linejoin=\"miter\" d=\"M22.5 11.63V6M20 8h5\"/><path fill=\"#fff\" stroke-linecap=\"butt\" stroke-linejoin=\"miter\" d=\"M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5\"/><path fill=\"#fff\" d=\"M12.5 37c5.5 3.5 14.5 3.5 20 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-2.5-7.5-12-10.5-16-4-3 6 6 10.5 6 10.5v7\"/><path d=\"M12.5 30c5.5-3 14.5-3 20 0m-20 3.5c5.5-3 14.5-3 20 0m-20 3.5c5.5-3 14.5-3 20 0\"/></g>",
  "Q": "<g style=\"fill:#ffffff;stroke:#000000;stroke-width:1.5;stroke-linejoin:round\"><path d=\"M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 30.7,10.9 L 25.5,24.5 L 22.5,10 L 19.5,24.5 L 14.3,10.9 L 14,25 L 6.5,13.5 L 9,26 z\"/><path d=\"M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 11,36 11,36 C 9.5,37.5 11,38.5 11,38.5 C 17.5,39.5 27.5,39.5 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 z\"/><path d=\"M 11.5,30 C 15,29 30,29 33.5,30\" style=\"fill:none\"/><path d=\"M 12,33.5 C 18,32.5 27,32.5 33,33.5\" style=\"fill:none\"/><circle cx=\"6\" cy=\"12\" r=\"2\" /><circle cx=\"14\" cy=\"9\" r=\"2\" /><circle cx=\"22.5\" cy=\"8\" r=\"2\" /><circle cx=\"31\" cy=\"9\" r=\"2\" /><circle cx=\"39\" cy=\"12\" r=\"2\" /></g>",
  "R": "<g style=\"opacity:1; fill:#ffffff; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;\" transform=\"translate(0,0.3)\"><path d=\"M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z \" style=\"stroke-linecap:butt;\" /><path d=\"M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z \" style=\"stroke-linecap:butt;\" /><path d=\"M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14\" style=\"stroke-linecap:butt;\" /><path d=\"M 34,14 L 31,17 L 14,17 L 11,14\" /><path d=\"M 31,17 L 31,29.5 L 14,29.5 L 14,17\" style=\"stroke-linecap:butt; stroke-linejoin:miter;\" /><path d=\"M 31,29.5 L 32.5,32 L 12.5,32 L 14,29.5\" /><path d=\"M 11,14 L 34,14\" style=\"fill:none; stroke:#000000; stroke-linejoin:miter;\" /></g>",
  "B": "<g style=\"opacity:1; fill:none; fill-rule:evenodd; fill-opacity:1; stroke:#000000; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:round; stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;\" transform=\"translate(0,0.6)\"><g style=\"fill:#ffffff; stroke:#000000; stroke-linecap:butt;\"><path d=\"M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.65,38.99 6.68,38.97 6,38 C 7.35,36.54 9,36 9,36 z\"/><path d=\"M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z\"/><path d=\"M 25 8 A 2.5 2.5 0 1 1 20,8 A 2.5 2.5 0 1 1 25 8 z\"/></g><path d=\"M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18\" style=\"fill:none; stroke:#000000; stroke-linejoin:miter;\"/></g>",
  "N": "<g style=\"opacity:1; fill:none; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;\" transform=\"translate(0,0.3)\"><path d=\"M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18\" style=\"fill:#ffffff; stroke:#000000;\" /><path d=\"M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10\" style=\"fill:#ffffff; stroke:#000000;\" /><path d=\"M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z\" style=\"fill:#000000; stroke:#000000;\" /><path d=\"M 15 15.5 A 0.5 1.5 0 1 1 14,15.5 A 0.5 1.5 0 1 1 15 15.5 z\" transform=\"matrix(0.866,0.5,-0.5,0.866,9.693,-5.173)\" style=\"fill:#000000; stroke:#000000;\" /></g>",
  "P": "<path d=\"m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 H 34 C 34,31.58 29.59,27.09 26.59,26.03 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z\" style=\"opacity:1; fill:#ffffff; fill-opacity:1; fill-rule:nonzero; stroke:#000000; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:miter; stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;\"/>",
  "k": "<g style=\"fill:none; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;\"><path d=\"M 22.5,11.63 L 22.5,6\" style=\"fill:none; stroke:#000000; stroke-linejoin:miter;\" id=\"path6570\"/><path d=\"M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25\" style=\"fill:#000000;fill-opacity:1; stroke-linecap:butt; stroke-linejoin:miter;\"/><path d=\"M 12.5,37 C 18,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 20,16 10.5,13 6.5,19.5 C 3.5,25.5 12.5,30 12.5,30 L 12.5,37\" style=\"fill:#000000; stroke:#000000;\"/><path d=\"M 20,8 L 25,8\" style=\"fill:none; stroke:#000000; stroke-linejoin:miter;\"/><path d=\"M 32,29.5 C 32,29.5 40.5,25.5 38.03,19.85 C 34.15,14 25,18 22.5,24.5 L 22.5,26.6 L 22.5,24.5 C 20,18 10.85,14 6.97,19.85 C 4.5,25.5 13,29.5 13,29.5\" style=\"fill:none; stroke:#ffffff;\"/><path d=\"M 12.5,30 C 18,27 27,27 32.5,30 M 12.5,33.5 C 18,30.5 27,30.5 32.5,33.5 M 12.5,37 C 18,34 27,34 32.5,37\" style=\"fill:none; stroke:#ffffff;\"/></g>",
  "q": "<g style=\"fill:#000000;stroke:#000000;stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round\"><path d=\"M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 30.7,10.9 L 25.5,24.5 L 22.5,10 L 19.5,24.5 L 14.3,10.9 L 14,25 L 6.5,13.5 L 9,26 z\" style=\"stroke-linecap:butt;fill:#000000\" /><path d=\"m 9,26 c 0,2 1.5,2 2.5,4 1,1.5 1,1 0.5,3.5 -1.5,1 -1,2.5 -1,2.5 -1.5,1.5 0,2.5 0,2.5 6.5,1 16.5,1 23,0 0,0 1.5,-1 0,-2.5 0,0 0.5,-1.5 -1,-2.5 -0.5,-2.5 -0.5,-2 0.5,-3.5 1,-2 2.5,-2 2.5,-4 -8.5,-1.5 -18.5,-1.5 -27,0 z\" /><path d=\"M 11.5,30 C 15,29 30,29 33.5,30\" /><path d=\"m 12,33.5 c 6,-1 15,-1 21,0\" /><circle cx=\"6\" cy=\"12\" r=\"2\" /><circle cx=\"14\" cy=\"9\" r=\"2\" /><circle cx=\"22.5\" cy=\"8\" r=\"2\" /><circle cx=\"31\" cy=\"9\" r=\"2\" /><circle cx=\"39\" cy=\"12\" r=\"2\" /><path d=\"M 11,38.5 A 35,35 1 0 0 34,38.5\" style=\"fill:none; stroke:#000000;stroke-linecap:butt;\" /><g style=\"fill:none; stroke:#ffffff;\"><path d=\"M 11,29 A 35,35 1 0 1 34,29\" /><path d=\"M 12.5,31.5 L 32.5,31.5\" /><path d=\"M 11.5,34.5 A 35,35 1 0 0 33.5,34.5\" /><path d=\"M 10.5,37.5 A 35,35 1 0 0 34.5,37.5\" /></g></g>",
  "r": "<g style=\"opacity:1; fill:#000000; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;\" transform=\"translate(0,0.3)\"><path d=\"M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z \" style=\"stroke-linecap:butt;\" /><path d=\"M 12.5,32 L 14,29.5 L 31,29.5 L 32.5,32 L 12.5,32 z \" style=\"stroke-linecap:butt;\" /><path d=\"M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z \" style=\"stroke-linecap:butt;\" /><path d=\"M 14,29.5 L 14,16.5 L 31,16.5 L 31,29.5 L 14,29.5 z \" style=\"stroke-linecap:butt;stroke-linejoin:miter;\" /><path d=\"M 14,16.5 L 11,14 L 34,14 L 31,16.5 L 14,16.5 z \" style=\"stroke-linecap:butt;\" /><path d=\"M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 L 11,14 z \" style=\"stroke-linecap:butt;\" /><path d=\"M 12,35.5 L 33,35.5 L 33,35.5\" style=\"fill:none; stroke:#ffffff; stroke-width:1; stroke-linejoin:miter;\" /><path d=\"M 13,31.5 L 32,31.5\" style=\"fill:none; stroke:#ffffff; stroke-width:1; stroke-linejoin:miter;\" /><path d=\"M 14,29.5 L 31,29.5\" style=\"fill:none; stroke:#ffffff; stroke-width:1; stroke-linejoin:miter;\" /><path d=\"M 14,16.5 L 31,16.5\" style=\"fill:none; stroke:#ffffff; stroke-width:1; stroke-linejoin:miter;\" /><path d=\"M 11,14 L 34,14\" style=\"fill:none; stroke:#ffffff; stroke-width:1; stroke-linejoin:miter;\" /></g>",
  "b": "<g style=\"opacity:1; fill:none; fill-rule:evenodd; fill-opacity:1; stroke:#000000; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:round; stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;\" transform=\"translate(0,0.6)\"><g style=\"fill:#000000; stroke:#000000; stroke-linecap:butt;\"><path d=\"M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.65,38.99 6.68,38.97 6,38 C 7.35,36.54 9,36 9,36 z\"/><path d=\"M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z\"/><path d=\"M 25 8 A 2.5 2.5 0 1 1 20,8 A 2.5 2.5 0 1 1 25 8 z\"/></g><path d=\"M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18\" style=\"fill:none; stroke:#ffffff; stroke-linejoin:miter;\"/></g>",
  "n": "<g style=\"opacity:1; fill:none; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;\" transform=\"translate(0,0.3)\"><path d=\"M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18\" style=\"fill:#ffffff; stroke:#000000;\" /><path d=\"M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10\" style=\"fill:#ffffff; stroke:#000000;\" /><path d=\"M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z\" style=\"fill:#000000; stroke:#000000;\" /><path d=\"M 15 15.5 A 0.5 1.5 0 1 1 14,15.5 A 0.5 1.5 0 1 1 15 15.5 z\" transform=\"matrix(0.866,0.5,-0.5,0.866,9.693,-5.173)\" style=\"fill:#000000; stroke:#000000;\" /></g>",
  "p": "<path d=\"m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 H 34 C 34,31.58 29.59,27.09 26.59,26.03 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z\" style=\"opacity:1; fill:#000000; fill-opacity:1; fill-rule:nonzero; stroke:#000000; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:miter; stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;\"/>"
};


// Узел фигуры. Каждая фигура собирается один раз и дальше клонируется:
// innerHTML на SVG-элементе разбирается в SVG-неймспейсе, DOMParser не нужен.
const PIECE_TEMPLATE = new Map();
function pieceNode(key) {
  const markup = PIECE_IMAGE[key];
  if (!markup) return null;
  let tpl = PIECE_TEMPLATE.get(key);
  if (!tpl) {
    tpl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    tpl.setAttribute("viewBox", "0 0 45 45");
    tpl.setAttribute("aria-hidden", "true");
    tpl.setAttribute("focusable", "false");
    tpl.classList.add("chessjax-piece");
    tpl.innerHTML = markup;
    PIECE_TEMPLATE.set(key, tpl);
  }
  return tpl.cloneNode(true);
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

// Банк фраз вердикта: случайная фраза без повтора подряд. Элемент — строка или
// функция от контекста { p, t }: p — взятая фигура (или undefined), t — словарь
// языка. Один и тот же механизм у обычного анализа и роаста.
const _lastPhrase = {};
function phraseFrom(bank, key, ctx) {
  const arr = Array.isArray(bank) && bank.length ? bank : [bank];
  let i = Math.floor(Math.random() * arr.length);
  if (arr.length > 1 && i === _lastPhrase[key]) i = (i + 1) % arr.length;
  _lastPhrase[key] = i;
  const phrase = arr[i];
  return typeof phrase === "function" ? phrase(ctx) : phrase;
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

// Тон преимущества: квадратная волна, частота 220·2^(white/2.5) Гц, где white —
// оценка белых в пешках (белые впереди — выше, чёрные — ниже). Ограничитель
// 70–1500 Гц: оценка движка в реальных партиях уходит за ±10 пешек (при угрозе
// мата и ±30), а без clamp частота уходит в ультра/инфразвук.
//
// Длительность — 50 мс (фидбек Дениза 13.09: «тон слишком длинный, буквально
// 50 мс делай пик»). Это метка-вспышка, а не звук: в авто-прогоне ходов тон
// звучит на каждом ходу, и полсекунды на каждом — каша. Атака 5 мс, отпускание
// к 50 мс — щелчок с высотой, по которой слышно перевес.
const ADVANTAGE_TONE_S = 0.05;
function playAdvantageTone(cpWhite) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();
  const white = cpWhite / 100; // сотые пешки → пешки
  const raw = 220 * Math.pow(2, white / 2.5);
  const freq = Math.min(1500, Math.max(70, raw));
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "square";
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(0.12, t0 + 0.005); // атака
  g.gain.setValueAtTime(0.12, t0 + 0.02); // удержание
  g.gain.linearRampToValueAtTime(0, t0 + ADVANTAGE_TONE_S); // отпускание
  osc.connect(g).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + ADVANTAGE_TONE_S);
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
    this._speedMs = 2500; // интервал автопросмотра; Ctrl+↑/↓ — быстрее/медленнее
    this._helpIdx = 0; // 0 = справка закрыта; 1..N = открыт раздел
    this._variant = null; // режим варианта: {positions, idx} альтернативной линии
    this._activeSquare = "a1"; // roving tabindex: клетка, с которой начинают навигацию стрелками
    this._wasFull = false; // прошлое состояние fullscreen — чтобы озвучивать только реальные переходы
    this._analysis = null; // результат анализа: {type, value, best} последнего info с pv
    this._analyzing = false; // идёт ли расчёт прямо сейчас
    this._analysisFen = null; // фен позиции, по которой запущен текущий анализ
    this._analysisMode = "off"; // анализ партии: вердикт каждому ходу при навигации
    this._roast = false; // скрытый режим роаста: неформальные вердикты
    this._aLongTimer = null; // таймер длинного нажатия A (2 сек → роаст)
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

    // Анонс перед доской. Скринридер, листая документ стрелками, сперва
    // натыкается на него: «Шахматная доска, область» и подсказка, чем доска
    // оживает. Дальше стрелки читают уже клетки — юникод-символы фигур.
    // Скрыт инлайновым стилем, а не классом: готовая страница mathmd вшивает
    // не все стили chessjax, и вид элемента не должен от них зависеть.
    this._boardIntro = document.createElement("p");
    this._boardIntro.className = "chessjax-board-intro";
    this._boardIntro.tabIndex = 0;
    this._boardIntro.setAttribute("role", "region");
    this._boardIntro.setAttribute("aria-label", t.boardIntro);
    // Состояние доски, которое читает скринридер: «свёрнуто» до Enter,
    // «развёрнуто» после. Без него скрытая доска молчит о себе, и после
    // Enter непонятно, что изменилось.
    this._boardIntro.setAttribute("aria-expanded", "false");
    this._boardIntro.style.cssText =
      "position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap";
    this._boardIntro.addEventListener("click", () => this._focusBoard());
    this._boardIntro.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this._focusBoard();
      }
    });
    wrap.appendChild(this._boardIntro);

    this._tableWrap = document.createElement("div");
    this._tableWrap.className = "chessjax-board-wrap";
    // Доска — открываемая область, и до Enter на анонсе её клетки скрыты от
    // скринридера совсем. Без этого обычная стрелка вниз просто читала сетку
    // («белая пешка E2, белая пешка E7…»): роль toolbar глушит болтливость
    // клеток, но не выкидывает их из дерева доступности.
    this._tableWrap.setAttribute("aria-hidden", "true");
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

    // Вердикт анализа партии — отдельный скрытый live-регион с polite:
    // не перебивает озвучку хода (assertive), а произносится после неё.
    this._verdictLive = document.createElement("p");
    this._verdictLive.className = "chessjax-verdict-live";
    this._verdictLive.setAttribute("aria-live", "polite");
    this._verdictLive.style.cssText =
      "position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap";
    wrap.appendChild(this._verdictLive);

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
    // Клик по клетке — тот же вход в доску, что и Enter: фокус встаёт на
    // клетку, и скринридер переходит в режим форм.
    this._tableWrap.addEventListener("click", (e) => {
      const cell = e.target && e.target.closest ? e.target.closest(".chessjax-cell") : null;
      if (!cell || !cell.dataset.square) return;
      this._focusBoard(cell.dataset.square);
    });
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

    // Клетки живут между ходами: обновляем расстановку на месте, а заново
    // собираем только если доски ещё нет (первый показ, смена разметки, ошибка).
    const grid = this._tableWrap.querySelector(".chessjax-board");
    if (grid) {
      // Подсветка лучшего хода живёт классом на клетке, а клетки между ходами не
      // пересобираются (v0.6.7) — перерисовка её больше не снимает. Гасим явно:
      // иначе она переживёт и Escape, и переход к другой позиции, а оставшаяся
      // пометка «лучший ход» в aria-label снова прозвучит на новом ходу.
      this._clearAnalysisHighlight(grid);
      applyPosition(grid, parsed, lang, { activeSquare: this._activeSquare, highlight });
    } else {
      this._tableWrap.replaceChildren(
        renderGrid(parsed, lang, { activeSquare: this._activeSquare, highlight }),
      );
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
        // Малословно: сам ход без номера («Белая пешка E2-E4»). Номер хода и цвет
        // слышны только в паузе авто-шоу (Ctrl+Пробел) — см. togglePlay.
        let text = moveSpeech(pos.move, lang);
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
  //   Пробел — продолжить с текущего хода / пауза; Ctrl+Пробел — с начала;
  //   Ctrl+↑/↓ — быстрее / медленнее;
  //   V — проиграть вариант (повторно — финал); Esc — выйти из варианта;
  //   H — справка по разделам.
  _onBoardKeydown(e) {
    const key = e.key;
    const mod = e.ctrlKey || e.metaKey;
    if ((key === "ArrowUp" || key === "ArrowDown" || key === "ArrowLeft" || key === "ArrowRight") && !mod && !e.altKey) {
      e.preventDefault();
      // RANKS идёт сверху вниз ("87654321"), поэтому вверх — это +1 к индексу.
      let dr = 0, df = 0;
      if (key === "ArrowUp") dr = 1;
      else if (key === "ArrowDown") dr = -1;
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
      this.togglePlay();
      return;
    }
    if (key === " " && mod) {
      e.preventDefault();
      this.playFromStart();
      return;
    }
    if ((key === "ArrowUp" || key === "ArrowDown") && mod) {
      e.preventDefault();
      this._speedMs = Math.min(6000, Math.max(1000, this._speedMs + (key === "ArrowUp" ? -500 : 500)));
      speak(this._live, (I18N[this.lang] || I18N.ru).speedAt(this._speedMs / 1000));
      if (this._timer) this._startAutoplay(); // перезапуск интервала с новой скоростью
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
      } else {
        // Нечего закрывать — Escape закрывает саму доску (порядок: сперва
        // вариант и анализ, они модальнее).
        e.preventDefault();
        this._leaveBoard();
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
        this.toggleRoast();
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

  // Вход в доску по Enter на анонсе (или клику): фокус встаёт на активную
  // клетку. С этого момента NVDA переключается в режим форм и отдаёт стрелки
  // доске — дальше _onBoardKeydown ведёт навигацию по клеткам.
  _focusBoard(square) {
    if (square) this._activeSquare = square;
    this._tableWrap.setAttribute("aria-hidden", "false");
    this._boardIntro.setAttribute("aria-expanded", "true");
    const cell =
      this._tableWrap.querySelector(`[data-square="${this._activeSquare}"]`) ||
      this._tableWrap.querySelector(".chessjax-cell");
    // Открытие и фокус — один шаг: скринридер объявляет клетку уже раскрытой,
    // а не «скрытой, затем показанной».
    if (cell) cell.focus();
  }

  // Выход из доски по Escape: клетки снова aria-hidden, фокус возвращается на
  // анонс — оттуда Enter открывает доску заново. Без этого Escape не делал
  // ничего, пока не открыт вариант или анализ, а фокус оставался в клетке.
  _leaveBoard() {
    this._tableWrap.setAttribute("aria-hidden", "true");
    this._boardIntro.setAttribute("aria-expanded", "false");
    this._boardIntro.focus();
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
      speak(this._live, this._roast ? t.roastOn : t.gameAnalysisOn);
      if (this._current) requestAnalysis(this._current.fen); // прогреть движок и текущую позицию
    } else {
      speak(this._live, t.gameAnalysisOff);
    }
  }

  // Скрытый режим роаста: удержание A 2 секунды. Движок хвалит/ругает ходы
  // неформально; включает анализ партии, если тот был выключен.
  toggleRoast() {
    this._roast = !this._roast;
    const t = I18N[this.lang] || I18N.ru;
    if (this._roast) {
      this._analysisMode = "on";
      speak(this._live, t.roastOn);
      if (this._current) requestAnalysis(this._current.fen);
    } else {
      speak(this._live, t.roastOff);
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
        // Тон по оценке: у B оценка уже проговаривается цифрой, тон дублирует её
        // звуком. При мате частота ушла бы в заоблачные значения — не играем.
        if (this._toneOk() && r.type !== "mate") {
          const moverIsWhite = fen.split(" ")[1] === "w";
          playAdvantageTone(moverIsWhite ? scoreToCp(r) : -scoreToCp(r));
        }
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
    // Контекст для фраз-функций: взятая фигура и словарь языка (в нём — названия
    // фигур, падежи и род, чтобы «съел пешку» и «пешка была вкусная» сходились).
    const ctx = { p: move.captured, t };
    let vText;
    if (this._roast) {
      // Банк фраз роаста: «great» со взятием — отдельный набор. Обычный вердикт —
      // подстраховка, если в банке нет такой категории.
      const bank =
        verdict === "great" && move.captured
          ? t.roast.greatCapture
          : t.roast[verdict] || t.verdict[verdict];
      vText = phraseFrom(bank, "roast:" + verdict + (move.captured ? ":cap" : ""), ctx);
    } else {
      vText = phraseFrom(t.verdict[verdict], "verdict:" + verdict, ctx);
    }
    const curCp = curR ? -scoreToCp(curR) : scoreToCp(prevR);
    // Вердикт — в polite-регион: NVDA сначала дочитывает ход (assertive _live),
    // затем произносит вердикт единым потоком, не перебивая навигацию.
    // Цифру преимущества не проговариваем — её величину маркирует тон.
    speak(this._verdictLive, vText);
    if (this._toneOk()) playAdvantageTone(move.color === "w" ? curCp : -curCp);
  }

  // Тон преимущества включён, пока доска не выключила его атрибутами
  // tone="off" (только тона) или sound="off" (вся звуковая подсистема).
  _toneOk() {
    return this.getAttribute("tone") !== "off" && this.getAttribute("sound") !== "off";
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

  // Снять подсветку лучшего хода: класс клетки — и всё, что он значит.
  // aria-label вернёт applyPosition при ближайшей перерисовке (она всегда
  // пересобирает подпись клетки), а класс надо снимать руками — см. _show.
  _clearAnalysisHighlight(grid = null) {
    const board = grid || (this._tableWrap && this._tableWrap.querySelector(".chessjax-board"));
    if (!board) return;
    for (const cell of board.querySelectorAll(".analysis-move")) cell.classList.remove("analysis-move");
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
    this._show({ announce: false }); // _show гасит класс подсветки — см. _clearAnalysisHighlight
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
      // Пауза — единственное место, где слышен номер хода: «Остановлено на ходе 23 белых».
      const t = I18N[this.lang] || I18N.ru;
      if (this._idx > 0 && this._current) {
        speak(this._live, t.pausedAt(Math.ceil(this._idx / 2), this._idx % 2 === 1 ? "w" : "b"));
      } else {
        speak(this._live, t.paused);
      }
      return;
    }
    if (this._atEnd()) {
      if (this._variant) this._variant.idx = 0;
      else this._idx = 0;
    }
    this._startAutoplay();
  }

  // Запуск интервала автопросмотра с текущей скоростью (_speedMs, Ctrl+↑/↓).
  // Отдельный метод, чтобы смена скорости на ходу перезапускала интервал.
  _startAutoplay() {
    if (this._timer) clearInterval(this._timer);
    const step = () => {
      if (this._atEnd()) {
        this.togglePlay();
        return;
      }
      this.next();
    };
    this._timer = setInterval(step, this._speedMs);
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
