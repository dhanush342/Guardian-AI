---
name: Autonomous Safety Shield
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#434655'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#006398'
  on-secondary: '#ffffff'
  secondary-container: '#5bb8fe'
  on-secondary-container: '#00476e'
  tertiary: '#005a82'
  on-tertiary: '#ffffff'
  tertiary-container: '#0074a6'
  on-tertiary-container: '#e4f2ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#cce5ff'
  secondary-fixed-dim: '#93ccff'
  on-secondary-fixed: '#001d31'
  on-secondary-fixed-variant: '#004b73'
  tertiary-fixed: '#c9e6ff'
  tertiary-fixed-dim: '#89ceff'
  on-tertiary-fixed: '#001e2f'
  on-tertiary-fixed-variant: '#004c6e'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 56px
    fontWeight: '800'
    lineHeight: 64px
    letterSpacing: -0.03em
  display-hero-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.025em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-badge:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-2xs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
  space-3xl: 4rem
---

## Brand & Style

This design system delivers an ultra-clean, authoritative, and technologically forward aesthetic engineered for modern enterprise cyber-intelligence, deepfake detection, and brand integrity defense. The experience targets security architects, trust & safety executives, and autonomous operations leaders who require pristine clarity under mission-critical conditions.

The visual style blends **Corporate Modern** with **High-Precision Minimal Tech**. It avoids dark-mode cybersecurity tropes in favor of an airy, luminous, clinical white and slate architecture punctuated by laser-sharp cerulean and electric cyan accents. Visual interfaces evoke absolute reliability, frictionless intelligence, and decisive threat neutrality without visual clutter.

## Colors

The palette is anchored by a high-clarity slate foundation, contrasting against deep navy typography and electric cybernetic blues:

- **Canvas & Backgrounds**: Base background defaults to `#F8FAFC` (Slate 50), with layered components and floating cards occupying pure `#FFFFFF` (Surface). Secondary structural containers use `#F1F5F9`.
- **Text & Hierarchy**: Primary typography is commanded by `#0F172A` (Slate 900) for uncompromised legibility. Supporting metadata and secondary body copy use `#334155` (Slate 700) and `#64748B` (Slate 500).
- **Accents & States**: Royal Blue (`#2563EB`) commands primary conversion paths, active ring highlights, and high-impact actions. Vibrant Electric Cyan (`#0284C7`) and Sky (`#0EA5E9`) denote live scanning telemetry, verified status chips, and active metrics.
- **Success & Affirmations**: Verified signals, clean scans, and checkmarks utilize Emerald (`#10B981`) seated against soft mint tints (`#ECFDF5`).
- **Dividers & Strokes**: Outlines remain whisper-soft using `#E2E8F0` and `#EDF2F7`, preventing visual fragmentation.

## Typography

The typography pairing uses **Plus Jakarta Sans** for headlines and pricing anchors alongside **Inter** for UI surfaces and deep data tables:

- **Headlines**: Set with tight optical kerning (`-0.02em` to `-0.03em`) and robust weights (`600` through `800`) to evoke engineered precision.
- **Numbers & Metrics**: Pricing figures, scan volume counters, and data indicators use geometric alignment with tabular figure spacing (`font-variant-numeric: tabular-nums`).
- **Body & Controls**: Inter provides neutral, high-legibility execution across data-dense dashboards, supporting scanning comfort during long monitoring sessions.

## Layout & Spacing

A strictly regimented 8pt spatial grid anchors the system:

- **Grid Framework**: 12-column layout on desktop with a maximum canvas width of `1280px` or `1440px`. Column gutters hold firm at `1.5rem` (`24px`).
- **Canvas Margins**: Desktop layouts use `2rem` outer padding, adapting down to `1rem` on mobile screens below `768px`.
- **Reflow Strategy**: Multi-column tiers (such as pricing matrices and sensor telemetry arrays) maintain a 3-column composition on viewports `>1024px`, collapse to a 2-column stacked grid on tablets (`768px - 1023px`), and fall back to single-column cards on viewports `<768px`.

