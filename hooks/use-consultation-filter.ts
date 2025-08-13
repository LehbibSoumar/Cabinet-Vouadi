"use client"

import { useState, useMemo } from "react"

interface UseConsultationFilterProps {
  consultations: any[]
}

export function useConsultationFilter({ consultations }: UseConsultationFilterProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState<{ [key: string]: string }>({})

  const filteredConsultations = useMemo(() => {
    let result = consultations

    // Recherche textuelle
    if (searchTerm) {
      result = result.filter(
        (consultation) =>
          consultation.employeNom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          consultation.employeMatricule?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          consultation.doctorNom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          consultation.doctorMatricule?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtres
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "all") {
        if (key === "repos") {
          result = result.filter((consultation) => consultation.repos.accorde.toString() === value)
        } else {
          result = result.filter((consultation) => consultation[key] === value)
        }
      }
    })

    return result
  }, [consultations, searchTerm, filters])

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
    filteredConsultations,
  }
}
