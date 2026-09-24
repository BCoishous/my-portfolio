import { useState, useRef, useEffect, useCallback } from "react";
import "./Echodrift.css";

// ── Reference coordinate system (matches JUCE layout constants) ────────────
const REF_W = 1208, REF_H = 319, NAV_H = 83;

// ── Param IDs (must match echodrift_dsp.cpp enum) ─────────────────────────
const P = {
  DELAY_TIME: 0, DELAY_FEEDBACK: 1, DELAY_MIX: 2, DELAY_POWER: 3,
  REVERB_SIZE: 4, REVERB_DECAY: 5, REVERB_MIX: 6, REVERB_POWER: 7,
  MOD_ON: 8, MOD_RATE: 9, MOD_DEPTH: 10, ORDER: 11, UNIT_POWER: 12,
  DELAY_SPREAD: 13, DELAY_PING_PONG: 14, DELAY_HP_CUT: 15, DELAY_LP_CUT: 16,
  DELAY_SYNC: 17, DELAY_DIVISION: 18, DELAY_SATURATION: 19, DELAY_REVERSE: 20,
  REVERB_HP_CUT: 21, REVERB_LP_CUT: 22, BPM: 23,
};

const PARAM_MAP = {
  delayTime: P.DELAY_TIME,   delayFb: P.DELAY_FEEDBACK, delayMix: P.DELAY_MIX,
  delayPower: P.DELAY_POWER, rvSize: P.REVERB_SIZE,     rvDecay: P.REVERB_DECAY,
  rvMix: P.REVERB_MIX,       rvPower: P.REVERB_POWER,   modOn: P.MOD_ON,
  modRate: P.MOD_RATE,        modDepth: P.MOD_DEPTH,     order: P.ORDER,
  unitPower: P.UNIT_POWER,    spread: P.DELAY_SPREAD,    pingPong: P.DELAY_PING_PONG,
  delayHp: P.DELAY_HP_CUT,   delayLp: P.DELAY_LP_CUT,   sat: P.DELAY_SATURATION,
  reverse: P.DELAY_REVERSE,   rvHp: P.REVERB_HP_CUT,    rvLp: P.REVERB_LP_CUT,
};

const AMBER = "#c49a52";
const TEAL  = "#4fa8a8";

// ── Helpers ────────────────────────────────────────────────────────────────
function normVal(v, min, max, skew = 1) {
  const n = Math.max(0, Math.min(1, (v - min) / (max - min)));
  return skew === 1 ? n : Math.pow(n, 1 / skew);
}
function denormVal(n, min, max, skew = 1) {
  const s = skew === 1 ? n : Math.pow(n, skew);
  return min + s * (max - min);
}
// 7:30 → 4:30 arc: -135° to +135°
function knobDeg(v, min, max, skew = 1) {
  return -135 + normVal(v, min, max, skew) * 270;
}

// ── Image knob (uses actual plugin PNG, rotated) ───────────────────────────
function KnobImg({ img, cx, cy, size, value, min, max, skew = 1, onChange }) {
  const dragRef = useRef(null);
  return (
    <img
      src={`/img/${img}`}
      alt=""
      draggable={false}
      style={{
        position: "absolute",
        left: cx - size / 2,
        top:  cy - size / 2,
        width: size,
        height: size,
        transform: `rotate(${knobDeg(value, min, max, skew)}deg)`,
        cursor: "ns-resize",
        touchAction: "none",
        userSelect: "none",
      }}
      onPointerDown={e => {
        e.currentTarget.setPointerCapture(e.pointerId);
        dragRef.current = { y: e.clientY, norm: normVal(value, min, max, skew) };
      }}
      onPointerMove={e => {
        if (!dragRef.current) return;
        const dy = (dragRef.current.y - e.clientY) / 200;
        const n  = Math.max(0, Math.min(1, dragRef.current.norm + dy));
        onChange(denormVal(n, min, max, skew));
      }}
      onPointerUp={() => { dragRef.current = null; }}
    />
  );
}

