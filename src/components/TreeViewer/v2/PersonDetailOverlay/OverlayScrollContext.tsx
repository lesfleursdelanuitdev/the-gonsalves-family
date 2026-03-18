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
  ...rest
}: {
  children: ReactNode;
  style?: CSSProperties;
  [key: string]: unknown;
}) {
  const ctx = useContext(OverlayScrollContext);
  if (!ctx) {
    return <div style={style} {...rest}>{children}</div>;
  }
  const { setScrollRoot, onScroll } = ctx;
  return (
    <div
      ref={setScrollRoot}
      onScroll={onScroll}
      style={style}
      {...rest}
    >
      {children}
    </div>
  );
}

export { OverlayScrollContext };
