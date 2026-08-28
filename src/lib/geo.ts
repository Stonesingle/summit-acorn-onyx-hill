import * as THREE from "three";

export const M_PER_UNIT = 10;

export const ORIGIN = {
  lat: 28.27972,
  lon: 85.37778,
};

export const TERRAIN_META = {
  west: 85.25390625,
  east: 85.693359375,
  north: 28.381735043223106,
  south: 28.07198030177985,
  width: 256,
  height: 192,
  min: 1104.63525390625,
  max: 7191.16552734375,
} as const;

const M_PER_DEG_LAT = 111_320;
const M_PER_DEG_LON = 111_320 * Math.cos((ORIGIN.lat * Math.PI) / 180);

export type GeoPoint = { lon: number; lat: number; alt: number; s?: number };

export type FlowData = {
  lengthM: number;
  dropM: number;
  glacier: GeoPoint;
  port: GeoPoint;
  points: GeoPoint[];
};

export const SITES = {
  glacier: {
    lon: 85.52815461726692,
    lat: 28.28731746075177,
    alt: 5125.82,
    label: "冰崩源区",
    sub: "朗塘利鲁峰北坡",
  },
  port: {
    lon: 85.37778,
    lat: 28.27972,
    alt: 1831.55,
    label: "吉隆口岸",
    sub: "日喀则市吉隆县",
  },
} as const;

export function toWorld(lat: number, lon: number, alt: number): THREE.Vector3 {
  const x = ((lon - ORIGIN.lon) * M_PER_DEG_LON) / M_PER_UNIT;
  const z = ((ORIGIN.lat - lat) * M_PER_DEG_LAT) / M_PER_UNIT;
  const y = alt / M_PER_UNIT;
  return new THREE.Vector3(x, y, z);
}

export function fromWorld(v: THREE.Vector3): GeoPoint {
  return {
    lon: ORIGIN.lon + (v.x * M_PER_UNIT) / M_PER_DEG_LON,
    lat: ORIGIN.lat - (v.z * M_PER_UNIT) / M_PER_DEG_LAT,
    alt: v.y * M_PER_UNIT,
  };
}

export function formatLat(lat: number) {
  return `${lat.toFixed(5)}°N`;
}

export function formatLon(lon: number) {
  return `${lon.toFixed(5)}°E`;
}

export function sampleFlow(points: GeoPoint[], t: number): GeoPoint {
  if (points.length === 0) return SITES.glacier;
  const clamped = Math.min(1, Math.max(0, t));
  const total = points[points.length - 1]?.s ?? 1;
  const dist = clamped * total;
  let lo = 0;
  let hi = points.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if ((points[mid].s ?? 0) < dist) lo = mid + 1;
    else hi = mid;
  }
  const i = Math.max(1, lo);
  const a = points[i - 1];
  const b = points[i];
  const sa = a.s ?? 0;
  const sb = b.s ?? sa;
  const u = sb === sa ? 0 : (dist - sa) / (sb - sa);
  return {
    lon: a.lon + (b.lon - a.lon) * u,
    lat: a.lat + (b.lat - a.lat) * u,
    alt: a.alt + (b.alt - a.alt) * u,
    s: dist,
  };
}

export function flowCurve(points: GeoPoint[]) {
  const vecs = points.map((p) => toWorld(p.lat, p.lon, p.alt + 6));
  return new THREE.CatmullRomCurve3(vecs, false, "catmullrom", 0.12);
}

export async function loadSimData(): Promise<{
  heights: Float32Array;
  flow: FlowData;
}> {
  const [heightBuf, flow] = await Promise.all([
    fetch("/terrain/heightmap.f32").then((r) => r.arrayBuffer()),
    fetch("/terrain/flow-path.json").then((r) => r.json() as Promise<FlowData>),
  ]);
  return { heights: new Float32Array(heightBuf), flow };
}

export function buildTerrainGeometry(heights: Float32Array) {
  const { width: W, height: H, west, east, north, south } = TERRAIN_META;
  const verts = new Float32Array(W * H * 3);
  const uvs = new Float32Array(W * H * 2);
  let p = 0;
  let u = 0;
  for (let iy = 0; iy < H; iy++) {
    for (let ix = 0; ix < W; ix++) {
      const lon = west + (ix / (W - 1)) * (east - west);
      const lat = north - (iy / (H - 1)) * (north - south);
      const alt = heights[iy * W + ix];
      const x = ((lon - ORIGIN.lon) * M_PER_DEG_LON) / M_PER_UNIT;
      const z = ((ORIGIN.lat - lat) * M_PER_DEG_LAT) / M_PER_UNIT;
      const y = alt / M_PER_UNIT;
      verts[p++] = x;
      verts[p++] = y;
      verts[p++] = z;
      uvs[u++] = ix / (W - 1);
      uvs[u++] = 1 - iy / (H - 1);
    }
  }
  const idx: number[] = [];
  for (let iy = 0; iy < H - 1; iy++) {
    for (let ix = 0; ix < W - 1; ix++) {
      const a = iy * W + ix;
      const b = a + 1;
      const c = a + W;
      const d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(verts, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}
