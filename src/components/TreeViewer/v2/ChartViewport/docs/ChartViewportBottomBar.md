# ChartViewportBottomBar.tsx

Fixed bottom bar with "Go To Person" and "Toggle All Partners" buttons. Rendered only on desktop; on mobile it returns `null`.

## Responsibility

- Position the bar using `window.visualViewport`: bottom center of the visual viewport, with a small bottom offset (10 on desktop).
- Listen to `visualViewport` resize and scroll to keep position in sync.
- After viewport updates, hide the bar briefly then show it again after 150ms to avoid flicker.
- Two buttons: "Go To Person" (`onGoToPerson`) and "Toggle All Partners" (`onToggleAllSpouses`), each in a panel-styled group with `role="group"` and `aria-label`.

## Props

- `isMobile` — when true, component returns null.
- `onGoToPerson`, `onToggleAllSpouses` — callbacks.

## Layout

- `position: fixed`; top/left/transform from visual viewport. Height 44px; flex row; opacity transition after viewport changes.

## Usage

Rendered in `ChartViewport.tsx`; parent passes `isMobile` and the two callbacks.
