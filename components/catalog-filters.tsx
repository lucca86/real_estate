"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X } from "lucide-react"
import { useState } from "react"

export function CatalogFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [propertyType, setPropertyType] = useState(searchParams.get("propertyType") || "Todos")
  const [transactionType, setTransactionType] = useState(searchParams.get("transactionType") || "Todas")
  const [status, setStatus] = useState(searchParams.get("status") || "Todos")
  const [city, setCity] = useState(searchParams.get("city") || "")
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "")
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "")
  const [bedrooms, setBedrooms] = useState(searchParams.get("bedrooms") || "Cualquiera")
  const [bathrooms, setBathrooms] = useState(searchParams.get("bathrooms") || "Cualquiera")

  const applyFilters = () => {
    const params = new URLSearchParams()

    if (search) params.set("search", search)
    if (propertyType !== "Todos") params.set("propertyType", propertyType)
    if (transactionType !== "Todas") params.set("transactionType", transactionType)
    if (status !== "Todos") params.set("status", status)
    if (city) params.set("city", city)
    if (minPrice) params.set("minPrice", minPrice)
    if (maxPrice) params.set("maxPrice", maxPrice)
    if (bedrooms !== "Cualquiera") params.set("bedrooms", bedrooms)
    if (bathrooms !== "Cualquiera") params.set("bathrooms", bathrooms)

    router.push(`/catalog?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearch("")
    setPropertyType("Todos")
    setTransactionType("Todas")
    setStatus("Todos")
    setCity("")
    setMinPrice("")
    setMaxPrice("")
    setBedrooms("Cualquiera")
    setBathrooms("Cualquiera")
    router.push("/catalog")
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
      <CardContent className="space-y-4">
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
              <SelectItem value="Todos">Todos</SelectItem>
              <SelectItem value="CASA">Casa</SelectItem>
              <SelectItem value="APARTAMENTO">Apartamento</SelectItem>
              <SelectItem value="TERRENO">Terreno</SelectItem>
              <SelectItem value="LOCAL_COMERCIAL">Local Comercial</SelectItem>
              <SelectItem value="OFICINA">Oficina</SelectItem>
              <SelectItem value="BODEGA">Bodega</SelectItem>
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
          <Input id="city" placeholder="Ej: Santo Domingo" value={city} onChange={(e) => setCity(e.target.value)} />
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

        <Button onClick={applyFilters} className="w-full">
          Aplicar Filtros
        </Button>
      </CardContent>
    </Card>
  )
}
