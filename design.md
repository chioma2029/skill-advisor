---
name: Soft Skill Development
concept: A calm, guided self-reflection experience — not a form, not a chatbot, not a dashboard
colors:
  paper:   "#F0EEE8"   # base background
  ink:     "#1C1F1B"   # primary text, headlines
  moss:    "#3F5D48"   # primary accent — CTAs, active states, progress line
  clay:    "#B8703E"   # secondary accent — used ONLY for warmth/attention (timer warning, streak)
  brick:   "#A6432F"   # error state ONLY
  line:    "#DDD9CF"   # hairline borders, dividers
typography:
  display:
    family: "Spectral"
    role: "Question prompts, page headlines, results title"
    weight: [400, 500]
    style_notes: "Serif, editorial, warm — never bold-heavy. Italic used sparingly for emphasis on a single word."
  body:
    family: "Archivo"
    role: "Body copy, buttons, labels, inputs"
    weight: [400, 500, 600]
  data:
    family: "IBM Plex Mono"
    role: "Timer, question counter (e.g. 07 / 20), score numbers, canvas axis labels"
    weight: [400, 500]
radius:
  input: 2px
  button: 2px
  none_elsewhere: true   # no card radius anywhere — this product has no cards
spacing_unit: 8px
---

# Soft Skill Development — Design System

## 1. Concept in one sentence

This is a quiet, guided walk through self-reflection — the visual and interaction language of a thoughtful one-on-one conversation, not a dashboard, not a chat app, not a corporate assessment tool.

The product has **no cards, no icons-in-boxes, no gradients, no dashboard chrome**. Its entire visual identity rests on three things: generous whitespace, a confident type pairing, and one continuous progress motif (the "throughline," described in §4) that is present from the very first question to the final results screen. That throughline is the signature element — the one thing a user should remember about how this felt to use.

---

## 2. Explicit anti-slop rules (read this before writing any CSS)

The agent must actively avoid the following, even if they feel like reasonable defaults:

- ❌ No purple, indigo, or blue-to-purple gradients, anywhere, for any reason.
- ❌ No `Inter`, `Roboto`, or system-ui as the primary typeface. Use the three fonts defined above, nothing else.
- ❌ No drop-shadow "cards" — not on questions, not on results, not on the contact form. If a container is needed, use a hairline border (`--line`) or plain whitespace, never a shadow.
- ❌ No decorative icon set (no Font Awesome / Lucide-style icon grids, no "3 features with icons" sections). If an icon is genuinely needed for a single functional purpose (e.g. play/pause on the audio question), draw it as a minimal 1.5px stroke SVG in `--ink`, nothing decorative.
- ❌ No glassmorphism, no blurred background blobs, no floating gradient orbs.
- ❌ No pill-shaped badges, no rounded-full buttons. Buttons and inputs get a 2px radius, nothing more.
- ❌ No bounce/elastic/spring easing anywhere. All motion uses the easing curve defined in §6.
- ❌ No more than 2 accent colors visible on any single screen (Moss + Clay is the ceiling — Brick only appears during an actual error).
- ❌ Never present more than one question, one input, or one decision on screen at a time during the intake and quiz flows.

If at any point a screen would look "fine" but indistinguishable from a generic SaaS onboarding flow, it has failed this brief.

---

## 3. Color — usage rules, not just hex values

| Token | Hex | Where it's allowed |
|---|---|---|
| `--paper` | `#F0EEE8` | Every background, full stop. No section gets a different background color. |
| `--ink` | `#1C1F1B` | All body text, headlines, borders on focus, icon strokes. |
| `--moss` | `#3F5D48` | The **only** color for: primary CTA buttons, active progress states, `.is-valid` input border, links. Used at maybe 5–8% of total screen area at any time — it should feel rare and intentional, not like a brand wash. |
| `--clay` | `#B8703E` | Reserved for exactly two things: the timer when under 20% time remaining, and a streak-multiplier moment in the quiz. Nowhere else. If you find yourself reaching for clay a third time, don't. |
| `--brick` | `#A6432F` | `.is-invalid` border + `.error-message` text only. Never decorative. |
| `--line` | `#DDD9CF` | 1px hairline dividers, resting (non-focused) input borders, the resting state of the throughline. |

No color outside this table appears anywhere in the product, including in inline SVG (canvas chart bars use `--moss`, `--clay`, `--ink` at varied opacity — see §8).

