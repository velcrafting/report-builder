import type { ReactNode } from "react";
import { clsx } from "clsx";

type SurfaceCardProps = {
  title?: string;
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
};

export function SurfaceCard({
  title,
  eyebrow,
  actions,
  className,
  contentClassName,
  children,
}: SurfaceCardProps) {
  return (
    <section
      className={clsx(
        "rounded-[1.6rem] border border-[var(--border)] bg-[var(--panel)] shadow-[0_24px_80px_rgba(3,7,18,0.3)]",
        className,
      )}
    >
      {(title || eyebrow || actions) && (
        <header className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-4 sm:px-6">
          <div>
            {eyebrow ? (
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-white/45">
                {eyebrow}
              </p>
            ) : null}
            {title ? <h2 className="mt-1 text-lg font-semibold text-white">{title}</h2> : null}
          </div>
          {actions}
        </header>
      )}
      <div className={clsx("px-5 py-5 sm:px-6", contentClassName)}>{children}</div>
    </section>
  );
}
