#!/usr/bin/env python3
from PIL import Image
import json, math, os, struct

Z = 12
XS = list(range(3018, 3023))
YS = list(range(1710, 1714))
TW = TH = 256
W, H = len(XS) * TW, len(YS) * TH


def tile2lon(x, z):
    return x / (2**z) * 360.0 - 180.0


def tile2lat(y, z):
    n = math.pi - 2.0 * math.pi * y / (2**z)
    return math.degrees(math.atan(math.sinh(n)))


def merc_x(lon):
    return (lon + 180.0) / 360.0


def merc_y(lat):
    s = math.sin(math.radians(lat))
    s = max(-0.9999, min(0.9999, s))
    return 0.5 - math.log((1 + s) / (1 - s)) / (4 * math.pi)


def inv_merc_y(my):
    t = math.exp((0.5 - my) * 4 * math.pi)
    s = (t - 1) / (t + 1)
    s = max(-0.9999, min(0.9999, s))
    return math.degrees(math.asin(s))


west = tile2lon(XS[0], Z)
east = tile2lon(XS[-1] + 1, Z)
north = tile2lat(YS[0], Z)
south = tile2lat(YS[-1] + 1, Z)
print(f"stitch {W}x{H}")
print(f"bounds W{west:.5f} E{east:.5f} N{north:.5f} S{south:.5f}")

elev = Image.new("I;16", (W, H))
sat = Image.new("RGB", (W, H))
pxe = elev.load()

for i, x in enumerate(XS):
    for j, y in enumerate(YS):
        dem = Image.open(f"/tmp/tiles/dem/{x}_{y}.png").convert("RGB")
        s = Image.open(f"/tmp/tiles/sat/{x}_{y}.jpg").convert("RGB")
        sat.paste(s, (i * TW, j * TH))
        dp = dem.load()
        for u in range(TW):
            for v in range(TH):
                r, g, b = dp[u, v]
                h = (r * 256 + g + b / 256.0) - 32768
                pxe[i * TW + u, j * TH + v] = max(0, min(65535, int(round(h))))

MW, MH = 240, 192
elev_s = elev.resize((MW, MH), Image.Resampling.BILINEAR)
sat_s = sat.resize((1280, 1024), Image.Resampling.LANCZOS)
os.makedirs("/workspace/public/terrain", exist_ok=True)
sat_s.save("/workspace/public/terrain/satellite.jpg", "JPEG", quality=84)

es = elev_s.load()
vals = [es[x, y] for y in range(MH) for x in range(MW)]
mn, mx = min(vals), max(vals)
print("elev m", mn, mx)

flat = []
prev = Image.new("RGB", (MW, MH))
pp = prev.load()
for y in range(MH):
    for x in range(MW):
        h = int(es[x, y])
        flat.append(h)
        t = (h - mn) / max(1, mx - mn)
        if t < 0.35:
            rgb = (int(40 + t * 80), int(70 + t * 90), int(50 + t * 40))
        elif t < 0.55:
            rgb = (int(90 + t * 80), int(90 + t * 70), 70)
        elif t < 0.75:
            rgb = (140, 130, 120)
        else:
            rgb = (220, 225, 230)
        pp[x, y] = rgb
prev.resize((MW * 3, MH * 3), Image.NEAREST).save("/tmp/height_preview.png")

mx0, mx1 = merc_x(west), merc_x(east)
my0, my1 = merc_y(north), merc_y(south)


def lonlat_to_px(lon, lat, w, h):
    u = (merc_x(lon) - mx0) / (mx1 - mx0)
    v = (merc_y(lat) - my0) / (my1 - my0)
    return u * (w - 1), v * (h - 1)


def px_to_lonlat(x, y, w, h):
    u = x / (w - 1)
    v = y / (h - 1)
    lon = (mx0 + u * (mx1 - mx0)) * 360.0 - 180.0
    lat = inv_merc_y(my0 + v * (my1 - my0))
    return lon, lat


def sample(lon, lat):
    x, y = lonlat_to_px(lon, lat, MW, MH)
    x = max(0, min(MW - 1, x))
    y = max(0, min(MH - 1, y))
    x0, y0 = int(x), int(y)
    x1, y1 = min(MW - 1, x0 + 1), min(MH - 1, y0 + 1)
    tx, ty = x - x0, y - y0
    h00, h10 = es[x0, y0], es[x1, y0]
    h01, h11 = es[x0, y1], es[x1, y1]
    return (h00 * (1 - tx) + h10 * tx) * (1 - ty) + (h01 * (1 - tx) + h11 * tx) * ty


for k, lo, la in [
    ("port", 85.37778, 28.27972),
    ("usgs", 85.515, 28.271),
    ("drone", 85.46354, 28.33740),
]:
    print(k, f"{sample(lo, la):.0f}m")

best = None
for i in range(-8, 22):
    for j in range(-8, 22):
        la = 28.271 + i * 0.004
        lo = 85.515 + j * 0.004
        if not (west < lo < east and south < la < north):
            continue
        h = sample(lo, la)
        if best is None or h > best[0]:
            best = (h, lo, la)
print("local max", best)

raw = [
    (85.548, 28.330),
    (85.530, 28.300),
    (85.515, 28.271),
    (85.490, 28.272),
    (85.460, 28.274),
    (85.430, 28.276),
    (85.400, 28.278),
    (85.37778, 28.27972),
    (85.376, 28.255),
    (85.375, 28.230),
]
path = []
for lo, la in raw:
    x, y = lonlat_to_px(lo, la, MW, MH)
    bx, by = int(round(x)), int(round(y))
    bestp = (1e9, bx, by)
    for dy in range(-4, 5):
        for dx in range(-4, 5):
            xx = max(0, min(MW - 1, bx + dx))
            yy = max(0, min(MH - 1, by + dy))
            h = es[xx, yy]
            if h < bestp[0]:
                bestp = (h, xx, yy)
    lon, lat = px_to_lonlat(bestp[1], bestp[2], MW, MH)
    path.append({"lon": round(lon, 5), "lat": round(lat, 5), "elev": int(bestp[0])})

print("PATH")
for p in path:
    print(p)

dense = []
for a, b in zip(path, path[1:]):
    for i in range(14):
        t = i / 14
        lon = a["lon"] + (b["lon"] - a["lon"]) * t
        lat = a["lat"] + (b["lat"] - a["lat"]) * t
        dense.append({"lon": round(lon, 5), "lat": round(lat, 5), "elev": int(sample(lon, lat))})
dense.append({**path[-1], "elev": int(sample(path[-1]["lon"], path[-1]["lat"]))})

with open("/workspace/public/terrain/elev.bin", "wb") as f:
    f.write(struct.pack("<" + "H" * len(flat), *flat))

meta = {
    "west": west,
    "east": east,
    "north": north,
    "south": south,
    "meshWidth": MW,
    "meshHeight": MH,
    "min": int(mn),
    "max": int(mx),
    "path": dense,
    "waypoints": path,
}
with open("/workspace/public/terrain/meta.json", "w") as f:
    json.dump(meta, f)
print("bin", os.path.getsize("/workspace/public/terrain/elev.bin"), "pts", len(dense))
