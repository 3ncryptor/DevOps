import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: string;
  label: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn("flex items-center", className)}>
      {steps.map((step, index) => {
        const isDone = index < currentStep;
        const isActive = index === currentStep;

        return (
          <div
            key={step.id}
            className="flex items-center flex-1 last:flex-none"
          >
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold border-2 transition-all",
                  isDone && "bg-black border-black text-white",
                  isActive && "bg-white border-black text-black",
                  !isDone &&
                    !isActive &&
                    "bg-white border-gray-200 text-gray-400",
                )}
              >
                {isDone ? <Check className="w-4 h-4" /> : index + 1}
              </div>
              <span
                className={cn(
                  "mt-1 text-xs font-medium whitespace-nowrap",
                  isActive
                    ? "text-black"
                    : isDone
                      ? "text-gray-500"
                      : "text-gray-400",
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 mx-2 mb-4 transition-all",
                  isDone ? "bg-black" : "bg-gray-200",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
