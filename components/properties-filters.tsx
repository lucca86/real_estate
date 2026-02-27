"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Combobox } from "@/components/ui/combobox"
import { X } from "lucide-react"
import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"

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
  const [createdBy, setCreatedBy] = useState(searchParams.get("createdBy") ?? "all")
  const [updatedBy, setUpdatedBy] = useState(searchParams.get("updatedBy") ?? "all")

  const [cities, setCities] = useState<City[]>([])
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([])
  const [filteredNeighborhoods, setFilteredNeighborhoods] = useState<Neighborhood[]>([])
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([])
  const [users, setUsers] = useState<User[]>([])

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
    if (createdBy && createdBy !== "all") params.set("createdBy", createdBy)
    if (updatedBy && updatedBy !== "all") params.set("updatedBy", updatedBy)

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
    setCreatedBy("all")
    setUpdatedBy("all")
    router.push("/properties")
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Filtros</CardTitle>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-4 w-4" />
            Limpiar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-6">
        <div className="flex items-center justify-between space-x-2">
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

        <div className="flex items-center justify-between space-x-2">
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

        <div className="space-y-2">
          <Label htmlFor="search">Buscar</Label>
          <Input
            id="search"
            placeholder="Título, descripción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          />
        </div>

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
          <Label htmlFor="createdBy">Creada por</Label>
          <Select value={createdBy} onValueChange={setCreatedBy}>
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

        <div className="space-y-2">
          <Label htmlFor="updatedBy">Modificada por</Label>
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

        <Button onClick={applyFilters} className="w-full">
          Aplicar Filtros
        </Button>
      </CardContent>
    </Card>
  )
}
