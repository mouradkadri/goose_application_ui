"use client"

import { useState } from "react"
import {
  LayoutDashboard, Briefcase, Send, Calendar, FileText,
  Settings, Star, Keyboard,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ── Mobile bottom nav (shown only on < md) ────────────────────────────────────
const MOBILE_NAV = [
  { id: "home",         label: "Home",    icon: LayoutDashboard },
  { id: "jobs",         label: "Jobs",    icon: Briefcase       },
  { id: "applications", label: "Apply",   icon: Send            },
  { id: "resumes",      label: "Resumes", icon: FileText        },
  { id: "settings",     label: "More",    icon: Settings        },
] as const

export function MobileBottomNav({
  currentView,
  onViewChange,
}: {
  currentView: ViewType
  onViewChange: (v: ViewType) => void
}) {
  return (
    <nav className="fixed bottom-0 inset-x-0 h-16 flex items-center bg-sidebar border-t border-sidebar-border z-50 md:hidden safe-area-inset-bottom">
      {MOBILE_NAV.map(({ id, label, icon: Icon }) => {
        const active = currentView === id
        return (
          <button
            key={id}
            onClick={() => onViewChange(id as ViewType)}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors relative",
              active ? "text-amber-400" : "text-sidebar-foreground/40 hover:text-sidebar-foreground/70",
            )}
          >
            {active && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-amber-500" />
            )}
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export type ViewType = "home" | "jobs" | "applications" | "interviews" | "resumes" | "settings"

export interface FavoriteJob {
  id: string
  title: string
  company: string
}

export interface NavBadge {
  count: number
  urgent?: boolean
}

interface DashboardSidebarProps {
  currentView: ViewType
  onViewChange: (view: ViewType) => void
  favoriteJobs?: FavoriteJob[]
  onJobClick?: (id: string) => void
  navBadges?: Partial<Record<string, NavBadge>>
  onShowShortcuts?: () => void
}

const NAV = [
  { id: "home",         label: "Dashboard",   icon: LayoutDashboard },
  { id: "jobs",         label: "My Jobs",      icon: Briefcase       },
  { id: "applications", label: "Applications", icon: Send            },
  { id: "interviews",   label: "Interviews",   icon: Calendar        },
  { id: "resumes",      label: "Resumes",      icon: FileText        },
] as const

const FOOTER_NAV = [
  { id: "settings", label: "Settings", icon: Settings },
] as const

export function DashboardSidebar({
  currentView,
  onViewChange,
  favoriteJobs = [],
  onJobClick,
  navBadges = {},
  onShowShortcuts,
}: DashboardSidebarProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={cn(
        "flex flex-col h-full shrink-0 bg-sidebar border-r border-sidebar-border",
        "transition-[width] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden z-20",
        expanded ? "w-52" : "w-[60px]",
      )}
    >
      {/* Logo */}
      <div className="h-[60px] flex items-center border-b border-sidebar-border shrink-0 px-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src="/goose_job_logo.png"
            width={40}
            height={40}
            alt="GooseJobs"
            className="shrink-0 object-contain drop-shadow-sm"
          />
          <span className={cn(
            "font-bold text-[15px] tracking-tight whitespace-nowrap text-sidebar-primary transition-opacity duration-150",
            expanded ? "opacity-100" : "opacity-0 pointer-events-none",
          )}>
            GooseJobs
          </span>
        </div>
      </div>

      {/* Main nav */}
      <nav className="px-2 py-3 space-y-0.5 overflow-hidden shrink-0">
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = currentView === id
          const badge = navBadges[id]
          return (
            <button
              key={id}
              onClick={() => onViewChange(id as ViewType)}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              className={cn(
                "w-full flex items-center gap-3 px-2.5 py-2 rounded-md text-sm",
                "transition-colors duration-150 whitespace-nowrap relative",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sidebar-ring",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/70",
              )}
            >
              {/* Active bar */}
              <span className={cn(
                "absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r transition-all duration-150",
                active ? "h-4 bg-amber-500" : "h-0 bg-transparent",
              )} />

              {/* Icon */}
              <div className="relative shrink-0">
                <Icon className={cn(
                  "h-4 w-4 transition-colors duration-150",
                  active ? "text-amber-400" : "text-sidebar-foreground",
                )} />
                {/* Dot badge when collapsed */}
                {badge && !expanded && (
                  <span className={cn(
                    "absolute -top-1 -right-1 h-2 w-2 rounded-full border border-sidebar",
                    badge.urgent ? "bg-amber-500" : "bg-zinc-500/60",
                  )} />
                )}
              </div>

              {/* Label */}
              <span className={cn(
                "transition-opacity duration-150 font-medium text-[13px] flex-1 text-left",
                expanded ? "opacity-100" : "opacity-0 pointer-events-none w-0",
              )}>
                {label}
              </span>

              {/* Count badge when expanded */}
              {badge && expanded && (
                <span className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums shrink-0 ml-auto",
                  badge.urgent
                    ? "bg-amber-500/25 text-amber-400"
                    : "bg-white/8 text-sidebar-foreground/50",
                )}>
                  {badge.count > 99 ? '99+' : badge.count}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* ── Starred jobs ───────────────────────────────────────────── */}
      {favoriteJobs.length > 0 && (
        <div className="flex-1 flex flex-col min-h-0 border-t border-sidebar-border overflow-hidden">
          {expanded ? (
            <div className="flex flex-col min-h-0">
              <div className="flex items-center justify-between px-4 py-2 shrink-0">
                <div className="flex items-center gap-1.5">
                  <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/50">
                    Starred
                  </span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400">
                  {favoriteJobs.length}
                </span>
              </div>
              <div className="overflow-y-auto px-2 pb-2 space-y-0.5">
                {favoriteJobs.slice(0, 8).map(job => (
                  <button
                    key={job.id}
                    onClick={() => onJobClick?.(job.id)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-sidebar-accent/70 text-left transition-colors group"
                  >
                    <span className="h-6 w-6 rounded-md shrink-0 bg-amber-900/40 text-amber-300 text-[10px] font-bold flex items-center justify-center border border-amber-800/30">
                      {job.company.replace(/^the\s+/i, '')[0]?.toUpperCase() ?? '?'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-medium text-sidebar-primary truncate leading-snug group-hover:text-amber-200 transition-colors">
                        {job.title}
                      </p>
                      <p className="text-[10px] text-sidebar-foreground/50 truncate">{job.company}</p>
                    </div>
                  </button>
                ))}
                {favoriteJobs.length > 8 && (
                  <button
                    onClick={() => onViewChange('jobs')}
                    className="w-full text-[11px] text-amber-500/70 hover:text-amber-400 px-2.5 py-1.5 text-left transition-colors"
                  >
                    +{favoriteJobs.length - 8} more starred
                  </button>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={() => onViewChange('jobs')}
              aria-label={`${favoriteJobs.length} starred jobs`}
              className="flex items-center justify-center py-3 w-full relative hover:bg-sidebar-accent/70 transition-colors"
            >
              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
              <span className="absolute top-2 right-3 h-4 w-4 rounded-full bg-amber-500 text-[9px] font-bold text-[#13100a] flex items-center justify-center leading-none">
                {favoriteJobs.length > 9 ? '9+' : favoriteJobs.length}
              </span>
            </button>
          )}
        </div>
      )}

      {favoriteJobs.length === 0 && <div className="flex-1" />}

      {/* Footer nav */}
      <div className="px-2 py-3 border-t border-sidebar-border space-y-0.5 shrink-0">
        {FOOTER_NAV.map(({ id, label, icon: Icon }) => {
          const active = currentView === id
          return (
            <button
              key={id}
              onClick={() => onViewChange(id as ViewType)}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              className={cn(
                "w-full flex items-center gap-3 px-2.5 py-2 rounded-md text-sm",
                "transition-colors duration-150 whitespace-nowrap relative",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sidebar-ring",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/70",
              )}
            >
              <span className={cn(
                "absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r transition-all duration-150",
                active ? "h-4 bg-amber-500" : "h-0 bg-transparent",
              )} />
              <Icon className={cn("h-4 w-4 shrink-0 transition-colors", active ? "text-amber-400" : "text-sidebar-foreground")} />
              <span className={cn(
                "transition-opacity duration-150 font-medium text-[13px]",
                expanded ? "opacity-100" : "opacity-0 pointer-events-none w-0",
              )}>
                {label}
              </span>
            </button>
          )
        })}

        {/* Keyboard shortcuts hint */}
        {onShowShortcuts && (
          <button
            onClick={onShowShortcuts}
            aria-label="Keyboard shortcuts"
            className={cn(
              "w-full flex items-center gap-3 px-2.5 py-2 rounded-md transition-colors",
              "text-sidebar-foreground/40 hover:text-sidebar-foreground/70 hover:bg-sidebar-accent/50",
            )}
          >
            <Keyboard className="h-4 w-4 shrink-0" />
            <span className={cn(
              "transition-opacity duration-150 text-[12px] flex items-center gap-1.5",
              expanded ? "opacity-100" : "opacity-0 pointer-events-none w-0",
            )}>
              Shortcuts
              <kbd className="text-[10px] border border-sidebar-foreground/20 rounded px-1 font-mono">?</kbd>
            </span>
          </button>
        )}

        <div className={cn(
          "px-2.5 pt-2 text-[10px] text-sidebar-foreground/30 whitespace-nowrap transition-opacity duration-150",
          expanded ? "opacity-100" : "opacity-0",
        )}>
          v1.0 · beta
        </div>
      </div>
    </div>
  )
}
