import { formatDateTime } from "@/lib/datetime";
import { reminderOccurrence, reminderTiming, visibleReminders, REMINDER_AFTER_START_MS, REMINDER_FRESH_MS, REMINDER_POLL_MS, type ReminderMeeting, type ReminderResult, type ReminderSnapshot } from "@/lib/meeting-reminders";
import { claimReminderLease, readReminderRecords, releaseReminderLease, reminderStorageKeys, writeReminderRecords } from "@/lib/reminder-storage";

// A single visible tab owns polling. Server time + a monotonic clock drives countdowns.
export function startMeetingReminders(userId: string, load: () => Promise<ReminderResult>, onSnapshot: (value: ReminderSnapshot) => void, onAnnounce: (value: string) => void) {
  const keys = reminderStorageKeys(userId), owner = crypto.randomUUID();
  let stopped = false, paused = false, leading = false, acquiring = false, inFlight = false;
  let useLocks = !!navigator.locks, releaseLock: (() => void) | undefined;
  let pollTimer: ReturnType<typeof setTimeout> | undefined;
  let epoch = 0, failures = 0, serverTime = 0;
  let receivedAt: number | null = null;
  let meetings: ReminderMeeting[] = [];
  let storage: Storage;
  const visible = () => document.visibilityState === "visible";
  const now = () => serverTime + Math.max(0,performance.now()-(receivedAt ?? performance.now()));
  const clear = (error?: string) => { meetings=[]; receivedAt=null; onSnapshot({meetings:[],now:0,error}); onAnnounce(""); };
  function stopLeader() {
    leading=false; epoch++;
    clearTimeout(pollTimer); pollTimer=undefined;
    releaseLock?.(); releaseLock=undefined;
    if (!useLocks && storage) { try { releaseReminderLease(storage,keys.leader,owner); } catch { /* No active banner survives cleanup. */ } }
    clear();
  }
  function unavailable() {
    paused=true; stopLeader();
    clear("Reminders are unavailable in this browser. Check Home for your meetings.");
  }
  try {
    storage=window.localStorage;
    // Read/write access is required for durable dismissal and cross-tab deduplication.
    const value=storage.getItem(keys.records); storage.setItem(keys.records,value ?? "{}");
  } catch { unavailable(); return {stop:()=>{},dismiss:()=>{}}; }
  function emit() {
    if (!leading || !visible() || receivedAt === null) return;
    if (performance.now()-receivedAt>REMINDER_FRESH_MS) { clear(); return; }
    try { onSnapshot({meetings:visibleReminders(meetings,now(),readReminderRecords(storage,keys.records,now())),now:now()}); }
    catch { unavailable(); }
  }
  async function refresh() {
    if (stopped || paused || !leading || !visible() || inFlight) return;
    inFlight=true;const requestEpoch=epoch, requestedAt=performance.now();
    clearTimeout(pollTimer);
    try {
      const result=await load();
      if (stopped || requestEpoch!==epoch || !leading || !visible()) return;
      if (result.status === "unauthenticated" || (result.status === "ok" && result.userId!==userId)) {
        paused=true; stopLeader(); clear("Sign in again to refresh meeting reminders."); return;
      }
      if (result.status !== "ok" || performance.now()-requestedAt>REMINDER_FRESH_MS) throw new Error("Reminder refresh failed");
      receivedAt=performance.now();
      // Estimate return-trip delay, capped so a slow network cannot push the clock far ahead.
      serverTime=result.serverNow+Math.min(2000,(receivedAt-requestedAt)/2);
      const records=readReminderRecords(storage,keys.records,now());
      meetings=visibleReminders(result.meetings,now(),records);
      const fresh=meetings.filter(row => !records[reminderOccurrence(row)]?.announced);
      for (const row of meetings) records[reminderOccurrence(row)]={announced:true,dismissed:false,expiresAt:Date.parse(row.startsAt)+REMINDER_AFTER_START_MS};
      writeReminderRecords(storage,keys.records,records);
      failures=0; emit();
      onAnnounce(fresh.map(row => `${row.title}. ${reminderTiming(row.startsAt,now())?.phase === "started" ? "Meeting started" : "Meeting starts within five minutes"}. ${formatDateTime(row.startsAt)}, Philippine time.`).join(" "));
    } catch {
      if (!stopped && requestEpoch===epoch && leading && visible()) {
        failures++; clear("Could not refresh reminders. Check Home for your meetings.");
      }
    } finally {
      inFlight=false;
      if (!stopped && !paused && leading && visible()) pollTimer=setTimeout(()=>void refresh(),requestEpoch===epoch ? Math.min(120_000,REMINDER_POLL_MS*2**Math.min(failures,2)) : 0);
    }
  }
  function startLeader() { if(stopped || paused || !visible())return; leading=true;epoch++;void refresh(); }
  async function acquire() {
    if(stopped || paused || leading || acquiring || !visible())return;
    acquiring=true;
    if (useLocks) {
      try {
        await navigator.locks.request(keys.leader,{ifAvailable:true},async lock => {
          acquiring=false;
          if(!lock || stopped || paused || !visible())return;
          await new Promise<void>(resolve=>{releaseLock=resolve;startLeader();});
        });
      } catch { acquiring=false;useLocks=false;void acquire(); }
      finally { acquiring=false; }
    } else {
      try {
        if(claimReminderLease(storage,keys.leader,owner,Date.now())) {
          // Let simultaneous fallback contenders settle, then fence by the stored owner.
          await new Promise(resolve=>setTimeout(resolve,200));
          if(!stopped && !paused && visible() && claimReminderLease(storage,keys.leader,owner,Date.now())) startLeader();
        }
      } catch { unavailable(); }
      finally { acquiring=false; }
    }
  }
  function onVisibility() { if(!visible())stopLeader();else{void acquire();if(leading)void refresh();} }
  function onStorage(event: StorageEvent) { if(event.key===keys.records)emit();if(event.key===keys.leader)void acquire(); }
  function onResume() { if(visible()){void acquire();if(leading)void refresh();} }
  document.addEventListener("visibilitychange",onVisibility);
  window.addEventListener("storage",onStorage);
  window.addEventListener("focus",onResume);
  window.addEventListener("online",onResume);
  window.addEventListener("pagehide",stopLeader);
  window.addEventListener("pageshow",onResume);
  const election=setInterval(()=>{
    if(leading && !useLocks) { try { if(!claimReminderLease(storage,keys.leader,owner,Date.now()))stopLeader(); } catch { unavailable(); } }
    void acquire();
  },5000);
  const tick=setInterval(emit,1000);
  void acquire();
  return {
    dismiss(meeting: ReminderMeeting) {
      if(!leading)return;
      try {
        const records=readReminderRecords(storage,keys.records,now());
        records[reminderOccurrence(meeting)]={announced:true,dismissed:true,expiresAt:Date.parse(meeting.startsAt)+REMINDER_AFTER_START_MS};
        writeReminderRecords(storage,keys.records,records);onAnnounce("");emit();
      } catch { unavailable(); }
    },
    stop() {
      stopped=true;stopLeader();clearInterval(election);clearInterval(tick);
      document.removeEventListener("visibilitychange",onVisibility);
      window.removeEventListener("storage",onStorage);window.removeEventListener("focus",onResume);
      window.removeEventListener("online",onResume);window.removeEventListener("pagehide",stopLeader);window.removeEventListener("pageshow",onResume);
    },
  };
}
