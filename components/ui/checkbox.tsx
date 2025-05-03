"use client"

import * as React from "react"
import { CheckIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    return (
      <label className="inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className={cn(
            "peer appearance-none h-5 w-5 rounded border border-input bg-white checked:bg-blue-600 checked:border-blue-600 focus:ring-2 focus:ring-blue-500 transition-all flex items-center justify-center",
            className
          )}
          checked={checked}
          onChange={e => onCheckedChange?.(e.target.checked)}
          ref={ref}
          {...props}
        />
        <span className="-ml-5 pointer-events-none flex h-5 w-5 items-center justify-center">
          {checked && <CheckIcon className="h-4 w-4 text-white" />}
        </span>
      </label>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox } 