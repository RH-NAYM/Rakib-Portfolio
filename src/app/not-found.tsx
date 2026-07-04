import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center text-center">
      <p className="font-mono text-sm text-[--color-accent]">404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Page not found</h1>
      <p className="mt-3 max-w-md text-[--color-text-muted]">
        That route doesn&apos;t exist. Head back home, or explore the featured work.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/"
          className="rounded-lg bg-[--color-accent] px-5 py-3 text-sm font-semibold text-black transition-transform hover:-translate-y-0.5"
        >
          Home
        </Link>
        <Link
          href="/work"
          className="rounded-lg border border-[--color-border-strong] px-5 py-3 text-sm font-semibold text-[--color-text] transition-colors hover:border-[--color-accent] hover:text-[--color-accent]"
        >
          Featured Work
        </Link>
      </div>
    </div>
  );
}
