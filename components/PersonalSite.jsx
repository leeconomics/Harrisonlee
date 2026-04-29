import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

// localStorage helpers
function localGet(key) {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}
function localSet(key, val) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(key, val); } catch {}
}

// ─── Shared CSS ───────────────────────────────────────────────────────────
const SHARED_CSS = `
/* Shared design tokens for all three directions */

:root {
  /* Ink palette — dark bases */
  --abyss: oklch(0.10 0.04 240);
  --deep: oklch(0.16 0.045 235);
  --midwater: oklch(0.24 0.05 225);
  --shelf: oklch(0.36 0.06 215);
  --shoal: oklch(0.62 0.06 200);

  /* Paper / surface */
  --paper: oklch(0.97 0.008 85);
  --paper-warm: oklch(0.95 0.012 80);
  --ink: oklch(0.20 0.02 240);

  /* Bioluminescence — same chroma (~0.16), varied hue */
  --lume-cyan: oklch(0.86 0.16 200);
  --lume-aqua: oklch(0.84 0.16 180);
  --lume-green: oklch(0.86 0.16 165);
  --lume-pink: oklch(0.80 0.16 355);
  --lume-violet: oklch(0.74 0.16 295);

  /* Muted readers */
  --foam: oklch(0.92 0.02 200);
  --silt: oklch(0.55 0.04 220);
  --kelp: oklch(0.45 0.05 165);
}

/* Type stack */
.f-display { font-family: "Fraunces", "Source Serif 4", Georgia, serif; font-optical-sizing: auto; }
.f-body    { font-family: "Newsreader", "Source Serif 4", Georgia, serif; font-optical-sizing: auto; }
.f-mono    { font-family: "Geist Mono", "JetBrains Mono", ui-monospace, monospace; }
.f-sans    { font-family: "Geist", "Inter", system-ui, sans-serif; }

/* Eyebrow / kicker */
.eyebrow {
  font-family: "Geist Mono", ui-monospace, monospace;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-weight: 500;
}

/* Subtle film grain overlay */
.grain::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.06 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
  mix-blend-mode: overlay;
  opacity: 0.6;
  z-index: 5;
}

/* Reveal animation primitives */
.surface {
  opacity: 0;
  transform: translateY(14px);
  animation: surface 1s cubic-bezier(0.2, 0.7, 0.3, 1) forwards;
}
@keyframes surface {
  to { opacity: 1; transform: translateY(0); }
}

.breathe { animation: breathe 6s ease-in-out infinite; }
@keyframes breathe {
  0%, 100% { opacity: 0.7; letter-spacing: 0; }
  50% { opacity: 1; letter-spacing: 0.005em; }
}

.shimmer {
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  background-image: linear-gradient(90deg, currentColor 0%, currentColor 40%, var(--lume-cyan) 50%, currentColor 60%, currentColor 100%);
  background-size: 250% 100%;
  animation: shimmer 8s ease-in-out infinite;
}
@keyframes shimmer {
  0%, 100% { background-position: 100% 0; }
  50% { background-position: 0% 0; }
}

/* Pulse for old/glowing ideas */
@keyframes oldPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(140, 230, 250, 0); }
  50% { box-shadow: 0 0 24px 2px rgba(140, 230, 250, 0.35); }
}

/* Scroll behaviour */
html { scroll-behavior: smooth; }

/* Reset */
* { box-sizing: border-box; }
body { margin: 0; -webkit-font-smoothing: antialiased; }

`;

function SharedStyles() {
  return <style>{SHARED_CSS}</style>;
}

// ─── Tweaks Panel ─────────────────────────────────────────────────────────

// tweaks-panel.jsx
// Reusable Tweaks shell + form-control helpers.
//
// Owns the host protocol (listens for __activate_edit_mode / __deactivate_edit_mode,
// posts __edit_mode_available / __edit_mode_set_keys / __edit_mode_dismissed) so
// individual prototypes don't re-roll it. Ships a consistent set of controls so you
// don't hand-draw <input type="range">, segmented radios, steppers, etc.
//
// Usage (in an HTML file that loads React + Babel):
//
//   const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
//     "primaryColor": "#D97757",
//     "fontSize": 16,
//     "density": "regular",
//     "dark": false
//   }/*EDITMODE-END*/;
//
//   function App() {
//     const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
//     return (
//       <div style={{ fontSize: t.fontSize, color: t.primaryColor }}>
//         Hello
//         <TweaksPanel>
//           <TweakSection label="Typography" />
//           <TweakSlider label="Font size" value={t.fontSize} min={10} max={32} unit="px"
//                        onChange={(v) => setTweak('fontSize', v)} />
//           <TweakRadio  label="Density" value={t.density}
//                        options={['compact', 'regular', 'comfy']}
//                        onChange={(v) => setTweak('density', v)} />
//           <TweakSection label="Theme" />
//           <TweakColor  label="Primary" value={t.primaryColor}
//                        onChange={(v) => setTweak('primaryColor', v)} />
//           <TweakToggle label="Dark mode" value={t.dark}
//                        onChange={(v) => setTweak('dark', v)} />
//         </TweaksPanel>
//       </div>
//     );
//   }
//
// ─────────────────────────────────────────────────────────────────────────────

const __TWEAKS_STYLE = `
  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
    max-height:calc(100vh - 32px);display:flex;flex-direction:column;
    background:rgba(250,249,247,.78);color:#29261b;
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.6);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
    font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:10px 8px 10px 14px;cursor:move;user-select:none}
  .twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
    width:22px;height:22px;border-radius:6px;cursor:default;font-size:13px;line-height:1}
  .twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
  .twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;
    overflow-y:auto;overflow-x:hidden;min-height:0;
    scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.15) transparent}
  .twk-body::-webkit-scrollbar{width:8px}
  .twk-body::-webkit-scrollbar-track{background:transparent;margin:2px}
  .twk-body::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:4px;
    border:2px solid transparent;background-clip:content-box}
  .twk-body::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,.25);
    border:2px solid transparent;background-clip:content-box}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;
    color:rgba(41,38,27,.72)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-val{color:rgba(41,38,27,.5);font-variant-numeric:tabular-nums}

  .twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(41,38,27,.45);padding:10px 0 0}
  .twk-sect:first-child{padding-top:0}

  .twk-field{appearance:none;width:100%;height:26px;padding:0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;
    background:rgba(255,255,255,.6);color:inherit;font:inherit;outline:none}
  .twk-field:focus{border-color:rgba(0,0,0,.25);background:rgba(255,255,255,.85)}
  select.twk-field{padding-right:22px;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='rgba(0,0,0,.5)' d='M0 0h10L5 6z'/></svg>");
    background-repeat:no-repeat;background-position:right 8px center}

  .twk-slider{appearance:none;-webkit-appearance:none;width:100%;height:4px;margin:6px 0;
    border-radius:999px;background:rgba(0,0,0,.12);outline:none}
  .twk-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
    width:14px;height:14px;border-radius:50%;background:#fff;
    border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}
  .twk-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;
    background:#fff;border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}

  .twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;
    background:rgba(0,0,0,.06);user-select:none}
  .twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
  .twk-seg.dragging .twk-seg-thumb{transition:none}
  .twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:inherit;font:inherit;font-weight:500;min-height:22px;
    border-radius:6px;cursor:default;padding:4px 6px;line-height:1.2;
    overflow-wrap:anywhere}

  .twk-toggle{position:relative;width:32px;height:18px;border:0;border-radius:999px;
    background:rgba(0,0,0,.15);transition:background .15s;cursor:default;padding:0}
  .twk-toggle[data-on="1"]{background:#34c759}
  .twk-toggle i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;
    background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
  .twk-toggle[data-on="1"] i{transform:translateX(14px)}

  .twk-num{display:flex;align-items:center;height:26px;padding:0 0 0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;background:rgba(255,255,255,.6)}
  .twk-num-lbl{font-weight:500;color:rgba(41,38,27,.6);cursor:ew-resize;
    user-select:none;padding-right:8px}
  .twk-num input{flex:1;min-width:0;height:100%;border:0;background:transparent;
    font:inherit;font-variant-numeric:tabular-nums;text-align:right;padding:0 8px 0 0;
    outline:none;color:inherit;-moz-appearance:textfield}
  .twk-num input::-webkit-inner-spin-button,.twk-num input::-webkit-outer-spin-button{
    -webkit-appearance:none;margin:0}
  .twk-num-unit{padding-right:8px;color:rgba(41,38,27,.45)}

  .twk-btn{appearance:none;height:26px;padding:0 12px;border:0;border-radius:7px;
    background:rgba(0,0,0,.78);color:#fff;font:inherit;font-weight:500;cursor:default}
  .twk-btn:hover{background:rgba(0,0,0,.88)}
  .twk-btn.secondary{background:rgba(0,0,0,.06);color:inherit}
  .twk-btn.secondary:hover{background:rgba(0,0,0,.1)}

  .twk-swatch{appearance:none;-webkit-appearance:none;width:56px;height:22px;
    border:.5px solid rgba(0,0,0,.1);border-radius:6px;padding:0;cursor:default;
    background:transparent;flex-shrink:0}
  .twk-swatch::-webkit-color-swatch-wrapper{padding:0}
  .twk-swatch::-webkit-color-swatch{border:0;border-radius:5.5px}
  .twk-swatch::-moz-color-swatch{border:0;border-radius:5.5px}
`;

// ── useTweaks ───────────────────────────────────────────────────────────────
// Single source of truth for tweak values. setTweak persists via the host
// (__edit_mode_set_keys → host rewrites the EDITMODE block on disk).
function useTweaks(defaults) {
  const [values, setValues] = useState(defaults);
  // Accepts either setTweak('key', value) or setTweak({ key: value, ... }) so a
  // useState-style call doesn't write a "[object Object]" key into the persisted
  // JSON block.
  const setTweak = useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null
      ? keyOrEdits : { [keyOrEdits]: val };
    setValues((prev) => ({ ...prev, ...edits }));
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits }, '*');
  }, []);
  return [values, setTweak];
}

