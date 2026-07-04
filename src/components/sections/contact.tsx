"use client";

import { useState } from "react";
import { Mail, MessageCircle, Linkedin, Github, Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
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
        index="05"
        title="Get in Touch"
        kicker="Interested in production AI, computer vision, or LLM/agent systems? I'm open to BD and international / remote roles and collaboration."
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-3">
          <ContactRow href={socials.email.url} icon={<Mail size={18} />} label="Email" value={profile.email} />
          <ContactRow href={socials.whatsapp.url} icon={<MessageCircle size={18} />} label="WhatsApp" value={socials.whatsapp.handle} external />
          <ContactRow href={socials.linkedin.url} icon={<Linkedin size={18} />} label="LinkedIn" value={socials.linkedin.handle} external />
          <ContactRow href={socials.github.url} icon={<Github size={18} />} label="GitHub" value={socials.github.handle} external />
          <p className="pt-2 text-sm text-[--color-text-faint]">{profile.location}</p>
        </div>

        <form onSubmit={onSubmit} className="card p-6">
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
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-[--color-accent] px-5 py-3 text-sm font-semibold text-black transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            {status === "sending" ? (
              <><Loader2 size={16} className="animate-spin" /> Sending…</>
            ) : (
              <><Send size={16} /> Send Message</>
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
      className="card flex items-center gap-4 p-4"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[--color-accent-soft] text-[--color-accent]">
        {icon}
      </span>
      <span>
        <span className="block font-mono text-xs uppercase tracking-widest text-[--color-text-faint]">
          {label}
        </span>
        <span className="block text-sm text-[--color-text]">{value}</span>
      </span>
    </a>
  );
}
