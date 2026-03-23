import PageTransition from "@/components/shared/PageTransition";
import ScheduleWizard from "@/components/schedule/ScheduleWizard";

export default function SchedulePage() {
  return (
    <PageTransition>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Advanced Schedule Builder</h1>
        <p className="text-sm text-slate-600">
          Build multi-peptide plans with escalation, overrides, rest periods, and export-ready outputs.
        </p>
        <ScheduleWizard />
      </div>
    </PageTransition>
  );
}
