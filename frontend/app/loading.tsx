import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <main className="min-h-screen bg-[var(--app-shell-bg)] px-4 py-6 text-foreground sm:px-6 lg:pl-80 lg:pr-8">
      <section className="mx-auto grid w-full max-w-[1520px] gap-6">
        <div className="grid gap-3 border-b border-white/10 pb-6">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-12 w-full max-w-xl" />
          <Skeleton className="h-5 w-full max-w-3xl" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-32" />
          ))}
        </div>
        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <Skeleton className="h-[420px]" />
          <div className="grid gap-4">
            <Skeleton className="h-44" />
            <Skeleton className="h-44" />
          </div>
        </div>
      </section>
    </main>
  );
}