// ── TweaksPanel ─────────────────────────────────────────────────────────────
// Floating shell. Registers the protocol listener BEFORE announcing
// availability — if the announce ran first, the host's activate could land
// before our handler exists and the toolbar toggle would silently no-op.
// The close button posts __edit_mode_dismissed so the host's toolbar toggle
// flips off in lockstep; the host echoes __deactivate_edit_mode back which
// is what actually hides the panel.
function TweaksPanel({ title = 'Tweaks', children }) {
  const [open, setOpen] = useState(false);
  const dragRef = useRef(null);
  const offsetRef = useRef({ x: 16, y: 16 });
  const PAD = 16;

  const clampToViewport = useCallback(() => {
    const panel = dragRef.current;
    if (!panel) return;
    const w = panel.offsetWidth, h = panel.offsetHeight;
    const maxRight = Math.max(PAD, window.innerWidth - w - PAD);
    const maxBottom = Math.max(PAD, window.innerHeight - h - PAD);
    offsetRef.current = {
      x: Math.min(maxRight, Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxBottom, Math.max(PAD, offsetRef.current.y)),
    };
    panel.style.right = offsetRef.current.x + 'px';
    panel.style.bottom = offsetRef.current.y + 'px';
  }, []);

  useEffect(() => {
    if (!open) return;
    clampToViewport();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', clampToViewport);
      return () => window.removeEventListener('resize', clampToViewport);
    }
    const ro = new ResizeObserver(clampToViewport);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [open, clampToViewport]);

  useEffect(() => {
    const onMsg = (e) => {
      const t = e?.data?.type;
      if (t === '__activate_edit_mode') setOpen(true);
      else if (t === '__deactivate_edit_mode') setOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const dismiss = () => {
    setOpen(false);
    window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*');
  };

  const onDragStart = (e) => {
    const panel = dragRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const sx = e.clientX, sy = e.clientY;
    const startRight = window.innerWidth - r.right;
    const startBottom = window.innerHeight - r.bottom;
    const move = (ev) => {
      offsetRef.current = {
        x: startRight - (ev.clientX - sx),
        y: startBottom - (ev.clientY - sy),
      };
      clampToViewport();
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  if (!open) return null;
  return (
    <>
      <style>{__TWEAKS_STYLE}</style>
      <div ref={dragRef} className="twk-panel"
           style={{ right: offsetRef.current.x, bottom: offsetRef.current.y }}>
        <div className="twk-hd" onMouseDown={onDragStart}>
          <b>{title}</b>
          <button className="twk-x" aria-label="Close tweaks"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={dismiss}>✕</button>
        </div>
        <div className="twk-body">{children}</div>
      </div>
    </>
  );
}

// ── Layout helpers ──────────────────────────────────────────────────────────

function TweakSection({ label, children }) {
  return (
    <>
      <div className="twk-sect">{label}</div>
      {children}
    </>
  );
}

function TweakRow({ label, value, children, inline = false }) {
  return (
    <div className={inline ? 'twk-row twk-row-h' : 'twk-row'}>
      <div className="twk-lbl">
        <span>{label}</span>
        {value != null && <span className="twk-val">{value}</span>}
      </div>
      {children}
    </div>
  );
}

// ── Controls ────────────────────────────────────────────────────────────────

function TweakSlider({ label, value, min = 0, max = 100, step = 1, unit = '', onChange }) {
  return (
    <TweakRow label={label} value={`${value}${unit}`}>
      <input type="range" className="twk-slider" min={min} max={max} step={step}
             value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </TweakRow>
  );
}

function TweakToggle({ label, value, onChange }) {
  return (
    <div className="twk-row twk-row-h">
      <div className="twk-lbl"><span>{label}</span></div>
      <button type="button" className="twk-toggle" data-on={value ? '1' : '0'}
              role="switch" aria-checked={!!value}
              onClick={() => onChange(!value)}><i /></button>
    </div>
  );
}

function TweakRadio({ label, value, options, onChange }) {
  const trackRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const opts = options.map((o) => (typeof o === 'object' ? o : { value: o, label: o }));
  const idx = Math.max(0, opts.findIndex((o) => o.value === value));
  const n = opts.length;

  // The active value is read by pointer-move handlers attached for the lifetime
  // of a drag — ref it so a stale closure doesn't fire onChange for every move.
  const valueRef = useRef(value);
  valueRef.current = value;

  const segAt = (clientX) => {
    const r = trackRef.current.getBoundingClientRect();
    const inner = r.width - 4;
    const i = Math.floor(((clientX - r.left - 2) / inner) * n);
    return opts[Math.max(0, Math.min(n - 1, i))].value;
  };

  const onPointerDown = (e) => {
    setDragging(true);
    const v0 = segAt(e.clientX);
    if (v0 !== valueRef.current) onChange(v0);
    const move = (ev) => {
      if (!trackRef.current) return;
      const v = segAt(ev.clientX);
      if (v !== valueRef.current) onChange(v);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <TweakRow label={label}>
      <div ref={trackRef} role="radiogroup" onPointerDown={onPointerDown}
           className={dragging ? 'twk-seg dragging' : 'twk-seg'}>
        <div className="twk-seg-thumb"
             style={{ left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
                      width: `calc((100% - 4px) / ${n})` }} />
        {opts.map((o) => (
          <button key={o.value} type="button" role="radio" aria-checked={o.value === value}>
            {o.label}
          </button>
        ))}
      </div>
    </TweakRow>
  );
}

function TweakSelect({ label, value, options, onChange }) {
  return (
    <TweakRow label={label}>
      <select className="twk-field" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => {
          const v = typeof o === 'object' ? o.value : o;
          const l = typeof o === 'object' ? o.label : o;
          return <option key={v} value={v}>{l}</option>;
        })}
      </select>
    </TweakRow>
  );
}

function TweakText({ label, value, placeholder, onChange }) {
  return (
    <TweakRow label={label}>
      <input className="twk-field" type="text" value={value} placeholder={placeholder}
             onChange={(e) => onChange(e.target.value)} />
    </TweakRow>
  );
}

function TweakNumber({ label, value, min, max, step = 1, unit = '', onChange }) {
  const clamp = (n) => {
    if (min != null && n < min) return min;
    if (max != null && n > max) return max;
    return n;
  };
  const startRef = useRef({ x: 0, val: 0 });
  const onScrubStart = (e) => {
    e.preventDefault();
    startRef.current = { x: e.clientX, val: value };
    const decimals = (String(step).split('.')[1] || '').length;
    const move = (ev) => {
      const dx = ev.clientX - startRef.current.x;
      const raw = startRef.current.val + dx * step;
      const snapped = Math.round(raw / step) * step;
      onChange(clamp(Number(snapped.toFixed(decimals))));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return (
    <div className="twk-num">
      <span className="twk-num-lbl" onPointerDown={onScrubStart}>{label}</span>
      <input type="number" value={value} min={min} max={max} step={step}
             onChange={(e) => onChange(clamp(Number(e.target.value)))} />
      {unit && <span className="twk-num-unit">{unit}</span>}
    </div>
  );
}

function TweakColor({ label, value, onChange }) {
  return (
    <div className="twk-row twk-row-h">
      <div className="twk-lbl"><span>{label}</span></div>
      <input type="color" className="twk-swatch" value={value}
             onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function TweakButton({ label, onClick, secondary = false }) {
  return (
    <button type="button" className={secondary ? 'twk-btn secondary' : 'twk-btn'}
            onClick={onClick}>{label}</button>
  );
}




// ─── Surface Layer ────────────────────────────────────────────────────────
// SurfaceLayer v4 — alive but professional. Long descent, animated water,
// bubbles with multi-layered gentle motion, palette that flows into Currents.



/* ─────────────────── DATA ─────────────────── */

const ideaSeeds = [
  { id: 1,  age: 38, text: 'AI routes on specificity not social proof. Original thinking has the infrastructure it always deserved.' },
  { id: 2,  age: 64, text: 'Being early to AI is not the same as being good at it.' },
  { id: 3,  age: 12, text: 'Intentional AI is not a pace. It is a posture.' },
  { id: 4,  age: 90, text: 'The IC manager is the shape of the future.' },
  { id: 5,  age: 8,  text: 'Territory between employee and founder, nobody maps well.' },
  { id: 6,  age: 22, text: 'Coordination cost is the hidden tax on a small team doing big-team work.' },
  { id: 7,  age: 5,  text: 'AI prompting is closer to scoping a colleague than briefing a writer.' },
  { id: 8,  age: 110,text: 'You cannot speed-run taste.' },
  { id: 9,  age: 50, text: 'Most "AI-native" job descriptions are theatre. Nobody can name the actual skill.' },
  { id: 10, age: 18, text: 'The fastest way to learn Japanese was needing to live in it. Same with AI.' },
  { id: 11, age: 70, text: 'Speed-to-learning is the only marketing metric that matters.' },
  { id: 12, age: 3,  text: 'A memo is just a thought you respect enough to finish.' },
];

/* ─────────────────── PALETTE — flows into Currents at the bottom ───────────────────
 * Ripples: cream sky → blue water → deep at the floor.
 * The deepest stop = the same colour Currents opens with, so the wave divider
 * from Ripples → Currents has zero hue jump. */

const WATER_TINTS = {
  cool: {
    sky:    'oklch(0.97 0.012 90)',
    horizon:'oklch(0.92 0.03 210)',
    top:    'oklch(0.82 0.04 215)',
    mid:    'oklch(0.62 0.055 222)',
    deep:   'oklch(0.46 0.06 228)',
    floor:  'oklch(0.34 0.06 232)',  // = Currents top
    glow:   'oklch(0.66 0.10 215)',
  },
  teal: {
    sky:    'oklch(0.97 0.014 95)',
    horizon:'oklch(0.92 0.04 180)',
    top:    'oklch(0.78 0.05 185)',
    mid:    'oklch(0.56 0.07 195)',
    deep:   'oklch(0.36 0.06 205)',
    floor:  'oklch(0.26 0.05 210)',
    glow:   'oklch(0.62 0.10 185)',
  },
  deep: {
    sky:    'oklch(0.95 0.02 90)',
    horizon:'oklch(0.86 0.04 220)',
    top:    'oklch(0.66 0.06 225)',
    mid:    'oklch(0.42 0.06 232)',
    deep:   'oklch(0.24 0.05 238)',
    floor:  'oklch(0.18 0.05 240)',
    glow:   'oklch(0.68 0.10 220)',
  },
};

/* ─────────────────── SURFACE LINE ─────────────────── */
// Two phases sliding past each other; the meniscus has a soft caustic glow
// just below it.

function Surface({ from, to, accent }) {
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, height: 80, lineHeight: 0 }}>
      <svg viewBox="0 0 1600 80" preserveAspectRatio="none"
        style={{ width: '100%', height: '100%', display: 'block' }}>
        <defs>
          <linearGradient id="surf-grad-v4" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={to} stopOpacity="0.55" />
            <stop offset="100%" stopColor={to} stopOpacity="1" />
          </linearGradient>
        </defs>
        <path fill={from} d="M0 0 L1600 0 L1600 26 L0 26 Z" />

        {/* Back wave (slower, slightly higher amplitude) */}
        <path fill={to} opacity="0.55">
          <animate attributeName="d" dur="20s" repeatCount="indefinite"
            values="M0 28 Q200 18 400 28 T800 28 T1200 28 T1600 28 L1600 80 L0 80 Z;
                    M0 28 Q200 36 400 28 T800 28 T1200 28 T1600 28 L1600 80 L0 80 Z;
                    M0 28 Q200 18 400 28 T800 28 T1200 28 T1600 28 L1600 80 L0 80 Z" />
        </path>
        {/* Front wave */}
        <path fill="url(#surf-grad-v4)">
          <animate attributeName="d" dur="13s" repeatCount="indefinite"
            values="M0 30 Q160 22 320 30 T640 30 T960 30 T1280 30 T1600 30 L1600 80 L0 80 Z;
                    M0 30 Q160 36 320 30 T640 30 T960 30 T1280 30 T1600 30 L1600 80 L0 80 Z;
                    M0 30 Q160 22 320 30 T640 30 T960 30 T1280 30 T1600 30 L1600 80 L0 80 Z" />
        </path>
        {/* Highlight ribbon — caustic just below the meniscus */}
        <path d="M0 32 Q400 30 800 34 T1600 32" fill="none"
          stroke="oklch(1 0 0 / 0.35)" strokeWidth="0.6">
          <animate attributeName="opacity" values="0.2;0.5;0.2" dur="6s" repeatCount="indefinite" />
        </path>
        <path d="M0 32 Q400 30 800 34 T1600 32" fill="none"
          stroke={accent} strokeWidth="0.6" opacity="0.3" />
      </svg>
    </div>
  );
}

/* ─────────────────── ATMOSPHERIC LAYERS ─────────────────── */

// Caustics — soft horizontal bands that shimmer near the surface.
// Fades IN from transparent at the very top so there's no hard seam against
// the section above; peaks around 30% then fades back to transparent.
function Caustics({ tint }) {
  return (
    <svg viewBox="0 0 1600 200" preserveAspectRatio="none"
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 200, pointerEvents: 'none', zIndex: 1, opacity: 0.5 }}>
      <defs>
        <linearGradient id="caustic-fade-v4" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="oklch(1 0 0 / 0)" />
          <stop offset="35%"  stopColor="oklch(1 0 0 / 0.55)" />
          <stop offset="100%" stopColor="oklch(1 0 0 / 0)" />
        </linearGradient>
        <filter id="caustic-warp">
          <feTurbulence type="fractalNoise" baseFrequency="0.005 0.012" numOctaves="2" seed="3">
            <animate attributeName="baseFrequency" dur="22s" values="0.005 0.012;0.008 0.014;0.005 0.012" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" scale="20" />
        </filter>
      </defs>
      <rect width="1600" height="200" fill="url(#caustic-fade-v4)" filter="url(#caustic-warp)" />
    </svg>
  );
}

// Slow horizontal current — a wide, low-opacity band drifting sideways. Adds
// a sense of water in motion without being noisy.
function CurrentBand({ y = '40%', dur = 90, dir = 1, hue }) {
  return (
    <div style={{
      position: 'absolute', top: y, left: 0, right: 0, height: 1,
      pointerEvents: 'none', zIndex: 1, overflow: 'hidden',
    }}>
      <svg viewBox="0 0 3200 60" preserveAspectRatio="none" style={{
        width: '200%', height: 60, transform: 'translateY(-30px)',
        animation: `current-flow ${dur}s linear infinite ${dir < 0 ? 'reverse' : ''}`,
      }}>
        <path d="M0 30 Q400 22 800 30 T1600 30 T2400 30 T3200 30" fill="none"
          stroke={hue} strokeWidth="0.6" opacity="0.2" />
        <path d="M0 32 Q400 36 800 32 T1600 32 T2400 32 T3200 32" fill="none"
          stroke={hue} strokeWidth="0.4" opacity="0.12" />
      </svg>
      <style>{`@keyframes current-flow { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
    </div>
  );
}

// Plankton — small light-points that drift slowly. Brighter near the top,
// fade with depth.
function Plankton({ count = 24, depth = 1 }) {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2 }}>
      {Array.from({ length: count }).map((_, i) => {
        const left = (i * 53) % 100;
        const top = (i * 37 + 9) % 100;
        const dur = 18 + (i % 7) * 3;
        const delay = -(i * 1.4);
        const size = 1.2 + (i % 4) * 0.5;
        const opacity = (1 - (top / 100) * 0.6) * 0.55 * depth;
        return (
          <span key={i} style={{
            position: 'absolute', left: `${left}%`, top: `${top}%`,
            width: size, height: size, borderRadius: '50%',
            background: 'oklch(0.96 0.02 200)',
            boxShadow: `0 0 ${size * 4}px oklch(0.86 0.06 200 / 0.5)`,
            opacity,
            animation: `plk-${i % 4} ${dur}s ${delay}s ease-in-out infinite`,
          }} />
        );
      })}
      <style>{`
        @keyframes plk-0 { 0%,100% { transform: translate(0,0); opacity: 0.45; } 50% { transform: translate(18px,-14px); opacity: 0.7; } }
        @keyframes plk-1 { 0%,100% { transform: translate(0,0); opacity: 0.4; } 50% { transform: translate(-22px,-10px); opacity: 0.65; } }
        @keyframes plk-2 { 0%,100% { transform: translate(0,0); opacity: 0.5; } 50% { transform: translate(14px,-22px); opacity: 0.8; } }
        @keyframes plk-3 { 0%,100% { transform: translate(0,0); opacity: 0.35; } 50% { transform: translate(-12px,-18px); opacity: 0.6; } }
      `}</style>
    </div>
  );
}

// Rising bubble streams — gentle, varied, populate the column.
function BubbleStream({ count = 14 }) {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3 }}>
      {Array.from({ length: count }).map((_, i) => {
        const x = (i * 71 + 11) % 100;
        const dur = 22 + (i % 6) * 3;
        const delay = -(i * 1.7);
        const size = 2.4 + (i % 5) * 1.4;
        return (
          <span key={i} style={{
            position: 'absolute', left: `${x}%`, bottom: -8,
            width: size, height: size, borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 30%, oklch(1 0 0 / 0.6), oklch(0.92 0.04 200 / 0.12))',
            border: '1px solid oklch(1 0 0 / 0.3)',
            animation: `bubrise-v4 ${dur}s ${delay}s linear infinite`,
          }} />
        );
      })}
      <style>{`
        @keyframes bubrise-v4 {
          0%   { transform: translate(0, 0) scale(0.8); opacity: 0; }
          12%  { opacity: 0.7; }
          50%  { transform: translate(10px, -55vh) scale(1); }
          88%  { opacity: 0.8; }
          100% { transform: translate(-8px, -110vh) scale(1.1); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// Refined seabed: subtle horizon + a few thin kelp strands, no childish ridges.
function Seabed({ tint, withKelp = true }) {
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, height: 160,
      pointerEvents: 'none', zIndex: 4,
    }}>
      <svg viewBox="0 0 1600 160" preserveAspectRatio="none"
        style={{ width: '100%', height: '100%', display: 'block' }}>
        <defs>
          <linearGradient id="sand-fade-v4" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor={tint.floor} stopOpacity="0" />
            <stop offset="100%" stopColor={tint.floor} stopOpacity="1" />
          </linearGradient>
        </defs>
        <path d="M0 100 C300 88 600 106 900 96 S1400 94 1600 102 L1600 160 L0 160 Z"
          fill="url(#sand-fade-v4)" />
        <path d="M0 96 C300 86 600 102 900 94 S1400 92 1600 98"
          fill="none" stroke={tint.glow} strokeWidth="0.5" opacity="0.22" />
      </svg>
      {withKelp && (
        <>
          <Kelp x="6%"  h={130} delay={0}    tint={tint} />
          <Kelp x="22%" h={95}  delay={-1.4} tint={tint} />
          <Kelp x="74%" h={120} delay={-0.8} tint={tint} />
          <Kelp x="92%" h={85}  delay={-2.2} tint={tint} />
        </>
      )}
    </div>
  );
}

function Kelp({ x = '10%', h = 110, delay = 0, tint }) {
  return (
    <svg viewBox="0 0 24 200" style={{
      position: 'absolute', bottom: 30, left: x, width: 24, height: h,
      transformOrigin: 'bottom center',
      animation: `kelp-sway-v4 11s ${delay}s ease-in-out infinite`,
      opacity: 0.55,
    }}>
      <path d="M12 200 C8 160 16 120 10 80 C4 40 16 20 12 0"
        fill="none" stroke={tint.glow} strokeWidth="1.1" strokeLinecap="round" opacity="0.95" />
      <style>{`@keyframes kelp-sway-v4 { 0%,100% { transform: rotate(-2.5deg); } 50% { transform: rotate(2.5deg); } }`}</style>
    </svg>
  );
}

/* ─────────────────── IDEA BUBBLES ─────────────────── */

// One bubble — readable text + multi-layered ambient motion:
// • slow drift (translate XY)
// • soft scale pulse (breathing)
// • highlight that shifts with the breath
// • optional barnacles for the very oldest

// Ethereal idea bubble. Three nested motion layers:
//   1. WANDER — long, multi-stop translate path (40–90s). Travels far enough
//      to feel like it's actually drifting through water, not just bobbing.
//   2. SWAY  — subtle rotate so the bubble tumbles gently as it drifts.
//   3. BREATHE — slow scale pulse + a slow rotation of the inner light so
//      the surface looks alive, not flat.
// Inside the bubble: SVG turbulence shimmer, two highlight passes that fade
// against each other, an outer aura that pulses with the breath.

function IdeaBubble({ idea, water, depth = 0, index = 0 }) {
  const [hover, setHover] = useState(false);
  const W = 230;
  const widthVariance = (idea.id % 3) * 16;
  const w = W + widthVariance;
  const lines = useMemo(() => wrap(idea.text, 30 + Math.floor(widthVariance / 6)), [idea.text, w]);
  const h = Math.max(120, 62 + lines.length * 18);

  // Per-bubble seeds → unique drift / sway / breath
  const seed = idea.id || index + 1;
  const wanderKey = `bub-wander-${seed % 6}`;
  const swayKey   = `bub-sway-${seed % 4}`;
  const breathKey = `bub-breath-${seed % 3}`;
  const wanderDur = 55 + (seed % 9) * 4;        // 55–87s — long, dreamlike
  const swayDur   = 24 + (seed % 5) * 3;
  const breathDur = 7 + (seed % 5) * 0.9;
  const wanderDelay = -(seed * 2.7 % wanderDur);
  const swayDelay   = -(seed * 1.3 % swayDur);
  const breathDelay = -(seed * 0.7 % breathDur);

  const depthOpacity = 1 - depth * 0.14;
  const old = idea.age >= 60;

  return (
    <div
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative', width: w, minHeight: h,
        animation: `${wanderKey} ${wanderDur}s ease-in-out ${wanderDelay}s infinite`,
        opacity: depthOpacity,
        transition: 'opacity 0.6s',
        willChange: 'transform',
      }}>
      <div style={{
        position: 'absolute', inset: 0,
        animation: `${swayKey} ${swayDur}s ease-in-out ${swayDelay}s infinite`,
        transformOrigin: 'center',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          animation: `${breathKey} ${breathDur}s ease-in-out ${breathDelay}s infinite`,
          transformOrigin: 'center',
        }}>
          {/* Outer aura — ethereal halo that breathes with the bubble */}
          <div style={{
            position: 'absolute', inset: -30,
            background: `radial-gradient(ellipse at center, ${water.glow}26 0%, ${water.glow}00 65%)`,
            filter: 'blur(8px)',
            animation: `bub-aura ${breathDur * 1.3}s ease-in-out ${breathDelay}s infinite`,
            pointerEvents: 'none',
          }} />

          <svg viewBox={`0 0 ${w} ${h}`} style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible',
            filter: hover
              ? `drop-shadow(0 0 28px ${water.glow}99)`
              : 'drop-shadow(0 8px 22px oklch(0 0 0 / 0.18))',
            transition: 'filter 0.5s',
          }}>
            <defs>
              {/* Watery shimmer inside the bubble */}
              <filter id={`bub-shimmer-${seed}`} x="-20%" y="-20%" width="140%" height="140%">
                <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed={seed % 19}>
                  <animate attributeName="baseFrequency"
                    values="0.014;0.022;0.014" dur={`${20 + (seed % 5) * 3}s`} repeatCount="indefinite" />
                </feTurbulence>
                <feColorMatrix type="matrix"
                  values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.18 0" />
                <feComposite in2="SourceGraphic" operator="in" />
              </filter>
              <radialGradient id={`bub-fill-${seed}`} cx="32%" cy="28%">
                <stop offset="0%"  stopColor="oklch(1 0 0 / 0.95)" />
                <stop offset="55%" stopColor="oklch(0.97 0.014 200 / 0.85)" />
                <stop offset="100%" stopColor="oklch(0.90 0.03 215 / 0.72)" />
              </radialGradient>
              {/* Slow rotating inner light */}
              <radialGradient id={`bub-inner-${seed}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%"  stopColor="oklch(1 0 0 / 0.4)" />
                <stop offset="60%" stopColor="oklch(1 0 0 / 0)" />
              </radialGradient>
              <clipPath id={`bub-clip-${seed}`}>
                <ellipse cx={w/2} cy={h/2} rx={w*0.46} ry={h*0.46} />
              </clipPath>
            </defs>

            {/* Bubble body */}
            <ellipse cx={w/2} cy={h/2} rx={w*0.46} ry={h*0.46}
              fill={`url(#bub-fill-${seed})`}
              stroke="oklch(1 0 0 / 0.65)" strokeWidth="1">
              <animate attributeName="rx"
                values={`${w*0.46};${w*0.468};${w*0.46}`}
                dur={`${breathDur * 1.5}s`} repeatCount="indefinite" />
              <animate attributeName="ry"
                values={`${h*0.46};${h*0.455};${h*0.46}`}
                dur={`${breathDur * 1.5}s`} repeatCount="indefinite" />
            </ellipse>

            {/* Watery shimmer texture, clipped to the bubble */}
            <g clipPath={`url(#bub-clip-${seed})`} opacity="0.55">
              <rect x="0" y="0" width={w} height={h} fill="white"
                filter={`url(#bub-shimmer-${seed})`} />
            </g>

            {/* Slow rotating inner light */}
            <g style={{
              transformOrigin: `${w/2}px ${h/2}px`,
              animation: `bub-spin ${40 + (seed % 7) * 4}s linear infinite`,
            }}>
              <ellipse cx={w*0.42} cy={h*0.42} rx={w*0.32} ry={h*0.30}
                fill={`url(#bub-inner-${seed})`} />
            </g>

            {/* Highlight A — shifts opacity with breath */}
            <ellipse cx={w*0.34} cy={h*0.30} rx="14" ry="5"
              fill="oklch(1 0 0 / 0.55)" transform={`rotate(-22 ${w*0.34} ${h*0.30})`}>
              <animate attributeName="opacity"
                values="0.35;0.75;0.35" dur={`${breathDur * 1.4}s`} repeatCount="indefinite" />
            </ellipse>
            {/* Highlight B — counter-phase, shorter */}
            <ellipse cx={w*0.62} cy={h*0.22} rx="6" ry="2.5"
              fill="oklch(1 0 0 / 0.4)" transform={`rotate(-15 ${w*0.62} ${h*0.22})`}>
              <animate attributeName="opacity"
                values="0.55;0.15;0.55" dur={`${breathDur * 1.4}s`} repeatCount="indefinite" />
            </ellipse>
            {/* Tiny secondary glint */}
            <circle cx={w*0.72} cy={h*0.78} r="3" fill="oklch(1 0 0 / 0.4)">
              <animate attributeName="r" values="2.5;3.5;2.5"
                dur={`${breathDur * 1.8}s`} repeatCount="indefinite" />
            </circle>

            {/* Rim light — soft accent on the bottom edge */}
            <ellipse cx={w/2} cy={h/2} rx={w*0.46} ry={h*0.46}
              fill="none" stroke={`${water.glow}55`} strokeWidth="0.7" />

            {old && (
              <g opacity="0.5">
                <circle cx={w*0.18} cy={h*0.74} r="2.4" fill="oklch(0.42 0.04 75)" />
                <circle cx={w*0.21} cy={h*0.79} r="1.6" fill="oklch(0.38 0.05 70)" />
                <circle cx={w*0.83} cy={h*0.66} r="2"   fill="oklch(0.40 0.05 70)" />
              </g>
            )}
          </svg>

          {/* Text rendered as HTML for legibility */}
          <div style={{
            position: 'relative', width: w, minHeight: h,
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            padding: '20px 36px', boxSizing: 'border-box',
            textAlign: 'center', pointerEvents: 'none',
          }}>
            <p className="f-display" style={{
              margin: 0, fontStyle: 'italic', fontWeight: 300,
              fontSize: 14, lineHeight: 1.45,
              color: 'oklch(0.18 0.04 235)',
              textWrap: 'balance',
            }}>{idea.text}</p>
            {idea.age > 0 && (
              <span className="eyebrow" style={{
                marginTop: 12, fontSize: 8.5, color: 'oklch(0.42 0.04 230 / 0.55)',
              }}>{idea.age}d adrift</span>
            )}
          </div>
        </div>
      </div>

      <style>{`
        /* Long wandering paths — multi-stop so they don't loop visibly. */
        @keyframes bub-wander-0 {
          0%   { transform: translate(0, 0); }
          25%  { transform: translate(38px, -28px); }
          50%  { transform: translate(14px, -56px); }
          75%  { transform: translate(-32px, -22px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes bub-wander-1 {
          0%   { transform: translate(0, 0); }
          22%  { transform: translate(-44px, -16px); }
          48%  { transform: translate(-22px, -48px); }
          72%  { transform: translate(28px, -30px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes bub-wander-2 {
          0%   { transform: translate(0, 0); }
          20%  { transform: translate(26px, -42px); }
          45%  { transform: translate(-18px, -62px); }
          70%  { transform: translate(-40px, -18px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes bub-wander-3 {
          0%   { transform: translate(0, 0); }
          28%  { transform: translate(-30px, -34px); }
          55%  { transform: translate(34px, -50px); }
          80%  { transform: translate(18px, -14px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes bub-wander-4 {
          0%   { transform: translate(0, 0); }
          18%  { transform: translate(48px, -10px); }
          42%  { transform: translate(20px, -44px); }
          68%  { transform: translate(-26px, -38px); }
          88%  { transform: translate(-12px, -8px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes bub-wander-5 {
          0%   { transform: translate(0, 0); }
          24%  { transform: translate(-22px, -50px); }
          50%  { transform: translate(36px, -36px); }
          78%  { transform: translate(8px, 14px); }
          100% { transform: translate(0, 0); }
        }
        /* Gentle rotational sway — half a degree of tumble. */
        @keyframes bub-sway-0 { 0%,100% { transform: rotate(-1.4deg); } 50% { transform: rotate(1.4deg); } }
        @keyframes bub-sway-1 { 0%,100% { transform: rotate(1.2deg);  } 50% { transform: rotate(-1.6deg); } }
        @keyframes bub-sway-2 { 0%,100% { transform: rotate(-0.8deg); } 50% { transform: rotate(2deg);    } }
        @keyframes bub-sway-3 { 0%,100% { transform: rotate(1.8deg);  } 50% { transform: rotate(-1deg);   } }
        /* Breath — scale pulse */
        @keyframes bub-breath-0 { 0%,100% { transform: scale(1); }     50% { transform: scale(1.025); } }
        @keyframes bub-breath-1 { 0%,100% { transform: scale(0.99); }  50% { transform: scale(1.03);  } }
        @keyframes bub-breath-2 { 0%,100% { transform: scale(1.005); } 50% { transform: scale(1.02);  } }
        /* Aura — outer halo pulse */
        @keyframes bub-aura   { 0%,100% { opacity: 0.55; transform: scale(0.96); } 50% { opacity: 0.95; transform: scale(1.06); } }
        /* Slow inner light spin */
        @keyframes bub-spin   { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function wrap(s, w) {
  const words = s.split(' ');
  const out = []; let cur = '';
  for (const word of words) {
    if ((cur + ' ' + word).trim().length > w) { out.push(cur.trim()); cur = word; }
    else cur += ' ' + word;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/* ─────────────────── DEPTH MARKER ─────────────────── */
// Three faint depth labels appear as you scroll — gives the long descent
// a sense of going somewhere.
function DepthLabel({ depth, label, top }) {
  return (
    <div className="eyebrow" style={{
      position: 'absolute', top, right: 32, zIndex: 6,
      color: 'oklch(0.96 0.012 200 / 0.55)', fontSize: 9.5, letterSpacing: '0.2em',
      textAlign: 'right',
    }}>
      <div style={{ marginBottom: 4 }}>—{depth}m</div>
      <div style={{ opacity: 0.75 }}>{label}</div>
    </div>
  );
}

/* ─────────────────── MAIN LAYER ─────────────────── */

function SurfaceLayer({ accent, tweaks = {} }) {
  const t = {
    density:  tweaks.density  ?? 'lively',
    bubbles:  tweaks.bubbles  ?? true,
    plankton: tweaks.plankton ?? true,
    sand:     tweaks.sand     ?? true,
    tint:     tweaks.tint     ?? 'cool',
    ...tweaks,
  };
  const water = WATER_TINTS[t.tint] || WATER_TINTS.cool;

  const counts = {
    sparse: { plankton: 14, bubbles: 8  },
    lively: { plankton: 24, bubbles: 14 },
    busy:   { plankton: 40, bubbles: 26 },
  }[t.density] || { plankton: 24, bubbles: 14 };

  const [ideas, setIdeas] = useState(ideaSeeds);
  const [input, setInput] = useState('');
  const [focused, setFocused] = useState(false);

  const cast = (e) => {
    e?.preventDefault();
    if (!input.trim()) return;
    setIdeas(prev => [{ id: Date.now(), age: 0, text: input.trim() }, ...prev]);
    setInput('');
  };

  // Group ideas into "depth bands" — three rows down the column. This makes
  // the page feel like a long descent rather than a single grid.
  const bands = useMemo(() => {
    const arr = ideas.slice(0, 12);
    const a = arr.filter((_, i) => i % 3 === 0);
    const b = arr.filter((_, i) => i % 3 === 1);
    const c = arr.filter((_, i) => i % 3 === 2);
    return [a, b, c];
  }, [ideas]);

  return (
    <div style={{ position: 'relative', background: water.sky, color: 'oklch(0.20 0.05 235)' }}>

      {/* ───── Above water ───── */}
      {/* No zIndex layering between this and the descent — both share
          `water.horizon` at the boundary so the gradients meet seamlessly. */}
      <section style={{
        position: 'relative',
        background: `linear-gradient(180deg, ${water.sky} 0%, ${water.horizon} 100%)`,
        padding: '64px 64px 56px',
      }}>
        <div className="eyebrow surface" style={{ color: 'oklch(0.40 0.05 230 / 0.7)', marginBottom: 16 }}>
          Layer 01 · Ripples
        </div>
        <h1 className="f-display surface" style={{
          fontSize: 'clamp(40px, 5.2vw, 68px)', fontWeight: 300, lineHeight: 1.02,
          color: 'oklch(0.18 0.05 235)', margin: 0, letterSpacing: '-0.025em', maxWidth: 880,
          animationDelay: '0.05s',
        }}>
          What floats below the
          <br />
          <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'oklch(0.34 0.07 220)' }}>
            day-to-day surface.
          </em>
        </h1>
        <p className="f-body surface" style={{
          fontSize: 17, color: 'oklch(0.30 0.04 230 / 0.85)', maxWidth: 560, marginTop: 22,
          lineHeight: 1.6, fontWeight: 300, animationDelay: '0.15s',
        }}>
          Quick observations and half-thoughts. Drop one in to send it under. Older ideas drift longer and weather a little, scroll on; the column goes down a while.
        </p>

        <form onSubmit={cast} className="surface" style={{
          marginTop: 32, maxWidth: 580,
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 18px',
          background: 'oklch(1 0 0 / 0.78)',
          border: `1px solid ${focused ? water.glow : 'oklch(0.40 0.05 230 / 0.18)'}`,
          borderRadius: 8,
          backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          boxShadow: focused
            ? `0 8px 28px oklch(0 0 0 / 0.06), 0 0 0 3px ${water.glow}1a`
            : '0 6px 18px oklch(0 0 0 / 0.04)',
          transition: 'all 0.3s ease',
          animationDelay: '0.25s',
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
            background: water.glow, opacity: focused ? 1 : 0.45, transition: 'opacity 0.3s',
            boxShadow: focused ? `0 0 0 4px ${water.glow}33` : 'none',
          }} />
          <input
            value={input} onChange={e => setInput(e.target.value)}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            placeholder="Drop a thought into the water…"
            className="f-display"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontSize: 16, fontWeight: 300, fontStyle: 'italic',
              color: 'oklch(0.18 0.05 235)',
            }}
          />
          <button type="submit" className="eyebrow" style={{
            background: water.glow, color: 'oklch(0.97 0.012 90)',
            border: 'none', cursor: 'pointer',
            padding: '7px 14px', borderRadius: 4, fontSize: 10, letterSpacing: '0.18em',
            transition: 'transform 0.2s',
          }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
             onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            Drop in
          </button>
        </form>
      </section>

      {/* ───── Long descent ───── */}
      {/* paddingTop: 80px gives bubbles room to wander upward (-62px max in
          keyframes) without phasing through the section boundary. Without this,
          bubbles in the top row clip against the input-form section above. */}
      <section style={{
        position: 'relative',
        background: `linear-gradient(180deg, ${water.horizon} 0%, ${water.top} 8%, ${water.mid} 38%, ${water.deep} 72%, ${water.floor} 100%)`,
        padding: '80px 64px 220px',
        overflow: 'hidden',
      }}>
        {/* Ambient layers */}
        <Caustics tint={water} />
        {t.plankton && <Plankton count={counts.plankton} />}
        {t.bubbles  && <BubbleStream count={counts.bubbles} />}
        <CurrentBand y="22%" dur={120} dir={1}  hue={water.glow} />
        <CurrentBand y="58%" dur={150} dir={-1} hue={water.glow} />
        <CurrentBand y="82%" dur={180} dir={1}  hue={water.glow} />

        {/* Depth labels — punctuate the descent */}
        <DepthLabel depth="3"  label="Surface ripples" top="60px"  />
        <DepthLabel depth="14" label="Mid-water"        top="40%"  />
        <DepthLabel depth="32" label="Resting depth"    top="78%"  />

        {/* Three depth bands of bubbles */}
        <div style={{
          position: 'relative', zIndex: 5, maxWidth: 1100, margin: '0 auto',
          display: 'flex', flexDirection: 'column', gap: 100, paddingTop: 24,
        }}>
          {bands.map((band, depth) => (
            <div key={depth} style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
              gap: '60px 40px', justifyItems: 'center', alignItems: 'start',
              // Stagger every other band so bubbles don't line up vertically
              paddingLeft: depth === 1 ? 60 : 0,
              paddingRight: depth === 1 ? 60 : 0,
            }}>
              {band.map((idea, i) => (
                <div key={idea.id} style={{
                  transform: `translateY(${(i % 3) * 30}px)`,
                }}>
                  <IdeaBubble idea={idea} water={water} depth={depth} index={i} />
                </div>
              ))}
            </div>
          ))}
        </div>

        {t.sand && <Seabed tint={water} withKelp />}
      </section>
    </div>
  );
}




// ─── Direction V2 (main layout) ───────────────────────────────────────────
// Direction v2 — Tidal
// Professional light palette. Three depths: Surface (ripples + ideas adrift),
// Currents (memos), Dark Ocean (frameworks & long projects).
// Wave-curve dividers between layers. Subtle category sigils. Entry page.



/* ─────────────────── DATA ─────────────────── */

const memos_v2 = [
{ id: 6, n: '06', title: 'POST-AI', sub: 'Six traits recruiters should actually hire for in an AI-native world.', cats: ['Business', 'Careers', 'AI'], read: '6 min', date: '29 April 2026' },
{ id: 5, n: '05', title: 'The rise of the IC manager', sub: 'AI is squeezing the middle of the org chart, not the bottom.', cats: ['Business', 'AI'], read: '5 min', date: '27 April 2026' },
{ id: 4, n: '04', title: 'Speed to learning is the only metric that matters', sub: 'On why output and efficiency are the wrong outcomes for AI in marketing.', cats: ['Marketing', 'AI'], read: '4 min', date: '25 April 2026' },
{ id: 3, n: '03', title: 'The speed-taste tradeoff', sub: 'Where AI creative actually wins, and where it cannot.', cats: ['Marketing', 'AI'], read: '5 min', date: '23 April 2026' },
{ id: 2, n: '02', title: 'Stop the lane wars', sub: 'The generalist vs specialist argument is dead. Both sides are missing what changed.', cats: ['Careers', 'AI'], read: '4 min', date: '22 April 2026' },
{ id: 1, n: '01', title: 'Why being lost is an advantage in the age of AI', sub: 'On AI, restless minds, and the half of thinking consulting forgets.', cats: ['Careers', 'AI'], read: '4 min', date: '20 April 2026' }];


const ripples_v2 = [
{ id: 1, time: '2d', text: 'AI prompting is closer to scoping a colleague than briefing a writer. The skill is transferring context.' },
{ id: 2, time: '5d', text: 'Coordination cost is the hidden tax on a small team doing big-team work.' },
{ id: 3, time: '1w', text: 'Most "AI-native" job descriptions are theatre. Nobody can name the actual skill.' },
{ id: 4, time: '2w', text: 'The fastest way to learn Japanese was needing to live in it. Same with AI.' }];


const ideas_v2 = [
{ id: 1, age: 38, text: 'AI routes on specificity not social proof. Original thinking has the infrastructure it always deserved.' },
{ id: 2, age: 64, text: 'Being early to AI is not the same as being good at it.' },
{ id: 3, age: 12, text: 'Intentional AI is not a pace. It is a posture.' },
{ id: 4, age: 90, text: 'The IC manager is the shape of the future.' },
{ id: 5, age: 8, text: 'Territory between employee and founder, nobody maps well.' }];


const projects_v2 = [
{ id: 1, n: 'P/01', title: 'Cowork OS', sub: 'A 10-file system covering Juniper Japan\u2019s full business context, designed to make AI an expert peer rather than a fast intern.', kind: 'Operating system', stage: 'In use', year: '2025—' },
{ id: 2, n: 'P/02', title: 'POST-AI hiring framework', sub: 'A six-trait model for evaluating talent in an AI-native world. Built in public over twelve memos.', kind: 'Framework', stage: 'v0.2', year: '2026' },
{ id: 3, n: 'P/03', title: 'The memo writer', sub: 'A 7-stage skill that takes a raw thought and turns it into a publishable memo in under two minutes.', kind: 'Skill', stage: 'v0.2', year: '2026' }];


/* ─────────────────── ICONOGRAPHY ─────────────────── */
// Tiny line glyphs per category. Drawn with currentColor; very thin strokes
// so they sit politely beside type.

function CatSigil({ name, size = 14, style }) {
  const s = size;
  const common = {
    width: s, height: s, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 0.9,
    strokeLinecap: 'round', strokeLinejoin: 'round', style
  };
  switch (name) {
    case 'Careers':
      // a meandering path that forks — wandering route, one fork goes up
      return (
        <svg {...common}>
          <path d="M3 19c2 0 3-2 4-4s2-4 4-4 3 1 4 0 1-3 2-4" />
          <path d="M14 7c1-1 3-1 4 0M21 5l-3 3M18 5l3 0v3" strokeWidth="0.8" />
          <circle cx="3" cy="19" r="0.7" fill="currentColor" stroke="none" />
        </svg>);

    case 'Business':
      // horizon line with small rising sun arc — measured, calm
      return (
        <svg {...common}>
          <path d="M2 16h20" strokeWidth="0.7" opacity="0.5" />
          <path d="M7 16a5 5 0 0110 0" />
          <path d="M12 6v3M12 16v3M5 12h-2M21 12h-2M7 7l1.5 1.5M16.5 8.5L17 7" strokeWidth="0.6" opacity="0.7" />
        </svg>);

    case 'Marketing':
      // ripple from a dropped stone — three expanding arcs from a point
      return (
        <svg {...common}>
          <circle cx="12" cy="14" r="0.9" fill="currentColor" stroke="none" />
          <path d="M7 14a5 5 0 0110 0" opacity="0.85" />
          <path d="M4 14a8 8 0 0116 0" opacity="0.55" />
          <path d="M12 8c-0.6-1.5 0.6-2.6 0-4" strokeWidth="0.6" opacity="0.6" />
        </svg>);

    case 'AI':
      // small constellation — three dots joined by gently-curving lines
      return (
        <svg {...common}>
          <path d="M5 7Q9 9 12 6Q15 14 18 17" opacity="0.8" />
          <path d="M5 7Q10 14 18 17" opacity="0.5" strokeWidth="0.6" />
          <circle cx="5" cy="7" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="12" cy="6" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="18" cy="17" r="1.1" fill="currentColor" stroke="none" />
        </svg>);

    case 'Japan':
      // a single brushstroke wave (Hokusai-miniature) under a small disc — sun & sea
      return (
        <svg {...common}>
          <circle cx="17" cy="7" r="2.2" />
          <path d="M2 16c2-2 4 0 6 0s4-2 6 0 4 0 6-2" strokeWidth="1" />
          <path d="M3 19c2-1 4 1 6 0s4-1 6 0 4-1 6-1" opacity="0.6" strokeWidth="0.7" />
        </svg>);

    case 'Personal':
      // a single quill / feather — angled, with light barbs
      return (
        <svg {...common}>
          <path d="M5 19c4-1 8-4 11-7s4-7 4-9c-2 0-6 1-9 4s-6 7-7 11l1 1z" />
          <path d="M5 19l4-4M11 14h3M13 12h2M14 10h2" strokeWidth="0.6" opacity="0.65" />
        </svg>);

    default:
      return <svg {...common}><circle cx="12" cy="12" r="2.5" /></svg>;
  }
}

/* ─────────────────── CATEGORY BUBBLES ─────────────────── */
// Soft pastel pills, one per category. Tiny sigil + label.

// Ocean palette — variations of blue/teal with a single warm sand for contrast.
const catPalette = {
  'Careers': { bg: 'oklch(0.93 0.025 230)', fg: 'oklch(0.34 0.07 230)' }, // mist
  'Business': { bg: 'oklch(0.92 0.035 215)', fg: 'oklch(0.30 0.08 220)' }, // tide
  'Marketing': { bg: 'oklch(0.93 0.04 195)', fg: 'oklch(0.34 0.09 200)' }, // shoal
  'AI': { bg: 'oklch(0.91 0.045 240)', fg: 'oklch(0.30 0.09 245)' }, // deep
  'Japan': { bg: 'oklch(0.93 0.04 175)', fg: 'oklch(0.32 0.08 175)' }, // teal
  'Personal': { bg: 'oklch(0.93 0.035 75)', fg: 'oklch(0.40 0.07 65)' } // sand
};

function CatBubble({ name }) {
  const c = catPalette[name] || { bg: 'oklch(0.94 0.02 220)', fg: 'oklch(0.32 0.04 230)' };
  const ref = useRef(null);
  return (
    <span ref={ref} className="eyebrow" style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px 4px 8px',
      background: c.bg, color: c.fg,
      borderRadius: 999, fontSize: 9.5, letterSpacing: '0.14em',
      transition: 'transform 0.35s cubic-bezier(0.2,0.7,0.3,1), box-shadow 0.35s',
      cursor: 'pointer'
    }} onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px) scale(1.04)';
      e.currentTarget.style.boxShadow = `0 6px 14px ${c.bg}`;
    }} onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0) scale(1)';
      e.currentTarget.style.boxShadow = 'none';
    }}>
      <CatSigil name={name} size={12} />
      {name}
    </span>);

}

/* ─────────────────── ATMOSPHERIC ELEMENTS ─────────────────── */

// Subtle wavy horizontal rule. Used between section header and content, and
// between rows. Stays in currentColor so it picks up surrounding text colour.
function WavyHR({ color = 'currentColor', opacity = 0.15, height = 8, width = 1200, freq = 22, amp = 1.2, style }) {
  // Build a single sine wave path.
  const pts = [];
  for (let x = 0; x <= width; x += 6) {
    const y = height / 2 + Math.sin(x / width * Math.PI * freq) * amp;
    pts.push(`${x === 0 ? 'M' : 'L'}${x} ${y.toFixed(2)}`);
  }
  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none"
    style={{ display: 'block', width: '100%', height, ...style }}>
      <path d={pts.join(' ')} fill="none" stroke={color} strokeWidth="0.7" opacity={opacity} />
    </svg>);

}

// Multi-layer animated wave divider. Three wave layers move at different
// speeds and amplitudes; the gradient between `from` and `to` blends across
// the divider so there's no hard seam.
// Header-style wave divider. Multiple overlapping long, low-frequency curves
// in the target color at varying opacity, offset vertically. Each layer drifts
// horizontally at a different slow speed so the stack feels alive but never
// choppy. No noise, no spiky waveforms — this should read as a graphic
// flourish, not a hand-drawn line.
function WaveDivider({ from = '#f0eee9', to = '#e8eef2', flip = false, accent, height = 120 }) {
  // Each layer: a smooth wave path drawn as a flowing curve. We pre-render
  // SVG paths (no per-frame JS) and animate the whole layer with a slow
  // horizontal drift.
  // Progressive low-opacity layers — when from===to (Ripples→Currents), this
  // reads as smooth subtle texture instead of distinct horizontal stripes.
  // When from≠to (Depths→About), the OKLCH gradient does the heavy lifting and
  // these waves become decorative.
  const layers = [
  // {opacity, baseY (as % of height), amp, fill, dur, dir}
  { o: 0.06, y: 0.20, amp: 18, fill: accent, dur: 32, dir: 1 },
  { o: 0.10, y: 0.40, amp: 22, fill: to, dur: 40, dir: -1 },
  { o: 0.16, y: 0.60, amp: 18, fill: to, dur: 28, dir: 1 },
  { o: 0.24, y: 0.78, amp: 14, fill: to, dur: 36, dir: -1 },
  { o: 0.40, y: 0.92, amp: 10, fill: to, dur: 24, dir: 1 }];

  const W = 2400; // double-width so the drift loops cleanly
  // Build one smooth wave path: gentle, single-period sine across the width.
  const wavePath = (baseY, amp, periods = 2.5) => {
    const cx = W / (periods * 4);
    let d = `M0 ${baseY}`;
    for (let i = 0; i < periods * 2; i++) {
      const x1 = (i + 0.5) * cx * 2;
      const x2 = (i + 1) * cx * 2;
      const y = baseY + (i % 2 === 0 ? -amp : amp);
      d += ` Q ${x1} ${y} ${x2} ${baseY}`;
    }
    d += ` L ${W} ${height} L 0 ${height} Z`;
    return d;
  };

  return (
    <div style={{
      position: 'relative', height, lineHeight: 0,
      // OKLCH interpolation prevents banding when from/to differ in hue or lightness.
      // Settled zones at 0–15% and 85–100% keep the layer endpoints visually anchored;
      // the 70% transition band uses perceptually-uniform OKLCH so wide hue jumps
      // (e.g. Depths → About) blend without a hard color band.
      background: `linear-gradient(in oklch 180deg, ${from} 0%, ${from} 15%, ${to} 85%, ${to} 100%)`,
      transform: flip ? 'scaleY(-1)' : 'none', overflow: 'hidden'
    }}>
      {layers.map((L, i) =>
      <svg key={i} viewBox={`0 0 ${W / 2} ${height}`} preserveAspectRatio="none"
      style={{
        position: 'absolute', top: 0, left: 0, width: '200%', height: '100%',
        opacity: L.o,
        animation: `wd-drift ${L.dur}s linear infinite ${L.dir < 0 ? 'reverse' : ''}`
      }}>
          <path d={wavePath(L.y * height, L.amp, 3 + i * 0.4)} fill={L.fill} />
        </svg>
      )}
      <style>{`@keyframes wd-drift { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
    </div>);

}

// Drifting particles for the Dark Ocean — very subtle.
function DriftField({ count = 18, hue = 215, opacity = 0.5 }) {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {Array.from({ length: count }).map((_, i) => {
        const left = i * 53 % 100;
        const top = (i * 41 + 7) % 100;
        const dur = 14 + i % 6 * 3;
        const delay = -(i * 1.7);
        const size = 1.5 + i % 4 * 0.6;
        const h = hue + i * 11 % 30 - 15;
        return (
          <span key={i} style={{
            position: 'absolute', left: `${left}%`, top: `${top}%`,
            width: size, height: size, borderRadius: '50%',
            background: `oklch(0.92 0.06 ${h})`,
            boxShadow: `0 0 ${size * 5}px oklch(0.86 0.10 ${h} / 0.7)`,
            opacity, animation: `drift${i % 4} ${dur}s ${delay}s ease-in-out infinite`
          }} />);

      })}
      <style>{`
        @keyframes drift0 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(18px,-22px); } }
        @keyframes drift1 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-22px,-14px); } }
        @keyframes drift2 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(14px,-30px); } }
        @keyframes drift3 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-12px,-20px); } }
      `}</style>
    </div>);

}

// Surface ripple background — ultra-subtle concentric circles
function RippleBg({ accent }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;if (!c) return;
    const ctx = c.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf;
    const ripples = [];
    const resize = () => {
      const r = c.getBoundingClientRect();
      c.width = r.width * dpr;c.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);ro.observe(c);

    let last = Date.now();
    const draw = () => {
      const w = c.width / dpr,h = c.height / dpr;
      ctx.clearRect(0, 0, w, h);
      const now = Date.now();
      if (now - last > 1800 && ripples.length < 5) {
        ripples.push({ x: Math.random() * w, y: Math.random() * h, r: 0, max: 80 + Math.random() * 90 });
        last = now;
      }
      ripples.forEach((r, i) => {
        r.r += 0.55;
        const op = (1 - r.r / r.max) * 0.16;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
        ctx.strokeStyle = `oklch(0.55 0.06 215 / ${op})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
        if (r.r >= r.max) ripples.splice(i, 1);
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {cancelAnimationFrame(raf);ro.disconnect();};
  }, [accent]);
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
}

/* ─────────────────── ENTRY PAGE ─────────────────── */

function EntryV2({ onEnter, accent }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, cursor: 'pointer',
      background: 'linear-gradient(180deg, #f5f3ec 0%, #eaeef0 45%, #d6e2e7 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden'
    }} onClick={onEnter}>
      <RippleBg accent={accent} />

      <div className="eyebrow" style={{ position: 'absolute', top: 28, left: 36, color: 'oklch(0.45 0.04 220 / 0.7)' }}>
        H · L
      </div>
      <div className="eyebrow" style={{
        position: 'absolute', top: 28, right: 36, color: 'oklch(0.45 0.04 220 / 0.55)'
      }}>
        Tokyo · Vol. III
      </div>

      <div style={{ textAlign: 'center', position: 'relative', zIndex: 2, padding: '0 32px' }}>
        <div className="eyebrow surface" style={{
          color: 'oklch(0.45 0.04 220 / 0.7)', marginBottom: 40, animationDelay: '0.2s'
        }}>
          ◯ &nbsp; Personal site &amp; field notebook
        </div>
        <h1 className="f-display surface" style={{
          fontSize: 'clamp(56px, 9vw, 128px)', fontWeight: 200, lineHeight: 0.96,
          color: 'oklch(0.28 0.04 235)', margin: 0, letterSpacing: '-0.04em',
          animationDelay: '0.45s'
        }}>
          <em style={{ fontStyle: 'italic', fontWeight: 300 }}>Dive in.</em>
        </h1>
        <p className="f-body surface" style={{
          fontSize: 19, color: 'oklch(0.40 0.04 230 / 0.8)', maxWidth: 480,
          margin: '32px auto 64px', lineHeight: 1.6, fontWeight: 300, animationDelay: '0.7s'
        }}>
          Some currents from a mind that won&apos;t sit still.
        </p>
        <div className="eyebrow surface breathe" style={{
          color: 'oklch(0.45 0.04 220 / 0.7)', animationDelay: '1s'
        }}>
          Tap anywhere to enter →
        </div>
      </div>

      {/* hint of waves at bottom */}
      <svg viewBox="0 0 1440 200" preserveAspectRatio="none"
      style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 200, opacity: 0.4 }}>
        <path d="M0 120 C240 90 480 150 720 120 C960 90 1200 150 1440 120 L1440 200 L0 200 Z"
        fill="oklch(0.55 0.06 215 / 0.18)" />
        <path d="M0 150 C240 120 480 180 720 150 C960 120 1200 180 1440 150 L1440 200 L0 200 Z"
        fill="oklch(0.45 0.06 220 / 0.22)" />
        <path d="M0 175 C240 150 480 195 720 175 C960 155 1200 195 1440 175 L1440 200 L0 200 Z"
        fill="oklch(0.35 0.05 225 / 0.30)" />
      </svg>
    </div>);

}

/* ─────────────────── SIDE NAV ─────────────────── */
// Vertical wave-shaped rail. Each layer is a "depth band" with its own colour.

function SideNav({ active, onChange, onHome, accent }) {
  const layers = [
  { id: 'surface', label: 'Ripples', sub: 'Ideas surfacing', band: 'oklch(0.96 0.012 200)', text: 'oklch(0.30 0.04 230)', dark: false },
  { id: 'currents', label: 'Currents', sub: 'Surfacing Ideas', band: 'oklch(0.34 0.06 232)', text: 'oklch(0.94 0.02 200)', dark: true },
  { id: 'deep', label: 'The Depths', sub: 'Deep dives', band: 'oklch(0.16 0.05 242)', text: 'oklch(0.94 0.02 200)', dark: true }];

  const aboutLayer = { id: 'about', label: 'About', text: 'oklch(0.45 0.04 220)' };
  const [hover, setHover] = useState(null);

  return (
    <aside style={{
      width: 220, flexShrink: 0, position: 'sticky', top: 0, height: '100vh',
      display: 'flex', flexDirection: 'column',
      background: 'oklch(0.97 0.008 95)',
      borderRight: '1px solid oklch(0.30 0.04 230 / 0.08)'
    }}>
      <button onClick={() => onChange('about')}
      onMouseEnter={() => setHover('about')} onMouseLeave={() => setHover(null)}
      style={{
        background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
        padding: '36px 28px 28px',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14,
        color: active === 'about' ? accent : 'oklch(0.22 0.05 235)',
        transition: 'color 0.3s'
      }}>
        <div>
          <div className="f-display" style={{
            fontSize: 26, fontWeight: 300, lineHeight: 1, fontStyle: 'italic',
            color: active === 'about' ? accent : 'oklch(0.22 0.05 235)',
            transition: 'color 0.3s'
          }}>About me   </div>
          <div className="eyebrow" style={{ color: 'oklch(0.45 0.04 220 / 0.6)', fontSize: 9, marginTop: 8 }}>
            About · Tokyo
          </div>
        </div>
        <span style={{
          marginTop: 4, fontSize: 18, lineHeight: 1,
          opacity: hover === 'about' || active === 'about' ? 1 : 0.35,
          transform: hover === 'about' ? 'translateX(2px)' : 'translateX(0)',
          transition: 'all 0.3s',
          color: active === 'about' ? accent : 'oklch(0.45 0.04 220)'
        }}>→</span>
      </button>

      {/* The three depth layers — equal heights, desaturated when inactive,
                 active band gets a curling wave that bleeds into the content area
                 to visually connect the rail with the page. */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', minHeight: 0 }}>
        {layers.map((l, i) => {
          const isActive = active === l.id;
          const isHover = hover === l.id;
          const filter = isActive ? 'none' : 'saturate(0.35) brightness(1.04)';
          const textOpacity = isActive ? 1 : isHover ? 0.85 : 0.5;

          return (
            <button key={l.id} onClick={() => onChange(l.id)}
            onMouseEnter={() => setHover(l.id)} onMouseLeave={() => setHover(null)}
            style={{
              position: 'relative', cursor: 'pointer', border: 'none',
              background: l.band, padding: 0, flex: 1,
              filter,
              transition: 'filter 0.6s ease, transform 0.6s cubic-bezier(0.2,0.7,0.3,1)',
              transform: isActive ? 'translateX(2px)' : isHover ? 'translateX(1px)' : 'translateX(0)',
              zIndex: isActive ? 3 : isHover ? 2 : 1,
              boxShadow: isActive ?
              `inset 4px 0 0 ${accent}, 6px 0 24px -8px oklch(0 0 0 / 0.18), inset 0 1px 0 oklch(1 0 0 / 0.5)` :
              isHover ?
              `inset 2px 0 0 oklch(0.55 0.04 220 / 0.4)` :
              'none'
            }}>
              <svg viewBox="0 0 32 200" preserveAspectRatio="none"
              style={{
                position: 'absolute', top: 0, right: -16, height: '100%', width: 32,
                pointerEvents: 'none',
                opacity: isActive ? 1 : 0,
                transform: isActive ? 'translateX(0)' : 'translateX(-8px)',
                transition: 'opacity 0.5s, transform 0.6s cubic-bezier(0.2,0.7,0.3,1)'
              }}>
                <path d="M0 0 Q22 50 12 100 Q2 150 0 200 L0 0 Z" fill={l.band}>
                  <animate attributeName="d"
                  values="M0 0 Q22 50 12 100 Q2 150 0 200 L0 0 Z;
                            M0 0 Q26 60 14 100 Q4 140 0 200 L0 0 Z;
                            M0 0 Q22 50 12 100 Q2 150 0 200 L0 0 Z"














                  dur="6s" repeatCount="indefinite" />
                </path>
              </svg>

              <svg viewBox="0 0 24 24"
              style={{
                position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                width: 16, height: 16, opacity: isHover && !isActive ? 0.6 : 0,
                transition: 'opacity 0.3s'
              }}>
                <path d="M8 6 Q14 12 8 18" fill="none" stroke={l.text} strokeWidth="1.2" strokeLinecap="round" />
              </svg>

              <div style={{
                padding: '20px 24px', height: '100%', display: 'flex', flexDirection: 'column',
                justifyContent: 'center', textAlign: 'left', position: 'relative'
              }}>
                <div className="eyebrow" style={{
                  color: l.text, opacity: textOpacity * 0.7, fontSize: 9,
                  transition: 'opacity 0.5s', marginBottom: 6
                }}>
                  Layer {String(i + 1).padStart(2, '0')}
                </div>
                <div className="f-display" style={{
                  fontSize: isActive ? 24 : 22,
                  fontWeight: isActive ? 400 : 300,
                  fontStyle: isActive ? 'italic' : 'normal',
                  color: l.text, opacity: textOpacity,
                  lineHeight: 1.05,
                  transition: 'all 0.55s cubic-bezier(0.2,0.7,0.3,1)',
                  letterSpacing: isActive ? '-0.01em' : '0'
                }}>{l.label}</div>
                <div className="f-body" style={{
                  fontSize: 12, color: l.text, opacity: textOpacity * 0.7,
                  marginTop: 4, fontWeight: 300, transition: 'opacity 0.5s'
                }}>{l.sub}</div>
              </div>
            </button>);

        })}
      </nav>

      {/* About is fused into the header at the top — no separate footer link. */}
      <div className="f-mono" style={{
        fontSize: 9, color: 'oklch(0.45 0.04 220 / 0.5)', lineHeight: 1.7,
        padding: '14px 28px 18px', borderTop: '1px solid oklch(0.30 0.04 230 / 0.08)',
        letterSpacing: '0.06em'
      }}>
        EST. 2026 · TOKYO
      </div>
    </aside>);

}

/* ─────────────────── LAYER 1 (legacy) — SURFACE (Ripples + Ideas) ───────────────────
 * Replaced by SurfaceLayer from directions/surface-layer-v2.jsx, which renders
 * a quiet Ghibli-underwater scene with ideas as bubbles / lantern fish / paper boats.
 * Kept here only as fallback. */

function LegacySurfaceLayer({ accent, onOpenMemo }) {
  const [input, setInput] = useState('');
  const [list, setList] = useState(ideas_v2);
  const cast = (e) => {
    e.preventDefault();if (!input.trim()) return;
    setList([{ id: Date.now(), age: 0, text: input.trim() }, ...list]);
    setInput('');
  };

  return (
    <div style={{ background: 'oklch(0.96 0.012 200)', position: 'relative', overflow: 'hidden' }}>
      <RippleBg accent={accent} />

      <div style={{ padding: '64px 64px 24px', position: 'relative', zIndex: 1 }}>
        <div className="eyebrow surface" style={{ color: 'oklch(0.45 0.04 220)', marginBottom: 18 }}>
          Layer 01 · Ripples
        </div>
        <h1 className="f-display surface" style={{
          fontSize: 'clamp(40px, 5.5vw, 72px)', fontWeight: 300, lineHeight: 1,
          color: 'oklch(0.22 0.05 235)', margin: 0, letterSpacing: '-0.03em',
          animationDelay: '0.1s'
        }}>
          Ideas coming to mind,
          <br />
          <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'oklch(0.40 0.07 220)' }}>breaking the surface.</em>
        </h1>
        <p className="f-body surface" style={{
          fontSize: 18, color: 'oklch(0.32 0.04 230 / 0.78)', maxWidth: 540, marginTop: 24,
          lineHeight: 1.6, fontWeight: 300, animationDelay: '0.2s'
        }}>
          Quick observations, half-thoughts, things I&apos;m turning over. Cast one in below — it joins the others adrift. Older ideas glow softly when they want attention.
        </p>
      </div>

      {/* Two-column: ripples (left, "things landed") + ideas pool (right, "things still drifting") */}
      <div style={{ padding: '24px 64px 64px', position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56 }}>

        <section>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 24 }}>
            <h2 className="f-display surface" style={{
              fontSize: 26, fontWeight: 400, color: 'oklch(0.22 0.05 235)', margin: 0,
              fontStyle: 'italic', letterSpacing: '-0.015em', animationDelay: '0.3s'
            }}>Just surfaced</h2>
            <div style={{ flex: 1, height: 1,
              background: `linear-gradient(90deg, oklch(0.55 0.06 215 / 0.3), transparent)` }} />
            <span className="eyebrow" style={{ color: 'oklch(0.45 0.04 220 / 0.6)', fontSize: 10 }}>
              {ripples_v2.length} adrift
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {ripples_v2.map((r, i) =>
            <article key={r.id} className="surface" style={{
              position: 'relative', padding: '20px 24px',
              background: 'oklch(1 0 0 / 0.6)',
              border: '1px solid oklch(0.55 0.06 215 / 0.18)',
              borderRadius: 4, animationDelay: `${0.35 + i * 0.06}s`,
              overflow: 'hidden'
            }}>
                <div className="eyebrow" style={{ color: accent, fontSize: 10, marginBottom: 10 }}>
                  ◌ {r.time} ago
                </div>
                <p className="f-body" style={{
                margin: 0, fontSize: 16, lineHeight: 1.6,
                color: 'oklch(0.22 0.05 235)', fontWeight: 300
              }}>{r.text}</p>
                {/* concentric ripple decoration */}
                <div style={{
                position: 'absolute', bottom: -22, right: -22,
                width: 70, height: 70, borderRadius: '50%',
                border: `1px solid ${accent}`, opacity: 0.18
              }} />
                <div style={{
                position: 'absolute', bottom: -36, right: -36,
                width: 100, height: 100, borderRadius: '50%',
                border: `1px solid ${accent}`, opacity: 0.10
              }} />
              </article>
            )}
          </div>
        </section>

        <section>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 24 }}>
            <h2 className="f-display surface" style={{
              fontSize: 26, fontWeight: 400, color: 'oklch(0.22 0.05 235)', margin: 0,
              fontStyle: 'italic', letterSpacing: '-0.015em', animationDelay: '0.35s'
            }}>Ideas adrift</h2>
            <div style={{ flex: 1, height: 1,
              background: `linear-gradient(90deg, oklch(0.55 0.06 215 / 0.3), transparent)` }} />
            <span className="eyebrow" style={{ color: 'oklch(0.45 0.04 220 / 0.6)', fontSize: 10 }}>
              {list.length} drifting
            </span>
          </div>

          <form onSubmit={cast} className="surface" style={{
            display: 'flex', alignItems: 'baseline', gap: 0, marginBottom: 20,
            borderBottom: `1px solid ${accent}`, paddingBottom: 6, animationDelay: '0.4s'
          }}>
            <input value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="Throw a thought into the water…"
            className="f-display"
            style={{
              flex: 1, padding: '10px 0', fontSize: 17, fontWeight: 300, fontStyle: 'italic',
              background: 'transparent', border: 'none',
              color: 'oklch(0.22 0.05 235)', outline: 'none'
            }} />
            
            <button type="submit" className="eyebrow" style={{
              padding: '0 0 0 14px', background: 'transparent', border: 'none', cursor: 'pointer',
              color: accent, letterSpacing: '0.16em', fontSize: 11
            }}>Cast →</button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {list.map((idea, i) => {
              const old = idea.age >= 30,veryOld = idea.age >= 60;
              return (
                <div key={idea.id} className="surface" style={{
                  padding: '14px 18px',
                  background: veryOld ? 'oklch(0.96 0.04 200 / 0.7)' : 'oklch(1 0 0 / 0.4)',
                  border: `1px solid ${veryOld ? accent : 'oklch(0.55 0.06 215 / 0.18)'}`,
                  borderRadius: 3, cursor: 'pointer',
                  animationDelay: `${0.5 + i * 0.05}s`,
                  animation: veryOld ? `surface 0.8s ease-out forwards, soft 5s ease-in-out infinite ${1 + i * 0.2}s` : undefined,
                  display: 'grid', gridTemplateColumns: '70px 1fr', gap: 16, alignItems: 'baseline',
                  transition: 'all 0.3s'
                }}>
                  <div className="eyebrow" style={{
                    fontSize: 9, color: veryOld ? accent : 'oklch(0.45 0.04 220 / 0.7)'
                  }}>
                    {idea.age === 0 ? 'just cast' : `${idea.age}d`}
                    {veryOld && <div style={{ opacity: 0.6, marginTop: 2 }}>● glowing</div>}
                  </div>
                  <p className="f-body" style={{
                    margin: 0, fontSize: 14, lineHeight: 1.55, color: 'oklch(0.22 0.05 235 / 0.92)', fontWeight: 300
                  }}>{idea.text}</p>
                </div>);

            })}
          </div>
        </section>
      </div>

      <style>{`
        @keyframes soft {
          0%,100% { box-shadow: 0 0 0 0 oklch(0.86 0.10 200 / 0); }
          50% { box-shadow: 0 0 18px 0 oklch(0.86 0.10 200 / 0.45); }
        }
      `}</style>
    </div>);

}

/* ─────────────────── LAYER 2 — CURRENTS (memos) ─────────────────── */

// Underwater atmospherics for Currents:
//  - 4 slow horizontal "sunbeam" bands sliding across at different speeds
//  - 1 caustic shimmer band near the top
//  - All low-opacity so the cards remain hero
function CurrentsAtmosphere() {
  return (
    <>
      {/* Caustic shimmer near the top — slow distortion of light */}
      <svg viewBox="0 0 1600 240" preserveAspectRatio="none"
      style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: 240,
        pointerEvents: 'none', zIndex: 0, opacity: 0.35
      }}>
        <defs>
          <linearGradient id="caustic-fade-cur" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.85 0.04 210 / 0.5)" />
            <stop offset="100%" stopColor="oklch(0.85 0.04 210 / 0)" />
          </linearGradient>
          <filter id="caustic-warp-cur">
            <feTurbulence type="fractalNoise" baseFrequency="0.006 0.012" numOctaves="2" seed="5">
              <animate attributeName="baseFrequency"
              values="0.006 0.012;0.009 0.014;0.006 0.012" dur="26s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" scale="22" />
          </filter>
        </defs>
        <rect width="1600" height="240" fill="url(#caustic-fade-cur)" filter="url(#caustic-warp-cur)" />
      </svg>

      {/* Slow horizontal sunbeam currents */}
      {[
      { y: '15%', dur: 110, dir: 1, hue: 'oklch(0.78 0.06 210)' },
      { y: '38%', dur: 140, dir: -1, hue: 'oklch(0.66 0.07 215)' },
      { y: '64%', dur: 170, dir: 1, hue: 'oklch(0.55 0.07 220)' },
      { y: '88%', dur: 200, dir: -1, hue: 'oklch(0.45 0.07 226)' }].
      map((b, i) =>
      <div key={i} style={{
        position: 'absolute', top: b.y, left: 0, right: 0, height: 2,
        pointerEvents: 'none', zIndex: 0, overflow: 'hidden'
      }}>
          <svg viewBox="0 0 3200 60" preserveAspectRatio="none" style={{
          width: '200%', height: 60, transform: 'translateY(-30px)',
          animation: `cur-flow ${b.dur}s linear infinite ${b.dir < 0 ? 'reverse' : ''}`,
          opacity: 0.55
        }}>
            <path d="M0 30 Q400 22 800 30 T1600 30 T2400 30 T3200 30" fill="none"
          stroke={b.hue} strokeWidth="0.7" opacity="0.6" />
            <path d="M0 32 Q400 36 800 32 T1600 32 T2400 32 T3200 32" fill="none"
          stroke={b.hue} strokeWidth="0.4" opacity="0.4" />
          </svg>
        </div>
      )}
      <style>{`@keyframes cur-flow { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
    </>);

}

function CurrentsLayer({ accent, cyan, onOpenMemo, memos }) {
  const cyanAccent = cyan || 'oklch(0.46 0.14 200)';
  const [filter, setFilter] = useState('all');
  const cats = ['all', 'Careers', 'Business', 'Marketing', 'AI', 'Japan', 'Personal'];
  const memoSource = (memos && memos.length) ? memos : memos_v2;
  const filtered = filter === 'all' ? memoSource : memoSource.filter((m) => m.cats.includes(filter));

  return (
    <div style={{
      // Layered gradient: mid-ocean blue with darker pockets, like sun-shafts
      // breaking through water.
      background: `
        radial-gradient(ellipse at 20% 10%, oklch(0.42 0.06 226 / 0.45) 0%, transparent 60%),
        radial-gradient(ellipse at 85% 70%, oklch(0.26 0.05 238 / 0.35) 0%, transparent 55%),
        linear-gradient(180deg, oklch(0.34 0.06 232) 0%, oklch(0.30 0.058 234) 100%)
      `,
      color: 'oklch(0.94 0.02 200)',
      position: 'relative', overflow: 'hidden'
    }}>
      {/* Underwater atmospherics — subtle, slow, ambient */}
      <CurrentsAtmosphere />
      <DriftField count={22} hue={210} opacity={0.45} />

      <div style={{ padding: '72px 64px 32px', position: 'relative', zIndex: 1 }}>
        <div className="eyebrow surface" style={{ color: accent, marginBottom: 18 }}>
          Layer 02 · Currents
        </div>
        <h1 className="f-display surface" style={{
          fontSize: 'clamp(40px, 5.5vw, 72px)', fontWeight: 300, lineHeight: 1,
          color: 'oklch(0.96 0.01 90)', margin: 0, letterSpacing: '-0.03em',
          animationDelay: '0.1s'
        }}>
          The trends moving
          <br />
          <em style={{ fontStyle: 'italic', fontWeight: 300, color: cyanAccent, opacity: 0.95 }}>
            the world below.
          </em>
        </h1>
        <p className="f-body surface" style={{
          fontSize: 18, color: 'oklch(0.92 0.02 200 / 0.78)', maxWidth: 560, marginTop: 24,
          lineHeight: 1.6, fontWeight: 300, animationDelay: '0.2s'
        }}>
          Points of view. The arguments and currents I think shape what&apos;s coming, written quickly, not exhaustively, and shared in case any of it is useful.
        </p>
      </div>

      <div style={{ padding: '0 64px 24px', position: 'relative', zIndex: 1, color: 'oklch(0.94 0.02 200 / 0.4)' }}>
        <WavyHR opacity={0.4} amp={1.4} freq={26} height={10} />
      </div>

      <div style={{ padding: '24px 64px 24px', display: 'flex', gap: 18, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
        {cats.map((c) => {
          const active = filter === c;
          return (
            <button key={c} onClick={() => setFilter(c)} className="eyebrow" style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '8px 0', display: 'flex', alignItems: 'center', gap: 8,
              color: active ? accent : 'oklch(0.94 0.02 200 / 0.55)',
              borderBottom: active ? `1px solid ${accent}` : '1px solid transparent',
              transition: 'all 0.3s'
            }}>
              {c !== 'all' && <CatSigil name={c} size={13} />}
              {c === 'all' ? 'All' : c}
            </button>);

        })}
      </div>

      <ol style={{ listStyle: 'none', padding: '8px 64px 80px', margin: 0, position: 'relative', zIndex: 1, display: 'grid', gap: 14 }}>
        {filtered.map((m, i) =>
        <li key={m.id} className="surface card-row" onClick={() => onOpenMemo && onOpenMemo(m.id)} style={{
          display: 'grid', gridTemplateColumns: '1fr 110px', gap: 28,
          padding: '26px 30px',
          background: 'oklch(0.97 0.012 215 / 0.78)',
          border: '1px solid oklch(0.95 0.015 215 / 0.5)',
          borderRadius: 8,
          backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
          boxShadow: '0 1px 0 oklch(1 0 0 / 0.18) inset, 0 10px 28px oklch(0 0 0 / 0.22)',
          cursor: 'pointer', animationDelay: `${0.25 + i * 0.05}s`,
          transition: 'all 0.35s cubic-bezier(0.2,0.7,0.3,1)'
        }} onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.borderColor = `${accent}77`;
          e.currentTarget.style.boxShadow = `0 1px 0 oklch(1 0 0 / 0.18) inset, 0 18px 42px oklch(0 0 0 / 0.32), 0 0 0 1px ${accent}44`;
        }} onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.borderColor = 'oklch(0.95 0.015 215 / 0.5)';
          e.currentTarget.style.boxShadow = '0 1px 0 oklch(1 0 0 / 0.18) inset, 0 10px 28px oklch(0 0 0 / 0.22)';
        }}>
            <div>
              <h3 className="f-display" style={{
              margin: 0, fontSize: 28, fontWeight: 500, lineHeight: 1.18,
              color: 'oklch(0.36 0.13 210)', letterSpacing: '-0.02em', marginBottom: 10
            }}>{m.title}</h3>
              <p className="f-body" style={{
              margin: '0 0 16px', fontSize: 16, lineHeight: 1.55, color: 'oklch(0.22 0.04 230)',
              fontStyle: 'italic', fontWeight: 300
            }}>{m.sub}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {m.cats.map((c) => <CatBubble key={c} name={c} />)}
              </div>
            </div>
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div className="eyebrow" style={{ color: 'oklch(0.30 0.04 230 / 0.85)', fontSize: 10 }}>{m.read}</div>
                <div className="eyebrow" style={{ color: 'oklch(0.40 0.04 220 / 0.55)', fontSize: 10, marginTop: 4 }}>{m.date}</div>
              </div>
              <span className="eyebrow" style={{ color: accent, fontSize: 10, marginTop: 16 }}>Read →</span>
            </div>
          </li>
        )}
      </ol>
    </div>);

}

/* ─────────────────── LAYER 3 — DARK OCEAN (Frameworks & projects) ─────────────────── */

function DarkOceanLayer({ accent, cyan }) {
  const cyanAccent = cyan || 'oklch(0.46 0.14 200)';
  return (
    <div style={{
      background: 'linear-gradient(180deg, oklch(0.16 0.05 242) 0%, oklch(0.10 0.04 246) 100%)',
      color: 'oklch(0.94 0.02 200)', position: 'relative', overflow: 'hidden'
    }}>
      <DriftField count={28} hue={195} opacity={0.55} />

      <div style={{ padding: '64px 64px 32px', position: 'relative', zIndex: 1 }}>
        <div className="eyebrow surface" style={{ color: accent, marginBottom: 18 }}>
          Layer 03 · The Depths
        </div>
        <h1 className="f-display surface" style={{
          fontSize: 'clamp(40px, 5.5vw, 72px)', fontWeight: 300, lineHeight: 1,
          color: 'oklch(0.96 0.01 90)', margin: 0, letterSpacing: '-0.03em',
          animationDelay: '0.1s'
        }}>
          The questions pulling
          <br />
          <em style={{ fontStyle: 'italic', fontWeight: 300, color: cyanAccent, opacity: 0.95 }}>
            me deeper.
          </em>
        </h1>
        <p className="f-body surface" style={{
          fontSize: 18, color: 'oklch(0.92 0.02 200 / 0.78)', maxWidth: 560, marginTop: 24,
          lineHeight: 1.6, fontWeight: 300, animationDelay: '0.2s'
        }}>
          Deep dives. Longer looks at the topics I keep coming back to: frameworks, operating systems, ways of thinking that take more than a memo to argue. They keep growing in the dark and surface when they&apos;re ready.
        </p>
      </div>

      <div style={{ padding: '0 64px 80px', position: 'relative', zIndex: 1, display: 'grid', gap: 16 }}>
        {projects_v2.map((p, i) =>
        // Cleaner card treatment: single crisp cyan border at 40% opacity at
        // rest, ramps to 80% on hover with a soft drop shadow. Removed the
        // earlier inset highlights which were making edges look fuzzy.
        <article key={p.id} className="surface" style={{
          display: 'grid', gridTemplateColumns: '1fr 180px',
          gap: 32, padding: '36px 36px',
          background: 'oklch(0.97 0.01 90 / 0.04)',
          border: `1px solid ${cyanAccent}66`,
          borderRadius: 4, cursor: 'pointer',
          backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
          boxShadow: 'none',
          animationDelay: `${0.3 + i * 0.08}s`, transition: 'all 0.35s cubic-bezier(0.2,0.7,0.3,1)'
        }} onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = `${cyanAccent}cc`;
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.background = 'oklch(0.97 0.01 90 / 0.07)';
          e.currentTarget.style.boxShadow = `0 12px 32px oklch(0 0 0 / 0.32), 0 0 28px ${cyanAccent}2a`;
        }} onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = `${cyanAccent}66`;
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.background = 'oklch(0.97 0.01 90 / 0.04)';
          e.currentTarget.style.boxShadow = 'none';
        }}>
            <div>
              <div className="eyebrow" style={{ color: 'oklch(0.92 0.02 200 / 0.6)', fontSize: 10, marginBottom: 10 }}>
                {p.kind}
              </div>
              <h3 className="f-display" style={{
              margin: 0, fontSize: 28, fontWeight: 400, lineHeight: 1.2,
              color: 'oklch(0.97 0.01 90)', letterSpacing: '-0.02em', marginBottom: 10
            }}>{p.title}</h3>
              <p className="f-body" style={{
              margin: 0, fontSize: 16, lineHeight: 1.6, color: 'oklch(0.92 0.02 200 / 0.78)',
              fontWeight: 300
            }}>{p.sub}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', textAlign: 'right' }}>
              <div className="eyebrow" style={{ color: 'oklch(0.92 0.02 200 / 0.5)', fontSize: 10 }}>{p.year}</div>
              <span className="eyebrow" style={{ color: accent, fontSize: 10 }}>Open project →</span>
            </div>
          </article>
        )}
      </div>
    </div>);

}

