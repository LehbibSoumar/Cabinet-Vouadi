"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Eye } from "lucide-react"

interface MobileCardProps {
  title: string
  subtitle?: string
  subtitle1?: string
  content: { label: string; value: any; type?: "badge" | "text" | "date" | "currency" }[]
  actions?: {
    onEdit?: () => void
    onDelete?: () => void
    onView?: () => void
  }
  badge?: { text: string; variant?: "default" | "secondary" | "outline" | "destructive" }
  isAdmin?: boolean
}

export function MobileCard({ title, subtitle, subtitle1, content, actions, badge, isAdmin }: MobileCardProps) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-base truncate">{title}</h3>
            {subtitle && <p className="text-sm text-muted-foreground truncate">{subtitle} {subtitle1 ? `à ${subtitle1}` : ""}</p>}
          </div>
          {badge && (
            <Badge variant={badge.variant || "secondary"} className="ml-2 flex-shrink-0">
              {badge.text}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {content.map((item, index) => (
            <div key={index} className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">{item.label}:</span>
              <span className="font-medium text-right">
                {item.type === "badge" ? (
                  <Badge variant="outline" className="text-xs">
                    {item.value}
                  </Badge>
                ) : item.type === "date" ? (
                  new Date(item.value).toLocaleDateString("fr-FR")
                ) : item.type === "currency" ? (
                  `${item.value}€`
                ) : (
                  item.value
                )}
              </span>
            </div>
          ))}
        </div>
        {actions && (
          <div className="flex gap-2 mt-4 pt-3 border-t">
            {actions.onView && (
              <Button
                variant="outline"
                size="sm"
                onClick={actions.onView}
                className="flex-1 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300"
              >
                <Eye className="h-4 w-4" />
                Voir
              </Button>
            )}            
            {actions.onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={actions.onEdit}
                className="flex-1 bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300"
                disabled={!isAdmin}
              >
                <Edit className="h-4 w-4" />
                Modifier
              </Button>
            )}
            {actions.onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={actions.onDelete}
                className="flex-1 bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300"
              >
                <Trash2 className="h-4 w-4" />
                Supp
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
