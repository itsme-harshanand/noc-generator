import { useState, useRef, useCallback, useEffect } from "react";
import { logoManager } from "./logo_library.js";

// ─── PERSISTENCE (Fix #5: save form to localStorage) ─────

const STORAGE_KEY = "noc_generator_form";
function loadForm(defaults) {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) { const parsed = JSON.parse(saved); return { ...defaults, ...parsed }; }
  } catch(e) {}
  return defaults;
}
function saveForm(form) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(form)); } catch(e) {}
}

// ─── SMART LOGO ──────────────────────────────────────────

function getInitials(name) {
  const words = name.replace(/\b(Pvt|Private|Ltd|Limited|Pte|Inc|Corp|LLC|LLP|Co|The|Of|And|For)\b\.?/gi, "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "CO";
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function getDomain(website) {
  if (!website) return null;
  let d = website.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "").trim();
  return d || null;
}

function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = ((h << 5) - h + str.charCodeAt(i)) | 0; }
  return Math.abs(h);
}

const LOGO_STYLES = ["circle-initials","square-initials","rounded-initials","shield","hexagon","underline-bold","stacked","diamond"];
const LOGO_PALETTES = [
  { bg: "#1a2744", fg: "#ffffff", accent: "#3b82f6" },
  { bg: "#0f4c81", fg: "#ffffff", accent: "#60a5fa" },
  { bg: "#1e3a5f", fg: "#f0f0f0", accent: "#93c5fd" },
  { bg: "#2d3436", fg: "#ffffff", accent: "#00b894" },
  { bg: "#c0392b", fg: "#ffffff", accent: "#e74c3c" },
  { bg: "#1a1a2e", fg: "#e94560", accent: "#e94560" },
  { bg: "#006d77", fg: "#ffffff", accent: "#83c5be" },
  { bg: "#2c3e50", fg: "#ecf0f1", accent: "#e67e22" },
  { bg: "#4a148c", fg: "#ffffff", accent: "#ce93d8" },
  { bg: "#004e64", fg: "#ffffff", accent: "#25a18e" },
  { bg: "#212529", fg: "#ffffff", accent: "#ffc107" },
  { bg: "#0b3d0b", fg: "#ffffff", accent: "#4caf50" },
];

function GeneratedLogo({ companyName, width = 80, height = 50, primaryColor }) {
  const initials = getInitials(companyName);
  const hash = hashStr(companyName);
  const style = LOGO_STYLES[hash % LOGO_STYLES.length];
  const palette = LOGO_PALETTES[hash % LOGO_PALETTES.length];
  const bg = primaryColor || palette.bg;
  const fg = "#ffffff";
  const accent = palette.accent;

  // Fixed large internal coordinate system — SVG scales perfectly to any display size
  const W = 240, H = 100, CX = 120, CY = 50;
  const SZ = H; // square reference size

  const txt = (x, y, size, weight, color, family, content, extra = {}) => (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="central"
      fill={color} fontSize={size} fontWeight={weight}
      fontFamily={family} {...extra}>{content}</text>
  );

  switch (style) {
    case "circle-initials":
      return (<svg width={width} height={height} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
        <circle cx={CX} cy={CY} r={46} fill={bg} />
        {txt(CX, CY + 1, 38, "900", fg, "Arial, sans-serif", initials)}
      </svg>);

    case "square-initials":
      return (<svg width={width} height={height} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
        <rect x={CX - 46} y={CY - 46} width={92} height={92} fill={bg} />
        {txt(CX, CY + 1, 38, "900", fg, "Arial, sans-serif", initials)}
      </svg>);

    case "rounded-initials":
      return (<svg width={width} height={height} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
        <rect x={CX - 46} y={CY - 46} width={92} height={92} rx={14} fill={bg} />
        {txt(CX, CY + 1, 36, "800", fg, "Georgia, serif", initials)}
      </svg>);

    case "shield": {
      const sp = `M${CX} 4 L${CX + 44} ${H * 0.28} L${CX + 44} ${H * 0.66} Q${CX} ${H + 4} ${CX - 44} ${H * 0.66} L${CX - 44} ${H * 0.28} Z`;
      return (<svg width={width} height={height} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
        <path d={sp} fill={bg} />
        {txt(CX, CY + 2, 32, "900", fg, "Arial, sans-serif", initials)}
      </svg>);
    }

    case "hexagon": {
      const r = 46;
      const pts = Array.from({ length: 6 }, (_, i) => { const a = (Math.PI / 3) * i - Math.PI / 2; return `${CX + r * Math.cos(a)},${CY + r * Math.sin(a)}`; }).join(" ");
      return (<svg width={width} height={height} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
        <polygon points={pts} fill={bg} />
        {txt(CX, CY + 1, 34, "900", fg, "Arial, sans-serif", initials)}
      </svg>);
    }

    case "underline-bold":
      return (<svg width={width} height={height} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
        <rect x={0} y={0} width={W} height={H} fill="#ffffff" />
        {txt(CX, CY - 8, 46, "900", bg, "Arial, sans-serif", initials, { letterSpacing: "6" })}
        <rect x={CX - 36} y={CY + 28} width={72} height={5} fill={accent} rx={2} />
      </svg>);

    case "stacked": {
      const word = companyName.replace(/\b(Pvt|Private|Ltd|Limited|Pte|Inc|Corp|LLC|LLP|Co|The)\b\.?/gi, "").trim().split(/\s+/)[0] || "CO";
      return (<svg width={width} height={height} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
        <rect x={2} y={2} width={W - 4} height={H - 4} fill={bg} rx={8} />
        {txt(CX, CY - 6, 32, "900", fg, "Arial, sans-serif", word.substring(0, 6).toUpperCase(), { letterSpacing: "4" })}
        <rect x={CX - 40} y={CY + 18} width={80} height={4} fill={accent} rx={2} />
      </svg>);
    }

    case "diamond": {
      const dp = `${CX},4 ${CX + 44},${CY} ${CX},${H - 4} ${CX - 44},${CY}`;
      return (<svg width={width} height={height} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
        <polygon points={dp} fill={bg} />
        {txt(CX, CY + 1, 30, "900", fg, "Arial, sans-serif", initials)}
      </svg>);
    }

    default:
      return (<svg width={width} height={height} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
        <circle cx={CX} cy={CY} r={46} fill={bg} />
        {txt(CX, CY + 1, 38, "900", fg, "Arial, sans-serif", initials)}
      </svg>);
  }
}

