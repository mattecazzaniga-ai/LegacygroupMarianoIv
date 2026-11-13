import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
src, outdir = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("RGB")
a = np.asarray(im).astype(int)
W, H = im.size
white = (a.min(axis=2) > 228) & ((a.max(axis=2) - a.min(axis=2)) < 22)
m = Image.fromarray((white * 255).astype(np.uint8)).copy()
for x in range(0, W, 4):
    for y in (0, H - 1):
        if m.getpixel((x, y)) == 255: ImageDraw.floodfill(m, (x, y), 128)
for y in range(0, H, 4):
    for x in (0, W - 1):
        if m.getpixel((x, y)) == 255: ImageDraw.floodfill(m, (x, y), 128)
bg = np.asarray(m) == 128
fg = ~bg
def segments(profile, minlen):
    segs, start = [], None
    for i, v in enumerate(profile):
        if v and start is None: start = i
        if not v and start is not None:
            if i - start >= minlen: segs.append((start, i))
            start = None
    if start is not None and len(profile) - start >= minlen: segs.append((start, len(profile)))
    return segs
rows = segments(fg.sum(axis=1) > 15, 100)
print("rows", rows)
k = 0
names = sys.argv[3].split(",")
for (y0, y1) in rows:
    cols = segments(fg[y0:y1].sum(axis=0) > 15, 100)
    print("cols", cols)
    for (x0, x1) in cols:
        sub = fg[y0:y1, x0:x1]
        ys, xs = np.where(sub)
        by0, by1, bx0, bx1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        crop = im.crop((x0 + bx0, y0 + by0, x0 + bx1, y0 + by1))
        alpha = Image.fromarray((sub[by0:by1, bx0:bx1] * 255).astype(np.uint8))
        alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
        crop.putalpha(alpha)
        crop.save(f"{outdir}/{names[k]}.png")
        print(names[k], crop.size)
        k += 1
