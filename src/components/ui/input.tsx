import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <div className="flex justify-center w-full">
        <div className="w-[95%]">
          <input
            type={type}
            className={cn(
              "flex h-12 w-full border border-gray-300 bg-white px-4 py-3 text-base placeholder:text-gray-500 focus:outline-none focus:border-gray-800 transition-colors rounded-sm",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
