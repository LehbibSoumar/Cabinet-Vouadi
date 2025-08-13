"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText } from "lucide-react"


interface EmployeeHistoryModalProps {
    consultation: any
    isOpen: boolean
    onClose: () => void
}

export function ConsultationInfo({ consultation, isOpen, onClose }: EmployeeHistoryModalProps) {


    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl h-full overflow-y-auto sm:max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>
                        Informations de la Consultation - {consultation?.employeNom || "Inconnu"}
                    </DialogTitle>
                    <p className="text-muted-foreground">
                        {consultation?.employeMatricule} • {new Date(consultation?.date).toLocaleDateString("fr-FR")}
                    </p>
                </DialogHeader>


                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <FileText className="h-5 w-5 mr-2" />
                            Détails de la Consultation
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <span className="font-medium">Médecin:</span>
                                <p className="text-muted-foreground">{consultation?.medicinNom || "Inconnu"}</p>
                            </div>
                            <div>
                                <span className="font-medium">Lieu:</span>
                                <p className="text-muted-foreground">{consultation?.lieu || "Non spécifié"}</p>
                            </div>
                            <div>
                                <span className="font-medium">Diagnostic:</span>
                                <p className="text-muted-foreground">{consultation?.diagnostic || "Non spécifié"}</p>
                            </div>
                            <div>
                                <span className="font-medium">Traitement:</span>
                                <p className="text-muted-foreground">{consultation?.traitement || "Non spécifié"}</p>
                            </div>
                            <div>
                                <span className="font-medium">Observations:</span>
                                <p className="text-muted-foreground">{consultation?.observations || "Aucune"}</p>
                            </div>
                            <div>
                                <span className="font-medium">Repos Accordé:</span>
                                <p className="text-muted-foreground">
                                    {consultation?.repos.accorde ? (
                                        consultation?.repos.duree
                                            ? `${consultation?.repos.duree} jour(s)`
                                            : "Oui"
                                    ) : "Non"}

                                </p>
                            </div>
                            {consultation?.repos.accorde && (
                                <>
                                <div>
                                    <span className="font-medium">Début de Repos:</span>
                                    <p className="text-muted-foreground">
                                        {consultation?.repos.dateDebut ? new Date(consultation?.repos.dateDebut).toLocaleDateString("fr-FR") : "Non applicable"}
                                    </p>
                                </div>
                                <div>
                                    <span className="font-medium">Fin de Repos:</span>
                                    <p className="text-muted-foreground">
                                        {consultation?.repos.dateFin ? new Date(consultation?.repos.dateFin).toLocaleDateString("fr-FR") : "Non applicable"}
                                    </p>
                                </div>
                                <div>
                                    <span className="font-medium">Motif de Repos:</span>
                                    <p className="text-muted-foreground">
                                        {consultation?.repos.motif || "Non spécifié"}
                                    </p>
                                </div>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </DialogContent>
        </Dialog>
    )
}
