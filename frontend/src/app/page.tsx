"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Brain,
  FileText,
  MessageSquareMore,
  Sparkles,
  Shield,
  Zap,
  Search,
  Layers,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/glass-card";
import { AuroraBackground } from "@/components/aurora-background";
import { ThemeToggle } from "@/components/theme-toggle";
import { FadeIn } from "@/components/motion/fade-in";
import { StaggerList, StaggerItem } from "@/components/motion/stagger-list";
import { slideUp, easeOut } from "@/lib/motion";

const FEATURES = [
  {
    icon: FileText,
    title: "Upload anything",
    description:
      "PDFs, Word docs, CSVs, Excel spreadsheets — even scanned documents are extracted via OCR.",
  },
  {
    icon: Search,
    title: "Hybrid retrieval",
    description:
      "Vector similarity + BM25 keyword search fused with Reciprocal Rank Fusion for laser-sharp results.",
  },
  {
    icon: Brain,
    title: "LLM reranking",
    description:
      "A local Ollama model reranks top passages by relevance before the answer is drafted.",
  },
  {
    icon: MessageSquareMore,
    title: "Streaming chat",
    description:
      "Tokens arrive in real time via Server-Sent Events — think ChatGPT speed, on your own data.",
  },
  {
    icon: Shield,
    title: "Private by design",
    description:
      "Runs entirely on your hardware with local models. No third-party AI provider sees your docs.",
  },
  {
    icon: Layers,
    title: "Persistent conversations",
    description:
      "Every thread is saved per document. Resume, rename, or delete — your history stays yours.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Upload your document",
    body: "Drag-and-drop a PDF, DOCX, CSV or XLSX file. We extract text and OCR any embedded images automatically.",
  },
  {
    number: "02",
    title: "We chunk, embed and index",
    body: "Heading-aware smart chunking keeps context intact. Each chunk is embedded with nomic-embed-text and stored in ChromaDB alongside a BM25 keyword index.",
  },
  {
    number: "03",
    title: "Ask anything",
    body: "Hybrid retrieval + LLM reranking surfaces the most relevant passages. A local Ollama model drafts a grounded answer, streaming token by token.",
  },
];

