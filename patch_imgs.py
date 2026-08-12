import io
p = 'app.js'
s = io.open(p, encoding='utf-8').read()

def rep(old, new, count=1):
    global s
    assert old in s, 'NOT FOUND: ' + old[:60]
    s = s.replace(old, new, count)

# cardHTML main img
rep("""'<img src="' + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy" decoding="async" width="800" height="600" onerror="imgSafe(this)">'""",
    """'<img src="' + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy" decoding="async" width="800" height="600" onerror="imgSafe(this)" onload="imgLoaded(this)">'""")

# aiCard
rep("""'<img src="' + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy" onerror="imgSafe(this)">'""",
    """'<img src="' + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy" onerror="imgSafe(this)" onload="imgLoaded(this)">'""")

# co-upsell card (same pattern as aiCard — distinct by surrounding? both same line; aiCard patched first, co-upsell has different context)
rep("""'<div class="co-up-card"><img src="' + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy" onerror="imgSafe(this)">'""",
    """'<div class="co-up-card"><img src="' + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy" onerror="imgSafe(this)" onload="imgLoaded(this)">'""")

# cart item img
rep("""'<img src="' + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy" width="200" height="150" onerror="imgSafe(this)">'""",
    """'<img src="' + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy" width="200" height="150" onerror="imgSafe(this)" onload="imgLoaded(this)">'""")

# order detail img
rep("""onerror="imgSafe(this)"></a>""",
    """onerror="imgSafe(this)" onload="imgLoaded(this)"></a>""")

# wishlist card img
rep("""'<img src="' + esc(p.img) + '" alt="" loading="lazy" onerror="imgSafe(this)">'""",
    """'<img src="' + esc(p.img) + '" alt="" loading="lazy" onerror="imgSafe(this)" onload="imgLoaded(this)">'""")

# deal of day img
rep("""onerror="imgSafe(this)"></a></div>""",
    """onerror="imgSafe(this)" onload="imgLoaded(this)"></a></div>""")

io.open(p, 'w', encoding='utf-8').write(s)
print('app.js imgs patched:', s.count('onload="imgLoaded(this)"'))
