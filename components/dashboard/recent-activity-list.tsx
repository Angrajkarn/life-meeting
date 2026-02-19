import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlayCircle, CalendarClock, ExternalLink, Copy, Trash2, CalendarDays } from "lucide-react";
import useSWR, { useSWRConfig } from "swr";
import { fetcher } from "@/lib/api";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function RecentActivityList() {
    const { data: activities, error } = useSWR('/users/me/activity', fetcher);
    const { mutate } = useSWRConfig();
    const router = useRouter();

    // Defensive check
    const safeActivities = Array.isArray(activities) ? activities : [];
    const isLoading = !activities && !error;

    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-full">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    Recent Activity
                </h3>
                <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-medium" asChild>
                    <a href="/dashboard/history">View All</a>
                </Button>
            </div>

            <div className="space-y-3">
                {isLoading && (
                    <div className="flex flex-col gap-3">
                        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-50 animate-pulse rounded-xl" />)}
                    </div>
                )}

                {!isLoading && safeActivities.length === 0 && (
                    <div className="text-center py-10 px-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                        <div className="bg-white p-3 rounded-full w-fit mx-auto shadow-sm mb-3">
                            <CalendarDays className="h-6 w-6 text-slate-300" />
                        </div>
                        <p className="text-slate-900 font-medium">No recent activity</p>
                        <p className="text-slate-500 text-sm mt-1">Your recent meetings and recordings will appear here.</p>
                    </div>
                )}

                {safeActivities.map((item: any) => {
                    const handleDelete = async () => {
                        // Optimistic UI Update: Filter out the item immediately
                        await mutate('/users/me/activity',
                            (currentData: any[] | undefined) => currentData?.filter((i: any) => i.id !== item.id) || [],
                            false // Do not revalidate immediately
                        );

                        toast.promise(
                            // Actual API call
                            fetch(`http://localhost:8000/meetings/${item.id}`, {
                                method: 'DELETE',
                                headers: {
                                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                                }
                            }).then(async (res) => {
                                if (!res.ok) throw new Error("Failed to delete");
                                return res;
                            }),
                            {
                                loading: 'Deleting activity...',
                                success: () => {
                                    // Revalidate strictly to ensure consistency
                                    mutate('/users/me/activity');
                                    mutate('/meetings/'); // Also update recent meetings list if used elsewhere
                                    return 'Activity deleted successfully';
                                },
                                error: (err) => {
                                    // Rollback on error
                                    mutate('/users/me/activity');
                                    return 'Failed to delete activity';
                                }
                            }
                        );
                    };

                    const handleCopy = () => {
                        const url = `${window.location.origin}/meeting/${item.reference_id || item.id}`;
                        navigator.clipboard.writeText(url);
                        toast.success("Meeting link copied to clipboard");
                    };

                    return (
                        <div key={item.id} className="flex items-center justify-between group p-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 hover:shadow-sm bg-white">
                            <div className="flex items-center gap-4 cursor-pointer" onClick={() => router.push(`/meeting/${item.reference_id || item.id}`)}>
                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${item.type === 'meeting' ? 'bg-indigo-50 text-indigo-600 group-hover:bg-white group-hover:shadow-sm' : 'bg-orange-50 text-orange-600 group-hover:bg-white group-hover:shadow-sm'}`}>
                                    {item.type === 'meeting' ? <PlayCircle className="h-6 w-6" /> : <CalendarClock className="h-6 w-6" />}
                                </div>
                                <div>
                                    <h4 className="text-base font-semibold text-slate-900 leading-none mb-1.5">{item.title}</h4>
                                    <div className="flex items-center text-xs text-slate-500 font-medium">
                                        <span>{new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                        <span className="mx-1.5">•</span>
                                        <span className="truncate max-w-[150px]">{item.description || "No description"}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-[180px]">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => router.push(`/meeting/${item.reference_id || item.id}?join=1`)}>
                                            <ExternalLink className="mr-2 h-4 w-4" /> View Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={handleCopy}>
                                            <Copy className="mr-2 h-4 w-4" /> Copy Link
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                            onClick={handleDelete}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete Activity
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}
