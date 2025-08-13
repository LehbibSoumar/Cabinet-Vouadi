"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { FileText, Euro, Download, Calendar, Users, Activity, TrendingUp, Clock, AlertCircle } from "lucide-react"
import type { DateRange } from "react-day-picker"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { generateWeeklyReportPDF, generateMonthlyInvoicePDF } from "@/lib/pdf-generator"

interface ReportGeneratorModalProps {
  isOpen: boolean
  onClose: () => void
  type: "report" | "invoice"
  consultations: any[]
  employees: any[]
  doctors: any[]
}

export function ReportGeneratorModal({
  isOpen,
  onClose,
  type,
  consultations,
  employees,
  doctors,
}: ReportGeneratorModalProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  })
  const [isGenerating, setIsGenerating] = useState(false)

  // Filtrer les consultations selon la période sélectionnée
  const filteredConsultations = consultations.filter((consultation) => {
    if (!dateRange?.from || !dateRange?.to) return false
    const consultationDate = new Date(consultation.date)
    return consultationDate >= dateRange.from && consultationDate <= dateRange.to
  })

  // Calculer les statistiques
  const stats = {
    totalConsultations: filteredConsultations.length,
    totalRevenue: filteredConsultations.reduce((sum, c) => sum + c.cout, 0),
    reposAccordes: filteredConsultations.filter((c) => c.repos.accorde).length,
    totalRestDays: filteredConsultations.reduce((sum, c) => sum + (c.repos.accorde ? c.repos.duree : 0), 0),
    averageCost:
      filteredConsultations.length > 0
        ? filteredConsultations.reduce((sum, c) => sum + c.cout, 0) / filteredConsultations.length
        : 0,
    uniqueEmployees: new Set(filteredConsultations.map((c) => c.employeId)).size,
    uniqueDoctors: new Set(filteredConsultations.map((c) => c.medecinId)).size,
  }

  const handleGenerate = async () => {
    if (!dateRange?.from || !dateRange?.to) return

    setIsGenerating(true)

    try {
      const periode = `${format(dateRange.from, "dd/MM/yyyy", { locale: fr })} - ${format(dateRange.to, "dd/MM/yyyy", { locale: fr })}`

      if (type === "report") {
        const reportData = {
          periode,
          consultations: stats.totalConsultations,
          reposAccordes: stats.reposAccordes,
          coutTotal: stats.totalRevenue,
          details: filteredConsultations.map((c) => {
            const employee = employees.find((e) => e.id === c.employeId)
            const doctor = doctors.find((d) => d.id === c.medecinId)
            return {
              date: c.date,
              employe: `${employee?.prenom} ${employee?.nom}`,
              medecin: `${doctor?.nom}`,
              motif: c.motif,
              cout: c.cout,
              repos: c.repos.accorde ? `${c.repos.duree} jour(s)` : "Non",
            }
          }),
        }
        generateWeeklyReportPDF(reportData)
      } else {
        const invoiceData = {
          numero: `FACT-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
          date: format(new Date(), "dd/MM/yyyy", { locale: fr }),
          periode,
          client: {
            nom: "Terminal à conteneurs de Nouakchott (TCN)",
            adresse: "Port Autonome de Nouakchott\nBP 7303",
          },
          prestataire: {
            nom: "Cabinet Médical Vouadi",
            adresse: "Route centre émetteur à côté des maisons Tata\nNouakchott, Mauritanie",
            telephone: "44700138 / 20901877",
            email: "hbounamokhtar@gmail.com",
            nif: "00821892",
          },
          lignes: filteredConsultations.map((c) => {
            const employee = employees.find((e) => e.id === c.employeId)
            const doctor = doctors.find((d) => d.id === c.medecinId)
            return {
              date: format(new Date(c.date), "dd/MM/yyyy", { locale: fr }),
              employe: `${employee?.prenom} ${employee?.nom}`,
              medecin: doctor?.nom,
              motif: c.motif,
              cout: c.cout,
            }
          }),
          sousTotal: stats.totalRevenue,
          tva: stats.totalRevenue * 0.2,
          total: stats.totalRevenue * 1.2,
        }

        generateMonthlyInvoicePDF(invoiceData)
      }

      // Simuler un délai de génération
      await new Promise((resolve) => setTimeout(resolve, 1500))
      onClose()
    } catch (error) {
      console.error("Erreur lors de la génération:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const isValidRange = dateRange?.from && dateRange?.to && filteredConsultations.length > 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            {type === "report" ? (
              <>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  Générer un Rapport
                </span>
              </>
            ) : (
              <>
                <div className="p-2 bg-green-100 rounded-lg">
                  <Euro className="h-6 w-6 text-green-600" />
                </div>
                <span className="bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                  Générer une Facture
                </span>
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Sélection de période */}
          <Card className="border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
                <span className="text-gray-800">Période de génération</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DatePickerWithRange date={dateRange} setDate={setDateRange} />
              {dateRange?.from && dateRange?.to && (
                <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-800">
                    <Clock className="inline h-4 w-4 mr-1" />
                    Période sélectionnée: {format(dateRange.from, "dd MMMM yyyy", { locale: fr })}
                    {" → "}
                    {format(dateRange.to, "dd MMMM yyyy", { locale: fr })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Aperçu des données */}
          {dateRange?.from && dateRange?.to && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                Aperçu des données
              </h3>

              {filteredConsultations.length === 0 ? (
                <Card className="border-2 border-orange-200 bg-orange-50">
                  <CardContent className="flex items-center gap-3 p-6">
                    <AlertCircle className="h-8 w-8 text-orange-600" />
                    <div>
                      <h4 className="font-semibold text-orange-800">Aucune donnée trouvée</h4>
                      <p className="text-orange-700">
                        Aucune consultation n'a été trouvée pour la période sélectionnée.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Statistiques principales */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-md transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-800">Consultations</CardTitle>
                        <Activity className="h-4 w-4 text-blue-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-blue-900">{stats.totalConsultations}</div>
                        <p className="text-xs text-blue-700">Total période</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-md transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-green-800">Chiffre d'affaires</CardTitle>
                        <Euro className="h-4 w-4 text-green-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-900">{stats.totalRevenue}€</div>
                        <p className="text-xs text-green-700">Hors taxes</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-md transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-purple-800">Employés</CardTitle>
                        <Users className="h-4 w-4 text-purple-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-purple-900">{stats.uniqueEmployees}</div>
                        <p className="text-xs text-purple-700">Consultés</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-md transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-orange-800">Repos</CardTitle>
                        <Calendar className="h-4 w-4 text-orange-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-orange-900">{stats.reposAccordes}</div>
                        <p className="text-xs text-orange-700">Accordés</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Détails financiers pour facture */}
                  {type === "invoice" && (
                    <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
                      <CardHeader>
                        <CardTitle className="text-lg text-gray-800">Détail financier</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Sous-total HT:</span>
                          <span className="font-semibold text-gray-900">{stats.totalRevenue.toFixed(2)}€</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">TVA (20%):</span>
                          <span className="font-semibold text-gray-900">{(stats.totalRevenue * 0.2).toFixed(2)}€</span>
                        </div>
                        <div className="border-t pt-2">
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold text-gray-800">Total TTC:</span>
                            <span className="text-xl font-bold text-green-600">
                              {(stats.totalRevenue * 1.2).toFixed(2)}€
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Résumé des consultations récentes */}
                  <Card className="border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-lg text-gray-800">
                        Consultations récentes ({Math.min(5, filteredConsultations.length)})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {filteredConsultations.slice(0, 5).map((consultation, index) => {
                          const employee = employees.find((e) => e.id === consultation.employeId)
                          const doctor = doctors.find((d) => d.id === consultation.medecinId)
                          return (
                            <div
                              key={consultation.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">
                                  {employee?.prenom} {employee?.nom}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {new Date(consultation.date).toLocaleDateString("fr-FR")} • {doctor?.nom}
                                </div>
                                <div className="text-sm text-gray-500">{consultation.motif}</div>
                              </div>
                              <div className="text-right">
                                <Badge variant="outline" className="mb-1">
                                  {consultation.cout}€
                                </Badge>
                                {consultation.repos.accorde && (
                                  <div className="text-xs text-orange-600">Repos: {consultation.repos.duree}j</div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                        {filteredConsultations.length > 5 && (
                          <div className="text-center text-sm text-gray-500 py-2">
                            ... et {filteredConsultations.length - 5} autres consultations
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto bg-transparent hover:bg-gray-50">
              Annuler
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!isValidRange || isGenerating}
              className={`w-full sm:w-auto ${type === "report"
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                } text-white shadow-lg hover:shadow-xl transition-all`}
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Génération...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger {type === "report" ? "le rapport" : "la facture"} PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
