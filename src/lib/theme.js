// Theme system for 3/6/9.
// Appearance is stored on the user record as individual fields:
//   theme (light|dark|system), primary, background, textOnPrimary,
//   radius, font, timezone, onboarded
// `primary` is either a preset key (e.g. "violet") or a custom color string
// (e.g. "#7c3aed" or "262 83% 58%"). One color drives the whole brand.

export const ACCENTS = {
  violet: {
    key: "violet",
    name: "Violet",
    channels: "262 83% 58%",
    foreground: "0 0% 100%",
  },
  blue: {
    key: "blue",
    name: "Blue",
    channels: "217 91% 60%",
    foreground: "0 0% 100%",
  },
  emerald: {
    key: "emerald",
    name: "Emerald",
    channels: "152 76% 40%",
    foreground: "0 0% 100%",
  },
  amber: {
    key: "amber",
    name: "Amber",
    channels: "38 92% 50%",
    foreground: "20 14% 12%",
  },
  rose: {
    key: "rose",
    name: "Rose",
    channels: "347 77% 60%",
    foreground: "0 0% 100%",
  },
  cyan: {
    key: "cyan",
    name: "Cyan",
    channels: "190 90% 42%",
    foreground: "0 0% 100%",
  },
  orange: {
    key: "orange",
    name: "Orange",
    channels: "25 95% 53%",
    foreground: "20 14% 12%",
  },
  teal: {
    key: "teal",
    name: "Teal",
    channels: "173 80% 40%",
    foreground: "0 0% 100%",
  },
  pink: {
    key: "pink",
    name: "Pink",
    channels: "330 81% 60%",
    foreground: "0 0% 100%",
  },
  indigo: {
    key: "indigo",
    name: "Indigo",
    channels: "243 75% 59%",
    foreground: "0 0% 100%",
  },
};
export const ACCENT_KEYS = Object.keys(ACCENTS);

// Two fonts: a clean sans and an editorial serif.
export const FONTS = {
  inter: {
    key: "inter",
    name: "Inter",
    vibe: "Clean",
    stack: "'Inter', ui-sans-serif, system-ui, sans-serif",
  },
  fraunces: {
    key: "fraunces",
    name: "Fraunces",
    vibe: "Editorial",
    stack: "'Fraunces', Georgia, serif",
  },
};
export const FONT_KEYS = Object.keys(FONTS);

export const RADIUS = {
  sharp: { key: "sharp", name: "Sharp", value: "0.25rem" },
  soft: { key: "soft", name: "Soft", value: "0.75rem" },
  round: { key: "round", name: "Round", value: "1.5rem" },
};
export const RADIUS_KEYS = Object.keys(RADIUS);
export const DEFAULT_RADIUS = "soft";

export const DEFAULT_APPEARANCE = {
  theme: "light",
  primary: "violet",
  background: "default",
  textOnPrimary: "auto",
  radius: DEFAULT_RADIUS,
  font: "inter",
};

function hexToHsl(hex) {
  const m = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i.exec((hex || "").trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3)
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let s = 0;
  let hh = 0;
  const l = (max + min) / 2;
  if (d) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        hh = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        hh = (b - r) / d + 2;
        break;
      default:
        hh = (r - g) / d + 4;
        break;
    }
    hh *= 60;
  }
  return {
    channels: `${Math.round(hh)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`,
    l,
  };
}

export function hexToChannels(hex) {
  const hsl = hexToHsl(hex);
  return hsl ? hsl.channels : null;
}

