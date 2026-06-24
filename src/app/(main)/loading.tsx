import { Skeleton } from "@/src/components/ui/skeleton";

export default function MainLoading() {
  return (
    <div className="space-y-6 pt-4">
      {/* Page header */}
      <div className="border border-white/60 bg-white/60 backdrop-blur-xl rounded-2xl shadow-sm p-8">
        <Skeleton className="h-3 w-20 mb-3" />
        <Skeleton className="h-9 w-64 mb-2" />
        <Skeleton className="h-4 w-40" />
        <div className="mt-4">
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="border border-white/60 bg-white/55 backdrop-blur-xl rounded-2xl shadow-sm p-6"
          >
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-3 w-48" />
          </div>
        ))}
      </div>
    </div>
  );
}
