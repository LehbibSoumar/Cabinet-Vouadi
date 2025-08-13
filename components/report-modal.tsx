"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DateRangeSelector } from "@/components/date-range-selector"
import { FileText, Euro, Download, Calendar, Users, Activity, TrendingUp, Clock, AlertCircle, MapPin } from "lucide-react"
import type { DateRange } from "react-day-picker"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { generateWeeklyReportPDF, generateMonthlyInvoicePDF } from "@/lib/pdf-generator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  type: "report" | "invoice"
  consultations: any[]
}

export function ReportModal({ isOpen, onClose, type, consultations }: ReportModalProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [lieuSelectionne, setLieuSelectionne] = useState<string>("")
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [honoraires, setHonoraires] = useState(90000)
  const [medicaments, setMedicaments] = useState(9000)


  const filteredConsultations = consultations.filter((consultation) => {
    if (!dateRange?.from || !dateRange?.to) return false
    const consultationDate = new Date(consultation.date)
    const isInDateRange = consultationDate >= dateRange.from && consultationDate <= dateRange.to
    const matchLieu = lieuSelectionne ? consultation.lieu === lieuSelectionne : true
    return isInDateRange && matchLieu
  })

  const formatMontant = (montant: number): string => {
    if (typeof montant !== "number" || Number.isNaN(montant)) return "";

    try {
      const nf = new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "MRU",
        currencyDisplay: "code",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(montant);

      let normalized = nf;
      if (/^[^\d]/.test(nf)) {
        const m = nf.match(/^([^\d]+)\s*(.+)$/);
        if (m) normalized = `${m[2]} ${m[1].trim()}`;
      }

      return normalized.replace(/\u202F/g, " ").replace(/\u00A0/g, " ");
    } catch (err) {
      const s = montant.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
      return `${s} MRU`;
    }
  }
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

    try {
      const periode = `${format(dateRange.from, "dd/MM/yyyy", { locale: fr })} au ${format(dateRange.to, "dd/MM/yyyy", { locale: fr })}`

      if (type === "report") {
        setIsGenerating(true)
        const reportData = {
          periode,
          details: filteredConsultations,
        }
        generateWeeklyReportPDF(reportData, lieuSelectionne)
      } else {
        const invoiceData = {
          currentDate: new Date().toLocaleDateString("fr-FR"),
          numero: invoiceNumber || `FACT-${format(new Date(), "yyyy-MM")}`,
          periode,
          honoraires: formatMontant(honoraires),
          medicaments: formatMontant(medicaments),
          total: formatMontant(honoraires + medicaments),
        }
        generateMonthlyInvoicePDF(invoiceData)

      }

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
    <Dialog open={isOpen} onOpenChange={onClose} modal={false}>
      <DialogContent className="w-full h-full max-w-4xl p-6 overflow-y-auto lg:max-h-[90vh] lg:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            {type === "report" ? (
              <>
                <FileText className="h-6 w-6 text-blue-600" />
                Générer un Rapport
              </>
            ) : (
              <>
                <Euro className="h-6 w-6 text-green-600" />
                Générer une Facture
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5" />
                Période de génération
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DateRangeSelector dateRange={dateRange} onDateRangeChange={setDateRange} />
              {dateRange?.from && dateRange?.to && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg border mb-4">
                  <p className="text-sm text-gray-700">
                    <Clock className="inline h-4 w-4 mr-1" />
                    Période sélectionnée: {format(dateRange.from, "dd MMMM yyyy", { locale: fr })}
                    {" → "}
                    {format(dateRange.to, "dd MMMM yyyy", { locale: fr })}
                  </p>
                </div>
              )}
              {type === "report" && (
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <MapPin className="h-5 w-5" />
                    Lieu de consultation
                  </Label>
                  <Select onValueChange={setLieuSelectionne} value={lieuSelectionne}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les lieux" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cabinet">Cabinet</SelectItem>
                      <SelectItem value="Port">Port</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {dateRange?.from && dateRange?.to && (
            type === "report" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Aperçu des données
                </h3>


                {filteredConsultations.length === 0 ? (
                  <Card className="border-orange-200 bg-orange-50">
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
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Consultations</CardTitle>
                          <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{stats.totalConsultations}</div>
                          <p className="text-xs text-muted-foreground">Total période</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Employés</CardTitle>
                          <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{stats.uniqueEmployees}</div>
                          <p className="text-xs text-muted-foreground">Consultés</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Repos</CardTitle>
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{stats.reposAccordes}</div>
                          <p className="text-xs text-muted-foreground">Accordés</p>
                        </CardContent>
                      </Card>
                    </div>


                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Consultations récentes ({Math.min(5, filteredConsultations.length)})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {filteredConsultations.slice(0, 5).map((consultation) => {
                            return (
                              <div
                                key={consultation.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                              >
                                <div className="flex-1">
                                  <div className="font-medium">
                                    {consultation.employeNom || "Inconnu"}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {consultation.medicinNom || "Inconnu"} • {new Date(consultation.date).toLocaleDateString("fr-FR")}
                                  </div>
                                  { consultation.lieu && (
                                    <div className="text-sm text-gray-500">
                                      Lieu: {consultation.lieu}
                                    </div>
                                  )}
                                  { consultation.diagnostic && (
                                    <div className="text-sm text-gray-500">
                                      Diagnostic: {consultation.diagnostic || "Aucun"}
                                    </div>
                                  )}
                                  { consultation.traitement && (
                                    <div className="text-sm text-gray-500">
                                      Traitement: {consultation.traitement || "Aucun"}
                                    </div>
                                  )}
                                  { consultation.observations && (
                                    <div className="text-sm text-gray-500">
                                      Observations: {consultation.observations || "Aucune"}
                                    </div>
                                  )}
                                  { consultation.repos?.accorde && (
                                    <>
                                    <div className="text-sm text-gray-500">
                                      {consultation.repos.dateDebut} → {consultation.repos.dateFin}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      Motif: {consultation.repos.motif || "Aucun"}
                                    </div>
                                    </>
                                  )}
                                  
                                </div>
                                <div className="text-right">
                                  {consultation.repos.accorde ? (
                                    <Badge variant="secondary" className="text-xs bg-green-50 text-green-700">
                                      {consultation.repos.duree} jour(s)
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-xs bg-red-50 text-red-700">
                                      Repos non accordé
                                    </Badge>
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
            )
          )}

          {type === "invoice" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations de facture</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoice-number">Numéro de facture</Label>
                    <Input
                      id="invoice-number"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="70"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="honoraires">Honoraires Médecin</Label>
                    <Input
                      id="honoraires"
                      type="number"
                      value={honoraires}
                      onChange={(e) => setHonoraires(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medicaments">Médicaments</Label>
                    <Input
                      id="medicaments"
                      type="number"
                      value={medicaments}
                      onChange={(e) => setMedicaments(Number(e.target.value))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto bg-transparent"
            >
              Annuler
            </Button>

            {type === "invoice" ? (
              <Button
                onClick={handleGenerate}
                disabled={!invoiceNumber || !honoraires || !medicaments}
                className="w-full sm:w-auto"
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger la facture PDF
              </Button>
            ) : (
              <Button
                onClick={handleGenerate}
                disabled={!isValidRange || isGenerating}
                className="w-full sm:w-auto"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Génération...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger le rapport PDF
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