/* ─────────────────── LAYER 4 — ABOUT ─────────────────── */

function AboutLayer({ accent, cyan }) {
  const cyanAccent = cyan || 'oklch(0.46 0.14 200)';
  // Ascending out of the deep — this is the sunlit shoreline / sky layer.
  // Warm cream with a soft radial sun-glow up top. Dark legible body text.
  // Single-column letter format; the right-side resume aside is gone.
  return (
    <div style={{
      background: `
        radial-gradient(ellipse at 75% -5%, oklch(0.985 0.045 78 / 0.95) 0%, transparent 55%),
        radial-gradient(ellipse at 10% 105%, oklch(0.97 0.04 60 / 0.7) 0%, transparent 60%),
        radial-gradient(ellipse at 90% 70%, oklch(0.98 0.035 50 / 0.55) 0%, transparent 50%),
        linear-gradient(180deg, oklch(0.985 0.022 82) 0%, oklch(0.975 0.028 72) 50%, oklch(0.97 0.032 65) 100%)
      `,
      color: 'oklch(0.22 0.04 60)', position: 'relative', overflow: 'hidden'
    }}>
      <PaperTexture opacity={0.28} scale={0.9} />

      <article className="surface" style={{
        position: 'relative', zIndex: 1,
        maxWidth: 720, margin: '0 auto',
        padding: '96px 56px 120px',
        display: 'flex', flexDirection: 'column', gap: 28
      }}>
        <div className="eyebrow" style={{ color: 'oklch(0.45 0.08 60)' }}>ABOUT ME

        </div>

        {/* Letter-style date/place line */}
        <div className="f-display" style={{
          fontSize: 18, fontStyle: 'italic', fontWeight: 300,
          color: 'oklch(0.40 0.06 60)', letterSpacing: '0.01em',
          animationDelay: '0.1s'
        }}>
          Tokyo, lately —
        </div>

        <h1 className="f-display" style={{
          fontSize: 'clamp(34px, 4.4vw, 52px)', fontWeight: 300, lineHeight: 1.08,
          color: 'oklch(0.18 0.04 240)', margin: 0, letterSpacing: '-0.025em',
          animationDelay: '0.15s'
        }}>
          The work I do on the surface, and the questions that pull me{' '}
          <em style={{ color: cyanAccent, fontStyle: 'italic' }}>underneath</em>.
        </h1>

        <div className="f-body" style={{
          fontSize: 18, lineHeight: 1.78, fontWeight: 300,
          color: 'oklch(0.22 0.04 60)',
          display: 'flex', flexDirection: 'column', gap: 22,
          animationDelay: '0.25s'
        }}>
          <p style={{ margin: 0 }}>
            My name is Harrison. I grew up in Sydney, Australia. I live in Tokyo, Japan now. I run growth for an Australian startup expanding into Japan.
          </p>
          <p style={{ margin: 0 }}>
            I am hyper-curious, hyper-critical and hyper in general. I am as neurotic as I am ambitious, and have as much confusion as I do unbounded conviction. This website is a long overdue foray into the rare intersections of unhinged and thoughtful analysis, reflections, plans and lessons that I ruminate and attempt to implement in my daily life.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ margin: 0 }}>Recently what I have been sitting on:</p>
            <ul style={{
              margin: 0, paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 8,
              listStyle: 'disc', color: 'oklch(0.28 0.04 60)'
            }}>
              <li>What building a career (especially in growth) looks like in an AI world where the bar keeps moving.</li>
              <li>How to build a compounding career through calculated risk.</li>
              <li>How to live an intentional life in a world full of comparison and societal pressure.</li>
              <li>The range of experiences that lead to fulfilment, across relationships, growth and creativity.</li>
            </ul>
          </div>
          <p style={{ margin: 0, color: 'oklch(0.32 0.04 60)' }}>
            This page is a stream of semi-formed consciousness. Liquid thoughts before they have solidified. Mostly strange, sometimes interesting views on the world from the surface to the depths of my mind.
          </p>
        </div>

        {/* Sign-off */}
        <div className="f-display" style={{
          marginTop: 12, fontSize: 24, fontWeight: 300, fontStyle: 'italic',
          color: cyanAccent, letterSpacing: '-0.01em',
          animationDelay: '0.4s'
        }}>
          — Harry
        </div>
      </article>
    </div>);

}

