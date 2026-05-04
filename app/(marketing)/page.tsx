"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Code,
  Cpu,
  Crosshair,
  Database,
  Layers,
  Move,
  Shield,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const navLinks = [
  { label: "Simulator", href: "#demo" },
  { label: "Features", href: "#features" },
  { label: "Workflow", href: "#how-it-works" },
  { label: "Tech", href: "#tech" },
];

const githubUrl = "https://github.com/Rabin935/shot-optimizing-engine";

const featureCards: {
  icon: LucideIcon;
  title: string;
  description: string;
  highlight?: boolean;
}[] = [
  {
    icon: Activity,
    title: "2D Pose & Mechanics Simulator",
    description:
      "Drag and adjust offensive and defensive stickman body parts: arm angle, release height, knee bend, torso lean, hand contest, and more. See real-time impact on shot probability and EPPS.",
    highlight: true,
  },
  {
    icon: Move,
    title: "Interactive Court Sandbox",
    description:
      "Drag the shooter and defenders across a full court to compare spacing, shot value, and pressure in seconds.",
  },
  {
    icon: BarChart3,
    title: "Expected Points Per Shot (EPPS) Engine",
    description:
      "Convert make probability and shot value into one clean expected scoring number for every attempt.",
  },
  {
    icon: BrainCircuit,
    title: "AI-Powered Shot Prediction",
    description:
      "Estimate shot quality from location, posture, release mechanics, and defender context.",
  },
  {
    icon: Crosshair,
    title: "Optimal Shooting Zones & Heatmaps",
    description:
      "Map the places where a player creates the best expected return, not just the hottest colors.",
  },
  {
    icon: Shield,
    title: "Defender Pressure Simulation",
    description:
      "Model closeouts, hand contests, body angle, and distance to understand pressure-adjusted shot quality.",
  },
];

const howItWorksSteps = [
  {
    icon: Move,
    title: "Adjust Offensive Posture",
    description:
      "Tune release angle, elbow extension, knee bend, torso lean, and release height.",
  },
  {
    icon: Shield,
    title: "Set Defensive Stance",
    description:
      "Raise contest hands, lean into the closeout, and change the defender gap.",
  },
  {
    icon: Target,
    title: "Position on Court",
    description:
      "Move the shooter and defenders across the floor to test spacing and shot value.",
  },
  {
    icon: BarChart3,
    title: "Get Instant EPPS & Insights",
    description:
      "See make probability, EPPS, and coaching-ready reads update in real time.",
  },
];

const techStack = [
  { name: "Next.js 16", detail: "App Router UI", icon: Layers },
  { name: "React 19", detail: "Interactive simulator", icon: Activity },
  { name: "Tailwind CSS 4", detail: "Dark sports-tech system", icon: Sparkles },
  { name: "TypeScript", detail: "Typed analytics surface", icon: Crosshair },
  { name: "FastAPI + XGBoost", detail: "Prediction service", icon: Cpu },
  { name: "Plotly / Konva", detail: "Court and pose visuals", icon: Database },
];

const heroMetrics = [
  { label: "Make Probability", value: "68%", tone: "orange" },
  { label: "EPPS", value: "1.36", tone: "green" },
  { label: "Contest Pressure", value: "0.42", tone: "white" },
];

