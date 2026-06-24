import { Skeleton } from "@/src/components/ui/skeleton";

export default function EmployeeLoading() {
  return (
    <div className="space-y-6 pt-4">
      <div className="border border-white/60 bg-white/60 backdrop-blur-xl rounded-2xl shadow-sm p-6 flex items-center justify-between">
        <div>
          <Skeleton className="h-3 w-20 mb-2" />
          <Skeleton className="h-7 w-40" />
        </div>
        <Skeleton className="h-9 w-36 rounded-xl" />
      </div>

      <div className="border border-white/60 bg-white/55 backdrop-blur-xl rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-white/40">
          <Skeleton className="h-9 w-64 rounded-xl" />
        </div>
        <div className="divide-y divide-white/30">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
