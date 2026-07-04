import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getAllPosts, getPost } from "@/lib/blog";

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Post" };
  return {
    title: post.title,
    description: post.summary,
    openGraph: { title: post.title, description: post.summary, type: "article" },
  };
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post || post.draft) notFound();

  return (
    <article className="container-page max-w-3xl pt-28 pb-8">
      <Link
        href="/blog"
        className="inline-flex items-center gap-2 text-sm text-[--color-text-muted] transition-colors hover:text-[--color-accent]"
      >
        <ArrowLeft size={15} /> All posts
      </Link>

      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-3 text-xs text-[--color-text-faint]">
          {post.date && <time dateTime={post.date}>{formatDate(post.date)}</time>}
          <span>·</span>
          <span>{post.readingTime}</span>
        </div>
        <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          {post.title}
        </h1>
        {post.summary && <p className="mt-3 text-lg text-[--color-text-muted]">{post.summary}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          {post.tags.map((t) => (
            <span key={t} className="rounded-md border border-[--color-border] px-2 py-0.5 font-mono text-[11px] text-[--color-text-muted]">
              {t}
            </span>
          ))}
        </div>
      </header>

      <div className="prose-post mt-10">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
      </div>
    </article>
  );
}

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return d;
  }
}
