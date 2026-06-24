"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Baby,
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronUp,
  FileText,
  Film,
  GitBranch,
  Heart,
  HeartCrack,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Mic,
  RotateCcw,
  Search,
  Skull,
  Sparkles,
  Tag,
  User,
  Users,
  UsersRound,
} from "lucide-react";
import { Navbar } from "@/components/homepage/HeroAndMenu/Navbar";
import { Footer } from "@/components/homepage";
import { PageContainer } from "@/components/wireframe";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PersonPicker, type PersonOption } from "@/components/search/PersonPicker";
import { SearchMobileNav } from "@/components/search/SearchMobileNav";
import { FamilyPicker, type FamilyOption } from "@/components/search/FamilyPicker";
import { TagPicker, type TagOption } from "@/components/search/TagPicker";
import { AlbumPicker, type AlbumOption } from "@/components/search/AlbumPicker";
import { NlSearchPlayground } from "@/components/research/NlSearchPlayground";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type NameField = "fullName" | "surname" | "givenName";
type MatchType = "contains" | "exact" | "soundex";
type Scope = "both" | "individuals" | "families" | "names";
type BoolFilter = "all" | "yes" | "no";

interface IndividualFilters {
  isLiving: BoolFilter;
  sex: "all" | "M" | "F" | "unknown";
  minBirthYear: string;
  maxBirthYear: string;
  minDeathYear: string;
  maxDeathYear: string;
  bornIn: string;
  diedIn: string;
  hasChildren: BoolFilter;
  minChildren: string;
  maxChildren: string;
  minUnions: string;
  maxUnions: string;
  multipleUnions: BoolFilter;
  multipleParentFamilies: BoolFilter;
  hasAdoptedParents: BoolFilter;
  hasAdoptedChildren: BoolFilter;
}

interface FamilyFilters {
  isDivorced: BoolFilter;
  minUnionYear: string;
  maxUnionYear: string;
  unionIn: string;
  familyHasChildren: BoolFilter;
  minFamilyChildren: string;
  maxFamilyChildren: string;
}

const EMPTY_IND: IndividualFilters = {
  isLiving: "all", sex: "all",
  minBirthYear: "", maxBirthYear: "", minDeathYear: "", maxDeathYear: "",
  bornIn: "", diedIn: "",
  hasChildren: "all", minChildren: "", maxChildren: "",
  minUnions: "", maxUnions: "", multipleUnions: "all",
  multipleParentFamilies: "all", hasAdoptedParents: "all", hasAdoptedChildren: "all",
};

const EMPTY_FAM: FamilyFilters = {
  isDivorced: "all", minUnionYear: "", maxUnionYear: "", unionIn: "",
  familyHasChildren: "all", minFamilyChildren: "", maxFamilyChildren: "",
};

interface EventResult {
  eventType: string; label: string;
  dateDisplay: string | null; year: number | null;
  placeDisplay: string | null; value: string | null;
}

interface IndividualResult {
  id: string; xref: string; displayName: string; portraitSrc: string | null;
  birthYear: number | null; deathYear: number | null;
  gender: string | null; isLiving: boolean; profileHref: string | null;
  events: EventResult[];
}

interface PartnerResult {
  id: string; displayName: string; birthYear: number | null; deathYear: number | null; profileHref: string | null;
}

interface FamilyResult {
  id: string; xref: string; title: string;
  partner1: PartnerResult | null; partner2: PartnerResult | null;
  childrenCount: number; unionDateDisplay: string | null; unionYear: number | null;
  unionPlace: string | null; isDivorced: boolean; profileHref: string;
}

interface SurnameResult {
  id: string; surname: string; frequency: number;
}

interface GivenNameResult {
  id: string; givenName: string; frequency: number;
}

interface SearchResults {
  individuals: IndividualResult[];
  families: FamilyResult[];
  totalIndividuals: number; totalFamilies: number;
  hasMoreIndividuals: boolean; hasMoreFamilies: boolean;
  surnames: SurnameResult[];
  givenNames: GivenNameResult[];
  totalSurnames: number; totalGivenNames: number;
  limit: number; offset: number;
}

// Events tab types
type LinkedToFilter = "both" | "individual" | "family";

type DateQualifier = "" | "exact" | "about" | "before" | "after" | "between";

interface EventFilters {
  personId: PersonOption | null;
  eventTypes: string[];
  linkedTo: LinkedToFilter;
  dateQualifier: DateQualifier;
  dateYear: string;
  dateMonth: string; // "1"–"12" or ""
  dateDay: string;   // "1"–"31" or "", only valid when dateMonth set
  dateEndYear: string; // "between" end bound
  place: string;
  hasNotes: "all" | "yes" | "no";
  hasMedia: "all" | "yes" | "no";
  hasSources: "all" | "yes" | "no";
}

const EMPTY_EVENT_FILTERS: EventFilters = {
  personId: null, eventTypes: [], linkedTo: "both",
  dateQualifier: "", dateYear: "", dateMonth: "", dateDay: "", dateEndYear: "",
  place: "", hasNotes: "all", hasMedia: "all", hasSources: "all",
};

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

interface EventLinkedEntity { id: string; displayName?: string; title?: string; profileHref: string; role?: string; }

interface EventSearchResult {
  id: string; eventType: string; label: string;
  dateDisplay: string | null; year: number | null;
  placeDisplay: string | null; value: string | null;
  linkedIndividuals: (EventLinkedEntity & { displayName: string; role: string })[];
  linkedFamilies: (EventLinkedEntity & { title: string })[];
  hasNotes: boolean; hasMedia: boolean; hasSources: boolean;
}

interface EventSearchResults {
  events: EventSearchResult[];
  total: number; hasMore: boolean; limit: number; offset: number;
}

// General search types
interface GeneralPersonItem {
  id: string; displayName: string; birthYear: number | null; deathYear: number | null;
  isLiving: boolean; gender: string | null; portraitSrc: string | null; profileHref: string | null;
}
interface GeneralFamilyPartner {
  id: string; displayName: string; birthYear: number | null; deathYear: number | null; profileHref: string | null;
}
interface GeneralFamilyItem {
  id: string; title: string; husband: GeneralFamilyPartner | null; wife: GeneralFamilyPartner | null;
  marriageYear: number | null; profileHref: string;
}
interface GeneralEventItem {
  id: string; label: string; value: string | null; dateDisplay: string | null;
  year: number | null; placeDisplay: string | null;
  linkedPeople: { id: string; displayName: string; profileHref: string | null }[];
}
interface GeneralMediaItem {
  id: string; source: string; title: string | null; mediaType: string; kind: string | null; profileHref: string;
}
interface GeneralNameItem { id: string; name: string; frequency: number; }
interface GeneralPlaceItem { id: string; displayName: string; eventCount: number; profileHref: string; }
interface GeneralNoteItem { id: string; snippet: string; ownerName: string | null; ownerHref: string | null; }
interface GeneralCategoryResult<T> { items: T[]; total: number; }
interface GeneralResults {
  people:     GeneralCategoryResult<GeneralPersonItem>;
  families:   GeneralCategoryResult<GeneralFamilyItem>;
  events:     GeneralCategoryResult<GeneralEventItem>;
  media:      GeneralCategoryResult<GeneralMediaItem>;
  surnames:   GeneralCategoryResult<GeneralNameItem>;
  givenNames: GeneralCategoryResult<GeneralNameItem>;
  places:     GeneralCategoryResult<GeneralPlaceItem>;
  notes:      GeneralCategoryResult<GeneralNoteItem>;
}
type GeneralCategory = "people" | "givenNames" | "surnames" | "families" | "events" | "media" | "places" | "notes";

// Media tab types
type MediaLinkedToKind = "none" | "person" | "family";

interface MediaFilters {
  title: string;
  mediaTypes: string[];
  linkedToKind: MediaLinkedToKind;
  linkedToPerson: PersonOption | null;
  linkedToFamily: FamilyOption | null;
  tagId: TagOption | null;
  albumId: AlbumOption | null;
}

const EMPTY_MEDIA_FILTERS: MediaFilters = {
  title: "", mediaTypes: [], linkedToKind: "none",
  linkedToPerson: null, linkedToFamily: null,
  tagId: null, albumId: null,
};

interface MediaSearchItem {
  id: string;
  source: "gedcom" | "site" | "user" | "story";
  title: string | null;
  mediaType: "image" | "document" | "audio" | "video" | "story" | "other";
  fileRef: string | null;
  slug: string | null;
  kind: string | null;
  profileHref: string;
}

interface MediaSearchResults {
  items: MediaSearchItem[];
  total: number; hasMore: boolean; limit: number; offset: number;
}

const MEDIA_TYPE_OPTIONS: { value: string; label: string; icon: typeof ImageIcon; disabled?: boolean }[] = [
  { value: "image",    label: "Images",    icon: ImageIcon },
  { value: "document", label: "Documents", icon: FileText },
  { value: "audio",    label: "Audio",     icon: Mic },
  { value: "video",    label: "Video",     icon: Film },
  { value: "story",    label: "Stories",   icon: BookOpen },
  { value: "recipe",   label: "Recipes",   icon: Tag, disabled: true },
];

const MEDIA_TYPE_ICONS: Record<string, typeof ImageIcon> = {
  image: ImageIcon, document: FileText, audio: Mic, video: Film, story: BookOpen, other: FileText,
};

const EVENT_TYPE_OPTIONS = [
  { value: "BIRT", label: "Born" }, { value: "DEAT", label: "Died" },
  { value: "BURI", label: "Buried" }, { value: "CHR", label: "Christened" },
  { value: "BAPM", label: "Baptised" }, { value: "MARR", label: "Married" },
  { value: "DIV", label: "Divorced" }, { value: "OCCU", label: "Occupation" },
  { value: "RESI", label: "Residence" }, { value: "EMIG", label: "Emigrated" },
  { value: "IMMI", label: "Immigrated" }, { value: "CENS", label: "Census" },
  { value: "NATU", label: "Naturalized" }, { value: "GRAD", label: "Graduated" },
  { value: "EVEN", label: "Other event" },
];

// ---------------------------------------------------------------------------
// Style constants
// ---------------------------------------------------------------------------
const INPUT_CORE =
  "min-h-[48px] w-full rounded-lg border border-[#d8cfc0] bg-white py-2.5 font-body text-sm text-text outline-none placeholder:text-muted/70 focus:border-[#c4b8a8] focus:ring-1 focus:ring-[#8b2e2e]/25";
