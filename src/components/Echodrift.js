import { useState, useRef, useEffect, useCallback } from "react";
import "./Echodrift.css";

// ── Parameter ID enum — must match echodrift_dsp.cpp ParamId ──────────────
const P = {
  DELAY_TIME:       0,
  DELAY_FEEDBACK:   1,
  DELAY_MIX:        2,
  DELAY_POWER:      3,
  REVERB_SIZE:      4,
  REVERB_DECAY:     5,
  REVERB_MIX:       6,
  REVERB_POWER:     7,
  MOD_ON:           8,
  MOD_RATE:         9,
  MOD_DEPTH:        10,
  ORDER:            11,
  UNIT_POWER:       12,
  DELAY_SPREAD:     13,
  DELAY_PING_PONG:  14,
  DELAY_HP_CUT:     15,
  DELAY_LP_CUT:     16,
  DELAY_SYNC:       17,
  DELAY_DIVISION:   18,
  DELAY_SATURATION: 19,
  DELAY_REVERSE:    20,
  REVERB_HP_CUT:    21,
  REVERB_LP_CUT:    22,
  BPM:              23,
};

// ── Rotary knob ────────────────────────────────────────────────────────────
function Knob ({ value, min, max, onChange, color, label, size = 64, skew = 1 }) {
  const canvasRef   = useRef(null);
  const dragStart   = useRef(null);

  const toNorm = (v) => {
    const n = (v - min) / (max - min);
    return skew === 1 ? n : Math.pow(n, 1 / skew);
  };
  const fromNorm = (n) => {
    const skewed = skew === 1 ? n : Math.pow(n, skew);
    return min + skewed * (max - min);
  };

  const norm = toNorm(value);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx  = canvas.getContext("2d");
    const dpr  = window.devicePixelRatio || 1;
    const w    = size * dpr;
    canvas.width  = w;
    canvas.height = w;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const r  = size * 0.36;

    ctx.clearRect(0, 0, size, size);

    const startAngle = 0.75 * Math.PI;
    const arcSpan    = 1.5  * Math.PI;
    const valAngle   = startAngle + norm * arcSpan;

    // Track
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, startAngle + arcSpan, false);
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth   = 3;
    ctx.lineCap     = "round";
    ctx.stroke();

    // Value fill
    if (norm > 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, startAngle, valAngle, false);
      ctx.strokeStyle = color;
      ctx.lineWidth   = 3;
      ctx.lineCap     = "round";
      ctx.stroke();
    }

    // Knob body
    const grad = ctx.createRadialGradient(cx - r * 0.15, cy - r * 0.15, r * 0.1, cx, cy, r * 0.6);
    grad.addColorStop(0, "#2a2e3f");
    grad.addColorStop(1, "#12141c");
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.58, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth   = 1;
    ctx.stroke();

    // Indicator line
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(valAngle) * r * 0.28,
               cy + Math.sin(valAngle) * r * 0.28);
    ctx.lineTo(cx + Math.cos(valAngle) * r * 0.52,
               cy + Math.sin(valAngle) * r * 0.52);
    ctx.strokeStyle = color;
    ctx.lineWidth   = 2;
    ctx.lineCap     = "round";
    ctx.stroke();
  }, [norm, color, size]);

  const handlePointerDown = useCallback((e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStart.current = { y: e.clientY, norm };
  }, [norm]);

  const handlePointerMove = useCallback((e) => {
    if (!dragStart.current) return;
    const dy    = dragStart.current.y - e.clientY;
    const delta = dy / 200;
    const newNorm  = Math.min(1, Math.max(0, dragStart.current.norm + delta));
    onChange(fromNorm(newNorm));
  }, [fromNorm, onChange]);

  const handlePointerUp = useCallback(() => {
    dragStart.current = null;
  }, []);

  return (
    <div className="knob-wrap">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{ width: size, height: size, cursor: "ns-resize", touchAction: "none" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
      {label && <span className="knob-label">{label}</span>}
    </div>
  );
}

