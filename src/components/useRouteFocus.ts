import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

// Moves focus to the page heading after navigation so screen readers announce the new page.
export function useRouteFocus() {
  const { pathname } = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const heading = document.querySelector<HTMLElement>("main h1");
    if (heading) {
      heading.tabIndex = -1;
      heading.focus();
    }
  }, [pathname]);
}