const INPUT = cn(INPUT_CORE, "px-3");
/** Left padding for inputs with an icon at `left-3` (px-3 must not be combined with pl-* — twMerge leaves both). */
const INPUT_WITH_LEFT_ICON = cn(INPUT_CORE, "pl-10 pr-3");
/** h-12/py-2.5 replace Button default h-8/px-2.5 (pass as single cn arg so twMerge applies). */
const SEARCH_BTN_PRIMARY =
  "h-12 min-h-12 shrink-0 border-0 bg-[#8b2e2e] px-5 py-2.5 font-body text-sm font-semibold text-white hover:bg-[#7a2828]";
const SEARCH_BTN_RESET =
  "h-12 min-h-12 shrink-0 border-[#d8cfc0] bg-[#f5f1ea] px-3 py-2.5 font-body";
const LABEL = "font-body text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted";
const CHIP_ACTIVE = "rounded-full border border-[#8b2e2e]/30 bg-[#8b2e2e] px-3 py-1.5 font-body text-xs font-medium text-white transition-colors";
const CHIP_INACTIVE = "rounded-full border border-[#d8cfc0] bg-white px-3 py-1.5 font-body text-xs font-medium text-text transition-colors hover:bg-[#f5f1ea] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b2e2e]/25";

function ChipGroup<T extends string>({
  label, value, options, onChange,
}: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div>
      <p className={LABEL}>{label}</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button key={o.value} type="button"
            onClick={() => onChange(o.value)}
            className={value === o.value ? CHIP_ACTIVE : CHIP_INACTIVE}
          >{o.label}</button>
        ))}
      </div>
    </div>
  );
}

function YearRange({ label, from, to, onChange }: {
  label: string; from: string; to: string;
  onChange: (from: string, to: string) => void;
}) {
  return (
    <div>
      <p className={LABEL}>{label}</p>
      <div className="mt-1.5 grid grid-cols-2 gap-2">
        <input type="number" inputMode="numeric" className={INPUT} placeholder="From"
          value={from} onChange={(e) => onChange(e.target.value, to)} />
        <input type="number" inputMode="numeric" className={INPUT} placeholder="To"
          value={to} onChange={(e) => onChange(from, e.target.value)} />
      </div>
    </div>
  );
}

function PlaceInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <p className={LABEL}>{label}</p>
      <div className="relative mt-1.5">
        <MapPin size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
        <input type="text" className={INPUT_WITH_LEFT_ICON} placeholder="e.g. Portugal, Coimbra"
          value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filter sections
// ---------------------------------------------------------------------------
function FilterSection({ title, icon: Icon, children }: {
  title: string; icon: typeof Users; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-xl border border-[#e8e0d4] bg-white">
      <button type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left font-body text-sm font-semibold text-heading transition-colors hover:bg-black/[0.02]"
      >
        <Icon size={16} className="shrink-0 text-muted" aria-hidden />
        <span className="flex-1">{title}</span>
        {open ? <ChevronUp size={16} className="text-muted" aria-hidden /> : <ChevronDown size={16} className="text-muted" aria-hidden />}
      </button>
      {open && <div className="space-y-4 border-t border-[#ebe4d9] px-4 py-4">{children}</div>}
    </div>
  );
}

function IndividualFilterPanel({ filters, onChange }: {
  filters: IndividualFilters;
  onChange: (f: IndividualFilters) => void;
}) {
  const set = useCallback(<K extends keyof IndividualFilters>(k: K, v: IndividualFilters[K]) =>
    onChange({ ...filters, [k]: v }), [filters, onChange]);

  return (
    <div className="space-y-3">
      <FilterSection title="Life & Identity" icon={User}>
        <ChipGroup label="Living status" value={filters.isLiving}
          options={[{value:"all",label:"Any"},{value:"yes",label:"Living"},{value:"no",label:"Deceased"}]}
          onChange={(v) => set("isLiving", v)} />
        <ChipGroup label="Sex" value={filters.sex}
          options={[{value:"all",label:"Any"},{value:"M",label:"Male"},{value:"F",label:"Female"},{value:"unknown",label:"Unknown / other"}]}
          onChange={(v) => set("sex", v)} />
      </FilterSection>

      <FilterSection title="Birth" icon={Baby}>
        <YearRange label="Birth year range"
          from={filters.minBirthYear} to={filters.maxBirthYear}
          onChange={(f, t) => onChange({ ...filters, minBirthYear: f, maxBirthYear: t })} />
        <PlaceInput label="Born in (fuzzy)" value={filters.bornIn}
          onChange={(v) => set("bornIn", v)} />
      </FilterSection>

      <FilterSection title="Death" icon={Skull}>
        <YearRange label="Death year range"
          from={filters.minDeathYear} to={filters.maxDeathYear}
          onChange={(f, t) => onChange({ ...filters, minDeathYear: f, maxDeathYear: t })} />
        <PlaceInput label="Died in (fuzzy)" value={filters.diedIn}
          onChange={(v) => set("diedIn", v)} />
      </FilterSection>

      <FilterSection title="Children & Unions" icon={UsersRound}>
        <ChipGroup label="Has children" value={filters.hasChildren}
          options={[{value:"all",label:"Any"},{value:"yes",label:"Has children"},{value:"no",label:"No children"}]}
          onChange={(v) => set("hasChildren", v)} />
        <YearRange label="Number of children"
          from={filters.minChildren} to={filters.maxChildren}
          onChange={(f, t) => onChange({ ...filters, minChildren: f, maxChildren: t })} />
        <ChipGroup label="Multiple unions" value={filters.multipleUnions}
          options={[{value:"all",label:"Any"},{value:"yes",label:"Yes"},{value:"no",label:"No"}]}
          onChange={(v) => set("multipleUnions", v)} />
        <YearRange label="Number of unions"
          from={filters.minUnions} to={filters.maxUnions}
          onChange={(f, t) => onChange({ ...filters, minUnions: f, maxUnions: t })} />
      </FilterSection>

      <FilterSection title="Family Relationships" icon={GitBranch}>
        <ChipGroup label="Appears in multiple parent families" value={filters.multipleParentFamilies}
          options={[{value:"all",label:"Any"},{value:"yes",label:"Yes"},{value:"no",label:"No"}]}
          onChange={(v) => set("multipleParentFamilies", v)} />
        <ChipGroup label="Has adopted parents" value={filters.hasAdoptedParents}
          options={[{value:"all",label:"Any"},{value:"yes",label:"Yes"},{value:"no",label:"No"}]}
          onChange={(v) => set("hasAdoptedParents", v)} />
        <ChipGroup label="Has adopted children" value={filters.hasAdoptedChildren}
          options={[{value:"all",label:"Any"},{value:"yes",label:"Yes"},{value:"no",label:"No"}]}
          onChange={(v) => set("hasAdoptedChildren", v)} />
      </FilterSection>
    </div>
  );
}

function FamilyFilterPanel({ filters, onChange }: {
  filters: FamilyFilters;
  onChange: (f: FamilyFilters) => void;
}) {
  const set = useCallback(<K extends keyof FamilyFilters>(k: K, v: FamilyFilters[K]) =>
    onChange({ ...filters, [k]: v }), [filters, onChange]);

  return (
    <div className="space-y-3">
      <FilterSection title="Union Details" icon={HeartCrack}>
        <ChipGroup label="Divorced" value={filters.isDivorced}
          options={[{value:"all",label:"Any"},{value:"yes",label:"Divorced"},{value:"no",label:"Not divorced"}]}
          onChange={(v) => set("isDivorced", v)} />
        <YearRange label="Union year range"
          from={filters.minUnionYear} to={filters.maxUnionYear}
          onChange={(f, t) => onChange({ ...filters, minUnionYear: f, maxUnionYear: t })} />
        <PlaceInput label="Union place (fuzzy)" value={filters.unionIn}
          onChange={(v) => set("unionIn", v)} />
      </FilterSection>

      <FilterSection title="Children" icon={UsersRound}>
        <ChipGroup label="Has children" value={filters.familyHasChildren}
          options={[{value:"all",label:"Any"},{value:"yes",label:"Has children"},{value:"no",label:"No children"}]}
          onChange={(v) => set("familyHasChildren", v)} />
        <YearRange label="Number of children"
          from={filters.minFamilyChildren} to={filters.maxFamilyChildren}
          onChange={(f, t) => onChange({ ...filters, minFamilyChildren: f, maxFamilyChildren: t })} />
      </FilterSection>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Result cards
// ---------------------------------------------------------------------------
function LifespanLine({ birthYear, deathYear, isLiving }: {
  birthYear: number | null; deathYear: number | null; isLiving: boolean;
}) {
  if (!birthYear && !deathYear) return <span className="text-muted">No dates</span>;
  const born = birthYear ? String(birthYear) : "?";
  const died = isLiving ? "present" : (deathYear ? String(deathYear) : "?");
  return <>{born}&thinsp;&ndash;&thinsp;{died}</>;
}

function initialsFromDisplayName(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]![0]?.toUpperCase() ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]![0]?.toUpperCase() ?? "") : "";
  return (first + last) || "?";
}

function IndividualAvatar({ displayName, portraitSrc }: { displayName: string; portraitSrc: string | null }) {
  if (portraitSrc) {
    return (
      <div className="relative size-10 shrink-0 overflow-hidden rounded-full border border-border-subtle">
        <Image src={portraitSrc} alt={displayName} fill className="object-cover sepia-[0.15]" sizes="40px" />
      </div>
    );
  }
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-[#f5f1ea]">
      <span className="font-heading text-sm font-semibold tracking-tight text-link">
        {initialsFromDisplayName(displayName)}
      </span>
    </div>
  );
}

const EVENT_ICONS: Record<string, typeof Baby> = {
  BIRT: Baby, CHR: Baby, BAPM: Baby,
  DEAT: Heart, BURI: Heart,
  OCCU: Users, RESI: MapPin, EMIG: MapPin, IMMI: MapPin,
  CENS: Users, EVEN: Calendar,
};

function EventRow({ event }: { event: EventResult }) {
  const Icon = EVENT_ICONS[event.eventType] ?? Calendar;
  const detail = [event.dateDisplay, event.placeDisplay].filter(Boolean).join(" · ");
  return (
    <div className="flex min-w-0 items-baseline gap-1.5 font-body text-xs text-muted">
      <Icon size={10} className="mt-0.5 shrink-0 text-muted/50" aria-hidden />
      <span className="shrink-0 font-medium text-text/60">{event.label}</span>
      {detail && <span className="min-w-0 truncate text-muted/70" title={detail}>{detail}</span>}
      {!detail && event.value && <span className="min-w-0 truncate text-muted/70">{event.value}</span>}
    </div>
  );
}

