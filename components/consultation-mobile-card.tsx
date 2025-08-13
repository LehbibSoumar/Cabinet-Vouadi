"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Eye } from "lucide-react"

interface ConsultationMobileCardProps {
  consultation: any
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}

export function ConsultationMobileCard({
  consultation,
  onView,
  onEdit,
  onDelete,
}: ConsultationMobileCardProps) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-base truncate">
              {consultation.employeNom || "Inconnu"}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {new Date(consultation.date).toLocaleDateString("fr-FR")} à {consultation.heure}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Matricule:</span>
            <span className="font-medium text-right">
              {consultation.employeMatricule || "Inconnu"}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Motif:</span>
            <span className="font-medium text-right truncate ml-2">{consultation.motif}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Repos:</span>
            <span className="font-medium text-right">
              {consultation.repos.accorde ? (
                <Badge variant="secondary" className="text-xs bg-green-50 text-green-700">
                  {consultation.repos.duree} jour(s)
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
                  Non
                </Badge>
              )}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Debut Repos:</span>
            <span className="font-medium text-right">
              {consultation.repos.dateDebut
                ? new Date(consultation.repos.dateDebut).toLocaleDateString("fr-FR")
                : "N/A"}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Fin Repos:</span>
            <span className="font-medium text-right">
              {consultation.repos.dateFin
                ? new Date(consultation.repos.dateFin).toLocaleDateString("fr-FR")
                : "N/A"}
            </span>
          </div>
        </div>
        <div className="flex gap-2 mt-4 pt-3 border-t">
          <Button variant="outline" size="sm" onClick={onView} className="flex-1 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300">
            <Eye className="h-4 w-4 mr-1" />
            Voir
          </Button>
          <Button variant="outline" size="sm" onClick={onEdit} className="flex-1 bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300">
            <Edit className="h-4 w-4 mr-1" />
            Modifier
          </Button>
          <Button variant="outline" size="sm" onClick={onDelete} className="flex-1 bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300">
            <Trash2 className="h-4 w-4 mr-1" />
            Supprimer
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
