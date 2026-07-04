import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, PenLine } from "lucide-react";
import { getAllPosts } from "@/lib/blog";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Blog",
  description: "Notes on production AI, computer vision, RAG/agents, GPU optimization, and MLOps.",
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="container-page pt-28 pb-8">
      <p className="eyebrow">Writing & Insights</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Blog</h1>
      <p className="mt-4 max-w-2xl text-[--color-text-muted]">
        Field notes on production AI — computer vision, RAG & agents, GPU optimization, and the
        engineering that keeps ML systems alive after deployment.
      </p>

      {posts.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="mt-12 space-y-4">
          {posts.map((post, i) => (
            <Reveal key={post.slug} delay={i * 50}>
              <Link href={`/blog/${post.slug}`} className="group block">
                <article className="card p-6 group-hover:-translate-y-0.5">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[--color-text-faint]">
                    {post.date && <time dateTime={post.date}>{formatDate(post.date)}</time>}
                    <span>·</span>
                    <span>{post.readingTime}</span>
                    {post.draft && (
                      <span className="rounded bg-[--color-accent-soft] px-1.5 py-0.5 font-mono text-[10px] text-[--color-accent]">
                        DRAFT
                      </span>
                    )}
                  </div>
                  <h2 className="mt-2 text-xl font-semibold text-[--color-text] group-hover:text-[--color-accent]">
                    {post.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-[--color-text-muted]">{post.summary}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {post.tags.map((t) => (
                      <span key={t} className="rounded-md border border-[--color-border] px-2 py-0.5 font-mono text-[11px] text-[--color-text-muted]">
                        {t}
                      </span>
                    ))}
                    <span className="ml-auto inline-flex items-center gap-1 text-sm text-[--color-accent]">
                      Read <ArrowRight size={14} />
                    </span>
                  </div>
                </article>
              </Link>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-12 card flex flex-col items-start gap-3 p-8">
      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[--color-accent-soft] text-[--color-accent]">
        <PenLine size={20} />
      </span>
      <h2 className="text-lg font-semibold">No posts yet</h2>
      <p className="max-w-xl text-sm text-[--color-text-muted]">
        Drop a Markdown/MDX file into <code className="font-mono text-[--color-accent]">content/blog/</code>{" "}
        with frontmatter (title, date, summary, tags) and it appears here automatically. See the
        starter file <code className="font-mono text-[--color-accent]">_authoring-guide.mdx</code> in that
        folder.
      </p>
    </div>
  );
}

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return d;
  }
}
