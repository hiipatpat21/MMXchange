export type LessonGuideInput = {
  id: string; status: string; isTutor: boolean; booking?: { status: string; starts_at: string } | null;
  payment?: { status: string } | null; now: number; ownConfirmed?: boolean;
};
export function lessonGuide({ id, status, isTutor, booking, payment, now, ownConfirmed }: LessonGuideInput) {
  const base = `/lessons/${id}`;
  if (status === "pending") return { label: isTutor ? "Review request" : "View request", text: isTutor ? "Review the learner's goals and fee before accepting." : "Waiting for the tutor to respond.", href: base };
  if (status !== "accepted") return { label: "View lesson", text: status === "completed" ? "Lesson completed. View your feedback and history." : "This request is closed. Your history is still available.", href: base };
  if (!booking || booking.status === "cancelled") return { label: "Choose a shared hour", text: "Set availability, then reserve an hour that works for both of you.", href: `${base}#schedule` };
  if (booking.status === "reserved" && Date.parse(booking.starts_at) <= now) return { label: "Resolve reservation", text: "This unpaid reservation has passed. Reschedule or cancel it before continuing.", href: `${base}#schedule` };
  if (booking.status === "confirmed") return { label: "View meeting", text: Date.parse(booking.starts_at) <= now ? ownConfirmed ? "Waiting for your learning partner to confirm completion." : "Confirm completion after your lesson." : "Your meeting is confirmed. Check the time and meeting details.", href: `${base}#meeting` };
  if (payment?.status === "submitted") return { label: isTutor ? "Review payment" : "View submitted receipt", text: isTutor ? "Check the transfer in your own account, then review the receipt." : "Receipt submitted. Waiting for the tutor to confirm receipt of payment.", href: `${base}#payment` };
  return { label: isTutor ? "View payment instructions" : "Upload receipt", text: isTutor ? "The time is reserved. Waiting for the learner's receipt." : payment?.status === "rejected" ? "Read the tutor's reason and submit a replacement receipt." : "Pay using the agreed instructions, then submit your receipt for review.", href: `${base}#payment` };
}

export type HomeMeeting = { id: string; title: string; at: string; kind: string; href: string };
export type HomeTask = { id: string; title: string; label: string; href: string; at: string; priority: number };
export function homePreview(meetings: HomeMeeting[], tasks: HomeTask[]) {
  return {
    meetings: [...meetings].sort((a,b) => Date.parse(a.at)-Date.parse(b.at) || a.id.localeCompare(b.id)).slice(0,3),
    tasks: [...tasks].sort((a,b) => a.priority-b.priority || Date.parse(a.at)-Date.parse(b.at) || a.id.localeCompare(b.id)).slice(0,3),
  };
}
