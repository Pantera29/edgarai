"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { verifyToken } from "@/app/jwt/token"
import { supabase } from "@/lib/supabase"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react"
import { FormDropdown } from "@/components/FormDropdown"

interface VehicleMake { id: string; name: string }
interface VehicleModel { id: string; name: string; make_id: string }
interface Service { id_uuid: string; service_name: string }

interface BulkRow {
  kilometers: number | ''
  months: number | ''
  price: number | ''
  is_active: boolean
  service_id: string
  additional_price: number | ''
  additional_description: string
  includes_additional: boolean
  service_name: string
}

export default function CargaMasivaServiciosEspecificosPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [token, setToken] = useState<string>("")
  const [dataToken, setDataToken] = useState<any>({})

  const [makes, setMakes] = useState<VehicleMake[]>([])
  const [models, setModels] = useState<VehicleModel[]>([])
  const [services, setServices] = useState<Service[]>([])

  const [selectedMake, setSelectedMake] = useState<string>("")
  const [selectedModel, setSelectedModel] = useState<string>("")

  const [rows, setRows] = useState<BulkRow[]>([])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    const tokenValue = params.get("token")
    if (!tokenValue) {
      router.push("/login")
      return
    }
    setToken(tokenValue)
    const verified = verifyToken(tokenValue)
    if (!verified || typeof verified !== "object" || !(verified as any).dealership_id) {
      router.push("/login")
      return
    }
    setDataToken(verified)
    void Promise.all([
      cargarTodasLasMarcas(),
      cargarServicios((verified as any).dealership_id),
    ])
  }, [router])

  useEffect(() => {
    if (!selectedMake) {
      setModels([])
      setSelectedModel("")
      return
    }
    void cargarModelosPorMarca(selectedMake)
  }, [selectedMake])

  const formatKilometers = (km: number) => new Intl.NumberFormat('es-AR').format(km)
  const generateServiceName = (km: number, months: number) => `Servicio de ${formatKilometers(km)} kms o ${months} meses`

  async function cargarTodasLasMarcas() {
    const { data, error } = await supabase
      .from('vehicle_makes')
      .select('id, name')
      .order('name')
    if (error) {
      console.error(error)
      toast({ title: "Error", description: "No se pudieron cargar las marcas", variant: "destructive" })
      return
    }
    setMakes(data || [])
  }

  async function cargarModelosPorMarca(makeId: string) {
    const { data, error } = await supabase
      .from('vehicle_models')
      .select('id, name, make_id')
      .eq('make_id', makeId)
      .eq('is_active', true)
      .order('name')
    if (error) {
      console.error(error)
      toast({ title: "Error", description: "No se pudieron cargar los modelos", variant: "destructive" })
      return
    }
    setModels(data || [])
  }

  async function cargarServicios(dealershipId: string) {
    const { data, error } = await supabase
      .from('services')
      .select('id_uuid, service_name')
      .eq('dealership_id', dealershipId)
      .order('service_name')
    if (error) {
      console.error(error)
      toast({ title: "Error", description: "No se pudieron cargar los servicios", variant: "destructive" })
      return
    }
    setServices(data || [])
  }

  const canAddRows = useMemo(() => Boolean(selectedModel), [selectedModel])

  function addRow() {
    setRows((prev) => [
      ...prev,
      {
        kilometers: '',
        months: '',
        price: '',
        is_active: true,
        service_id: "",
        additional_price: '',
        additional_description: "",
        includes_additional: false,
        service_name: "",
      },
    ])
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index))
  }

  function updateRow<K extends keyof BulkRow>(index: number, key: K, value: BulkRow[K]) {
    setRows((prev) => {
      const next = [...prev]
      const row = { ...next[index], [key]: value } as BulkRow
      const kmNum = typeof row.kilometers === 'number' ? row.kilometers : parseInt(String(row.kilometers)) || 0
      const mNum = typeof row.months === 'number' ? row.months : parseInt(String(row.months)) || 0
      if ((key === 'kilometers' || key === 'months') && kmNum > 0 && mNum > 0) {
        row.service_name = generateServiceName(kmNum, mNum)
      }
      next[index] = row
      return next
    })
  }

  async function handleSave() {
    if (!selectedModel) {
      toast({ title: "Error", description: "Selecciona un modelo antes de guardar", variant: "destructive" })
      return
    }
    if (rows.length === 0) {
      toast({ title: "Error", description: "Agrega al menos una fila", variant: "destructive" })
      return
    }

    // Validación básica
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      if (r.kilometers <= 0 || r.months <= 0 || !r.service_id) {
        toast({ title: "Error", description: `Revisa los datos de la fila ${i + 1}`, variant: "destructive" })
        return
      }
    }

    const dealershipId = (dataToken as any)?.dealership_id
    if (!dealershipId) {
      toast({ title: "Error", description: "Token inválido (sin agencia)", variant: "destructive" })
      return
    }

    setIsSaving(true)
    try {
      const payload = rows.map((r) => ({
        model_id: selectedModel,
        dealership_id: dealershipId,
        service_name: r.service_name || generateServiceName(Number(r.kilometers) || 0, Number(r.months) || 0),
        kilometers: Number(r.kilometers) || 0,
        months: Number(r.months) || 0,
        price: Number(r.price) || 0,
        is_active: r.is_active,
        service_id: r.service_id,
        additional_price: Number(r.additional_price) || 0,
        additional_description: r.additional_description,
        includes_additional: r.includes_additional,
      }))

      const res = await fetch('/api/services/specific/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.details || err?.error || 'Error al crear servicios')
      }

      const data = await res.json()
      toast({ title: "Éxito", description: `Se crearon ${data.created} registros` })
      setRows([])
    } catch (error) {
      console.error(error)
      toast({ title: "Error", description: "No se pudieron crear los servicios", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.push(`/backoffice/servicios-especificos${token ? `?token=${token}` : ''}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Carga masiva de servicios específicos</h1>
            <p className="text-muted-foreground mt-2">Selecciona marca y modelo, luego agrega filas y guarda para crear múltiples registros.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={addRow} disabled={!canAddRows}>
            <Plus className="h-4 w-4 mr-2" /> Agregar fila
          </Button>
          <Button onClick={handleSave} disabled={!canAddRows || rows.length === 0 || isSaving}>
            <Save className="h-4 w-4 mr-2" /> {isSaving ? 'Guardando...' : `Guardar (${rows.length})`}
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Selección</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormDropdown
              label="Marca"
              options={makes}
              selectedValue={selectedMake}
              onValueChange={(v) => { setSelectedMake(v); setSelectedModel(""); }}
              placeholder="Seleccionar marca"
            />
            <FormDropdown
              label="Modelo"
              options={models}
              selectedValue={selectedModel}
              onValueChange={setSelectedModel}
              placeholder="Seleccionar modelo"
              disabled={!selectedMake}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filas a crear</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Km</TableHead>
                <TableHead>Meses</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Activo</TableHead>
                <TableHead>Servicio base</TableHead>
                <TableHead>Incluye adicional</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No hay filas. Agrega una fila para comenzar.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, idx) => (
                  <>
                  <TableRow key={`main-${idx}`} className="h-20 align-middle">
                    <TableCell className="max-w-[110px]">
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={row.kilometers}
                        onChange={(e) => updateRow(idx, 'kilometers', e.target.value as any)}
                        placeholder="5000"
                        className="h-12 text-right font-medium"
                      />
                    </TableCell>
                    <TableCell className="max-w-[110px]">
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={row.months}
                        onChange={(e) => updateRow(idx, 'months', e.target.value as any)}
                        placeholder="6"
                        className="h-12 text-right font-medium"
                      />
                    </TableCell>
                    <TableCell className="max-w-[120px]">
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={row.price}
                        onChange={(e) => updateRow(idx, 'price', e.target.value as any)}
                        placeholder="0.00"
                        className="h-12 text-right font-medium"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <Switch checked={row.is_active} onCheckedChange={(v) => updateRow(idx, 'is_active', v)} />
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[260px]">
                      <Select value={row.service_id} onValueChange={(v) => updateRow(idx, 'service_id', v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar servicio base" />
                        </SelectTrigger>
                        <SelectContent className="max-h-80">
                          {services.map((s) => (
                            <SelectItem key={s.id_uuid} value={s.id_uuid}>{s.service_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <Switch checked={row.includes_additional} onCheckedChange={(v) => updateRow(idx, 'includes_additional', v)} />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => removeRow(idx)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  {row.includes_additional && (
                    <TableRow key={`addl-${idx}`} className="bg-muted/30">
                      <TableCell colSpan={6}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-3">
                          <div>
                            <Label className="text-xs text-muted-foreground">Precio adicional</Label>
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={row.additional_price}
                              onChange={(e) => updateRow(idx, 'additional_price', e.target.value as any)}
                              placeholder="0.00"
                              className="mt-1 h-10 text-right"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label className="text-xs text-muted-foreground">Descripción adicional</Label>
                            <Input
                              value={row.additional_description}
                              onChange={(e) => updateRow(idx, 'additional_description', e.target.value)}
                              placeholder="Descripción..."
                              className="mt-1 h-10"
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  )}
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Toaster />
    </div>
  )
}


