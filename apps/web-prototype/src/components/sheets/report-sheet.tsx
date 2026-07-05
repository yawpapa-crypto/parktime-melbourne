import { useState } from "react";
import { ArrowLeft, Camera, CheckCircle, MapPin } from "lucide-react";
import type { NearbyBay } from "@/services/api";
import { api } from "@/services/api";
import { useAppStore } from "@/context/app-store";
import { REPORT_ISSUES } from "@/data/parking";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";

interface ReportSheetProps {
  bay: NearbyBay;
  onClose: () => void;
}

export function ReportSheet({ bay, onClose }: ReportSheetProps) {
  const { deviceId } = useAppStore();
  const [step, setStep] = useState(0);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!issue) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.report({
        bayId: bay.id,
        issueType: issue,
        note: note || undefined,
        deviceId,
      });
      setStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 3) {
    return (
      <div className="absolute inset-0 z-30 flex flex-col justify-end" role="dialog" aria-modal="true">
        <button type="button" className="absolute inset-0 bg-black/30" onClick={onClose} />
        <div className="relative bg-white rounded-t-3xl shadow-2xl p-6 flex flex-col items-center gap-5">
          <CheckCircle size={32} className="text-green-500" />
          <h2 className="text-[19px] font-semibold">Report submitted</h2>
          <p className="text-[14px] text-gray-500 text-center">Thanks for helping improve parking accuracy.</p>
          <Button size="lg" onClick={onClose}>Done</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl shadow-2xl flex flex-col overflow-hidden max-h-[86%]">
        <header className="pt-3 px-5 pb-4 border-b border-black/5">
          <div className="flex items-center gap-3">
            <IconButton label="Back" size="sm" onClick={step > 0 ? () => setStep(step - 1) : onClose}>
              <ArrowLeft size={15} />
            </IconButton>
            <div>
              <h2 className="text-[17px] font-semibold">Report incorrect info</h2>
              <div className="text-[11px] text-gray-400">{bay.streetDescription} · Step {step + 1} of 3</div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5 no-scrollbar">
          {step === 0 && (
            <div className="space-y-5">
              <p className="text-[13px] text-gray-500">Photograph the sign to support your report (optional).</p>
              <button type="button" onClick={() => setHasPhoto(true)} className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 bg-[#F7F9FC]">
                {hasPhoto ? <CheckCircle size={28} className="text-green-500" /> : <Camera size={28} className="text-primary" />}
                <span className="text-[14px] font-medium">{hasPhoto ? "Photo noted" : "Tap to mark photo taken"}</span>
              </button>
              <div className="rounded-xl bg-[#F7F9FC] px-4 py-3 flex gap-2">
                <MapPin size={14} className="text-gray-400 mt-0.5" />
                <div>
                  <div className="text-[12px] font-semibold">{bay.streetDescription}</div>
                  <div className="text-[11px] text-gray-500">{bay.suburb}</div>
                </div>
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="space-y-2">
              {REPORT_ISSUES.map((iss) => (
                <button key={iss} type="button" onClick={() => setIssue(iss)} className={`w-full text-left px-4 py-3.5 rounded-2xl border ${issue === iss ? "border-primary bg-secondary" : "border-black/7 bg-[#F7F9FC]"}`}>
                  <span className="text-[13px] font-medium">{iss}</span>
                </button>
              ))}
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-[#F7F9FC] rounded-2xl px-4 py-3 text-[13px]">{issue}</div>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add optional details…" className="w-full rounded-2xl border px-4 py-3 text-[14px] resize-none outline-none" rows={4} />
              {error && <p className="text-[13px] text-red-600">{error}</p>}
            </div>
          )}
        </div>

        <footer className="px-5 pb-8 pt-3 border-t">
          <Button size="lg" disabled={(step === 1 && !issue) || submitting} onClick={() => (step < 2 ? setStep(step + 1) : void handleSubmit())}>
            {submitting ? "Submitting…" : step === 2 ? "Submit report" : "Continue"}
          </Button>
        </footer>
      </div>
    </div>
  );
}
