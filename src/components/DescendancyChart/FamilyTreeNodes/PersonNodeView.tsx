"use client";

import { getPeople, getBirthUnionByChild, PERSON_WIDTH } from "@/genealogy-visualization-engine";
import type { DescendancyPerson, PersonCardAction } from "@/genealogy-visualization-engine";
import { getEffectivePersonHeight } from "@/lib/personNodeHeight";
import { IconCrown, IconHeart, IconArrowUp, IconArrowDown, IconHome, IconUsers, IconX, IconPerson, IconPersonMale, IconPersonFemale, IconChevronUp, IconChevronDown } from "../../TreeViewer/Misc/SvgIcons";

const BTN_ROW_H = 52;
const BTN_CIRCLE_R = 22;
const BTN_GAP = 10;
const BTN_ICON = 22;
/** Vertical offset for profile picture, name, and dates (shifts content down from top of card) */
const CONTENT_TOP_OFFSET = 14;

/** Fallbacks so action buttons and icons stay visible when CSS variables don't cascade (e.g. tree-viewer-test). */
const FALLBACK_TREE_TEXT = "#2C2A26";
const FALLBACK_TREE_TEXT_MUTED = "#6F675A";
const FALLBACK_TREE_BUTTON_BORDER = "#D9CCB3";
const FALLBACK_SUCCESS = "#2e7a52";

/** Extra vertical space for name area (top + bottom padding). */
const NAME_ROW_EXTRA_HEIGHT = 12;

/** Soft background colors for name area (by gender). */
const NAME_BG_MALE = "#AAD7ED";
const NAME_BG_FEMALE = "#F8BBD0";
const NAME_BG_OTHER = "#C8E6C9";

function getNameBackgroundColor(gender: string | null | undefined): string {
  if (gender === "Male") return NAME_BG_MALE;
  if (gender === "Female") return NAME_BG_FEMALE;
  return NAME_BG_OTHER;
}

export interface PersonCardSettings {
  showDates?: boolean;
  showPhotos?: boolean;
  showUnknown?: boolean;
}

export interface PersonCardProps {
  cx: number;
  y: number;
  person: DescendancyPerson;
  isRoot?: boolean;
  isSpouse?: boolean;
  isLinkedSpouse?: boolean;
  hasSpouses?: boolean;
  hasParents?: boolean;
  onlyRoot?: boolean;
  /** When true, this person is a leaf in the tree (no children shown); show e.g. a down-arrow button. */
  isLeaf?: boolean;
  /** When true, this person has descendants in the full data (for showing collapse/expand only when relevant). */
  hasDescendantsInData?: boolean;
  /** When true, this person's subtree is collapsed (show "Expand subtree" instead of "Collapse subtree"). */
  isSubtreeCollapsed?: boolean;
  onAction?: (action: PersonCardAction, personId: string) => void;
  /** When provided, name is clickable and opens a detail overlay with name, xref, uuid. */
  onNameClick?: (person: { name: string; xref: string; uuid: string | null }) => void;
  settings?: PersonCardSettings;
}