const particleClasses = [
  "left-[8%] top-[18%] size-1 bg-orange-300/70",
  "left-[18%] top-[72%] size-1.5 bg-green-300/60",
  "left-[31%] top-[28%] size-1 bg-white/40",
  "left-[69%] top-[21%] size-1.5 bg-orange-200/60",
  "left-[82%] top-[64%] size-1 bg-green-200/70",
  "left-[93%] top-[36%] size-1 bg-white/35",
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="relative isolate">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_12%,rgba(255,77,0,0.26),transparent_26%),radial-gradient(circle_at_82%_18%,rgba(34,197,94,0.18),transparent_24%),linear-gradient(180deg,#050505_0%,#0A0A0A_48%,#050505_100%)]" />
        <div className="absolute inset-0 -z-10 opacity-[0.16] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:64px_64px]" />
        <div className="absolute inset-x-0 top-24 -z-10 h-[520px] opacity-20 [background-image:radial-gradient(ellipse_at_center,transparent_38%,rgba(255,255,255,0.7)_39%,transparent_40%),linear-gradient(90deg,transparent_49.8%,rgba(255,255,255,0.8)_50%,transparent_50.2%)] [background-size:820px_420px,100%_100%] [background-position:center_top,center]" />

        {particleClasses.map((className) => (
          <span
            key={className}
            className={`absolute -z-10 rounded-full shadow-[0_0_18px_currentColor] ${className}`}
          />
        ))}

        <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-6 lg:px-8">
          <a href="#home" className="flex items-center gap-3">
            <span className="relative grid size-11 place-items-center rounded-lg border border-orange-400/45 bg-orange-500/15 text-orange-100 shadow-[0_0_28px_rgba(255,77,0,0.26)]">
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
                key={link.label}
                href={link.href}
                className="transition hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </div>

          <Link
            href="/demo"
            className="hidden items-center gap-2 rounded-full bg-orange-500 px-5 py-3 text-sm font-black text-black shadow-[0_18px_45px_rgba(255,77,0,0.24)] transition hover:-translate-y-0.5 hover:bg-orange-400 sm:inline-flex"
          >
            Launch Simulator
            <ArrowRight className="size-4" />
          </Link>
        </nav>

        <section
          id="home"
          className="mx-auto flex w-full max-w-7xl flex-col items-center px-5 pb-20 pt-10 sm:px-6 lg:px-8 lg:pb-28 lg:pt-16"
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="max-w-5xl text-center"
          >
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.55 }}
              className="inline-flex rounded-full border border-green-400/30 bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-200 shadow-[0_0_35px_rgba(34,197,94,0.15)]"
            >
              Pose-aware basketball AI analytics
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16, duration: 0.7, ease: "easeOut" }}
              className="mt-6 text-balance text-5xl font-black leading-[0.98] tracking-tight text-white sm:text-6xl lg:text-7xl"
            >
              Master Shot Mechanics & Defense in Real Time
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24, duration: 0.65 }}
              className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl"
            >
              Adjust body posture, release angle, and defensive stance.
              Instantly see how it affects Expected Points Per Shot (EPPS).
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32, duration: 0.58 }}
              className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <Link
                href="/demo"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-black text-black shadow-[0_22px_55px_rgba(255,77,0,0.3)] transition hover:-translate-y-0.5 hover:bg-orange-400"
              >
                Try Interactive Simulator
                <ArrowRight className="size-4" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-6 py-3 text-sm font-bold text-white backdrop-blur transition hover:-translate-y-0.5 hover:border-green-300/50 hover:bg-white/[0.1]"
              >
                Learn How It Works
                <ArrowRight className="size-4" />
              </a>
            </motion.div>
          </motion.div>

          <PoseSimulatorMockup />
        </section>
      </div>

      <section
        id="solution"
        className="relative border-y border-white/10 bg-[#080907] px-5 py-24 sm:px-6 lg:px-8 lg:py-32"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(255,77,0,0.13),transparent_28%),radial-gradient(circle_at_82%_78%,rgba(34,197,94,0.12),transparent_30%)]" />
        <div className="relative mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-2">
          <motion.article
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6 }}
            className="rounded-lg border border-white/10 bg-white/[0.04] p-6 sm:p-8"
          >
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-orange-300">
              Traditional Shot Charts
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
              Location alone misses the mechanics of the attempt.
            </h2>
            <p className="mt-6 text-lg leading-8 text-slate-300">
              Static charts can show where a shot happened, but they flatten
              posture, release quality, defender body position, and contest
              angle into the same dot.
            </p>
            <div className="mt-8 overflow-hidden rounded-lg border border-white/10 bg-[#17120d] p-4">
              <div className="relative aspect-[16/10] rounded-md border border-white/10 bg-[#1b150f]">
                <div className="absolute inset-x-10 bottom-8 h-24 rounded-t-full border-x border-t border-white/20" />
                <div className="absolute bottom-[4.9rem] left-1/2 size-14 -translate-x-1/2 rounded-full border border-orange-200/60" />
                <div className="absolute left-[21%] top-[28%] size-20 rounded-full bg-orange-400/70 blur-xl" />
                <div className="absolute left-[54%] top-[48%] size-24 rounded-full bg-orange-500/45 blur-xl" />
                <div className="absolute bottom-[28%] left-[42%] rounded-full border border-white/15 bg-black/55 px-3 py-1 text-xs font-bold text-slate-200">
                  FG% heat only
                </div>
              </div>
            </div>
          </motion.article>

          <motion.article
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ delay: 0.1, duration: 0.65 }}
            className="rounded-lg border border-green-300/20 bg-green-500/[0.06] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.32)] sm:p-8"
          >
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-green-300">
              Pose-Aware EPPS System
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
              ShotOptix scores the body, the defense, and the floor together.
            </h2>
            <p className="mt-6 text-lg leading-8 text-slate-300">
              The simulator combines mechanics and context, then turns make
              probability into Expected Points Per Shot for a decision you can
              act on immediately.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-black/45 p-5 text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Formula
                </p>
                <p className="mt-2 text-2xl font-black text-orange-200">
                  EPPS = P(make) x Shot Value
                </p>
              </div>
              <div className="rounded-lg border border-green-300/25 bg-green-400/10 p-5">
                <p className="text-sm text-slate-400">Pose-adjusted corner 3</p>
                <p className="mt-2 text-3xl font-black text-white">68%</p>
                <p className="mt-1 text-sm font-bold text-green-200">
                  EPPS 2.04 before pressure, 1.36 live
                </p>
              </div>
            </div>
          </motion.article>
        </div>
      </section>

      <section
        id="features"
        className="relative overflow-hidden bg-background px-5 py-24 sm:px-6 lg:px-8 lg:py-32"
      >
        <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,77,0,0.08)_34%,transparent_58%),radial-gradient(circle_at_82%_12%,rgba(34,197,94,0.13),transparent_24%)]" />
        <div className="relative mx-auto max-w-7xl">
          <SectionIntro
            eyebrow="Key Features"
            title="A simulator built for coaches, players, analysts, and basketball tech teams."
            body="ShotOptix moves beyond shot dots by combining pose mechanics, defensive pressure, and court value in one premium analytics surface."
          />

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featureCards.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <motion.article
                  key={feature.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ delay: index * 0.05, duration: 0.55 }}
                  className={`group rounded-lg border p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-1 ${
                    feature.highlight
                      ? "border-orange-300/35 bg-orange-500/[0.1] sm:col-span-2"
                      : "border-white/10 bg-white/[0.045] hover:border-orange-300/45 hover:bg-orange-500/[0.08]"
                  }`}
                >
                  <div className="mb-6 grid size-12 place-items-center rounded-lg border border-orange-300/25 bg-orange-500/15 text-orange-200 transition group-hover:border-green-300/35 group-hover:bg-green-400/15 group-hover:text-green-100">
                    {feature.highlight ? (
                      <PoseJointsIcon className="size-7" />
                    ) : (
                      <Icon className="size-5" />
                    )}
                  </div>
                  <h3 className="text-xl font-black text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {feature.description}
                  </p>
                  {feature.highlight ? (
                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      {["Arm angle", "Knee bend", "Hand contest"].map(
                        (label) => (
                          <span
                            key={label}
                            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs font-bold text-slate-200"
                          >
                            {label}
                          </span>
                        ),
                      )}
                    </div>
                  ) : null}
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="relative border-y border-white/10 bg-[#080907] px-5 py-24 sm:px-6 lg:px-8 lg:py-32"
      >
        <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.08)_50%,transparent_100%)] [background-size:180px_100%]" />
        <div className="relative mx-auto max-w-7xl">
          <SectionIntro
            eyebrow="How It Works"
            title="Four fast adjustments turn a shot attempt into an EPPS read."
            body="The workflow mirrors what coaches already watch on film: posture, pressure, floor position, and outcome value."
          />

          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {howItWorksSteps.map((step, index) => {
              const Icon = step.icon;

              return (
                <motion.article
                  key={step.title}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ delay: index * 0.08, duration: 0.58 }}
                  className="relative rounded-lg border border-white/10 bg-white/[0.045] p-6"
                >
                  <div className="mb-8 flex items-center justify-between">
                    <span className="text-5xl font-black text-white/10">
                      0{index + 1}
                    </span>
                    <span className="grid size-12 place-items-center rounded-lg border border-green-300/25 bg-green-400/10 text-green-100">
                      <Icon className="size-5" />
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {step.description}
                  </p>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="demo"
        className="relative overflow-hidden bg-background px-5 py-24 sm:px-6 lg:px-8 lg:py-32"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,77,0,0.16),transparent_28%),radial-gradient(circle_at_80%_70%,rgba(34,197,94,0.13),transparent_28%)]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_0.28fr] lg:items-end">
            <SectionIntro
              eyebrow="Visual Demo"
              title="Pose mechanics and court context in one live view."
              body="Use the body controls to shape the jumper, drag defenders into the contest, and watch ShotOptix keep EPPS in sync with the possession."
            />
            <div className="rounded-lg border border-orange-300/20 bg-orange-500/[0.08] p-5">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-orange-200">
                Live Read
              </p>
              <p className="mt-3 text-4xl font-black text-white">1.36 EPPS</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Slightly lower release height plus a high hand contest moves
                this shot from elite to guarded but playable.
              </p>
            </div>
          </div>

          <PoseCourtDemo />
        </div>
      </section>

      <section
        id="tech"
        className="relative border-y border-white/10 bg-[#080907] px-5 py-24 sm:px-6 lg:px-8 lg:py-32"
      >
        <div className="relative mx-auto max-w-7xl">
          <SectionIntro
            eyebrow="Tech Stack"
            title="Modern tooling for a fast basketball analytics surface."
            body="The frontend is ready for rich court and pose interaction, while the backend can power probability and EPPS predictions from real shot data."
          />

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {techStack.map((tech) => {
              const Icon = tech.icon;

              return (
                <motion.article
                  key={tech.name}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.45 }}
                  className="flex items-center gap-4 rounded-lg border border-white/10 bg-black/35 p-4 transition hover:border-green-300/35 hover:bg-green-400/[0.07]"
                >
                  <span className="grid size-11 place-items-center rounded-lg border border-orange-300/25 bg-orange-500/10 text-orange-100">
                    <Icon className="size-5" />
                  </span>
                  <span>
                    <span className="block font-black text-white">
                      {tech.name}
                    </span>
                    <span className="text-sm text-slate-400">
                      {tech.detail}
                    </span>
                  </span>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-background px-5 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,77,0,0.2),transparent_28%),radial-gradient(circle_at_18%_72%,rgba(34,197,94,0.14),transparent_24%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-300/45 to-transparent" />
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.65 }}
          className="relative mx-auto max-w-5xl text-center"
        >
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-green-300">
            Final Possession
          </p>
          <h2 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-6xl">
            Ready to optimize shot mechanics and shot selection together?
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            Launch ShotOptix and compare mechanics, pressure, court position,
            make probability, and EPPS before the next possession starts.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/demo"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-orange-500 px-8 py-4 text-base font-black text-black shadow-[0_24px_65px_rgba(255,77,0,0.32)] transition hover:-translate-y-0.5 hover:bg-orange-400"
            >
              Launch Simulator
              <ArrowRight className="size-5" />
            </Link>
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-8 py-4 text-base font-bold text-white transition hover:-translate-y-0.5 hover:border-green-300/45 hover:bg-green-400/[0.08]"
            >
              <Code className="size-5" />
              GitHub Repository
            </a>
          </div>
        </motion.div>
      </section>

      <footer
        id="about"
        className="border-t border-white/10 bg-[#050505] px-5 py-12 sm:px-6 lg:px-8"
      >
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <div>
            <a href="#home" className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-lg border border-orange-400/40 bg-orange-500/15 text-orange-100">
                <Target className="size-5" />
              </span>
              <span>
                <span className="block text-lg font-black text-white">
                  ShotOptix
                </span>
                <span className="text-sm text-slate-400">
                  Pose-aware Expected Points Per Shot engine
                </span>
              </span>
            </a>
            <p className="mt-5 max-w-md text-sm leading-6 text-slate-400">
              Made for coaches, players, analysts, and basketball tech
              enthusiasts who want shot quality to feel visual, fast, and
              evidence-driven.
            </p>
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-slate-300">
              Quick Links
            </p>
            <div className="mt-4 grid gap-3 text-sm text-slate-400">
              <a href="#home" className="transition hover:text-white">
                Home
              </a>
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="transition hover:text-white"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-slate-300">
              Follow
            </p>
            <div className="mt-4 flex gap-3">
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="ShotOptix GitHub repository"
                className="grid size-11 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 transition hover:border-orange-300/45 hover:text-white"
              >
                <Code className="size-5" />
              </a>
              <a
                href="https://x.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="ShotOptix on X/Twitter"
                className="grid size-11 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 transition hover:border-green-300/45 hover:text-white"
              >
                <X className="size-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-white/10 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>ShotOptix EPPS Engine</p>
          <p>Basketball mechanics, rendered in the dark.</p>
        </div>
      </footer>
    </main>
  );
}