/* ─────────────────── ROOT ─────────────────── */

// Subtle paper/grain texture overlay applied to layer backgrounds.
function PaperTexture({ opacity = 0.5, scale = 1 }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.05 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
      backgroundSize: `${200 * scale}px ${200 * scale}px`,
      mixBlendMode: 'multiply', opacity, zIndex: 0
    }} />);

}

// Cursor follower — soft glow that pulses behind the pointer. Active across
// the whole site; tinted with the accent.
function CursorGlow({ accent }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;if (!el) return;
    let x = window.innerWidth / 2,y = window.innerHeight / 2;
    let tx = x,ty = y,raf;
    const move = (e) => {tx = e.clientX;ty = e.clientY;};
    const loop = () => {
      x += (tx - x) * 0.12;y += (ty - y) * 0.12;
      el.style.transform = `translate3d(${x - 180}px, ${y - 180}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener('mousemove', move);
    loop();
    return () => {window.removeEventListener('mousemove', move);cancelAnimationFrame(raf);};
  }, []);
  return (
    <div ref={ref} style={{
      position: 'fixed', top: 0, left: 0, width: 360, height: 360, pointerEvents: 'none',
      background: `radial-gradient(circle, ${accent} 0%, transparent 60%)`,
      opacity: 0.10, mixBlendMode: 'multiply', zIndex: 9999,
      transition: 'opacity 0.4s'
    }} />);

}

// Scroll-driven darken overlay — the further you scroll within a layer,
// the deeper the shade gets. Uses scroll position of nearest scroll container.
function ScrollDarken() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;if (!el) return;
    const onScroll = () => {
      const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const t = Math.min(window.scrollY / max, 1);
      el.style.opacity = (t * 0.5).toFixed(3);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div ref={ref} style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 50,
      background: 'linear-gradient(180deg, transparent 0%, oklch(0.20 0.05 235 / 0.4) 60%, oklch(0.12 0.05 240 / 0.7) 100%)',
      opacity: 0
    }} />);

}

function DirectionV2({ tweaks, memos, memoContent }) {
  const [entered, setEntered] = useState(false);
  const [active, setActive] = useState('surface');
  const [transitioning, setTrans] = useState(false);
  const [openMemo, setOpenMemoState] = useState(null);
  // memos: list of frontmatter for the Currents feed (sorted newest-first).
  // memoContent: { [id]: { tag, title, subtitle, cats, readTime, displayDate, contentHtml } }
  // Both are passed in from getStaticProps in pages/index.js. Falls back to
  // hardcoded memos_v2 (and Memo1..Memo8 components) so component still works
  // if rendered without props (e.g. for previews / tests).
  const memoList = (memos && memos.length) ? memos : memos_v2;
  const memoMap = memoContent || null;

  // Wrap setOpenMemo to also update the browser URL via history.pushState.
  // Opens modal → URL becomes /posts/<slug> (shareable, trackable).
  // Closes modal → URL restored to /.
  // No page reload — same React tree, just a URL update.
  const setOpenMemo = (id) => {
    setOpenMemoState(id);
    if (typeof window === 'undefined') return;
    if (id == null) {
      window.history.pushState({ memoId: null }, '', '/');
      return;
    }
    const memo = memoList.find(m => m.id === id);
    const slug = memo && memo.slug;
    if (slug) {
      window.history.pushState({ memoId: id }, '', '/posts/' + slug);
    }
  };

  // Browser back/forward keeps modal in sync with the URL.
  useEffect(() => {
    const onPopState = (e) => {
      const id = (e.state && e.state.memoId) ? e.state.memoId : null;
      setOpenMemoState(id);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Update browser tab title when a memo is open — so the title in the tab
  // and any link previews show the article, not just "Harry Lee — Tidal".
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (openMemo == null) {
      document.title = 'Harry Lee — Tidal';
      return;
    }
    const memo = memoList.find(m => m.id === openMemo);
    if (memo && memo.title) {
      document.title = memo.title + ' — Harry Lee';
    }
  }, [openMemo, memoList]);
  const accent = tweaks.accent || 'oklch(0.55 0.10 215)';
  // Separate "cyan glow" used for memo titles + italic emphasis phrases.
  // Defaults match the prior hardcoded teal so behaviour is unchanged when
  // the slider is at default.
  const cyan = tweaks.cyanAccent || 'oklch(0.46 0.14 200)';

  // When layer changes, fade out + slide downward (diving) then in.
  const switchLayer = (next) => {
    if (next === active) return;
    setTrans(true);
    setTimeout(() => {setActive(next);window.scrollTo({ top: 0, behavior: 'instant' });}, 280);
    setTimeout(() => setTrans(false), 320);
  };

  if (!entered) return <EntryV2 onEnter={() => setEntered(true)} accent={accent} />;

  // Palette flows: Ripples bottom (floor) = Currents wave-divider start =
  // Deep wave-divider start. So each layer transition is a single hue.
  // Hierarchy: light → dark across layers.
  // Ripples floor → Currents top → Depths top → About all share boundary hues
  // so wave dividers don't introduce hue jumps.
  const layerBg = {
    surface: 'oklch(0.97 0.012 90)',
    currents: 'oklch(0.34 0.06 232)', // mid-ocean blue (top)
    deep: 'oklch(0.16 0.05 242)', // deep navy (top)
    about: 'oklch(0.95 0.025 85)' // sun-warm cream (lightest, top of stack)
  };
  const ripplesFloor = 'oklch(0.34 0.06 232)'; // = Currents top
  const currentsFloor = 'oklch(0.30 0.058 234)'; // = Currents bottom = Depths divider start

  // Decide direction of dive based on layer order. Going deeper = slide down.
  const order = ['surface', 'currents', 'deep', 'about'];
  const goingDeeper = order.indexOf(active) <= order.indexOf(active);

  return (
    <div style={{ display: 'flex', minHeight: '100%', background: 'oklch(0.97 0.008 95)', position: 'relative' }}>
      {tweaks.cursorGlow && active === 'surface' && <CursorGlow accent={accent} />}
      <ScrollDarken />
      <SideNav active={active} onChange={switchLayer} onHome={() => setEntered(false)} accent={accent} />
      <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div key={active} style={{
          opacity: transitioning ? 0 : 1,
          transform: transitioning ? 'translateY(40px)' : 'translateY(0)',
          transition: 'opacity 0.45s ease, transform 0.55s cubic-bezier(0.2,0.7,0.3,1)',
          animation: transitioning ? undefined : 'dive 0.7s cubic-bezier(0.2,0.7,0.3,1) both'
        }}>
          {active === 'surface' && (
          <SurfaceLayer accent={accent} tweaks={tweaks.surface || {}} />)
          }
          {active === 'currents' &&
          <>
              <WaveDivider from={ripplesFloor} to={layerBg.currents} accent={accent} height={120} />
              <CurrentsLayer accent={accent} cyan={cyan} onOpenMemo={setOpenMemo} memos={memoList} />
            </>
          }
          {active === 'deep' &&
          <>
              <WaveDivider from={currentsFloor} to={layerBg.deep} accent={accent} height={120} />
              <DarkOceanLayer accent={accent} cyan={cyan} />
            </>
          }
          {active === 'about' &&
          <>
              <WaveDivider
                from={layerBg.deep}
                to="oklch(0.92 0.06 70)"
                accent="oklch(0.78 0.12 55)"
                height={160} />
              <AboutLayer accent={accent} cyan={cyan} />
            </>
          }
        </div>

        {openMemo !== null && (
          // Ocean reading mode (Q1 = D / Q3 = stacked emphasis): deep navy
          // background, generous max-width (880px), light typography defined
          // in globals.css via .memo-body.ocean-mode.
          <div onClick={() => setOpenMemo(null)} style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'linear-gradient(180deg, oklch(0.16 0.05 242) 0%, oklch(0.10 0.04 246) 100%)',
            overflowY: 'auto',
            animation: 'memoFadeIn 0.4s ease-out'
          }}>
            <div onClick={e => e.stopPropagation()} style={{
              maxWidth: 880, margin: '0 auto', padding: '64px 48px 120px',
            }}>
              <button onClick={() => setOpenMemo(null)} className="eyebrow" style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'oklch(0.74 0.10 210)', marginBottom: 48,
                padding: 0, fontSize: 11, letterSpacing: '0.18em', fontWeight: 500
              }}>← Back to Currents</button>
              {memoMap && memoMap[openMemo]
                ? <MarkdownMemo data={memoMap[openMemo]} />
                : (
                  <>
                    {openMemo === 1 && <Memo1 />}
                    {openMemo === 2 && <Memo2 />}
                    {openMemo === 3 && <Memo3 />}
                    {openMemo === 4 && <Memo4 />}
                    {openMemo === 5 && <Memo5 />}
                    {openMemo === 6 && <Memo6 />}
                    {openMemo === 7 && <Memo7 />}
                    {openMemo === 8 && <Memo8 />}
                  </>
                )
              }
            </div>
            <style>{`@keyframes memoFadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
          </div>
        )}
      </main>
      <style>{`
        @keyframes dive {
          0%   { opacity: 0; transform: translateY(40px); filter: blur(6px); }
          60%  { opacity: 1; filter: blur(0); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes float-soft {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes glow-pulse {
          0%,100% { box-shadow: 0 0 0 0 var(--glow, oklch(0.84 0.12 200 / 0)); }
          50% { box-shadow: 0 0 22px 0 var(--glow, oklch(0.84 0.12 200 / 0.4)); }
        }
      `}</style>
    </div>);

}



