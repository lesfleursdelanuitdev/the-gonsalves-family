import type { NavIconKey } from "./navIcons";

export type SiteNavItem = {
  label: string;
  href: string;
  description: string;
  icon: NavIconKey;
};

export type SiteNavGroup = {
  id: "tree" | "visualize" | "archive" | "culture" | "research" | "more";
  navLabel: string;
  sectionLabel: string;
  href: string;
  sectionIcon: NavIconKey;
  items: SiteNavItem[];
  /** Desktop dropdown alignment when near viewport edge */
  alignDropdownRight?: boolean;
};

export const SITE_NAV_GROUPS: SiteNavGroup[] = [
  {
    id: "tree",
    navLabel: "Tree",
    sectionLabel: "Explore the Tree",
    href: "/tree",
    sectionIcon: "git-branch",
    alignDropdownRight: false,
    items: [
      {
        label: "Tree Viewer",
        href: "/tree/viewer",
        description: "Explore relationships visually",
        icon: "git-branch",
      },
      {
        label: "Individuals",
        href: "/individuals",
        description: "Browse documented people",
        icon: "user",
      },
      {
        label: "Families",
        href: "/families",
        description: "View connected family groups",
        icon: "home",
      },
      {
        label: "Surnames",
        href: "/surnames",
        description: "Browse family surnames in the tree",
        icon: "type",
      },
      {
        label: "Given Names",
        href: "/given-names",
        description: "Browse given names in the tree",
        icon: "file-signature",
      },
      {
        label: "Events",
        href: "/tree/events",
        description: "Trace births, marriages, migrations",
        icon: "calendar",
      },
      {
        label: "Places",
        href: "/tree/places",
        description: "Explore locations",
        icon: "map-pin",
      },
    ],
  },
  {
    id: "archive",
    navLabel: "Archive",
    sectionLabel: "Family Archive",
    href: "/archive",
    sectionIcon: "book-open",
    /** Opens left from the trigger so the wide card stays on-screen near the search icon. */
    alignDropdownRight: true,
    items: [
      {
        label: "Stories",
        href: "/stories",
        description: "Family memories and histories",
        icon: "book-open",
      },
      {
        label: "Media",
        href: "/media",
        description: "Curated albums and tree-linked photo collections",
        icon: "layout-grid",
      },
      {
        label: "Notes",
        href: "/archive/notes",
        description: "Research notes and remarks from the tree",
        icon: "file-text",
      },
      {
        label: "Scrapbook Generator",
        href: "/scrapbook-generator",
        description: "Create a shareable scrapbook from people, places, events, and tags",
        icon: "sparkles",
      },
      {
        label: "Photos",
        href: "/archive/photos",
        description: "Preserved family images",
        icon: "images",
      },
      {
        label: "Documents",
        href: "/archive/documents",
        description: "Letters, records, and other family papers",
        icon: "scroll-text",
      },
      {
        label: "Audio",
        href: "/archive/audio",
        description: "Voices and recordings",
        icon: "music",
      },
      {
        label: "Videos",
        href: "/archive/videos",
        description: "Moving image archive",
        icon: "video",
      },
    ],
  },
  {
    id: "visualize",
    navLabel: "Visualize",
    sectionLabel: "Visualize the Archive",
    href: "/visualize",
    sectionIcon: "layers",
    alignDropdownRight: false,
    items: [
      {
        label: "Tree Viewer",
        href: "/tree/viewer",
        description: "Explore relationships visually",
        icon: "git-branch",
      },
      {
        label: "Timelines",
        href: "/timelines",
        description: "Follow history through time",
        icon: "route",
      },
      {
        label: "Calendar",
        href: "/visualize/calendar",
        description: "Browse births, anniversaries, and upcoming dates",
        icon: "calendar",
      },
      {
        label: "Maps",
        href: "/maps",
        description: "Explore places and migration on a map",
        icon: "map",
      },
      {
        label: "Story Viewer",
        href: "/visualize/story-viewer",
        description: "Read published family stories",
        icon: "scroll-text",
      },
      {
        label: "Timeline/Map Combo",
        href: "/visualize/timeline-map",
        description: "Timeline and map together in one view",
        icon: "columns-2",
      },
    ],
  },
  {
    id: "culture",
    navLabel: "Culture",
    sectionLabel: "Culture & Heritage",
    href: "/culture",
    sectionIcon: "landmark",
    alignDropdownRight: true,
    items: [
      {
        label: "Articles",
        href: "/culture/articles",
        description: "Context and essays",
        icon: "newspaper",
      },
      {
        label: "Language",
        href: "/culture/language",
        description: "Words, names, and phrases",
        icon: "languages",
      },
      {
        label: "Folklore",
        href: "/culture/folklore",
        description: "Stories, beliefs, and traditions passed down",
        icon: "feather",
      },
      {
        label: "Recipes",
        href: "/culture/recipes",
        description: "Food and memory",
        icon: "utensils",
      },
    ],
  },
  {
    id: "research",
    navLabel: "Research",
    sectionLabel: "Research & Evidence",
    href: "/research",
    sectionIcon: "search",
    /** Near the search icon — anchor right so the panel opens left. */
    alignDropdownRight: true,
    items: [
      {
        label: "Open questions",
        href: "/research/open-questions",
        description: "Unresolved research items to verify",
        icon: "list-checks",
      },
      {
        label: "Sources",
        href: "/research/sources",
        description: "Citations and documentary references in the tree",
        icon: "book-marked",
      },
      {
        label: "Repositories",
        href: "/research/repositories",
        description: "Archives and holding institutions",
        icon: "building",
      },
      {
        label: "Statistics notebook",
        href: "/research/statistics-notebook",
        description: "Charts and counts across the published tree",
        icon: "bar-chart",
      },
      {
        label: "Analytics search",
        href: "/research/nl-search",
        description: "Ask analytics questions about the tree in plain language",
        icon: "search",
      },
      {
        label: "Relationship calculator",
        href: "/research/relationship-calculator",
        description: "Find out how any two people in the tree are related",
        icon: "dna",
      },
    ],
  },
  {
    id: "more",
    navLabel: "More",
    sectionLabel: "More",
    href: "/more",
    sectionIcon: "more-horizontal",
    /** Last item before login/search — anchor right so the panel opens left. */
    alignDropdownRight: true,
    items: [
      {
        label: "What's New",
        href: "/more/whats-new",
        description: "Latest announcements and updates from the archive",
        icon: "megaphone",
      },
      {
        label: "About Creators",
        href: "/more/about-creators",
        description: "Who built and maintains this family archive",
        icon: "users",
      },
      {
        label: "Upcoming Anniversaries",
        href: "/more/upcoming-anniversaries",
        description: "Birthdays and anniversaries coming up soon",
        icon: "heart",
      },
      {
        label: "Useful Links",
        href: "/more/useful-links",
        description: "External resources and recommended sites",
        icon: "link",
      },
      {
        label: "Contact",
        href: "/contact",
        description: "Get in touch with the family archive team",
        icon: "mail",
      },
      {
        label: "Contribute",
        href: "/contribute",
        description: "Share memories, corrections, and materials",
        icon: "hand-helping",
      },
      {
        label: "Help",
        href: "/help",
        description: "Guidance for using the archive",
        icon: "life-buoy",
      },
    ],
  },
];

export const SITE_NAV_SEARCH_HREF = "/search";

/** Public site sign-in (append `?returnTo=` from client where needed). */
export const SITE_NAV_LOGIN_HREF = "/login";
