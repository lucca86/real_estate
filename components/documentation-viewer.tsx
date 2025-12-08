"use client"

import { cn } from "@/lib/utils"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Book,
  Building2,
  Users,
  Calendar,
  Settings,
  Map,
  Tag,
  Home,
  UserCircle,
  BookUser,
  Wrench,
  Shield,
  MapPin,
  BarChart3,
  FileText,
} from "lucide-react"

interface DocumentationViewerProps {
  userPermissions: {
    canViewAll: boolean
    canManageProperties: boolean
    canManageClients: boolean
    canManageAppointments: boolean
    canManageUsers: boolean
    canManageSettings: boolean
  }
  userRole: string
}

export function DocumentationViewer({ userPermissions, userRole }: DocumentationViewerProps) {
  const [activeSection, setActiveSection] = useState("intro")

  const sections = [
    {
      id: "intro",
      title: "Introducción",
      icon: Book,
      visible: true,
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Bienvenido a Gestión Inmobiliaria RE</h2>
          <p className="leading-relaxed">
            Gestión Inmobiliaria RE es un sistema integral diseñado para la administración completa de negocios
            inmobiliarios. Este sistema permite gestionar propiedades, clientes, propietarios, citas, servicios y mucho
            más desde una única plataforma.
          </p>

          <div className="my-6">
            <h3 className="mb-3 text-xl font-semibold">Características Principales</h3>
            <ul className="list-inside list-disc space-y-2 text-muted-foreground">
              <li>Gestión completa de propiedades con galería de imágenes</li>
              <li>Catálogo público de propiedades</li>
              <li>Sistema de citas y calendario integrado</li>
              <li>Gestión de clientes y propietarios</li>
              <li>Visualización de propiedades en mapa interactivo</li>
              <li>Sistema de permisos por roles</li>
              <li>Auditoría completa de acciones</li>
              <li>Gestión de servicios adicionales</li>
            </ul>
          </div>

          <div className="rounded-lg bg-muted p-4">
            <h4 className="mb-2 font-semibold">Tu Rol: {userRole}</h4>
            <p className="text-sm text-muted-foreground">
              {userRole === "ADMIN" &&
                "Como Administrador, tienes acceso completo a todas las funcionalidades del sistema."}
              {userRole === "SUPERVISOR" &&
                "Como Supervisor, tienes acceso a la mayoría de funcionalidades excepto configuración avanzada."}
              {userRole === "VENDEDOR" &&
                "Como Agente Inmobiliario, tienes acceso a propiedades, clientes, citas y catálogo."}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "dashboard",
      title: "Dashboard",
      icon: BarChart3,
      visible: true,
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Panel Principal (Dashboard)</h2>
          <p className="leading-relaxed">
            El Dashboard es la página principal del sistema donde puedes ver un resumen de toda la información
            importante.
          </p>

          <h3 className="mt-6 text-xl font-semibold">Widgets Disponibles</h3>
          <div className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Estadísticas de Propiedades</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Visualiza el total de propiedades, propiedades disponibles, vendidas, alquiladas y en reserva.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Citas Próximas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Lista de citas programadas para los próximos días con clientes.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Actividad Reciente</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Registro de las últimas acciones realizadas en el sistema.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      ),
    },
    {
      id: "properties",
      title: "Propiedades",
      icon: Building2,
      visible: userPermissions.canViewAll || userPermissions.canManageProperties,
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Gestión de Propiedades</h2>
          <p className="leading-relaxed">
            El módulo de propiedades es el corazón del sistema. Aquí puedes administrar todas las propiedades de tu
            inventario.
          </p>

          <h3 className="mt-6 text-xl font-semibold">Funcionalidades</h3>
          <ul className="mt-3 list-inside list-disc space-y-2">
            <li>
              <strong>Crear Propiedad:</strong> Registra nuevas propiedades con información completa (título,
              descripción, precio, ubicación, características)
            </li>
            <li>
              <strong>Galería de Imágenes:</strong> Sube múltiples fotos de cada propiedad
            </li>
            <li>
              <strong>Estados:</strong> Disponible, Vendida, Alquilada, En Reserva
            </li>
            <li>
              <strong>Tipos de Operación:</strong> Venta, Alquiler, Venta/Alquiler
            </li>
            <li>
              <strong>Filtros Avanzados:</strong> Busca por tipo, precio, ubicación, estado
            </li>
            <li>
              <strong>Vista Detallada:</strong> Información completa con mapa de ubicación
            </li>
            <li>
              <strong>Edición:</strong> Modifica cualquier aspecto de la propiedad
            </li>
            {userPermissions.canManageProperties && (
              <li>
                <strong>Eliminación:</strong> Elimina propiedades del sistema
              </li>
            )}
          </ul>

          <h3 className="mt-6 text-xl font-semibold">Campos de Propiedad</h3>
          <div className="mt-3 space-y-2 text-sm">
            <p>
              <strong>Información Básica:</strong> Título, descripción, tipo de propiedad, estado
            </p>
            <p>
              <strong>Ubicación:</strong> País, provincia, ciudad, barrio, dirección, código postal
            </p>
            <p>
              <strong>Características:</strong> Habitaciones, baños, superficie total y cubierta, antigüedad
            </p>
            <p>
              <strong>Precio:</strong> Precio de venta/alquiler, gastos comunes, impuestos
            </p>
            <p>
              <strong>Adicionales:</strong> Garage, patio, piscina, balcón, y más comodidades
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "property-types",
      title: "Tipos de Propiedad",
      icon: Tag,
      visible: userPermissions.canViewAll,
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Tipos de Propiedad</h2>
          <p className="leading-relaxed">
            Gestiona las categorías de propiedades disponibles en el sistema (Casa, Apartamento, Terreno, etc.).
          </p>

          <h3 className="mt-6 text-xl font-semibold">Acciones Disponibles</h3>
          <ul className="mt-3 list-inside list-disc space-y-2">
            <li>Crear nuevos tipos de propiedad personalizados</li>
            <li>Editar tipos existentes</li>
            <li>Activar/Desactivar tipos</li>
            <li>Visualizar propiedades asociadas a cada tipo</li>
          </ul>

          <div className="mt-6 rounded-lg bg-muted p-4">
            <p className="text-sm">
              <strong>Nota:</strong> Los tipos de propiedad se utilizan en los filtros de búsqueda y en el catálogo
              público.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "catalog",
      title: "Catálogo",
      icon: FileText,
      visible: true,
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Catálogo de Propiedades</h2>
          <p className="leading-relaxed">
            El catálogo es una vista pública de las propiedades disponibles, diseñada para que los clientes puedan
            explorar el inventario.
          </p>

          <h3 className="mt-6 text-xl font-semibold">Características</h3>
          <ul className="mt-3 list-inside list-disc space-y-2">
            <li>Vista en cuadrícula con imágenes destacadas</li>
            <li>Filtros por tipo, precio, ubicación</li>
            <li>Búsqueda por texto</li>
            <li>Vista detallada de cada propiedad</li>
            <li>Información de contacto para consultas</li>
          </ul>

          <div className="mt-6 rounded-lg border p-4">
            <h4 className="mb-2 font-semibold">Solo Propiedades Disponibles</h4>
            <p className="text-sm text-muted-foreground">
              El catálogo muestra únicamente las propiedades con estado "Disponible" para evitar confusiones.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "map",
      title: "Mapa",
      icon: Map,
      visible: true,
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Mapa de Propiedades</h2>
          <p className="leading-relaxed">
            Visualiza todas las propiedades en un mapa interactivo para una mejor comprensión geográfica de tu
            inventario.
          </p>

          <h3 className="mt-6 text-xl font-semibold">Funcionalidades</h3>
          <ul className="mt-3 list-inside list-disc space-y-2">
            <li>Marcadores en el mapa para cada propiedad</li>
            <li>Información al hacer clic en un marcador</li>
            <li>Filtros por tipo y estado</li>
            <li>Navegación fluida y zoom</li>
            <li>Agrupación de propiedades cercanas</li>
          </ul>

          <div className="mt-6 rounded-lg bg-muted p-4">
            <p className="text-sm">
              <strong>Tip:</strong> Usa el mapa para identificar áreas con alta concentración de propiedades o descubrir
              zonas sin cobertura.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "owners",
      title: "Propietarios",
      icon: Home,
      visible: userPermissions.canViewAll || userPermissions.canManageClients,
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Gestión de Propietarios</h2>
          <p className="leading-relaxed">
            Administra la información de los propietarios de las propiedades en tu cartera.
          </p>

          <h3 className="mt-6 text-xl font-semibold">Información del Propietario</h3>
          <ul className="mt-3 list-inside list-disc space-y-2">
            <li>Datos personales: Nombre, DNI, email, teléfono</li>
            <li>Dirección completa</li>
            <li>Notas adicionales</li>
            <li>Lista de propiedades asociadas</li>
          </ul>

          <h3 className="mt-6 text-xl font-semibold">Formulario Público</h3>
          <p className="mt-2 leading-relaxed">
            Los propietarios pueden registrarse desde un formulario público para ofrecer sus propiedades.
          </p>
          <div className="mt-3 rounded-lg border p-4">
            <p className="text-sm">
              <strong>Ruta:</strong> /propietarios/formulario
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Este formulario captura información básica del propietario y su propiedad para contacto posterior.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "clients",
      title: "Clientes",
      icon: UserCircle,
      visible: userPermissions.canViewAll || userPermissions.canManageClients,
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Gestión de Clientes</h2>
          <p className="leading-relaxed">
            Administra la base de datos de clientes interesados en comprar o alquilar propiedades.
          </p>

          <h3 className="mt-6 text-xl font-semibold">Información del Cliente</h3>
          <ul className="mt-3 list-inside list-disc space-y-2">
            <li>Datos personales completos</li>
            <li>Preferencias de búsqueda</li>
            <li>Historial de interacciones</li>
            <li>Estado del cliente (activo, inactivo)</li>
            <li>Notas y observaciones</li>
          </ul>

          <h3 className="mt-6 text-xl font-semibold">Seguimiento</h3>
          <p className="mt-2 leading-relaxed">
            Mantén un registro de todas las propiedades mostradas a cada cliente y el estado de cada negociación.
          </p>
        </div>
      ),
    },
    {
      id: "contacts",
      title: "Agenda de Contactos",
      icon: BookUser,
      visible: true,
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Agenda de Contactos</h2>
          <p className="leading-relaxed">
            Centraliza todos tus contactos profesionales: proveedores, colaboradores, otros agentes, etc.
          </p>

          <h3 className="mt-6 text-xl font-semibold">Tipos de Contactos</h3>
          <ul className="mt-3 list-inside list-disc space-y-2">
            <li>Proveedores de servicios</li>
            <li>Colaboradores externos</li>
            <li>Otros agentes inmobiliarios</li>
            <li>Contactos profesionales</li>
          </ul>

          <div className="mt-6 rounded-lg bg-muted p-4">
            <p className="text-sm">
              <strong>Diferencia:</strong> Los contactos no son clientes ni propietarios, sino personas de tu red
              profesional.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "services",
      title: "Servicios",
      icon: Wrench,
      visible: userPermissions.canViewAll,
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Gestión de Servicios</h2>
          <p className="leading-relaxed">
            Administra los servicios adicionales que ofreces: tasaciones, asesoramiento legal, fotografía profesional,
            etc.
          </p>

          <h3 className="mt-6 text-xl font-semibold">Información del Servicio</h3>
          <ul className="mt-3 list-inside list-disc space-y-2">
            <li>Nombre y descripción del servicio</li>
            <li>Precio</li>
            <li>Duración estimada</li>
            <li>Estado (activo/inactivo)</li>
          </ul>

          <div className="mt-6 rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">
              Los servicios pueden vincularse a citas para ofrecer servicios específicos a los clientes.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "appointments",
      title: "Citas",
      icon: Calendar,
      visible: userPermissions.canViewAll || userPermissions.canManageAppointments,
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Gestión de Citas</h2>
          <p className="leading-relaxed">
            Organiza y gestiona todas las citas con clientes: visitas a propiedades, reuniones, consultas, etc.
          </p>

          <h3 className="mt-6 text-xl font-semibold">Calendario</h3>
          <p className="mt-2 leading-relaxed">
            Vista mensual con todas las citas agendadas. Las citas se muestran en el día correspondiente con colores
            según el estado.
          </p>

          <h3 className="mt-6 text-xl font-semibold">Información de la Cita</h3>
          <ul className="mt-3 list-inside list-disc space-y-2">
            <li>Cliente asociado</li>
            <li>Fecha y hora</li>
            <li>Propiedad (si aplica)</li>
            <li>Servicio (opcional)</li>
            <li>Estado: Programada, Completada, Cancelada</li>
            <li>Notas adicionales</li>
          </ul>

          <h3 className="mt-6 text-xl font-semibold">Próximas Citas</h3>
          <p className="mt-2 leading-relaxed">
            Debajo del calendario se muestra una lista de las próximas citas para tener una vista rápida de tus
            compromisos.
          </p>
        </div>
      ),
    },
    {
      id: "users",
      title: "Usuarios",
      icon: Users,
      visible: userPermissions.canViewAll || userPermissions.canManageUsers,
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
          <p className="leading-relaxed">
            Administra los usuarios que tienen acceso al sistema y sus roles correspondientes.
          </p>

          <h3 className="mt-6 text-xl font-semibold">Roles Disponibles</h3>
          <div className="mt-3 space-y-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  <Badge>ADMIN</Badge> Administrador
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Acceso total a todas las funcionalidades del sistema.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  <Badge variant="secondary">SUPERVISOR</Badge> Supervisor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Acceso a la mayoría de funcionalidades excepto configuración avanzada.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  <Badge variant="outline">VENDEDOR</Badge> Agente Inmobiliario
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Acceso a propiedades, clientes, citas y catálogo. Sin permisos de administración.
                </p>
              </CardContent>
            </Card>
          </div>

          <h3 className="mt-6 text-xl font-semibold">Crear Usuario</h3>
          <p className="mt-2 leading-relaxed">
            Al crear un usuario nuevo se requiere: nombre, email, contraseña y rol. El usuario recibirá sus credenciales
            para acceder al sistema.
          </p>
        </div>
      ),
    },
    {
      id: "locations",
      title: "Ubicaciones",
      icon: MapPin,
      visible: userPermissions.canViewAll,
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Gestión de Ubicaciones</h2>
          <p className="leading-relaxed">
            Administra la jerarquía de ubicaciones: países, provincias, ciudades y barrios.
          </p>

          <h3 className="mt-6 text-xl font-semibold">Estructura Jerárquica</h3>
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">1</Badge>
              <span>País</span>
            </div>
            <div className="ml-6 flex items-center gap-2">
              <Badge variant="outline">2</Badge>
              <span>Provincia/Estado</span>
            </div>
            <div className="ml-12 flex items-center gap-2">
              <Badge variant="outline">3</Badge>
              <span>Ciudad</span>
            </div>
            <div className="ml-18 flex items-center gap-2">
              <Badge variant="outline">4</Badge>
              <span>Barrio</span>
            </div>
          </div>

          <h3 className="mt-6 text-xl font-semibold">Uso en Propiedades</h3>
          <p className="mt-2 leading-relaxed">
            Al crear una propiedad, seleccionas la ubicación desde estos catálogos para mantener consistencia en los
            datos.
          </p>

          <div className="mt-6 rounded-lg bg-muted p-4">
            <p className="text-sm">
              <strong>Importante:</strong> Mantén actualizado el catálogo de ubicaciones para facilitar la búsqueda y
              filtrado de propiedades.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "settings",
      title: "Configuración",
      icon: Settings,
      visible: userPermissions.canManageSettings,
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Configuración del Sistema</h2>
          <p className="leading-relaxed">Panel de administración avanzada del sistema (solo para administradores).</p>

          <h3 className="mt-6 text-xl font-semibold">Secciones de Configuración</h3>
          <div className="mt-3 space-y-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  <Shield className="mb-1 inline h-4 w-4" /> Permisos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Administra los permisos de cada rol del sistema. Define qué acciones puede realizar cada tipo de
                  usuario.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  <FileText className="mb-1 inline h-4 w-4" /> Auditoría
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Registro completo de todas las acciones realizadas en el sistema: quién, qué, cuándo y desde dónde.
                </p>
              </CardContent>
            </Card>
          </div>

          <h3 className="mt-6 text-xl font-semibold">Auditoría del Sistema</h3>
          <p className="mt-2 leading-relaxed">
            Cada acción importante queda registrada: creación, edición, eliminación de registros. Incluye información
            del usuario, fecha, hora, IP y detalles de la acción.
          </p>

          <div className="mt-6 rounded-lg border-2 border-destructive/50 p-4">
            <p className="text-sm font-semibold text-destructive">Acceso Restringido</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Esta sección solo está disponible para usuarios con rol de Administrador.
            </p>
          </div>
        </div>
      ),
    },
  ]

  const visibleSections = sections.filter((section) => section.visible)

  return (
    <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
      {/* Navigation Sidebar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Índice</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <div className="space-y-1 p-4">
              {visibleSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
                    activeSection === section.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <section.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{section.title}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Content Area */}
      <Card>
        <CardContent className="p-6">
          <ScrollArea className="h-[600px] pr-4">
            {visibleSections.find((s) => s.id === activeSection)?.content}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
