"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ConsultationSearchProps {
  searchTerm: string
  onSearchChange: (term: string) => void
  filters: { [key: string]: string }
  onFilterChange: (key: string, value: string) => void
  onClearFilters: () => void
}

export function ConsultationSearch({
  searchTerm,
  onSearchChange,
  filters,
  onFilterChange,
  onClearFilters,
}: ConsultationSearchProps) {
  const [showFilters, setShowFilters] = useState(false)

  const activeFiltersCount = Object.values(filters).filter((value) => value && value !== "all").length

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Rechercher par matricule, nom ou prénom"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtres
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
          {(searchTerm || activeFiltersCount > 0) && (
            <Button variant="outline" onClick={onClearFilters}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border">
          <div className="space-y-2">
            <label className="text-sm font-medium">Repos</label>
            <Select value={filters.repos || "all"} onValueChange={(value) => onFilterChange("repos", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="true">Accordé</SelectItem>
                <SelectItem value="false">Non accordé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(filters).map(([key, value]) => {
            if (!value || value === "all") return null
            let label = ""
            let displayValue = value

            if (key === "repos") {
              label = "Repos"
              displayValue = value === "true" ? "Accordé" : "Non accordé"
            }

            return (
              <Badge key={key} variant="secondary" className="flex items-center gap-1">
                {label}: {displayValue}
                <X className="h-3 w-3 cursor-pointer" onClick={() => onFilterChange(key, "all")} />
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}
