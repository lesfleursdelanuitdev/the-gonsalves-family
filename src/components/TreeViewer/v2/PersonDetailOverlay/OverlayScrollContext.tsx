"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
  useMemo,
} from "react";

export type ScrollDirection = "up" | "down";

interface OverlayScrollContextValue {
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  scrollDirectionRef: React.MutableRefObject<ScrollDirection>;
  scrollRootElement: HTMLDivElement | null;
  onScroll: () => void;
  setScrollRoot: (el: HTMLDivElement | null) => void;
}

const OverlayScrollContext = createContext<OverlayScrollContextValue | null>(null);

export function OverlayScrollProvider({ children }: { children: ReactNode }) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollDirectionRef = useRef<ScrollDirection>("down");
  const lastScrollTop = useRef(0);
  const [scrollRootElement, setScrollRootElement] = useState<HTMLDivElement | null>(null);

  const setScrollRoot = useCallback((el: HTMLDivElement | null) => {
    scrollContainerRef.current = el;
    setScrollRootElement(el);
  }, []);

  const onScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const top = el.scrollTop;
    if (top > lastScrollTop.current) scrollDirectionRef.current = "down";
    else if (top < lastScrollTop.current) scrollDirectionRef.current = "up";
    lastScrollTop.current = top;
  }, []);

  const value = useMemo(
    () => ({ scrollContainerRef, scrollDirectionRef, scrollRootElement, onScroll, setScrollRoot }),
    [onScroll, setScrollRoot, scrollRootElement]
  );

  return (
    <OverlayScrollContext.Provider value={value}>
      {children}
    </OverlayScrollContext.Provider>
  );
}

/** Renders the overlay dialog div with scroll ref and onScroll attached. Use inside OverlayScrollProvider. */
export function OverlayScrollRoot({
  children,
  style,
  footer,
  scrollAreaStyle,
  ...rest
}: {
  children: ReactNode;
  style?: CSSProperties;
  /** Fixed below the scroll area; use with `scrollAreaStyle` so padding lives on the scroll region. */
  footer?: ReactNode;
  /** Merged into the scrollable inner region when `footer` is set. */
  scrollAreaStyle?: CSSProperties;
  [key: string]: unknown;
}) {
  const ctx = useContext(OverlayScrollContext);
  if (!ctx) {
    return (
      <div style={style} {...rest}>
        {children}
        {footer}
      </div>
    );
  }
  const { setScrollRoot, onScroll } = ctx;
  if (footer == null) {
    return (
      <div ref={setScrollRoot} onScroll={onScroll} style={style} {...rest}>
        {children}
      </div>
    );
  }

  const shellStyle: CSSProperties = {
    ...(style ?? {}),
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 0,
    paddingLeft: 0,
  };

  const innerScrollStyle: CSSProperties = {
    flex: 1,
    minHeight: 0,
    overflow: "auto",
    WebkitOverflowScrolling: "touch",
    ...scrollAreaStyle,
  };

  return (
    <div style={shellStyle} {...rest}>
      <div ref={setScrollRoot} onScroll={onScroll} style={innerScrollStyle}>
        {children}
      </div>
      {footer}
    </div>
  );
}

export { OverlayScrollContext };
