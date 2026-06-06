import Link from "next/link";
import { BarChart3, FlaskConical, Gauge, Upload } from "lucide-react";

const dashboardCards = [
  {
    icon: Upload,
    title: "Upload Shot Data",
    description: "Prepare CSV shot logs for the prediction API.",
  },
  {
    icon: Gauge,
    title: "Model Status",
    description: "Track training artifacts and backend health.",
  },
  {
    icon: BarChart3,
    title: "Shot Insights",
    description: "Review EPPS summaries once datasets are connected.",
  },
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-background px-5 py-10 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <header className="flex flex-col justify-between gap-5 border-b border-white/10 pb-8 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-300">
              ShotOptix
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
              Dashboard
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
              The analytics workspace for datasets, model runs, and expected
              points recommendations.
            </p>
          </div>
          <Link
            href="/demo"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-orange-300/30 bg-orange-500/15 px-4 py-2 text-sm font-bold text-orange-100 transition hover:bg-orange-500/25"
          >
            <FlaskConical className="size-4" />
            Open Demo
          </Link>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {dashboardCards.map((card) => {
            const Icon = card.icon;

            return (
              <article
                key={card.title}
                className="rounded-lg border border-white/10 bg-white/[0.04] p-5"
              >
                <span className="grid size-11 place-items-center rounded-md border border-green-300/25 bg-green-400/10 text-green-100">
                  <Icon className="size-5" />
                </span>
                <h2 className="mt-5 text-xl font-black text-white">
                  {card.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {card.description}
                </p>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
