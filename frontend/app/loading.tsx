import { WorkspaceLoading } from "@/components/layout/WorkspaceLoading";

export default function Loading() {
  return (
    <main className="min-h-screen bg-[var(--app-shell-bg)] px-4 py-6 text-foreground sm:px-6 lg:pl-80 lg:pr-8">
      <div className="mx-auto w-full max-w-[1520px]">
        <WorkspaceLoading />
      </div>
    </main>
  );
}
