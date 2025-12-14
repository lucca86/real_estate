// Property type with relations
export interface PropertyWithDetails {
  id: string
  title: string
  description: string
  address: string
  latitude: number | null
  longitude: number | null
  bedrooms: number | null
  bathrooms: number | null
  parkingSpaces: number | null
  area: number | null
  lotSize: number | null
  frontSize: number | null
  depthSize: number | null
  yearBuilt: number | null
  transactionType: string | null
  rentalPeriod: string | null
  zipCode: string | null
  price: number | null
  rentalPrice: number | null
  priceCurrency: string | null
  pricePerM2: number | null
  propertyLabel: string | null
  virtualTour: string | null
  syncToWordpress: boolean
  status: string
  createdAt: string
  updatedAt: string
  owner?: {
    id: string
    name: string
  }
  propertyType?: {
    id: string
    name: string
  }
  city?: {
    id: string
    name: string
  }
  province?: {
    id: string
    name: string
  }
  country?: {
    id: string
    name: string
  }
  neighborhood?: {
    id: string
    name: string
  }
}
