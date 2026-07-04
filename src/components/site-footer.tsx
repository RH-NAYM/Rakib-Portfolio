import Link from "next/link";
import { Github, Linkedin, Mail, MessageCircle } from "lucide-react";
import { profile, socials } from "@/content/site";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-[--color-border] bg-[--color-bg-elevated]">
      <div className="container-page grid gap-10 py-14 md:grid-cols-3">
        <div>
          <p className="font-mono text-sm font-semibold">
            <span className="text-[--color-text-faint]">[</span>
            {profile.shortName}
            <span className="text-[--color-accent]">.</span>
            <span className="text-[--color-text-faint]">]</span>
          </p>
          <p className="mt-3 max-w-xs text-sm text-[--color-text-muted]">
            Building production AI that survives production, scales under pressure, and creates
            measurable business impact.
          </p>
          <p className="mt-4 text-xs text-[--color-text-faint]">{profile.availability}</p>
        </div>

        <div>
          <h4 className="mb-3 font-mono text-xs uppercase tracking-widest text-[--color-text-faint]">
            Navigate
          </h4>
          <ul className="space-y-2 text-sm text-[--color-text-muted]">
            <li><Link href="/work" className="hover:text-[--color-accent]">Featured Work</Link></li>
            <li><Link href="/projects" className="hover:text-[--color-accent]">All Projects</Link></li>
            <li><Link href="/blog" className="hover:text-[--color-accent]">Blog</Link></li>
            <li><Link href="/#contact" className="hover:text-[--color-accent]">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 font-mono text-xs uppercase tracking-widest text-[--color-text-faint]">
            Connect
          </h4>
          <div className="flex flex-wrap gap-2">
            <FooterIcon href={socials.github.url} label="GitHub"><Github size={16} /></FooterIcon>
            <FooterIcon href={socials.linkedin.url} label="LinkedIn"><Linkedin size={16} /></FooterIcon>
            <FooterIcon href={socials.huggingface.url} label="Hugging Face"><HFIcon /></FooterIcon>
            <FooterIcon href={socials.email.url} label="Email"><Mail size={16} /></FooterIcon>
            <FooterIcon href={socials.whatsapp.url} label="WhatsApp"><MessageCircle size={16} /></FooterIcon>
          </div>
          <p className="mt-4 text-sm text-[--color-text-muted]">{profile.email}</p>
          <p className="text-sm text-[--color-text-muted]">{profile.location}</p>
        </div>
      </div>

      <div className="border-t border-[--color-border]">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-[--color-text-faint] sm:flex-row">
          <p>© {new Date().getFullYear()} {profile.name}. All rights reserved.</p>
          <p className="inline-flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-[--color-success]" />
            Built with Next.js · Deployed on Vercel
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterIcon({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[--color-border] text-[--color-text-muted] transition-colors hover:border-[--color-accent] hover:text-[--color-accent]"
    >
      {children}
    </a>
  );
}

function HFIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zM8.5 8a1.3 1.3 0 110 2.6A1.3 1.3 0 018.5 8zm7 0a1.3 1.3 0 110 2.6A1.3 1.3 0 0115.5 8zM12 18c-2.3 0-4.3-1.4-5.1-3.5h10.2C16.3 16.6 14.3 18 12 18z" />
    </svg>
  );
}
