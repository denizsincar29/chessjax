import http.server, pathlib, socketserver, threading, functools
from playwright.sync_api import sync_playwright

src = pathlib.Path("/tmp/chessjax-inline.js").read_text(encoding="utf-8").replace("</script", "<\\/script")
root = pathlib.Path("/tmp/liveboard"); root.mkdir(exist_ok=True)
(root / "index.html").write_text(
    '<!doctype html><meta charset="utf-8"><style>body{margin:20px;background:#222}</style>'
    '<chessjax-board id="b" pgn="/game.pgn" controls="none"></chessjax-board>'
    f'<script>{src}</script>', encoding="utf-8")
(root / "game.pgn").write_text("1. e4 e5 2. Nf3 Nc6 3. Bb5 a6\n", encoding="utf-8")

Handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(root))
srv = socketserver.TCPServer(("127.0.0.1", 0), Handler)
port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()

with sync_playwright() as p:
    br = p.chromium.launch()
    pg = br.new_page(viewport={"width": 700, "height": 700})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(f"http://127.0.0.1:{port}/index.html")
    pg.wait_for_selector("#b .chessjax-board .chessjax-cell", timeout=15000)
    pg.wait_for_timeout(500)
    for e in errs[:3]: print("  [pageerror] " + e[:200])

    def snap(label, want):
        c = pg.evaluate("""() => { const o={}; for (const el of document.querySelectorAll('#b .chessjax-cell')) {
            const r=el.getBoundingClientRect(); o[el.dataset.square]={x:Math.round(r.x),y:Math.round(r.y)}; } return o; }""")
        a1, a8, h1, h8 = c["a1"], c["a8"], c["h1"], c["h8"]
        print(f"--- {label} ---")
        print(f"  a1 ({a1['x']},{a1['y']})  a8 ({a8['x']},{a8['y']})  h1 ({h1['x']},{h1['y']})  h8 ({h8['x']},{h8['y']})")
        ok = True
        if want == "normal":
            if not a1["y"] > a8["y"]: print("  ОШИБКА: a1 не ниже a8"); ok = False
            if not a1["x"] < h1["x"]: print("  ОШИБКА: a1 не левее h1"); ok = False
        # Ряд — это ПРАВИЛЬНО общая координата y: клетки одного ряда стоят на
        # одной линии. Требовать «a8 выше h8» нельзя — они на одном уровне.
        if not a8["y"] == h8["y"]: print("  ОШИБКА: a8 и h8 не в одном ряду"); ok = False
        if not a1["y"] == h1["y"]: print("  ОШИБКА: a1 и h1 не в одном ряду"); ok = False
        if want == "normal":
            if not (a1["y"] == max(a1["y"],a8["y"],h1["y"],h8["y"]) and a1["x"] == min(a1["x"],a8["x"],h1["x"],h8["x"])):
                print("  ОШИБКА: a1 не в левом нижнем углу"); ok = False
            if not (a8["y"] == min(a1["y"],a8["y"],h1["y"],h8["y"]) and a8["x"] == min(a1["x"],a8["x"],h1["x"],h8["x"])):
                print("  ОШИБКА: a8 не в левом верхнем углу"); ok = False
            if ok: print("  ОК: a1 внизу слева, a8 наверху слева")
        else:
            if h8["y"] == max(a1["y"],a8["y"],h1["y"],h8["y"]) and h8["x"] == min(a1["x"],a8["x"],h1["x"],h8["x"]):
                print("  ОК: после поворота h8 внизу слева")
            else:
                print("  ОШИБКА: после поворота h8 не внизу слева"); ok = False
        return ok

    snap("без флипа (ждали a1 внизу слева, a8 наверху слева)", "normal")
    pg.screenshot(path="/tmp/board-normal.png", clip={"x":10,"y":10,"width":480,"height":480})
    pg.evaluate("() => document.getElementById('b').toggleFlip()")
    pg.wait_for_timeout(400)
    snap("после поворота на 180 (ждали h8 внизу слева)", "flip")
    pg.screenshot(path="/tmp/board-flipped.png", clip={"x":10,"y":10,"width":480,"height":480})

    pg.evaluate("() => { const b=document.getElementById('b'); if(b._flipped) b.toggleFlip(); b._focusBoard('a1'); }")
    pg.wait_for_timeout(200)
    seq = []
    for _ in range(4):
        pg.keyboard.press("ArrowUp"); pg.wait_for_timeout(120)
        seq.append(pg.evaluate("() => document.getElementById('b')._activeSquare"))
    print("--- стрелки: 4×вверх из a1, без флипа ---")
    print("  " + " → ".join(seq) + ("   ОК" if seq == ["a2","a3","a4","a5"] else "   ОШИБКА, ждали a2 a3 a4 a5"))
    br.close()
srv.shutdown()
