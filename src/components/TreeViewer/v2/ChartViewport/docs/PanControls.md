# PanControls.tsx

Up, down, left, right pan buttons. Two groups with aria-labels Pan up and down and Pan left and right.

## Responsibility

Each button calls onPan with dx dy. PAN_STEP is 48 pixels.

## Props

onPan with dx and dy numbers.

## Usage

Rendered from ChartViewportRightVerticalMenuItems. Parent supplies onPan.
