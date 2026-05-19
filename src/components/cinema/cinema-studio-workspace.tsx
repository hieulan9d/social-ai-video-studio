"use client";

import { useState } from "react";
import { CINEMA_STEPS, type CinemaStep, type CinemaProject, type CinemaScene, type CinemaTake, type CinemaTimelineItem } from "@/lib/cinema/types";
import { CinemaBriefStep } from "@/components/cinema/steps/cinema-brief-step";
import { CinemaScenesStep } from "@/components/cinema/steps/cinema-scenes-step";
import { CinemaTakesStep } from "@/components/cinema/steps/cinema-takes-step";
import { CinemaTimelineStep } from "@/components/cinema/steps/cinema-timeline-step";
import { CinemaExportStep } from "@/components/cinema/steps/cinema-export-step";
import { Check } from "lucide-react";

export function CinemaStudioWorkspace() {
  const [currentStep, setCurrentStep] = useState<CinemaStep>("brief");
  const [project, setProject] = useState<CinemaProject | null>(null);
  const [scenes, setScenes] = useState<CinemaScene[]>([]);
  const [takes, setTakes] = useState<CinemaTake[]>([]);
  const [timeline, setTimeline] = useState<CinemaTimelineItem[]>([]);

  const currentStepIndex = CINEMA_STEPS.findIndex((s) => s.key === currentStep);

  const goToStep = (step: CinemaStep) => {
    const targetIndex = CINEMA_STEPS.findIndex((s) => s.key === step);
    // Only allow going to completed steps or the next one
    if (targetIndex <= currentStepIndex + 1) {
      setCurrentStep(step);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <nav className="flex items-center gap-1 overflow-x-auto pb-2">
        {CINEMA_STEPS.map((step, index) => {
          const isActive = step.key === currentStep;
          const isCompleted = index < currentStepIndex;
          const isAccessible = index <= currentStepIndex + 1;

          return (
            <button
              key={step.key}
              type="button"
              onClick={() => goToStep(step.key)}
              disabled={!isAccessible}
              className={[
                "flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition",
                isActive
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : isCompleted
                    ? "bg-emerald-500/10 text-emerald-400"
                    : isAccessible
                      ? "border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)]"
                      : "border border-[var(--border)] text-[var(--muted)] opacity-50 cursor-not-allowed",
              ].join(" ")}
            >
              {isCompleted ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[10px]">
                  {index + 1}
                </span>
              )}
              {step.label}
            </button>
          );
        })}
      </nav>

      {/* Step content */}
      <div className="min-h-[500px]">
        {currentStep === "brief" && (
          <CinemaBriefStep
            project={project}
            onProjectCreated={(p) => {
              setProject(p);
              setCurrentStep("scenes");
            }}
          />
        )}

        {currentStep === "scenes" && project && (
          <CinemaScenesStep
            project={project}
            scenes={scenes}
            onScenesGenerated={(s) => {
              setScenes(s);
              setCurrentStep("takes");
            }}
            onBack={() => setCurrentStep("brief")}
          />
        )}

        {currentStep === "takes" && project && (
          <CinemaTakesStep
            project={project}
            scenes={scenes}
            takes={takes}
            onTakesUpdated={setTakes}
            onScenesUpdated={setScenes}
            onComplete={() => setCurrentStep("timeline")}
            onBack={() => setCurrentStep("scenes")}
          />
        )}

        {currentStep === "timeline" && project && (
          <CinemaTimelineStep
            project={project}
            scenes={scenes}
            takes={takes}
            timeline={timeline}
            onTimelineUpdated={setTimeline}
            onComplete={() => setCurrentStep("export")}
            onBack={() => setCurrentStep("takes")}
          />
        )}

        {currentStep === "export" && project && (
          <CinemaExportStep
            project={project}
            scenes={scenes}
            takes={takes}
            timeline={timeline}
            onBack={() => setCurrentStep("timeline")}
          />
        )}
      </div>
    </div>
  );
}