---

## 4. The signature element: The Throughline

A single 2px vertical line (horizontal on mobile, running under the header) that is present on every screen from the first intake question to the results page. It is the one consistent visual anchor across the whole product and it does real work, not decoration:

- **During intake & quiz:** the throughline fills from `--line` (empty/grey) to `--moss` (filled) proportionally as the user answers questions. It sits to the left of the question content on desktop (a slim rail, ~2px wide, full viewport height, with a soft filled segment tracking progress), and as a thin bar under the fixed header on mobile.
- **It replaces a traditional progress bar or step-counter UI.** There is no "Step 3 of 12" pill, no dot-stepper. The mono-font counter (`07 / 20`) sits quietly near the question, small, in `--ink` at 60% opacity — supporting data, not a UI element.
- **On the results page,** the throughline resolves: it stops animating and sits as a static full line, visually "completing the journey," positioned beside the results summary before transitioning into the bar chart's own axis.
- **On the landing page,** the throughline is absent — it only appears once the user has entered the experience. Its first appearance (a quiet draw-on animation as the first intake question loads) is the one moment of "arrival" in the whole product.

This is the only structural device in the product. There are no numbered markers, no card grids, no icon rows.

---

## 5. Typography system

Type scale is based on a single ratio (1.25) off a 16px root:

| Role | Font | Size (desktop) | Size (mobile) | Weight | Notes |
|---|---|---|---|---|---|
| Question prompt | Spectral | 32px | 24px | 400 | The single largest, most confident text on any given screen — this is the "hero" of every intake/quiz screen |
| Page headline (landing, results) | Spectral | 40px | 28px | 500 | Only one per page |
| Body / answer text / paragraph | Archivo | 17px | 16px | 400 | Line-height 1.6 |
| Button / label | Archivo | 15px | 15px | 600 | Letter-spacing 0.01em, sentence case — never uppercase, never "Submit," always the actual action ("Next," "I'm Ready," "See my results") |
| Counter / timer / score numerals | IBM Plex Mono | 14px | 13px | 500 | Always `--ink` at 60% opacity unless it's an active warning (timer <20% → `--clay`, full opacity) |
| Error message | Archivo | 13px | 13px | 500 | `--brick`, sits directly below the relevant input |

Only these three families exist in the codebase. No fallback stack beyond system sans/serif for load failure.

---

## 6. Motion

One durations/easing system, used everywhere, no exceptions:

