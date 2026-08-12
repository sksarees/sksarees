import io
p = 'app.js'
s = io.open(p, encoding='utf-8').read()

def rep(old, new):
    global s
    assert old in s, 'NOT FOUND: ' + old[:70]
    s = s.replace(old, new, 1)

rep("""style="width:64px;height:48px;object-fit:cover;border-radius:8px;flex:0 0 auto"></a>'""",
    """style="width:64px;height:48px;object-fit:cover;border-radius:8px;flex:0 0 auto" onerror="imgSafe(this)" onload="imgLoaded(this)"></a>'""")

rep("""'<img src="' + esc(deal.img) + '" alt="' + esc(deal.name) + '" loading="lazy"></a></div>';""",
    """'<img src="' + esc(deal.img) + '" alt="' + esc(deal.name) + '" loading="lazy" onerror="imgSafe(this)" onload="imgLoaded(this)"></a></div>';""")

io.open(p, 'w', encoding='utf-8').write(s)
print('order-detail + deal-day patched; total imgLoaded:', s.count('onload="imgLoaded(this)"'))
