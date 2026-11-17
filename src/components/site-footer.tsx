import Link from "next/link";
import { Github, Linkedin, Mail, MessageCircle, Briefcase, ShoppingBag } from "lucide-react";
import { profile, socials } from "@/content/site";
import { HFIcon } from "@/components/hf-icon";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-[--color-border] bg-[--color-bg-elevated]">
      <div className="container-page grid gap-10 py-14 md:grid-cols-3">
        <div>
          <p className="wide inline-flex items-center gap-2 font-extrabold tracking-tight">
            <span aria-hidden className="h-3.5 w-3.5 rounded-[2px] border-2 border-[--color-accent]" />
            Rakibul Hasan
          </p>
          <p className="mt-3 max-w-xs text-sm text-[--color-text-muted]">
            Production AI for computer vision, language and voice, built and run from Dhaka.
          </p>
          <p className="mt-4 text-xs text-[--color-text-faint]">{profile.availability}</p>
        </div>

        <div>
          <h4 className="mb-3 text-sm text-[--color-text-faint]">
            Pages
          </h4>
          <ul className="space-y-2 text-sm text-[--color-text-muted]">
            <li><Link href="/work" className="transition-colors hover:text-[--color-text]">Case studies</Link></li>
            <li><Link href="/projects" className="transition-colors hover:text-[--color-text]">All projects</Link></li>
            <li><Link href="/blog" className="transition-colors hover:text-[--color-text]">Writing</Link></li>
            <li><Link href="/#services" className="transition-colors hover:text-[--color-text]">Hire me</Link></li>
            <li><Link href="/#contact" className="transition-colors hover:text-[--color-text]">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm text-[--color-text-faint]">
            Elsewhere
          </h4>
          <div className="flex flex-wrap gap-2">
            <FooterIcon href={socials.github.url} label="GitHub"><Github size={16} /></FooterIcon>
            <FooterIcon href={socials.linkedin.url} label="LinkedIn"><Linkedin size={16} /></FooterIcon>
            <FooterIcon href={socials.huggingface.url} label="Hugging Face"><HFIcon /></FooterIcon>
            <FooterIcon href={socials.upwork.url} label="Upwork"><Briefcase size={16} /></FooterIcon>
            <FooterIcon href={socials.fiverr.url} label="Fiverr"><ShoppingBag size={16} /></FooterIcon>
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
            Built with Next.js, hosted on Vercel
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
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[--color-border] text-[--color-text-muted] transition-colors hover:border-[--color-text-muted] hover:text-[--color-text]"
    >
      {children}
    </a>
  );
}

