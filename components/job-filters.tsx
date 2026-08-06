"use client"

import { Search, MapPin, SlidersHorizontal, X, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

export interface FilterState {
  search: string
  location: string
  minScore: number
  onlyRemote: boolean
  sortBy: "score" | "date" | "title"
}

interface JobFiltersProps {
  filters: FilterState
  setFilters: (filters: FilterState) => void
  totalJobs: number
  shownJobs: number
}

export function JobFilters({ filters, setFilters, totalJobs, shownJobs }: JobFiltersProps) {
  
  const handleReset = () => {
    setFilters({
      search: "",
      location: "",
      minScore: 0,
      onlyRemote: false,
      sortBy: "score"
    })
  }

  const activeFilterCount = [
    filters.search, 
    filters.location, 
    filters.minScore > 0, 
    filters.onlyRemote
  ].filter(Boolean).length

  return (
    <div className="space-y-4 p-4 bg-sidebar/50 border-b border-sidebar-border">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search title, company, or keywords..."
          className="pl-9 bg-background"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
      </div>

      <div className="flex gap-2">
        {/* Advanced Filters Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="flex-1 border-dashed">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 rounded-sm">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="start">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Filter Jobs</h4>
                <p className="text-sm text-muted-foreground">
                  Refine your job feed results.
                </p>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    placeholder="City, State, or Country"
                    className="pl-9"
                    value={filters.location}
                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="score">Min Match Score</Label>
                  <span className="text-sm text-muted-foreground">{filters.minScore}%</span>
                </div>
                <Slider
                  id="score"
                  min={0}
                  max={95}
                  step={5}
                  value={[filters.minScore]}
                  onValueChange={(val) => setFilters({ ...filters, minScore: val[0] })}
                  className="py-4"
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="remote-mode" className="flex flex-col space-y-1">
                  <span>Remote Only</span>
                  <span className="font-normal text-xs text-muted-foreground">Hide on-site roles</span>
                </Label>
                <Switch
                  id="remote-mode"
                  checked={filters.onlyRemote}
                  onCheckedChange={(checked) => setFilters({ ...filters, onlyRemote: checked })}
                />
              </div>

              {activeFilterCount > 0 && (
                <Button 
                  variant="ghost" 
                  className="w-full mt-2" 
                  onClick={handleReset}
                >
                  <X className="mr-2 h-4 w-4" /> Reset Filters
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Sorting Dropdown */}
        <Select 
          value={filters.sortBy} 
          onValueChange={(val: any) => setFilters({ ...filters, sortBy: val })}
        >
          <SelectTrigger className="w-[130px] h-9 text-xs">
            <div className="flex items-center">
              <ArrowUpDown className="mr-2 h-3 w-3 opacity-50" />
              <SelectValue placeholder="Sort by" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="score">Best Match</SelectItem>
            <SelectItem value="date">Newest</SelectItem>
            <SelectItem value="title">A-Z</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="text-xs text-muted-foreground px-1">
        Showing {shownJobs} of {totalJobs} jobs
      </div>
    </div>
  )
}