function IndividualCard({ individual }: { individual: IndividualResult }) {
  return (
    <article className="group flex min-w-0 items-start gap-3 rounded-xl border border-border/80 bg-surface-elevated px-4 py-3.5 shadow-[0_2px_8px_rgba(60,45,25,0.06)] transition hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(60,45,25,0.1)]">
      <IndividualAvatar displayName={individual.displayName} portraitSrc={individual.portraitSrc} />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
          <h3 className="break-words font-heading text-base font-semibold leading-tight text-heading">
            {individual.displayName || individual.xref}
          </h3>
          {individual.isLiving && (
            <span className="shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 font-body text-[10px] font-semibold text-emerald-700">Living</span>
          )}
          {individual.gender && (
            <span className="shrink-0 font-body text-xs text-muted">{individual.gender}</span>
          )}
        </div>
        <p className="font-body text-xs text-muted">
          <LifespanLine birthYear={individual.birthYear} deathYear={individual.deathYear} isLiving={individual.isLiving} />
        </p>
        {individual.events.length > 0 && (
          <div className="mt-1.5 space-y-0.5 border-t border-[#ebe4d9] pt-1.5">
            {individual.events.map((ev, i) => (
              <EventRow key={i} event={ev} />
            ))}
          </div>
        )}
      </div>
      <Link
        href={individual.profileHref ?? `/individuals/${encodeURIComponent(individual.id)}`}
        className="shrink-0 self-center rounded-lg border border-border-subtle bg-surface px-3 py-1.5 font-body text-xs font-semibold text-link transition hover:bg-link-soft-bg hover:text-link-soft-fg"
      >
        View
      </Link>
    </article>
  );
}

function PartnerLine({ partner }: { partner: PartnerResult | null }) {
  if (!partner) return <span className="font-body text-sm text-muted italic">Unknown</span>;
  const name = (
    <>
      {partner.displayName}
      {(partner.birthYear || partner.deathYear) && (
        <span className="ml-1.5 font-body text-xs font-normal text-muted">
          ({partner.birthYear ?? "?"}&thinsp;&ndash;&thinsp;{partner.deathYear ?? "?"})
        </span>
      )}
    </>
  );
  if (!partner.profileHref) {
    return (
      <Link
        href={`/individuals/${encodeURIComponent(partner.id)}`}
        className="font-heading text-sm font-medium text-link hover:underline"
      >
        {name}
      </Link>
    );
  }
  return (
    <Link href={partner.profileHref} className="font-heading text-sm font-medium text-link hover:underline">
      {name}
    </Link>
  );
}

