import { ColumnDef } from "@tanstack/react-table"

export const columns: ColumnDef<any>[] = [
  {
    accessorKey: "id_uuid",
    header: "ID",
    cell: ({ row }) => row.original.id_uuid
  },
  {
    accessorKey: "estado",
    header: "Estado",
    cell: ({ row }) => row.original.estado
  }
] 