// ── Image toggle button ────────────────────────────────────────────────────
function BtnImg({ imgOff, imgOn, cx, cy, w, h, value, onChange }) {
  return (
    <img
      src={value ? `/img/${imgOn}` : `/img/${imgOff}`}
      alt=""
      draggable={false}
      style={{
        position: "absolute",
        left: cx - w / 2,
        top:  cy - h / 2,
        width: w,
        height: h,
        cursor: "pointer",
        userSelect: "none",
      }}
      onClick={() => onChange(!value)}
    />
  );
}

// ── Canvas knob (for settings panel) ──────────────────────────────────────
function Knob({ value, min, max, onChange, color, label, size = 48, skew = 1 }) {
  const canvasRef = useRef(null);
  const dragRef   = useRef(null);
  const norm = normVal(value, min, max, skew);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w   = size * dpr;
    canvas.width  = w;
    canvas.height = w;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    const cx = size / 2, cy = size / 2, r = size * 0.36;
    const startAngle = 0.75 * Math.PI;
    const arcSpan   = 1.5  * Math.PI;
    const valAngle  = startAngle + norm * arcSpan;

    ctx.clearRect(0, 0, size, size);

    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, startAngle + arcSpan, false);
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = "round";
    ctx.stroke();

    if (norm > 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, startAngle, valAngle, false);
      ctx.strokeStyle = color;
      ctx.lineWidth   = 2.5;
      ctx.lineCap     = "round";
      ctx.stroke();
    }

    const grad = ctx.createRadialGradient(cx - r * 0.15, cy - r * 0.15, r * 0.1, cx, cy, r * 0.6);
    grad.addColorStop(0, "#2a2820");
    grad.addColorStop(1, "#141210");
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.58, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth   = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(valAngle) * r * 0.28, cy + Math.sin(valAngle) * r * 0.28);
    ctx.lineTo(cx + Math.cos(valAngle) * r * 0.52, cy + Math.sin(valAngle) * r * 0.52);
    ctx.strokeStyle = color;
    ctx.lineWidth   = 2;
    ctx.lineCap     = "round";
    ctx.stroke();
  }, [norm, color, size]);

  return (
    <div className="knob-wrap">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{ width: size, height: size, cursor: "ns-resize", touchAction: "none" }}
        onPointerDown={e => {
          e.currentTarget.setPointerCapture(e.pointerId);
          dragRef.current = { y: e.clientY, norm };
        }}
        onPointerMove={e => {
          if (!dragRef.current) return;
          const dy = (dragRef.current.y - e.clientY) / 180;
          const n  = Math.max(0, Math.min(1, dragRef.current.norm + dy));
          onChange(denormVal(n, min, max, skew));
        }}
        onPointerUp={() => { dragRef.current = null; }}
      />
      {label && <span className="knob-label">{label}</span>}
    </div>
  );
}

// ── Toggle pill (for settings panel) ──────────────────────────────────────
function TogglePill({ label, value, color, onChange }) {
  return (
    <div className="toggle-wrap" onClick={() => onChange(!value)}>
      <div className={`toggle-track ${value ? "on" : ""}`} style={{ "--tc": color }}>
        <div className="toggle-thumb" />
      </div>
      <span className="knob-label">{label}</span>
    </div>
  );
}

