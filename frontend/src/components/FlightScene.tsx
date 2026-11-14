import { useEffect, useMemo, useRef } from "react";
import type { Part, StackItem } from "@/lib/types";
import { THEMES, useSettings, type Theme } from "@/lib/settings";

export type FlightEvent = "liftoff" | "maxq" | "booster" | "stage" | "tli" | "arrival";

interface Seg { part: Part; qty: number; group: number; y: number; h: number; w: number; nw: number }
interface Booster { part: Part; qty: number; h: number; w: number }
interface Layout { segs: Seg[]; boosters: Booster[]; height: number; topProp: number; drops: number[] }

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const TANK = new Set(["upper", "lower"]);

function buildLayout(stack: StackItem[], parts: Record<string, Part>): Layout {
  const segs: Seg[] = [];
  const boosters: Booster[] = [];
  let g = 0, tank = false, eng = false, y = 0, prevW = 3;
  const groupHas: Record<number, { tank: boolean; eng: boolean }> = {};
  for (const s of stack) {
    const p = parts[s.part_id];
    if (!p) continue;
    if (p.category === "booster") {
      boosters.push({ part: p, qty: s.qty, w: p.diameter_m, h: clamp(Math.sqrt(p.mass_t) * 0.45, 3, 20) });
      continue;
    }
    if (TANK.has(p.category)) { if (eng) { g++; eng = false; } tank = true; }
    else if (p.category === "engine") eng = true;
    else if (eng) { g++; eng = false; tank = false; }
    groupHas[g] = { tank: (groupHas[g]?.tank ?? false) || TANK.has(p.category), eng: (groupHas[g]?.eng ?? false) || p.category === "engine" };
    let w = p.diameter_m, h = 1, nw = 0;
    if (p.category === "crew") { if (p.id === "apollo_les") { w = 0.5; h = 3; } else h = 1.4 + Math.sqrt(p.mass_t) * 0.38; }
    else if (TANK.has(p.category)) h = clamp(Math.sqrt(p.mass_t) * 0.36, 2, 18);
    else if (p.category === "engine") { nw = Math.min(p.diameter_m, (prevW / s.qty) * 0.95); w = nw * s.qty; h = 0.9 + nw * 0.45; }
    else if (p.category === "aero") { if (p.id.startsWith("fairing")) h = 3.6; else { w = prevW; h = 1.6; } }
    segs.push({ part: p, qty: s.qty, group: g, y, h, w, nw });
    y += h;
    if (p.category !== "engine") prevW = w;
  }
  void tank;
  // trailing fins-only group merges into the stage above
  const last = segs.at(-1)?.group ?? 0;
  if (last > 0 && !groupHas[last]?.tank && !groupHas[last]?.eng) segs.forEach((s) => { if (s.group === last) s.group = last - 1; });
  const prop = [...new Set(segs.filter((s) => s.part.category === "engine").map((s) => s.group))].sort((a, b) => a - b);
  const topProp = prop[0] ?? 0;
  return { segs, boosters, height: y || 1, topProp, drops: prop.slice(1).reverse() };
}

