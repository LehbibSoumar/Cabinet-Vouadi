"use client"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

interface TablePaginationProps {
  pagination: ReturnType<typeof import("./use-pagination").usePagination>
  totalRows: number
}

export function TablePagination({ pagination, totalRows }: TablePaginationProps) {

  return (
    <div className="flex items-center justify-between px-4 py-2 border-t">
      <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
        {pagination.paginatedData.length} of {totalRows} row(s) displayed.
      </div>
      <div className="flex w-full items-center gap-8 lg:w-fit">
        {/* Sélection du nombre de lignes */}

        {/* Infos de page */}
        <div className="flex w-fit items-center justify-center text-sm font-medium">
          Page {pagination.currentPage} of {pagination.totalPages || 1}
        </div>

        {/* Boutons de navigation */}
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <Button
            variant="outline"
            className="boder-gray-300 bg-transparent text-gray-500 hover:bg-gray-100"
            size="sm"
            onClick={pagination.goToPreviousPage}
            disabled={!pagination.hasPreviousPage}
          >
            <ChevronLeft className="w-4 h-4"/>
          </Button>
          <Button
            variant="outline"
            className="boder-gray-300 bg-transparent text-gray-500 hover:bg-gray-100"
            size="sm"
            onClick={pagination.goToNextPage}
            disabled={!pagination.hasNextPage}
          >
            <ChevronRight className="w-4 h-4"/>
          </Button>
        </div>
      </div>
    </div>
  )
}
