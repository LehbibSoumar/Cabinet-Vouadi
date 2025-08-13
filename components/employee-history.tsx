"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, FileText, Activity, TrendingUp, Download } from "lucide-react"
import { usePagination } from "@/hooks/use-pagination"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import consultations from "@/data/consultations.json"
import doctors from "@/data/doctors.json"

interface EmployeeHistoryProps {
  employee: any
  isOpen: boolean
  onClose: () => void
}

export function EmployeeHistory({ employee, isOpen, onClose }: EmployeeHistoryProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [employeeConsultations, setEmployeeConsultations] = useState<any[]>([])

  const {
    currentPage,
    totalPages,
    paginatedData: paginatedConsultations,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    hasNextPage,
    hasPreviousPage,
  } = usePagination({
    data: employeeConsultations,
    itemsPerPage: 5,
  })

  // Statistiques
  const totalConsultations = employeeConsultations.length
  const totalCost = employeeConsultations.reduce((sum, c) => sum + c.cout, 0)
  const totalRestDays = employeeConsultations.reduce((sum, c) => sum + (c.repos.accorde ? c.repos.duree : 0), 0)
  const averageCost = totalConsultations > 0 ? totalCost / totalConsultations : 0

  // Consultations par mois
  const consultationsByMonth = employeeConsultations.reduce(
    (acc, cons) => {
      const month = new Date(cons.date).toLocaleDateString("fr-FR", { year: "numeric", month: "long" })
      acc[month] = (acc[month] || 0) + 1
      return acc
    },
    {} as { [key: string]: number },
  )

  // Médecins consultés
  const doctorsConsulted = [...new Set(employeeConsultations.map((c) => c.medecinId))].map((docId) => {
    const doctor = doctors.find((d) => d.id === docId)
    const consultCount = employeeConsultations.filter((c) => c.medecinId === docId).length
    return { doctor, count: consultCount }
  })

  const exportHistory = () => {
    const historyData = {
      employee: `${employee.prenom} ${employee.nom}`,
      periode: "Historique complet",
      totalConsultations,
      totalCost,
      totalRestDays,
      consultations: employeeConsultations.map((c) => {
        const doctor = doctors.find((d) => d.id === c.medecinId)
        return {
          date: c.date,
          medecin: `${doctor?.nom} ${doctor?.prenom}`,
          motif: c.motif,
          diagnostic: c.diagnostic,
          cout: c.cout,
          repos: c.repos.accorde ? `${c.repos.duree} jour(s)` : "Non",
        }
      }),
    }

    const dataStr = JSON.stringify(historyData, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)
    const exportFileDefaultName = `historique_${employee.nom}_${employee.prenom}.json`
    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  useState(() => {
    if (employee) {
      setEmployeeConsultations(
        consultations
          .filter((cons) => cons.employeId === employee.id)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      )
    }
  }, [employee])

  if (!employee) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-full overflow-y-auto sm:max-h-[90vh]">
        <DialogHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <DialogTitle className="text-xl sm:text-2xl">
                Historique Médical - {employee.prenom} {employee.nom} hh
              </DialogTitle>
              <p className="text-muted-foreground">
                {employee.poste} • ID: {employee.id}
              </p>
            </div>
            <Button
              onClick={exportHistory}
              variant="outline"
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 text-indigo-700 hover:from-indigo-100 hover:to-purple-100 hover:border-indigo-300"
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="overflow-x-auto">
            <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-gray-100 to-gray-200 p-1 rounded-lg">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
              >
                Vue d'ensemble
              </TabsTrigger>
              <TabsTrigger
                value="consultations"
                className="data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:shadow-sm"
              >
                Consultations
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm"
              >
                Analyses
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            {/* Informations personnelles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Informations Personnelles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <span className="font-medium">Email:</span>
                    <p className="text-muted-foreground break-all">{employee.email}</p>
                  </div>
                  <div>
                    <span className="font-medium">Téléphone:</span>
                    <p className="text-muted-foreground">{employee.telephone}</p>
                  </div>
                  <div>
                    <span className="font-medium">Date d'embauche:</span>
                    <p className="text-muted-foreground">
                      {new Date(employee.dateEmbauche).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Statut:</span>
                    <Badge variant="outline" className="ml-2">
                      {employee.statut}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistiques rapides */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-800">Consultations</CardTitle>
                  <Activity className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-900">{totalConsultations}</div>
                  <p className="text-xs text-blue-700">Total</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-800">Coût Total</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-900">{totalCost}€</div>
                  <p className="text-xs text-green-700">Toutes consultations</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-orange-800">Jours de Repos</CardTitle>
                  <Calendar className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-900">{totalRestDays}</div>
                  <p className="text-xs text-orange-700">Accordés</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-800">Coût Moyen</CardTitle>
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-900">{averageCost.toFixed(0)}€</div>
                  <p className="text-xs text-purple-700">Par consultation</p>
                </CardContent>
              </Card>
            </div>

            {/* Médecins consultés */}
            <Card>
              <CardHeader>
                <CardTitle>Médecins Consultés</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {doctorsConsulted.map(({ doctor, count }, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <div>
                        <div className="font-medium">
                          {doctor?.nom} {doctor?.prenom}
                        </div>
                        <div className="text-sm text-muted-foreground">{doctor?.specialite}</div>
                      </div>
                      <Badge variant="secondary">
                        {count} consultation{count > 1 ? "s" : ""}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="consultations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Historique des Consultations ({totalConsultations})</CardTitle>
              </CardHeader>
              <CardContent>
                {employeeConsultations.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Aucune consultation enregistrée</p>
                ) : (
                  <>
                    <div className="space-y-4">
                      {paginatedConsultations.map((consultation) => {
                        const doctor = doctors.find((d) => d.id === consultation.medecinId)
                        return (
                          <div key={consultation.id} className="border rounded-lg p-4 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                              <div>
                                <div className="font-medium text-lg">
                                  {new Date(consultation.date).toLocaleDateString("fr-FR")} à {consultation.heure}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Médecin: {doctor?.nom} {doctor?.prenom} • {doctor?.specialite}
                                </div>
                              </div>
                              <Badge variant="outline" className="self-start">
                                {consultation.cout}€
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <span className="font-medium text-sm">Motif:</span>
                                <p className="text-muted-foreground">{consultation.motif}</p>
                              </div>
                              <div>
                                <span className="font-medium text-sm">Diagnostic:</span>
                                <p className="text-muted-foreground">{consultation.diagnostic}</p>
                              </div>
                            </div>
                            {consultation.repos.accorde && (
                              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-yellow-600" />
                                  <span className="font-medium text-yellow-800">Repos Accordé</span>
                                </div>
                                <p className="text-yellow-700 mt-1">
                                  {consultation.repos.duree} jour(s) - {consultation.repos.motif}
                                </p>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="mt-6">
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious
                                onClick={goToPreviousPage}
                                className={!hasPreviousPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
                              />
                            </PaginationItem>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  onClick={() => goToPage(page)}
                                  isActive={currentPage === page}
                                  className="cursor-pointer"
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            ))}
                            <PaginationItem>
                              <PaginationNext
                                onClick={goToNextPage}
                                className={!hasNextPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Consultations par Mois</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(consultationsByMonth).map(([month, count]) => (
                      <div key={month} className="flex justify-between items-center">
                        <span className="text-sm">{month}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${(count / Math.max(...Object.values(consultationsByMonth))) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-8 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Répartition des Coûts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Coût minimum:</span>
                    <span className="font-bold">{Math.min(...employeeConsultations.map((c) => c.cout))}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Coût maximum:</span>
                    <span className="font-bold">{Math.max(...employeeConsultations.map((c) => c.cout))}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Coût moyen:</span>
                    <span className="font-bold">{averageCost.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span>Total:</span>
                    <span className="font-bold text-lg">{totalCost}€</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