function SectionIntro({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.65 }}
      className="max-w-3xl"
    >
      <p className="text-sm font-bold uppercase tracking-[0.28em] text-green-300">
        {eyebrow}
      </p>
      <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
        {title}
      </h2>
      <p className="mt-5 text-lg leading-8 text-slate-300">{body}</p>
    </motion.div>
  );
}

function PoseSimulatorMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.22, duration: 0.85, ease: "easeOut" }}
      className="mt-14 w-full max-w-6xl overflow-hidden rounded-lg border border-white/10 bg-black/55 shadow-[0_34px_120px_rgba(0,0,0,0.62)] backdrop-blur"
    >
      <div className="flex flex-col gap-4 border-b border-white/10 bg-white/[0.04] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-lg border border-orange-300/30 bg-orange-500/15 text-orange-100">
            <PoseJointsIcon className="size-6" />
          </span>
          <div>
            <p className="text-sm font-black text-white">2D Pose Simulator</p>
            <p className="text-xs text-slate-400">
              Offense mechanics + defensive contest
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {heroMetrics.map((metric) => (
            <div
              key={metric.label}
              className={`rounded-lg border px-3 py-2 ${
                metric.tone === "orange"
                  ? "border-orange-300/30 bg-orange-500/15 text-orange-100"
                  : metric.tone === "green"
                    ? "border-green-300/30 bg-green-400/10 text-green-100"
                    : "border-white/10 bg-white/[0.04] text-white"
              }`}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                {metric.label}
              </p>
              <p className="mt-1 text-lg font-black">{metric.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1fr_260px]">
        <div className="relative min-h-[430px] overflow-hidden bg-[#0d160f]">
          <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:46px_46px]" />
          <div className="absolute inset-y-0 left-1/2 w-px bg-white/10" />
          <div className="absolute inset-y-0 left-0 w-1/2 bg-orange-500/[0.035]" />
          <div className="absolute inset-y-0 right-0 w-1/2 bg-green-400/[0.04]" />
          <div className="absolute left-4 top-4 rounded-full border border-orange-300/25 bg-black/45 px-3 py-1 text-xs font-bold text-orange-100">
            Offensive release
          </div>
          <div className="absolute right-4 top-4 rounded-full border border-green-300/25 bg-black/45 px-3 py-1 text-xs font-bold text-green-100">
            Defensive contest
          </div>
          <PoseSceneSvg />
        </div>

        <aside className="border-t border-white/10 bg-[#070807] p-5 lg:border-l lg:border-t-0">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
            Live Controls
          </p>
          <div className="mt-5 space-y-5">
            <MetricBar label="Release Angle" value="47 deg" width="68%" />
            <MetricBar label="Knee Bend" value="31 deg" width="44%" />
            <MetricBar label="Torso Lean" value="8 deg" width="32%" />
            <MetricBar label="Hand Contest" value="High" width="78%" green />
          </div>
          <div className="mt-7 rounded-lg border border-green-300/20 bg-green-400/10 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-200">
              Recommendation
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              Raise release point and reduce forward lean to recover 0.14 EPPS
              against the same contest.
            </p>
          </div>
        </aside>
      </div>
    </motion.div>
  );
}