function FamilyCard({ family }: { family: FamilyResult }) {
  return (
    <article className="group min-w-0 rounded-xl border border-border/80 bg-surface-elevated px-4 py-3.5 shadow-[0_2px_8px_rgba(60,45,25,0.06)] transition hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(60,45,25,0.1)]">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-[#f5f1ea]">
          <Users size={18} className="text-muted" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-col items-center gap-0.5 text-center">
            <PartnerLine partner={family.partner1} />
            <p className="font-body text-xs font-medium text-muted uppercase tracking-wide">&amp;</p>
            <PartnerLine partner={family.partner2} />
          </div>
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-0.5 font-body text-xs text-muted">
            {family.unionDateDisplay && (
              <span className="flex items-center gap-1">
                <Calendar size={11} className="text-muted/60" aria-hidden />
                {family.unionDateDisplay}
              </span>
            )}
            {family.unionPlace && (
              <span className="flex min-w-0 items-center gap-1 truncate">
                <MapPin size={11} className="shrink-0 text-muted/60" aria-hidden />
                <span className="truncate" title={family.unionPlace}>{family.unionPlace}</span>
              </span>
            )}
            <span className="flex items-center gap-1">
              <UsersRound size={11} className="text-muted/60" aria-hidden />
              {family.childrenCount} {family.childrenCount === 1 ? "child" : "children"}
            </span>
            {family.isDivorced && (
              <span className="flex items-center gap-1 text-amber-600">
                <HeartCrack size={11} aria-hidden />Divorced
              </span>
            )}
          </div>
        </div>
        <Link
          href={family.profileHref}
          className="shrink-0 self-center rounded-lg border border-border-subtle bg-surface px-3 py-1.5 font-body text-xs font-semibold text-link transition hover:bg-link-soft-bg hover:text-link-soft-fg"
        >
          View
        </Link>
      </div>
    </article>
  );
}

function NameCard({ name, frequency, href, kind }: {
  name: string; frequency: number; href: string; kind: "surname" | "givenName";
}) {
  return (
    <Link href={href} className="block">
      <article className="group flex min-w-0 items-center gap-3 rounded-xl border border-border/80 bg-surface-elevated px-4 py-3.5 shadow-[0_2px_8px_rgba(60,45,25,0.06)] transition hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(60,45,25,0.1)]">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-[#f5f1ea]">
          <User size={18} className="text-muted" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-heading text-base font-semibold text-heading">{name}</p>
          <p className="font-body text-xs text-muted">
            {frequency} {frequency === 1 ? "person" : "people"}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-[#e0d8cc] bg-[#faf7f2] px-2 py-0.5 font-body text-[10px] text-muted">
          {kind === "surname" ? "Surname" : "Given name"}
        </span>
      </article>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------
function Pagination({ total, limit, offset, onPageChange }: {
  total: number; limit: number; offset: number;
  onPageChange: (offset: number) => void;
}) {
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between font-body text-sm">
      <span className="text-muted">
        {offset + 1}–{Math.min(offset + limit, total)} of {total}
      </span>
      <div className="flex gap-2">
        <button type="button" disabled={currentPage <= 1}
          onClick={() => onPageChange(offset - limit)}
          className="rounded-lg border border-border-subtle bg-surface px-3 py-1.5 text-sm font-medium text-link transition hover:bg-link-soft-bg disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <button type="button" disabled={currentPage >= totalPages}
          onClick={() => onPageChange(offset + limit)}
          className="rounded-lg border border-border-subtle bg-surface px-3 py-1.5 text-sm font-medium text-link transition hover:bg-link-soft-bg disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Build API URL
// ---------------------------------------------------------------------------
function buildSearchUrl(
  q: string, nameField: NameField, matchType: MatchType, scope: Scope,
  ind: IndividualFilters, fam: FamilyFilters,
  limit: number, indOffset: number, famOffset: number,
): string {
  const params = new URLSearchParams();
  if (q.trim()) params.set("q", q.trim());
  params.set("nameField", nameField);
  params.set("matchType", matchType);
  params.set("scope", scope);
  params.set("limit", String(limit));
  // Individual filters
  if (ind.isLiving !== "all") params.set("isLiving", ind.isLiving);
  if (ind.sex !== "all") params.set("sex", ind.sex);
  if (ind.minBirthYear) params.set("minBirthYear", ind.minBirthYear);
  if (ind.maxBirthYear) params.set("maxBirthYear", ind.maxBirthYear);
  if (ind.minDeathYear) params.set("minDeathYear", ind.minDeathYear);
  if (ind.maxDeathYear) params.set("maxDeathYear", ind.maxDeathYear);
  if (ind.bornIn) params.set("bornIn", ind.bornIn);
  if (ind.diedIn) params.set("diedIn", ind.diedIn);
  if (ind.hasChildren !== "all") params.set("hasChildren", ind.hasChildren);
  if (ind.minChildren) params.set("minChildren", ind.minChildren);
  if (ind.maxChildren) params.set("maxChildren", ind.maxChildren);
  if (ind.minUnions) params.set("minUnions", ind.minUnions);
  if (ind.maxUnions) params.set("maxUnions", ind.maxUnions);
  if (ind.multipleUnions !== "all") params.set("multipleUnions", ind.multipleUnions);
  if (ind.multipleParentFamilies !== "all") params.set("multipleParentFamilies", ind.multipleParentFamilies);
  if (ind.hasAdoptedParents !== "all") params.set("hasAdoptedParents", ind.hasAdoptedParents);
  if (ind.hasAdoptedChildren !== "all") params.set("hasAdoptedChildren", ind.hasAdoptedChildren);
  // Family filters
  if (fam.isDivorced !== "all") params.set("isDivorced", fam.isDivorced);
  if (fam.minUnionYear) params.set("minUnionYear", fam.minUnionYear);
  if (fam.maxUnionYear) params.set("maxUnionYear", fam.maxUnionYear);
  if (fam.unionIn) params.set("unionIn", fam.unionIn);
  if (fam.familyHasChildren !== "all") params.set("familyHasChildren", fam.familyHasChildren);
  if (fam.minFamilyChildren) params.set("minFamilyChildren", fam.minFamilyChildren);
  if (fam.maxFamilyChildren) params.set("maxFamilyChildren", fam.maxFamilyChildren);
  // Pagination (use max offset for both)
  params.set("offset", String(Math.max(indOffset, famOffset)));
  return `/api/tree/advanced-search?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Events tab — search card
// ---------------------------------------------------------------------------
const EVENT_TYPE_ICONS: Record<string, typeof Baby> = {
  BIRT: Baby, CHR: Baby, BAPM: Baby,
  DEAT: Heart, BURI: Heart,
  OCCU: Users, RESI: MapPin, EMIG: MapPin, IMMI: MapPin,
  CENS: Users, MARR: Heart, DIV: HeartCrack,
  EVEN: Calendar,
};

function EventSearchCard({ event }: { event: EventSearchResult }) {
  const Icon = EVENT_TYPE_ICONS[event.eventType] ?? Calendar;
  const meta = [event.dateDisplay, event.placeDisplay].filter(Boolean).join(" · ");

  return (
    <article className="min-w-0 rounded-xl border border-border/80 bg-surface-elevated px-4 py-3.5 shadow-[0_2px_8px_rgba(60,45,25,0.06)] transition hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(60,45,25,0.1)]">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-[#f5f1ea]">
          <Icon size={18} className="text-muted" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="font-heading text-base font-semibold text-heading">{event.label}</span>
            {event.value && (
              <span className="font-body text-sm text-muted">— {event.value}</span>
            )}
          </div>
          {meta && (
            <p className="flex items-center gap-1 font-body text-xs text-muted">
              <Calendar size={11} className="shrink-0 text-muted/60" aria-hidden />
              <span className="truncate" title={meta}>{meta}</span>
            </p>
          )}
          {event.linkedIndividuals.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-0.5">
              {event.linkedIndividuals.map((ind) => (
                <Link key={ind.id} href={ind.profileHref}
                  className="flex items-center gap-1 font-body text-xs text-link hover:underline">
                  <User size={10} className="shrink-0" aria-hidden />
                  {ind.displayName}
                  {ind.role !== "principal" && (
                    <span className="text-muted/70">({ind.role})</span>
                  )}
                </Link>
              ))}
            </div>
          )}
          {event.linkedFamilies.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-0.5">
              {event.linkedFamilies.map((fam) => (
                <Link key={fam.id} href={fam.profileHref}
                  className="flex items-center gap-1 font-body text-xs text-link hover:underline">
                  <Users size={10} className="shrink-0" aria-hidden />
                  {fam.title}
                </Link>
              ))}
            </div>
          )}
          {(event.hasNotes || event.hasMedia || event.hasSources) && (
            <div className="flex gap-2 pt-0.5">
              {event.hasNotes && (
                <span className="flex items-center gap-1 rounded-full border border-[#e0d8cc] bg-[#faf7f2] px-2 py-0.5 font-body text-[10px] text-muted">
                  <FileText size={9} aria-hidden />Notes
                </span>
              )}
              {event.hasMedia && (
                <span className="flex items-center gap-1 rounded-full border border-[#e0d8cc] bg-[#faf7f2] px-2 py-0.5 font-body text-[10px] text-muted">
                  <ImageIcon size={9} aria-hidden />Media
                </span>
              )}
              {event.hasSources && (
                <span className="flex items-center gap-1 rounded-full border border-[#e0d8cc] bg-[#faf7f2] px-2 py-0.5 font-body text-[10px] text-muted">
                  <BookOpen size={9} aria-hidden />Sources
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Events tab — search panel
// ---------------------------------------------------------------------------
function buildEventsUrl(filters: EventFilters, limit: number, offset: number): string {
  const params = new URLSearchParams();
  if (filters.personId) params.set("personId", filters.personId.id);
  if (filters.eventTypes.length > 0) params.set("eventTypes", filters.eventTypes.join(","));
  if (filters.linkedTo !== "both") params.set("linkedTo", filters.linkedTo);
  if (filters.dateQualifier === "between") {
    if (filters.dateYear || filters.dateEndYear) {
      params.set("dateQualifier", "between");
      if (filters.dateYear) params.set("dateYear", filters.dateYear);
      if (filters.dateEndYear) params.set("dateEndYear", filters.dateEndYear);
    }
  } else if (filters.dateQualifier && (filters.dateYear || filters.dateMonth)) {
    params.set("dateQualifier", filters.dateQualifier);
    if (filters.dateYear) params.set("dateYear", filters.dateYear);
    if (filters.dateMonth) {
      params.set("dateMonth", filters.dateMonth);
      if (filters.dateDay) params.set("dateDay", filters.dateDay);
    }
  }
  if (filters.place) params.set("place", filters.place);
  if (filters.hasNotes !== "all") params.set("hasNotes", filters.hasNotes);
  if (filters.hasMedia !== "all") params.set("hasMedia", filters.hasMedia);
  if (filters.hasSources !== "all") params.set("hasSources", filters.hasSources);
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  return `/api/tree/advanced-search/events?${params.toString()}`;
}

function EventsSearchPanel() {
  const [filters, setFilters] = useState<EventFilters>(EMPTY_EVENT_FILTERS);
  const [results, setResults] = useState<EventSearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [offset, setOffset] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const doSearch = useCallback(async (f: EventFilters, off: number) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    try {
      const url = buildEventsUrl(f, PAGE_LIMIT, off);
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      setResults(await res.json() as EventSearchResults);
      setHasSearched(true);
    } catch (e) {
      if ((e as { name?: string }).name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback(() => {
    setOffset(0);
    doSearch(filters, 0);
  }, [filters, doSearch]);

  const handleReset = useCallback(() => {
    setFilters(EMPTY_EVENT_FILTERS);
    setResults(null);
    setHasSearched(false);
    setError(null);
    setOffset(0);
  }, []);

  useEffect(() => {
    if (!hasSearched) return;
    doSearch(filters, offset);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset]);

  const setF = useCallback(<K extends keyof EventFilters>(k: K, v: EventFilters[K]) =>
    setFilters((f) => ({ ...f, [k]: v })), []);

  const toggleEventType = useCallback((type: string) => {
    setFilters((f) => ({
      ...f,
      eventTypes: f.eventTypes.includes(type)
        ? f.eventTypes.filter((t) => t !== type)
        : [...f.eventTypes, type],
    }));
  }, []);

  const total = results?.total ?? 0;

  return (
    <div className="space-y-4">
      {/* Search form */}
      <div className="rounded-2xl border border-[#e8e0d4] bg-white p-5 shadow-[0_4px_16px_rgba(60,45,25,0.06)]">
        {/* Person picker */}
        <div className="space-y-1.5">
          <p className="font-body text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted">Linked to person</p>
          <PersonPicker
            value={filters.personId}
            onChange={(p) => setF("personId", p)}
            placeholder="Search for a person…"
          />
        </div>

        {/* Event types */}
        <div className="mt-4 space-y-1.5">
          <p className="font-body text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted">Event type</p>
          <div className="flex flex-wrap gap-1.5">
            {EVENT_TYPE_OPTIONS.map((opt) => (
              <button key={opt.value} type="button"
                onClick={() => toggleEventType(opt.value)}
                className={filters.eventTypes.includes(opt.value)
                  ? "rounded-full border border-[#8b2e2e]/30 bg-[#8b2e2e] px-3 py-1.5 font-body text-xs font-medium text-white transition-colors"
                  : "rounded-full border border-[#d8cfc0] bg-white px-3 py-1.5 font-body text-xs font-medium text-text transition-colors hover:bg-[#f5f1ea] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b2e2e]/25"
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Linked to scope */}
        <div className="mt-4">
          <ChipGroup label="Linked to" value={filters.linkedTo}
            options={[{value:"both",label:"Either"},{value:"individual",label:"Person"},{value:"family",label:"Family"}]}
            onChange={(v) => setF("linkedTo", v as LinkedToFilter)} />
        </div>

        {/* Date filter */}
        <div className="mt-4 space-y-3">
          <ChipGroup label="Date" value={filters.dateQualifier}
            options={[
              {value:"",        label:"Any"},
              {value:"exact",   label:"Exact"},
              {value:"about",   label:"About"},
              {value:"before",  label:"Before"},
              {value:"after",   label:"After"},
              {value:"between", label:"Between"},
            ]}
            onChange={(v) => setFilters(f => ({
              ...f,
              dateQualifier: v as DateQualifier,
              ...(v === "" ? {dateYear:"", dateMonth:"", dateDay:"", dateEndYear:""} : {}),
              ...(v === "between" ? {dateMonth:"", dateDay:""} : {dateEndYear:""}),
            }))}
          />
          {filters.dateQualifier === "between" ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <p className={LABEL}>From year</p>
                <input
                  type="number" inputMode="numeric" className={INPUT} placeholder="e.g. 1800"
                  value={filters.dateYear} onChange={e => setF("dateYear", e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleSearch(); }}
                />
              </div>
              <div className="space-y-1">
                <p className={LABEL}>To year</p>
                <input
                  type="number" inputMode="numeric" className={INPUT} placeholder="e.g. 1900"
                  value={filters.dateEndYear} onChange={e => setF("dateEndYear", e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleSearch(); }}
                />
              </div>
            </div>
          ) : filters.dateQualifier ? (
            <div className="flex flex-wrap items-end gap-2">
              <div className="space-y-1">
                <p className={LABEL}>Month</p>
                <select
                  value={filters.dateMonth}
                  onChange={e => setFilters(f => ({
                    ...f, dateMonth: e.target.value,
                    ...(e.target.value === "" ? {dateDay:""} : {}),
                  }))}
                  className="min-h-[44px] rounded-lg border border-[#d8cfc0] bg-white px-3 py-2.5 font-body text-sm text-text outline-none focus:border-[#c4b8a8] focus:ring-1 focus:ring-[#8b2e2e]/25"
                >
                  <option value="">—</option>
                  {MONTHS.map((m, i) => (
                    <option key={i + 1} value={String(i + 1)}>{m}</option>
                  ))}
                </select>
              </div>
              {filters.dateMonth && (
                <div className="space-y-1">
                  <p className={LABEL}>Day</p>
                  <input
                    type="number" inputMode="numeric" min={1} max={31}
                    placeholder="—"
                    className="min-h-[44px] w-20 rounded-lg border border-[#d8cfc0] bg-white px-3 py-2.5 font-body text-sm text-text outline-none placeholder:text-muted/70 focus:border-[#c4b8a8] focus:ring-1 focus:ring-[#8b2e2e]/25"
                    value={filters.dateDay}
                    onChange={e => setF("dateDay", e.target.value)}
                  />
                </div>
              )}
              <div className="flex-1 space-y-1" style={{minWidth:"7rem"}}>
                <p className={LABEL}>Year</p>
                <input
                  type="number" inputMode="numeric"
                  className={INPUT}
                  placeholder="e.g. 1850"
                  value={filters.dateYear}
                  onChange={e => setF("dateYear", e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleSearch(); }}
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-4">
          <PlaceInput label="Place (fuzzy)" value={filters.place} onChange={(v) => setF("place", v)} />
        </div>

        {/* Attachment filters */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <ChipGroup label="Has notes" value={filters.hasNotes}
            options={[{value:"all",label:"Any"},{value:"yes",label:"Yes"},{value:"no",label:"No"}]}
            onChange={(v) => setF("hasNotes", v as "all"|"yes"|"no")} />
          <ChipGroup label="Has media" value={filters.hasMedia}
            options={[{value:"all",label:"Any"},{value:"yes",label:"Yes"},{value:"no",label:"No"}]}
            onChange={(v) => setF("hasMedia", v as "all"|"yes"|"no")} />
          <ChipGroup label="Has sources" value={filters.hasSources}
            options={[{value:"all",label:"Any"},{value:"yes",label:"Yes"},{value:"no",label:"No"}]}
            onChange={(v) => setF("hasSources", v as "all"|"yes"|"no")} />
        </div>

        {/* Actions */}
        <div className="mt-5 flex gap-2 border-t border-[#ebe4d9] pt-4">
          <Button type="button" onClick={handleSearch} className={SEARCH_BTN_PRIMARY}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Search events"}
          </Button>
          <Button type="button" variant="outline" onClick={handleReset}
            className={SEARCH_BTN_RESET}
            title="Reset all"
          >
            <RotateCcw size={16} aria-hidden />
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 font-body text-sm text-red-700">{error}</div>
      )}

      {/* Results */}
      {hasSearched && results && (
        <div className="space-y-3">
          <p className="font-body text-sm text-muted">
            {total === 0 ? "No events found." : `${total} ${total === 1 ? "event" : "events"} found`}
          </p>
          {results.events.map((ev) => <EventSearchCard key={ev.id} event={ev} />)}
          {total > PAGE_LIMIT && (
            <div className="flex items-center justify-between font-body text-sm">
              <span className="text-muted">{offset + 1}–{Math.min(offset + PAGE_LIMIT, total)} of {total}</span>
              <div className="flex gap-2">
                <button type="button" disabled={offset <= 0}
                  onClick={() => setOffset((o) => Math.max(0, o - PAGE_LIMIT))}
                  className="rounded-lg border border-border-subtle bg-surface px-3 py-1.5 text-sm font-medium text-link transition hover:bg-link-soft-bg disabled:cursor-not-allowed disabled:opacity-40"
                >Previous</button>
                <button type="button" disabled={offset + PAGE_LIMIT >= total}
                  onClick={() => setOffset((o) => o + PAGE_LIMIT)}
                  className="rounded-lg border border-border-subtle bg-surface px-3 py-1.5 text-sm font-medium text-link transition hover:bg-link-soft-bg disabled:cursor-not-allowed disabled:opacity-40"
                >Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {!hasSearched && !loading && (
        <div className="rounded-xl border border-[#e8e0d4] bg-white px-6 py-12 text-center">
          <Calendar size={40} className="mx-auto mb-4 text-muted/40" aria-hidden />
          <p className="font-heading text-lg font-semibold text-heading">Search the event records</p>
          <p className="mt-1 font-body text-sm text-muted">
            Pick a person, event type, date range, or place and press Search events.
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// General search — compact result cards
// ---------------------------------------------------------------------------
const GENERAL_PAGE_SIZE = 10;

const EMPTY_GENERAL_OFFSETS: Record<GeneralCategory, number> = {
  people: 0,
  givenNames: 0,
  surnames: 0,
  families: 0,
  events: 0,
  media: 0,
  places: 0,
  notes: 0,
};

function GeneralSection<T>({
  title,
  total,
  icon: Icon,
  items,
  offset,
  onPageChange,
  renderItem,
  getKey,
}: {
  title: string;
  total: number;
  icon: typeof Users;
  items: T[];
  offset: number;
  onPageChange: (offset: number) => void;
  renderItem: (item: T) => React.ReactNode;
  getKey: (item: T) => string;
}) {
  const pageTotal = items.length;
  const truncated = pageTotal < total;
  const pageItems = items.slice(offset, offset + GENERAL_PAGE_SIZE);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Icon size={14} className="shrink-0 text-muted" aria-hidden />
        <h3 className="font-heading text-sm font-semibold text-heading">{title}</h3>
        <span className="rounded-full border border-[#e0d8cc] bg-[#faf7f2] px-2 py-0.5 font-body text-[10px] text-muted">
          {total.toLocaleString()}
        </span>
        {truncated ? (
          <span className="font-body text-[10px] text-muted">
            (showing first {pageTotal.toLocaleString()})
          </span>
        ) : null}
      </div>
      <div className="space-y-2">
        {pageItems.map((item) => (
          <Fragment key={getKey(item)}>{renderItem(item)}</Fragment>
        ))}
      </div>
      <Pagination
        total={pageTotal}
        limit={GENERAL_PAGE_SIZE}
        offset={offset}
        onPageChange={onPageChange}
      />
    </div>
  );
}

function GeneralPersonCard({ item }: { item: GeneralPersonItem }) {
  const profileHref = item.profileHref ?? `/individuals/${encodeURIComponent(item.id)}`;
  const inner = (
    <article className="flex min-w-0 items-center gap-3 rounded-xl border border-border/80 bg-surface-elevated px-4 py-3 shadow-[0_2px_8px_rgba(60,45,25,0.06)] transition hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(60,45,25,0.1)]">
      <IndividualAvatar displayName={item.displayName} portraitSrc={item.portraitSrc} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-heading text-sm font-semibold text-heading">{item.displayName || "Unknown"}</p>
        <p className="font-body text-xs text-muted">
          <LifespanLine birthYear={item.birthYear} deathYear={item.deathYear} isLiving={item.isLiving} />
        </p>
      </div>
      {item.isLiving && (
        <span className="shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 font-body text-[10px] font-semibold text-emerald-700">Living</span>
      )}
    </article>
  );
  return <Link href={profileHref} className="block">{inner}</Link>;
}

function GeneralFamilyCard({ item }: { item: GeneralFamilyItem }) {
  const inner = (
    <article className="flex min-w-0 items-center gap-3 rounded-xl border border-border/80 bg-surface-elevated px-4 py-3 shadow-[0_2px_8px_rgba(60,45,25,0.06)] transition hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(60,45,25,0.1)]">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-[#f5f1ea]">
        <Users size={15} className="text-muted" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-heading text-sm font-semibold text-heading">{item.title}</p>
        {item.marriageYear && (
          <p className="font-body text-xs text-muted">Married {item.marriageYear}</p>
        )}
      </div>
    </article>
  );
  return item.profileHref ? <Link href={item.profileHref} className="block">{inner}</Link> : inner;
}

function GeneralEventCard({ item }: { item: GeneralEventItem }) {
  const meta = [item.dateDisplay, item.placeDisplay].filter(Boolean).join(" · ");
  const linkedPeople = item.linkedPeople.filter((person) => person.displayName.trim().length > 0);
  return (
    <article className="flex min-w-0 items-start gap-3 rounded-xl border border-border/80 bg-surface-elevated px-4 py-3 shadow-[0_2px_8px_rgba(60,45,25,0.06)]">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-[#f5f1ea]">
        <Calendar size={15} className="text-muted" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-heading text-sm font-semibold text-heading">
          {item.label}
          {item.value && <span className="font-normal text-muted"> — {item.value}</span>}
        </p>
        {(linkedPeople.length > 0 || meta) && (
          <p className="mt-0.5 font-body text-xs leading-relaxed text-muted">
            {linkedPeople.length > 0 ? (
              <span className="text-text/80">
                {linkedPeople.map((person, index) => {
                  const profileHref =
                    person.profileHref ?? `/individuals/${encodeURIComponent(person.id)}`;
                  return (
                    <Fragment key={person.id}>
                      {index > 0 ? " · " : null}
                      <Link href={profileHref} className="text-link hover:underline">
                        {person.displayName}
                      </Link>
                    </Fragment>
                  );
                })}
              </span>
            ) : null}
            {linkedPeople.length > 0 && meta ? " · " : null}
            {meta}
          </p>
        )}
      </div>
    </article>
  );
}

function GeneralMediaCard({ item }: { item: GeneralMediaItem }) {
  const Icon = MEDIA_TYPE_ICONS[item.mediaType] ?? FileText;
  const kindLabel = item.kind
    ? ({ story: "Story", article: "Article", folklore: "Folklore", post: "Post" } as Record<string, string>)[item.kind] ?? item.kind
    : null;
  const inner = (
    <article className="flex min-w-0 items-center gap-3 rounded-xl border border-border/80 bg-surface-elevated px-4 py-3 shadow-[0_2px_8px_rgba(60,45,25,0.06)] transition hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(60,45,25,0.1)]">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-[#f5f1ea]">
        <Icon size={15} className="text-muted" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-heading text-sm font-semibold text-heading">
          {item.title ?? <span className="italic text-muted">Untitled</span>}
        </p>
        <p className="font-body text-xs text-muted capitalize">{kindLabel ?? item.mediaType}</p>
      </div>
    </article>
  );
  return item.profileHref ? <Link href={item.profileHref} className="block">{inner}</Link> : inner;
}

function GeneralNameCard({ item, kind }: { item: GeneralNameItem; kind: "surname" | "givenName" }) {
  const href = kind === "surname"
    ? `/surnames/${encodeURIComponent(item.id)}`
    : `/given-names/${encodeURIComponent(item.id)}`;
  return (
    <Link href={href} className="block">
      <article className="flex min-w-0 items-center gap-3 rounded-xl border border-border/80 bg-surface-elevated px-4 py-3 shadow-[0_2px_8px_rgba(60,45,25,0.06)] transition hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(60,45,25,0.1)]">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-[#f5f1ea]">
          <User size={15} className="text-muted" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-sm font-semibold text-heading">{item.name}</p>
          <p className="font-body text-xs text-muted">{item.frequency} {item.frequency === 1 ? "person" : "people"}</p>
        </div>
        <span className="shrink-0 rounded-full border border-[#e0d8cc] bg-[#faf7f2] px-2 py-0.5 font-body text-[10px] text-muted">
          {kind === "surname" ? "Surname" : "Given name"}
        </span>
      </article>
    </Link>
  );
}

function GeneralPlaceCard({ item }: { item: GeneralPlaceItem }) {
  return (
    <Link href={item.profileHref} className="block">
      <article className="flex min-w-0 items-center gap-3 rounded-xl border border-border/80 bg-surface-elevated px-4 py-3 shadow-[0_2px_8px_rgba(60,45,25,0.06)] transition hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(60,45,25,0.1)]">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-[#f5f1ea]">
          <MapPin size={15} className="text-muted" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-sm font-semibold text-heading">{item.displayName || "Unknown place"}</p>
          <p className="font-body text-xs text-muted">{item.eventCount} {item.eventCount === 1 ? "event" : "events"}</p>
        </div>
      </article>
    </Link>
  );
}

function GeneralNoteCard({ item }: { item: GeneralNoteItem }) {
  const inner = (
    <article className="flex min-w-0 items-start gap-3 rounded-xl border border-border/80 bg-surface-elevated px-4 py-3 shadow-[0_2px_8px_rgba(60,45,25,0.06)] transition hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(60,45,25,0.1)]">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-[#f5f1ea]">
        <FileText size={15} className="text-muted" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 font-body text-sm text-heading">{item.snippet || <span className="italic text-muted">No content</span>}</p>
        {item.ownerName && (
          <p className="mt-0.5 truncate font-body text-xs text-muted">Re: {item.ownerName}</p>
        )}
      </div>
    </article>
  );
  return item.ownerHref
    ? <Link href={item.ownerHref} className="block">{inner}</Link>
    : inner;
}

// ---------------------------------------------------------------------------
// General search — panel
// ---------------------------------------------------------------------------
const GENERAL_CATEGORY_LABELS: Record<GeneralCategory, string> = {
  people: "People", givenNames: "Given names", surnames: "Last names",
  families: "Families", events: "Events", media: "Media",
  places: "Places", notes: "Notes",
};

function GeneralSearchPanel({ initialQ }: { initialQ?: string }) {
  const [query, setQuery] = useState(initialQ ?? "");
  const [matchType, setMatchType] = useState<MatchType>("contains");
  const [keywordLogic, setKeywordLogic] = useState<"or" | "and">("or");
  const [categories, setCategories] = useState<GeneralCategory[]>([]);
  const [results, setResults] = useState<GeneralResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [categoryOffsets, setCategoryOffsets] = useState(EMPTY_GENERAL_OFFSETS);
  const abortRef = useRef<AbortController | null>(null);

  const setCategoryOffset = useCallback((cat: GeneralCategory, offset: number) => {
    setCategoryOffsets((prev) => ({ ...prev, [cat]: offset }));
  }, []);

  const toggleCategory = useCallback((cat: GeneralCategory) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }, []);

  // Empty selection = show all; otherwise show only selected categories
  const show = useCallback((cat: GeneralCategory) =>
    categories.length === 0 || categories.includes(cat), [categories]);

  const doSearch = useCallback(async (q: string, mt: MatchType, kl: "or" | "and") => {
    if (!q.trim()) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    try {
      const url = `/api/tree/advanced-search/general?q=${encodeURIComponent(q.trim())}&matchType=${mt}&keywordLogic=${kl}`;
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      setResults(await res.json() as GeneralResults);
      setCategoryOffsets(EMPTY_GENERAL_OFFSETS);
      setHasSearched(true);
    } catch (e) {
      if ((e as { name?: string }).name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const trimmed = initialQ?.trim();
    if (!trimmed) return;
    setQuery(trimmed);
    void doSearch(trimmed, "contains", "or");
  }, [initialQ, doSearch]);

  const handleSearch = useCallback(() => doSearch(query, matchType, keywordLogic), [query, matchType, keywordLogic, doSearch]);
  const handleReset = useCallback(() => {
    setQuery(""); setMatchType("contains"); setKeywordLogic("or"); setCategories([]); setResults(null); setHasSearched(false); setError(null); setCategoryOffsets(EMPTY_GENERAL_OFFSETS);
  }, []);

  const totalResults = results
    ? results.people.total + results.families.total + results.events.total +
      results.media.total + results.surnames.total + results.givenNames.total +
      results.places.total + results.notes.total
    : 0;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#e8e0d4] bg-white p-5 shadow-[0_4px_16px_rgba(60,45,25,0.06)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <p className={LABEL}>Keyword</p>
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
              <input
                type="text"
                className={INPUT_WITH_LEFT_ICON}
                placeholder="Search across everything…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
              />
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button type="button" onClick={handleSearch} className={SEARCH_BTN_PRIMARY}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : "Search"}
            </Button>
            <Button type="button" variant="outline" onClick={handleReset} className={SEARCH_BTN_RESET} title="Clear">
              <RotateCcw size={16} aria-hidden />
            </Button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <ChipGroup label="Match type" value={matchType}
            options={[
              { value: "contains", label: "Contains" },
              { value: "exact",    label: "Exact match" },
              { value: "soundex",  label: "Sounds like" },
            ]}
            onChange={(v) => setMatchType(v as MatchType)}
          />
          <ChipGroup label="Multiple keywords" value={keywordLogic}
            options={[
              { value: "or",  label: "Match any" },
              { value: "and", label: "Match all" },
            ]}
            onChange={(v) => setKeywordLogic(v as "or" | "and")}
          />
          <div>
            <p className={LABEL}>Filter by category</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {(Object.keys(GENERAL_CATEGORY_LABELS) as GeneralCategory[]).map((cat) => (
                <button key={cat} type="button" onClick={() => toggleCategory(cat)}
                  className={categories.includes(cat) ? CHIP_ACTIVE : CHIP_INACTIVE}>
                  {GENERAL_CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 font-body text-sm text-red-700">{error}</div>
      )}

      {hasSearched && results && (
        <div className="space-y-5">
          {totalResults === 0 && (
            <div className="rounded-xl border border-[#e8e0d4] bg-white px-6 py-10 text-center">
              <Search size={32} className="mx-auto mb-3 text-muted/50" aria-hidden />
              <p className="font-heading text-base font-semibold text-heading">No results found</p>
              <p className="mt-1 font-body text-sm text-muted">Try a different keyword.</p>
            </div>
          )}
          {show("people") && results.people.total > 0 && (
            <GeneralSection
              title="People"
              total={results.people.total}
              icon={User}
              items={results.people.items}
              offset={categoryOffsets.people}
              onPageChange={(o) => setCategoryOffset("people", o)}
              getKey={(item) => item.id}
              renderItem={(item) => <GeneralPersonCard item={item} />}
            />
          )}
          {show("surnames") && results.surnames.total > 0 && (
            <GeneralSection
              title="Last names"
              total={results.surnames.total}
              icon={User}
              items={results.surnames.items}
              offset={categoryOffsets.surnames}
              onPageChange={(o) => setCategoryOffset("surnames", o)}
              getKey={(item) => item.id}
              renderItem={(item) => <GeneralNameCard item={item} kind="surname" />}
            />
          )}
          {show("givenNames") && results.givenNames.total > 0 && (
            <GeneralSection
              title="Given names"
              total={results.givenNames.total}
              icon={User}
              items={results.givenNames.items}
              offset={categoryOffsets.givenNames}
              onPageChange={(o) => setCategoryOffset("givenNames", o)}
              getKey={(item) => item.id}
              renderItem={(item) => <GeneralNameCard item={item} kind="givenName" />}
            />
          )}
          {show("families") && results.families.total > 0 && (
            <GeneralSection
              title="Families"
              total={results.families.total}
              icon={Users}
              items={results.families.items}
              offset={categoryOffsets.families}
              onPageChange={(o) => setCategoryOffset("families", o)}
              getKey={(item) => item.id}
              renderItem={(item) => <GeneralFamilyCard item={item} />}
            />
          )}
          {show("events") && results.events.total > 0 && (
            <GeneralSection
              title="Events"
              total={results.events.total}
              icon={Calendar}
              items={results.events.items}
              offset={categoryOffsets.events}
              onPageChange={(o) => setCategoryOffset("events", o)}
              getKey={(item) => item.id}
              renderItem={(item) => <GeneralEventCard item={item} />}
            />
          )}
          {show("media") && results.media.total > 0 && (
            <GeneralSection
              title="Media & Stories"
              total={results.media.total}
              icon={ImageIcon}
              items={results.media.items}
              offset={categoryOffsets.media}
              onPageChange={(o) => setCategoryOffset("media", o)}
              getKey={(item) => `${item.source}-${item.id}`}
              renderItem={(item) => <GeneralMediaCard item={item} />}
            />
          )}
          {show("places") && results.places.total > 0 && (
            <GeneralSection
              title="Places"
              total={results.places.total}
              icon={MapPin}
              items={results.places.items}
              offset={categoryOffsets.places}
              onPageChange={(o) => setCategoryOffset("places", o)}
              getKey={(item) => item.id}
              renderItem={(item) => <GeneralPlaceCard item={item} />}
            />
          )}
          {show("notes") && results.notes.total > 0 && (
            <GeneralSection
              title="Notes"
              total={results.notes.total}
              icon={FileText}
              items={results.notes.items}
              offset={categoryOffsets.notes}
              onPageChange={(o) => setCategoryOffset("notes", o)}
              getKey={(item) => item.id}
              renderItem={(item) => <GeneralNoteCard item={item} />}
            />
          )}
        </div>
      )}

      {!hasSearched && !loading && (
        <div className="rounded-xl border border-[#e8e0d4] bg-white px-6 py-12 text-center">
          <Search size={40} className="mx-auto mb-4 text-muted/40" aria-hidden />
          <p className="font-heading text-lg font-semibold text-heading">Search everything</p>
          <p className="mt-1 font-body text-sm text-muted">
            Enter a keyword — or comma-separated keywords — to search across people, places, notes, events, and more.
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Media tab — search panel
// ---------------------------------------------------------------------------
function buildMediaUrl(filters: MediaFilters, limit: number, offset: number): string {
  const params = new URLSearchParams();
  if (filters.title) params.set("title", filters.title);
  if (filters.mediaTypes.length > 0) params.set("mediaTypes", filters.mediaTypes.join(","));
  if (filters.linkedToKind === "person" && filters.linkedToPerson) {
    params.set("linkedToKind", "person");
    params.set("linkedToId", filters.linkedToPerson.id);
  } else if (filters.linkedToKind === "family" && filters.linkedToFamily) {
    params.set("linkedToKind", "family");
    params.set("linkedToId", filters.linkedToFamily.id);
  }
  if (filters.tagId) params.set("tagId", filters.tagId.id);
  if (filters.albumId) params.set("albumId", filters.albumId.id);
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  return `/api/tree/advanced-search/media?${params.toString()}`;
}

const SOURCE_LABELS: Record<string, string> = {
  gedcom: "GEDCOM", site: "Site media", user: "User media", story: "Story",
};

function MediaResultCard({ item }: { item: MediaSearchItem }) {
  const Icon = MEDIA_TYPE_ICONS[item.mediaType] ?? FileText;
  const storyKindLabel = item.kind
    ? { story: "Story", article: "Article", post: "Post", folklore: "Folklore" }[item.kind] ?? item.kind
    : null;

  const inner = (
    <article className="group min-w-0 rounded-xl border border-border/80 bg-surface-elevated px-4 py-3.5 shadow-[0_2px_8px_rgba(60,45,25,0.06)] transition hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(60,45,25,0.1)]">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-[#f5f1ea]">
          <Icon size={18} className="text-muted" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="truncate font-heading text-base font-semibold text-heading">
            {item.title ?? <span className="italic text-muted">Untitled</span>}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[#e0d8cc] bg-[#faf7f2] px-2 py-0.5 font-body text-[10px] text-muted">
              {storyKindLabel ?? item.mediaType}
            </span>
            <span className="font-body text-[10px] text-muted">{SOURCE_LABELS[item.source] ?? item.source}</span>
          </div>
        </div>
      </div>
    </article>
  );

  if (item.profileHref) {
    return (
      <Link href={item.profileHref} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}

function MediaSearchPanel() {
  const [filters, setFilters] = useState<MediaFilters>(EMPTY_MEDIA_FILTERS);
  const [results, setResults] = useState<MediaSearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [offset, setOffset] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const doSearch = useCallback(async (f: MediaFilters, off: number) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true); setError(null);
    try {
      const url = buildMediaUrl(f, PAGE_LIMIT, off);
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      setResults(await res.json() as MediaSearchResults);
      setHasSearched(true);
    } catch (e) {
      if ((e as { name?: string }).name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback(() => { setOffset(0); doSearch(filters, 0); }, [filters, doSearch]);

  const handleReset = useCallback(() => {
    setFilters(EMPTY_MEDIA_FILTERS);
    setResults(null); setHasSearched(false); setError(null); setOffset(0);
  }, []);

  useEffect(() => {
    if (!hasSearched) return;
    doSearch(filters, offset);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset]);

  const setF = useCallback(<K extends keyof MediaFilters>(k: K, v: MediaFilters[K]) =>
    setFilters(f => ({ ...f, [k]: v })), []);

  const toggleMediaType = useCallback((type: string) => {
    setFilters(f => ({
      ...f,
      mediaTypes: f.mediaTypes.includes(type) ? f.mediaTypes.filter(t => t !== type) : [...f.mediaTypes, type],
    }));
  }, []);

  const total = results?.total ?? 0;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#e8e0d4] bg-white p-5 shadow-[0_4px_16px_rgba(60,45,25,0.06)]">

        {/* Title search */}
        <div className="space-y-1.5">
          <p className={LABEL}>Title</p>
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
            <input type="text" className={INPUT_WITH_LEFT_ICON} placeholder="Search by title…"
              value={filters.title} onChange={e => setF("title", e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleSearch(); }}
            />
          </div>
        </div>

        {/* Media type chips */}
        <div className="mt-4 space-y-1.5">
          <p className={LABEL}>Media type</p>
          <div className="flex flex-wrap gap-1.5">
            {MEDIA_TYPE_OPTIONS.map(opt => {
              const active = filters.mediaTypes.includes(opt.value);
              if (opt.disabled) {
                return (
                  <span key={opt.value}
                    title="Coming soon"
                    className="cursor-not-allowed rounded-full border border-[#d8cfc0] bg-white px-3 py-1.5 font-body text-xs font-medium text-muted/40">
                    {opt.label}
                  </span>
                );
              }
              return (
                <button key={opt.value} type="button" onClick={() => toggleMediaType(opt.value)}
                  className={active ? CHIP_ACTIVE : CHIP_INACTIVE}>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Linked to */}
        <div className="mt-4 space-y-2">
          <ChipGroup label="Linked to" value={filters.linkedToKind}
            options={[
              { value: "none", label: "Any" },
              { value: "person", label: "Person" },
              { value: "family", label: "Family" },
            ]}
            onChange={v => {
              setFilters(f => ({ ...f, linkedToKind: v as MediaLinkedToKind, linkedToPerson: null, linkedToFamily: null }));
            }}
          />
          {filters.linkedToKind === "person" && (
            <PersonPicker value={filters.linkedToPerson} onChange={p => setF("linkedToPerson", p)} />
          )}
          {filters.linkedToKind === "family" && (
            <FamilyPicker value={filters.linkedToFamily} onChange={f => setF("linkedToFamily", f)} />
          )}
        </div>

        {/* Tag + Album pickers */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <p className={LABEL}>Tag</p>
            <TagPicker value={filters.tagId} onChange={t => setF("tagId", t)} />
          </div>
          <div className="space-y-1.5">
            <p className={LABEL}>Album</p>
            <AlbumPicker value={filters.albumId} onChange={a => setF("albumId", a)} />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex gap-2 border-t border-[#ebe4d9] pt-4">
          <Button type="button" onClick={handleSearch} className={SEARCH_BTN_PRIMARY}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Search media"}
          </Button>
          <Button type="button" variant="outline" onClick={handleReset} className={SEARCH_BTN_RESET} title="Reset all">
            <RotateCcw size={16} aria-hidden />
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 font-body text-sm text-red-700">{error}</div>
      )}

      {hasSearched && results && (
        <div className="space-y-3">
          <p className="font-body text-sm text-muted">
            {total === 0 ? "No media found." : `${total} ${total === 1 ? "item" : "items"} found`}
          </p>
          {results.items.map(item => <MediaResultCard key={`${item.source}-${item.id}`} item={item} />)}
          {total > PAGE_LIMIT && (
            <div className="flex items-center justify-between font-body text-sm">
              <span className="text-muted">{offset + 1}–{Math.min(offset + PAGE_LIMIT, total)} of {total}</span>
              <div className="flex gap-2">
                <button type="button" disabled={offset <= 0}
                  onClick={() => setOffset(o => Math.max(0, o - PAGE_LIMIT))}
                  className="rounded-lg border border-border-subtle bg-surface px-3 py-1.5 text-sm font-medium text-link transition hover:bg-link-soft-bg disabled:cursor-not-allowed disabled:opacity-40">
                  Previous
                </button>
                <button type="button" disabled={offset + PAGE_LIMIT >= total}
                  onClick={() => setOffset(o => o + PAGE_LIMIT)}
                  className="rounded-lg border border-border-subtle bg-surface px-3 py-1.5 text-sm font-medium text-link transition hover:bg-link-soft-bg disabled:cursor-not-allowed disabled:opacity-40">
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!hasSearched && !loading && (
        <div className="rounded-xl border border-[#e8e0d4] bg-white px-6 py-12 text-center">
          <ImageIcon size={40} className="mx-auto mb-4 text-muted/40" aria-hidden />
          <p className="font-heading text-lg font-semibold text-heading">Search the media library</p>
          <p className="mt-1 font-body text-sm text-muted">
            Filter by type, linked person or family, tag, album, or title and press Search media.
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------
const PAGE_LIMIT = 20;

interface AdvancedSearchPageProps {
  nlTreeId?: string | null;
  initialMode?: string;
  initialQ?: string;
}

export function AdvancedSearchPage({ nlTreeId, initialMode, initialQ }: AdvancedSearchPageProps = {}) {
  // Top-level mode
  const [searchMode, setSearchMode] = useState<"general" | "people" | "events" | "media" | "nl">(
    initialMode === "general" ? "general" : "people"
  );

  // People & families form state
  const [q, setQ] = useState(initialQ ?? "");
  const [nameField, setNameField] = useState<NameField>("fullName");
  const [matchType, setMatchType] = useState<MatchType>("contains");
  const [scope, setScope] = useState<Scope>("both");
  const [indFilters, setIndFilters] = useState<IndividualFilters>(EMPTY_IND);
  const [famFilters, setFamFilters] = useState<FamilyFilters>(EMPTY_FAM);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<"individuals" | "families" | "names">("individuals");
  const [indOffset, setIndOffset] = useState(0);
  const [famOffset, setFamOffset] = useState(0);

  // Search results
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const doSearch = useCallback(async (
    searchQ: string, nf: NameField, mt: MatchType, sc: Scope,
    ind: IndividualFilters, fam: FamilyFilters,
    iOff: number, fOff: number,
  ) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    try {
      const url = buildSearchUrl(searchQ, nf, mt, sc, ind, fam, PAGE_LIMIT, iOff, fOff);
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      const data = await res.json() as SearchResults;
      setResults(data);
      setHasSearched(true);
    } catch (e) {
      if ((e as { name?: string }).name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback(() => {
    setIndOffset(0);
    setFamOffset(0);
    doSearch(q, nameField, matchType, scope, indFilters, famFilters, 0, 0);
  }, [q, nameField, matchType, scope, indFilters, famFilters, doSearch]);

  const handleReset = useCallback(() => {
    setQ("");
    setNameField("fullName");
    setMatchType("contains");
    setScope("both");
    setIndFilters(EMPTY_IND);
    setFamFilters(EMPTY_FAM);
    setResults(null);
    setHasSearched(false);
    setError(null);
    setIndOffset(0);
    setFamOffset(0);
  }, []);

  useEffect(() => {
    const trimmed = initialQ?.trim();
    if (!trimmed || initialMode === "general" || searchMode !== "people") return;
    setQ(trimmed);
    setIndOffset(0);
    setFamOffset(0);
    void doSearch(trimmed, "fullName", "contains", "both", EMPTY_IND, EMPTY_FAM, 0, 0);
  }, [initialQ, initialMode, searchMode, doSearch]);

  // Re-search on pagination
  useEffect(() => {
    if (!hasSearched) return;
    doSearch(q, nameField, matchType, scope, indFilters, famFilters, indOffset, famOffset);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indOffset, famOffset]);

  const indCount = results?.totalIndividuals ?? 0;
  const famCount = results?.totalFamilies ?? 0;
  const namesCount = (results?.totalSurnames ?? 0) + (results?.totalGivenNames ?? 0);

  return (
    <div className="flex min-h-screen flex-col bg-[#faf7f2]">
      <Navbar />

      <main className="flex-1 pb-28 sm:pb-20">
        {/* Hero header */}
        <section className="relative min-w-0 overflow-x-hidden pb-4 pt-14 sm:pb-10 md:pb-14 md:pt-32">
          <div className="absolute inset-0 min-w-0 max-w-full">
            <Image src="/images/searchHeader.png" alt="" fill priority className="object-cover" sizes="100vw" />
            <div className="absolute inset-0 bg-gradient-to-r from-bg/96 via-bg/82 to-bg/35 md:from-bg/92 md:via-bg/78 md:to-bg/20" />
            <div className="absolute inset-y-0 left-0 w-[58%] bg-gradient-to-r from-bg to-transparent" />
          </div>

          <div className="relative z-10 min-w-0 max-w-full">
            <PageContainer fullWidth>
              <div className="grid min-w-0 max-w-full gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-end lg:gap-10">
                <div className="min-w-0 max-w-full space-y-5 p-5 backdrop-blur-md [-webkit-backdrop-filter:blur(14px)] [backdrop-filter:blur(14px)] sm:p-6">
                  <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center gap-2 font-body text-xs tracking-[0.06em] text-muted">
                    <Link href="/" className="min-w-0 shrink transition hover:text-link">Home</Link>
                    <span className="shrink-0 text-subtle">/</span>
                    <span className="min-w-0 text-heading">Search</span>
                  </nav>

                  <h1 className="break-words font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-heading sm:text-5xl md:text-6xl">
                    Search
                  </h1>

                  <div className="h-px w-24 bg-gradient-to-r from-link/70 via-link/30 to-transparent" />

                  <p className="max-w-2xl font-body text-base leading-relaxed text-muted sm:text-lg md:text-xl">
                    Search individuals, families, and events across the family records — or ask a question in plain language.
                  </p>
                </div>

                <div className="relative hidden min-h-[280px] overflow-hidden rounded-2xl border border-white/15 bg-black/10 shadow-[0_20px_50px_rgba(25,18,12,0.35)] lg:block">
                  <Image src="/images/searchHeader.png" alt="" fill className="object-cover opacity-90 sepia-[0.25]" sizes="40vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg/40 via-transparent to-bg/10" />
                  <div className="absolute inset-y-0 left-0 w-2/5 bg-gradient-to-r from-bg/65 to-transparent" />
                </div>
              </div>
            </PageContainer>
          </div>
        </section>

        <div className="pt-8">
        <PageContainer fullWidth>
          {/* Top-level mode toggle — desktop only */}
          <div className="mb-5 hidden gap-1 rounded-xl border border-[#e8e0d4] bg-white p-1 shadow-sm sm:flex">
            <button type="button"
              onClick={() => setSearchMode("general")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 font-body text-sm font-semibold transition-colors",
                searchMode === "general" ? "bg-[#8b2e2e] text-white" : "text-muted hover:bg-black/[0.03]",
              )}
            >
              <Search size={15} aria-hidden />
              General
            </button>
            <button type="button"
              onClick={() => setSearchMode("people")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 font-body text-sm font-semibold transition-colors",
                searchMode === "people" ? "bg-[#8b2e2e] text-white" : "text-muted hover:bg-black/[0.03]",
              )}
            >
              <Users size={15} aria-hidden />
              People, Families &amp; Names
            </button>
            <button type="button"
              onClick={() => setSearchMode("events")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 font-body text-sm font-semibold transition-colors",
                searchMode === "events" ? "bg-[#8b2e2e] text-white" : "text-muted hover:bg-black/[0.03]",
              )}
            >
              <Calendar size={15} aria-hidden />
              Events
            </button>
            <button type="button"
              onClick={() => setSearchMode("media")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 font-body text-sm font-semibold transition-colors",
                searchMode === "media" ? "bg-[#8b2e2e] text-white" : "text-muted hover:bg-black/[0.03]",
              )}
            >
              <ImageIcon size={15} aria-hidden />
              Media
            </button>
            <button type="button"
              onClick={() => setSearchMode("nl")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 font-body text-sm font-semibold transition-colors",
                searchMode === "nl" ? "bg-[#8b2e2e] text-white" : "text-muted hover:bg-black/[0.03]",
              )}
            >
              <Sparkles size={15} aria-hidden />
              Ask a question
            </button>
          </div>

          {searchMode === "general" && <GeneralSearchPanel initialQ={initialQ} />}
          {searchMode === "events" && <EventsSearchPanel />}
          {searchMode === "media" && <MediaSearchPanel />}

          {searchMode === "nl" && (
            <NlSearchPlayground treeId={nlTreeId ?? null} inline />
          )}

          {/* People & Families search form */}
          {searchMode === "people" && <>

          <div className="rounded-2xl border border-[#e8e0d4] bg-white p-5 shadow-[0_4px_16px_rgba(60,45,25,0.06)]">
            {/* Name search row */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-1.5">
                <p className={LABEL}>Name</p>
                <div className="relative">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
                  <input
                    type="text"
                    className={INPUT_WITH_LEFT_ICON}
                    placeholder="Search by name…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                  />
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button type="button" onClick={handleSearch} className={SEARCH_BTN_PRIMARY}>
                  {loading ? <Loader2 size={16} className="animate-spin" /> : "Search"}
                </Button>
                <Button type="button" variant="outline" onClick={handleReset}
                  className={SEARCH_BTN_RESET}
                  title="Reset all"
                >
                  <RotateCcw size={16} aria-hidden />
                </Button>
              </div>
            </div>

            {/* Name field + match type */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ChipGroup label="Search in" value={nameField}
                options={[{value:"fullName",label:"Full name"},{value:"surname",label:"Surname"},{value:"givenName",label:"Given name"}]}
                onChange={setNameField} />
              <ChipGroup label="Match type" value={matchType}
                options={[{value:"contains",label:"Contains"},{value:"exact",label:"Exact"},{value:"soundex",label:"Sounds like"}]}
                onChange={setMatchType} />
            </div>

            {/* Scope */}
            <div className="mt-4">
              <ChipGroup label="Results" value={scope}
                options={[
                  {value:"both",      label:"People, Families & Names"},
                  {value:"individuals",label:"People only"},
                  {value:"families",  label:"Families only"},
                  {value:"names",     label:"Names only"},
                ]}
                onChange={(v) => setScope(v)} />
            </div>

            {/* Filter toggle */}
            <div className="mt-4 border-t border-[#ebe4d9] pt-4">
              <button type="button"
                onClick={() => setShowFilters((o) => !o)}
                className="flex items-center gap-1.5 font-body text-sm font-medium text-link transition-colors hover:text-link-soft-fg"
              >
                {showFilters ? <ChevronUp size={16} aria-hidden /> : <ChevronDown size={16} aria-hidden />}
                {showFilters ? "Hide filters" : "Show filters"}
              </button>
            </div>

            {showFilters && (
              <div className="mt-4 space-y-4">
                {(scope === "both" || scope === "individuals") && (
                  <div>
                    <p className="mb-2 font-heading text-sm font-semibold text-heading">Individual filters</p>
                    <IndividualFilterPanel filters={indFilters} onChange={setIndFilters} />
                  </div>
                )}
                {(scope === "both" || scope === "families") && (
                  <div>
                    <p className="mb-2 font-heading text-sm font-semibold text-heading">Family filters</p>
                    <FamilyFilterPanel filters={famFilters} onChange={setFamFilters} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 font-body text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Results */}
          {hasSearched && results && (
            <div className="mt-6 space-y-4">
              {/* Tabs when showing both */}
              {scope === "both" && (
                <div className="overflow-x-auto rounded-xl border border-[#e8e0d4] bg-white p-1 shadow-sm [-webkit-overflow-scrolling:touch]">
                  <div className="flex w-max min-w-full gap-1">
                  <button type="button"
                    onClick={() => setActiveTab("individuals")}
                    className={cn(
                      "flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-2 font-body text-sm font-semibold transition-colors",
                      activeTab === "individuals"
                        ? "bg-[#8b2e2e] text-white"
                        : "text-muted hover:bg-black/[0.03]",
                    )}
                  >
                    <User size={14} aria-hidden />
                    People
                    <span className={cn("ml-0.5 rounded-full px-1.5 py-0.5 font-body text-[10px]",
                      activeTab === "individuals" ? "bg-white/20" : "bg-[#ede6db] text-muted")}>
                      {indCount}
                    </span>
                  </button>
                  <button type="button"
                    onClick={() => setActiveTab("families")}
                    className={cn(
                      "flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-2 font-body text-sm font-semibold transition-colors",
                      activeTab === "families"
                        ? "bg-[#8b2e2e] text-white"
                        : "text-muted hover:bg-black/[0.03]",
                    )}
                  >
                    <Users size={14} aria-hidden />
                    Families
                    <span className={cn("ml-0.5 rounded-full px-1.5 py-0.5 font-body text-[10px]",
                      activeTab === "families" ? "bg-white/20" : "bg-[#ede6db] text-muted")}>
                      {famCount}
                    </span>
                  </button>
                  <button type="button"
                    onClick={() => setActiveTab("names")}
                    className={cn(
                      "flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-2 font-body text-sm font-semibold transition-colors",
                      activeTab === "names"
                        ? "bg-[#8b2e2e] text-white"
                        : "text-muted hover:bg-black/[0.03]",
                    )}
                  >
                    <User size={14} aria-hidden />
                    Names
                    <span className={cn("ml-0.5 rounded-full px-1.5 py-0.5 font-body text-[10px]",
                      activeTab === "names" ? "bg-white/20" : "bg-[#ede6db] text-muted")}>
                      {namesCount}
                    </span>
                  </button>
                  </div>
                </div>
              )}

              {/* Individual results */}
              {(scope === "individuals" || (scope === "both" && activeTab === "individuals")) && (
                <div className="space-y-3">
                  <p className="font-body text-sm text-muted">
                    {indCount === 0 ? "No people found." : `${indCount} ${indCount === 1 ? "person" : "people"} found`}
                  </p>
                  {results.individuals.map((ind) => (
                    <IndividualCard key={ind.id} individual={ind} />
                  ))}
                  <Pagination
                    total={indCount} limit={PAGE_LIMIT}
                    offset={indOffset}
                    onPageChange={(off) => setIndOffset(off)}
                  />
                </div>
              )}

              {/* Family results */}
              {(scope === "families" || (scope === "both" && activeTab === "families")) && (
                <div className="space-y-3">
                  <p className="font-body text-sm text-muted">
                    {famCount === 0 ? "No families found." : `${famCount} ${famCount === 1 ? "family" : "families"} found`}
                  </p>
                  {results.families.map((fam) => (
                    <FamilyCard key={fam.id} family={fam} />
                  ))}
                  <Pagination
                    total={famCount} limit={PAGE_LIMIT}
                    offset={famOffset}
                    onPageChange={(off) => setFamOffset(off)}
                  />
                </div>
              )}

              {/* Names results */}
              {(scope === "names" || (scope === "both" && activeTab === "names")) && (
                <div className="space-y-3">
                  {(results.surnames.length > 0 || results.givenNames.length > 0) ? (
                    <>
                      {results.surnames.length > 0 && (
                        <div className="space-y-3">
                          <p className={cn(LABEL, "pt-1")}>
                            Surnames{results.totalSurnames > results.surnames.length ? ` — showing top ${results.surnames.length} of ${results.totalSurnames}` : ` — ${results.totalSurnames}`}
                          </p>
                          {results.surnames.map(s => (
                            <NameCard key={s.id} name={s.surname} frequency={s.frequency}
                              href={`/surnames/${encodeURIComponent(s.id)}`} kind="surname" />
                          ))}
                        </div>
                      )}
                      {results.givenNames.length > 0 && (
                        <div className="space-y-3">
                          <p className={cn(LABEL, results.surnames.length > 0 ? "pt-3" : "pt-1")}>
                            Given names{results.totalGivenNames > results.givenNames.length ? ` — showing top ${results.givenNames.length} of ${results.totalGivenNames}` : ` — ${results.totalGivenNames}`}
                          </p>
                          {results.givenNames.map(gn => (
                            <NameCard key={gn.id} name={gn.givenName} frequency={gn.frequency}
                              href={`/given-names/${encodeURIComponent(gn.id)}`} kind="givenName" />
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="rounded-xl border border-[#e8e0d4] bg-white px-6 py-10 text-center">
                      <Search size={32} className="mx-auto mb-3 text-muted/50" aria-hidden />
                      <p className="font-heading text-base font-semibold text-heading">No names found</p>
                      <p className="mt-1 font-body text-sm text-muted">Try a different search term or &ldquo;Sounds like&rdquo; matching.</p>
                    </div>
                  )}
                </div>
              )}

              {indCount === 0 && famCount === 0 && namesCount === 0 && (
                <div className="rounded-xl border border-[#e8e0d4] bg-white px-6 py-10 text-center">
                  <Search size={32} className="mx-auto mb-3 text-muted/50" aria-hidden />
                  <p className="font-heading text-base font-semibold text-heading">No results found</p>
                  <p className="mt-1 font-body text-sm text-muted">Try a different name, broader filters, or &ldquo;Sounds like&rdquo; matching.</p>
                </div>
              )}
            </div>
          )}

          {/* Initial empty state */}
          {!hasSearched && !loading && (
            <div className="mt-10 rounded-xl border border-[#e8e0d4] bg-white px-6 py-12 text-center">
              <Search size={40} className="mx-auto mb-4 text-muted/40" aria-hidden />
              <p className="font-heading text-lg font-semibold text-heading">
                {scope === "names" ? "Search the name records" : "Search the family records"}
              </p>
              <p className="mt-1 font-body text-sm text-muted">
                {scope === "names"
                  ? "Enter a name above and press Search to find matching surnames and given names."
                  : "Enter a name above, apply filters, and press Search."}
              </p>
            </div>
          )}
          </>}
        </PageContainer>
        </div>
        <SearchMobileNav searchMode={searchMode} onSearchModeChange={setSearchMode} />
      </main>

      <Footer />
    </div>
  );
}