- **Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` (standard ease-out) for anything appearing; `cubic-bezier(0.4, 0, 1, 1)` (ease-in) for anything leaving. No spring, no elastic, no bounce.
- **Question transitions (the core interaction):** outgoing question fades to 0 opacity and slides up 12px over 220ms; incoming question starts at 0 opacity / +12px offset and settles over 280ms, beginning 80ms after the outgoing question starts (slight overlap, not a hard cut). Total perceived transition: ~350ms.
- **Throughline fill:** animates over 400ms whenever progress updates, always slightly after the question transition settles (don't animate two things at max intensity simultaneously).
- **Button press:** 100ms opacity dip to 0.85, no scale transform.
- **Input focus:** border color transitions `--line` → `--moss` (or `--brick` if invalid) over 150ms. No glow, no shadow.
- **Respect `prefers-reduced-motion`:** all transitions collapse to a simple 100ms opacity crossfade, throughline fill becomes instant.

Nothing pulses, bounces, floats, or auto-plays on loop. Motion only ever communicates a state change the user caused.

---

## 7. Layout & spacing

- 8px base spacing unit. Vertical rhythm between major elements uses multiples of 8 (24, 32, 48, 64).
- **Landing page:** single column, generously centered, max content width ~640px for text, one full-bleed or large hero image (see §9) that complements rather than dominates — image occupies no more than ~45% of first viewport on desktop.
- **Intake & quiz screens:** content is vertically centered in the viewport, max width ~560px, throughline rail to the left on desktop (≥1024px), collapsing to a top bar under 1024px. Exactly one question, one input/interaction, one "Next" action visible at a time. Nothing else on screen — no header nav, no footer, no sidebar content.
- **Results page:** headline → short descriptive feedback paragraph → canvas bar chart → next-step recommendation → "Contact an Adviser" text link (not a button — this is a secondary path, styled as understated text with a `--moss` underline, not a competing CTA).
- **Contact page:** same one-thing-at-a-time discipline is relaxed here since it's explicitly a traditional support form, but it keeps the same hairline-border input style, same type system, same restraint — no cards, no icons.
- No section anywhere uses a background color different from `--paper`. Separation between sections is achieved through whitespace and a single `--line` hairline, never a colored block.

---

## 8. Component specs

**Buttons**
Primary: `--ink` text on `--paper`... no — primary button is filled `--moss` background, `--paper` text, 2px radius, no shadow, 12px vertical / 24px horizontal padding. Secondary/text actions (like "Contact an Adviser") are plain underlined text in `--moss`, no button chrome at all.

**Text input (conversational, one at a time)**
No visible label above it in the traditional sense — the question itself *is* the label (per the brief's example). Underline-style input: transparent background, `--line` bottom border 1px, growing to `--moss` 2px on focus. Large, Archivo 17px. Placeholder text is muted example content (e.g. "Caleb"), `--ink` at 35% opacity.

**Inline validation**
`.is-valid` → border color `--moss`, no checkmark icon (avoid decorative icons — the color change is sufficient feedback). `.is-invalid` → border color `--brick`, and a `.error-message` (Archivo 13px, `--brick`) fades in directly below the input over 150ms, specific and plain ("Enter a valid student ID — numbers only," not "Invalid input"). Validates on blur for the first pass, then live on input once an error has been shown once (per the assignment's real-time state toggling requirement).

**Timer**
Lives in the mono font, small, top-right of the quiz viewport (or integrated quietly near the counter, not a giant clock). Reads as plain numerals (`04:32`). Only changes color (`--ink` → `--clay`) under 20% time remaining — no flashing, no shaking, no siren styling. At zero, the current question locks (inputs disabled, `--line` overlay at low opacity) and auto-advances.

**Quiz question variants**
Every question type — text/choice, image hotspot, audio, video-timestamp — shares the same container rules from §7: centered, max ~560px (wider only for the image-hotspot question, which needs the image itself to be legible — allow up to 720px there). Media (image/audio/video) sits above the question prompt, never inside a bordered card — just the media element itself with generous margin below it before the prompt text.

**Results bar chart (hand-rolled Canvas 2D, no libraries)**
Horizontal bars, one per skill category (Communication, Critical Thinking, Time Management, Leadership). Bar fill: `--moss` at full opacity for the strongest category, `--moss` at 55% opacity for the rest — this single opacity variation is the entire "visual interest" of the chart, nothing more elaborate. Category labels in Archivo 15px to the left of each bar; score numerals in IBM Plex Mono to the right of each bar. Thin `--line` baseline, no gridlines, no drop shadow, no rounded bar ends (sharp rectangular bars only — ties back to the 2px-radius-everywhere rule).

---

## 9. Imagery

If a landing-page hero image or a quiz question image is used, it should be a real photograph (not an illustration, not a 3D render, not stock-icon style) — something that reads as candid and human, consistent with the "guided conversation" concept: a person mid-conversation, a quiet workspace, hands writing — not a generic "diverse team high-fiving in an office" stock cliché. Desaturate slightly toward the `--paper`/`--ink` palette if the raw image reads too saturated against the rest of the UI. Always full-quality, never a blurry placeholder.

---

## 10. Accessibility floor (non-negotiable, not a nice-to-have)

- Visible keyboard focus ring on every interactive element (2px `--moss` outline, offset 2px) — never `outline: none` without a replacement.
- Color is never the only signal: validation states pair color with the error message text; the timer warning pairs color with the numeral itself remaining fully legible.
- Contrast: `--ink` on `--paper` and `--paper` on `--moss` both must clear WCAG AA for body text.
- All media (audio/video questions) have a visible, operable control set — no autoplay with sound.
- `prefers-reduced-motion` is honored per §6.
- Fully responsive from ~360px mobile width up; the throughline's mobile fallback (top bar) is mandatory, not optional.

---

## 11. Summary — what "done right" looks like

A stranger looking at a screenshot of this product should not be able to tell it was AI-assisted. They should see: a lot of quiet cream-grey space, one warm green accent used sparingly, a distinctive serif headline paired with a plain grotesque body face, a single thin line tracking their progress, and exactly one thing to do on screen at any moment. Nothing should look "impressive." Everything should look considered.