function PoseSceneSvg() {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 920 460"
      role="img"
      aria-label="2D stickman shooter and defender with a basketball shot trajectory"
    >
      <defs>
        <filter id="glow-orange" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glow-green" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect x="72" y="82" width="776" height="310" rx="10" fill="none" stroke="rgba(255,255,255,0.12)" />
      <path d="M460 82v310" stroke="rgba(255,255,255,0.12)" />
      <path d="M88 330h190a95 95 0 0 0 0-190H88" fill="none" stroke="rgba(255,255,255,0.1)" />
      <path d="M832 330H642a95 95 0 0 1 0-190h190" fill="none" stroke="rgba(255,255,255,0.1)" />
      <circle cx="460" cy="237" r="58" fill="none" stroke="rgba(255,255,255,0.1)" />

      <path
        d="M355 153C475 36 654 58 794 151"
        fill="none"
        stroke="#FF4D00"
        strokeDasharray="10 10"
        strokeLinecap="round"
        strokeWidth="4"
        filter="url(#glow-orange)"
      />
      <path
        d="M365 168C480 92 625 99 765 165"
        fill="none"
        stroke="#22C55E"
        strokeLinecap="round"
        strokeOpacity="0.45"
        strokeWidth="2"
      />

      <g>
        <rect x="382" y="54" width="166" height="42" rx="10" fill="rgba(0,0,0,0.72)" stroke="rgba(255,255,255,0.14)" />
        <text x="465" y="80" textAnchor="middle" fill="#fed7aa" fontSize="15" fontWeight="800">
          68% Make Probability
        </text>
      </g>

      <g stroke="#f8fafc" strokeLinecap="round" strokeLinejoin="round" strokeWidth="9">
        <circle cx="230" cy="182" r="19" fill="rgba(255,77,0,0.18)" stroke="#fed7aa" strokeWidth="5" />
        <path d="M237 204L250 276" />
        <path d="M222 225L250 226" />
        <path d="M250 226L298 184L355 153" />
        <path d="M224 227L273 203L322 165" stroke="#FF4D00" />
        <path d="M250 276L215 326L188 377" />
        <path d="M250 276L288 325L332 376" />
      </g>
      <g fill="#050505" stroke="#FF4D00" strokeWidth="4">
        {[
          [230, 182],
          [237, 204],
          [222, 225],
          [250, 226],
          [298, 184],
          [355, 153],
          [250, 276],
          [215, 326],
          [288, 325],
          [188, 377],
          [332, 376],
        ].map(([cx, cy]) => (
          <circle key={`o-${cx}-${cy}`} cx={cx} cy={cy} r="8" />
        ))}
      </g>

      <g stroke="#d1fae5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="9">
        <circle cx="666" cy="188" r="18" fill="rgba(34,197,94,0.18)" stroke="#bbf7d0" strokeWidth="5" />
        <path d="M657 212L630 284" />
        <path d="M644 224L678 216" />
        <path d="M644 224L638 160L626 108" stroke="#22C55E" />
        <path d="M678 216L703 154L729 109" stroke="#22C55E" />
        <path d="M630 284L588 328L548 376" />
        <path d="M630 284L670 333L706 382" />
      </g>
      <g fill="#050505" stroke="#22C55E" strokeWidth="4">
        {[
          [666, 188],
          [657, 212],
          [644, 224],
          [678, 216],
          [638, 160],
          [626, 108],
          [703, 154],
          [729, 109],
          [630, 284],
          [588, 328],
          [670, 333],
          [548, 376],
          [706, 382],
        ].map(([cx, cy]) => (
          <circle key={`d-${cx}-${cy}`} cx={cx} cy={cy} r="8" />
        ))}
      </g>

      <motion.g
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <circle cx="531" cy="128" r="17" fill="#FF6A00" stroke="#fed7aa" strokeWidth="3" filter="url(#glow-orange)" />
        <path d="M517 128h28M531 111v34M521 116c11 7 20 19 20 29M541 116c-11 7-20 19-20 29" stroke="#4a1d05" strokeLinecap="round" strokeWidth="2" />
      </motion.g>

      <g>
        <line x1="806" y1="108" x2="806" y2="177" stroke="#e5e7eb" strokeWidth="6" strokeLinecap="round" />
        <ellipse cx="782" cy="168" rx="32" ry="10" fill="none" stroke="#FF4D00" strokeWidth="6" filter="url(#glow-orange)" />
        <path d="M755 173c14 24 43 24 56 0" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="2" />
      </g>

      <g>
        <rect x="352" y="354" width="214" height="46" rx="10" fill="rgba(0,0,0,0.68)" stroke="rgba(34,197,94,0.34)" />
        <text x="459" y="383" textAnchor="middle" fill="#bbf7d0" fontSize="17" fontWeight="900">
          EPPS 1.36
        </text>
      </g>
    </svg>
  );
}