// ─── Memo display components ──────────────────────────────────────────────
// MemoHeader renders the tag/title/subtitle/meta block above each article.
// `mode` prop themes the colors: 'ocean' (default, deep navy reading) or 'cream'.
function MemoHeader({ tag, title, subtitle, date, readTime, categories, mode = 'ocean' }) {
  const palette = mode === 'ocean'
    ? {
        tag:      'oklch(0.74 0.16 200)',           // bright cyan accent
        title:    'oklch(0.96 0.014 200)',          // near-white
        subtitle: 'oklch(0.78 0.025 210 / 0.88)',
        meta:     'oklch(0.74 0.04 215)',
      }
    : {
        tag:      'oklch(0.46 0.14 200)',
        title:    'oklch(0.16 0.04 235)',
        subtitle: 'oklch(0.34 0.05 230)',
        meta:     'oklch(0.45 0.04 220)',
      };

  return (
    <div className="grid grid-cols-12 gap-6 mb-16">
      <div className="col-span-12 md:col-span-9 md:col-start-2">
        <p className="heading-sans text-xs mb-6" style={{
          color: palette.tag, letterSpacing: '0.18em', textTransform: 'uppercase', fontSize: 11, fontWeight: 500
        }}>{tag}</p>
        <h1 className="heading-sans mb-6" style={{
          fontFamily: 'Fraunces, Georgia, serif',
          fontSize: 'clamp(2.2rem, 4.4vw, 3.4rem)',
          fontWeight: 300,
          lineHeight: 1.08,
          letterSpacing: '-0.025em',
          color: palette.title,
        }}>
          {title}
        </h1>
        <p className="body-serif" style={{
          fontSize: '1.25rem', lineHeight: 1.5, color: palette.subtitle,
          fontStyle: 'italic', fontWeight: 300
        }}>
          {subtitle}
        </p>
        <div className="flex items-center gap-6 mt-10 flex-wrap">
          <span className="tag-pill" style={{ color: palette.meta }}>{date}</span>
          <span className="tag-pill" style={{ color: palette.meta, opacity: 0.7 }}>{readTime}</span>
          {categories && categories.map(c => (<span key={c} className="tag-chip">{c}</span>))}
        </div>
      </div>
    </div>
  );
}

