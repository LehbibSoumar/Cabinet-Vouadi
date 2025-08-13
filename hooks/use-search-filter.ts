"use client"

import { useState, useMemo } from "react"

interface UseSearchFilterProps {
  data: any[]
  searchFields: string[]
  filterFields?: { [key: string]: string[] }
}

export function useSearchFilter({ data, searchFields, filterFields = {} }: UseSearchFilterProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState<{ [key: string]: string }>({})

  const getNestedValue = (obj: any, path: string) => {
    return path.split(".").reduce((current, key) => current?.[key], obj)
  }

  const filteredData = useMemo(() => {
    let result = data

    if (searchTerm) {
      result = result.filter((item) =>
        searchFields.some((field) => {
          const value = getNestedValue(item, field)
          return value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        })
      )
    }

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "all") {
        result = result.filter((item) => {
          const itemValue = getNestedValue(item, key)
          return String(itemValue) === String(value)
        })
      }
    })

    return result
  }, [data, searchTerm, filters, searchFields])

  const updateFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setSearchTerm("")
    setFilters({})
  }

  return {
    searchTerm,
    setSearchTerm,
    filters,
    updateFilter,
    clearFilters,
    filteredData,
  }
}

