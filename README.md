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
<script type="module" src="https://cdn.jsdelivr.net/gh/denizsincar29/chessjax@v0.8.8/chessjax.js"></script>
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

Before the board sits an invisible region that screen readers read while
browsing with the arrow keys: "Chessboard, region. Press Enter to interact
with the board." Pressing Enter (or Space, or clicking the board) moves focus
onto a square and turns on NVDA's focus mode / JAWS forms mode — no need to
switch modes by hand. On focus you then hear the introduction: "Chessboard.
The arrows move over the squares, press H for usage instructions."
All help text is localized (ru/en/de/tr).

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
advantage. The tone is a 50-millisecond blip, not a note: it fires on every move
of a game review. **Escape** clears the highlight. Disable tones with
`tone="off"` (only the tone) or `sound="off"` (entire audio subsystem).

Both the plain and the roast verdicts are drawn from a phrase bank — five or more
wordings per verdict per language, picked at random without repeating the
previous one, so a reviewed game does not sound like the same three lines on a
loop. Captures in roast mode have their own lines, with the piece named in the
right case (Russian: «прекрасно съел ферзя», «пешка отправилась в утиль»). The
banks live in `I18N` (exported) next to the rest of the dictionary.

**Roast mode** — hold **A** for 2 seconds: same analysis, informal verdicts
("Oh, brilliant!", "That move is total crap!"). Turn on analysis if it was off.
Hold again to disable.

## Examples

- `examples/basic.html` — boards by FEN and PGN, language switch.
- `examples/story.html` — a game with move buttons in page text (Morphy's Opera Game).
- `examples/variations.html` — comments and `$[…]` variations, V/Esc keys.

## Board appearance

Pieces are inline SVG (the free Cburnett set from Wikimedia Commons), not Unicode
characters: a glyph depends on the installed font and some fonts replace the chess
symbols with colour emoji. The SVG markup is built into `chessjax.js` — no extra
files and no network requests — and is `aria-hidden`: the screen reader reads the
cell's `aria-label`, never the picture.

The board styles itself: on first render `chessjax.js` injects one `<style>` with
the 8 × 8 grid, the square size, rounded corners, a drop shadow, coordinates
(drawn by CSS from `data-file` / `data-rank` — they are not in the DOM), the
piece size and the fullscreen layout. The page needs no stylesheet of its own:
the tag plus the script is the whole integration (`test-bare.html` is exactly
that, and `test-dom.mjs` keeps it working). Square colours and the piece colours
stay yours: a page rule with higher specificity, e.g.
`.preview .chessjax-cell.square-dark`, overrides the defaults. The square side is
the CSS variable `--chessjax-square` (default `52px`); the grid reads the same
variable, so the board scales as one piece.

## Tests

- `test-fen.mjs` — units (FEN, PGN, positions, comments, variations): `node test-fen.mjs`.
- `test-dom.mjs` — DOM in a real browser (playwright + chromium): `playwright install chromium && node test-dom.mjs`.

## License

MIT © 2026 Deniz Sincar.
