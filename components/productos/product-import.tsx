"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Download, Upload } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import Papa from 'papaparse'

interface CSVRow {
  nombre: string
  descripcion: string
  unidad_medida: string
  stock_actual: string
  precio: string
}

interface ProductImportProps {
  onSuccess?: () => void;
}

export function ProductImport({ onSuccess }: ProductImportProps) {
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [errors, setErrors] = useState<string[]>([])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length !== 1) {
      toast.error("Por favor, seleccione un único archivo CSV")
      return
    }

    const file = acceptedFiles[0]
    setProcessing(true)
    setProgress(0)
    setErrors([])

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        const rows = results.data as CSVRow[]
        const totalRows = rows.length
        let processedRows = 0
        const newErrors: string[] = []

        for (const row of rows) {
          try {
            // Validación básica
            if (!row.nombre || !row.unidad_medida || !row.precio) {
              throw new Error(`Fila ${processedRows + 1}: Nombre, unidad de medida y precio son requeridos`)
            }

            const stock = parseFloat(row.stock_actual)
            const precio = parseFloat(row.precio)
            if (isNaN(stock) || stock < 0) {
              throw new Error(`Fila ${processedRows + 1}: Stock inválido`)
            }
            if (isNaN(precio) || precio < 0) {
              throw new Error(`Fila ${processedRows + 1}: Precio inválido`)
            }

            // Insertar en la base de datos
            const { error } = await supabase
              .from('productos')
              .insert([{
                nombre: row.nombre,
                descripcion: row.descripcion,
                unidad_medida: row.unidad_medida,
                stock_actual: stock,
                precio: precio
              }])

            if (error) throw error

          } catch (error: any) {
            newErrors.push(error?.message || 'Error desconocido')
          }

          processedRows++
          setProgress((processedRows / totalRows) * 100)
        }

        setErrors(newErrors)
        
        if (newErrors.length === 0) {
          toast.success("Importación completada correctamente")
          onSuccess?.()
        } else {
          toast.error(`Importación completada con ${newErrors.length} errores`)
        }

        setProcessing(false)
      },
      error: (error) => {
        console.error('Error parsing CSV:', error)
        toast.error("Error al procesar el archivo CSV")
        setProcessing(false)
      }
    })
  }, [onSuccess])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    disabled: processing,
    multiple: false
  })

  const downloadTemplate = () => {
    const headers = "nombre,descripcion,unidad_medida,stock_actual,precio\n"
    const example = "Producto Ejemplo,Descripción del producto,unidad,10,1500\n"
    const blob = new Blob([headers + example], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'plantilla_productos.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" onClick={downloadTemplate}>
          <Download className="mr-2 h-4 w-4" />
          Descargar Plantilla
        </Button>
      </div>

      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center
          ${isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300'}
          ${processing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2">
          {isDragActive
            ? "Suelte el archivo aquí"
            : "Arrastre y suelte un archivo CSV aquí, o haga clic para seleccionar"
        }
        </p>
      </div>

      {processing && (
        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-sm text-center text-muted-foreground">
            Procesando... {Math.round(progress)}%
          </p>
        </div>
      )}

      {errors.length > 0 && (
        <div className="bg-destructive/10 p-4 rounded-lg">
          <h3 className="font-medium text-destructive mb-2">
            Errores encontrados:
          </h3>
          <ul className="list-disc pl-5 space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-sm text-destructive">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
} 