export function PersonCard({ cx, y, person, isRoot = false, isSpouse = false, isLinkedSpouse = false, hasSpouses = false, hasParents = false, onlyRoot = false, isLeaf = false, hasDescendantsInData = false, isSubtreeCollapsed = false, onAction, onNameClick, settings = {} }: PersonCardProps) {
  const { id, firstName, lastName, birthYear, deathYear, _hiddenCount, _isShadow } = person;
  const overlayPerson = {
    name: `${firstName} ${lastName}`.trim() || "Unknown",
    xref: person.xref ?? id,
    uuid: person.uuid ?? null,
  };
  const handleNameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNameClick?.(overlayPerson);
  };
  const isUnknown = firstName === "Unknown";
  const effectiveHeight = getEffectivePersonHeight(settings);
  const x = cx - PERSON_WIDTH / 2;
  const top = y - effectiveHeight / 2;
  const btnY = top + effectiveHeight - BTN_ROW_H - 16;

  if (_isShadow) {
    const people = getPeople();
    const primaryUnion = getBirthUnionByChild().get(id);
    const husb = primaryUnion ? people.get(primaryUnion.husb) : null;
    const wife = primaryUnion ? people.get(primaryUnion.wife) : null;
    const primaryLabel =
      husb && wife
        ? `${husb.firstName} & ${wife.firstName}`
        : husb
          ? husb.firstName
          : wife
            ? wife.firstName
            : "elsewhere";

    return (
      <g opacity={0.45}>
        <rect
          x={x}
          y={top}
          width={PERSON_WIDTH}
          height={effectiveHeight}
          rx={8}
          fill="var(--surface-2)"
          stroke="var(--border)"
          strokeWidth={1}
          strokeDasharray="5 3"
          style={{ filter: "drop-shadow(0 2px 12px rgba(0,0,0,0.08))" }}
        />
        <foreignObject
          x={x + 12}
          y={top + 10}
          width={PERSON_WIDTH - 24}
          height={30 + NAME_ROW_EXTRA_HEIGHT}
          style={{ overflow: "visible" }}
        >
          <div
            className="font-heading"
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              fontFamily: "var(--font-heading-raw), serif",
              color: "var(--heading)",
              textAlign: "center",
              lineHeight: 1.3,
            }}
          >
            <span
              role={onNameClick ? "button" : undefined}
              tabIndex={onNameClick ? 0 : undefined}
              onClick={onNameClick ? handleNameClick : undefined}
              onKeyDown={onNameClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleNameClick(e as unknown as React.MouseEvent); } } : undefined}
              style={{
                borderBottom: `4px solid ${getNameBackgroundColor(person.gender)}`,
                ...(onNameClick ? { cursor: "pointer" } : {}),
              }}
            >
              {firstName}
              <br />
              {lastName}
            </span>
          </div>
        </foreignObject>
        <text
          x={cx}
          y={top + 56 + NAME_ROW_EXTRA_HEIGHT}
          textAnchor="middle"
          fill="var(--crimson)"
          fontFamily="inherit"
          style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.1em" }}
        >
          {birthYear ?? "?"} — {deathYear ?? "present"}
        </text>
        <text
          x={cx}
          y={top + effectiveHeight - 10}
          textAnchor="middle"
          fontSize={7.5}
          fill="var(--tree-linked)"
          fontFamily="Georgia, serif"
          fontStyle="italic"
        >
          shown under {primaryLabel}
        </text>
        {onAction && (
          <g
            style={{ cursor: "pointer" }}
            onClick={(e) => { e.stopPropagation(); onAction("closeLinkedUnion", id); }}
            onMouseEnter={(e) => (e.currentTarget as SVGGElement).querySelectorAll("path").forEach((p) => p.setAttribute("stroke", "var(--tree-text)"))}
            onMouseLeave={(e) => (e.currentTarget as SVGGElement).querySelectorAll("path").forEach((p) => p.setAttribute("stroke", "var(--tree-linked)"))}
          >
            <rect x={x + PERSON_WIDTH - 22} y={top + 4} width={18} height={18} fill="transparent" />
            <IconX x={x + PERSON_WIDTH - 13} y={top + 13} size={14} stroke="var(--tree-linked)" fill="none" />
          </g>
        )}
      </g>
    );
  }

  if (isUnknown && settings.showUnknown === false) return null;

  if (isUnknown) {
    return (
      <g opacity={0.5}>
        <rect
          x={x}
          y={top}
          width={PERSON_WIDTH}
          height={effectiveHeight}
          rx={8}
          fill="var(--surface-2)"
          stroke="var(--border)"
          strokeWidth={1}
          strokeDasharray="4 3"
          style={{ filter: "drop-shadow(0 2px 12px rgba(0,0,0,0.08))" }}
        />
        <foreignObject
          x={x + 12}
          y={y - 22}
          width={PERSON_WIDTH - 24}
          height={28}
          style={{ overflow: "visible" }}
        >
          <div
            className="font-heading"
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              fontStyle: "italic",
              fontFamily: "var(--font-heading-raw), serif",
              color: "var(--heading)",
              textAlign: "center",
            }}
          >
            <span
              role={onNameClick ? "button" : undefined}
              tabIndex={onNameClick ? 0 : undefined}
              onClick={onNameClick ? handleNameClick : undefined}
              onKeyDown={onNameClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleNameClick(e as unknown as React.MouseEvent); } } : undefined}
              style={{
                borderBottom: `4px solid ${NAME_BG_OTHER}`,
                ...(onNameClick ? { cursor: "pointer" } : {}),
              }}
            >
              Unknown
            </span>
          </div>
        </foreignObject>
        <text
          x={cx}
          y={y + 8}
          textAnchor="middle"
          fill="var(--crimson)"
          fontFamily="inherit"
          style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.1em" }}
        >
          parent
        </text>
        {onAction && (
          <g
            style={{ cursor: "pointer" }}
            onClick={(e) => { e.stopPropagation(); onAction("closeSpouse", id); }}
            onMouseEnter={(e) => (e.currentTarget as SVGGElement).querySelectorAll("path").forEach((p) => p.setAttribute("stroke", "var(--tree-text)"))}
            onMouseLeave={(e) => (e.currentTarget as SVGGElement).querySelectorAll("path").forEach((p) => p.setAttribute("stroke", "var(--tree-text-subtle)"))}
          >
            <rect x={x + PERSON_WIDTH - 22} y={top + 4} width={18} height={18} fill="transparent" />
            <IconX x={x + PERSON_WIDTH - 13} y={top + 13} size={14} stroke="var(--tree-text-subtle)" fill="none" />
          </g>
        )}
      </g>
    );
  }

  return (
    <g className="person-card">
      {/* Card: recipe-card style — soft fill, shadow. Root: 2px crimson border; else: 1px #c8beaa border */}
      <rect
        x={x}
        y={top}
        width={PERSON_WIDTH}
        height={effectiveHeight}
        rx={8}
        fill="var(--surface-2)"
        stroke={isRoot ? "var(--crimson)" : "#c8beaa"}
        strokeWidth={isRoot ? 2 : 1}
        style={{ filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.14))" }}
      />
      {/* Thin accent line at top for spouse only (root uses full red border) */}
      {isSpouse && (
        <line
          x1={x}
          y1={top + 1}
          x2={x + PERSON_WIDTH}
          y2={top + 1}
          stroke="var(--tree-spouse)"
          strokeWidth={1.5}
        />
      )}

      {settings.showPhotos !== false && (() => {
        const iconY = top + 14 + CONTENT_TOP_OFFSET + 22;
        const PersonIcon = person.gender === "Male" ? IconPersonMale : person.gender === "Female" ? IconPersonFemale : IconPerson;
        return (
          <>
            {/* Row 1: picture (centered) */}
            <rect x={x + (PERSON_WIDTH - 44) / 2} y={top + 14 + CONTENT_TOP_OFFSET} width={44} height={44} rx={22} fill="var(--surface-inset)" stroke="var(--border-subtle)" strokeWidth={0.5} />
            <PersonIcon x={cx} y={iconY} size={28} fill="none" stroke="var(--tree-text-subtle)" strokeWidth={1.5} />
          </>
        );
      })()}
      {/* Row 2: name (full width, below picture) */}
      <foreignObject
        x={x + 12}
        y={settings.showPhotos !== false ? top + 14 + CONTENT_TOP_OFFSET + 44 + 10 : top + 18 + CONTENT_TOP_OFFSET}
        width={PERSON_WIDTH - 24}
        height={settings.showPhotos !== false ? 36 + NAME_ROW_EXTRA_HEIGHT : 40 + NAME_ROW_EXTRA_HEIGHT}
        style={{ overflow: "hidden" }}
      >
        <div
          className="font-heading text-sm font-semibold tracking-tight text-heading"
          style={{
            lineHeight: 1.3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            textAlign: "center",
            padding: "6px 6px",
          }}
          title={`${firstName} ${lastName}`}
        >
          <span
            role={onNameClick ? "button" : undefined}
            tabIndex={onNameClick ? 0 : undefined}
            onClick={onNameClick ? handleNameClick : undefined}
            onKeyDown={onNameClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleNameClick(e as unknown as React.MouseEvent); } } : undefined}
            style={{
              borderBottom: `4px solid ${getNameBackgroundColor(person.gender)}`,
              ...(onNameClick ? { cursor: "pointer" } : {}),
            }}
          >
            {firstName} {lastName}
          </span>
        </div>
      </foreignObject>
      {settings.showDates !== false && (
      <text
        x={cx}
        y={settings.showPhotos !== false ? top + 14 + CONTENT_TOP_OFFSET + 44 + 10 + 36 + NAME_ROW_EXTRA_HEIGHT + 4 : top + 18 + CONTENT_TOP_OFFSET + 40 + NAME_ROW_EXTRA_HEIGHT + 6}
        textAnchor="middle"
        fill="var(--crimson)"
        fontFamily="inherit"
        style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.1em" }}
      >
        {birthYear ?? "?"} — {deathYear ?? "present"}
      </text>
      )}
      {_hiddenCount != null && _hiddenCount > 0 && (
        <text
          x={x + PERSON_WIDTH - 10}
          y={top + effectiveHeight - 8}
          fontSize={15}
          fontWeight={600}
          fill="var(--tree-text-muted)"
          fontFamily="Georgia, serif"
          textAnchor="end"
        >
          +{_hiddenCount}
        </text>
      )}

      {isRoot && (
        <IconCrown
          x={x + PERSON_WIDTH - 13}
          y={top + 13}
          size={10}
          fill="var(--tree-root)"
          stroke="var(--tree-root)"
        />
      )}
      {isSpouse && !isLinkedSpouse && onAction && (
        <g
          style={{ cursor: "pointer" }}
          onClick={(e) => { e.stopPropagation(); onAction("closeSpouse", id); }}
          onMouseEnter={(e) => (e.currentTarget as SVGGElement).querySelectorAll("path").forEach((p) => p.setAttribute("stroke", "var(--tree-text)"))}
          onMouseLeave={(e) => (e.currentTarget as SVGGElement).querySelectorAll("path").forEach((p) => p.setAttribute("stroke", "var(--tree-text-subtle)"))}
        >
          <rect x={x + PERSON_WIDTH - 22} y={top + 4} width={18} height={18} fill="transparent" />
          <IconX x={x + PERSON_WIDTH - 13} y={top + 13} size={14} stroke="var(--tree-text-subtle)" fill="none" />
        </g>
      )}
      {isLinkedSpouse && onAction && (
        <g
          style={{ cursor: "pointer" }}
          onClick={(e) => { e.stopPropagation(); onAction("closeLinkedUnion", id); }}
          onMouseEnter={(e) => (e.currentTarget as SVGGElement).querySelectorAll("path").forEach((p) => p.setAttribute("stroke", "var(--tree-text)"))}
          onMouseLeave={(e) => (e.currentTarget as SVGGElement).querySelectorAll("path").forEach((p) => p.setAttribute("stroke", "var(--tree-linked)"))}
        >
          <rect x={x + PERSON_WIDTH - 22} y={top + 4} width={18} height={18} fill="transparent" />
          <IconX x={x + PERSON_WIDTH - 13} y={top + 13} size={14} stroke="var(--tree-linked)" fill="none" />
        </g>
      )}

      {onAction && (() => {
        const btnCy = btnY + BTN_ROW_H / 2;
        const buttons: { Icon: typeof IconUsers; stroke: string; title: string; action: PersonCardAction }[] = [];
        if (!isSpouse && !isLinkedSpouse && isRoot && hasParents) {
          buttons.push({ Icon: IconUsers, stroke: `var(--tree-text-muted, ${FALLBACK_TREE_TEXT_MUTED})`, title: "Show siblings", action: "showSiblings" });
        }
        if (!onlyRoot && !isSpouse && !isLinkedSpouse && hasSpouses) {
          buttons.push({ Icon: IconHeart, stroke: `var(--tree-text-muted, ${FALLBACK_TREE_TEXT_MUTED})`, title: "Show spouses", action: "showSpouses" });
        }
        if (!onlyRoot && !isSpouse && !isLinkedSpouse && hasParents) {
          buttons.push({ Icon: IconArrowUp, stroke: `var(--tree-text-muted, ${FALLBACK_TREE_TEXT_MUTED})`, title: "Go to parents", action: "parents" });
        }
        buttons.push({ Icon: IconHome, stroke: `var(--tree-text-muted, ${FALLBACK_TREE_TEXT_MUTED})`, title: "Set as root", action: "root" });
        if (hasDescendantsInData && !isSpouse && !isLinkedSpouse) {
          if (isSubtreeCollapsed) {
            buttons.push({ Icon: IconChevronDown, stroke: `var(--tree-text-muted, ${FALLBACK_TREE_TEXT_MUTED})`, title: "Expand subtree", action: "expandSubtree" });
          } else {
            buttons.push({ Icon: IconChevronUp, stroke: `var(--tree-text-muted, ${FALLBACK_TREE_TEXT_MUTED})`, title: "Collapse subtree", action: "collapseSubtree" });
          }
        }
        if (isLeaf) {
          buttons.push({ Icon: IconArrowDown, stroke: `var(--tree-text-muted, ${FALLBACK_TREE_TEXT_MUTED})`, title: "More", action: "expandDown" });
        }

        const count = buttons.length;
        const totalWidth = count * BTN_CIRCLE_R * 2 + (count - 1) * BTN_GAP;
        const startX = x + (PERSON_WIDTH - totalWidth) / 2 + BTN_CIRCLE_R;
        const slot = (i: number) => startX + i * (BTN_CIRCLE_R * 2 + BTN_GAP);

        const drawCircleBtn = (slotIndex: number, { Icon, stroke, title, action }: (typeof buttons)[0]) => (
          <g
            key={title}
            style={{ cursor: "pointer" }}
            onClick={(e) => { e.stopPropagation(); onAction(action, id); }}
            onMouseEnter={(e) => {
              const g = e.currentTarget as SVGGElement;
              const circle = g.querySelector("circle");
              if (circle) {
                circle.setAttribute("fill", "#e5dcc8");
                circle.setAttribute("fillOpacity", "0.5");
                circle.setAttribute("stroke", "#e5dcc8");
              }
              g.querySelectorAll("path").forEach((p) => p.setAttribute("stroke", `var(--tree-text, ${FALLBACK_TREE_TEXT})`));
            }}
            onMouseLeave={(e) => {
              const g = e.currentTarget as SVGGElement;
              const circle = g.querySelector("circle");
              if (circle) {
                circle.setAttribute("fill", "#e5dcc8");
                circle.setAttribute("fillOpacity", "0.5");
                circle.setAttribute("stroke", "#e5dcc8");
              }
              g.querySelectorAll("path").forEach((p) => p.setAttribute("stroke", stroke));
            }}
          >
            <title>{title}</title>
            <circle
              cx={slot(slotIndex)}
              cy={btnCy}
              r={BTN_CIRCLE_R}
              fill="#e5dcc8"
              fillOpacity={0.5}
              stroke="#e5dcc8"
              strokeWidth={1}
            />
            <Icon x={slot(slotIndex)} y={btnCy} size={BTN_ICON} stroke={stroke} fill="none" />
          </g>
        );

        return (
          <g>
            {buttons.map((btn, i) => drawCircleBtn(i, btn))}
          </g>
        );
      })()}
    </g>
  );
}