export default function LandingPage() {
  const { user } = useAuth();
  const primaryHref = user ? "/dashboard" : "/register";
  const primaryLabel = user ? "Go to dashboard" : "Get started free";

  return (
    <div className="relative overflow-hidden">
      <AuroraBackground intensity="normal" />

      {/* Top bar (public) */}
      <header className="relative z-10 mx-auto mt-4 flex w-[calc(100%-2rem)] max-w-6xl items-center justify-between rounded-full border border-white/10 glass-panel px-4 py-2">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <span className="inline-flex size-8 items-center justify-center rounded-full bg-[color:var(--gold)]/15 text-[color:var(--gold)] ring-1 ring-[color:var(--gold)]/30">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="gold-text">NeuroDocAI</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
          <a href="#features" className="transition-colors hover:text-foreground">
            Features
          </a>
          <a href="#how" className="transition-colors hover:text-foreground">
            How it works
          </a>
          <a href="#stack" className="transition-colors hover:text-foreground">
            Stack
          </a>
          <Link href="/about" className="transition-colors hover:text-foreground">
            About
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <Link
              href="/dashboard"
              className={cn(buttonVariants({ variant: "gold", size: "sm" }))}
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "hidden sm:inline-flex",
                )}
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className={cn(buttonVariants({ variant: "gold", size: "sm" }))}
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto flex min-h-[85vh] max-w-6xl flex-col items-center justify-center px-4 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: easeOut }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 glass-panel px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--gold)]" />
            Local-first RAG · V1 with hybrid search
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: easeOut }}
          className="mt-6 max-w-4xl text-balance text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl"
        >
          Ask your documents{" "}
          <span className="gold-text">anything.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: easeOut }}
          className="mt-6 max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl"
        >
          NeuroDocAI turns PDFs, Word docs and spreadsheets into a searchable
          brain. Upload a file, ask a question, and get cited answers — all
          running locally on your own hardware.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: easeOut }}
          className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
        >
          <Link
            href={primaryHref}
            className={cn(
              buttonVariants({ variant: "purple", size: "lg" }),
              "group/cta h-12 px-6 text-base",
            )}
          >
            {primaryLabel}
            <ArrowRight className="h-4 w-4 transition-transform group-hover/cta:translate-x-0.5" />
          </Link>
          <a
            href="#how"
            className={cn(
              buttonVariants({ variant: "glass", size: "lg" }),
              "h-12 px-6 text-base",
            )}
          >
            See how it works
          </a>
        </motion.div>

        {/* Floating orbs decoration */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color:var(--gold)]/10 blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </section>

      {/* Scroll reveal: Description */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 py-24">
        <FadeIn>
          <GlassCard className="p-8 sm:p-12 text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-[color:var(--gold)]">
              What is NeuroDocAI?
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              A private, cited, conversational{" "}
              <span className="gold-text">knowledge layer</span> on top of your
              files.
            </h2>
            <p className="mx-auto mt-6 max-w-3xl text-lg text-muted-foreground">
              Most AI tools force you to paste one page at a time or ship your
              data off to a cloud provider. NeuroDocAI does neither. It
              ingests entire documents, builds a hybrid vector + keyword index,
              and answers questions with an LLM that reranks the most relevant
              passages before it speaks — all on your own hardware.
            </p>
          </GlassCard>
        </FadeIn>
      </section>

      {/* Features grid */}
      <section id="features" className="relative z-10 mx-auto max-w-6xl px-4 py-24">
        <FadeIn className="mb-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-[color:var(--gold)]">
            Features
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to chat with your documents
          </h2>
        </FadeIn>

        <StaggerList className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <StaggerItem key={feature.title}>
                <GlassCard className="h-full p-6 transition-colors hover:border-white/20">
                  <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-[color:var(--purple-cta)]/15 text-[color:var(--purple-cta)] ring-1 ring-[color:var(--purple-cta)]/30">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </GlassCard>
              </StaggerItem>
            );
          })}
        </StaggerList>
      </section>

      {/* How it works */}
      <section id="how" className="relative z-10 mx-auto max-w-6xl px-4 py-24">
        <FadeIn className="mb-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-[color:var(--gold)]">
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            From upload to cited answer in seconds
          </h2>
        </FadeIn>

        <div className="space-y-6">
          {STEPS.map((step, idx) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: idx % 2 === 0 ? -40 : 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, ease: easeOut }}
            >
              <GlassCard className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:gap-8 sm:p-8">
                <div className="flex-shrink-0">
                  <div className="gold-text text-5xl font-bold sm:text-6xl">
                    {step.number}
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="mt-2 text-muted-foreground">{step.body}</p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Tech stack */}
      <section id="stack" className="relative z-10 mx-auto max-w-5xl px-4 py-24">
        <FadeIn>
          <GlassCard className="p-8 sm:p-12">
            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-[color:var(--gold)]">
                  Under the hood
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                  Built on a local,{" "}
                  <span className="gold-text">open-source</span> stack.
                </h2>
                <p className="mt-6 text-muted-foreground">
                  No API keys, no per-token billing, no data leaving your
                  machine. Swap the models whenever you like.
                </p>
              </div>
              <ul className="grid grid-cols-1 gap-3 self-center text-sm">
                {[
                  { k: "Backend", v: "FastAPI + SQLAlchemy" },
                  { k: "Vector DB", v: "ChromaDB (embedded)" },
                  { k: "Keyword", v: "rank_bm25 + RRF fusion" },
                  { k: "Embeddings", v: "Ollama nomic-embed-text" },
                  { k: "LLM", v: "Ollama qwen2 / llama3 / phi3" },
                  { k: "Frontend", v: "Next.js 16 + React 19" },
                ].map((row) => (
                  <li
                    key={row.k}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 dark:bg-white/5"
                  >
                    <span className="font-medium text-muted-foreground">
                      {row.k}
                    </span>
                    <span className="text-right text-foreground">{row.v}</span>
                  </li>
                ))}
              </ul>
            </div>
          </GlassCard>
        </FadeIn>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 mx-auto max-w-4xl px-4 py-32 text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={slideUp}
        >
          <div className="mb-4 inline-flex size-14 items-center justify-center rounded-2xl bg-[color:var(--gold)]/15 text-[color:var(--gold)] ring-1 ring-[color:var(--gold)]/30">
            <Zap className="h-6 w-6" />
          </div>
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Ready to unlock your documents?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Create an account, drag in your first PDF, and start asking. It
            takes under a minute.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={primaryHref}
              className={cn(
                buttonVariants({ variant: "purple", size: "lg" }),
                "group/cta h-12 px-6 text-base",
              )}
            >
              {primaryLabel}
              <ArrowRight className="h-4 w-4 transition-transform group-hover/cta:translate-x-0.5" />
            </Link>
            {!user && (
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "glass", size: "lg" }),
                  "h-12 px-6 text-base",
                )}
              >
                I already have an account
              </Link>
            )}
          </div>
        </motion.div>
      </section>

      <footer className="relative z-10 mx-auto max-w-6xl border-t border-white/10 px-4 py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} NeuroDocAI — Private, local-first RAG.</p>
      </footer>
    </div>
  );
}
