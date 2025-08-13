"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, FileText, Activity } from "lucide-react"
import { usePagination } from "@/hooks/use-pagination"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

// ✅ Imports Firestore
import { db } from "@/lib/firebase" // adapte selon ton projet
import { collection, onSnapshot, query, where } from "firebase/firestore"

interface EmployeeHistoryModalProps {
  employee: any
  isOpen: boolean
  onClose: () => void
}

export function EmployeeHistoryModal({ employee, isOpen, onClose }: EmployeeHistoryModalProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [employeeConsultations, setEmployeeConsultations] = useState<any[]>([])
  const [doctorsList, setDoctorsList] = useState<any[]>([])

  useEffect(() => {
    if (!employee) return

    const q = query(
      collection(db, "consultations"),
      where("employeId", "==", employee.id)
    )

    const unsubConsultations = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .map((doc) => {
          const docData = doc.data()
          return {
            id: doc.id,
            ...docData,
            date: docData.date?.toDate?.() || docData.date || null
          }
        })
        .sort((a, b) => (b.date?.getTime?.() || 0) - (a.date?.getTime?.() || 0))

      setEmployeeConsultations(data)
    })

    return () => unsubConsultations()
  }, [employee])


  useEffect(() => {
    const unsubDoctors = onSnapshot(collection(db, "doctors"), (snapshot) => {
      setDoctorsList(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    })
    return () => unsubDoctors()
  }, [])

  // 📊 Statistiques
  const totalConsultations = employeeConsultations.length
  const totalRestDays = employeeConsultations.reduce((sum, c) => sum + (c.repos?.accorde ? c.repos.duree : 0), 0)

  // Pagination
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

  if (!employee) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-full overflow-y-auto sm:max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            Historique Médical - {employee.civilite}. {employee.prenom} {employee.nom}
          </DialogTitle>
          <p className="text-muted-foreground">
            {employee.emploiOccupe} • Matricule: {employee.matricule}
          </p>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="consultations">Consultations</TabsTrigger>
          </TabsList>

          {/* --- Vue d'ensemble --- */}
          <TabsContent value="overview" className="space-y-6">
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
                    <span className="font-medium">Intitulé Unité:</span>
                    <p className="text-muted-foreground">{employee.intituleUnite}</p>
                  </div>
                  <div>
                    <span className="font-medium">Emploi Occupé:</span>
                    <p className="text-muted-foreground">{employee.emploiOccupe}</p>
                  </div>
                  <div>
                    <span className="font-medium">Intitulé Département:</span>
                    <p className="text-muted-foreground">{employee.intituleDepartement}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Consultations</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalConsultations}</div>
                  <p className="text-xs text-muted-foreground">Total</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Jours de Repos</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalRestDays}</div>
                  <p className="text-xs text-muted-foreground">Accordés</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* --- Liste des consultations --- */}
          <TabsContent value="consultations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Historique des Consultations ({totalConsultations})</CardTitle>
              </CardHeader>
              <CardContent>
                {employeeConsultations.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Aucune consultation enregistrée
                  </p>
                ) : (
                  <>
                    {paginatedConsultations.map((consultation) => {
                      const doctor = doctorsList.find((d) => d.id === consultation.medecinId)
                      return (
                        <div key={consultation.id} className="border rounded-lg p-4 space-y-3 mb-4">
                          <div className="font-medium">
                            {new Date(consultation.date).toLocaleDateString("fr-FR")} à {consultation.heure}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Dr. {doctor?.nom} {doctor?.prenom} • {doctor?.specialite}
                          </div>
                          <div className="text-sm">
                            Diagnostic: {consultation.diagnostic || "Aucun"}
                          </div>
                          <div className="text-sm">
                            Traitement: {consultation.traitement || "Aucun"}
                          </div>
                          <div className="text-sm">
                            Observations: {consultation.observations || "Aucune"}
                          </div>
                          <div>
                            {consultation.repos?.accorde ? (
                              <Badge variant="secondary" className="bg-green-50 text-green-700">
                                {consultation.repos.duree} jour(s)
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-red-50 text-red-700">
                                Repos non accordé
                              </Badge>
                            )}
                          </div>
                          {consultation.repos?.accorde && (
                            <>
                            <div className="text-sm text-muted-foreground">
                              Repos accordé du {new Date(consultation.repos.dateDebut).toLocaleDateString("fr-FR")} au{" "}
                              {new Date(consultation.repos.dateFin).toLocaleDateString("fr-FR")}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Motif de repos: {consultation.repos.motif || "Aucun"}
                            </div>
                            </>
                          )}
                        </div>
                      )
                    })}

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={goToPreviousPage}
                              className={!hasPreviousPage ? "opacity-50 pointer-events-none" : ""}
                            />
                          </PaginationItem>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => goToPage(page)}
                                isActive={currentPage === page}
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          <PaginationItem>
                            <PaginationNext
                              onClick={goToNextPage}
                              className={!hasNextPage ? "opacity-50 pointer-events-none" : ""}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