function drawSeg(ctx: CanvasRenderingContext2D, seg: Seg, cx: number, y: number, s: number, th: Theme, exits?: { x: number; y: number; w: number }[]) {
  const w = seg.w * s, h = seg.h * s, x = cx - w / 2, c = seg.part.category;
  if (c === "crew") {
    if (seg.part.id === "apollo_les") {
      ctx.fillStyle = th.nozzle[0];
      ctx.fillRect(cx - w * 0.15, y + h * 0.2, w * 0.3, h * 0.8);
      ctx.beginPath(); ctx.moveTo(cx, y); ctx.lineTo(cx + w / 2, y + h * 0.3); ctx.lineTo(cx - w / 2, y + h * 0.3); ctx.fill();
      return;
    }
    const gr = ctx.createLinearGradient(x, 0, x + w, 0);
    gr.addColorStop(0, th.capsule[1]); gr.addColorStop(0.45, th.capsule[0]); gr.addColorStop(1, th.capsule[1]);
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.moveTo(cx - w * 0.22, y); ctx.lineTo(cx + w * 0.22, y); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "rgba(15,23,42,0.8)";
    ctx.fillRect(cx - w * 0.08, y + h * 0.35, w * 0.16, h * 0.14);
  } else if (TANK.has(c)) {
    const gr = ctx.createLinearGradient(x, 0, x + w, 0);
    gr.addColorStop(0, th.body[0]); gr.addColorStop(0.4, th.body[1]); gr.addColorStop(1, th.body[2]);
    ctx.fillStyle = gr; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = th.band; ctx.fillRect(x, y + h * 0.22, w, Math.max(2, h * 0.05)); ctx.fillRect(x, y + h - Math.max(2, h * 0.04), w, Math.max(2, h * 0.04));
    ctx.fillStyle = "rgba(0,0,0,0.18)"; ctx.fillRect(x + w * 0.78, y, w * 0.22, h);
  } else if (c === "interstage") {
    ctx.fillStyle = "#94a3b8";
    ctx.beginPath(); ctx.moveTo(x + w * 0.04, y); ctx.lineTo(x + w * 0.96, y); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.fill();
  } else if (c === "engine") {
    const nw = seg.nw * s;
    for (let i = 0; i < seg.qty; i++) {
      const nx = cx - w / 2 + nw * i + nw / 2;
      const gr = ctx.createLinearGradient(0, y, 0, y + h);
      gr.addColorStop(0, th.nozzle[0]); gr.addColorStop(1, th.nozzle[1]);
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.moveTo(nx - nw * 0.22, y); ctx.lineTo(nx + nw * 0.22, y); ctx.quadraticCurveTo(nx + nw * 0.3, y + h * 0.6, nx + nw * 0.48, y + h);
      ctx.lineTo(nx - nw * 0.48, y + h); ctx.quadraticCurveTo(nx - nw * 0.3, y + h * 0.6, nx - nw * 0.22, y); ctx.fill();
      exits?.push({ x: nx, y: y + h, w: nw * 0.9 });
    }
  } else if (c === "aero") {
    if (seg.part.id.startsWith("fairing")) {
      const gr = ctx.createLinearGradient(x, 0, x + w, 0);
      gr.addColorStop(0, th.capsule[1]); gr.addColorStop(0.45, th.capsule[0]); gr.addColorStop(1, th.capsule[1]);
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + h * 0.55); ctx.quadraticCurveTo(x + w * 0.05, y, cx, y); ctx.quadraticCurveTo(x + w * 0.95, y, x + w, y + h * 0.55); ctx.lineTo(x + w, y + h); ctx.fill();
    } else {
      ctx.fillStyle = th.nozzle[0];
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - w * 0.22, y + h); ctx.lineTo(x, y + h); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x + w, y); ctx.lineTo(x + w + w * 0.22, y + h); ctx.lineTo(x + w, y + h); ctx.fill();
    }
  }
}

function drawBooster(ctx: CanvasRenderingContext2D, b: Booster, x: number, bottom: number, s: number, th: Theme, exits?: { x: number; y: number; w: number }[]) {
  const w = b.w * s, h = b.h * s, top = bottom - h;
  const gr = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  gr.addColorStop(0, th.body[0]); gr.addColorStop(0.4, th.body[1]); gr.addColorStop(1, th.body[2]);
  ctx.fillStyle = gr;
  ctx.beginPath(); ctx.moveTo(x - w / 2, bottom); ctx.lineTo(x - w / 2, top + w); ctx.quadraticCurveTo(x, top - w * 0.6, x + w / 2, top + w); ctx.lineTo(x + w / 2, bottom); ctx.fill();
  ctx.fillStyle = th.nozzle[1];
  ctx.beginPath(); ctx.moveTo(x - w * 0.3, bottom); ctx.lineTo(x + w * 0.3, bottom); ctx.lineTo(x + w * 0.42, bottom + w * 0.5); ctx.lineTo(x - w * 0.42, bottom + w * 0.5); ctx.fill();
  exits?.push({ x, y: bottom + w * 0.5, w: w * 0.8 });
}

function boosterSlots(b: Booster[], coreW: number, s: number) {
  const out: { b: Booster; dx: number }[] = [];
  b.forEach((bo) => {
    for (let i = 0; i < bo.qty; i++) {
      const side = i % 2 === 0 ? -1 : 1, ring = Math.floor(i / 2);
      out.push({ b: bo, dx: side * (coreW / 2 + (bo.w * s) * (0.55 + ring * 0.75)) });
    }
  });
  return out;
}