// ── Clip presets ───────────────────────────────────────────────────────────
const CLIPS = [
  {
    label: "Drums", url: "/audio/clip-drums.wav",
    defaults: {
      delayTime: 150, delayFb: 14,  delayMix: 30,  delayPower: true,
      rvSize: 30,     rvDecay: 1.1, rvMix: 32,     rvPower: true,
      modOn: false,   modRate: 1.0, modDepth: 20,  order: false, unitPower: true,
      spread: 5,      pingPong: false, delayHp: 150, delayLp: 6000,
      sat: 20,        reverse: false,  rvHp: 100,   rvLp: 14000,
    },
  },
  {
    label: "Guitar", url: "/audio/clip-guitar.wav",
    defaults: {
      delayTime: 375, delayFb: 38,  delayMix: 48,  delayPower: true,
      rvSize: 60,     rvDecay: 3.0, rvMix: 45,     rvPower: true,
      modOn: true,    modRate: 0.6, modDepth: 15,  order: false, unitPower: true,
      spread: 20,     pingPong: true, delayHp: 80,  delayLp: 4500,
      sat: 10,        reverse: false, rvHp: 80,    rvLp: 13000,
    },
  },
  {
    label: "Piano", url: "/audio/clip-piano.wav",
    defaults: {
      delayTime: 571, delayFb: 45,  delayMix: 52,  delayPower: true,
      rvSize: 80,     rvDecay: 5.5, rvMix: 60,     rvPower: true,
      modOn: false,   modRate: 0.3, modDepth: 10,  order: true,  unitPower: true,
      spread: 10,     pingPong: true, delayHp: 60,  delayLp: 3500,
      sat: 5,         reverse: false, rvHp: 60,    rvLp: 12000,
    },
  },
];

