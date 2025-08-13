"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface GlobalSearchProps {
  searchTerm: string
  onSearchChange: (term: string) => void
  filters: { [key: string]: string }
  onFilterChange: (key: string, value: string) => void
  onClearFilters: () => void
  filterOptions: {
    [key: string]: { label: string; options: { value: string; label: string }[] }
  }
  placeholder?: string
}

export function GlobalSearch({
  searchTerm,
  onSearchChange,
  filters,
  onFilterChange,
  onClearFilters,
  filterOptions,
  placeholder = "Rechercher...",
}: GlobalSearchProps) {
  const [showFilters, setShowFilters] = useState(false)

  const activeFiltersCount = Object.values(filters).filter((value) => value && value !== "all").length

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 h-4 w-4" />
          <Input
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
          >
            <Filter className="h-4 w-4" />
            Filtres
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-800">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
          {(searchTerm || activeFiltersCount > 0) && (
            <Button
              variant="outline"
              onClick={onClearFilters}
              className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 bg-transparent"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Filtres */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          {Object.entries(filterOptions).map(([key, { label, options }]) => (
            <div key={key} className="space-y-2">
              <label className="text-sm font-medium">{label}</label>
              <Select value={filters[key] || "all"} onValueChange={(value) => onFilterChange(key, value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      )}

      {/* Filtres actifs */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(filters).map(([key, value]) => {
            if (!value || value === "all") return null
            const filterConfig = filterOptions[key]
            const option = filterConfig?.options.find((opt) => opt.value === value)
            return (
              <Badge
                key={key}
                variant="secondary"
                className="flex items-center gap-1 bg-blue-100 text-blue-800 border border-blue-200"
              >
                {filterConfig?.label}: {option?.label}
                <X className="h-3 w-3 cursor-pointer hover:text-blue-600" onClick={() => onFilterChange(key, "all")} />
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}
