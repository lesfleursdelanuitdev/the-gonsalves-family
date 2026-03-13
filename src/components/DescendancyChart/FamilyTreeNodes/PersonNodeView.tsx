"use client";

import { getPeople, getBirthUnionByChild, PERSON_HEIGHT, PERSON_WIDTH } from "@/descendancy-chart";
import type { DescendancyPerson, PersonCardAction } from "@/descendancy-chart";
import { IconCrown, IconHeart, IconArrowUp, IconArrowDown, IconHome, IconUsers, IconX, IconPerson, IconPersonMale, IconPersonFemale } from "../../TreeViewer/Misc/SvgIcons";

const BTN_ROW_H = 52;
const BTN_CIRCLE_R = 22;
const BTN_GAP = 10;
const BTN_ICON = 22;
/** Vertical offset for profile picture, name, and dates (shifts content down from top of card) */
const CONTENT_TOP_OFFSET = 14;

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
  onAction?: (action: PersonCardAction, personId: string) => void;
  settings?: PersonCardSettings;
}

export function PersonCard({ cx, y, person, isRoot = false, isSpouse = false, isLinkedSpouse = false, hasSpouses = false, hasParents = false, onlyRoot = false, isLeaf = false, onAction, settings = {} }: PersonCardProps) {
  const { id, firstName, lastName, birthYear, deathYear, _hiddenCount, _isShadow } = person;
  const isUnknown = firstName === "Unknown";
  const x = cx - PERSON_WIDTH / 2;
  const top = y - PERSON_HEIGHT / 2;
  const btnY = top + PERSON_HEIGHT - BTN_ROW_H - 16;

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
          height={PERSON_HEIGHT}
          rx={8}
          fill="var(--surface-2)"
          stroke="var(--border)"
          strokeWidth={1}
          strokeDasharray="5 3"
          style={{ filter: "drop-shadow(0 2px 12px rgba(0,0,0,0.08))" }}
        />
        <text
          x={cx}
          y={top + 28}
          textAnchor="middle"
          fill="var(--heading)"
          fontFamily="var(--font-heading-raw), serif"
          style={{ fontSize: "0.875rem", fontWeight: 600 }}
        >
          {firstName}
        </text>
        <text
          x={cx}
          y={top + 41}
          textAnchor="middle"
          fill="var(--heading)"
          fontFamily="var(--font-heading-raw), serif"
          style={{ fontSize: "0.875rem", fontWeight: 600 }}
        >
          {lastName}
        </text>
        <text
          x={cx}
          y={top + 56}
          textAnchor="middle"
          fill="var(--crimson)"
          fontFamily="inherit"
          style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.1em" }}
        >
          {birthYear ?? "?"} — {deathYear ?? "present"}
        </text>
        <text
          x={cx}
          y={top + PERSON_HEIGHT - 10}
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
          height={PERSON_HEIGHT}
          rx={8}
          fill="var(--surface-2)"
          stroke="var(--border)"
          strokeWidth={1}
          strokeDasharray="4 3"
          style={{ filter: "drop-shadow(0 2px 12px rgba(0,0,0,0.08))" }}
        />
        <text
          x={cx}
          y={y - 8}
          textAnchor="middle"
          fill="var(--heading)"
          fontFamily="var(--font-heading-raw), serif"
          style={{ fontSize: "0.875rem", fontWeight: 600, fontStyle: "italic" }}
        >
          Unknown
        </text>
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
    <g>
      {/* Card: recipe-card style — soft fill, subtle shadow. Root: red 2px border; spouse: thin top accent; else: 1px border */}
      <rect
        x={x}
        y={top}
        width={PERSON_WIDTH}
        height={PERSON_HEIGHT}
        rx={8}
        fill="var(--surface-2)"
        stroke={isRoot ? "var(--crimson)" : "var(--border)"}
        strokeWidth={isRoot ? 2 : 1}
        style={{ filter: "drop-shadow(0 2px 12px rgba(0,0,0,0.08))" }}
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
        height={settings.showPhotos !== false ? 36 : 40}
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
          }}
          title={`${firstName} ${lastName}`}
        >
          {firstName} {lastName}
        </div>
      </foreignObject>
      {settings.showDates !== false && (
      <text
        x={cx}
        y={settings.showPhotos !== false ? top + 14 + CONTENT_TOP_OFFSET + 44 + 10 + 36 + 4 : top + 18 + CONTENT_TOP_OFFSET + 40 + 6}
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
          y={top + PERSON_HEIGHT - 8}
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
          buttons.push({ Icon: IconUsers, stroke: "var(--success)", title: "Show siblings", action: "showSiblings" });
        }
        if (!onlyRoot && !isSpouse && !isLinkedSpouse && hasSpouses) {
          buttons.push({ Icon: IconHeart, stroke: "var(--accent)", title: "Show spouses", action: "showSpouses" });
        }
        if (!onlyRoot && !isSpouse && !isLinkedSpouse && hasParents) {
          buttons.push({ Icon: IconArrowUp, stroke: "var(--tree-text-muted)", title: "Go to parents", action: "parents" });
        }
        buttons.push({ Icon: IconHome, stroke: "var(--tree-text-muted)", title: "Set as root", action: "root" });
        if (isLeaf) {
          buttons.push({ Icon: IconArrowDown, stroke: "var(--tree-text-muted)", title: "More", action: "expandDown" });
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
              g.querySelector("circle")?.setAttribute("fill", "var(--tree-button-border)");
              g.querySelectorAll("path").forEach((p) => p.setAttribute("stroke", "var(--tree-text)"));
            }}
            onMouseLeave={(e) => {
              const g = e.currentTarget as SVGGElement;
              g.querySelector("circle")?.setAttribute("fill", "var(--tree-button-border)");
              g.querySelectorAll("path").forEach((p) => p.setAttribute("stroke", stroke));
            }}
          >
            <title>{title}</title>
            <circle
              cx={slot(slotIndex)}
              cy={btnCy}
              r={BTN_CIRCLE_R}
              fill="var(--tree-button-border)"
              fillOpacity={0.25}
              stroke="var(--tree-button-border)"
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
