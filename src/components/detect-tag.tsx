// A class label in the style of an object-detection overlay: solid colored
// tag, dark text, lowercase class name and an optional confidence score.
export function DetectTag({
  label,
  score,
  color = "var(--color-accent)",
  className = "",
}: {
  label: string;
  score?: string;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[3px] px-1.5 py-0.5 font-mono text-[0.75rem] font-semibold leading-none text-[--color-bg] ${className}`}
      style={{ backgroundColor: color }}
    >
      {label}
      {score && <span className="font-medium opacity-70">{score}</span>}
    </span>
  );
}