function MemoBody({ children, mode = 'ocean' }) {
  // mode: 'ocean' (deep navy reading mode, default) | 'cream' (legacy editorial)
  const modeClass = mode === 'ocean' ? 'ocean-mode' : '';
  return (
    <div className="grid grid-cols-12 gap-6">
      <div className={`col-span-12 md:col-span-9 md:col-start-2 memo-body ${modeClass}`}>{children}</div>
    </div>
  );
}

// Renders a memo loaded from a markdown file.
// `data` shape: { tag, title, subtitle, cats, readTime, displayDate, contentHtml }
// `mode` prop ('ocean' default, or 'cream') passed to MemoHeader + MemoBody.
function MarkdownMemo({ data, mode = 'ocean' }) {
  if (!data) return null;
  return (
    <article>
      <MemoHeader
        tag={data.tag}
        title={data.title}
        subtitle={data.subtitle}
        date={data.displayDate}
        readTime={data.readTime}
        categories={data.cats}
        mode={mode}
      />
      <MemoBody mode={mode}>
        <div dangerouslySetInnerHTML={{ __html: data.contentHtml || '' }} />
      </MemoBody>
    </article>
  );
}

function Memo1() {
  return (
    <article>
      <MemoHeader tag="Note 01" title="Why being lost is an advantage in the age of AI"
        subtitle="On AI, restless minds, and the half of thinking that consulting forgets"
        date="April 2026" readTime="4 min read" categories={['Careers', 'AI']} />
      <MemoBody>
        <p className="lede">I came to AI late. While most people were figuring out how to cheat on homework with GPT-3.5, I was on a year and a half away from screens. Skating. Travelling. Learning Japanese. Recovering from burnout, in the way you have to recover from burnout, which is by getting away from the thing that broke you in the first place.</p>
        <p>By the time I came back, the cheating-on-homework era was over. My first real use of AI was at a top consulting firm, thrown into the deep end with no warm-up.</p>
        <p>Consulting at that level is not a place where you get to learn things slowly. Managers are busy. Projects are intense. The only sustainable way to survive is to self-solve, fast, across a range of problems that changes day to day. So I used AI the way you use a survival tool. Not curiosity. Necessity. A new domain on Monday, a new framework on Tuesday, a new analysis on Wednesday. None of them familiar. All of them due that night.</p>
        <p>What that produced was an intuition I could not have built any other way. Not from playing. From needing the thing to work, at speed, on real stakes, across an absurd range of use cases.</p>
        <h3>The realisation</h3>
        <p>The deeper realisation came later. AI worked for me because of how I think, not despite it. The way my brain wants to run, which is wide and fast and restless and jumping between contexts, was exactly what got rewarded by the conditions I was working in. Conventional advice would have called that a problem to manage. The pace of the work made it the only viable mode.</p>
        <div className="pull-quote">The MBB world prizes convergence. Pyramid principle. Drive to the answer. That is not wrong. It is incomplete.</div>
        <p>Convergence without divergence sounds tidier but it produces a narrower set of possible answers. You converge on the best version of what you already considered. You miss the version you never thought to consider. The frame you never tested. The angle that would have changed the recommendation.</p>
        <p>AI restores the missing half. Cheaply, and at speed. For people who could never sit still long enough to systematise their own divergence, it closes a loop that was open their whole career.</p>
        <h3>The advice that no longer applies</h3>
        <p>The conventional career advice for people whose brains do not sit still is: pick a lane, narrow your focus, learn discipline. That advice was built for a world where divergence was expensive and convergence was the bottleneck. AI flips both. Divergence is cheap now. Capturing it is what is hard. And capturing it is exactly what the restless mind could never do alone.</p>
        <p>If you have been told your whole career to slow down and pick a lane, you probably do not need to slow down. You need a system that can keep up with you.</p>
        <div className="pull-quote">For people structurally unsuited to "pick a lane and go deep," that system finally exists.</div>
        <p>The trait was always the asset. The infrastructure around it was missing. That is the part that is new.</p>
      </MemoBody>
    </article>
  );
}

