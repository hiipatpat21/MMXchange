import type { ExchangeStatus } from "@/lib/exchanges";

const steps = ["Match discovered", "Request sent", "Request accepted", "Session scheduled", "Exchange completed", "Feedback submitted"];

export function ExchangeProgress({ currentStep, nextAction, status }: { currentStep: number; nextAction: string; status: ExchangeStatus }) {
  const ended = status === "cancelled" || status === "declined";
  return (
    <section className="space-y-4 surface-card p-5" aria-labelledby="progress-heading">
      <h2 id="progress-heading" className="text-lg font-semibold">Exchange progress</h2>
      <ol className="grid gap-3 md:grid-cols-6">
        {steps.map((step, index) => {
          const current = index === currentStep && !ended;
          const reached = index <= currentStep;
          return (
            <li key={step} aria-current={current ? "step" : undefined} className={`flex items-center gap-2 rounded-lg p-2 text-sm md:flex-col md:items-start ${current ? "bg-primary/10 font-semibold text-primary" : reached ? "text-foreground" : "text-muted-foreground"}`}>
              <span aria-hidden="true" className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-xs ${current ? "border-primary bg-primary text-primary-foreground" : "border-current"}`}>{index < currentStep || currentStep === 5 ? "✓" : index + 1}</span>
              <span>{step}</span>
            </li>
          );
        })}
      </ol>
      {ended && <p className="text-sm text-muted-foreground">This exchange was {status}. Progress has stopped.</p>}
      <p className="text-sm"><span className="font-semibold">Next action: </span>{nextAction}</p>
    </section>
  );
}
