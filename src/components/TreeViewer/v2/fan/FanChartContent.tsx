"use client";

import {
  PersonNode,
  UnionNode,
  type ChartNode,
  type DescendancyPerson,
  buildFanGeometry,
  bindFanGeometry,
  FAN_CHART_DEFAULTS,
  radialLabelRotationDeg,
  polarToCartesian,
  buildGenderBandArcPath,
  buildFanTextArcPathInRadialZone,
  computeFanCellTextBounds,
  DEFAULT_FAN_CHROME_LAYOUT,
  fanTextZoneArcLength,
  getMoreButtonCenter,
  moreButtonChevronRotationDeg,
  type FanAncestorData,
  type FanChromeLayoutOptions,
  type RenderableFanCell,
} from "@/genealogy-visualization-engine";
import { COLORS } from "@/lib/person-card-layout";
import type { FanMoreClickPayload } from "./fanPeekTypes";
import { normalizeGedcomXref } from "../PersonDetailOverlay/utils";

/** A few steps lighter than `COLORS.card` / `COLORS.iconBg` for subtle sector highlight (not iconBgHover, which is darker). */
const FAN_CELL_HOVER_HAS_DATA = "#fdfbf7";
const FAN_CELL_HOVER_EMPTY = "#faf7f0";

const FAN_CHROME: FanChromeLayoutOptions = { ...DEFAULT_FAN_CHROME_LAYOUT };

const MORE_BUTTON = {
  radius: 10,
  strokeWidth: 1.5,
  stroke: COLORS.cardStroke,
  iconSize: 12,
} as const;

type FanChartContentProps = {
  root: ChartNode;
  generationCount: number;
  rootRadius?: number;
  /** Xrefs listed in pedigree API `multiFamilyChildXrefs` — enables “Choose parent family” in peek. */
  pedigreeMultiFamilyChildXrefs?: string[] | null;
  /** Context action on the per-cell “more” chip (opens peek modal in app shell). */
  onMoreClick?: (payload: FanMoreClickPayload) => void;
};

function slotKey(generation: number, index: number): string {
  return `${generation}:${index}`;
}

function firstParentUnion(personNode: PersonNode): UnionNode | null {
  if (personNode.children.length < 1) return null;
  const union = personNode.children[0];
  return union instanceof UnionNode ? union : null;
}

function collectAncestorSlots(
  personNode: PersonNode,
  generationCount: number,
  generation: number,
  index: number,
  out: FanAncestorData
): void {
  if (generation > generationCount) return;
  out[slotKey(generation, index)] = personNode.content;
  if (generation >= generationCount) return;
  const union = firstParentUnion(personNode);
  if (!union) return;
  const [left, right] = union.content;
  if (left) collectAncestorSlots(left, generationCount, generation + 1, index * 2, out);
  if (right) collectAncestorSlots(right, generationCount, generation + 1, index * 2 + 1, out);
}

function estimateGenerationCount(root: PersonNode): number {
  const walk = (person: PersonNode, generation: number): number => {
    const union = firstParentUnion(person);
    if (!union) return generation;
    const [left, right] = union.content;
    let maxGeneration = generation;
    if (left) maxGeneration = Math.max(maxGeneration, walk(left, generation + 1));
    if (right) maxGeneration = Math.max(maxGeneration, walk(right, generation + 1));
    return maxGeneration;
  };
  return walk(root, 0);
}

/** Gap between name and date along the radial (px). */
const RADIAL_NAME_DATE_GAP = 8;
const RAY_MODE_DATE_FONT_CAP = 9.35;

function radialRunAvailablePx(safeInner: number, safeOuter: number): number {
  return Math.max(20, safeOuter - safeInner);
}

function estimateTextWidthPx(text: string, fontSizePx: number): number {
  if (!text) return 0;
  return Math.max(fontSizePx * 0.65, fontSizePx * 0.5 * text.length);
}

function fitName(name: string, arcLength: number, minArc: number): string | null {
  const approxBase = name.length * 6.2;
  if (arcLength >= approxBase) return name;
  if (arcLength < minArc) return null;
  const maxChars = Math.max(4, Math.floor(arcLength / 6.4));
  return name.slice(0, Math.max(1, maxChars - 1)).trimEnd() + "…";
}

const NAME_GENDER_MALE = "#AAD7ED";
const NAME_GENDER_FEMALE = "#F8BBD0";
const NAME_GENDER_OTHER = "#C8E6C9";

function genderBandColor(gender: string | null | undefined): string {
  if (gender == null) return NAME_GENDER_OTHER;
  const normalized = `${gender}`.trim().toUpperCase().replace(/\s+/g, "");
  if (normalized === "MALE" || normalized === "M") return NAME_GENDER_MALE;
  if (normalized === "FEMALE" || normalized === "F") return NAME_GENDER_FEMALE;
  return NAME_GENDER_OTHER;
}

