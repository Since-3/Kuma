"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function NavigationProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const prevPathname = useRef(pathname);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname;
      // Navigation completed — finish the bar (deferred to avoid synchronous setState in effect)
      timerRef.current = setTimeout(() => {
        setWidth(100);
        timerRef.current = setTimeout(() => {
          setVisible(false);
          setWidth(0);
        }, 300);
      }, 0);
    }
  }, [pathname]);

  // Start the bar on link clicks
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:")) return;
      // Only internal links
      if (href.startsWith("http") && !href.startsWith(window.location.origin)) return;

      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);

      setVisible(true);
      setWidth(10);

      // Slowly crawl to 85% while waiting
      let current = 10;
      intervalRef.current = setInterval(() => {
        current += Math.random() * 8;
        if (current >= 85) {
          current = 85;
          clearInterval(intervalRef.current!);
        }
        setWidth(current);
      }, 200);
    };

    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 z-[9999] h-[3px] bg-yellow transition-all duration-200 ease-out"
      style={{ width: `${width}%` }}
    />
  );
}
