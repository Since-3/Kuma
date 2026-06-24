import { Skeleton } from "@/src/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 pt-4">
      <div className="border border-white/60 bg-white/60 backdrop-blur-xl rounded-2xl shadow-sm p-8 relative overflow-hidden">
        <Skeleton className="h-3 w-24 mb-3" />
        <Skeleton className="h-10 w-72 mb-2" />
        <Skeleton className="h-4 w-48" />
        <div className="mt-4">
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="border border-white/60 bg-white/55 backdrop-blur-xl rounded-2xl shadow-sm p-6"
          >
            <Skeleton className="h-4 w-36 mb-2" />
            <Skeleton className="h-3 w-52" />
          </div>
        ))}
      </div>
    </div>
  );
}