function MetricBar({
  label,
  value,
  width,
  green = false,
}: {
  label: string;
  value: string;
  width: string;
  green?: boolean;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-slate-300">{label}</span>
        <span className={green ? "font-black text-green-200" : "font-black text-orange-200"}>
          {value}
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${
            green
              ? "bg-green-400 shadow-[0_0_18px_rgba(34,197,94,0.45)]"
              : "bg-orange-500 shadow-[0_0_18px_rgba(255,77,0,0.45)]"
          }`}
          style={{ width }}
        />
      </div>
    </div>
  );
}

function PoseCourtDemo() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.7 }}
      className="mt-12 overflow-hidden rounded-lg border border-white/10 bg-black/55 shadow-[0_34px_120px_rgba(0,0,0,0.5)]"
    >
      <div className="grid lg:grid-cols-[320px_1fr]">
        <div className="border-b border-white/10 bg-[#070807] p-5 lg:border-b-0 lg:border-r">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
            Mechanics Panel
          </p>
          <div className="mt-5 space-y-4">
            <MetricBar label="Release Height" value="8.7 ft" width="74%" />
            <MetricBar label="Elbow Extension" value="84%" width="84%" />
            <MetricBar label="Defender Gap" value="3.2 ft" width="42%" green />
          </div>
          <div className="mt-7 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-orange-300/20 bg-orange-500/10 p-4">
              <p className="text-xs text-slate-400">Probability</p>
              <p className="mt-1 text-2xl font-black text-white">68%</p>
            </div>
            <div className="rounded-lg border border-green-300/20 bg-green-400/10 p-4">
              <p className="text-xs text-slate-400">EPPS</p>
              <p className="mt-1 text-2xl font-black text-white">1.36</p>
            </div>
          </div>
        </div>

        <div className="relative min-h-[430px] overflow-hidden bg-[#102016]">
          <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:52px_52px]" />
          <div className="absolute inset-x-12 top-10 h-28 rounded-b-full border-x border-b border-white/25" />
          <div className="absolute left-1/2 top-10 h-[75%] w-px -translate-x-1/2 bg-white/18" />
          <div className="absolute left-1/2 top-[45%] size-28 -translate-x-1/2 rounded-full border border-white/25" />
          <div className="absolute inset-x-10 bottom-10 h-28 rounded-t-full border-x border-t border-white/25" />
          <div className="absolute bottom-[6.5rem] left-1/2 size-16 -translate-x-1/2 rounded-full border border-orange-300/75" />

          <div className="absolute left-[19%] top-[36%] grid size-16 place-items-center rounded-full bg-orange-300 text-black shadow-[0_0_30px_rgba(255,77,0,0.5)]">
            <Target className="size-7" />
          </div>
          <div className="absolute right-[22%] top-[40%] grid size-16 place-items-center rounded-full bg-green-300 text-black shadow-[0_0_30px_rgba(34,197,94,0.5)]">
            <Shield className="size-7" />
          </div>
          <div className="absolute left-[25%] top-[42%] h-px w-[50%] origin-left rotate-[-7deg] bg-orange-300/70 shadow-[0_0_18px_rgba(255,77,0,0.65)]" />
          <div className="absolute left-[43%] top-[34%] rounded-full border border-orange-300/35 bg-black/65 px-3 py-2 text-xs font-black text-orange-100">
            68% make
          </div>
          <div className="absolute right-5 bottom-5 rounded-lg border border-green-300/25 bg-black/70 p-4 text-sm">
            <p className="font-bold uppercase tracking-[0.18em] text-green-200">
              Insight
            </p>
            <p className="mt-2 max-w-xs leading-6 text-slate-200">
              Best value remains the wing three if the shooter keeps the
              release above the contest hand.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PoseJointsIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="24" cy="8" r="4" strokeWidth="3" />
      <path d="M24 12v12M24 18l-10 7M24 18l13-5M24 24l-8 14M24 24l12 14" strokeWidth="3" />
      {[24, 14, 37, 16, 36].map((x, index) => {
        const y = [12, 25, 13, 38, 38][index];

        return (
          <circle
            key={`${x}-${y}`}
            cx={x}
            cy={y}
            r="3"
            fill="#0a0a0a"
            strokeWidth="2"
          />
        );
      })}
    </svg>
  );
}
