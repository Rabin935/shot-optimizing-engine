export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
        <a href="#home" className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-lg border border-orange-400/40 bg-orange-500/15 text-sm font-black text-orange-200">
            SO
          </span>
          <span className="text-lg font-semibold tracking-tight">
            ShotOptix
          </span>
        </a>
        <div className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
          <a href="#home" className="transition hover:text-white">
            Home
          </a>
          <a href="#demo" className="transition hover:text-white">
            Demo
          </a>
          <a href="#features" className="transition hover:text-white">
            Features
          </a>
          <a href="#about" className="transition hover:text-white">
            About
          </a>
        </div>
      </nav>

      <section
        id="home"
        className="mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-7xl items-center px-6 py-20 lg:px-8"
      >
        <div className="max-w-3xl">
          <p className="mb-5 inline-flex rounded-full border border-green-400/30 bg-green-500/10 px-4 py-2 text-sm font-medium text-green-200">
            EPPS basketball analytics engine
          </p>
          <h1 className="text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
            Turn shot locations into smarter scoring decisions.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            A dark, responsive foundation for ShotOptix, built with Next.js,
            TypeScript, Tailwind CSS, and basketball-first visual language.
          </p>
        </div>
      </section>
    </main>
  );
}
