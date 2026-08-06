"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Keyboard } from "lucide-react"

interface ShortcutsHelpProps {
  open: boolean
  onClose: () => void
}

const SHORTCUTS = [
  { keys: ['j', 'k'], label: 'Navigate down / up through jobs' },
  { keys: ['f'], label: 'Toggle favorite on selected job' },
  { keys: ['a'], label: 'Mark selected job as Applied' },
  { keys: ['o'], label: 'Open apply URL for selected job' },
  { keys: ['x'], label: 'Toggle selection (bulk mode)' },
  { keys: ['/'], label: 'Focus search' },
  { keys: ['Esc'], label: 'Clear search / exit selection mode' },
  { keys: ['?'], label: 'Show this help' },
]

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 rounded border border-zinc-300 bg-zinc-50 text-[11px] font-mono font-medium text-zinc-600 shadow-sm min-w-[22px]">
      {children}
    </kbd>
  )
}

export function ShortcutsHelp({ open, onClose }: ShortcutsHelpProps) {
  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onClose() }}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Keyboard className="h-4 w-4 text-zinc-400" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="text-[12px] text-zinc-500 mb-3">
          Active in the <span className="font-medium text-zinc-700">My Jobs</span> view.
          Shortcuts are ignored when typing in an input.
        </div>
        <div className="space-y-2">
          {SHORTCUTS.map(({ keys, label }) => (
            <div key={label} className="flex items-center justify-between gap-4">
              <span className="text-[13px] text-zinc-600">{label}</span>
              <div className="flex items-center gap-1 shrink-0">
                {keys.map(k => <Kbd key={k}>{k}</Kbd>)}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
