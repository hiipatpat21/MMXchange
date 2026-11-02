import { z } from "zod";

export type FeedbackState = { error?: string; message?: string } | null;
export const reviewDisclaimer = "Reviews reflect individual student experiences and are not official university endorsements.";
export const reportTypes = ["exchange_review", "session_feedback", "forum_post", "forum_comment", "session"] as const;
export type ReportType = typeof reportTypes[number];

export const reviewSchema = z.object({
  id: z.string().uuid(),
  rating: z.enum(["1", "2", "3", "4", "5"]).transform(Number),
  comment: z.string().trim().max(500).transform(value => value || null),
});
export const sessionFeedbackSchema = reviewSchema.extend({ helpful: z.enum(["yes", "no"]).transform(value => value === "yes") });
export const reportSchema = z.object({
  targetType: z.enum(reportTypes), targetId: z.string().max(100), reason: z.string().trim().min(5).max(500),
}).refine(value => value.targetType === "session_feedback"
  ? value.targetId.split(":").length === 2 && value.targetId.split(":").every(part => z.string().uuid().safeParse(part).success)
  : z.string().uuid().safeParse(value.targetId).success, { message: "Invalid report target." });

export function feedbackError(code: unknown): string {
  const messages: Record<string, string> = {
    not_authenticated: "Please log in again.",
    not_found: "This exchange or session is no longer available.",
    not_allowed: "Only exchange participants can review this exchange.",
    not_completed: "Feedback is available only after completion.",
    already_reviewed: "You have already reviewed this exchange.",
    already_submitted: "You have already submitted feedback for this session.",
    not_registered: "Only registered students can give session feedback.",
    is_organizer: "Organizers cannot review their own sessions.",
    invalid_input: "Choose a rating from 1 to 5 and keep your comment within 500 characters.",
  };
  return typeof code === "string" && messages[code] ? messages[code] : "Could not submit feedback. Please try again.";
}

export type RatingSummary = { average: number | null; review_count: number | string };
export function ratingSummaryText(summary: RatingSummary | undefined) {
  const count = Number(summary?.review_count ?? 0);
  return count && summary?.average != null ? `${Number(summary.average).toFixed(1)} out of 5 · ${count} ${count === 1 ? "review" : "reviews"}` : "No reviews yet.";
}
