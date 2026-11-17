"use client";

import { useState } from "react";
import { Mail, MessageCircle, Linkedin, Github, Briefcase, ShoppingBag, Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { HFIcon } from "@/components/hf-icon";
import { profile, socials } from "@/content/site";

type Status = "idle" | "sending" | "ok" | "error";

export function Contact() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    // honeypot
    if (data.company) {
      setStatus("ok");
      form.reset();
      return;
    }

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Something went wrong.");
      setStatus("ok");
      form.reset();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to send. Please email me directly.");
    }
  }

  return (
    <section id="contact" className="container-page scroll-mt-24 py-20">
      <SectionHeading
       
        title="Get in touch"
        kicker="Hiring for production AI, computer vision or LLM and agent systems? I'm open to roles in Bangladesh, remote international roles and freelance projects."
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="flex h-full flex-col">
          {/* Primary — the two ways people actually reach out directly */}
          <div data-m-group className="space-y-3">
            <EmailRow email={profile.email} mailto={socials.email.url} />
            <ContactRow href={socials.whatsapp.url} icon={<MessageCircle size={18} />} label="WhatsApp" value={socials.whatsapp.handle} external />
          </div>

          {/* Secondary — profiles to browse, grouped so they read as a set rather than 5 near-identical rows */}
          <div className="mt-6">
            <h4 className="mb-3 text-sm text-[--color-text-faint]">
              Profiles
            </h4>
            <div data-m-group className="grid grid-cols-2 gap-2.5">
              <ProfileChip href={socials.linkedin.url} icon={<Linkedin size={16} />} label="LinkedIn" value={socials.linkedin.handle} />
              <ProfileChip href={socials.github.url} icon={<Github size={16} />} label="GitHub" value={socials.github.handle} />
              <ProfileChip href={socials.huggingface.url} icon={<HFIcon size={16} />} label="Hugging Face" value={socials.huggingface.handle} />
              <ProfileChip href={socials.huggingfaceOrg.url} icon={<HFIcon size={16} />} label="HF · Org" value={socials.huggingfaceOrg.handle} />
              <ProfileChip href={socials.upwork.url} icon={<Briefcase size={16} />} label="Upwork" value={socials.upwork.handle} />
              <ProfileChip href={socials.fiverr.url} icon={<ShoppingBag size={16} />} label="Fiverr" value={socials.fiverr.handle} />
            </div>
          </div>

          <p className="mt-auto pt-6 text-sm text-[--color-text-faint]">{profile.location}</p>
        </div>

        <form data-m="card" onSubmit={onSubmit} className="card p-6">
          {/* honeypot */}
          <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" name="name" required autoComplete="name" />
            <Field label="Email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="mt-4">
            <Field label="Subject" name="subject" required />
          </div>
          <div className="mt-4">
            <label htmlFor="message" className="mb-1.5 block text-sm text-[--color-text-muted]">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={5}
              className="w-full resize-y rounded-lg border border-[--color-border] bg-[--color-bg-elevated] px-3.5 py-2.5 text-sm text-[--color-text] outline-none transition-colors placeholder:text-[--color-text-faint] focus:border-[--color-accent]"
              placeholder="Tell me about the role, project, or idea…"
            />
          </div>

          <button
            type="submit"
            disabled={status === "sending"}
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-md bg-[--color-accent] px-5 py-3 text-sm font-bold text-[--color-bg] press hover:bg-[--color-accent-strong] disabled:opacity-60"
          >
            {status === "sending" ? (
              <><Loader2 size={16} className="animate-spin" /> Sending…</>
            ) : (
              <><Send size={16} /> Send message</>
            )}
          </button>

          {status === "ok" && (
            <p className="mt-4 inline-flex items-center gap-2 text-sm text-[--color-success]">
              <CheckCircle2 size={16} /> Thanks — your message was sent. I&apos;ll reply soon.
            </p>
          )}
          {status === "error" && (
            <p className="mt-4 inline-flex items-center gap-2 text-sm text-red-400">
              <AlertCircle size={16} /> {error}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm text-[--color-text-muted]">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className="w-full rounded-lg border border-[--color-border] bg-[--color-bg-elevated] px-3.5 py-2.5 text-sm text-[--color-text] outline-none transition-colors placeholder:text-[--color-text-faint] focus:border-[--color-accent]"
      />
    </div>
  );
}

// Primary contact rows — Email + WhatsApp, the two ways someone actually
// starts a conversation. Kept larger/more prominent than the profile chips.
function ContactRow({
  href,
  icon,
  label,
  value,
  external,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      data-m="up" className="group card flex items-center gap-4 p-4"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[--color-accent-soft] text-[--color-accent] transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105">
        {icon}
      </span>
      <span>
        <span className="block text-sm text-[--color-text-faint]">
          {label}
        </span>
        <span className="block text-sm text-[--color-text]">{value}</span>
      </span>
    </a>
  );
}

// Secondary profile links — compact 2-up chips so five external profiles
// read as one glanceable group instead of stretching the column past the
// form's height.
function ProfileChip({
  href,
  icon,
  label,
  value,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-m="up" className="group card flex min-w-0 items-center gap-2.5 p-3"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[--color-accent-soft] text-[--color-accent] transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-medium text-[--color-text]">{label}</span>
        <span className="block truncate font-mono text-[11px] text-[--color-text-faint]">{value}</span>
      </span>
    </a>
  );
}

// Plain `mailto:` links silently do nothing if the visitor's OS/browser has
// no default mail client configured — there's no error, just no feedback.
// This keeps the mailto href (so a configured mail client still opens) and
// adds a copy-to-clipboard fallback with visible "Copied" confirmation, so
// the click always does *something* useful either way.
function EmailRow({ email, mailto }: { email: string; mailto: string }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — the mailto
      // navigation triggered by the anchor's href still gets a chance to run.
    }
  }

  return (
    <a
      href={mailto}
      onClick={handleClick}
      data-m="up" className="group card flex items-center gap-4 p-4"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[--color-accent-soft] text-[--color-accent] transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105">
        <Mail size={18} />
      </span>
      <span className="flex-1">
        <span className="block text-sm text-[--color-text-faint]">
          Email
        </span>
        <span className="block text-sm text-[--color-text]">{email}</span>
      </span>
      <span
        className={`shrink-0 font-mono text-xs text-[--color-success] transition-opacity duration-200 ${
          copied ? "opacity-100" : "opacity-0"
        }`}
        aria-live="polite"
      >
        {copied ? "Copied ✓" : ""}
      </span>
    </a>
  );
}