// ── Power button ───────────────────────────────────────────────────────────
function PowerBtn ({ on, onClick, color }) {
  return (
    <button
      className={`power-btn ${on ? "on" : ""}`}
      style={{ "--btn-color": color }}
      onClick={onClick}
      title={on ? "powered on" : "bypassed"}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 1v5M4 3.2A5 5 0 1 0 10 3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
const CLIPS = [
  { label: "Drums",  url: "/audio/clip-drums.wav"  },
  { label: "Guitar", url: "/audio/clip-guitar.wav" },
  { label: "Piano",  url: "/audio/clip-piano.wav"  },
];

const AMBER = "#c49a52";
const TEAL  = "#4fa8a8";

export default function Echodrift () {
  const [params, setParams] = useState({
    delayTime:     354,
    delayFeedback: 28,
    delayMix:      83,
    delayPower:    true,
    reverbSize:    61,
    reverbDecay:   3.4,
    reverbMix:     61,
    reverbPower:   true,
    saturation:    11,
  });
  const [activeClip,  setActiveClip]  = useState(null);
  const [isPlaying,   setIsPlaying]   = useState(false);
  const [isLoading,   setIsLoading]   = useState(false);
  const [error,       setError]       = useState(null);

  const audioCtxRef   = useRef(null);
  const workletRef    = useRef(null);
  const sourceRef     = useRef(null);

  // Map param name → (WASM param id, raw value)
  const PARAM_MAP = {
    delayTime:     P.DELAY_TIME,
    delayFeedback: P.DELAY_FEEDBACK,
    delayMix:      P.DELAY_MIX,
    delayPower:    P.DELAY_POWER,
    reverbSize:    P.REVERB_SIZE,
    reverbDecay:   P.REVERB_DECAY,
    reverbMix:     P.REVERB_MIX,
    reverbPower:   P.REVERB_POWER,
    saturation:    P.DELAY_SATURATION,
  };

  const sendParam = useCallback((id, value) => {
    workletRef.current?.port.postMessage({ type: "setParam", id, value });
  }, []);

  const setParam = useCallback((name, value) => {
    setParams(p => ({ ...p, [name]: value }));
    const id  = PARAM_MAP[name];
    const raw = typeof value === "boolean" ? (value ? 1 : 0) : value;
    sendParam(id, raw);
  }, [sendParam]); // eslint-disable-line react-hooks/exhaustive-deps

  const stopAudio = useCallback(() => {
    try { sourceRef.current?.stop(); }  catch (_) {}
    try { audioCtxRef.current?.close(); } catch (_) {}
    sourceRef.current  = null;
    workletRef.current = null;
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

    try {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      await ctx.audioWorklet.addModule("/echodrift-worklet.js");
      const node = new AudioWorkletNode(ctx, "echodrift-processor");
      workletRef.current = node;

      // Push all current params to the fresh worklet
      Object.entries(params).forEach(([name, value]) => {
        const id  = PARAM_MAP[name];
        if (id === undefined) return;
        const raw = typeof value === "boolean" ? (value ? 1 : 0) : value;
        node.port.postMessage({ type: "setParam", id, raw });
      });

      const resp   = await fetch(clip.url);
      if (!resp.ok) throw new Error(`Could not load ${clip.label}`);
      const ab     = await resp.arrayBuffer();
      const buf    = await ctx.decodeAudioData(ab);

      const src    = ctx.createBufferSource();
      src.buffer   = buf;
      src.loop     = true;
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
  }, [isLoading, activeClip, isPlaying, params, stopAudio]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clean up on unmount
  useEffect(() => () => stopAudio(), [stopAudio]);

  return (
    <section id="echodrift" className="ed-section">
      <p className="section-label">Echodrift</p>
      <p className="ed-byline">
        An analog delay + hall reverb audio plugin — built in C++ with JUCE,
        running here via WebAssembly.
      </p>

      <div className="ed-plugin">

        {/* ── Header bar ─────────────────────────────────────────────── */}
        <div className="ed-header">
          <div>
            <span className="ed-name">echodrift</span>
            <span className="ed-tagline">analog delay · hall reverb</span>
          </div>
          <span className="ed-brand">Electra Audio</span>
        </div>

        {/* ── Controls ───────────────────────────────────────────────── */}
        <div className="ed-faceplate">

          {/* Delay */}
          <div className="ed-section-block">
            <div className="ed-section-header">
              <span className="ed-section-label" style={{ color: AMBER }}>delay</span>
              <PowerBtn
                on={params.delayPower}
                color={AMBER}
                onClick={() => setParam("delayPower", !params.delayPower)}
              />
            </div>
            <div className="ed-knobs">
              <Knob value={params.delayTime}     min={1}   max={2000} skew={0.4}
                    color={AMBER} label="time"
                    onChange={v => setParam("delayTime", Math.round(v))} />
              <Knob value={params.delayFeedback} min={0}   max={100}
                    color={AMBER} label="feedback"
                    onChange={v => setParam("delayFeedback", Math.round(v))} />
              <Knob value={params.delayMix}      min={0}   max={100}
                    color={AMBER} label="mix"
                    onChange={v => setParam("delayMix", Math.round(v))} />
            </div>
          </div>

          <div className="ed-divider" />

          {/* Reverb */}
          <div className="ed-section-block">
            <div className="ed-section-header">
              <span className="ed-section-label" style={{ color: TEAL }}>reverb</span>
              <PowerBtn
                on={params.reverbPower}
                color={TEAL}
                onClick={() => setParam("reverbPower", !params.reverbPower)}
              />
            </div>
            <div className="ed-knobs">
              <Knob value={params.reverbSize}  min={0}   max={100}
                    color={TEAL} label="size"
                    onChange={v => setParam("reverbSize", Math.round(v))} />
              <Knob value={params.reverbDecay} min={0.1} max={10} skew={0.5}
                    color={TEAL} label="decay"
                    onChange={v => setParam("reverbDecay", +v.toFixed(1))} />
              <Knob value={params.reverbMix}   min={0}   max={100}
                    color={TEAL} label="mix"
                    onChange={v => setParam("reverbMix", Math.round(v))} />
            </div>
          </div>

          <div className="ed-divider" />

          {/* Saturation */}
          <div className="ed-section-block ed-sat">
            <div className="ed-section-header">
              <span className="ed-section-label" style={{ color: AMBER }}>saturation</span>
            </div>
            <div className="ed-knobs">
              <Knob value={params.saturation} min={0} max={100}
                    color={AMBER} label=""  size={56}
                    onChange={v => setParam("saturation", Math.round(v))} />
            </div>
          </div>
        </div>

        {/* ── Transport ──────────────────────────────────────────────── */}
        <div className="ed-transport">
          <div className="ed-clips">
            {CLIPS.map((clip) => {
              const active = activeClip === clip.url && isPlaying;
              return (
                <button
                  key={clip.url}
                  className={`ed-clip-btn ${active ? "active" : ""}`}
                  onClick={() => playClip(clip)}
                  disabled={isLoading}
                >
                  <span className="ed-clip-icon">{active ? "■" : "▶"}</span>
                  {clip.label}
                </button>
              );
            })}
          </div>
          {isPlaying && (
            <button className="ed-stop-btn" onClick={stopAudio}>Stop</button>
          )}
          {isLoading && <span className="ed-status">Loading…</span>}
          {error   && <span className="ed-error">{error}</span>}
        </div>
      </div>

      <p className="ed-hint">Drag knobs up · click a source to start</p>
    </section>
  );
}