function Memo2() {
  return (
    <article>
      <MemoHeader tag="Note 02" title="Stop the lane wars"
        subtitle="The generalist vs specialist argument is dead. Both sides are missing what actually changed."
        date="April 2026" readTime="4 min read" categories={['Careers', 'AI']} />
      <MemoBody>
        <p className="lede">Every six months the generalist vs specialist debate gets relitigated. It is the wrong debate. Businesses have always needed a mix of both, calibrated to use case. AI does not change that.</p>
        <p>What AI changes is the bar. The required depth in any specialism. The required breadth in any generalism. Both are higher than they were two years ago, and both are still rising.</p>
        <p>Picture the standard 2x2. Generalist breadth on one axis, specialist depth on the other. AI pushes both axes outward. The same job title now demands more of both dimensions to remain economically valuable.</p>
        <h3>What this looks like in practice</h3>
        <p>Run it through specific roles and the shift gets concrete:</p>
        <ul>
          <li><strong>Performance marketers.</strong> The bar moved from running paid media well, to running paid media and reading CRO data and directing creative and building measurement.</li>
          <li><strong>Engineers.</strong> The bar moved from shipping features, to shipping features and architecting with AI assistance and reviewing AI-generated code with judgment.</li>
          <li><strong>Designers.</strong> The bar moved from producing good output, to producing good output and directing AI tooling and holding taste at scale.</li>
        </ul>
        <p>The shallow generalist was always fragile. They are now actively exposed, because AI is better at shallow breadth than humans.</p>
        <p>The pure specialist is fine, but only if their depth has risen with the bar. Specialists running on 2022 depth are losing leverage they do not realise they had.</p>
        <h3>Same destination, different routes</h3>
        <p>Both lanes converge on the same outcome: clearing the new bar. How you get there is shaped by your personality and your starting point. Generalists by nature should use AI to deepen faster than they could before. Specialists by nature should use AI to broaden faster than they could before. The path differs. The bar does not.</p>
        <div className="pull-quote">Forcing yourself into an archetype you are not is the third failure mode. The natural generalist trying to become a specialist for credibility. The natural specialist trying to become a generalist for optionality. Both lose the speed advantage their actual cognition gave them.</div>
        <p>The dumbest move is the one most people are making. Declaring the other side dead. Calling yourself the surviving type. And not actually working on either dimension. Generalists telling themselves specialists are obsolete. Specialists telling themselves generalists are shallow. Both staying exactly where they were in 2022.</p>
        <h3>The actual work</h3>
        <p>Pick your starting lane based on how you actually think, not how you wish you thought. Use AI to clear the new bar in that lane faster than you could before. The lane is real. The lane war is fake. And the bar is moving whether you are ready for it or not.</p>
        <p>If you are hiring against a job spec written in 2022, you are going to over-hire on credentials and under-hire on leverage. The slope of the curve is what changed. Most specs have not caught up.</p>
      </MemoBody>
    </article>
  );
}

function Memo3() {
  return (
    <article>
      <MemoHeader tag="Note 03" title="The speed-taste tradeoff"
        subtitle="Where AI creative actually wins, and where it cannot"
        date="April 2026" readTime="5 min read" categories={['Marketing', 'AI']} />
      <MemoBody>
        <p className="lede">The AI creative discourse has settled into two camps. AI will replace creative teams. Or AI slop will collapse engagement and we should retreat to human craft. Both are wrong because they are arguing about the wrong axis.</p>
        <p>The actual question is where on the speed-vs-taste curve a given piece of creative should sit. The answer changes by funnel stage, by brand positioning, and by business size. There is no single right answer for a marketing team. There is only a right answer for a specific decision.</p>
        <h3>Two metrics are diverging</h3>
        <p>Engagement rates on AI-generated creative are softening. Hook rates, video view-through, CTR. That is real, and it is accelerating. But conversion rates on templated, tested formats are holding, and in many cases improving, because AI lets one person produce ten variants where they used to produce one. The funnel further down is fine. The teams panicking about AI creative are looking at one metric and missing it.</p>
        <div className="ascii-chart">{`     Indexed performance, last 12 months

  ▲
  │  ╲
  │   ╲╱╲                                          Engagement
  │      ╲╲                                        (CTR, hook rate)
  │        ╲╲╱╲
  │            ╲╲╲___
  │                  ╲╲___
  │
  │       _________________________  Conversion
  │  ___╱╱                            (CVR, ROAS, CPA)
  │
  └────────────────────────────────────────────────▶
     M1   M3   M5   M7   M9   M11   today`}</div>
        <p className="ascii-caption">[chart: two-line divergence. Engagement metrics trending down. Conversion metrics flat or up. The AI discourse is reading the wrong line.]</p>
        <h3>Where AI creative wins</h3>
        <p>Anything with a repeatable, replicable format. The structure carries most of the persuasion. Variation just needs to be relevant.</p>
        <ul>
          <li>Discount mechanics. Urgency. Comparison ads. Before-after. Problem-solution. Proof-point ads with rotating data.</li>
          <li>Lo-fi statics. Scripted UGC reads. Anything you could brief in a sentence and produce a hundred versions of without losing the point.</li>
        </ul>
        <p>A Mounjaro 5mg lo-fi run earlier this year collapsed our CAC in a week. The format was tested. The variation was AI-fast. It worked because we were not asking AI to be original. We were asking it to be relentless inside a known frame.</p>
        <h3>Where AI creative cannot go</h3>
        <p>The work that requires a point of view. Breakthrough hooks. Virality. Mid-funnel emotional connection. Trust at the brand level. The visceral reaction that makes someone remember a brand a week later.</p>
        <p>These outcomes need taste, and taste is exactly what AI reverts to the mean on. The more premium the brand, the more this matters. The more saturated the category, the more this matters. The more your edge depends on people feeling something specific about you, the more it matters.</p>
        <h3>The framework: speed-taste matrix</h3>
        <p>Map two axes. Funnel stage on one. Brand positioning on the other. The right mix of AI and human craft is different in every cell.</p>
        <div className="ascii-chart">{`                    AI suitability matrix

                    PREMIUM     MAINSTREAM     VALUE
                  ┌─────────────────────────────────────┐
       TOP        │  ░░░░░░░  │  ░░░░░░░░  │  ▒▒▒▒▒▒▒  │
       FUNNEL    │  taste-led │  taste-led │  mixed    │
                  ├─────────────────────────────────────┤
       MID        │  ░░░░░░░░ │  ▒▒▒▒▒▒▒▒  │  ▓▓▓▓▓▓▓  │
       FUNNEL    │  taste-led │  mixed     │  AI-led   │
                  ├─────────────────────────────────────┤
       BOTTOM     │  ▒▒▒▒▒▒▒  │  ▓▓▓▓▓▓▓▓  │  ████████ │
       FUNNEL    │  mixed     │  AI-led    │  AI-heavy │
                  └─────────────────────────────────────┘
              ░ low AI suitability    █ high AI suitability`}</div>
        <p className="ascii-caption">[matrix: 3x3 grid. Bottom-funnel × value = highest AI suitability. Top-funnel × premium = lowest. The middle is where most teams sit and where most teams lose.]</p>
        <h3>The metrics that should sit under each cell</h3>
        <ul>
          <li><strong>Bottom-funnel templated work.</strong> CPA, ROAS, CVR. Volume and iteration count matter. AI wins.</li>
          <li><strong>Mid-funnel work.</strong> Brand recall lift, engaged view-through, assisted conversion. Mixed. AI helps with variation. Humans set direction.</li>
          <li><strong>Top-funnel breakthrough.</strong> Organic share rate, branded search lift, qualitative resonance. Human-led.</li>
        </ul>
        <p>The teams winning right now run a heavy-on-both-ends shape. Volume of AI-templated work at the bottom of the funnel. A small number of human-led hero pieces at the top to anchor the brand. The thing that hollows out is the middle. Mid-quality, mid-effort, mid-distinctive output. Generic enough that AI could do it. Slow enough that AI is doing it faster. Neither speed wins nor taste wins.</p>
        <div className="pull-quote">The hard part is not picking the mix. It is keeping the learning loop fast enough to compound while still holding a point of view distinct enough to not regress to the AI mean. Taste at the prompt level, not the asset level.</div>
        <h3>The question worth asking</h3>
        <p>The question worth asking your team is not whether AI replaces creatives. It is which creative decisions you are willing to template, and which ones you would defend with your career. The second answer is the part of your team that needs to get sharper, not smaller.</p>
      </MemoBody>
    </article>
  );
}

function Memo4() {
  return (
    <article>
      <MemoHeader tag="Note 04" title="Speed to learning is the only metric that matters"
        subtitle="On why output and efficiency are the wrong outcomes for AI in marketing"
        date="April 2026" readTime="4 min read" categories={['Marketing', 'AI']} />
      <MemoBody>
        <p className="lede">Most marketing teams are measuring AI transformation with the wrong metrics. They count assets shipped. Hours saved. Cost per output. Both framings miss the point entirely.</p>
        <p>Output and efficiency are not outcomes. They are symptoms of something deeper, or methods that produce something else. Treating them as goals is procurement dressed as strategy.</p>
        <p>The actual outcome is speed to learning. The consequence is faster, higher-quality business decisions. That is the thing AI changes when it is working. Everything else is a side effect.</p>
        <h3>What I learned scaling a DTC brand</h3>
        <p>Running performance and creative at Juniper Japan over the last year reframed how I think about this. The wins that mattered were not the ones where AI made the team produce more. They were the ones where AI compressed the time between forming a hypothesis and knowing whether it was right.</p>
        <p>A specific week earlier this year is the cleanest example. Multiple things landed in seven days. A price drop on Mounjaro 5mg. A new squeeze page on Google. A lo-fi static creative refresh on Meta. A fold reduction on the landing page. Each of those individually was a hypothesis. CAC fell from ¥107K to ¥43K in a week.</p>
        <p>The reason they compounded into that result was not that AI made any one of them faster to produce. It was that the entire feedback loop, from diagnose to hypothesise to build to ship to read to decide, collapsed from weeks to days. We were not producing more assets. We were producing more learning.</p>
        <div className="pull-quote">When I look at what changed, it was not the tooling. It was the length of the loop.</div>
        <h3>Why output and efficiency are the wrong outcomes</h3>
        <p>Output and efficiency are easy to measure, which is why they get adopted as KPIs. Measuring them as outcomes creates two failure modes.</p>
        <p><strong>Output as outcome</strong> rewards volume regardless of whether the volume is generating learning. Teams produce more creative, more emails, more landing pages, and learn nothing faster than before, because the loop was never the bottleneck. Decision velocity was.</p>
        <p><strong>Efficiency as outcome</strong> rewards cost reduction, which in a growth function is almost always the wrong objective. A marketing team running at fifty percent lower cost but the same learning rate has not transformed. It got cheaper.</p>
        <p>Both framings treat AI as a tool for doing the same thing more cheaply. That is not transformation. That is procurement.</p>
        <h3>The metrics that actually matter</h3>
        <p>A team that has properly absorbed AI shows it in four places, none of them about output:</p>
        <ul>
          <li><strong>Hypothesis cycle time.</strong> Idea to validated learning. Should compress 3-10x.</li>
          <li><strong>Decision throughput.</strong> Meaningful business decisions per week, without quality loss.</li>
          <li><strong>Kill speed.</strong> How fast bad bets get shut down.</li>
          <li><strong>Compounding institutional knowledge.</strong> Whether each loop leaves a trail the next loop can stand on.</li>
        </ul>
        <p>None of these are output metrics. None are efficiency metrics. They are properties of the learning system itself.</p>
        <h3>The ambition gap</h3>
        <p>The reason most AI transformation programmes underwhelm is that they are scoped against the wrong outcome. "We will save forty hours a week" is a procurement pitch dressed up as transformation. "We will cut our hypothesis cycle from three weeks to three days and double the number of validated business bets we make per quarter" is transformation.</p>
        <div className="pull-quote">If your AI strategy reads like a list of efficiencies, you have built a cost-cutting plan. If it reads like a redesign of how decisions get made and how fast learning compounds, you have built a competitive advantage. Most plans are the first thing wearing the second thing's clothes.</div>
        <p>Pick the second one. The first one is what every other team is doing, and being marginally cheaper than them is not a strategy.</p>
      </MemoBody>
    </article>
  );
}

function Memo5() {
  return (
    <article>
      <MemoHeader tag="Note 05" title="The rise of the IC manager"
        subtitle="Why AI is squeezing the middle of the org chart, not the bottom"
        date="April 2026" readTime="5 min read" categories={['Business', 'AI']} />
      <MemoBody>
        <p className="lede">The dominant fear about AI in knowledge work is that it eats the bottom of the org chart. Juniors out, entry-level roles hollowed, the grunt work absorbed first. It is a tidy story, and it is looking at the wrong layer. The real squeeze is happening higher up, and most middle managers have not noticed yet.</p>
        <p>The middle layer is getting compressed, but not because managers do not matter. The part of the manager job that AI most easily absorbs is exactly the part that bloated the middle in the first place. Status reporting. Project coordination. Information relay. The work that exists because information moves slowly through a hierarchy. Strip that out and you do not lose management. You lose a layer of management that was mostly translation.</p>
        <p>The compression is structural. AI does not just shrink roles and skill sets. It shrinks the hierarchy itself. Decisions that used to need three layers of context-passing can now happen in a single conversation. That is the change worth naming, and it is doing more work than most of the discussion gives it credit for.</p>
        <h3>A quick look back</h3>
        <p>Some history is worth holding in mind. The 1980s and 90s saw waves of delayering, driven by cost. The 2000s and 2010s rebuilt the middle as companies scaled and complexity returned. What is happening now is the third turn of that cycle, but the forcing function is different. It is not cost this time. It is speed. Decisions need to move faster than a hierarchy can carry them, and the layers that exist primarily to move information are the first to look expensive.</p>
        <h3>What replaces the pure manager</h3>
        <p>What replaces the pure manager is the IC manager. Someone who can swap between managing and doing without it feeling like a regression. Someone who refines their craft alongside their team rather than above it. Someone who stays close enough to the details that their strategic calls are grounded in real texture, not in summaries that have been polished three times before reaching them.</p>
        <p>The IC manager does not have to be better than their team at any specific craft. They have to be good enough to make high-quality judgment calls on the fine details. Good enough that when they push back on a piece of work, the pushback lands. Good enough that the strategy they shape is informed by the actual shape of the customer experience, the internal workflow, the small pain points that never make it into a status update because they are too granular to bother reporting.</p>
        <h3>Who is exposed</h3>
        <p>The exposed archetype is the pure strategic thinker. The manager who talks well, frames things well, says a lot of things in meetings, and never touches the work. Corporate inertia protected this role for a long time, partly because the information advantage that came from sitting in many meetings and synthesising across them was real. That advantage is now available to anyone with a transcript and a model. The pure strategic thinker who never touches the craft is going to find their unique value harder to point to than it used to be.</p>
        <div className="pull-quote">The information advantage that came from sitting in meetings and synthesising is now available to anyone with a transcript and a model.</div>
        <h3>The reframe on "lower leverage" work</h3>
        <p>The conventional view is that managers should delegate execution and focus on leverage. The IC manager view is that staying close to the texture is the source of the leverage. The work that gets called "lower leverage" — the hands-on building, the actual customer call, the specific piece of copy — is in fact the input to the high-leverage decisions. Strip it out and the decisions get worse, not because the manager is unintelligent, but because they are working off a flattened picture.</p>
        <p>The best managers in the next three years will be the ones who can drop into the work, ship something themselves, and come back up to the strategic altitude with a sharper view. Not because doing the work is romantic. Because the calibration loop is what makes the judgment trustworthy.</p>
        <h3>The implication for how to design teams</h3>
        <p>Fewer layers. More IC managers. A lot less tolerance for roles that exist primarily to translate between layers. The manager who survives the next three years is the one who is also building. The one who is only directing is being outpaced by the one who is doing both, and the gap is going to widen rather than narrow.</p>
        <div className="pull-quote">The manager who survives the next three years is the one who is also building.</div>
        <p>If you are designing a team right now and your org chart has a middle layer that exists to relay information between strategy and execution, that layer is borrowed time. If you are managing right now and you have not touched the work in a year, that is a flag worth taking seriously. Not as a sign of failure, but as a sign that the role you are in was designed for a different speed of decision-making than the one that is coming.</p>
      </MemoBody>
    </article>
  );
}