function labelForCell(
  cell: RenderableFanCell,
  radialMode: boolean,
  mins: {
    minArcLengthForName: number;
    minArcLengthForDates: number;
    minRadialForDates: number;
  },
  zone: { safeInnerRadius: number; safeOuterRadius: number }
): { name: string | null; dates: string | null } {
  const name = (cell.label.name ?? "").trim();
  if (!name) return { name: null, dates: null };
  const dates = (cell.label.dates ?? "").trim();
  const ringThickness = cell.bandThickness;

  if (!radialMode) {
    const nameArcLength = fanTextZoneArcLength(cell, zone.safeInnerRadius, zone.safeOuterRadius, 0.62);
    const dateArcLength = fanTextZoneArcLength(cell, zone.safeInnerRadius, zone.safeOuterRadius, 0.38);
    const fittedName = fitName(name, nameArcLength, mins.minArcLengthForName);
    if (!fittedName) return { name: null, dates: null };
    const canShowDates =
      Boolean(dates) &&
      ringThickness >= mins.minRadialForDates &&
      dateArcLength >= mins.minArcLengthForDates &&
      dateArcLength >= dates.length * 5.6 &&
      nameArcLength >= fittedName.length * 5.2;
    return { name: fittedName, dates: canShowDates ? dates : null };
  }

  const run = radialRunAvailablePx(zone.safeInnerRadius, zone.safeOuterRadius);
  const wDateEst = dates ? estimateTextWidthPx(dates, RAY_MODE_DATE_FONT_CAP) : 0;

  if (!dates || ringThickness < mins.minRadialForDates) {
    const fittedName = fitName(name, run, mins.minArcLengthForName);
    return { name: fittedName, dates: null };
  }

  const nameBudgetForPair = run - RADIAL_NAME_DATE_GAP - wDateEst;
  if (nameBudgetForPair < mins.minArcLengthForName) {
    const fittedName = fitName(name, run, mins.minArcLengthForName);
    return { name: fittedName, dates: null };
  }

  const fittedName = fitName(name, nameBudgetForPair, mins.minArcLengthForName);
  if (!fittedName) return { name: null, dates: null };

  const wName = estimateTextWidthPx(fittedName, 12);
  const canShowDates = wName + RADIAL_NAME_DATE_GAP + wDateEst <= run + 3;
  return { name: fittedName, dates: canShowDates ? dates : null };
}

function radialAlongRayCenters(
  cell: RenderableFanCell,
  nameText: string,
  dateText: string | null,
  fontNamePx: number,
  fontDatePx: number,
  zone: { safeInnerRadius: number; safeOuterRadius: number }
): {
  rotationDeg: number;
  nameCenter: { x: number; y: number };
  dateCenter: { x: number; y: number } | null;
} {
  const θ = cell.midAngle;
  const inner = zone.safeInnerRadius;
  const outer = zone.safeOuterRadius;
  const wName = estimateTextWidthPx(nameText, fontNamePx);
  const wDate = dateText ? estimateTextWidthPx(dateText, fontDatePx) : 0;
  const gap = RADIAL_NAME_DATE_GAP;
  const run = Math.max(0, outer - inner);
  let rNameStart = inner;
  const total = wName + (dateText ? gap + wDate : 0);
  if (total <= run) {
    const shift = (run - total) / 2;
    rNameStart = inner + shift;
  }
  const rNameC = rNameStart + wName / 2;
  const rDateC = dateText != null ? rNameStart + wName + gap + wDate / 2 : null;
  const rotationDeg = radialLabelRotationDeg(θ);
  return {
    rotationDeg,
    nameCenter: polarToCartesian(cell.center, rNameC, θ),
    dateCenter: rDateC != null ? polarToCartesian(cell.center, rDateC, θ) : null,
  };
}

function personHasMultipleFamiliesAsChild(
  person: DescendancyPerson,
  multiFamilyXrefs: string[] | null | undefined
): boolean {
  if (!multiFamilyXrefs?.length) return false;
  const key = normalizeGedcomXref(person.xref ?? person.id);
  if (!key) return false;
  return multiFamilyXrefs.some((x) => normalizeGedcomXref(x) === key);
}

