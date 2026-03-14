# ChartPanels

Overlay panels for the v2 family tree: settings, dataset info, navigation history, sibling-view legend, and debug state. All use the shared ChartPanel container and optional PanelCloseButton.

Used by the v2 tree when the user opens Settings, Info, History, Legend, or Debug. State and open/close are owned by the parent; panels are presentational.

## File index

- ChartPanel.tsx — Shared container. See ChartPanel.md
- PanelCloseButton.tsx — Bottom Close button. See PanelCloseButton.md
- SettingsPanel.tsx — Settings overlay. See SettingsPanel.md
- SettingsSection.tsx — Section heading wrapper. See SettingsSection.md
- SettingsPanelTreeDepth.tsx — Tree depth section. See SettingsPanelTreeDepth.md
- SettingsPanelDisplay.tsx — Display toggles. See SettingsPanelDisplay.md
- InfoPanel.tsx — Dataset info. See InfoPanel.md
- InfoPanelItem.tsx — Label-value row. See InfoPanelItem.md
- HistoryPanel.tsx — Navigation history list. See HistoryPanel.md
- HistoryPanelItem.tsx — Single history entry. See HistoryPanelItem.md
- LegendPanel.tsx — Sibling view legend. See LegendPanel.md
- DebugPanel.tsx — Tree state JSON. See DebugPanel.md

## Data flow

Parent owns which panel is open and panel-specific data. Panels receive props and render inside ChartPanel with fixed placement when not mobile.
