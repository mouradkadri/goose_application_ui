"use client"

import { cn } from "@/lib/utils"
import { ChevronRight } from "lucide-react"

interface PipelineStage {
  label: string
  count: number
  color: string
  bgColor: string
  borderColor: string
  textColor: string
}

interface PipelineChartProps {
  toApply: number
  applied: number
  interview: number
  offer: number
  rejected: number
  ghosted: number
  onStageClick?: (stage: string) => void
}

function ConversionRate({ from, to }: { from: number; to: number }) {
  if (from === 0) return null
  const rate = Math.round((to / from) * 100)
  return (
    <span className="text-[10px] text-zinc-400 font-medium">{rate}%</span>
  )
}

function StageBox({
  label, count, color, bgColor, borderColor, textColor, onClick, size = 'md',
}: PipelineStage & { onClick?: () => void; size?: 'sm' | 'md' }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border transition-all",
        "hover:shadow-md hover:scale-[1.02] active:scale-[0.99] focus-visible:outline-none",
        bgColor, borderColor,
        size === 'md' ? "p-3 min-w-[80px]" : "p-2 min-w-[64px]",
      )}
    >
      <span className={cn("font-bold tabular-nums leading-none", textColor, size === 'md' ? "text-2xl" : "text-lg")}>
        {count}
      </span>
      <span className={cn("font-medium mt-0.5 whitespace-nowrap", color, size === 'md' ? "text-[11px]" : "text-[10px]")}>
        {label}
      </span>
    </button>
  )
}

export function PipelineChart({ toApply, applied, interview, offer, rejected, ghosted, onStageClick }: PipelineChartProps) {
  const total = applied + rejected + ghosted
  const hasActivity = total > 0 || toApply > 0

  if (!hasActivity) {
    return (
      <div className="flex items-center justify-center py-8 text-[13px] text-zinc-400">
        No applications yet — add jobs and start tracking.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Main pipeline flow */}
      <div className="flex items-center gap-1 flex-wrap justify-center">
        {/* To Apply */}
        <StageBox
          label="To Apply"
          count={toApply}
          color="text-zinc-500"
          bgColor="bg-zinc-50"
          borderColor="border-zinc-200"
          textColor="text-zinc-700"
          onClick={() => onStageClick?.('to_apply')}
        />

        <div className="flex flex-col items-center gap-0.5 px-1">
          <ChevronRight className="h-4 w-4 text-zinc-300" />
          <ConversionRate from={toApply} to={applied} />
        </div>

        {/* Applied */}
        <StageBox
          label="Applied"
          count={applied}
          color="text-blue-500"
          bgColor="bg-blue-50"
          borderColor="border-blue-200"
          textColor="text-blue-700"
          onClick={() => onStageClick?.('applied')}
        />

        <div className="flex flex-col items-center gap-0.5 px-1">
          <ChevronRight className="h-4 w-4 text-zinc-300" />
          <ConversionRate from={applied} to={interview} />
        </div>

        {/* Interview */}
        <StageBox
          label="Interview"
          count={interview}
          color="text-amber-600"
          bgColor="bg-amber-50"
          borderColor="border-amber-200"
          textColor="text-amber-700"
          onClick={() => onStageClick?.('interview')}
        />

        <div className="flex flex-col items-center gap-0.5 px-1">
          <ChevronRight className="h-4 w-4 text-zinc-300" />
          <ConversionRate from={interview} to={offer} />
        </div>

        {/* Offer */}
        <StageBox
          label="Offer"
          count={offer}
          color="text-emerald-600"
          bgColor="bg-emerald-50"
          borderColor="border-emerald-200"
          textColor="text-emerald-700"
          onClick={() => onStageClick?.('offer')}
        />
      </div>

      {/* Outcome branches row */}
      {(rejected > 0 || ghosted > 0) && (
        <div className="flex items-center justify-center gap-3">
          <div className="h-px w-12 bg-zinc-100" />
          <span className="text-[10px] text-zinc-300 font-medium uppercase tracking-wide">outcomes</span>
          <div className="h-px flex-1 max-w-[80px] bg-zinc-100" />
          {rejected > 0 && (
            <StageBox
              label="Rejected"
              count={rejected}
              color="text-red-500"
              bgColor="bg-red-50/60"
              borderColor="border-red-100"
              textColor="text-red-600"
              size="sm"
              onClick={() => onStageClick?.('rejected')}
            />
          )}
          {ghosted > 0 && (
            <StageBox
              label="Ghosted"
              count={ghosted}
              color="text-zinc-400"
              bgColor="bg-zinc-50"
              borderColor="border-zinc-100"
              textColor="text-zinc-500"
              size="sm"
              onClick={() => onStageClick?.('ghosted')}
            />
          )}
          <div className="h-px w-12 bg-zinc-100" />
        </div>
      )}

      {/* Conversion summary bar */}
      {applied > 0 && (
        <div className="mt-2 space-y-1.5">
          <div className="flex items-center gap-2 text-[10px] text-zinc-400">
            <span>Overall funnel</span>
            <div className="flex-1 h-1.5 rounded-full bg-zinc-100 overflow-hidden flex">
              {offer > 0 && (
                <div
                  className="h-full bg-emerald-400 shrink-0"
                  style={{ width: `${(offer / applied) * 100}%` }}
                />
              )}
              {interview > 0 && (
                <div
                  className="h-full bg-amber-400 shrink-0"
                  style={{ width: `${((interview - offer) / applied) * 100}%` }}
                />
              )}
              {rejected > 0 && (
                <div
                  className="h-full bg-red-300 shrink-0"
                  style={{ width: `${(rejected / applied) * 100}%` }}
                />
              )}
              {ghosted > 0 && (
                <div
                  className="h-full bg-zinc-300 shrink-0"
                  style={{ width: `${(ghosted / applied) * 100}%` }}
                />
              )}
            </div>
            <span className="tabular-nums">{applied} applied</span>
          </div>
        </div>
      )}
    </div>
  )
}
