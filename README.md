# chessjax

Accessible chess boards for the web. Renders a position as a semantic table a
screen reader can navigate, and speaks every move — designed for NVDA.

## Install

Self-contained module; the move engine (chess.js) is vendored in `vendor/`.
Local:

```html
<script type="module" src="chessjax.js"></script>
```

Or from CDN (pinned to a tag):

```html
<script type="module" src="https://cdn.jsdelivr.net/gh/denizsincar29/chessjax@v0.6.1/chessjax.js"></script>
```

## Usage

```html
<chessjax-board pgn="morphy.pgn" move="10"></chessjax-board>
<chessjax-board fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"></chessjax-board>
```

Custom element names must contain a hyphen. Attributes: `fen` (position),
`pgn` (game; `move="N"` jumps to white's Nth move, `"N.5"` after Black's
reply), `lang`, `controls="off"`, `sound="off"`, `tone="off"`.

Buttons in page text jump the board by id:

```html
<chessjax-board id="carlsen" pgn="Carlsen.pgn" move="25"></chessjax-board>
<p>After <button chess="carlsen" move="29">move 29</button> the queen has nowhere to go.</p>
```

Language: `chessjax.setLanguage("ru" | "en" | "de" | "tr")`.

## Move speech

Each move is spoken briefly, without a number: "white pawn e2–e4", "black
pawn c×b5", "white, long castling", "white rook d8–d1, checkmate". The piece
and color are named; captures, castling, promotion, check and mate are all
announced. The move number is only heard in the auto-play pause:
"Stopped at white's move 23".

## Keyboard

The board is a div grid with a roving tabindex — one square in focus
(default a8), arrows move around it:

- **↑/↓/←/→** — move focus across the board; each square is spoken
  ("Black pawn b7", empty: "e5").
- **Ctrl/⌘+←/→** — rewind the game: previous/next move, spoken with a
  sound and any comment.
- **Space** — continue from the current move, or pause (pause announces
  the move number).
- **Ctrl/⌘+Space** — auto-play the game from the start.
- **Ctrl/⌘+↑/↓** — speed up / slow down auto-play (1–6 s per move, step 0.5 s).
- **V** — play the alternative line at the current move (if one exists in
  the comment); press again for the final line, **Esc** to leave the variation.
- **F** — fullscreen the board (toggle; same as the ⛶ button).
- **B** — best move in the current position by Stockfish (see Analysis).
  Press again or **Esc** to clear the highlight. Same as the ★ button.
- **A** — analyze the game: every move you navigate is spoken with an
  engine verdict. Press again to turn off. Hold **A for 2 seconds** — hidden
  roast mode with informal verdicts; hold again to disable.
- **H** — help: opens section by section (navigation, moves and comments,
  auto-play, variations, analysis); press again to page through.

On focus, NVDA/JAWS hear an introduction: "Chess board. To interact, enable
NVDA's focus mode or JAWS forms mode. Press H for help." All help text is
localized (ru/en/de/tr).

## Comments and variations

PGN comments (`{ … }`) are attached to the position after their move and
spoken together with it. After a move with a comment you're told a variation
is available (press **V**).

Write an alternative line right in the comment in `$[ … ]` — SAN moves that
replace the annotated move. The variation starts from the position BEFORE
that move:

```
1. e4 e5 2. Nf3 { $[Bc4 Nc6] Italian game — bishop pressures f7 } Nc6 …
```

**V** enters the variation (announced as "Variation: …" with the author's
comment); variation moves get an orange outline; **V** again — the final line,
**Esc** — back to the main game.

You can also drive the board with the buttons under it (⏮ ← → ▶ ⛶ ★ Σ) and
buttons in page text (`<button chess="id" move="N">`).

## Move sounds

Moves are spoken over realistic wooden tap sounds (WebAudio). Forward
navigation and auto-play play the move sound: castling is king + delayed rook,
captures get their own hit, ordinary moves use a piece-specific sound.
Sources: sounddino.com (free / no attribution). Disable with `sound="off"`.

## Analysis

The engine is Stockfish (WASM, loaded lazily from jsdelivr on first request,
in a separate worker — it never blocks the page). Analysis requests are
queued and cached per position; "best move" (B) skips the queue.

**Best move** — **B** or the ★ button: evaluates the position and speaks
"Evaluation: +0.4. Best move: e2–e4" (mate: "Mate in 3"). The best move's
square gets a blue outline.

**Analyze game** — **A** or the Σ button: each move gets an engine verdict —
"brilliant", "good", "interesting", "inaccuracy", "mistake", "blunder" (compared
against the engine's best move; otherwise by evaluation loss). The number is
never spoken — its magnitude is marked by a tone whose pitch rises with the
advantage. Disable tones with `tone="off"` (only the tone) or `sound="off"`
(entire audio subsystem).

**Roast mode** — hold **A** for 2 seconds: same analysis, informal verdicts
("Oh, beautiful!", "That move is complete nonsense!"). Turn on analysis if it
was off. Hold again to disable.

## Examples

- `examples/basic.html` — boards by FEN and PGN, language switch.
- `examples/story.html` — a game with move buttons in page text (Morphy's Opera Game).
- `examples/variations.html` — comments and `$[…]` variations, V/Esc keys.

## Tests

- `test-fen.mjs` — units (FEN, PGN, positions, comments, variations): `node test-fen.mjs`.
- `test-dom.mjs` — DOM in a real browser (playwright + chromium): `playwright install chromium && node test-dom.mjs`.

## License

MIT © 2026 Deniz Sincar.