function flame(ctx: CanvasRenderingContext2D, e: { x: number; y: number; w: number }, len: number, spread: number, t: number) {
  const f = 0.85 + 0.3 * Math.sin(t * 40 + e.x);
  const L = len * f, W = e.w * spread;
  const gr = ctx.createLinearGradient(0, e.y, 0, e.y + L);
  gr.addColorStop(0, "rgba(255,255,240,0.95)"); gr.addColorStop(0.25, "rgba(255,200,90,0.9)"); gr.addColorStop(0.6, "rgba(255,110,20,0.55)"); gr.addColorStop(1, "rgba(255,60,0,0)");
  ctx.fillStyle = gr;
  ctx.beginPath(); ctx.moveTo(e.x - e.w / 2, e.y); ctx.lineTo(e.x + e.w / 2, e.y); ctx.quadraticCurveTo(e.x + W / 2, e.y + L * 0.4, e.x, e.y + L); ctx.quadraticCurveTo(e.x - W / 2, e.y + L * 0.4, e.x - e.w / 2, e.y); ctx.fill();
  const glow = ctx.createRadialGradient(e.x, e.y + 4, 0, e.x, e.y + 4, e.w * 2.5);
  glow.addColorStop(0, "rgba(255,220,150,0.6)"); glow.addColorStop(1, "rgba(255,120,0,0)");
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(e.x, e.y + 4, e.w * 2.5, 0, Math.PI * 2); ctx.fill();
}

interface Particle { x: number; y: number; vx: number; vy: number; r: number; a: number; life: number; c: string }
interface Debris { segs: Seg[]; boosters: { b: Booster; dx: number }[]; x: number; y: number; vx: number; vy: number; rot: number; vr: number; s: number }

export interface FlightSceneProps {
  stack: StackItem[]; parts: Record<string, Part>; progress: number; phase: "countdown" | "flight"; count: number; alert: boolean;
  planetUrl?: string; checkpoints: number[]; decided: boolean[]; onEvent?: (e: FlightEvent) => void; weather?: string | null;
}