function SmartLogo({ companyName, website, width = 80, height = 50, primaryColor, uploadedLogo }) {
  const [logoUrl, setLogoUrl] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (uploadedLogo) return;
    setLogoUrl(null);
    setFailed(false);
    const domain = getDomain(website);
    if (!domain) { setFailed(true); return; }
    const sources = [
      `https://img.logo.dev/${domain}?token=pk_anonymous&size=200&format=png`,
      `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
      `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128`,
    ];
    let idx = 0;
    const tryNext = () => {
      if (idx >= sources.length) { setFailed(true); return; }
      const url = sources[idx]; idx++;
      const img = new Image();
      img.onload = () => { if (img.naturalWidth >= 16) setLogoUrl(url); else tryNext(); };
      img.onerror = () => tryNext();
      img.src = url;
    };
    tryNext();
  }, [website, uploadedLogo]);

  if (uploadedLogo) return <img src={uploadedLogo} alt={companyName} style={{ width, height, objectFit: "contain" }} />;
  if (logoUrl && !failed) return <img src={logoUrl} alt={companyName} style={{ width, height, objectFit: "contain" }} onError={() => { setFailed(true); setLogoUrl(null); }} />;
  // Fix #1: Always fall back to generated logo
  return <GeneratedLogo companyName={companyName} width={width} height={height} primaryColor={primaryColor} />;
}



// ─── GOOGLE HANDWRITING FONTS ────────────────────────────

const FONTS_LOADED = { current: false };
function ensureFonts() {
  if (FONTS_LOADED.current) return;
  FONTS_LOADED.current = true;
  const link = document.createElement("link");
  link.href = "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&family=Great+Vibes&family=Caveat:wght@400;700&family=Satisfy&family=Kalam:wght@400;700&family=Sacramento&family=Pacifico&family=Indie+Flower&family=Pinyon+Script&family=Allura&family=Mr+Dafoe&family=Italianno&display=swap";
  link.rel = "stylesheet";
  document.head.appendChild(link);
}

const SIG_FONTS = [
  { f: "'Dancing Script'", w: "700", s: 30 },
  { f: "'Great Vibes'", w: "400", s: 32 },
  { f: "'Caveat'", w: "700", s: 31 },
  { f: "'Satisfy'", w: "400", s: 28 },
  { f: "'Kalam'", w: "700", s: 26 },
  { f: "'Sacramento'", w: "400", s: 34 },
  { f: "'Pacifico'", w: "400", s: 24 },
  { f: "'Indie Flower'", w: "400", s: 26 },
  { f: "'Pinyon Script'", w: "400", s: 36 },
  { f: "'Allura'", w: "400", s: 34 },
  { f: "'Mr Dafoe'", w: "400", s: 30 },
  { f: "'Italianno'", w: "400", s: 38 },
];

// Signature rendering modes — each produces a visually distinct signature
const SIG_MODES = [
  "full-name",        // 0: Full name in cursive (like "Saurav Kumar")
  "first-name-only",  // 1: Just first name (like "Praveen")
  "initials-cursive",  // 2: Initials in large cursive (like "nus" from Nas)
  "last-name-first",  // 3: Last name emphasized
  "abbreviated",      // 4: First initial + last name (like "S. Kumar")
  "first-initial-big", // 5: Big first letter + rest smaller
  "full-tight",       // 6: Full name compressed/tight
  "full-slanted",     // 7: Full name with heavy slant
  "first-loop",       // 8: First name with extra loop strokes
  "monogram",         // 9: Overlapping initials large
  "surname-only",     // 10: Just surname
  "casual-first",     // 11: Casual first name, relaxed
  "flourish-end",     // 12: Full name with trailing bezier tail flourish
  "upward-slant",     // 13: Name arcing upward (optimistic executive style)
  "compressed-bold",  // 14: Short compressed bold (formal stamp-like)
  "relaxed-wide",     // 15: Wide airy cursive, slightly drooping
];

// ─── SIGNATURE (Canvas — many variations) ────────────────

function HandwrittenSignature({ name, width = 180, height = 60, styleIndex = 0 }) {
  const canvasRef = useRef(null);
  const si = parseInt(styleIndex || 0);
  const hash = hashStr(name) + si * 137;
  const [ready, setReady] = useState(false);

  useEffect(() => { ensureFonts(); const t = setTimeout(() => setReady(true), 800); return () => clearTimeout(t); }, []);

  useEffect(() => {
    if (!ready) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 2;
    const W = 380, H = 110;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    let seed = hash;
    const rng = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

    // Ink color pool
    const inks = ["#0a1650", "#111", "#0d1a4a", "#0a0a0a", "#0b1844", "#141414", "#091540", "#1a1a1a", "#1a2d6a", "#222"];
    const ink = inks[hash % inks.length];

    // Pick font — each styleIndex shifts the font choice
    const fi = (hash + si * 3) % SIG_FONTS.length;
    const font = SIG_FONTS[fi];
    const baseSize = font.s + (hash % 6) - 2;

    // Determine what text to write based on mode
    const mode = SIG_MODES[si % SIG_MODES.length];
    const parts = name.trim().split(/\s+/);
    const firstName = parts[0] || name;
    const lastName = parts.length > 1 ? parts[parts.length - 1] : "";
    const initials = parts.map(p => p[0]).join("").toUpperCase();

    let sigText = name;
    let fontSize = baseSize;
    switch (mode) {
      case "full-name": sigText = name; fontSize = baseSize; break;
      case "first-name-only": sigText = firstName; fontSize = baseSize + 4; break;
      case "initials-cursive": sigText = initials.toLowerCase(); fontSize = baseSize + 10; break;
      case "last-name-first": sigText = lastName ? `${lastName} ${firstName[0]}.` : name; fontSize = baseSize + 2; break;
      case "abbreviated": sigText = lastName ? `${firstName[0]}. ${lastName}` : name; fontSize = baseSize + 2; break;
      case "first-initial-big": sigText = name; fontSize = baseSize; break; // handled specially below
      case "full-tight": sigText = name; fontSize = baseSize - 2; break;
      case "full-slanted": sigText = name; fontSize = baseSize + 1; break;
      case "first-loop": sigText = firstName; fontSize = baseSize + 5; break;
      case "monogram": sigText = initials; fontSize = baseSize + 14; break;
      case "surname-only": sigText = lastName || firstName; fontSize = baseSize + 5; break;
      case "casual-first": sigText = firstName.toLowerCase(); fontSize = baseSize + 3; break;
      case "flourish-end": sigText = name; fontSize = baseSize + 1; break;
      case "upward-slant": sigText = name; fontSize = baseSize; break;
      case "compressed-bold": sigText = lastName ? `${firstName[0]}${lastName}` : name; fontSize = baseSize + 6; break;
      case "relaxed-wide": sigText = name; fontSize = baseSize - 1; break;
    }

    ctx.fillStyle = ink;
    ctx.strokeStyle = ink;
    ctx.globalAlpha = 0.85 + rng() * 0.1;

    const tilt = (mode === "full-slanted" || mode === "compressed-bold") ? -0.18 - rng() * 0.08
      : (mode === "upward-slant") ? -0.22 - rng() * 0.06
      : (mode === "relaxed-wide") ? 0.05 + rng() * 0.05
      : (rng() - 0.5) * 0.1;
    const startX = 10 + rng() * 5;
    const startY = H * (mode === "monogram" ? 0.65 : mode === "upward-slant" ? 0.7 : 0.58);

    ctx.save();
    ctx.translate(startX, startY);
    ctx.rotate(tilt);

    let totalWidth = 0;

    if (mode === "first-initial-big" && parts.length > 0) {
      ctx.font = `${font.w} ${fontSize + 12}px ${font.f}, cursive`;
      const bigChar = name[0];
      ctx.fillText(bigChar, 0, 0);
      const bigW = ctx.measureText(bigChar).width;
      ctx.font = `${font.w} ${fontSize - 2}px ${font.f}, cursive`;
      let xOff = bigW - 2;
      for (let i = 1; i < name.length; i++) {
        const yJ = (rng() - 0.5) * 1.8;
        ctx.fillText(name[i], xOff, yJ);
        xOff += ctx.measureText(name[i]).width + (rng() - 0.5) * 1 - 0.3;
      }
      totalWidth = xOff;
    } else if (mode === "full-tight") {
      ctx.font = `${font.w} ${fontSize}px ${font.f}, cursive`;
      let xOff = 0;
      for (let i = 0; i < sigText.length; i++) {
        const yJ = (rng() - 0.5) * 1.5;
        ctx.fillText(sigText[i], xOff, yJ);
        xOff += ctx.measureText(sigText[i]).width - 1.5 - rng() * 1;
      }
      totalWidth = xOff;
    } else if (mode === "monogram") {
      ctx.font = `${font.w} ${fontSize}px ${font.f}, cursive`;
      for (let i = 0; i < sigText.length; i++) {
        ctx.globalAlpha = 0.7 + rng() * 0.2;
        ctx.fillText(sigText[i], i * (fontSize * 0.45), (rng() - 0.5) * 4);
      }
      totalWidth = sigText.length * fontSize * 0.45;
    } else if (mode === "relaxed-wide") {
      // Airy wide spacing with gentle sinusoidal baseline
      ctx.font = `${font.w} ${fontSize}px ${font.f}, cursive`;
      let xOff = 0;
      for (let i = 0; i < sigText.length; i++) {
        const wave = Math.sin(i * 0.55 + rng() * 0.3) * 2.5;
        const alpha = 0.78 + rng() * 0.16;
        ctx.globalAlpha = alpha;
        ctx.fillText(sigText[i], xOff, wave);
        xOff += ctx.measureText(sigText[i]).width + 1.8 + rng() * 1.2;
      }
      totalWidth = xOff;
    } else if (mode === "compressed-bold") {
      // Bold, upright, compressed — like a formal stamp signature
      ctx.font = `900 ${fontSize}px ${font.f}, cursive`;
      let xOff = 0;
      for (let i = 0; i < sigText.length; i++) {
        const yJ = (rng() - 0.5) * 1.2;
        ctx.fillText(sigText[i], xOff, yJ);
        xOff += ctx.measureText(sigText[i]).width - 0.8;
      }
      totalWidth = xOff;
    } else if (mode === "upward-slant") {
      // Each char slightly rises (y decreases) giving an upward arc feel
      ctx.font = `${font.w} ${fontSize}px ${font.f}, cursive`;
      let xOff = 0;
      for (let i = 0; i < sigText.length; i++) {
        const yJ = -(i * 1.1) + (rng() - 0.5) * 1.5;
        ctx.fillText(sigText[i], xOff, yJ);
        xOff += ctx.measureText(sigText[i]).width + (rng() - 0.5) * 1 - 0.2;
      }
      totalWidth = xOff;
    } else if (mode === "flourish-end") {
      // Full name then a bezier tail flourish at the end
      ctx.font = `${font.w} ${fontSize}px ${font.f}, cursive`;
      let xOff = 0;
      for (let i = 0; i < sigText.length; i++) {
        const yJ = (rng() - 0.5) * 2;
        ctx.fillText(sigText[i], xOff, yJ);
        xOff += ctx.measureText(sigText[i]).width + (rng() - 0.5) * 1.2 - 0.4;
      }
      totalWidth = xOff;
      // Draw trailing bezier flourish
      ctx.restore();
      ctx.save();
      ctx.translate(startX + totalWidth - 4, startY - 2);
      ctx.rotate(tilt);
      ctx.globalAlpha = 0.55 + rng() * 0.2;
      ctx.lineWidth = 0.9 + rng() * 0.7;
      ctx.strokeStyle = ink;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      const fx1 = 18 + rng() * 14, fy1 = -8 - rng() * 12;
      const fx2 = 38 + rng() * 20, fy2 = 6 + rng() * 8;
      const fx3 = 52 + rng() * 16, fy3 = -4 - rng() * 6;
      ctx.bezierCurveTo(fx1, fy1, fx2, fy2, fx3, fy3);
      ctx.stroke();
      totalWidth += fx3;
    } else {
      // Standard rendering with per-character jitter + subtle sinusoidal baseline
      ctx.font = `${font.w} ${fontSize}px ${font.f}, cursive`;
      let xOff = 0;
      for (let i = 0; i < sigText.length; i++) {
        const wave = Math.sin(i * 0.4) * 1.2;
        const yJ = (rng() - 0.5) * 2.2 + wave;
        ctx.fillText(sigText[i], xOff, yJ);
        xOff += ctx.measureText(sigText[i]).width + (rng() - 0.5) * 1.5 - 0.4;
      }
      totalWidth = xOff;
    }
    ctx.restore();

    // Underline / flourish variations (6 styles)
    ctx.globalAlpha = 0.3 + rng() * 0.2;
    ctx.lineWidth = 0.6 + rng() * 0.8;
    ctx.strokeStyle = ink;
    const tw = totalWidth || 100;
    const ulY = startY + 8 + rng() * 6;
    const ulEndX = startX + Math.min(tw * 1.05, W - 30);

    const ulVariant = hash % 6;
    if (ulVariant === 0) {
      // Straight underline
      ctx.beginPath();
      ctx.moveTo(startX, ulY);
      ctx.lineTo(ulEndX, ulY + (rng() - 0.5) * 2);
      ctx.stroke();
    } else if (ulVariant === 1) {
      // Wavy underline (quadratic)
      ctx.beginPath();
      ctx.moveTo(startX, ulY);
      ctx.quadraticCurveTo((startX + ulEndX) / 2, ulY + 5 + rng() * 4, ulEndX, ulY - 1 + rng() * 3);
      ctx.stroke();
    } else if (ulVariant === 2) {
      // Double short parallel lines
      ctx.beginPath(); ctx.moveTo(startX, ulY); ctx.lineTo(startX + tw * 0.4, ulY + rng() * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(startX, ulY + 3); ctx.lineTo(startX + tw * 0.3, ulY + 3 + rng() * 2); ctx.stroke();
    } else if (ulVariant === 3) {
      // Curving-up tail: line that arcs upward at the end (executive)
      ctx.beginPath();
      ctx.moveTo(startX, ulY);
      ctx.bezierCurveTo(startX + tw * 0.5, ulY + 2, ulEndX - 10, ulY + 1, ulEndX + 10, ulY - 8 - rng() * 6);
      ctx.stroke();
    } else if (ulVariant === 4) {
      // Cross-bar: short horizontal through the middle of baseline
      const midX = startX + tw * 0.5;
      ctx.beginPath(); ctx.moveTo(midX - tw * 0.22, startY + 2); ctx.lineTo(midX + tw * 0.22, startY + 2 + (rng() - 0.5) * 2); ctx.stroke();
    }
    // ulVariant === 5: no underline (clean)

  }, [name, hash, ready, width, height, si]);

  return <canvas ref={canvasRef} style={{ width, height, display: "block" }} />;
}

// ─── STAMP (Canvas-rendered for perfect text on arcs) ────

function CompanyStamp({ companyName, companyCIN, size = 100 }) {
  const canvasRef = useRef(null);
  const hash = hashStr(companyName);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 2;
    const S = size;
    canvas.width = S * dpr;
    canvas.height = S * dpr;
    canvas.style.width = `${S}px`;
    canvas.style.height = `${S}px`;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, S, S);

    const fullName = companyName.toUpperCase();
    let topText = fullName;
    let bottomText = "";
    const suffixes = ["PVT. LTD.", "PVT LTD", "PRIVATE LIMITED", "PTE. LTD.", "PTE LTD", "LIMITED", "LTD.", "LTD", "INC.", "INC", "CORP.", "CORP", "LLC", "LLP"];
    for (const suf of suffixes) {
      if (fullName.includes(suf)) { topText = fullName.replace(suf, "").trim(); bottomText = suf; break; }
    }
    if (!bottomText) {
      const w = fullName.split(/\s+/);
      if (w.length > 1) { topText = w.slice(0, Math.ceil(w.length / 2)).join(" "); bottomText = w.slice(Math.ceil(w.length / 2)).join(" "); }
    }

    const cx = S / 2, cy = S / 2;
    const oR = S / 2 - 4;
    const iR = oR - 6;
    const cin = companyCIN || "";

    // Ink color: BLUE like real Indian company stamps
    const col = "#1a3a8a";
    const variant = hash % 3;

    ctx.strokeStyle = col;
    ctx.fillStyle = col;

    // Draw circles based on variant
    if (variant === 0) {
      // Classic double circle
      ctx.globalAlpha = 0.88; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, oR, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 0.75; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, iR, 0, Math.PI * 2); ctx.stroke();
    } else if (variant === 1) {
      // Thick bold outer
      ctx.globalAlpha = 0.85; ctx.lineWidth = 4.5; ctx.beginPath(); ctx.arc(cx, cy, oR, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 0.55; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(cx, cy, oR - 4, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 0.7; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(cx, cy, iR - 2, 0, Math.PI * 2); ctx.stroke();
    } else {
      // Triple ring
      ctx.globalAlpha = 0.82; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(cx, cy, oR, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 0.45; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.arc(cx, cy, oR - 2.5, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 0.68; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, iR, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 0.4; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, iR - 10, 0, Math.PI * 2); ctx.stroke();
    }

    // --- Draw curved text on arcs ---
    const drawTextOnArc = (text, radius, startAngle, endAngle, fontSize, alpha, flipChars) => {
      if (!text) return;
      ctx.save();
      ctx.font = `bold ${fontSize}px Arial, Helvetica, sans-serif`;
      ctx.fillStyle = col;
      ctx.globalAlpha = alpha;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const totalAngle = endAngle - startAngle;
      const step = totalAngle / (text.length + 1);

      for (let i = 0; i < text.length; i++) {
        const angle = startAngle + step * (i + 1);
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        ctx.save();
        ctx.translate(x, y);
        if (flipChars) {
          ctx.rotate(angle - Math.PI / 2);
        } else {
          ctx.rotate(angle + Math.PI / 2);
        }
        ctx.fillText(text[i], 0, 0);
        ctx.restore();
      }
      ctx.restore();
    };

    // Top text (upper semicircle, reading left to right)
    const textR = (oR + iR) / 2;
    const topFS = Math.min(S * 0.1, (Math.PI * textR * 0.85) / (topText.length * 0.6));
    drawTextOnArc(topText, textR, Math.PI + 0.4, 2 * Math.PI - 0.4, topFS, 0.9, true);

    // Bottom text (lower semicircle, reading left to right)
    const botFS = Math.min(S * 0.095, (Math.PI * textR * 0.85) / (Math.max(bottomText.length, 1) * 0.6));
    drawTextOnArc(bottomText, textR, 0.4, Math.PI - 0.4, botFS, 0.85, false);

    // Center content
    ctx.globalAlpha = 0.75;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (cin) {
      ctx.font = `bold ${S * 0.06}px Arial, sans-serif`;
      ctx.fillText("CIN", cx, cy - 5);
      const cinFS = Math.min(S * 0.055, (iR * 1.2) / (cin.length * 0.5));
      ctx.font = `600 ${cinFS}px Courier, monospace`;
      ctx.globalAlpha = 0.65;
      ctx.fillText(cin.substring(0, 22), cx, cy + 7);
    } else {
      ctx.font = `${S * 0.18}px Arial`;
      ctx.fillText("★", cx, cy + 2);
    }

    // Bottom star
    ctx.globalAlpha = 0.65;
    ctx.font = `${S * 0.07}px Arial`;
    ctx.fillText("★", cx, cy + iR - 3);

    // Side dots
    ctx.globalAlpha = 0.65;
    ctx.beginPath(); ctx.arc(cx - iR + 2, cy, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + iR - 2, cy, 2, 0, Math.PI * 2); ctx.fill();

  }, [companyName, companyCIN, size, hash]);

  return <canvas ref={canvasRef} style={{ width: size, height: size, display: "block" }} />;
}

// ─── TEMPLATES & CONFIG ───────────────────────────────────

const COMPANY_TEMPLATES = [
  { id: "corporate-a", label: "Corporate (DLF Style)", headerStyle: "logo-right", dateAlign: "right", addressee: "To Whomsoever It May Concern", colorScheme: "navy", footerStyle: "registered-office", signStyle: "authorized", borderStyle: "none", accentBar: false },
  { id: "airline", label: "Airline (IndiGo Style)", headerStyle: "logo-right", dateAlign: "left", addressee: "To Whom So Ever It May Concern", colorScheme: "blue", footerStyle: "dual-office", signStyle: "yours-truly", borderStyle: "none", accentBar: false },
  { id: "aviation-express", label: "Aviation Express (Air India Style)", headerStyle: "brand-left", dateAlign: "left", addressee: "To whomsoever it may concern", colorScheme: "orange-red", footerStyle: "colored-bar", signStyle: "for-behalf", borderStyle: "none", accentBar: true },
  { id: "media", label: "Media Company (Nas Style)", headerStyle: "dark-bar", dateAlign: "right", addressee: "TO WHOMSOEVER IT MAY CONCERN", colorScheme: "dark-yellow", footerStyle: "none", signStyle: "ceo-stamp", borderStyle: "none", accentBar: false },
  { id: "school", label: "School/Institute", headerStyle: "center-seal", dateAlign: "right", addressee: "Dear Sir/Madam", colorScheme: "maroon", footerStyle: "none", signStyle: "principal-stamp", borderStyle: "thin", accentBar: false },
  { id: "tech-startup", label: "Tech Company (Spritle Style)", headerStyle: "logo-left-gst", dateAlign: "left", addressee: "To Whomsover It May Concern", colorScheme: "teal-blue", footerStyle: "colored-center", signStyle: "hr-executive", borderStyle: "none", accentBar: false },
  { id: "design-firm", label: "Design Firm (Dingbat Style)", headerStyle: "bold-name", dateAlign: "left", addressee: "TO WHOMSOEVER IT MAY CONCERN", colorScheme: "charcoal", footerStyle: "none", signStyle: "sincerely", borderStyle: "none", accentBar: false },
  { id: "consulting", label: "Consulting (DSS Style)", headerStyle: "logo-left-info-right", dateAlign: "left", addressee: "Dear Sir/Madam", colorScheme: "red-gray", footerStyle: "copyright", signStyle: "yours-sincerely", borderStyle: "none", accentBar: true },
  { id: "medical", label: "Medical/Hospital (Axon Style)", headerStyle: "logo-right-minimal", dateAlign: "left", addressee: "To the Embassy of Australia", colorScheme: "teal-green", footerStyle: "address-bar", signStyle: "doctor-stamp", borderStyle: "none", accentBar: false },
  { id: "foreign-corp", label: "Foreign Corp (Telf AG Style)", headerStyle: "large-logo-center", dateAlign: "left", addressee: "To whom it may concern", colorScheme: "dark-teal", footerStyle: "simple-address", signStyle: "company-seal", borderStyle: "none", accentBar: false },
  { id: "watermark", label: "Watermark Background", headerStyle: "logo-right", dateAlign: "right", addressee: "To Whomsoever It May Concern", colorScheme: "navy", footerStyle: "registered-office", signStyle: "authorized", borderStyle: "none", accentBar: false, watermark: true },
  { id: "uae-corp", label: "UAE Company (AR11 Style)", headerStyle: "dark-bar", dateAlign: "right", addressee: "To Whom It May Concern,", colorScheme: "orange-red", footerStyle: "simple-address", signStyle: "sincerely", borderStyle: "none", accentBar: false, cornerDecor: true },
  { id: "minimal-mnc", label: "MNC Minimal (Dell Style)", headerStyle: "logo-left-gst", dateAlign: "left", addressee: "TO WHOM IT MAY CONCERN", colorScheme: "charcoal", footerStyle: "dual-office", signStyle: "for-behalf", borderStyle: "none", accentBar: false },
  { id: "embassy-addr", label: "Embassy Addressed (Aviation Style)", headerStyle: "logo-right", dateAlign: "right", addressee: "Dear Sir/Madam", colorScheme: "blue", footerStyle: "none", signStyle: "yours-sincerely", borderStyle: "none", accentBar: false, swoosh: true },
  { id: "astro-bg", label: "Decorative Background", headerStyle: "center-seal", dateAlign: "left", addressee: "Dear Sir/Madam,", colorScheme: "maroon", footerStyle: "address-bar", signStyle: "sincerely", borderStyle: "none", accentBar: false, decorBg: true },
];

const COLOR_SCHEMES = {
  "navy": { primary: "#1a2744", accent: "#2c5282", bg: "#ffffff", text: "#1a1a1a" },
  "blue": { primary: "#0066cc", accent: "#003d7a", bg: "#ffffff", text: "#222" },
  "orange-red": { primary: "#cc3300", accent: "#ff6600", bg: "#ffffff", text: "#222" },
  "dark-yellow": { primary: "#1a1a1a", accent: "#f5c518", bg: "#ffffff", text: "#1a1a1a", headerBg: "#1a1a1a" },
  "maroon": { primary: "#8b0000", accent: "#cc0000", bg: "#ffffff", text: "#222" },
  "teal-blue": { primary: "#0077b6", accent: "#00a8e8", bg: "#ffffff", text: "#333" },
  "charcoal": { primary: "#2d2d2d", accent: "#555", bg: "#ffffff", text: "#2d2d2d" },
  "red-gray": { primary: "#cc0000", accent: "#666", bg: "#ffffff", text: "#333" },
  "teal-green": { primary: "#009688", accent: "#00796b", bg: "#ffffff", text: "#222" },
  "dark-teal": { primary: "#004d4d", accent: "#006666", bg: "#ffffff", text: "#1a1a1a" },
};

const FONTS = [
  { id: "times", label: "Times New Roman", family: "'Times New Roman', Times, serif" },
  { id: "georgia", label: "Georgia", family: "Georgia, 'Times New Roman', serif" },
  { id: "arial", label: "Arial", family: "Arial, Helvetica, sans-serif" },
  { id: "calibri", label: "Calibri", family: "Calibri, 'Segoe UI', sans-serif" },
  { id: "garamond", label: "Garamond", family: "'EB Garamond', Garamond, serif" },
  { id: "verdana", label: "Verdana", family: "Verdana, Geneva, sans-serif" },
];

const defaultForm = {
  companyName: "Acme Technologies Pvt. Ltd.",
  companyAddress: "Tower B, 5th Floor, Cyber Hub\nGurugram - 122002, Haryana, India",
  companyPhone: "+91-124-4567890",
  companyEmail: "hr@acmetech.com",
  companyWebsite: "www.acmetech.com",
  companyCIN: "U72200HR2015PTC056789",
  companyGST: "",
  letterDate: "2025-08-15",
  employeeName: "Rahul Sharma",
  employeeGender: "male",
  designation: "Senior Software Engineer",
  joiningDate: "2021-03-15",
  passportNumber: "",
  annualSalary: "",
  monthlySalary: "",
  destination: "Australia",
  travelPurpose: "personal tourism",
  travelFrom: "2025-09-10",
  travelTo: "2025-09-25",
  resumeDate: "2025-09-26",
  signatoryName: "Priya Mehta",
  signatoryDesignation: "Head - Human Resources",
  signatureStyle: "0",
  template: "corporate-a",
  font: "calibri",
  fontSize: "11",
  logoWidth: "80",
  logoHeight: "50",
  includeSubject: false,
  includeEmployeeDetails: false,
  includePassport: false,
  includeSalary: false,
  includeExpenseClause: true,
  includeReturnClause: true,
  includeVisaPurpose: true,
  addressedTo: "generic",
  customAddressee: "",
  uploadedLogo: "",
  logoMode: "auto", // "auto" | "text-only" | "skip"
};

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const day = d.getDate();
  const suffix = day === 1 || day === 21 || day === 31 ? "st" : day === 2 || day === 22 ? "nd" : day === 3 || day === 23 ? "rd" : "th";
  return `${day}${suffix} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function pronoun(gender, type) {
  const m = { subject: "He", object: "him", possessive: "his", title: "Mr." };
  const f = { subject: "She", object: "her", possessive: "her", title: "Ms." };
  return (gender === "female" ? f : m)[type];
}

// ─── NOC PREVIEW ──────────────────────────────────────────

function NOCPreview({ form }) {
  const tpl = COMPANY_TEMPLATES.find(t => t.id === form.template) || COMPANY_TEMPLATES[0];
  const colors = COLOR_SCHEMES[tpl.colorScheme];
  const fontObj = FONTS.find(f => f.id === form.font) || FONTS[0];
  const fs = parseInt(form.fontSize) || 11;
  const lw = parseInt(form.logoWidth) || 80;
  const lh = parseInt(form.logoHeight) || 50;

  const he = pronoun(form.employeeGender, "subject");
  const his = pronoun(form.employeeGender, "possessive");
  const title = pronoun(form.employeeGender, "title");

  const addresseeText = form.addressedTo === "embassy" ? `The Visa Officer\nAustralian High Commission\nNew Delhi, India` : form.addressedTo === "custom" ? form.customAddressee : tpl.addressee;
  const isEmbassy = form.addressedTo === "embassy";

  const pageStyle = {
    width: "210mm", minHeight: "297mm", padding: "20mm 22mm 35mm 22mm",
    fontFamily: fontObj.family, fontSize: `${fs}pt`, color: colors.text,
    background: colors.bg, position: "relative", boxSizing: "border-box",
    lineHeight: "1.65", border: tpl.borderStyle === "thin" ? `1px solid ${colors.primary}` : "none",
    boxShadow: "0 2px 20px rgba(0,0,0,0.12)",
  };

  const textOnlyLogo = (h) => (
    <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 700, fontSize: Math.max(13, (h || lh) * 0.35) + "px", color: colors.primary, letterSpacing: "0.5px", lineHeight: 1.2, maxWidth: 220 }}>
      {form.companyName}
    </div>
  );
  const logo = (w, h) => {
    if (form.logoMode === "skip") return null;
    if (form.logoMode === "text-only") return textOnlyLogo(h);
    return <SmartLogo companyName={form.companyName} website={form.companyWebsite} width={w || lw} height={h || lh} primaryColor={colors.primary} uploadedLogo={form.uploadedLogo} />;
  };

  // ─── Signature + Stamp block (Fix #2 & #3) ───

  const renderHeader = () => {
    switch (tpl.headerStyle) {
      case "logo-right":
        return (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, borderBottom: `2px solid ${colors.primary}`, paddingBottom: 14 }}>
            <div>
              <div style={{ fontSize: `${fs - 2}pt`, color: "#555", whiteSpace: "pre-line", marginTop: 4, lineHeight: 1.5 }}>{form.companyAddress}</div>
            </div>
            <div style={{ flexShrink: 0, marginLeft: 16 }}>{logo()}</div>
          </div>);
      case "brand-left":
        return (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div>{logo()}</div>
                {form.companyCIN && <div style={{ fontSize: `${fs - 3}pt`, color: "#888", marginTop: 4 }}>CIN: {form.companyCIN}</div>}
              </div>
            </div>
          </div>);
      case "dark-bar":
        return (
          <div style={{ background: colors.headerBg || "#1a1a1a", margin: "-20mm -22mm 24px -22mm", padding: "14px 22mm", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>{logo(90, 50)}</div>
            <div style={{ background: "#fff", borderRadius: 6, padding: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>{logo(60, 36)}</div>
          </div>);
      case "center-seal":
        return (
          <div style={{ textAlign: "center", marginBottom: 18, borderBottom: `2px double ${colors.primary}`, paddingBottom: 12 }}>
            <div style={{ display: "inline-block", marginBottom: 8 }}>{logo()}</div>
            <div style={{ fontSize: `${fs - 2}pt`, color: "#666", marginTop: 4 }}>{form.companyAddress.replace("\n", " | ")}</div>
          </div>);
      case "logo-left-gst":
        return (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, borderBottom: `2.5px solid ${colors.primary}`, paddingBottom: 14 }}>
            <div>{logo()}</div>
            <div style={{ textAlign: "right", fontSize: `${fs - 2}pt`, color: "#555" }}>
              {form.companyGST && <div>GST No: {form.companyGST}</div>}
              {form.companyCIN && <div>CIN No: {form.companyCIN}</div>}
            </div>
          </div>);
      case "bold-name":
        return (
          <div style={{ marginBottom: 24, display: "flex", alignItems: "flex-start", gap: 16 }}>
            <div>{logo(70, 55)}</div>
            <div>
              <div style={{ fontSize: `${fs - 2}pt`, color: "#666", whiteSpace: "pre-line", marginTop: 6, lineHeight: 1.5 }}>{form.companyAddress}</div>
            </div>
          </div>);
      case "logo-left-info-right":
        return (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
            <div>
              <div>{logo()}</div>
            </div>
            <div style={{ textAlign: "right", fontSize: `${fs - 2}pt`, color: "#555" }}>
              {form.companyCIN && <div>CIN: {form.companyCIN}</div>}
              <div style={{ whiteSpace: "pre-line" }}>{form.companyAddress}</div>
              {form.companyWebsite && <div style={{ color: colors.primary }}>{form.companyWebsite}</div>}
            </div>
          </div>);
      case "logo-right-minimal":
        return (
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 30 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ marginLeft: "auto" }}>{logo()}</div>
              {form.companyWebsite && <div style={{ fontSize: `${fs - 3}pt`, color: "#888", marginTop: 3 }}>{form.companyWebsite}</div>}
            </div>
          </div>);
      case "large-logo-center":
        return (
          <div style={{ textAlign: "center", marginBottom: 20, borderBottom: `3px solid ${colors.primary}`, paddingBottom: 16 }}>
            <div style={{ display: "inline-block" }}>{logo(70, 60)}</div>
          </div>);
      default: return null;
    }
  };

  const renderFooter = () => {
    switch (tpl.footerStyle) {
      case "registered-office":
        return (<div style={{ position: "absolute", bottom: "12mm", left: "22mm", right: "22mm", borderTop: `1px solid #ddd`, paddingTop: 8, fontSize: `${fs - 3}pt`, color: "#777", textAlign: "center", lineHeight: 1.4 }}>Regd. Office: {form.companyAddress.replace("\n", ", ")}{form.companyCIN && <><br />CIN: {form.companyCIN}</>}{form.companyWebsite && <>; Website: <span style={{ color: colors.primary }}>{form.companyWebsite}</span></>}</div>);
      case "dual-office":
        return (<div style={{ position: "absolute", bottom: "10mm", left: "22mm", right: "22mm", borderTop: `1px solid #ddd`, paddingTop: 6, fontSize: `${fs - 3.5}pt`, color: "#777", lineHeight: 1.4 }}><div>{form.companyName}</div><div>Registered Office: {form.companyAddress.replace("\n", ", ")}</div>{form.companyPhone && <div>Tel: {form.companyPhone}{form.companyEmail ? ` Email: ${form.companyEmail}` : ""}</div>}{form.companyCIN && <div>CIN no.: {form.companyCIN}</div>}</div>);
      case "colored-bar":
        return (<div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: `linear-gradient(135deg, ${colors.accent}, ${colors.primary})`, padding: "12px 22mm", display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={{ fontSize: `${fs - 3}pt`, color: "#fff", lineHeight: 1.4 }}><div style={{ fontWeight: 700 }}>Registered Office:</div><div>{form.companyAddress.replace("\n", ", ")}</div>{form.companyPhone && <div>T {form.companyPhone}</div>}</div><div style={{ color: "#fff", fontWeight: 700, fontSize: `${fs - 1}pt` }}>{form.companyWebsite}</div></div>);
      case "colored-center":
        return (<div style={{ position: "absolute", bottom: "10mm", left: "22mm", right: "22mm", textAlign: "center", fontSize: `${fs - 3}pt`, lineHeight: 1.5 }}><div style={{ color: colors.primary, fontWeight: 700 }}>{form.companyName}</div><div style={{ color: "#666" }}>Registered Office: {form.companyAddress.replace("\n", ", ")}</div>{form.companyPhone && <div style={{ color: "#666" }}>Phone: {form.companyPhone}</div>}{form.companyWebsite && <div style={{ color: "#666" }}>Website: {form.companyWebsite}</div>}</div>);
      case "address-bar":
        return (<div style={{ position: "absolute", bottom: "8mm", left: "22mm", right: "22mm", borderTop: `2px solid ${colors.primary}`, paddingTop: 6, textAlign: "center", fontSize: `${fs - 3.5}pt`, color: colors.accent }}>{form.companyName} | {form.companyAddress.replace("\n", ", ")}{form.companyCIN && <><br />CIN: {form.companyCIN}</>}</div>);
      case "simple-address":
        return (<div style={{ position: "absolute", bottom: "10mm", left: "22mm", right: "22mm", borderTop: `1px solid #ccc`, paddingTop: 6, fontSize: `${fs - 3.5}pt`, color: "#666", textAlign: "center" }}>{form.companyAddress.replace("\n", ", ")}{form.companyPhone ? ` | Tel: ${form.companyPhone}` : ""}</div>);
      case "copyright":
        return (<div style={{ position: "absolute", bottom: "8mm", left: "22mm", right: "22mm", fontSize: `${fs - 4}pt`, color: "#999", textAlign: "center" }}>© {new Date().getFullYear()} {form.companyName}. All rights reserved. Confidential.</div>);
      default: return null;
    }
  };


  // Signature block (no stamp)
  const renderSignAndStamp = () => (
    <div style={{ marginTop: 10, marginBottom: 4 }}>
      <HandwrittenSignature name={form.signatoryName} width={180} height={60} styleIndex={form.signatureStyle} />
    </div>
  );

  // Standard signatory info block (always shows name, designation, company, email)
  const signatoryInfo = () => (
    <div style={{ marginTop: 2 }}>
      <div style={{ fontWeight: 700 }}>{form.signatoryName}</div>
      <div>{form.signatoryDesignation}</div>
      <div>{form.companyName.toUpperCase()}</div>
      {form.companyEmail && <div style={{ fontSize: `${fs - 1}pt` }}>Email: {form.companyEmail}</div>}
    </div>
  );

  const renderSignature = () => {
    const closing = {
      "authorized": `For ${form.companyName}`,
      "yours-truly": "Yours truly,",
      "for-behalf": "Yours faithfully,",
      "ceo-stamp": "Best regards,",
      "principal-stamp": "With regards,",
      "hr-executive": null,
      "sincerely": "Sincerely,",
      "yours-sincerely": "Yours sincerely,",
      "doctor-stamp": "Best Regards,",
      "company-seal": "Thanking you,",
    }[tpl.signStyle] || "Yours sincerely,";

    return (
      <div style={{ marginTop: 36 }}>
        {tpl.signStyle === "hr-executive" && (
          <div style={{ color: colors.primary, fontWeight: 700, fontStyle: "italic", marginBottom: 4 }}>Authorized Signatory</div>
        )}
        {closing && <div>{closing}</div>}
        {renderSignAndStamp()}
        {signatoryInfo()}
      </div>
    );
  };


  // Build body
  const bodyParagraphs = [];
  let opening = `This is to certify that ${title} ${form.employeeName}`;
  if (form.includePassport && form.passportNumber) opening += `, holding passport number ${form.passportNumber},`;
  opening += ` has been working with ${form.companyName.replace(/ (Pvt\.|Private|Ltd\.|Limited|Pte\.)/gi, "")}`;
  opening += ` since ${formatDate(form.joiningDate)}.`;
  opening += ` ${he} is presently designated as <strong>${form.designation}</strong>`;
  opening += ` at <strong>${form.companyName}</strong>.`;
  bodyParagraphs.push(opening);

  if (form.includeEmployeeDetails) {
    let d = `Below are ${his} employment details:<br/><div style="margin: 8px 0 8px 24px;">`;
    d += `● Full Name: ${form.employeeName}<br/>● Designation: ${form.designation}<br/>`;
    if (form.passportNumber) d += `● Passport Number: ${form.passportNumber}<br/>`;
    if (form.annualSalary) d += `● Annual Salary: ${form.annualSalary}<br/>`;
    if (form.monthlySalary) d += `● Monthly Salary: ${form.monthlySalary}<br/>`;
    d += `● Employment Status: Full-time</div>`;
    bodyParagraphs.push(d);
  }
  if (form.includeSalary && !form.includeEmployeeDetails) {
    let sal = "";
    if (form.monthlySalary) sal = `${his.charAt(0).toUpperCase() + his.slice(1)} monthly salary is ${form.monthlySalary}`;
    else if (form.annualSalary) sal = `${his.charAt(0).toUpperCase() + his.slice(1)} annual salary is ${form.annualSalary}`;
    if (sal) { sal += ` and ${he.toLowerCase()} is granted leave from ${formatDate(form.travelFrom)} to ${formatDate(form.travelTo)}.`; bodyParagraphs.push(sal); }
  }
  bodyParagraphs.push(`${title} ${form.employeeName.split(" ").slice(-1)[0]} is planning to travel to <strong>${form.destination}</strong> from <strong>${formatDate(form.travelFrom)}</strong> to <strong>${formatDate(form.travelTo)}</strong> for ${form.travelPurpose}.`);
  bodyParagraphs.push(`We have no objection to ${his} travelling to <strong>${form.destination}</strong>.`);
  if (form.includeExpenseClause) bodyParagraphs.push(`The employee will ensure that the trip does not conflict with the employment terms of the organization and all expenses related to this trip will be borne by the employee.`);
  if (form.includeReturnClause) bodyParagraphs.push(`We confirm that ${title} ${form.employeeName.split(" ").slice(-1)[0]} will return to resume ${his} position as ${form.designation} upon completion of ${his} travel${form.resumeDate ? ` on ${formatDate(form.resumeDate)}` : ""}.`);
  if (form.includeVisaPurpose) bodyParagraphs.push(`This letter is being issued upon ${his} request to support ${his} visa application.`);
  bodyParagraphs.push(`Should you require any further information, please do not hesitate to contact us.`);

  return (
    <div style={pageStyle}>
      {/* Watermark background - company name in large light text */}
      {tpl.watermark && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
          <div style={{ fontSize: "120pt", fontWeight: 900, color: colors.primary, opacity: 0.04, transform: "rotate(-30deg)", whiteSpace: "nowrap", letterSpacing: "8px", userSelect: "none" }}>
            {form.companyName.replace(/\b(Pvt\.?|Private|Ltd\.?|Limited|Pte\.?|Inc\.?|Corp\.?|LLC|LLP|Co\.?)\b/gi, "").trim().split(/\s+/)[0].toUpperCase()}
          </div>
        </div>
      )}
      {tpl.accentBar && tpl.id === "consulting" && (<div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 18, background: `linear-gradient(180deg, ${colors.primary}, ${colors.accent})` }} />)}
      {/* Corner decoration (AR11 style) */}
      {tpl.cornerDecor && (
        <div style={{ position: "absolute", top: 0, right: 0, width: "120px", height: "100%", pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "15%", right: "-30px", width: "200px", height: "200px", border: `2px solid ${colors.primary}`, borderRadius: "50%", opacity: 0.08 }} />
          <div style={{ position: "absolute", top: "35%", right: "-50px", width: "250px", height: "250px", border: `2px solid ${colors.accent}`, borderRadius: "50%", opacity: 0.06 }} />
          <div style={{ position: "absolute", top: "55%", right: "-20px", width: "180px", height: "180px", border: `1.5px solid ${colors.primary}`, borderRadius: "50%", opacity: 0.05 }} />
        </div>
      )}
      {/* Diagonal swoosh (Mid Africa Aviation style) */}
      {tpl.swoosh && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "-20%", right: "-10%", width: "70%", height: "140%", background: `linear-gradient(135deg, transparent 40%, ${colors.primary}08 45%, ${colors.primary}12 50%, transparent 55%)`, transform: "rotate(-15deg)" }} />
        </div>
      )}
      {/* Decorative grid background (PS Astrology style) */}
      {tpl.decorBg && (
        <div style={{ position: "absolute", top: "15%", left: "10%", right: "10%", bottom: "15%", pointerEvents: "none", zIndex: 0 }}>
          <div style={{ width: "100%", height: "100%", border: `1.5px solid ${colors.primary}`, opacity: 0.06, transform: "rotate(45deg)", transformOrigin: "center" }} />
          <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: `1.5px solid ${colors.primary}`, opacity: 0.04 }} />
        </div>
      )}
      {renderHeader()}
      <div style={{ display: "flex", justifyContent: tpl.dateAlign === "left" ? "flex-start" : "flex-end", marginBottom: 16, marginTop: tpl.headerStyle === "dark-bar" ? 0 : 8 }}><div>{formatDate(form.letterDate)}</div></div>
      <div style={{ textAlign: isEmbassy ? "left" : "center", margin: "24px 0 20px 0" }}>
        {isEmbassy ? (<div style={{ whiteSpace: "pre-line", lineHeight: 1.6 }}>{addresseeText}</div>) : (<div style={{ fontWeight: 700, textDecoration: "underline", fontSize: `${fs + 1}pt` }}>{addresseeText}</div>)}
      </div>
      {form.includeSubject && (<div style={{ margin: "16px 0 20px 0" }}><strong>Subject: No Objection Certificate{form.employeeName ? ` – ${title} ${form.employeeName}` : ""}</strong></div>)}
      {(isEmbassy || tpl.addressee.startsWith("Dear")) && !isEmbassy && (<div style={{ marginBottom: 16 }}>Dear Sir/Madam,</div>)}
      {isEmbassy && <div style={{ marginBottom: 16, marginTop: 12 }}><strong>Subject: No Objection Certificate</strong></div>}
      {isEmbassy && <div style={{ marginBottom: 16 }}>Dear Sir/Madam,</div>}
      {bodyParagraphs.map((p, i) => (<div key={i} style={{ marginBottom: 14 }} dangerouslySetInnerHTML={{ __html: p }} />))}
      {renderSignature()}
      {renderFooter()}
    </div>
  );
}

