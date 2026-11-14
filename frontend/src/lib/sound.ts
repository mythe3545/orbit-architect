import { getSettings } from "@/lib/settings";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let rumble: { src: AudioBufferSourceNode; filter: BiquadFilterNode; gain: GainNode } | null = null;
let alarmTimer: number | null = null;

function ac(): AudioContext | null {
  const s = getSettings();
  if (!s.sound) return null;
  try {
    if (!ctx) {
      ctx = new AudioContext();
      master = ctx.createGain();
      master.connect(ctx.destination);
    }
    master!.gain.value = s.volume;
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function noise(c: AudioContext) {
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
  }
  return noiseBuf;
}

function tone(freq: number, dur: number, type: OscillatorType = "sine", vol = 0.3, at = 0, slideTo?: number) {
  const c = ac();
  if (!c || !master) return;
  const t = c.currentTime + at;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function burst(dur: number, freq: number, vol: number) {
  const c = ac();
  if (!c || !master) return;
  const src = c.createBufferSource();
  src.buffer = noise(c);
  const f = c.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = freq;
  const g = c.createGain();
  const t = c.currentTime;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(master);
  src.start(t);
  src.stop(t + dur);
}

export const sfx = {
  click: () => tone(1400, 0.05, "square", 0.05),
  countdown: (n: number) => tone(n <= 0 ? 1320 : 880, n <= 0 ? 0.5 : 0.14, "sine", 0.25),
  boom: () => { burst(2.2, 260, 1.2); tone(55, 1.2, "sine", 0.5, 0, 30); },
  staging: () => { burst(0.6, 900, 0.7); tone(180, 0.25, "triangle", 0.25, 0, 60); },
  rumbleStart() {
    const c = ac();
    if (!c || !master || rumble) return;
    const src = c.createBufferSource();
    src.buffer = noise(c);
    src.loop = true;
    const filter = c.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 500;
    const gain = c.createGain();
    gain.gain.value = 0.0001;
    gain.gain.exponentialRampToValueAtTime(1.1, c.currentTime + 0.8);
    src.connect(filter).connect(gain).connect(master);
    src.start();
    rumble = { src, filter, gain };
  },
  rumbleSet(intensity: number) {
    if (!rumble || !ctx) return;
    const i = Math.max(0.0001, intensity);
    rumble.gain.gain.setTargetAtTime(1.1 * i, ctx.currentTime, 0.2);
    rumble.filter.frequency.setTargetAtTime(150 + 500 * i, ctx.currentTime, 0.3);
  },
  rumbleStop() {
    if (!rumble || !ctx) return;
    const r = rumble;
    rumble = null;
    r.gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.4);
    setTimeout(() => { try { r.src.stop(); } catch { /* already stopped */ } }, 1500);
  },
  alarmStart() {
    if (alarmTimer !== null) return;
    let hi = false;
    const beep = () => { hi = !hi; tone(hi ? 880 : 660, 0.28, "square", 0.08); };
    beep();
    alarmTimer = window.setInterval(beep, 340);
  },
  alarmStop() {
    if (alarmTimer !== null) { clearInterval(alarmTimer); alarmTimer = null; }
  },
  good: () => { tone(988, 0.12, "sine", 0.22); tone(1319, 0.25, "sine", 0.22, 0.1); },
  bad: () => tone(150, 0.4, "sawtooth", 0.12, 0, 90),
  success: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.5, "triangle", 0.2, i * 0.13)),
  fail: () => tone(440, 1.2, "sawtooth", 0.12, 0, 90),
  stopAll() { this.alarmStop(); this.rumbleStop(); },
};
