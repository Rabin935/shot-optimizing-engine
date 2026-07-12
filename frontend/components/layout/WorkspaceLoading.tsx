import { Skeleton } from "@/components/ui";

export function WorkspaceLoading({
  label = "Loading workspace",
}: {
  label?: string;
}) {
  return (
    <section className="grid gap-5" aria-label={label}>
      <Skeleton className="h-24" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Skeleton className="h-[460px]" />
        <div className="grid gap-4">
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
        </div>
      </div>
    </section>
  );
}
