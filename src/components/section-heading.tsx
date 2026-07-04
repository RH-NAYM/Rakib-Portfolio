import { Reveal } from "./reveal";

export function SectionHeading({
  index,
  title,
  kicker,
}: {
  index?: string;
  title: string;
  kicker?: string;
}) {
  return (
    <Reveal className="mb-10">
      <div className="flex items-center gap-4">
        {index && <span className="eyebrow">{index}</span>}
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
        <span className="h-px flex-1 bg-gradient-to-r from-[--color-border-strong] to-transparent" />
      </div>
      {kicker && <p className="mt-3 max-w-2xl text-[--color-text-muted]">{kicker}</p>}
    </Reveal>
  );
}
