# chessjax

JS library to view chessboards on webpages and read them using screenreaders.
«MathJax для шахмат»: семантическая HTML-таблица + озвучка ходов для NVDA.

## Подключение

Самодостаточное — один модуль, движок ходов (chess.js 0.13.4) вендорен в `vendor/`.
Локально:

```html
<script type="module" src="chessjax.js"></script>
```

Или с CDN (jsdelivr, пин на тег) — свои зависимости (`vendor/chess.js`) chessjax
подтягивает сам относительно своего URL:

```html
<script type="module" src="https://cdn.jsdelivr.net/gh/denizsincar29/chessjax@v0.1.0/chessjax.js"></script>
```

## Использование

```html
<chessjax-board pgn="morphy.pgn" move="10"></chessjax-board>
<chessjax-board fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"></chessjax-board>
```

Имя кастомного элемента обязано содержать дефис (`<chessboard>` невалиден).
Атрибуты: `fen` (позиция), `pgn`/`pgn-src` (партия, `move="N"` — показать N-й ход
белых, `"N.5"` — после ответа чёрных), `lang`, `controls="none"`.

Кнопки в тексте переключают доску по id:

```html
<chessjax-board id="carlsen" pgn="Carlsen.pgn" move="25"></chessjax-board>
<p>После <button chess="carlsen" move="29">29-го хода</button> ферзю стало некуда деваться.</p>
```

Язык: `chessjax.setLanguage("ru" | "en" | "de" | "tr")`.

## Звуки ходов

Ходы озвучиваются реалистичными деревянными ударами (WebAudio, файлы в `sound/`,
подтягиваются с CDN относительно модуля). Навигация вперёд и авто-шоу (▶) играют
звук хода: рокировка — король + отложенная ладья, взятие — отдельный удар, обычный
ход — звук конкретной фигуры (пешка звучит легче ладьи, у короля звук тяжёлый).
Источник записей — sounddino.com (free / royalty-free / no attribution). Отключить:
`<chessjax-board ... sound="off">`.

## Примеры

- `examples/basic.html` — доски по FEN и PGN, переключатель языка.
- `examples/story.html` — партия с кнопками-ходами в тексте (Опера-партия Морфи).

## Тесты

- `test-fen.mjs` — юниты (FEN, PGN, позиции): `node test-fen.mjs`.
- `test-dom.mjs` — DOM в реальном браузере (playwright + chromium):
  `playwright install chromium && node test-dom.mjs`.
