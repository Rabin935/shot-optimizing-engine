"use client";

import { motion } from "framer-motion";
import { ArrowRight, Play, Target } from "lucide-react";

const navLinks = ["Home", "Demo", "Features", "About"];

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
    </main>
  );
}