export default function FlightScene(props: FlightSceneProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const settings = useSettings();
  const layout = useMemo(() => buildLayout(props.stack, props.parts), [props.stack, props.parts]);
  const pr = useRef(props);
  pr.current = props;
  const conf = useRef({ th: THEMES[settings.color], shake: settings.shake });
  conf.current = { th: THEMES[settings.color], shake: settings.shake };
  const img = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!props.planetUrl) return;
    const im = new Image();
    im.src = props.planetUrl;
    im.onload = () => { img.current = im; };
  }, [props.planetUrl]);

  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext("2d")!;
    let raf = 0, disp = 0, prevCam = 0, last = performance.now();
    const fired = new Set<string>();
    const detached = new Set<number>();
    let boostersGone = false;
    const parts: Particle[] = [];
    const debris: Debris[] = [];
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    const stars = Array.from({ length: 260 }, () => ({ x: Math.random(), y: Math.random(), z: Math.random() }));
    const clouds = Array.from({ length: 14 }, () => ({ x: Math.random(), wy: rnd(300, 3200), w: rnd(120, 340), a: rnd(0.25, 0.6) }));
    const stageTimes = layout.drops.map((g, i) => ({ g, p: 15 + i * (12 / Math.max(1, layout.drops.length)) }));

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(cv);

    const fire = (e: FlightEvent, key: string = e) => { if (!fired.has(key)) { fired.add(key); pr.current.onEvent?.(e); } };

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const t = now / 1000;
      const P = pr.current, { th, shake } = conf.current;
      const W = cv.clientWidth, H = cv.clientHeight;
      disp += (P.progress - disp) * Math.min(1, dt * 6);
      const ap = clamp(disp / 30), ignited = P.phase === "flight" || P.count <= 1;
      const groundY = H * 0.86;
      const s = Math.min((H * 0.52) / layout.height, (W * 0.05) / 3.5 + 6);
      const coreW = Math.max(...layout.segs.filter((g) => TANK.has(g.part.category)).map((g) => g.w), 2) * s;

      // events + staging
      if (P.phase === "flight") {
        if (disp > 0.3) fire("liftoff");
        if (disp > 7) fire("maxq");
        if (layout.boosters.length && disp > 9 && !boostersGone) {
          boostersGone = true; fire("booster");
          debris.push({ segs: [], boosters: boosterSlots(layout.boosters, coreW, s), x: W / 2, y: 0, vx: 0, vy: 0.5, rot: 0, vr: 0, s });
        }
        stageTimes.forEach(({ g, p }) => {
          if (disp > p && !detached.has(g)) {
            detached.add(g); fire("stage", `stage-${g}`);
            debris.push({ segs: layout.segs.filter((x) => x.group >= g && !detached.has(x.group + 1000)), boosters: [], x: W / 2, y: 0, vx: rnd(-0.4, 0.4), vy: 0.6, rot: 0, vr: rnd(-0.6, 0.6), s });
            layout.segs.forEach((x) => { if (x.group >= g) detached.add(x.group + 1000); });
          }
        });
        if (disp > 32) fire("tli");
        if (disp > 92) fire("arrival");
      }

      ctx.save();
      const shakeAmp = shake ? (ignited && ap < 0.35 ? (1 - ap / 0.35) * 5 + (P.phase === "countdown" ? 1.5 : 0) : 0) + (P.alert ? 1.5 : 0) : 0;
      if (shakeAmp) ctx.translate(rnd(-shakeAmp, shakeAmp), rnd(-shakeAmp, shakeAmp));

      if (disp < 31) {
        // ---------------- ASCENT SCENE
        const k = Math.pow(ap, 0.7);
        const sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, `rgb(${lerp(40, 0, k)},${lerp(82, 2, k)},${lerp(140, 8, k)})`);
        sky.addColorStop(0.7, `rgb(${lerp(120, 4, k)},${lerp(140, 10, k)},${lerp(170, 30, k)})`);
        sky.addColorStop(1, `rgb(${lerp(245, 10, k)},${lerp(170, 30, k)},${lerp(110, 60, k)})`);
        ctx.fillStyle = sky; ctx.fillRect(-10, -10, W + 20, H + 20);
        const sa = clamp((ap - 0.35) * 2);
        if (sa > 0) { ctx.fillStyle = `rgba(255,255,255,${sa})`; stars.forEach((st) => ctx.fillRect(st.x * W, st.y * H, st.z > 0.85 ? 2 : 1, st.z > 0.85 ? 2 : 1)); }

        const liftPx = P.phase === "flight" ? Math.pow(ap, 1.7) * H * 28 : 0;
        const noseY0 = groundY - layout.height * s;
        const noseY = Math.max(noseY0 - liftPx, H * 0.2);
        const cam = Math.max(0, liftPx - (noseY0 - H * 0.2));
        const camDelta = cam - prevCam; prevCam = cam;
        const cx = W / 2;

        if (ap > 0.5) {
          const R = W * 2.2, top = H * (1.35 - (ap - 0.5) * 0.9);
          const eg = ctx.createRadialGradient(cx, top + R, R * 0.96, cx, top + R, R);
          eg.addColorStop(0, "#0c4a6e"); eg.addColorStop(0.97, "#38bdf8"); eg.addColorStop(1, "rgba(125,211,252,0)");
          ctx.fillStyle = eg; ctx.beginPath(); ctx.arc(cx, top + R, R * 1.01, 0, Math.PI * 2); ctx.fill();
        }
        clouds.forEach((c) => {
          const y = groundY - c.wy + cam;
          if (y < -80 || y > H + 80) return;
          ctx.fillStyle = `rgba(255,255,255,${c.a * (1 - k * 0.6)})`;
          ctx.beginPath(); ctx.ellipse(c.x * W, y, c.w, c.w * 0.18, 0, 0, Math.PI * 2); ctx.fill();
        });
        // ground + tower
        const gy = groundY + cam;
        if (gy < H + 40) {
          const gg = ctx.createLinearGradient(0, gy, 0, H);
          gg.addColorStop(0, "#1f2937"); gg.addColorStop(1, "#030712");
          ctx.fillStyle = gg; ctx.fillRect(-10, gy, W + 20, H - gy + 20);
          const tx = cx - coreW / 2 - Math.max(40, coreW * 0.5), th2 = layout.height * s * 1.08, tw = Math.max(18, coreW * 0.28);
          ctx.strokeStyle = "#7c2d12"; ctx.lineWidth = 2;
          ctx.strokeRect(tx - tw, gy - th2, tw, th2);
          for (let yy = 0; yy < th2; yy += tw) { ctx.beginPath(); ctx.moveTo(tx - tw, gy - yy); ctx.lineTo(tx, gy - yy - tw); ctx.moveTo(tx, gy - yy); ctx.lineTo(tx - tw, gy - yy - tw); ctx.stroke(); }
          if (P.phase === "countdown") { ctx.beginPath(); ctx.moveTo(tx, gy - th2 * 0.82); ctx.lineTo(cx - coreW / 2, gy - th2 * 0.82); ctx.stroke(); }
          ctx.fillStyle = Math.sin(t * 4) > 0 ? "#ef4444" : "#7f1d1d"; ctx.beginPath(); ctx.arc(tx - tw / 2, gy - th2 - 4, 3, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#111827"; ctx.fillRect(cx - coreW, gy - 6, coreW * 2, 6);
        }

        // rocket
        const exits: { x: number; y: number; w: number }[] = [];
        const attached = layout.segs.filter((x) => !detached.has(x.group + 1000));
        const bottomG = Math.max(...attached.filter((x) => x.part.category === "engine").map((x) => x.group), -1);
        attached.forEach((sg) => drawSeg(ctx, sg, cx, noseY + sg.y * s, s, th, sg.group === bottomG ? exits : undefined));
        const coreBottom = noseY + Math.max(...attached.map((x) => x.y + x.h)) * s;
        if (!boostersGone) boosterSlots(layout.boosters, coreW, s).forEach(({ b, dx }) => drawBooster(ctx, b, cx + dx, coreBottom - b.part.diameter_m * s * 0.5, s, th, exits));

        if (ignited) {
          const inten = P.phase === "countdown" ? 0.45 : 1;
          ctx.globalCompositeOperation = "lighter";
          exits.forEach((e) => flame(ctx, e, e.w * (3 + ap * 5) * inten, 1 + ap * 3, t));
          ctx.globalCompositeOperation = "source-over";
          if (ap < 0.75) {
            const n = P.phase === "countdown" ? 1 : 3;
            exits.forEach((e) => {
              for (let i = 0; i < n; i++) {
                const nearPad = liftPx < H * 0.4;
                parts.push({ x: e.x + rnd(-e.w, e.w) / 2, y: e.y + e.w * 2.5, vx: nearPad ? rnd(-5, 5) : rnd(-0.6, 0.6), vy: nearPad ? rnd(-0.5, 0.6) : rnd(1, 3),
                  r: e.w * rnd(0.4, 0.9), a: 0.55 * (1 - ap), life: 0, c: nearPad ? "220,214,205" : "235,235,240" });
              }
            });
          }
        } else if (P.phase === "countdown" && P.count <= 3) {
          parts.push({ x: cx + rnd(-coreW, coreW) / 2, y: gy - 4, vx: rnd(-2, 2), vy: rnd(-1, -0.2), r: rnd(4, 9), a: 0.35, life: 0, c: "255,255,255" });
        }
        // vapor cone at max-q
        if (ap > 0.22 && ap < 0.42) {
          const a = Math.sin(((ap - 0.22) / 0.2) * Math.PI) * 0.35;
          ctx.fillStyle = `rgba(255,255,255,${a})`;
          ctx.beginPath(); ctx.ellipse(cx, noseY + layout.height * s * 0.35, coreW * 1.1, layout.height * s * 0.12, 0, 0, Math.PI * 2); ctx.fill();
        }
        // particles
        for (let i = parts.length - 1; i >= 0; i--) {
          const p = parts[i];
          p.x += p.vx; p.y += p.vy + camDelta; p.vx *= 0.985; p.r += 0.35; p.life += dt; p.a *= 0.985;
          if (p.a < 0.02 || p.y > H + 50) { parts.splice(i, 1); continue; }
          ctx.fillStyle = `rgba(${p.c},${p.a})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        }
        if (parts.length > 500) parts.splice(0, parts.length - 500);
        // debris
        debris.forEach((d) => {
          d.vy += 0.12; d.y += d.vy + camDelta * 0.2; d.x += d.vx; d.rot += d.vr * dt;
          ctx.save(); ctx.translate(d.x, noseY + d.y); ctx.rotate(d.rot);
          d.segs.forEach((sg) => drawSeg(ctx, sg, 0, sg.y * d.s, d.s, th));
          d.boosters.forEach(({ b, dx }, i) => {
            ctx.save(); ctx.translate(dx * (1 + d.y / 400), coreBottom - noseY); ctx.rotate((i % 2 ? 1 : -1) * Math.min(0.6, d.y / 600));
            drawBooster(ctx, b, 0, -b.part.diameter_m * s * 0.5, s, th); ctx.restore();
          });
          ctx.restore();
        });
      } else {
        // ---------------- SPACE TRANSIT SCENE
        const tt = clamp((disp - 32) / 66);
        ctx.fillStyle = "#02040a"; ctx.fillRect(-10, -10, W + 20, H + 20);
        const neb = ctx.createLinearGradient(0, H, W, 0);
        neb.addColorStop(0, "rgba(30,58,138,0)"); neb.addColorStop(0.5, "rgba(56,189,248,0.07)"); neb.addColorStop(1, "rgba(147,51,234,0)");
        ctx.fillStyle = neb; ctx.fillRect(0, 0, W, H);
        // milky-way band
        ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(-0.42);
        const mw = ctx.createLinearGradient(0, -H * 0.22, 0, H * 0.22);
        mw.addColorStop(0, "rgba(148,163,184,0)"); mw.addColorStop(0.5, "rgba(203,213,225,0.08)"); mw.addColorStop(1, "rgba(148,163,184,0)");
        ctx.fillStyle = mw; ctx.fillRect(-W, -H * 0.22, W * 2, H * 0.44); ctx.restore();
        stars.forEach((st, i) => {
          const x = ((st.x * W - t * (4 + st.z * 18)) % W + W) % W;
          const tw = 0.75 + 0.25 * Math.sin(t * (1 + st.z * 3) + i);
          ctx.fillStyle = st.z > 0.95 ? `rgba(191,219,254,${tw})` : `rgba(255,255,255,${(0.3 + st.z * 0.7) * tw})`;
          ctx.fillRect(x, st.y * H, st.z > 0.9 ? 2 : 1, st.z > 0.9 ? 2 : 1);
        });
        // distant sun + lens flare
        const sx = W * 0.55, sy = H * 0.1;
        const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, H * 0.35);
        sg.addColorStop(0, "rgba(255,251,235,0.95)"); sg.addColorStop(0.04, "rgba(254,240,138,0.55)"); sg.addColorStop(0.3, "rgba(251,191,36,0.08)"); sg.addColorStop(1, "rgba(251,191,36,0)");
        ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(sx, sy, H * 0.35, 0, Math.PI * 2); ctx.fill();
        ctx.globalCompositeOperation = "lighter";
        [[0.35, 10, "125,211,252"], [0.62, 22, "167,139,250"], [0.85, 6, "253,224,71"]].forEach(([k, rr, c]) => {
          const fx = sx + (W / 2 - sx) * 2 * (k as number), fy = sy + (H / 2 - sy) * 2 * (k as number);
          ctx.fillStyle = `rgba(${c},0.07)`; ctx.beginPath(); ctx.arc(fx, fy, (rr as number) * (H / 400), 0, Math.PI * 2); ctx.fill();
        });
        ctx.fillStyle = "rgba(255,250,230,0.12)"; ctx.fillRect(sx - W * 0.25, sy - 0.5, W * 0.5, 1);
        ctx.globalCompositeOperation = "source-over";
        // earth
        const ex = W * (0.14 - tt * 0.12), ey = H * (0.82 + tt * 0.1), er = H * (0.5 - 0.4 * tt);
        const eg = ctx.createRadialGradient(ex - er * 0.3, ey - er * 0.3, er * 0.1, ex, ey, er);
        eg.addColorStop(0, "#7dd3fc"); eg.addColorStop(0.5, "#0369a1"); eg.addColorStop(1, "#082f49");
        const atm = ctx.createRadialGradient(ex, ey, er * 0.98, ex, ey, er * 1.12);
        atm.addColorStop(0, "rgba(125,211,252,0.55)"); atm.addColorStop(1, "rgba(56,189,248,0)");
        ctx.fillStyle = atm; ctx.beginPath(); ctx.arc(ex, ey, er * 1.12, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = eg; ctx.beginPath(); ctx.arc(ex, ey, er, 0, Math.PI * 2); ctx.fill();
        ctx.save(); ctx.beginPath(); ctx.arc(ex, ey, er, 0, Math.PI * 2); ctx.clip();
        ctx.fillStyle = "rgba(34,197,94,0.22)";
        for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.ellipse(ex - er * 0.5 + k * er * 0.28 + Math.sin(t * 0.05 + k) * er * 0.05, ey - er * 0.35 + (k % 2) * er * 0.3, er * 0.18, er * 0.1, k, 0, Math.PI * 2); ctx.fill(); }
        ctx.strokeStyle = "rgba(255,255,255,0.22)"; ctx.lineWidth = Math.max(1.5, er * 0.03);
        for (let k = 0; k < 6; k++) { const yy = ey - er * 0.8 + k * er * 0.3; ctx.beginPath(); ctx.moveTo(ex - er + ((t * 6 + k * 40) % (er * 0.6)), yy); ctx.bezierCurveTo(ex - er * 0.3, yy - er * 0.08, ex + er * 0.2, yy + er * 0.08, ex + er, yy); ctx.stroke(); }
        const term = ctx.createLinearGradient(ex + er, ey + er, ex - er * 0.2, ey - er * 0.2);
        term.addColorStop(0, "rgba(2,4,10,0.85)"); term.addColorStop(0.55, "rgba(2,4,10,0)");
        ctx.fillStyle = term; ctx.fillRect(ex - er, ey - er, er * 2, er * 2); ctx.restore();
        // planet
        const px = W * 0.82, py = H * 0.32, pR = H * (0.06 + 0.25 * Math.pow(tt, 1.5));
        const glow = ctx.createRadialGradient(px, py, pR, px, py, pR * 1.5);
        glow.addColorStop(0, "rgba(186,230,253,0.25)"); glow.addColorStop(1, "rgba(186,230,253,0)");
        ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(px, py, pR * 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.save(); ctx.beginPath(); ctx.arc(px, py, pR, 0, Math.PI * 2); ctx.clip();
        if (img.current) { const iw = img.current.width, ih = img.current.height, m = Math.min(iw, ih); ctx.drawImage(img.current, (iw - m) / 2, (ih - m) / 2, m, m, px - pR, py - pR, pR * 2, pR * 2); }
        else { ctx.fillStyle = "#64748b"; ctx.fillRect(px - pR, py - pR, pR * 2, pR * 2); }
        const sh = ctx.createLinearGradient(px - pR, 0, px + pR, 0); sh.addColorStop(0, "rgba(0,0,0,0.7)"); sh.addColorStop(0.45, "rgba(0,0,0,0)");
        ctx.fillStyle = sh; ctx.fillRect(px - pR, py - pR, pR * 2, pR * 2); ctx.restore();
        ctx.strokeStyle = "rgba(255,247,220,0.5)"; ctx.lineWidth = Math.max(1, pR * 0.03);
        ctx.beginPath(); ctx.arc(px, py, pR, -Math.PI * 0.75, Math.PI * 0.05); ctx.stroke();
        // trajectory
        const p0 = [ex + er * 0.72, ey - er * 0.72], p1 = [W * 0.45, -H * 0.05], p2 = [px - pR * 0.95, py + pR * 0.3];
        const bz = (u: number) => [0, 1].map((i) => (1 - u) ** 2 * p0[i] + 2 * (1 - u) * u * p1[i] + u * u * p2[i]);
        ctx.setLineDash([5, 7]); ctx.strokeStyle = "rgba(0,229,255,0.35)"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.quadraticCurveTo(p1[0], p1[1], p2[0], p2[1]); ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle = "rgba(0,229,255,0.9)"; ctx.lineWidth = 2; ctx.beginPath();
        for (let u = 0; u <= tt; u += 0.01) { const [x, y] = bz(u); if (u === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke();
        P.checkpoints.forEach((c, i) => {
          if (c < 32) return;
          const [x, y] = bz(clamp((c - 32) / 66));
          ctx.fillStyle = i < P.decided.length ? (P.decided[i] ? "#34d399" : "#fb7185") : "#fbbf24";
          ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = "#020617"; ctx.stroke();
        });
        // craft
        const [cx2, cy2] = bz(tt), [ax, ay] = bz(Math.min(1, tt + 0.01));
        const ang = Math.atan2(ay - cy2, ax - cx2) + Math.PI / 2;
        const rem = layout.segs.filter((x) => x.group <= layout.topProp);
        const rh = Math.max(...rem.map((x) => x.y + x.h), 1);
        const cs = (H * 0.13) / rh;
        const burning = !P.alert && (tt < 0.1 || tt > 0.9 || Math.abs(tt - 0.5) < 0.025);
        parts.push({ x: cx2, y: cy2, vx: 0, vy: 0, r: 1.5, a: 0.5, life: 0, c: "0,229,255" });
        for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.a *= 0.97; if (p.a < 0.03) { parts.splice(i, 1); continue; } ctx.fillStyle = `rgba(${p.c},${p.a})`; ctx.fillRect(p.x, p.y, p.r, p.r); }
        ctx.save(); ctx.translate(cx2, cy2); ctx.rotate(ang); ctx.translate(0, -rh * cs / 2);
        const ex2: { x: number; y: number; w: number }[] = [];
        rem.forEach((sg) => drawSeg(ctx, sg, 0, sg.y * cs, cs, th, sg.group === layout.topProp ? ex2 : undefined));
        if (burning) { ctx.globalCompositeOperation = "lighter"; ex2.forEach((e) => flame(ctx, { ...e, w: Math.max(3, e.w) }, Math.max(14, e.w * 6), 2.2, t)); ctx.globalCompositeOperation = "source-over"; }
        ctx.restore();
      }
      // transition flash + alert vignette
      const fade = clamp(1 - Math.abs(disp - 31) / 2.5);
      if (fade > 0) { ctx.fillStyle = `rgba(2,4,10,${fade})`; ctx.fillRect(-10, -10, W + 20, H + 20); }
      // DONKI space-weather effects
      if (P.weather === "FLR") {
        const f = Math.pow(Math.max(0, Math.sin(t * 3)), 8) * 0.35;
        const sun = ctx.createRadialGradient(0, 0, 0, 0, 0, W * 0.7);
        sun.addColorStop(0, `rgba(255,240,170,${0.35 + f})`); sun.addColorStop(1, "rgba(255,200,50,0)");
        ctx.fillStyle = sun; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = `rgba(255,255,220,${f})`; ctx.fillRect(0, 0, W, H);
      } else if (P.weather === "SEP") {
        ctx.strokeStyle = "rgba(244,114,182,0.7)"; ctx.lineWidth = 1.2;
        for (let i = 0; i < 70; i++) {
          const x = ((i * 97.3 + t * 900) % (W + 200)) - 100, y = ((i * 53.7 + t * 520) % (H + 200)) - 100;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 26, y - 15); ctx.stroke();
        }
      } else if (P.weather === "GST") {
        for (let b = 0; b < 3; b++) {
          ctx.fillStyle = `rgba(52,211,153,${0.12 + 0.06 * Math.sin(t * 2 + b)})`;
          ctx.beginPath(); ctx.moveTo(0, 0);
          for (let x = 0; x <= W; x += 20) ctx.lineTo(x, H * (0.12 + b * 0.07) + Math.sin(x / 90 + t * (1.5 + b * 0.4)) * 22);
          ctx.lineTo(W, 0); ctx.fill();
        }
      } else if (P.weather === "IPS") {
        for (let i = 0; i < 6; i++) {
          ctx.fillStyle = i % 2 ? "rgba(0,229,255,0.18)" : "rgba(244,63,94,0.18)";
          ctx.fillRect(rnd(-40, 0), rnd(0, H), W + 80, rnd(3, 18));
        }
      } else if (P.weather === "CME") {
        for (let w = 0; w < 2; w++) {
          const r = ((t * 260 + w * W * 0.8) % (W * 1.6)) + 40;
          const pg = ctx.createRadialGradient(-W * 0.1, -H * 0.1, Math.max(1, r - 60), -W * 0.1, -H * 0.1, r + 24);
          pg.addColorStop(0, "rgba(192,132,252,0)"); pg.addColorStop(0.7, "rgba(192,132,252,0.28)"); pg.addColorStop(0.95, "rgba(240,220,255,0.6)"); pg.addColorStop(1, "rgba(240,220,255,0)");
          ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(-W * 0.1, -H * 0.1, r + 24, 0, Math.PI * 2); ctx.fill();
        }
      }
      if (P.alert) {
        const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.7);
        v.addColorStop(0, "rgba(220,38,38,0)"); v.addColorStop(1, `rgba(220,38,38,${0.25 + 0.15 * Math.sin(t * 7)})`);
        ctx.fillStyle = v; ctx.fillRect(-10, -10, W + 20, H + 20);
      }
      ctx.restore();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [layout]);

  return <canvas ref={ref} className="absolute inset-0 size-full" data-testid="flight-canvas" />;
}
