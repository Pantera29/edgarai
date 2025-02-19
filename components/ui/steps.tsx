"use client"

import { cn } from "@/lib/utils";

interface StepProps {
  title: string;
  description?: string;
}

interface StepsProps {
  currentStep: number;
  children: React.ReactElement<StepProps>[];
  className?: string;
}

export function Steps({ currentStep, children, className }: StepsProps) {
  return (
    <div className={cn("flex gap-4", className)}>
      {children.map((step, index) => (
        <div
          key={index}
          className={cn(
            "flex items-center gap-3",
            index !== children.length - 1 && "flex-1"
          )}
        >
          <div className="flex flex-col flex-1">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  currentStep > index + 1
                    ? "bg-primary text-primary-foreground"
                    : currentStep === index + 1
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {index + 1}
              </div>
              <div className="flex flex-col">
                <span className="font-medium">{step.props.title}</span>
                {step.props.description && (
                  <span className="text-sm text-muted-foreground">
                    {step.props.description}
                  </span>
                )}
              </div>
            </div>
          </div>
          {index !== children.length - 1 && (
            <div
              className={cn(
                "h-[2px] flex-1",
                currentStep > index + 1
                  ? "bg-primary"
                  : "bg-muted"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export function Step({ title, description }: StepProps) {
  return null;
} 