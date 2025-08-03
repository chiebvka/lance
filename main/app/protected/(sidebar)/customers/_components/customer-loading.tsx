import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function CustomerLoading() {
  return (
    <div className="min-h-screen my-3">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Timeline Skeleton */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center flex-col md:flex-row md:justify-between">
                <div>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest customer interactions and invoice updates</CardDescription>
                </div>
                <Skeleton className=" w-[150px] mt-2 md:mt-0" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="h-[40vh] px-4">
                    <div className="space-y-6 py-4 px-4">
                        {[...Array(3)].map((_, index) => (
                        <div key={index} className="flex gap-4">
                            <div className="flex flex-col items-center gap-2 w-6">
                            <Skeleton className="h-3 w-3 rounded-full" />
                            <Skeleton className="w-0.5 h-full" />
                            </div>
                            <div className="flex-1 bg-white border-2 p-4 min-h-[100px] space-y-2">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarFallback>U</AvatarFallback>
                                </Avatar>
                                <div>
                                    <Skeleton className="h-4 w-48" />
                                    <Skeleton className="h-3 w-32 mt-1" />
                                </div>
                                </div>
                            </div>
                            <Skeleton className="h-4 w-full" />
                            <div className="flex items-center justify-between mt-3">
                                <Skeleton className="h-3 w-24" />
                            </div>
                            </div>
                        </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Skeleton */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center flex-col md:flex-row md:justify-between">
                  <div>
                    <CardTitle>Activity Summary</CardTitle>
                    <CardDescription>Activity breakdown by type</CardDescription>
                  </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="h-[40vh] px-4">
                    {[...Array(5)].map((_, index) => (
                        <div key={index} className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-3 w-3" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                        <Skeleton className="h-4 w-8" />
                        </div>
                    ))}
                </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
                <div className="grid grid-cols-4 gap-4 p-2 font-semibold border-b">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-24" />
                </div>
                {[...Array(5)].map((_, index) => (
                    <div key={index} className="grid grid-cols-4 gap-4 p-2 border-b">
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-full" />
                    </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}