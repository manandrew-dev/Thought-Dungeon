import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const APP = "Thought Dungeon";

function titleFor(pathname: string): string {
  if (pathname === "/") return APP;
  if (pathname === "/new") return `New encounter · ${APP}`;
  if (/^\/encounter\/[^/]+\/tame$/.test(pathname)) return `Taming · ${APP}`;
  if (pathname.startsWith("/encounter/")) return `Encounter · ${APP}`;
  if (pathname.startsWith("/bestiary/")) return `Bestiary entry · ${APP}`;
  if (pathname === "/bestiary") return `Bestiary · ${APP}`;
  if (pathname === "/learn") return `Thinking patterns · ${APP}`;
  if (pathname === "/settings") return `Settings · ${APP}`;
  return APP;
}

// Distinct page titles so tabs and screen readers can tell pages apart (WCAG 2.4.2).
export function usePageTitle(title?: string) {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = title ?? titleFor(pathname);
  }, [title, pathname]);
}