export function FanChartContent({
  root,
  generationCount,
  rootRadius,
  pedigreeMultiFamilyChildXrefs = null,
  onMoreClick,
}: FanChartContentProps) {
  if (!(root instanceof PersonNode)) return null;
  const computedGenerationCount = Math.max(0, Math.min(generationCount, estimateGenerationCount(root)));
  const geometry = buildFanGeometry({
    generationCount: computedGenerationCount,
    rootRadius: Math.max(16, rootRadius ?? FAN_CHART_DEFAULTS.rootRadius),
    generationThickness: FAN_CHART_DEFAULTS.generationThickness,
    thicknessIncreaseStartGeneration: FAN_CHART_DEFAULTS.thicknessIncreaseStartGeneration,
    thicknessIncreaseStep: FAN_CHART_DEFAULTS.thicknessIncreaseStep,
  });
  const ancestorData: FanAncestorData = {};
  collectAncestorSlots(root, computedGenerationCount, 0, 0, ancestorData);
  const rootPerson: DescendancyPerson = root.content;
  const cells = bindFanGeometry(geometry, rootPerson, ancestorData, {
    textAngularPadding: 0.02,
  });

  const diagGen = FAN_CHART_DEFAULTS.diagonalLabelStartGeneration;
  const labelMin = {
    minArcLengthForName: FAN_CHART_DEFAULTS.minArcLengthForName,
    minArcLengthForDates: FAN_CHART_DEFAULTS.minArcLengthForDates,
    minRadialForDates: FAN_CHART_DEFAULTS.minRadialForDates,
  };

  return (
    <g>
      <style>{`
        /* Match PersonNode card fills: COLORS.card / COLORS.iconBg (person-card-layout). */
        .fan-cell-path[data-has-data="true"],
        .fan-more-btn-fill {
          fill: ${COLORS.card};
        }
        .fan-cell-path[data-has-data="false"] {
          fill: ${COLORS.iconBg};
        }
        @media (hover: hover) and (pointer: fine) {
          .fan-cell-path[data-has-data="true"]:hover,
          .fan-more-btn-fill:hover {
            fill: ${FAN_CELL_HOVER_HAS_DATA};
          }
          .fan-cell-path[data-has-data="false"]:hover {
            fill: ${FAN_CELL_HOVER_EMPTY};
          }
        }
      `}</style>
      <defs>
        {cells.map((cell) => {
          if (cell.generation >= diagGen) return null;
          const zone = computeFanCellTextBounds(cell, FAN_CHROME);
          const namePath = buildFanTextArcPathInRadialZone(cell, {
            safeInnerRadius: zone.safeInnerRadius,
            safeOuterRadius: zone.safeOuterRadius,
            radiusBias: 0.62,
            angularPaddingFraction: 0.02,
          });
          const datePath = buildFanTextArcPathInRadialZone(cell, {
            safeInnerRadius: zone.safeInnerRadius,
            safeOuterRadius: zone.safeOuterRadius,
            radiusBias: 0.38,
            angularPaddingFraction: 0.02,
          });
          return (
            <g key={`fan-paths-${cell.id}`}>
              <path id={`fan-text-path-name-${cell.id}`} d={namePath} />
              <path id={`fan-text-path-date-${cell.id}`} d={datePath} />
            </g>
          );
        })}
      </defs>

      <g className="fan-cells-underlay">
        {cells.map((cell) => {
          const person = cell.person;
          const genderPath = buildGenderBandArcPath(cell, {
            genderBandInset: FAN_CHROME.genderBandInset,
            genderBandAnglePaddingFraction: FAN_CHROME.genderBandAnglePaddingFraction,
          });
          const bandColor = genderBandColor(person?.gender ?? null);
          return (
            <g key={`fan-cell-base-${cell.id}`}>
              <path
                className="fan-cell-path"
                data-has-data={cell.hasData ? "true" : "false"}
                d={cell.pathD}
                stroke={COLORS.cardStroke}
                strokeWidth={1}
              />
              {cell.hasData && genderPath ? (
                <path
                  d={genderPath}
                  fill="none"
                  stroke={bandColor}
                  strokeWidth={FAN_CHROME.genderBandThickness}
                  strokeLinecap="round"
                  pointerEvents="none"
                />
              ) : null}
            </g>
          );
        })}
      </g>

      <g className="fan-cells-text">
        {cells.map((cell) => {
          const radial = cell.generation >= diagGen;
          const zone = computeFanCellTextBounds(cell, FAN_CHROME);
          const text = labelForCell(cell, radial, labelMin, zone);
          const person = cell.person;
          const fontName = cell.generation <= 1 ? 12 : 11;
          const fontDate = cell.generation <= 1 ? 10.5 : 9.75;
          const fontDateRay = Math.min(fontDate, RAY_MODE_DATE_FONT_CAP);
          const rayLayout =
            radial && text.name
              ? radialAlongRayCenters(cell, text.name, text.dates ?? null, fontName, fontDateRay, zone)
              : null;

          return (
            <g key={`fan-cell-text-${cell.id}`} pointerEvents="none">
              {text.name && !radial ? (
                <text
                  fill="var(--tree-text, #e7ddca)"
                  fontSize={fontName}
                  fontWeight={cell.generation === 0 ? 700 : 500}
                  fontFamily={"var(--font-heading-raw), Georgia, 'Times New Roman', serif"}
                  letterSpacing={cell.generation === 0 ? "0.01em" : "0.005em"}
                >
                  <textPath href={`#fan-text-path-name-${cell.id}`} startOffset="50%" textAnchor="middle">
                    {text.name}
                  </textPath>
                </text>
              ) : null}
              {text.name && radial && rayLayout ? (
                <text
                  x={rayLayout.nameCenter.x}
                  y={rayLayout.nameCenter.y}
                  transform={`rotate(${rayLayout.rotationDeg} ${rayLayout.nameCenter.x} ${rayLayout.nameCenter.y})`}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="var(--tree-text, #e7ddca)"
                  fontSize={fontName}
                  fontWeight={cell.generation === 0 ? 700 : 500}
                  fontFamily={"var(--font-heading-raw), Georgia, 'Times New Roman', serif"}
                  letterSpacing={cell.generation === 0 ? "0.01em" : "0.005em"}
                >
                  {text.name}
                </text>
              ) : null}
              {text.dates && !radial ? (
                <text
                  fill="crimson"
                  fontSize={fontDate}
                  fontWeight={500}
                  fontFamily={"var(--font-heading-raw), Georgia, 'Times New Roman', serif"}
                  letterSpacing={"0.004em"}
                >
                  <textPath href={`#fan-text-path-date-${cell.id}`} startOffset="50%" textAnchor="middle">
                    {text.dates}
                  </textPath>
                </text>
              ) : null}
              {text.dates && radial && rayLayout?.dateCenter ? (
                <text
                  x={rayLayout.dateCenter.x}
                  y={rayLayout.dateCenter.y}
                  transform={`rotate(${rayLayout.rotationDeg} ${rayLayout.dateCenter.x} ${rayLayout.dateCenter.y})`}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="crimson"
                  fontSize={fontDateRay}
                  fontWeight={500}
                  fontFamily={"var(--font-heading-raw), Georgia, 'Times New Roman', serif"}
                  letterSpacing={"0.004em"}
                >
                  {text.dates}
                </text>
              ) : null}
            </g>
          );
        })}
      </g>

      <g className="fan-more-buttons" style={{ pointerEvents: "auto" as const }}>
        {cells.map((cell) => {
          if (!cell.hasData) return null;
          const person = cell.person;
          const c = getMoreButtonCenter(cell);
          const iconHalf = MORE_BUTTON.iconSize * 0.35;
          return (
            <g key={`fan-more-${cell.id}`}>
              <circle
                className="fan-more-btn-fill"
                cx={c.x}
                cy={c.y}
                r={MORE_BUTTON.radius}
                stroke={MORE_BUTTON.stroke}
                strokeWidth={MORE_BUTTON.strokeWidth}
                style={onMoreClick && person ? { cursor: "pointer" } : undefined}
                onClick={
                  onMoreClick && person
                    ? (e) => {
                        e.stopPropagation();
                        onMoreClick({
                          personId: person.id,
                          name:
                            `${person.firstName ?? ""} ${person.lastName ?? ""}`.trim() || person.id,
                          xref: person.xref ?? person.id,
                          uuid: person.uuid ?? null,
                          firstName: person.firstName,
                          lastName: person.lastName,
                          photoUrl: person.photoUrl ?? null,
                          birthYear: person.birthYear ?? null,
                          deathYear: person.deathYear ?? null,
                          birthPlace: person.birthPlace ?? null,
                          deathPlace: person.deathPlace ?? null,
                          gender: person.gender ?? null,
                          isLiving: person.isLiving,
                          hasMultipleFamiliesAsChild: personHasMultipleFamiliesAsChild(
                            person,
                            pedigreeMultiFamilyChildXrefs
                          ),
                        });
                      }
                    : undefined
                }
              />
              <g
                transform={`translate(${c.x},${c.y}) rotate(${moreButtonChevronRotationDeg(cell.midAngle)})`}
                pointerEvents="none"
              >
                <path
                  d={`M ${-iconHalf} ${-iconHalf * 0.2} L 0 ${iconHalf * 1.1} L ${iconHalf} ${-iconHalf * 0.2}`}
                  fill="none"
                  stroke="#6a6356"
                  strokeWidth={1.35}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            </g>
          );
        })}
      </g>
    </g>
  );
}
