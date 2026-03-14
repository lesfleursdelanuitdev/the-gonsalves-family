# ChartViewportLoading.tsx

Full-viewport loading overlay shown while the chart data is loading.

## Responsibility

- When isLoading is true, render an overlay with a spinner and Loading tree text; when false, render nothing.
- Use aria-live polite for screen readers.

## Props

isLoading (boolean): when true, the overlay is visible.

## Usage

Rendered at the top of the ChartViewport container in ChartViewport.tsx.
