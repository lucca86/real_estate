"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Combobox } from "@/components/ui/combobox"
import { ChevronDown, SlidersHorizontal, X } from "lucide-react"
import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface City {
  id: string
  name: string
}

interface Neighborhood {
  id: string
  name: string
  city_id: string
}

interface PropertyType {
  id: string
  name: string
  is_active: boolean
}

interface User {
  id: string
  name: string
  role: string
}

export function PropertiesFilters({ activeOnly: initialActiveOnly = true }: { activeOnly?: boolean }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get("search") ?? "")
  const [propertyType, setPropertyType] = useState(searchParams.get("propertyType") ?? "all")
  const [transactionType, setTransactionType] = useState(searchParams.get("transactionType") ?? "Todas")
  const [status, setStatus] = useState(searchParams.get("status") ?? "Todos")
  const [city, setCity] = useState(searchParams.get("city") ?? "all")
  const [neighborhood, setNeighborhood] = useState(searchParams.get("neighborhood") ?? "all")
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "")
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "")
  const [bedrooms, setBedrooms] = useState(searchParams.get("bedrooms") || "Cualquiera")
  const [bathrooms, setBathrooms] = useState(searchParams.get("bathrooms") || "Cualquiera")
  const [activeOnly, setActiveOnly] = useState(initialActiveOnly)
  const [syncedOnly, setSyncedOnly] = useState(searchParams.get("syncedOnly") === "true")
  const [updatedBy, setUpdatedBy] = useState(searchParams.get("updatedBy") ?? "all")

  const [cities, setCities] = useState<City[]>([])
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([])
  const [filteredNeighborhoods, setFilteredNeighborhoods] = useState<Neighborhood[]>([])
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [open, setOpen] = useState(false)

  const activeCount = [
    "search",
    "propertyType",
    "transactionType",
    "status",
    "city",
    "neighborhood",
    "minPrice",
    "maxPrice",
    "bedrooms",
    "bathrooms",
    "updatedBy",
  ].filter((key) => searchParams.get(key)).length

  useEffect(() => {
    const loadData = async () => {
      const supabase = createBrowserClient()

      const { data: propertyTypesData } = await supabase
        .from("property_types")
        .select("id, name, is_active")
        .eq("is_active", true)
        .order("name")

      const { data: citiesData } = await supabase.from("cities").select("id, name").order("name")

      const { data: neighborhoodsData } = await supabase.from("neighborhoods").select("id, name, city_id").order("name")

      const { data: usersData } = await supabase
        .from("users")
        .select("id, name, role")
        .order("name")

      if (propertyTypesData) setPropertyTypes(propertyTypesData)
      if (citiesData) setCities(citiesData)
      if (neighborhoodsData) setNeighborhoods(neighborhoodsData)
      if (usersData) setUsers(usersData)
    }

    loadData()
  }, [])

  useEffect(() => {
    if (city && city !== "all") {
      const filtered = neighborhoods.filter((n) => n.city_id === city)
      setFilteredNeighborhoods(filtered)

      if (neighborhood && !filtered.find((n) => n.id === neighborhood)) {
        setNeighborhood("all")
      }
    } else {
      setFilteredNeighborhoods(neighborhoods)
    }
  }, [city, neighborhoods, neighborhood])

  const applyFilters = () => {
    const params = new URLSearchParams()

    if (search) params.set("search", search)
    if (propertyType && propertyType !== "all") params.set("propertyType", propertyType)
    if (transactionType !== "Todas") params.set("transactionType", transactionType)
    if (status !== "Todos") params.set("status", status)
    if (city && city !== "all") params.set("city", city)
    if (neighborhood && neighborhood !== "all") params.set("neighborhood", neighborhood)
    if (minPrice) params.set("minPrice", minPrice)
    if (maxPrice) params.set("maxPrice", maxPrice)
    if (bedrooms !== "Cualquiera") params.set("bedrooms", bedrooms)
    if (bathrooms !== "Cualquiera") params.set("bathrooms", bathrooms)
    if (!activeOnly) params.set("activeOnly", "false")
    if (syncedOnly) params.set("syncedOnly", "true")
    if (updatedBy && updatedBy !== "all") params.set("updatedBy", updatedBy)

    setOpen(false)
    router.push(`/properties?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearch("")
    setPropertyType("all")
    setTransactionType("Todas")
    setStatus("Todos")
    setCity("all")
    setNeighborhood("all")
    setMinPrice("")
    setMaxPrice("")
    setBedrooms("Cualquiera")
    setBathrooms("Cualquiera")
    setActiveOnly(true)
    setSyncedOnly(false)
    setUpdatedBy("all")
    setOpen(false)
    router.push("/properties")
  }

  return (
    <Card className="gap-0 py-0 @7xl:sticky @7xl:top-4 @7xl:max-h-[calc(100svh-8rem)] @7xl:overflow-y-auto">
      <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-4 p-4 @7xl:flex-col @7xl:flex-nowrap @7xl:items-stretch @7xl:p-6">
        <div className="order-0 hidden w-full items-center justify-between @7xl:flex">
          <h2 className="text-lg font-semibold leading-none">Filtros</h2>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-4 w-4" />
            Limpiar
          </Button>
        </div>

        <div className="order-2 flex items-center gap-3 @7xl:order-1 @7xl:w-full @7xl:justify-between">
          <Label htmlFor="active-only" className="text-sm font-medium">
            Solo propiedades activas
          </Label>
          <Switch
            id="active-only"
            checked={activeOnly}
            onCheckedChange={(checked) => {
              setActiveOnly(checked)
              const params = new URLSearchParams(searchParams.toString())
              if (!checked) {
                params.set("activeOnly", "false")
              } else {
                params.delete("activeOnly")
              }
              router.push(`/properties?${params.toString()}`)
            }}
          />
        </div>

        <div className="order-2 flex items-center gap-3 @7xl:order-1 @7xl:w-full @7xl:justify-between">
          <Label htmlFor="synced-only" className="text-sm font-medium">
            Solo sincronizadas con WordPress
          </Label>
          <Switch
            id="synced-only"
            checked={syncedOnly}
            onCheckedChange={(checked) => {
              setSyncedOnly(checked)
              const params = new URLSearchParams(searchParams.toString())
              if (checked) {
                params.set("syncedOnly", "true")
              } else {
                params.delete("syncedOnly")
              }
              router.push(`/properties?${params.toString()}`)
            }}
          />
        </div>

        <div className="order-1 flex w-full items-end gap-2 @7xl:order-2 @7xl:block">
          <div className="min-w-0 flex-1 space-y-2">
            <Label htmlFor="search" className="@max-7xl:sr-only">
              Buscar
            </Label>
            <Input
              id="search"
              placeholder="Buscar por título o descripción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            className="shrink-0 @7xl:hidden"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            aria-controls="properties-filters-panel"
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filtros
            {activeCount > 0 && <Badge className="ml-2 h-5 min-w-5 px-1.5">{activeCount}</Badge>}
            <ChevronDown className={cn("ml-1 h-4 w-4 transition-transform", open && "rotate-180")} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 @7xl:hidden"
            onClick={clearFilters}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Limpiar filtros</span>
          </Button>
        </div>

        <div
          id="properties-filters-panel"
          className={cn(
            "order-3 w-full grid-cols-1 gap-4 @md:grid-cols-2 @2xl:grid-cols-3 @4xl:grid-cols-4 [&>div]:min-w-0",
            open ? "grid" : "hidden",
            "@7xl:flex @7xl:flex-col",
          )}
        >
        <div className="space-y-2">
          <Label htmlFor="propertyType">Tipo de Propiedad</Label>
          <Select value={propertyType} onValueChange={setPropertyType}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {propertyTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="transactionType">Transacción</Label>
          <Select value={transactionType} onValueChange={setTransactionType}>
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas</SelectItem>
              <SelectItem value="VENTA">Venta</SelectItem>
              <SelectItem value="ALQUILER">Alquiler</SelectItem>
              <SelectItem value="VENTA_ALQUILER">Venta/Alquiler</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Estado</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos</SelectItem>
              <SelectItem value="ACTIVO">Activo</SelectItem>
              <SelectItem value="RESERVADO">Reservado</SelectItem>
              <SelectItem value="VENDIDO">Vendido</SelectItem>
              <SelectItem value="ALQUILADO">Alquilado</SelectItem>
              <SelectItem value="EN_REVISION">En Revisión</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">Ciudad</Label>
          <Combobox
            options={[
              { value: "all", label: "Todas las ciudades" },
              ...cities.map((c) => ({ value: c.id, label: c.name })),
            ]}
            value={city}
            onValueChange={setCity}
            placeholder="Todas las ciudades"
            searchPlaceholder="Buscar ciudad..."
            emptyText="No se encontraron ciudades."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="neighborhood">Barrio</Label>
          <Combobox
            options={[
              { value: "all", label: "Todos los barrios" },
              ...filteredNeighborhoods.map((n) => ({ value: n.id, label: n.name })),
            ]}
            value={neighborhood}
            onValueChange={setNeighborhood}
            placeholder="Todos los barrios"
            searchPlaceholder="Buscar barrio..."
            emptyText="No se encontraron barrios."
          />
        </div>

        <div className="space-y-2">
          <Label>Rango de Precio</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Mín"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              min="0"
            />
            <Input
              type="number"
              placeholder="Máx"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              min="0"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bedrooms">Habitaciones</Label>
          <Select value={bedrooms} onValueChange={setBedrooms}>
            <SelectTrigger>
              <SelectValue placeholder="Cualquiera" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Cualquiera">Cualquiera</SelectItem>
              <SelectItem value="1">1+</SelectItem>
              <SelectItem value="2">2+</SelectItem>
              <SelectItem value="3">3+</SelectItem>
              <SelectItem value="4">4+</SelectItem>
              <SelectItem value="5">5+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bathrooms">Baños</Label>
          <Select value={bathrooms} onValueChange={setBathrooms}>
            <SelectTrigger>
              <SelectValue placeholder="Cualquiera" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Cualquiera">Cualquiera</SelectItem>
              <SelectItem value="1">1+</SelectItem>
              <SelectItem value="2">2+</SelectItem>
              <SelectItem value="3">3+</SelectItem>
              <SelectItem value="4">4+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="updatedBy">Actualizada por</Label>
          <Select value={updatedBy} onValueChange={setUpdatedBy}>
            <SelectTrigger>
              <SelectValue placeholder="Todos los usuarios" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los usuarios</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={applyFilters} className="w-full @md:col-span-full">
          Aplicar Filtros
        </Button>
        </div>
      </CardContent>
    </Card>
  )
}
