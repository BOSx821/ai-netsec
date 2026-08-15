import { cn } from "@/lib/utils";
import { useEffect, useRef, useState, type ReactNode } from "react";

export function SocChartFrame({ children, className }: { children: ReactNode; className: string }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const element = frameRef.current;
    if (!element) return;

    const updateReadyState = () => {
      const bounds = element.getBoundingClientRect();
      setIsReady(bounds.width > 0 && bounds.height > 0);
    };

    updateReadyState();
    const observer = new ResizeObserver(updateReadyState);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <div ref={frameRef} className={cn("min-w-0", className)}>{isReady ? children : <div className="h-full animate-pulse rounded-xl bg-slate-900/60" aria-label="Préparation de la visualisation" />}</div>;
}
