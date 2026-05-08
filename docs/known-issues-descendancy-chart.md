# Known Issues with Descendancy Chart

This document tracks known limitations and planned work for the descendancy chart (tree viewer).

---

## 1. Non–birth children in unions

**Issue:** If a person is a child in a union but **not a birth child** (e.g. adopted, foster, other pedigree), we do not fully support that for:

- **Show parents & siblings** (`showSiblings`) on the root person (parents & siblings view from API)

Behavior and data for non-birth children in that flow can be incomplete or incorrect.

**Planned:** Extend support for non-birth children in sibling view (data, API, and UI).

---

## 2. Centering on spouse after open

**Issue:** Centering the view on a spouse **after opening** that spouse (single-spouse open from the spouse drawer) is **buggy**. Pan/zoom may not land correctly on the newly opened spouse card.

**Context:** We added “pan to opened spouse” and “pan to partner on close” using `centerOnPerson` and a pending-center effect; the open-spouse case still has edge cases or timing/layout issues.

**Planned:** Debug and fix the open-spouse centering (and any related close-spouse centering edge cases).

---

## 3. Tutorial option

**Issue:** We need to add a **tutorial option** for the descendancy chart (e.g. first-time or “how to use” guidance).

**Planned:** Define tutorial content and add a way to trigger it (e.g. menu item, first-visit prompt, or help panel).

---

## Summary

| # | Area | Issue | Status |
|---|------|--------|--------|
| 1 | Data / flows | Non–birth children not fully supported for showSiblings (Show parents & siblings) | Known |
| 2 | UX | Centering on spouse after open is buggy | Known |
| 3 | UX | Tutorial option needed | Known |