function Memo6() {
  return (
    <article>
      <MemoHeader tag="Note 06" title="POST-AI"
        subtitle="The six traits recruiters should actually hire for in an AI-native world"
        date="April 2026" readTime="6 min read" categories={['Business', 'Careers', 'AI']} />
      <MemoBody>
        <p className="lede">Every job description in 2026 says "AI-native." Almost none of them define it. The hiring market is full of vague language, vibes-based interviews, and rubrics that test for tool fluency instead of judgment. AI-native, as it stands today, is theatre. People know they should want it. They cannot describe what it is.</p>
        <p>The lazy version of the answer is "they use ChatGPT well." That is a symptom, not a trait. Tools change every six months. The traits that actually predict whether someone thrives in a post-AI environment are stable across whatever the next tool is. They sit underneath the tools. They are the things you should be looking for in a candidate, in a trial, in a reference check, in your own people.</p>
        <p>There are six. They spell POST-AI. The acronym is a memory aid. The six traits are the rubric that should sit underneath every "AI-native" job description in the world right now, and almost never does.</p>

        <h3>The framework, at a glance</h3>
        <div className="framework-grid">
          <div className="framework-card">
            <div className="framework-letter">P</div>
            <div className="framework-name">Prioritisation</div>
            <div className="framework-desc">Choosing what matters when you can do anything.</div>
          </div>
          <div className="framework-card">
            <div className="framework-letter">O</div>
            <div className="framework-name">Ownership</div>
            <div className="framework-desc">Holding outcomes through complexity AI cannot yet carry.</div>
          </div>
          <div className="framework-card">
            <div className="framework-letter">S</div>
            <div className="framework-name">Systems</div>
            <div className="framework-desc">Designing workflows that compound, not just doing tasks.</div>
          </div>
          <div className="framework-card">
            <div className="framework-letter">T</div>
            <div className="framework-name">Taste</div>
            <div className="framework-desc">Knowing what is good when generation is free.</div>
          </div>
          <div className="framework-card">
            <div className="framework-letter">A</div>
            <div className="framework-name">Alignment</div>
            <div className="framework-desc">Trust, relationships, and the ability to move information cleanly.</div>
          </div>
          <div className="framework-card">
            <div className="framework-letter">I</div>
            <div className="framework-name">Insight</div>
            <div className="framework-desc">The sharpness of the inputs that go into the decision.</div>
          </div>
        </div>
        <p>The deep version of each, below.</p>

        <h3>P — Prioritisation</h3>
        <p>When the cost of doing anything has collapsed, the cost of doing the wrong thing has not. The constraint shifts from execution to selection. The trait worth hiring for is the ability to ruthlessly choose what matters out of what is possible, and to be willing to drop a lot of things that look attractive to get there.</p>
        <p>This is harder than it sounds. Most people are good at adding to a roadmap. Very few are good at cutting one in half and defending the cut. The candidate who can do that is the candidate you want.</p>

        <h3>O — Ownership</h3>
        <p>AI can execute almost any task. It cannot yet own an outcome through complexity, cross-functional handoffs, edge cases, and downstream consequences. The trait worth hiring for is the willingness to take a thing end to end. Fix it when it breaks. Notice the small things upstream and downstream. Hold the result, including the parts that fall outside whatever the original brief said.</p>
        <p>The exposed candidate here is the one who shipped their portion of the project and pointed at someone else for everything that came after. AI makes that person less useful, not more, because the seams between functions are where the real failures happen.</p>

        <h3>S — Systems</h3>
        <p>The shift from doing tasks to designing systems that do tasks. Workflows that self-reinforce. Learning loops that compound. The ability to look at a function, redesign it as a system that orchestrates agents and humans, and then supervise the system rather than the work. This was always a senior trait. AI makes it a baseline trait, even at junior levels, because the alternative is being the person AI replaces task by task.</p>

        <h3>T — Taste</h3>
        <p>When generation is free, the bottleneck moves to judgment of what is good. What is distinct. What is worth keeping. Taste is the most under-discussed of the six because it is the hardest to test for, but it is the trait that prevents an organisation from drowning in its own output.</p>
        <p>You cannot teach taste in an interview. You can test for it. Show three pieces of work. Ask the candidate which is best and why. The reasoning matters more than the choice.</p>

        <h3>A — Alignment</h3>
        <p>Trust is the spine of this one. The ability to build durable, trusted relationships that move information faster than any tool, sharpen decisions through honest pushback, and pull people toward what actually matters. AI raises the noise floor on every channel. Alignment is what cuts through it. The person who has earned trust across functions makes better decisions and gets better information than the person who has not, regardless of how good their tools are.</p>
        <div className="pull-quote">AI raises the noise floor on every channel. Alignment is what cuts through it.</div>
        <p>This is the trait recruiters under-test for, because it does not show up on a CV and it is awkward to ask about directly. The proxy is reference checks done seriously. Not "would you hire them again." Specific questions, with people who worked cross-functionally with the candidate, about how they handled disagreement, surfaced bad news, and earned the trust of people who had no reason to give it.</p>

        <h3>I — Insight</h3>
        <p>The quality of the inputs you bring to the decision. Customer feedback. Patient research. The texture of the actual problem. AI does not improve the quality of inputs. It compounds whatever you put in. The person with sharper insight makes the AI-augmented decision better. The person without it makes faster bad decisions.</p>
        <p>Insight is what separates the operator who runs ten experiments and learns nothing from the operator who runs three and changes the company. Both moved fast. Only one moved correctly.</p>

        <h3>The thing that is missing, on purpose</h3>
        <p>Speed.</p>
        <p>Everyone wants to hire for speed. Speed is not a trait. It is an outcome. The fast operators in 2026 are fast because they prioritised correctly, owned the work end to end, built systems, applied taste, were aligned with the right people, and had real insight into the problem. Strip any of those out and the speed is just slop, faster.</p>
        <p>Hiring rubrics that optimise on speed and efficiency directly are the fastest way to fill a team with slop cannons. People who ship a lot of mediocre work. People who confuse motion with progress. The trial that asks "how many things can you do in two hours" selects for exactly the wrong thing. The trial that asks "what would you cut and why" selects for the right one.</p>
        <div className="pull-quote">Speed is not a trait. It is an outcome.</div>

        <h3>Different roles weight the six differently</h3>
        <p>No one is hireable on all six. The role decides the priority. A few worth naming.</p>
        <p><strong>Designers and creatives.</strong> Taste leads. Insight close behind. Without taste the role is one AI can already approximate. With taste, plus the ability to direct AI tooling, the role is more leveraged than it has ever been.</p>
        <p><strong>Product managers.</strong> Prioritisation and Ownership lead, by a long way. PMs become more valuable, not less, as engineering speeds up. The cost of building the wrong thing accelerates with execution speed, which means the cost of bad prioritisation accelerates too. The PM who cannot say no is now actively dangerous, in a way they were not when shipping was the bottleneck.</p>
        <p><strong>Engineers.</strong> Systems leads. Ownership close. Taste matters more than people pretend, especially at the senior end. The engineer who can architect for AI-augmented teams, hold the outcome through deployment, and make taste-led calls on what to build is the engineer compounding fastest.</p>
        <p><strong>Marketers and growth operators.</strong> Insight and Taste lead. Systems for anyone running paid media or lifecycle. The marketer who has texture on the customer and the discipline to act on it, paired with the systems mindset to scale what works, is irreplaceable. The marketer who only knows tools is a slop cannon waiting to happen.</p>

        <h3>What this means for how to hire</h3>
        <p>Stop asking "do you use AI" in interviews. The question is theatre and the answer is meaningless. Build trials that test for these six instead.</p>
        <p>Prioritisation looks like asking someone to cut a roadmap in half and defend the cut. Ownership looks like a take-home where the brief is deliberately incomplete and you watch what they do with the gaps. Systems looks like asking how they would redesign a process that currently takes ten people and three weeks. Taste looks like critique. Alignment looks like reference checks taken seriously. Insight looks like asking what they actually know about your customer that you do not.</p>
        <p>Each of these is harder to fake than "show me your prompts." That is the point.</p>

        <h3>What this means for how to be hired</h3>
        <p>Build evidence for the two or three letters that matter most for the role you want. Show the work. The CV that demonstrates two of these well is going to outperform the CV that lists ten AI tools every time. The roles that are hardest to fill in 2026 are not the ones that need the most tool fluency. They are the ones that need the most judgment.</p>
        <p>If you are early in your career and worried that AI is closing doors, the doors that are closing are the ones that opened to people who ticked boxes. The doors opening are the ones that open to people who can demonstrate even one of these six convincingly. The bar is not higher because you need more credentials. It is higher because the credential everyone is reaching for is the wrong one.</p>

        <h3>Closing</h3>
        <p>AI-native, properly defined, is just this. Six traits, weighted by role. Recruiters who can hire for them will fill teams that compound. Recruiters who keep optimising for speed and tool fluency will fill teams with slop cannons.</p>
        <p>The teams that win the next three years are the ones who built the rubric before the language caught up.</p>
      </MemoBody>
    </article>
  );
}

function Memo7() {
  return (
    <article>
      <MemoHeader tag="Note 07" title="After attention"
        subtitle="The three eras of distribution, and why perspective is the only thing that compounds now"
        date="April 2026" readTime="5 min read" categories={['AI', 'Marketing']} />
      <MemoBody>
        <p className="lede">Three times in the last thirty years, the scarce thing shifted. Each time, a different type of person won. The people still running the previous game wondered what happened.</p>
        <p>The third shift is happening now. Most people have not noticed.</p>
        <h3>Three eras, three scarcities</h3>
        <p><strong>Information.</strong> Before the internet, knowledge was scarce. Access was the moat. Institutions controlled the pipes. Credentials were the ticket in. Then information became free and that edge disappeared.</p>
        <p><strong>Attention.</strong> Social media made content abundant. Anyone could publish. The new scarce thing was attention. The people who won were watchable. Follower counts. Virality. Aesthetic consistency. Being right mattered less than being compelling. Volume beat depth.</p>
        <p><strong>Perspective.</strong> AI makes content and creativity abundant at scale. Not just searchable. Generatable. Anyone can produce a carousel, a caption, a thousand words, a UGC script. The volume of output in the world is increasing by an order of magnitude.</p>
        <p>When everything is produceable at average quality, nothing at average quality is scarce.</p>
        <p>What becomes scarce is a genuinely distinct lens. Not an opinion. A way of seeing.</p>
        <h3>The bifurcation</h3>
        <p>Both things will happen at the same time. Most people are only watching one of them.</p>
        <p>The slop layer expands. More content, lower average quality, shorter average lifespan. Templates at scale. Hooks without argument. Engagement ticks. Nothing compounds. Nobody remembers it a week later. The social-era metrics still move, but they move toward nothing.</p>
        <p>Underneath that, something different forms. Perspectives specific enough to find the people who needed exactly that lens. Not mass distribution. Precise distribution. AI-powered search and recommendation routing on specificity and relevance, not on follower counts or domain authority. A personal site with a genuinely original point of view outranking an optimised generic one. A niche take reaching its exact intended pocket faster than a broad take reaches anyone.</p>
        <p>Two games, running in parallel. The slop game gets more crowded and less valuable simultaneously. The perspective game opens up.</p>
        <div className="pull-quote">The social-era playbook confuses activity for compound interest. They are not the same thing.</div>
        <h3>Why the social-era playbook fails here</h3>
        <p>The instinct built in the attention era is to optimise for reach. Hooks. Posting frequency. Engagement loops. That instinct made sense when attention was the scarce resource. It is the wrong move now.</p>
        <p>Perspective does not distribute like content. It compounds differently. A genuine take on a specific problem, written once, will find its intended audience through AI-routed search in a way that a well-formatted generic post never will.</p>
        <p>The question is not how often you post. It is whether the perspective is worth having in the first place.</p>
        <h3>What this means</h3>
        <p>For the first time, original perspective has a structural distribution advantage over optimised reach. No institution required. No follower count. No budget. AI is the first distribution layer that actually routes on the quality of the thinking rather than the size of the audience behind it.</p>
        <p>This is the opening most people are not seeing because they are looking at the slop layer and calling it the whole picture.</p>
        <div className="pull-quote">The bottleneck moved entirely to the thought side. That is both the problem and the opening.</div>
      </MemoBody>
    </article>
  );
}

function Memo8() {
  return (
    <article>
      <MemoHeader tag="Note 08" title="You are not behind"
        subtitle="On intentionality, overreliance, and why being early to AI is not the same as being good at it"
        date="April 2026" readTime="5 min read" categories={['AI', 'Careers']} />
      <MemoBody>
        <p className="lede">The loudest voices telling you that you are behind on AI have something to sell. Urgency converts. Anxiety moves product. The "you are already late" narrative has one job and helping you think clearly is not it.</p>
        <p>Being early is not the same as being good.</p>
        <p>Social media proved this. The first people on TikTok did not build the most durable audiences. The first people on Twitter did not end up with the most influence. Being first meant more reps. Whether those reps compounded into something real depended on something else entirely. We remember the ones who were early and rose. We forget the much larger group who were just early.</p>
        <p>Survivor bias is doing a lot of work in the AI discourse right now.</p>
        <h3>What the foundation actually is</h3>
        <p>The thing that determines whether AI makes you better is not how long you have used it. It is what you brought to it.</p>
        <p>Critical thinking. Writing. Reasoning from first principles. The ability to read an output and know when it is wrong. Without these, AI does not amplify judgment. It amplifies confidence without judgment. Faster output, same quality of thinking underneath.</p>
        <p>I graduated just before AI mattered enough to change how people worked. I built writing and reasoning under pressure before the tool existed to shortcut it. By the time I started using AI seriously, I had a foundation that could calibrate it. I could tell when it was wrong. I could push past the first draft. I could direct it rather than follow it.</p>
        <p>That is not a disadvantage of timing. It is the thing that makes the tool actually work.</p>
        <p>The person who grew up autocompleting their thinking has more reps. They may also have developed a dependency that is harder to see from the inside. The literature on overreliance is early but consistent. The debate happening around children and social media applies here at the adult level too. More exposure is not the same as better exposure.</p>
        <div className="pull-quote">Without the right foundations, AI does not amplify judgment. It amplifies confidence without judgment.</div>
        <h3>The efficiency trap</h3>
        <p>The dominant AI metric is efficiency. Hours saved. Assets shipped. Cost per output. This is the wrong race.</p>
        <p>It is dropshipping dressed as strategy. When ecommerce was new, the arbitrage was real. Then everyone got in. The edge closed. The moat was a timing window, not a durable advantage.</p>
        <p>The efficiency gains from AI work the same way. Real, temporarily, and not a competitive moat. The person producing three times the assets of their competitor has an advantage until their competitor does the same. That takes months. Not years. What is left when the arbitrage closes is the quality of the thinking underneath the output. That was always the real variable.</p>
        <p>The people building something durable are not optimising for output. They are redesigning how they think, how fast they learn, and how clearly they can see what is actually happening in their work. None of that shows up in hours saved.</p>
        <h3>What intentional actually means</h3>
        <p>Intentional AI is not a pace. It is a posture.</p>
        <p>You can move slowly and be intentional. You can move fast and be reckless. Speed is not the variable. The question is whether you are thinking clearly about what is changing, and what it means for the decisions ahead.</p>
        <p>Are you thinking about which parts of your work AI changes fundamentally, not just in speed? Are you building skills that compound, or substituting AI for the skill-building itself? Are you measuring the right things, or only the ones that are easy to count?</p>
        <p>The person who has not touched an AI tool but is thinking clearly about the shift is better positioned than the person using it every day without asking why.</p>
        <div className="pull-quote">Intentional AI is not a pace. It is a posture.</div>
        <p>The question is not when you started. It is whether you are thinking clearly about what you are doing. That is a standard anyone can meet today.</p>
      </MemoBody>
    </article>
  );
}

// ─── App wrapper ──────────────────────────────────────────────────────────

const TWEAK_DEFAULTS = {
  "accent": "oklch(0.55 0.10 215)",
  "cyanL": 0.7,
  "cyanC": 0.16,
  "theme": "light",
  "animationLevel": "rich",
  "surfaceDensity": "busy",
  "surfaceTint": "cool",
  "surfaceBubbles": true,
  "surfacePlankton": false,
  "surfaceSand": true,
  "cursorGlow": false
};

export default function PersonalSite({ memos, memoContent }) {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  useEffect(() => {
    const id = 'animation-level-style';
    let s = document.getElementById(id);
    if (!s) { s = document.createElement('style'); s.id = id; document.head.appendChild(s); }
    s.textContent = t.animationLevel === 'off'
      ? `*, *::before, *::after { animation-duration: 0.001s !important; animation-iteration-count: 1 !important; transition-duration: 0.05s !important; }`
      : '';
  }, [t.animationLevel]);

  return (
    <>
      <SharedStyles />
      <DirectionV2
        memos={memos}
        memoContent={memoContent}
        tweaks={{
          accent: t.accent,
          cyanAccent: `oklch(${t.cyanL} ${t.cyanC} 200)`,
          animationLevel: t.animationLevel,
          cursorGlow: t.cursorGlow,
          surface: {
            density: t.surfaceDensity,
            tint: t.surfaceTint,
            bubbles: t.surfaceBubbles,
            plankton: t.surfacePlankton,
            sand: t.surfaceSand,
          },
        }} />
    </>
  );
}
