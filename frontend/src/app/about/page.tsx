"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowLeft,
  FileText,
  Search,
  Brain,
  MessageSquareMore,
  Shield,
  Layers,
  Zap,
  Image as ImageIcon,
  Database,
  GitBranch,
  Cpu,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { buttonVariants } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { AuroraBackground } from "@/components/aurora-background";
import { ThemeToggle } from "@/components/theme-toggle";
import { FadeIn } from "@/components/motion/fade-in";
import { StaggerList, StaggerItem } from "@/components/motion/stagger-list";
import { cn } from "@/lib/utils";
import { easeOut } from "@/lib/motion";

const FUNCTIONALITIES = [
  {
    icon: FileText,
    title: "Multi-format ingestion",
    description:
      "Upload PDF, DOCX, CSV, and XLSX. Text, tables, and embedded images are all extracted and indexed.",
  },
  {
    icon: ImageIcon,
    title: "OCR fallback",
    description:
      "Scanned PDFs and image-only pages are OCR'd with Tesseract + PyMuPDF pixmap rendering.",
  },
  {
    icon: Layers,
    title: "Smart chunking",
    description:
      "Heading/paragraph-aware splits (500 chars, 50 overlap, 100 min) keep context intact across chunks.",
  },
  {
    icon: Search,
    title: "Hybrid retrieval",
    description:
      "Vector similarity (nomic-embed-text) + BM25 keyword search fused with Reciprocal Rank Fusion (k=60).",
  },
  {
    icon: Brain,
    title: "LLM reranking",
    description:
      "Top candidates are reranked by a local Ollama model for relevance before answer generation.",
  },
  {
    icon: MessageSquareMore,
    title: "Streaming answers",
    description:
      "Server-Sent Events stream LLM tokens in real time — no waiting for the full response to render.",
  },
  {
    icon: Database,
    title: "Persistent conversations",
    description:
      "Chats are saved per document. Resume, rename, or delete threads from the sidebar.",
  },
  {
    icon: Shield,
    title: "Local & private",
    description:
      "Runs entirely on your hardware. No third-party AI provider ever sees your documents.",
  },
];

const BUILD_INFO = [
  {
    category: "Frontend",
    items: [
      { k: "Framework", v: "Next.js 16 (App Router, Turbopack)" },
      { k: "UI", v: "React 19 + TypeScript" },
      { k: "Styling", v: "Tailwind CSS v4 + shadcn/ui" },
      { k: "Animations", v: "Framer Motion + Lenis smooth scroll" },
      { k: "Typography", v: "DM Sans + Geist Mono" },
    ],
  },
  {
    category: "Backend",
    items: [
      { k: "API", v: "FastAPI (Python 3.14)" },
      { k: "ORM", v: "SQLAlchemy" },
      { k: "Database", v: "PostgreSQL 18.3 (port 5433)" },
      { k: "Vector DB", v: "ChromaDB 1.5.5 (embedded)" },
      { k: "Keyword search", v: "rank_bm25 + RRF fusion" },
      { k: "Auth", v: "JWT + bcrypt" },
    ],
  },
  {
    category: "AI Stack",
    items: [
      { k: "LLM runtime", v: "Ollama (local)" },
      { k: "Default model", v: "qwen2:0.5b" },
      { k: "Alternatives", v: "llama3, phi3" },
      { k: "Embeddings", v: "nomic-embed-text" },
      { k: "OCR", v: "PyMuPDF + Tesseract fallback" },
    ],
  },
  {
    category: "Quality & tests",
    items: [
      { k: "Backend tests", v: "88 tests (pytest)" },
      { k: "Frontend tests", v: "31 tests (Jest + RTL)" },
      { k: "Type safety", v: "Strict TypeScript, Pydantic schemas" },
      { k: "Build", v: "All routes prerendered static" },
    ],
  },
];

const MILESTONES = [
  {
    version: "MVP",
    status: "Shipped",
    bullets: [
      "Auth, upload, extract, embed, query, history",
      "Next.js frontend with dashboard + chat split-view",
    ],
  },
  {
    version: "V1",
    status: "Shipped",
    bullets: [
      "CSV/XLSX support, OCR Tesseract fallback",
      "Smart chunking + hybrid search + LLM reranking",
      "Streaming chat + persistent conversations",
    ],
  },
  {
    version: "V2",
    status: "Planned",
    bullets: [
      "Auto-generated summaries on upload",
      "Key insights extraction + query history page",
      "Multi-agent architecture (Ingestion, Retriever, QA, Summarizer)",
    ],
  },
];

