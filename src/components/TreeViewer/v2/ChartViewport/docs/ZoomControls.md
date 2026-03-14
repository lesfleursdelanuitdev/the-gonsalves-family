# ZoomControls.tsx

Zoom in, fit to screen, and zoom out buttons. Wrapped in ChartViewportRightVerticalMenuItem with aria-label Zoom controls.

## Responsibility

Zoom in disabled when scale at max 3. Zoom out disabled when scale at min 0.2. Fit to screen always enabled.

## Props

scale, onZoomIn, onZoomOut, onFitToScreen.

## Usage

Rendered from ChartViewportRightVerticalMenuItems. Parent supplies scale and handlers.
