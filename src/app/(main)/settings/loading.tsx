import { Skeleton } from "@/src/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="space-y-6 pt-4">
      <div className="border border-white/60 bg-white/60 backdrop-blur-xl rounded-2xl shadow-sm p-8">
        <Skeleton className="h-3 w-20 mb-3" />
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="border border-white/60 bg-white/55 backdrop-blur-xl rounded-2xl shadow-sm p-6 space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ))}
        <Skeleton className="h-10 w-32 rounded-xl mt-4" />
      </div>
    </div>
  );
}
