import { useState } from "react";
import { ArrowLeft, Camera, CheckCircle, MapPin } from "lucide-react";
import type { ParkSpot } from "@/types/parking";
import { REPORT_ISSUES } from "@/data/parking";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";

interface ReportSheetProps {
  spot: ParkSpot;
  onClose: () => void;
}

export function ReportSheet({ spot, onClose }: ReportSheetProps) {
  const [step, setStep] = useState(0);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      setStep(3);
    }, 800);
  };

  if (step === 3) {
    return (
      <div className="absolute inset-0 z-30 flex flex-col justify-end" role="dialog" aria-modal="true">
        <button type="button" className="absolute inset-0 bg-black/30" aria-label="Close" onClick={onClose} />
        <div className="relative bg-white rounded-t-3xl shadow-2xl p-6 flex flex-col items-center gap-5">
          <div className="w-10 h-1 rounded-full bg-gray-200 mb-2" />
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle size={32} className="text-green-500" aria-hidden="true" />
          </div>
          <div className="text-center">
            <h2 className="text-[19px] font-semibold text-[#111827]">Report submitted</h2>
            <p className="text-[14px] text-gray-500 mt-2 leading-relaxed">
              Thanks for helping improve parking accuracy. Our data team will review your report.
            </p>
            <p className="text-[12px] text-amber-700 mt-3 bg-amber-50 rounded-xl px-4 py-3">
              The physical sign remains the legal authority.
            </p>
          </div>
          <Button size="lg" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end" role="dialog" aria-modal="true" aria-labelledby="report-title">
      <button type="button" className="absolute inset-0 bg-black/30" aria-label="Close report" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl shadow-2xl flex flex-col overflow-hidden max-h-[86%]">
        <header className="pt-3 px-5 pb-4 border-b border-black/5 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-4" />
          <div className="flex items-center gap-3">
            <IconButton
              label={step > 0 ? "Previous step" : "Close report"}
              size="sm"
              onClick={step > 0 ? () => setStep(step - 1) : onClose}
              className="w-8 h-8"
            >
              <ArrowLeft size={15} className="text-gray-600" />
            </IconButton>
            <div>
              <h2 id="report-title" className="text-[17px] font-semibold text-[#111827]">
                Report incorrect info
              </h2>
              <div className="text-[11px] text-gray-400">
                {spot.street} · Step {step + 1} of 3
              </div>
            </div>
          </div>
          <div className="mt-4 h-1.5 bg-gray-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={3}>
            <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${((step + 1) / 3) * 100}%` }} />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5 no-scrollbar">
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-[15px] font-semibold text-[#111827] mb-1">Photograph the sign</h3>
                <p className="text-[13px] text-gray-500">Take a clear photo of the physical parking sign to support your report.</p>
              </div>
              <button
                type="button"
                onClick={() => setHasPhoto(true)}
                className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                style={{ background: hasPhoto ? "#F0FDF4" : "#F7F9FC", borderColor: hasPhoto ? "#22C55E" : undefined }}
              >
                {hasPhoto ? (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center">
                      <CheckCircle size={28} className="text-green-500" aria-hidden="true" />
                    </div>
                    <span className="text-[14px] font-medium text-green-700">Photo captured</span>
                    <span className="text-[12px] text-gray-400">Tap to retake</span>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
                      <Camera size={28} className="text-primary" aria-hidden="true" />
                    </div>
                    <span className="text-[14px] font-medium text-[#111827]">Take photo of sign</span>
                    <span className="text-[12px] text-gray-400">or tap to upload from library</span>
                  </>
                )}
              </button>
              <div className="rounded-xl bg-[#F7F9FC] border border-black/5 px-4 py-3 flex items-start gap-2.5">
                <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <div className="text-[12px] font-semibold text-[#111827]">{spot.street}</div>
                  <div className="text-[11px] text-gray-500">
                    {spot.suburb} · Last updated {spot.lastUpdated}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-[15px] font-semibold text-[#111827] mb-1">What&apos;s incorrect?</h3>
                <p className="text-[13px] text-gray-500">Select the issue you&apos;ve noticed with this parking location.</p>
              </div>
              <div className="space-y-2" role="radiogroup" aria-label="Issue type">
                {REPORT_ISSUES.map((iss) => (
                  <button
                    key={iss}
                    type="button"
                    role="radio"
                    aria-checked={issue === iss}
                    onClick={() => setIssue(iss)}
                    className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border text-left transition-all hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    style={{
                      background: issue === iss ? "#EEF1F7" : "#F7F9FC",
                      borderColor: issue === iss ? "#1A2744" : "rgba(0,0,0,0.07)",
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                      style={{
                        borderColor: issue === iss ? "#1A2744" : "#CBD5E1",
                        background: issue === iss ? "#1A2744" : "transparent",
                      }}
                    >
                      {issue === iss && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <span className="text-[13px] font-medium text-[#111827]">{iss}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-[15px] font-semibold text-[#111827] mb-1">Add a note</h3>
                <p className="text-[13px] text-gray-500">Optional — add any extra detail that would help our team.</p>
              </div>
              <div className="bg-[#F7F9FC] rounded-2xl border border-black/7 px-4 py-3">
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Issue</div>
                <div className="text-[13px] font-medium text-[#111827]">{issue}</div>
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. The sign now shows 1P, not 2P as listed here."
                className="w-full rounded-2xl border border-black/8 bg-[#F7F9FC] px-4 py-3.5 text-[14px] text-[#111827] resize-none outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
                rows={4}
                aria-label="Additional notes"
              />
              <div className="rounded-xl bg-amber-50 border border-amber-100 px-3.5 py-3 text-[12px] text-amber-800 leading-relaxed">
                Reports help improve parking accuracy. The physical sign remains the legal authority.
              </div>
            </div>
          )}
        </div>

        <footer className="px-5 pb-8 pt-3 border-t border-black/5 flex-shrink-0">
          <Button
            size="lg"
            disabled={(step === 1 && !issue) || submitting}
            onClick={() => {
              if (step < 2) setStep(step + 1);
              else handleSubmit();
            }}
          >
            {submitting ? "Submitting…" : step === 2 ? "Submit report" : "Continue"}
          </Button>
        </footer>
      </div>
    </div>
  );
}
