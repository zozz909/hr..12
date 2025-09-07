"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Chart configuration type
export interface ChartConfig {
  [key: string]: {
    label: string
    color: string
  }
}

// Chart container component
interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig
  children: React.ReactNode
}

export function ChartContainer({
  config,
  children,
  className,
  ...props
}: ChartContainerProps) {
  return (
    <div
      className={cn("w-full", className)}
      style={
        {
          "--chart-1": "hsl(220 70% 50%)",
          "--chart-2": "hsl(160 60% 45%)",
          "--chart-3": "hsl(30 80% 55%)",
          "--chart-4": "hsl(280 65% 60%)",
          "--chart-5": "hsl(340 75% 55%)",
        } as React.CSSProperties
      }
      {...props}
    >
      {children}
    </div>
  )
}

// Chart tooltip component
interface ChartTooltipProps {
  cursor?: boolean
  content?: React.ComponentType<any>
}

export function ChartTooltip({ cursor = true, content }: ChartTooltipProps) {
  return null // This is a placeholder - recharts will handle the actual tooltip
}

// Chart tooltip content component
interface ChartTooltipContentProps {
  indicator?: "dot" | "line" | "dashed"
  active?: boolean
  payload?: any[]
  label?: string
}

export function ChartTooltipContent({
  indicator = "dot",
  active,
  payload,
  label,
}: ChartTooltipContentProps) {
  if (!active || !payload || !payload.length) {
    return null
  }

  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <div className="grid gap-2">
        {label && (
          <div className="font-medium text-foreground">{label}</div>
        )}
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            {indicator === "dot" && (
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
            )}
            <span className="text-sm text-muted-foreground">
              {entry.name}: {entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Export the type for external use
export type { ChartConfig }
