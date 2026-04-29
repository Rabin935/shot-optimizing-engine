"use client";

import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Crosshair,
  Move,
  Play,
  Shield,
  Target,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const navLinks = ["Home", "Demo", "Features", "About"];

const featureCards: {
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    icon: Move,
    title: "Interactive Shot Sandbox",
    description:
      "Drag the shooter and defenders around the floor to test shot context instantly.",
  },
  {
    icon: BrainCircuit,
    title: "Real-time EPPS Prediction",
    description:
      "Convert shot probability and point value into an expected scoring readout.",
  },
  {
    icon: BarChart3,
    title: "Expected Value Heatmap",
    description:
      "See zones by expected return, not just raw frequency or field goal percentage.",
  },
  {
    icon: Crosshair,
    title: "Optimal Shooting Zones",
    description:
      "Highlight the areas where a player profile creates the most efficient offense.",
  },
  {
    icon: Shield,
    title: "Defender Pressure Simulation",
    description:
      "Model closeouts, distance, and angle to understand pressure-adjusted shot quality.",
  },
  {
    icon: Activity,
    title: "Data-Driven Insights",
    description:
      "Turn every possession sample into simple recommendations for smarter shot diets.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="relative isolate min-h-screen">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_15%,rgba(234,88,12,0.24),transparent_28%),radial-gradient(circle_at_84%_18%,rgba(22,163,74,0.18),transparent_24%),linear-gradient(180deg,#050505_0%,#0a0a08_55%,#050505_100%)]" />
        <div className="absolute inset-0 -z-10 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:48px_48px]" />

        <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-6 lg:px-8">
          <a href="#home" className="flex items-center gap-3">
            <span className="relative grid size-11 place-items-center rounded-lg border border-orange-400/40 bg-orange-500/15 text-sm font-black text-orange-100 shadow-[0_0_28px_rgba(234,88,12,0.25)]">
              <Target className="size-5" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-lg font-black tracking-tight text-white">
                ShotOptix
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-green-300">
                EPPS Engine
              </span>
            </span>
          </a>

          <div className="hidden items-center gap-7 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-slate-300 backdrop-blur md:flex">
            {navLinks.map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase()}`}
                className="transition hover:text-white"
              >
                {link}
              </a>
            ))}
          </div>

          <a
            href="#demo"
            className="hidden items-center gap-2 rounded-full bg-orange-500 px-5 py-3 text-sm font-bold text-black shadow-[0_18px_45px_rgba(249,115,22,0.22)] transition hover:bg-orange-400 sm:inline-flex"
          >
            Try Interactive Demo
            <ArrowRight className="size-4" />
          </a>
        </nav>

        <section
          id="home"
          className="mx-auto grid min-h-[calc(100vh-84px)] w-full max-w-7xl items-center gap-12 px-5 pb-20 pt-10 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:py-20"
        >
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="max-w-4xl"
          >
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.6 }}
              className="mb-6 inline-flex rounded-full border border-green-400/30 bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-200 shadow-[0_0_35px_rgba(22,163,74,0.15)]"
            >
              AI-powered Expected Points Per Shot analytics
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16, duration: 0.7, ease: "easeOut" }}
              className="text-balance text-5xl font-black leading-[0.98] tracking-tight text-white sm:text-6xl lg:text-7xl"
            >
              Turn Every Shot Location Into Smart Scoring Decisions
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24, duration: 0.65 }}
              className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl"
            >
              AI-powered Expected Points Per Shot (EPPS) engine with
              interactive court simulator
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32, duration: 0.6 }}
              className="mt-9 flex flex-col gap-4 sm:flex-row"
            >
              <a
                href="#demo"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-black text-black shadow-[0_22px_55px_rgba(249,115,22,0.28)] transition hover:-translate-y-0.5 hover:bg-orange-400"
              >
                Launch Interactive Demo
                <ArrowRight className="size-4" />
              </a>
              <a
                href="#video"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-6 py-3 text-sm font-bold text-white backdrop-blur transition hover:-translate-y-0.5 hover:border-green-300/50 hover:bg-white/[0.1]"
              >
                <Play className="size-4 fill-current" />
                Watch 1-min Video
              </a>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 28 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.85, ease: "easeOut" }}
            className="relative mx-auto aspect-[4/5] w-full max-w-[560px] sm:aspect-[5/4] lg:aspect-[4/5]"
          >
            <div className="absolute inset-0 rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-[0_30px_100px_rgba(0,0,0,0.5)] backdrop-blur" />
            <div className="absolute inset-5 overflow-hidden rounded-[1.5rem] border border-green-300/25 bg-[#122116] shadow-inner">
              <div className="absolute inset-x-10 top-8 h-24 rounded-b-full border-x border-b border-white/35" />
              <div className="absolute left-1/2 top-8 h-[72%] w-px -translate-x-1/2 bg-white/25" />
              <div className="absolute left-1/2 top-[40%] size-28 -translate-x-1/2 rounded-full border border-white/30" />
              <div className="absolute inset-x-7 bottom-8 h-32 rounded-t-full border-x border-t border-white/35" />
              <div className="absolute bottom-[5.9rem] left-1/2 size-16 -translate-x-1/2 rounded-full border border-orange-300/70" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_48%_77%,rgba(249,115,22,0.35),transparent_11%),radial-gradient(circle_at_76%_66%,rgba(34,197,94,0.28),transparent_10%),radial-gradient(circle_at_30%_58%,rgba(234,88,12,0.24),transparent_12%)]" />

              <div className="absolute left-[22%] top-[29%] h-px w-[48%] origin-left rotate-[19deg] bg-orange-300/70 shadow-[0_0_18px_rgba(249,115,22,0.6)]" />
              <div className="absolute left-[38%] top-[51%] h-px w-[36%] origin-left -rotate-[17deg] bg-green-300/70 shadow-[0_0_18px_rgba(34,197,94,0.45)]" />
              <div className="absolute left-[30%] top-[64%] h-px w-[43%] origin-left rotate-[-4deg] bg-white/50" />

              {[
                ["left-[20%] top-[28%] bg-orange-300", "1.08"],
                ["left-[72%] top-[37%] bg-green-300", "1.22"],
                ["left-[34%] top-[62%] bg-orange-400", "0.96"],
                ["left-[78%] top-[66%] bg-green-300", "1.14"],
              ].map(([position, label]) => (
                <div
                  key={label}
                  className={`absolute ${position} flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-xs font-black text-black shadow-[0_0_28px_rgba(255,255,255,0.18)]`}
                >
                  {label}
                </div>
              ))}
            </div>
            <div className="absolute -bottom-4 left-8 right-8 rounded-xl border border-white/10 bg-black/75 px-5 py-4 backdrop-blur">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Live EPPS
                  </p>
                  <p className="mt-1 text-2xl font-black text-white">1.18</p>
                </div>
                <div className="rounded-full border border-green-300/30 bg-green-400/10 px-4 py-2 text-xs font-bold text-green-200">
                  Corner 3 recommended
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      </div>

      <section id="demo" className="relative border-y border-white/10 bg-[#080907]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(249,115,22,0.12),transparent_28%),radial-gradient(circle_at_80%_70%,rgba(22,163,74,0.12),transparent_28%)]" />
        <div className="relative mx-auto grid w-full max-w-7xl gap-12 px-5 py-24 sm:px-6 lg:grid-cols-[0.88fr_1.12fr] lg:px-8 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.65 }}
          >
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-orange-300">
              The Problem
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
              Shot charts show where. They rarely show what it is worth.
            </h2>
            <p className="mt-6 text-lg leading-8 text-slate-300">
              Traditional heatmaps and FG% treat every make like the same event.
              A clean mid-range jumper can look better than a tougher corner
              three, even when the three produces more expected points over a
              full game.
            </p>
            <div className="mt-8 grid gap-3 text-sm text-slate-300">
              {[
                "Static color bands hide shot value.",
                "FG% ignores the two-point versus three-point tradeoff.",
                "Defender pressure and spacing are flattened into one number.",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3"
                >
                  {item}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: 0.1, duration: 0.7 }}
            className="space-y-6"
          >
            <div className="rounded-2xl border border-orange-300/20 bg-orange-500/[0.06] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)] sm:p-6">
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-green-300">
                Our Solution
              </p>
              <h3 className="mt-3 text-3xl font-black text-white">
                Expected Points Per Shot
              </h3>
              <div className="mt-5 rounded-xl border border-white/10 bg-black/45 p-5 text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Formula
                </p>
                <p className="mt-2 text-2xl font-black text-orange-200 sm:text-3xl">
                  EPPS = P(make) x Shot Value
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-white">
                      Traditional Heatmap
                    </p>
                    <p className="text-xs text-slate-400">
                      Static, misleading
                    </p>
                  </div>
                  <span className="rounded-full bg-orange-500/15 px-3 py-1 text-xs font-bold text-orange-200">
                    FG%
                  </span>
                </div>
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-[#17120d]">
                  <div className="absolute left-[24%] top-[30%] size-24 rounded-full bg-orange-400/70 blur-xl" />
                  <div className="absolute left-[56%] top-[58%] size-20 rounded-full bg-orange-500/45 blur-xl" />
                  <div className="absolute inset-x-8 bottom-8 h-20 rounded-t-full border-x border-t border-white/25" />
                  <div className="absolute bottom-14 left-1/2 -translate-x-1/2 rounded-full border border-white/25 px-3 py-1 text-xs text-white">
                    50% mid-range
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-green-300/20 bg-green-500/[0.06] p-5">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-white">
                      ShotOptix EPPS Map
                    </p>
                    <p className="text-xs text-slate-400">
                      Dynamic, value-aware
                    </p>
                  </div>
                  <span className="rounded-full bg-green-400/15 px-3 py-1 text-xs font-bold text-green-200">
                    EPPS
                  </span>
                </div>
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-[#0f1d13]">
                  <div className="absolute left-[18%] top-[22%] size-14 rounded-full bg-orange-300/70" />
                  <div className="absolute right-[14%] bottom-[26%] size-16 rounded-full bg-green-300/85 shadow-[0_0_36px_rgba(134,239,172,0.5)]" />
                  <div className="absolute inset-x-8 bottom-8 h-20 rounded-t-full border-x border-t border-white/25" />
                  <div className="absolute bottom-[34%] right-[11%] rounded-full border border-green-200/50 bg-black/55 px-3 py-1 text-xs font-bold text-green-100">
                    Corner 3
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
                <p className="text-sm text-slate-400">Mid-range jumper</p>
                <p className="mt-2 text-3xl font-black text-white">50%</p>
                <p className="mt-1 text-sm font-bold text-orange-200">
                  EPPS 1.00
                </p>
              </div>
              <div className="rounded-xl border border-green-300/25 bg-green-400/10 p-5">
                <p className="text-sm text-slate-400">Corner three</p>
                <p className="mt-2 text-3xl font-black text-white">38%</p>
                <p className="mt-1 text-sm font-bold text-green-200">
                  EPPS 1.14
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section
        id="features"
        className="relative overflow-hidden bg-background px-5 py-24 sm:px-6 lg:px-8 lg:py-32"
      >
        <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(249,115,22,0.08)_34%,transparent_58%),radial-gradient(circle_at_82%_12%,rgba(22,163,74,0.12),transparent_24%)]" />
        <div className="relative mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.65 }}
            className="max-w-3xl"
          >
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-green-300">
              Powerful Features
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
              Built for coaches, analysts, and hoopers who want sharper answers.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">
              ShotOptix blends court interaction with expected value modeling,
              so every shot location becomes a decision surface.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featureCards.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ delay: index * 0.05, duration: 0.55 }}
                  className="group rounded-xl border border-white/10 bg-white/[0.045] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-1 hover:border-orange-300/45 hover:bg-orange-500/[0.08]"
                >
                  <div className="mb-6 grid size-12 place-items-center rounded-lg border border-orange-300/25 bg-orange-500/15 text-orange-200 transition group-hover:border-green-300/35 group-hover:bg-green-400/15 group-hover:text-green-100">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="text-xl font-black text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