export default function AboutPage() {
  const { user } = useAuth();
  const homeHref = user ? "/dashboard" : "/";

  return (
    <div className="relative overflow-hidden">
      <AuroraBackground intensity="normal" />

      {/* Top bar */}
      <header className="relative z-10 mx-auto mt-4 flex w-[calc(100%-2rem)] max-w-6xl items-center justify-between rounded-full border border-white/10 glass-panel px-4 py-2">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <span className="inline-flex size-8 items-center justify-center rounded-full bg-[color:var(--gold)]/15 text-[color:var(--gold)] ring-1 ring-[color:var(--gold)]/30">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="gold-text">NeuroDocAI</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
          <Link href="/" className="transition-colors hover:text-foreground">
            Home
          </Link>
          <Link href="/about" className="text-foreground">
            About
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href={homeHref}
            className={cn(buttonVariants({ variant: "gold", size: "sm" }))}
          >
            {user ? "Dashboard" : "Get started"}
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: easeOut }}
        >
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 glass-panel px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to home
          </Link>
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            About <span className="gold-text">NeuroDocAI</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            A private, local-first RAG platform that turns your documents into a
            cited, conversational knowledge base. Everything you need — and
            exactly what&apos;s powering it.
          </p>
        </motion.div>
      </section>

      {/* Functionalities */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 py-16">
        <FadeIn className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-[color:var(--gold)]">
            Functionalities
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            What it can do today
          </h2>
        </FadeIn>

        <StaggerList className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FUNCTIONALITIES.map((fn) => {
            const Icon = fn.icon;
            return (
              <StaggerItem key={fn.title}>
                <GlassCard className="h-full p-5">
                  <div className="mb-3 inline-flex size-10 items-center justify-center rounded-xl bg-[color:var(--purple-cta)]/15 text-[color:var(--purple-cta)] ring-1 ring-[color:var(--purple-cta)]/30">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold">{fn.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {fn.description}
                  </p>
                </GlassCard>
              </StaggerItem>
            );
          })}
        </StaggerList>
      </section>

      {/* Build info */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 py-16">
        <FadeIn className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-[color:var(--gold)]">
            Build information
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            <span className="gold-text">What&apos;s under the hood</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            The full technology stack powering NeuroDocAI — no black boxes, no
            hidden dependencies.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {BUILD_INFO.map((group) => (
            <FadeIn key={group.category}>
              <GlassCard className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-[color:var(--gold)]" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-[color:var(--gold)]">
                    {group.category}
                  </h3>
                </div>
                <ul className="space-y-2 text-sm">
                  {group.items.map((row) => (
                    <li
                      key={row.k}
                      className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 dark:bg-white/5"
                    >
                      <span className="font-medium text-muted-foreground">
                        {row.k}
                      </span>
                      <span className="text-right text-foreground">
                        {row.v}
                      </span>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Milestones */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 py-16">
        <FadeIn className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-[color:var(--gold)]">
            Milestones
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Release history
          </h2>
        </FadeIn>

        <div className="space-y-4">
          {MILESTONES.map((m, idx) => (
            <motion.div
              key={m.version}
              initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, ease: easeOut }}
            >
              <GlassCard className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:gap-6">
                <div className="flex flex-shrink-0 flex-col items-start gap-2">
                  <div className="gold-text text-4xl font-bold">{m.version}</div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${
                      m.status === "Shipped"
                        ? "bg-[color:var(--gold)]/15 text-[color:var(--gold)] ring-[color:var(--gold)]/30"
                        : "bg-[color:var(--purple-cta)]/15 text-[color:var(--purple-cta)] ring-[color:var(--purple-cta)]/30"
                    }`}
                  >
                    {m.status === "Shipped" ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <GitBranch className="h-3 w-3" />
                    )}
                    {m.status}
                  </span>
                </div>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {m.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-[color:var(--gold)]" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 mx-auto max-w-4xl px-4 py-24 text-center">
        <FadeIn>
          <div className="mb-4 inline-flex size-14 items-center justify-center rounded-2xl bg-[color:var(--gold)]/15 text-[color:var(--gold)] ring-1 ring-[color:var(--gold)]/30">
            <Zap className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Try it yourself
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Upload a document, ask a question, and watch a local LLM answer —
            with citations — in seconds.
          </p>
          <div className="mt-8">
            <Link
              href={homeHref}
              className={cn(
                buttonVariants({ variant: "purple", size: "lg" }),
                "h-12 px-6 text-base",
              )}
            >
              {user ? "Go to dashboard" : "Get started free"}
            </Link>
          </div>
        </FadeIn>
      </section>

      <footer className="relative z-10 mx-auto max-w-6xl border-t border-white/10 px-4 py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} NeuroDocAI — Private, local-first RAG.</p>
      </footer>
    </div>
  );
}
