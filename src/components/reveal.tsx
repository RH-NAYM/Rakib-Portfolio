/**
 * Thin wrapper that opts a block into the site-wide entrance system
 * (see motion-root.tsx). `delay` is kept for older call sites and maps to
 * a stagger step.
 */
export function Reveal({
  children,
  className = "",
  delay = 0,
  kind = "up",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  kind?: "up" | "card" | "left" | "pop" | "photo";
  as?: React.ElementType;
}) {
  return (
    <Tag data-m={kind} className={className} style={delay ? { ["--i" as string]: Math.round(delay / 60) } : undefined}>
      {children}
    </Tag>
  );
}