// Resolve a color value (preset key, hex, or hsl channels) into a descriptor.
export function resolveColor(value) {
  if (!value) return ACCENTS.violet;
  if (ACCENTS[value]) return ACCENTS[value];
  if (typeof value === "string" && value.startsWith("#")) {
    const hsl = hexToHsl(value);
    if (hsl) {
      return {
        key: "custom",
        name: "Custom",
        channels: hsl.channels,
        l: hsl.l,
        foreground: hsl.l > 0.6 ? "0 0% 0%" : "0 0% 100%",
      };
    }
  }
  if (typeof value === "string" && value.includes("%")) {
    const parts = value.split(/\s+/);
    const l = parts[2] ? parseFloat(parts[2]) / 100 : 0.5;
    return {
      key: "custom",
      name: "Custom",
      channels: value,
      l,
      foreground: l > 0.6 ? "0 0% 0%" : "0 0% 100%",
    };
  }
  return ACCENTS.violet;
}

export function getAccent(key) {
  return resolveColor(key);
}

export function isPresetColor(value) {
  return !!ACCENTS[value];
}

export function prefersDark() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

export function detectTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

// Read the appearance object from a user record. Custom fields are stored at
// the top level of the user object (e.g. user.theme, user.onboarded), not
// nested under a `data` key. `accent` is a legacy fallback -> `primary`.
export function readAppearance(user) {
  const u = user || {};
  return {
    theme: u.theme || DEFAULT_APPEARANCE.theme,
    primary: u.primary || u.accent || DEFAULT_APPEARANCE.primary,
    background: u.background || DEFAULT_APPEARANCE.background,
    textOnPrimary: u.textOnPrimary || DEFAULT_APPEARANCE.textOnPrimary,
    radius: u.radius || DEFAULT_APPEARANCE.radius,
    font: u.font || DEFAULT_APPEARANCE.font,
  };
}

export function applyAppearance(appearance) {
  const a = { ...DEFAULT_APPEARANCE, ...appearance };
  const root = document.documentElement;
  const dark = a.theme === "dark" || (a.theme === "system" && prefersDark());
  root.classList.toggle("dark", dark);

  const p = resolveColor(a.primary);
  root.style.setProperty("--primary", p.channels);
  root.style.setProperty("--ring", p.channels);
  root.style.setProperty("--brand", p.channels);
  // Keep --accent2 aliased to the single brand color so any legacy reference
  // still resolves consistently (one color drives everything).
  root.style.setProperty("--accent2", p.channels);
  root.style.setProperty("--accent2-foreground", p.foreground);
  const pfg =
    a.textOnPrimary && a.textOnPrimary !== "auto"
      ? hexToChannels(a.textOnPrimary) || p.foreground
      : p.foreground;
  root.style.setProperty("--primary-foreground", pfg);
  root.style.setProperty("--brand-foreground", pfg);

  if (a.background && a.background !== "default") {
    const bg = hexToHsl(a.background);
    if (bg) {
      root.style.setProperty("--background", bg.channels);
      root.style.setProperty(
        "--foreground",
        bg.l > 0.5 ? "0 0% 0%" : "0 0% 100%",
      );
    }
  } else {
    root.style.removeProperty("--background");
    root.style.removeProperty("--foreground");
  }

  const r = RADIUS[a.radius] || RADIUS[DEFAULT_RADIUS];
  root.style.setProperty("--radius", r.value);

  const f = FONTS[a.font] || FONTS.inter;
  root.style.setProperty("--font-body", f.stack);
  root.style.setProperty("--font-heading", f.stack);
  // The display/wordmark font is left to the stylesheet default (Fraunces) so
  // the editorial heading look persists; picking Fraunces makes body match it.
  if (a.font === "fraunces") {
    root.style.setProperty("--font-display", f.stack);
  } else {
    root.style.removeProperty("--font-display");
  }
}

// hsl() background for a timeline intensity level (0-4); -1 = unplanned, which
// still renders a faint visible box so every day reads as a cell.
export function intensityColor(color, level) {
  const a = resolveColor(color);
  if (level === -1) return "hsl(var(--muted-foreground) / 0.12)";
  const opacities = { 0: 0.14, 1: 0.34, 2: 0.56, 3: 0.76, 4: 1 };
  const o = opacities[level] ?? 0;
  return `hsl(${a.channels} / ${o})`;
}