// ─── FORM PANEL ───────────────────────────────────────────

function Field({ label, children, hint }) {
  return (<div style={{ marginBottom: 14 }}><label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>{label}</label>{children}{hint && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{hint}</div>}</div>);
}

const inputStyle = { width: "100%", padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box", background: "#fff", outline: "none" };
const selectStyle = { ...inputStyle, appearance: "auto" };
const checkStyle = { display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 13, cursor: "pointer", color: "#374151" };

// Generate candidate domains from a company name
function domainCandidates(companyName) {
  const stop = /\b(pvt|private|ltd|limited|pte|inc|corp|llc|llp|co|the|of|and|for|centre|center|training|computer|institute|services|solutions|technologies|tech|systems|enterprises|industries|group|netcafe|cafe|net)\b/gi;
  const words = companyName.replace(stop, " ").replace(/[^a-z0-9\s]/gi, " ").trim().split(/\s+/).filter(Boolean);
  const candidates = new Set();
  if (words.length === 0) return [];
  candidates.add(words.join("").toLowerCase());
  if (words.length >= 2) candidates.add((words[0] + words[1]).toLowerCase());
  candidates.add(words[0].toLowerCase());
  if (words.length >= 2) candidates.add(words.map(w => w[0]).join("").toLowerCase());
  const tlds = [".com", ".in", ".co.in", ".net", ".org"];
  const domains = [];
  for (const c of candidates) if (c.length >= 3) for (const t of tlds) domains.push(c + t);
  return domains;
}

async function tryFetchLogo(domain) {
  const sources = [
    `https://img.logo.dev/${domain}?token=pk_anonymous&size=200&format=png`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
    `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128`,
  ];
  for (const src of sources) {
    const ok = await new Promise(res => {
      const img = new Image();
      img.onload = () => res(img.naturalWidth >= 32);
      img.onerror = () => res(false);
      setTimeout(() => res(false), 3000);
      img.src = src;
    });
    if (ok) return domain;
  }
  return null;
}

function FormPanel({ form, setForm }) {
  const u = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const [section, setSection] = useState("payslip");
  const [payslipStatus, setPayslipStatus] = useState(""); // "", "parsing", "done", or error message
  const [parsedFields, setParsedFields] = useState(null);

  const [logoSource, setLogoSource] = useState(""); // "payslip" | "website" | "generated"

  const parsePayslip = async (file) => {
    setPayslipStatus("parsing");
    setParsedFields(null);
    setLogoSource("");
    setForm(f => ({ ...f, uploadedLogo: null })); // clear any old logo
    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(",")[1]);
        r.onerror = () => rej(new Error("Read failed"));
        r.readAsDataURL(file);
      });

      const mediaType = file.type === "application/pdf" ? "application/pdf"
        : file.type.startsWith("image/") ? file.type : "image/png";

      const response = await fetch("/api/parse-payslip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64, mediaType }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Server error ${response.status}`);

      const { fields, logoBbox } = data;
      setParsedFields(fields);

      // Logo priority: 1) crop from payslip  2) website favicon  3) generated
      const cropLogo = (imgCanvas, W, H) => {
        const pad = 5;
        const sx = (logoBbox.x / 100) * W;
        const sy = (logoBbox.y / 100) * H;
        const sw = (logoBbox.width / 100) * W;
        const sh = (logoBbox.height / 100) * H;
        const out = document.createElement("canvas");
        out.width = sw + pad * 2;
        out.height = sh + pad * 2;
        const ctx = out.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, out.width, out.height);
        ctx.drawImage(imgCanvas, sx - pad, sy - pad, sw + pad * 2, sh + pad * 2, 0, 0, out.width, out.height);
        setForm(f => ({ ...f, uploadedLogo: out.toDataURL("image/png") }));
        setLogoSource("payslip");
      };

      if (logoBbox && logoBbox.width > 0 && mediaType.startsWith("image/")) {
        const img = new Image();
        img.onload = () => cropLogo(img, img.width, img.height);
        img.src = `data:${mediaType};base64,${base64}`;
      } else if (logoBbox && logoBbox.width > 0 && mediaType === "application/pdf") {
        // Render first page of PDF with pdf.js, then crop logo
        (async () => {
          try {
            if (!window.pdfjsLib) {
              await new Promise((res, rej) => {
                const s = document.createElement("script");
                s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
                s.onload = res; s.onerror = rej;
                document.head.appendChild(s);
              });
              window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
            }
            const pdfData = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
            const pdf = await window.pdfjsLib.getDocument({ data: pdfData }).promise;
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 2 });
            const canvas = document.createElement("canvas");
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
            cropLogo(canvas, canvas.width, canvas.height);
          } catch (_) {
            setLogoSource(fields.companyWebsite ? "website" : "generated");
          }
        })();
      } else {
        setLogoSource("searching");
        const companyName = fields.companyName || "";

        // 1. Check logo library (known companies)
        const libResult = await logoManager.get_logo(companyName);
        if (libResult) {
          setForm(f => ({ ...f, uploadedLogo: libResult.url, logoMode: "auto" }));
          setLogoSource("library");
        } else if (fields.companyWebsite) {
          // 2. Use website from payslip
          setLogoSource("website");
        } else {
          // 3. Try domain patterns from company name
          const domains = domainCandidates(companyName);
          let found = null;
          for (const d of domains) {
            found = await tryFetchLogo(d);
            if (found) break;
          }
          if (found) {
            setForm(f => ({ ...f, companyWebsite: found }));
            setLogoSource("website");
          } else {
            // 4. Prompt user
            setLogoSource("manual");
          }
        }
      }

      // Auto-fill form fields
      setForm(f => {
        const u = { ...f };
        if (fields.employeeName) u.employeeName = fields.employeeName;
        if (fields.designation) u.designation = fields.designation;
        if (fields.companyName) u.companyName = fields.companyName;
        if (fields.companyAddress) u.companyAddress = fields.companyAddress;
        if (fields.joiningDate) u.joiningDate = fields.joiningDate;
        if (fields.monthlySalary) u.monthlySalary = fields.monthlySalary;
        if (fields.annualSalary) u.annualSalary = fields.annualSalary;
        if (fields.employeeGender) u.employeeGender = fields.employeeGender;
        if (fields.companyWebsite) u.companyWebsite = fields.companyWebsite;
        if (fields.companyCIN) u.companyCIN = fields.companyCIN;
        return u;
      });
      setPayslipStatus("done");
    } catch (err) {
      console.error("Payslip parse error:", err);
      setPayslipStatus(err.message || "Unknown error");
    }
  };

  const sections = [
    { id: "payslip", label: "Payslip" },
    { id: "template", label: "Template" },
    { id: "company", label: "Company" },
    { id: "employee", label: "Employee" },
    { id: "travel", label: "Travel" },
    { id: "options", label: "Options" },
    { id: "signatory", label: "Signatory" },
  ];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: "10px 14px 6px", borderBottom: "1px solid #e5e7eb", background: "#f9fafb" }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)} style={{
            padding: "5px 11px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer",
            background: section === s.id ? "#1e40af" : "transparent", color: section === s.id ? "#fff" : "#6b7280", transition: "all 0.15s"
          }}>{s.label}</button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 60px" }}>
        {section === "payslip" && <>
          <Field label="Upload Payslip" hint="Upload a payslip (PDF or image) to auto-fill employee name, company, designation, salary, etc.">
            <label style={{ display: "block", padding: "14px 16px", background: "#f0f4ff", border: "2px dashed #93b4f5", borderRadius: 8, textAlign: "center", cursor: "pointer" }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>📄</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1e40af" }}>Click to upload payslip</div>
              <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>PDF, PNG, JPG supported</div>
              <input type="file" accept=".pdf,image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files[0]; if (f) parsePayslip(f); }} />
            </label>
          </Field>
          {payslipStatus === "parsing" && (
            <div style={{ padding: "12px 14px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, fontSize: 13, color: "#92400e", display: "flex", alignItems: "center", gap: 8 }}>
              <span>⏳</span> Parsing payslip with Gemini...
            </div>
          )}
          {payslipStatus && payslipStatus !== "parsing" && payslipStatus !== "done" && (
            <div style={{ padding: "12px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, fontSize: 13, color: "#991b1b" }}>
              Error: {payslipStatus}
            </div>
          )}
          {payslipStatus === "done" && parsedFields && (
            <div style={{ padding: "12px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, fontSize: 12, color: "#166534" }}>
              <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 13 }}>✅ Parsed successfully!</div>
              {logoSource === "searching" && (
                <div style={{ marginBottom: 8, fontSize: 12, color: "#92400e", background: "#fffbeb", borderRadius: 5, padding: "6px 10px" }}>
                  🔍 Searching logo library and web...
                </div>
              )}
              {logoSource === "payslip" && (
                <div style={{ marginBottom: 8, fontSize: 12, color: "#0369a1", background: "#e0f2fe", borderRadius: 5, padding: "6px 10px" }}>
                  🖼 Logo extracted from payslip
                </div>
              )}
              {logoSource === "library" && (
                <div style={{ marginBottom: 8, fontSize: 12, color: "#166534", background: "#f0fdf4", borderRadius: 5, padding: "6px 10px" }}>
                  📚 Logo matched from company library
                </div>
              )}
              {logoSource === "website" && (
                <div style={{ marginBottom: 8, fontSize: 12, color: "#0369a1", background: "#e0f2fe", borderRadius: 5, padding: "6px 10px" }}>
                  🌐 Logo fetched from company website
                </div>
              )}
              {logoSource === "generated" && (
                <div style={{ marginBottom: 8, fontSize: 12, color: "#6b7280", background: "#f3f4f6", borderRadius: 5, padding: "6px 10px" }}>
                  ✨ Logo auto-generated from initials
                </div>
              )}
              {logoSource === "manual" && (
                <div style={{ marginBottom: 8, fontSize: 13, background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ fontWeight: 700, color: "#92400e", marginBottom: 8 }}>⚠️ Company logo not found in library.</div>
                  <div style={{ color: "#78350f", marginBottom: 10, fontSize: 12 }}>Choose an option:</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <button onClick={() => setSection("company")} style={{ padding: "7px 12px", background: "#1e40af", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", textAlign: "left" }}>
                      1. Upload logo file → Company tab
                    </button>
                    <button onClick={() => setForm(f => ({ ...f, logoMode: "text-only" }))} style={{ padding: "7px 12px", background: "#f9fafb", color: "#374151", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", textAlign: "left" }}>
                      2. Use text-only header (recommended)
                    </button>
                    <button onClick={() => setForm(f => ({ ...f, logoMode: "skip" }))} style={{ padding: "7px 12px", background: "#f9fafb", color: "#6b7280", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 12, cursor: "pointer", textAlign: "left" }}>
                      3. Skip logo
                    </button>
                  </div>
                </div>
              )}
              {Object.entries(parsedFields).filter(([k, v]) => v && k !== "hasLogo" && k !== "logoPosition").map(([k, v]) => (
                <div key={k} style={{ marginBottom: 2 }}><span style={{ fontWeight: 600, color: "#374151" }}>{k}:</span> {String(v)}</div>
              ))}
              <div style={{ marginTop: 8, fontSize: 11, color: "#6b7280" }}>Override any field in Company/Employee tabs.</div>
            </div>
          )}
        </>}
        {section === "template" && <>
          <Field label="Layout Template"><select value={form.template} onChange={u("template")} style={selectStyle}>{COMPANY_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}</select></Field>
          <Field label="Font"><select value={form.font} onChange={u("font")} style={selectStyle}>{FONTS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}</select></Field>
          <Field label="Font Size (pt)"><input type="range" min="9" max="14" value={form.fontSize} onChange={u("fontSize")} style={{ width: "100%" }} /><div style={{ textAlign: "center", fontSize: 12, color: "#6b7280" }}>{form.fontSize}pt</div></Field>
          <Field label="Letter Date"><input type="date" value={form.letterDate} onChange={u("letterDate")} style={inputStyle} /></Field>
          <Field label="Addressed To"><select value={form.addressedTo} onChange={u("addressedTo")} style={selectStyle}><option value="generic">Generic (To Whomsoever...)</option><option value="embassy">Embassy / High Commission</option><option value="custom">Custom</option></select></Field>
          {form.addressedTo === "custom" && (<Field label="Custom Addressee"><textarea value={form.customAddressee} onChange={u("customAddressee")} rows={3} style={{ ...inputStyle, resize: "vertical" }} /></Field>)}
        </>}
        {section === "company" && <>
          <Field label="Company Name"><input value={form.companyName} onChange={u("companyName")} style={inputStyle} /></Field>
          <Field label="Company Address"><textarea value={form.companyAddress} onChange={u("companyAddress")} rows={3} style={{ ...inputStyle, resize: "vertical" }} /></Field>
          <Field label="Phone"><input value={form.companyPhone} onChange={u("companyPhone")} style={inputStyle} /></Field>
          <Field label="Email"><input value={form.companyEmail} onChange={u("companyEmail")} style={inputStyle} /></Field>
          <Field label="Website" hint="Logo is auto-fetched from this. If not found, a logo is auto-generated."><input value={form.companyWebsite} onChange={u("companyWebsite")} style={inputStyle} placeholder="e.g. dlf.in or www.goindigo.in" /></Field>
          <Field label="Company Logo" hint="Upload for best results. Overrides auto-fetch.">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <label style={{ padding: "7px 14px", background: "#1e40af", color: "#fff", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                Upload Logo
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) { const reader = new FileReader(); reader.onload = (ev) => setForm(f => ({ ...f, uploadedLogo: ev.target.result })); reader.readAsDataURL(file); }
                }} />
              </label>
              {form.uploadedLogo && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <img src={form.uploadedLogo} alt="logo" style={{ width: 32, height: 32, objectFit: "contain", border: "1px solid #e5e7eb", borderRadius: 4 }} />
                  <button onClick={() => setForm(f => ({ ...f, uploadedLogo: "" }))} style={{ background: "none", border: "none", color: "#ef4444", fontSize: 16, cursor: "pointer", padding: 2 }} title="Remove">✕</button>
                </div>
              )}
            </div>
          </Field>
          <Field label={`Logo Size: ${form.logoWidth}×${form.logoHeight}px`}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 2 }}>Width</div>
                <input type="range" min="30" max="150" value={form.logoWidth} onChange={u("logoWidth")} style={{ width: "100%" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 2 }}>Height</div>
                <input type="range" min="25" max="100" value={form.logoHeight} onChange={u("logoHeight")} style={{ width: "100%" }} />
              </div>
            </div>
          </Field>
          <Field label="CIN"><input value={form.companyCIN} onChange={u("companyCIN")} style={inputStyle} /></Field>
          <Field label="GST Number"><input value={form.companyGST} onChange={u("companyGST")} style={inputStyle} /></Field>
        </>}
        {section === "employee" && <>
          <Field label="Employee Name"><input value={form.employeeName} onChange={u("employeeName")} style={inputStyle} /></Field>
          <Field label="Gender"><select value={form.employeeGender} onChange={u("employeeGender")} style={selectStyle}><option value="male">Male</option><option value="female">Female</option></select></Field>
          <Field label="Designation"><input value={form.designation} onChange={u("designation")} style={inputStyle} /></Field>
          <Field label="Joining Date"><input type="date" value={form.joiningDate} onChange={u("joiningDate")} style={inputStyle} /></Field>
          <Field label="Passport Number" hint="Optional"><input value={form.passportNumber} onChange={u("passportNumber")} style={inputStyle} placeholder="e.g. R5670446" /></Field>
          <Field label="Annual Salary" hint="Optional"><input value={form.annualSalary} onChange={u("annualSalary")} style={inputStyle} placeholder="e.g. INR 12,00,000" /></Field>
          <Field label="Monthly Salary" hint="Optional"><input value={form.monthlySalary} onChange={u("monthlySalary")} style={inputStyle} placeholder="e.g. INR 1,43,250" /></Field>
        </>}
        {section === "travel" && <>
          <Field label="Destination Country"><input value={form.destination} onChange={u("destination")} style={inputStyle} /></Field>
          <Field label="Travel Purpose"><select value={form.travelPurpose} onChange={u("travelPurpose")} style={selectStyle}><option value="personal tourism">Personal Tourism</option><option value="leisure and tourism purposes">Leisure & Tourism</option><option value="a personal visit">Personal Visit</option><option value="personal reasons">Personal Reasons</option><option value="business and personal travel">Business & Personal</option></select></Field>
          <Field label="Travel From"><input type="date" value={form.travelFrom} onChange={u("travelFrom")} style={inputStyle} /></Field>
          <Field label="Travel To"><input type="date" value={form.travelTo} onChange={u("travelTo")} style={inputStyle} /></Field>
          <Field label="Resume Work Date"><input type="date" value={form.resumeDate} onChange={u("resumeDate")} style={inputStyle} /></Field>
        </>}
        {section === "options" && <>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 10 }}>Include in Letter</div>
          <label style={checkStyle}><input type="checkbox" checked={form.includeSubject} onChange={u("includeSubject")} /> Subject Line</label>
          <label style={checkStyle}><input type="checkbox" checked={form.includePassport} onChange={u("includePassport")} /> Passport Number</label>
          <label style={checkStyle}><input type="checkbox" checked={form.includeSalary} onChange={u("includeSalary")} /> Salary (inline)</label>
          <label style={checkStyle}><input type="checkbox" checked={form.includeEmployeeDetails} onChange={u("includeEmployeeDetails")} /> Employee Details Block</label>
          <label style={checkStyle}><input type="checkbox" checked={form.includeExpenseClause} onChange={u("includeExpenseClause")} /> Expense Responsibility Clause</label>
          <label style={checkStyle}><input type="checkbox" checked={form.includeReturnClause} onChange={u("includeReturnClause")} /> Return-to-Work Clause</label>
          <label style={checkStyle}><input type="checkbox" checked={form.includeVisaPurpose} onChange={u("includeVisaPurpose")} /> "Issued for Visa" Clause</label>
        </>}
        {section === "signatory" && <>
          <Field label="Signatory Name"><input value={form.signatoryName} onChange={u("signatoryName")} style={inputStyle} /></Field>
          <Field label="Signatory Designation"><input value={form.signatoryDesignation} onChange={u("signatoryDesignation")} style={inputStyle} /></Field>
        </>}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────

export default function NOCGenerator() {
  const [form, setForm] = useState(() => loadForm(defaultForm));
  const previewRef = useRef();

  // Fix #5: Save form to localStorage on every change
  useEffect(() => { saveForm(form); }, [form]);

  const randomize = useCallback(() => {
    const templates = COMPANY_TEMPLATES.map(t => t.id);
    const fonts = FONTS.map(f => f.id);
    setForm(f => ({
      ...f,
      template: templates[Math.floor(Math.random() * templates.length)],
      font: fonts[Math.floor(Math.random() * fonts.length)],
      fontSize: String(Math.floor(Math.random() * 4) + 10),
      includeSubject: Math.random() > 0.5,
      includePassport: Math.random() > 0.6,
      includeSalary: Math.random() > 0.6,
      includeEmployeeDetails: Math.random() > 0.7,
      includeExpenseClause: Math.random() > 0.4,
      includeReturnClause: Math.random() > 0.3,
      includeVisaPurpose: Math.random() > 0.3,
      addressedTo: ["generic", "generic", "embassy"][Math.floor(Math.random() * 3)],
      signatureStyle: String(Math.floor(Math.random() * 16)),
    }));
  }, []);

  const resetForm = useCallback(() => {
    setForm(defaultForm);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const downloadPDF = useCallback(() => {
    const el = previewRef.current;
    if (!el) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) { alert("Please allow popups to download PDF"); return; }
    const canvases = el.querySelectorAll("canvas");
    const canvasImages = [];
    canvases.forEach((c, i) => {
      const img = document.createElement("img");
      img.src = c.toDataURL("image/png");
      img.style.width = c.style.width;
      img.style.height = c.style.height;
      img.style.display = "block";
      img.dataset.canvasIdx = i;
      canvasImages.push({ canvas: c, img });
    });
    // Replace canvases with images for print
    canvasImages.forEach(({ canvas, img }) => canvas.parentNode.replaceChild(img, canvas));
    const html = el.innerHTML;
    // Restore canvases
    canvasImages.forEach(({ canvas, img }) => img.parentNode.replaceChild(canvas, img));
    
    printWindow.document.write(`<!DOCTYPE html><html><head><title>NOC - ${form.employeeName}</title>
      <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&family=Great+Vibes&family=Caveat:wght@400;700&family=Satisfy&family=Kalam:wght@400;700&family=Sacramento&family=Pacifico&family=Indie+Flower&display=swap" rel="stylesheet">
      <style>
        @page { size: A4; margin: 0; }
        body { margin: 0; padding: 0; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style></head><body>${html}</body></html>`);
    printWindow.document.close();
    setTimeout(() => { printWindow.focus(); printWindow.print(); setTimeout(() => printWindow.close(), 1500); }, 800);
  }, [form.employeeName]);

  const downloadDOCX = useCallback(() => {
    const he = form.employeeGender === "female" ? "She" : "He";
    const his = form.employeeGender === "female" ? "her" : "his";
    const title = form.employeeGender === "female" ? "Ms." : "Mr.";
    
    const fDate = (ds) => {
      if (!ds) return "";
      const d = new Date(ds + "T00:00:00");
      const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
      const day = d.getDate();
      const suf = day === 1 || day === 21 || day === 31 ? "st" : day === 2 || day === 22 ? "nd" : day === 3 || day === 23 ? "rd" : "th";
      return `${day}${suf} ${months[d.getMonth()]} ${d.getFullYear()}`;
    };

    // Get signature as base64 image
    const sigCanvas = previewRef.current?.querySelector("canvas");
    const sigImg = sigCanvas ? sigCanvas.toDataURL("image/png") : "";

    // Build clean paragraphs
    let bodyHtml = "";
    const p = (text, style = "") => { bodyHtml += `<p style="font-family:Calibri,sans-serif;font-size:11pt;line-height:1.6;margin:0 0 8pt 0;${style}">${text}</p>`; };
    const pBold = (text, style = "") => p(`<b>${text}</b>`, style);

    // Date
    p(fDate(form.letterDate), "margin-bottom:16pt;");
    
    // Addressee
    if (form.addressedTo === "embassy") {
      p("The Visa Officer<br>Australian High Commission<br>New Delhi, India", "margin-bottom:12pt;");
      pBold("Subject: No Objection Certificate", "margin-bottom:12pt;");
      p("Dear Sir/Madam,", "margin-bottom:12pt;");
    } else {
      pBold("To Whomsoever It May Concern", "text-align:center;text-decoration:underline;font-size:12pt;margin-bottom:16pt;");
    }

    if (form.includeSubject) {
      pBold(`Subject: No Objection Certificate – ${title} ${form.employeeName}`, "margin-bottom:12pt;");
    }

    // Body
    let opening = `This is to certify that ${title} ${form.employeeName}`;
    if (form.includePassport && form.passportNumber) opening += `, holding passport number ${form.passportNumber},`;
    opening += ` has been working with ${form.companyName} since ${fDate(form.joiningDate)}.`;
    opening += ` ${he} is presently designated as <b>${form.designation}</b> at <b>${form.companyName}</b>.`;
    p(opening);

    p(`${title} ${form.employeeName.split(" ").slice(-1)[0]} is planning to travel to <b>${form.destination}</b> from <b>${fDate(form.travelFrom)}</b> to <b>${fDate(form.travelTo)}</b> for ${form.travelPurpose}.`);

    p(`We have no objection to ${his} travelling to <b>${form.destination}</b>.`);

    if (form.includeExpenseClause) p("The employee will ensure that the trip does not conflict with the employment terms of the organization and all expenses related to this trip will be borne by the employee.");
    if (form.includeReturnClause) p(`We confirm that ${title} ${form.employeeName.split(" ").slice(-1)[0]} will return to resume ${his} position as ${form.designation} upon completion of ${his} travel${form.resumeDate ? ` on ${fDate(form.resumeDate)}` : ""}.`);
    if (form.includeVisaPurpose) p(`This letter is being issued upon ${his} request to support ${his} visa application.`);
    p("Should you require any further information, please do not hesitate to contact us.");

    // Closing
    p("<br>Yours sincerely,", "margin-top:16pt;");
    
    // Signature image
    if (sigImg) {
      bodyHtml += `<p style="margin:8pt 0;"><img src="${sigImg}" width="160" height="55" style="display:block;" /></p>`;
    }

    // Signatory info
    pBold(form.signatoryName);
    p(form.signatoryDesignation);
    p(form.companyName.toUpperCase());
    if (form.companyEmail) p(`Email: ${form.companyEmail}`);

    const docContent = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>NOC - ${form.employeeName}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->
<style>
  @page { size: A4; margin: 25mm 22mm 25mm 22mm; }
  body { font-family: Calibri, sans-serif; font-size: 11pt; color: #222; line-height: 1.6; margin: 0; padding: 0; }
  p { margin: 0 0 8pt 0; }
  table { border-collapse: collapse; }
</style>
</head><body>${bodyHtml}</body></html>`;

    const blob = new Blob(["\ufeff" + docContent], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `NOC_${form.employeeName.replace(/\s+/g, "_")}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [form]);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#f1f5f9", color: "#1e293b" }}>
      <div style={{ background: "linear-gradient(135deg, #0f172a, #1e3a5f)", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "#3b82f6", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14 }}>N</div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>NOC Generator</div>
            <div style={{ color: "#94a3b8", fontSize: 11 }}>10 layouts · Smart logo · 16 signature styles</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={resetForm} style={{ padding: "7px 14px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, color: "#fca5a5", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Reset</button>
          <button onClick={randomize} style={{ padding: "7px 14px", background: "rgba(59,130,246,0.2)", border: "1px solid rgba(59,130,246,0.4)", borderRadius: 8, color: "#93c5fd", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Shuffle</button>
          <button onClick={downloadPDF} style={{ padding: "7px 14px", background: "rgba(34,197,94,0.2)", border: "1px solid rgba(34,197,94,0.4)", borderRadius: 8, color: "#86efac", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>⬇ PDF</button>
          <button onClick={downloadDOCX} style={{ padding: "7px 14px", background: "rgba(168,85,247,0.2)", border: "1px solid rgba(168,85,247,0.4)", borderRadius: 8, color: "#c4b5fd", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>⬇ DOC</button>
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
        <div style={{ width: 360, flexShrink: 0, background: "#fff", borderRight: "1px solid #e2e8f0", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <FormPanel form={form} setForm={setForm} />
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: 24, display: "flex", justifyContent: "center" }}>
          <div style={{ transform: "scale(0.72)", transformOrigin: "top center", marginBottom: -200 }}>
            <div ref={previewRef}>
              <NOCPreview form={form} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
