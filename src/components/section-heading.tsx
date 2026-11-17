// Section title in the expanded cut, with an optional one-paragraph intro.
// On wide screens the intro sits beside the title so the heading reads as
// one line of structure instead of a stacked eyebrow/title/kicker block.
export function SectionHeading({
  title,
  kicker,
  id,
}: {
  title: string;
  kicker?: string;
  id?: string;
}) {
  return (
    <div data-m-group className="relative mb-12 grid gap-4 pt-8 lg:grid-cols-12 lg:gap-8">
      <span data-m="line" aria-hidden className="absolute inset-x-0 top-0 h-px bg-[--color-border]" />
      <h2 id={id} data-m="up" className="wide text-3xl font-extrabold leading-[1.05] tracking-tight sm:text-4xl lg:col-span-5">
        {title}
      </h2>
      {kicker && (
        <p data-m="up" className="max-w-[60ch] text-[--color-text-muted] lg:col-span-6 lg:col-start-7 lg:pt-1.5">{kicker}</p>
      )}
    </div>
  );
}