## Elevation & Depth

Depth is established through soft ambient diffusion combined with hairline borders rather than heavy drop shadows:

- **Subtle Grounding (Level 1 - Cards & Toggles)**: `0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.03)` wrapped with a hairline `1px solid #E2E8F0` border.
- **Elevated Interactive (Level 2 - Hovered / Active Cards)**: `0 12px 24px -6px rgba(15, 23, 42, 0.06), 0 4px 8px -2px rgba(15, 23, 42, 0.03)`. When highlighted (such as the primary tier), the boundary switches to `1.5px solid #2563EB` with an ambient cyan glow: `0 0 0 1px #2563EB, 0 12px 28px -4px rgba(37, 99, 235, 0.12)`.
- **Overlay & Popovers (Level 3 - Menus, Dialogs)**: `0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)`.
- **Badge Accents**: Floating pill callouts (e.g., "MOST POPULAR") employ solid vibrant `#2563EB` fills floating cleanly on the card’s top edge without excessive blur.

## Shapes

The interface embraces a balanced modern curvature (`roundedness: 2`):

- **Cards & Primary Modules**: Standardized to `1rem` (`16px`) corner radius, projecting an approachable, modern SaaS silhouette.
- **Controls & Form Elements**: Buttons, text inputs, and segment selectors use `0.5rem` (`8px`) to maintain structural neatness.
- **Badges, Status Tags & Segment Pills**: Configured as pill shapes (`9999px`) to visually differentiate status meta-information from clickable action rectangular shapes.

## Components

### Buttons
- **Primary Action**: Solid `#0F172A` (deep navy) or `#2563EB` (vibrant blue) fill with crisp `#FFFFFF` text. Height `44px`, horizontal padding `1.25rem`. Transitions smoothly to a deeper hue on hover with an arrow icon translate effect (`translateX(3px)`).
- **Secondary Action**: White `#FFFFFF` fill with a `1px solid #E2E8F0` border and `#0F172A` text. Hover brings `#F8FAFC` background and a sharpened `#CBD5E1` border.
- **Ghost/Tertiary**: No border, `#475569` text, background becomes `#F1F5F9` on hover.

### Segmented Switchers / Plan Selectors
- Contained in a unified container with a `#FFFFFF` or `#F1F5F9` base and `1px solid #E2E8F0` rim.
- Active segment is marked with `#0F172A` background and `#FFFFFF` text (or crisp white card surface with subtle shadow on gray trays). Inactive segments use `#64748B` typography.

### Cards & Pricing Tiers
- Constructed on a pure `#FFFFFF` background with a subtle border `#E2E8F0` and `16px` border-radius.
- Internal padding is generous (`2rem`).
- Highlighted/Featured state overrides the border with `#2563EB` (or cyan glow) and anchors a pill tag centered at the top border offset (`top: -12px`).
- Includes a circular or soft-rounded icon housing (`40x40px`) with a light blue wash (`#EFF6FF`) and `#2563EB` stroke icon.

### Checklists & Feature Lists
- Vertical stack with `space-sm` (`0.75rem`) gap.
- Checkmarks are framed by small mint/cyan circles or clean isolated SVG ticks (`#10B981` or `#0284C7`), paired with `#334155` body copy.

### Text Inputs & Search Fields
- Height `44px`, background `#FFFFFF`, border `1px solid #E2E8F0`. Focus applies `border-color: #2563EB` with an external box-shadow halo `0 0 0 3px rgba(37, 99, 235, 0.15)`.

### Status Badges & Chips
- Uppercase micro-copy (`11px`, `fontWeight: 700`), padding `4px 10px`, rounded fully (`rounded-full`).
- Active / Most Popular: Background `#2563EB`, text `#FFFFFF`.
- Soft Status: Background `#EFF6FF`, text `#0284C7`.