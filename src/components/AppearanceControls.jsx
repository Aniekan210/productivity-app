import React from "react";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import {
  ACCENTS,
  ACCENT_KEYS,
  FONTS,
  FONT_KEYS,
  RADIUS,
  RADIUS_KEYS,
  resolveColor,
  isPresetColor,
} from "@/lib/theme";
import { cn } from "@/lib/utils";

const MODES = [
  { key: "light", label: "Light", icon: Sun },
  { key: "dark", label: "Dark", icon: Moon },
  { key: "system", label: "System", icon: Monitor },
];

function Swatches({ value, onChange }) {
  const preset = isPresetColor(value);
  const swatchBg = preset
    ? `hsl(${ACCENTS[value].channels})`
    : `hsl(${resolveColor(value).channels})`;
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {ACCENT_KEYS.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => onChange(k)}
          title={ACCENTS[k].name}
          aria-label={ACCENTS[k].name}
          className={cn(
            "grid h-9 w-9 place-items-center rounded-full transition-transform hover:scale-110",
            value === k &&
              "ring-2 ring-ring ring-offset-2 ring-offset-background",
          )}
          style={{ background: `hsl(${ACCENTS[k].channels})` }}
        >
          {value === k && <Check className="h-3.5 w-3.5 text-white" />}
        </button>
      ))}
      <label
        title="Custom color"
        className={cn(
          "relative grid h-9 w-9 cursor-pointer place-items-center rounded-full transition-transform hover:scale-110",
          !preset && "ring-2 ring-ring ring-offset-2 ring-offset-background",
        )}
        style={{ background: swatchBg }}
      >
        <input
          type="color"
          value={preset ? "#7c3aed" : value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label="Custom color"
        />
        {!preset ? (
          <Check className="h-3.5 w-3.5 text-white" />
        ) : (
          <span className="text-base font-semibold leading-none text-white drop-shadow">
            +
          </span>
        )}
      </label>
    </div>
  );
}

function Section({ title, hint, children }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">{title}</p>
      {hint && <p className="mb-2.5 text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

export default function AppearanceControls({ value, onChange }) {
  const v = value;
  const set = (patch) => onChange(patch);

  return (
    <div className="space-y-5">
      <Section title="Theme">
        <div className="grid grid-cols-3 gap-3">
          {MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => set({ theme: m.key })}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all",
                v.theme === m.key
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/40",
              )}
            >
              <m.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{m.label}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section
        title="Color"
        hint="Buttons, the timeline, badges — your one brand color."
      >
        <Swatches value={v.primary} onChange={(c) => set({ primary: c })} />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="text-xs text-muted-foreground">Text on color:</span>
          <button
            type="button"
            onClick={() => set({ textOnPrimary: "auto" })}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs",
              v.textOnPrimary === "auto"
                ? "border-primary bg-primary/5"
                : "border-border",
            )}
          >
            Auto
          </button>
          <label
            className={cn(
              "relative grid h-7 w-7 cursor-pointer place-items-center rounded-md border",
              v.textOnPrimary !== "auto" ? "border-primary" : "border-border",
            )}
            style={{
              background:
                v.textOnPrimary !== "auto"
                  ? v.textOnPrimary
                  : "hsl(var(--muted))",
            }}
            title="Custom text color"
          >
            <input
              type="color"
              value={v.textOnPrimary !== "auto" ? v.textOnPrimary : "#ffffff"}
              onChange={(e) => set({ textOnPrimary: e.target.value })}
              className="absolute inset-0 cursor-pointer opacity-0"
              aria-label="Custom text color"
            />
          </label>
          {v.textOnPrimary !== "auto" && (
            <button
              type="button"
              onClick={() => set({ textOnPrimary: "auto" })}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              reset
            </button>
          )}
        </div>
      </Section>

      <Section title="Background" hint="The canvas behind your cards.">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => set({ background: "default" })}
            className={cn(
              "rounded-md border px-3 py-1.5 text-xs",
              v.background === "default"
                ? "border-primary bg-primary/5"
                : "border-border",
            )}
          >
            Default
          </button>
          <label
            className={cn(
              "relative grid h-9 w-9 cursor-pointer place-items-center rounded-full border",
              v.background !== "default" ? "border-primary" : "border-border",
            )}
            style={{
              background:
                v.background !== "default" ? v.background : "hsl(var(--muted))",
            }}
            title="Custom background"
          >
            <input
              type="color"
              value={v.background !== "default" ? v.background : "#ffffff"}
              onChange={(e) => set({ background: e.target.value })}
              className="absolute inset-0 cursor-pointer opacity-0"
              aria-label="Custom background"
            />
            {v.background !== "default" && (
              <Check className="h-3.5 w-3.5 text-white" />
            )}
          </label>
          {v.background !== "default" && (
            <button
              type="button"
              onClick={() => set({ background: "default" })}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              reset
            </button>
          )}
        </div>
      </Section>

      <Section title="Font" hint="One font per vibe.">
        <div className="grid grid-cols-2 gap-3">
          {FONT_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => set({ font: k })}
              className={cn(
                "flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition-all",
                v.font === k
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/40",
              )}
              style={{ fontFamily: FONTS[k].stack }}
            >
              <span
                className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {FONTS[k].vibe}
              </span>
              <span className="text-lg leading-none">{FONTS[k].name}</span>
              <span className="text-sm text-muted-foreground">Aa Bb 123</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Corner style">
        <div className="grid grid-cols-3 gap-3">
          {RADIUS_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => set({ radius: k })}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all",
                v.radius === k
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/40",
              )}
            >
              <span
                className="h-6 w-6 border-2 border-foreground"
                style={{ borderRadius: RADIUS[k].value }}
              />
              <span className="text-[11px] font-medium leading-tight">
                {RADIUS[k].name}
              </span>
            </button>
          ))}
        </div>
      </Section>
    </div>
  );
}
