import { formatDateTime } from "@/lib/datetime";
import type { ReportType } from "@/lib/feedback";
import { ReportControl } from "@/components/feedback/report-control";

export function ReviewItem({ name, rating, comment, createdAt, helpful, targetType, targetId }: {
  name: string; rating: number; comment: string | null; createdAt: string; helpful?: boolean;
  targetType: ReportType; targetId: string;
}) {
  return <li className="space-y-2 py-4">
    <p className="break-words text-sm font-semibold">{name} <span className="font-normal text-muted-foreground">· {rating} out of 5</span></p>
    {helpful !== undefined && <p className="text-sm text-muted-foreground">{helpful ? "Found this session helpful" : "Did not find this session helpful"}</p>}
    {comment && <p className="whitespace-pre-wrap break-words text-sm [overflow-wrap:anywhere]">{comment}</p>}
    <p className="text-xs text-muted-foreground">{formatDateTime(createdAt)}</p>
    <ReportControl targetType={targetType} targetId={targetId} />
  </li>;
}
