"use client";

import type { CSSProperties, ReactNode } from "react";

/** Full navigation to `/` — avoids client router cases where the URL updates but the view does not. */
export default function BookHomeLink({
  style,
  children,
}: {
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <a
      href="/"
      style={style}
      onClick={(e) => {
        if (
          e.defaultPrevented ||
          e.button !== 0 ||
          e.metaKey ||
          e.ctrlKey ||
          e.shiftKey ||
          e.altKey
        ) {
          return;
        }
        e.preventDefault();
        window.location.assign("/");
      }}
    >
      {children}
    </a>
  );
}