// ── Main component ─────────────────────────────────────────────────────────
export default function Echodrift() {
  const [params,     setParams]     = useState(CLIPS[0].defaults);
  const [activeClip, setActiveClip] = useState(null);
  const [isPlaying,  setIsPlaying]  = useState(false);
  const [isLoading,  setIsLoading]  = useState(false);
  const [error,      setError]      = useState(null);
  const [scale,      setScale]      = useState(1);

  const outerRef     = useRef(null);
  const audioCtxRef  = useRef(null);
  const workletRef   = useRef(null);
  const sourceRef    = useRef(null);

  // Scale plugin to container width
  useEffect(() => {
    if (!outerRef.current) return;
    const ro = new ResizeObserver(entries => {
      setScale(entries[0].contentRect.width / REF_W);
    });
    ro.observe(outerRef.current);
    return () => ro.disconnect();
  }, []);

  const toRaw = (name, value) =>
    typeof value === "boolean" ? (value ? 1 : 0) : value;

  const sendParam = useCallback((id, raw) => {
    workletRef.current?.port.postMessage({ type: "setParam", id, value: raw });
  }, []);

  const setParam = useCallback((name, value) => {
    setParams(p => ({ ...p, [name]: value }));
    const id = PARAM_MAP[name];
    if (id !== undefined) sendParam(id, toRaw(name, value));
  }, [sendParam]);

  const stopAudio = useCallback(() => {
    try { sourceRef.current?.stop(); }      catch (_) {}
    try { audioCtxRef.current?.close(); }   catch (_) {}
    sourceRef.current   = null;
    workletRef.current  = null;
    audioCtxRef.current = null;
    setIsPlaying(false);
    setActiveClip(null);
  }, []);

  const playClip = useCallback(async (clip) => {
    if (isLoading) return;
    if (activeClip === clip.url && isPlaying) { stopAudio(); return; }

    stopAudio();
    setIsLoading(true);
    setError(null);

    const nextParams = { ...params, ...clip.defaults };
    setParams(nextParams);

    try {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      await ctx.audioWorklet.addModule("/echodrift-worklet.js");
      const node = new AudioWorkletNode(ctx, "echodrift-processor");
      workletRef.current = node;

      Object.entries(nextParams).forEach(([name, value]) => {
        const id = PARAM_MAP[name];
        if (id !== undefined)
          node.port.postMessage({ type: "setParam", id, value: toRaw(name, value) });
      });

      const resp = await fetch(clip.url);
      if (!resp.ok) throw new Error(`Could not load ${clip.label}`);
      const buf  = await ctx.decodeAudioData(await resp.arrayBuffer());

      const src   = ctx.createBufferSource();
      src.buffer  = buf;
      src.loop    = true;
      src.connect(node);
      node.connect(ctx.destination);
      src.start();
      sourceRef.current = src;

      setActiveClip(clip.url);
      setIsPlaying(true);
    } catch (e) {
      setError(e.message);
      stopAudio();
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, activeClip, isPlaying, params, stopAudio]); // eslint-disable-line

  useEffect(() => () => stopAudio(), [stopAudio]);

  const p = params;
  // Large knob: 82×82 bounding box in reference px
  // Small knob: 62×62
  // Button: 46×46 (square), 78×46 (unit power)
  const KL = 82, KS = 62, BS = 46;

  return (
    <section id="echodrift" className="ed-section">
      <p className="section-label">Echodrift</p>
      <p className="ed-byline">
        Analog delay + hall reverb — C++ / JUCE plugin, running here via WebAssembly.
      </p>

      {/* ── Plugin shell ──────────────────────────────────────────────── */}
      <div className="plugin-outer" ref={outerRef}
           style={{ height: scale * REF_H, maxWidth: REF_W }}>
        <div className="plugin-inner"
             style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>

          {/* Backgrounds */}
          <div className="plugin-navbar" style={{
            width: REF_W, height: NAV_H,
            background: 'url("/img/navbar.png") left top / 1208px auto no-repeat',
          }} />
          <div className="plugin-faceplate" style={{
            position: "absolute", left: 0, top: NAV_H,
            width: REF_W, height: REF_H - NAV_H,
            background: 'url("/img/faceplate.png") left top / 1208px 236px no-repeat',
          }} />

          {/* ── Unit power ──────────────────────────────────────────── */}
          <BtnImg imgOff="btn_power_off.png" imgOn="btn_power_on.png"
                  cx={158} cy={275} w={78} h={46}
                  value={p.unitPower} onChange={v => setParam("unitPower", v)} />

          {/* ── Delay knobs ─────────────────────────────────────────── */}
          <KnobImg img="knob_yellow_large.png" cx={284} cy={209} size={KL}
                   value={p.delayTime} min={1} max={2000} skew={0.4}
                   onChange={v => setParam("delayTime", Math.round(v))} />
          <KnobImg img="knob_yellow_large.png" cx={381} cy={209} size={KL}
                   value={p.delayFb} min={0} max={100}
                   onChange={v => setParam("delayFb", Math.round(v))} />
          <KnobImg img="knob_yellow_large.png" cx={479} cy={209} size={KL}
                   value={p.delayMix} min={0} max={100}
                   onChange={v => setParam("delayMix", Math.round(v))} />
          <BtnImg imgOff="btn_yellow_off.png" imgOn="btn_yellow_on.png"
                  cx={562} cy={209} w={BS} h={BS}
                  value={p.delayPower} onChange={v => setParam("delayPower", v)} />

          {/* ── Reverb knobs ─────────────────────────────────────────── */}
          <KnobImg img="knob_blue_large.png" cx={657} cy={209} size={KL}
                   value={p.rvSize} min={0} max={100}
                   onChange={v => setParam("rvSize", Math.round(v))} />
          <KnobImg img="knob_blue_large.png" cx={753} cy={209} size={KL}
                   value={p.rvDecay} min={0.1} max={10} skew={0.5}
                   onChange={v => setParam("rvDecay", +v.toFixed(1))} />
          <KnobImg img="knob_blue_large.png" cx={851} cy={209} size={KL}
                   value={p.rvMix} min={0} max={100}
                   onChange={v => setParam("rvMix", Math.round(v))} />
          <BtnImg imgOff="btn_blue_off.png" imgOn="btn_blue_on.png"
                  cx={930} cy={209} w={BS} h={BS}
                  value={p.rvPower} onChange={v => setParam("rvPower", v)} />

          {/* ── Mod section ──────────────────────────────────────────── */}
          <BtnImg imgOff="btn_blue_off.png" imgOn="btn_blue_on.png"
                  cx={991} cy={176} w={BS} h={BS}
                  value={p.modOn} onChange={v => setParam("modOn", v)} />
          <BtnImg imgOff="btn_yellow_off.png" imgOn="btn_yellow_on.png"
                  cx={991} cy={262} w={BS} h={BS}
                  value={p.order} onChange={v => setParam("order", v)} />
          <KnobImg img="knob_yellow_small.png" cx={1086} cy={161} size={KS}
                   value={p.modRate} min={0.1} max={5} skew={0.5}
                   onChange={v => setParam("modRate", +v.toFixed(2))} />
          <KnobImg img="knob_blue_small.png" cx={1086} cy={251} size={KS}
                   value={p.modDepth} min={0} max={100}
                   onChange={v => setParam("modDepth", Math.round(v))} />
        </div>
      </div>

      {/* ── Settings panel — always visible, matches plugin SettingsPanel aesthetic */}
      <div className="ed-adv">
        {/* Delay section (0–960 in plugin coords): character sub-group + filter sub-group */}
        <div className="ed-adv-group ed-adv-group--delay">
          <span className="ed-adv-label" style={{ color: AMBER }}>delay</span>
          <div className="ed-adv-delay-inner">
            <div className="ed-adv-sub">
              <Knob label="sat" value={p.sat} min={0} max={100} color={AMBER} size={46}
                    onChange={v => setParam("sat", Math.round(v))} />
              <TogglePill label="reverse" value={p.reverse} color={AMBER}
                          onChange={v => setParam("reverse", v)} />
              <TogglePill label="ping pong" value={p.pingPong} color={AMBER}
                          onChange={v => setParam("pingPong", v)} />
            </div>
            <div className="ed-adv-inner-div" />
            <div className="ed-adv-sub">
              <Knob label="spread" value={p.spread} min={0} max={150} color={AMBER} size={46}
                    onChange={v => setParam("spread", Math.round(v))} />
              <Knob label="hp cut" value={p.delayHp} min={20} max={2000} skew={0.4} color={AMBER} size={46}
                    onChange={v => setParam("delayHp", Math.round(v))} />
              <Knob label="lp cut" value={p.delayLp} min={500} max={20000} skew={0.4} color={AMBER} size={46}
                    onChange={v => setParam("delayLp", Math.round(v))} />
            </div>
          </div>
        </div>

        {/* Reverb section (960–1208 in plugin coords) */}
        <div className="ed-adv-group ed-adv-group--reverb">
          <span className="ed-adv-label" style={{ color: TEAL }}>reverb</span>
          <div className="ed-adv-sub">
            <Knob label="hp cut" value={p.rvHp} min={20} max={2000} skew={0.4} color={TEAL} size={46}
                  onChange={v => setParam("rvHp", Math.round(v))} />
            <Knob label="lp cut" value={p.rvLp} min={500} max={20000} skew={0.4} color={TEAL} size={46}
                  onChange={v => setParam("rvLp", Math.round(v))} />
          </div>
        </div>
      </div>

      {/* ── Transport ──────────────────────────────────────────────────── */}
      <div className="ed-transport">
        <div className="ed-clips">
          {CLIPS.map(clip => {
            const active = activeClip === clip.url && isPlaying;
            return (
              <button key={clip.url}
                      className={`ed-clip-btn ${active ? "active" : ""}`}
                      onClick={() => playClip(clip)}
                      disabled={isLoading}>
                <span className="ed-clip-icon">{active ? "■" : "▶"}</span>
                {clip.label}
              </button>
            );
          })}
          {isPlaying && (
            <button className="ed-stop-btn" onClick={stopAudio}>Stop</button>
          )}
        </div>
        {isLoading && <span className="ed-status">Loading…</span>}
        {error     && <span className="ed-error">{error}</span>}
      </div>

      <p className="ed-hint">Drag knobs up · click a source to play</p>
    </section>
  );
}
