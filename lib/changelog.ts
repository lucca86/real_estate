export type ChangeType = "nuevo" | "mejora" | "correccion"

export interface ChangeItem {
  type: ChangeType
  text: string
}

export interface ChangelogEntry {
  version: string
  date: string
  title: string
  changes: ChangeItem[]
}

export const CHANGE_TYPE_LABELS: Record<ChangeType, string> = {
  nuevo: "Nuevo",
  mejora: "Mejora",
  correccion: "Corrección",
}

/**
 * Historial de versiones, de la más reciente a la más antigua.
 * Al subir la versión en package.json, agregar aquí una entrada nueva al inicio.
 */
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.5.0",
    date: "2026-10-23",
    title: "Sección \"Lo nuevo\"",
    changes: [
      {
        type: "nuevo",
        text: "Nueva ventana \"Lo nuevo\" con la versión actual y el historial de modificaciones de la aplicación.",
      },
      {
        type: "nuevo",
        text: "Acceso rápido desde la etiqueta de versión y desde el botón de novedades en el encabezado.",
      },
    ],
  },
  {
    version: "1.4.0",
    date: "2026-10-23",
    title: "Menú lateral contraíble",
    changes: [
      {
        type: "nuevo",
        text: "El menú lateral se puede contraer para dejar solo los iconos, con un tooltip al pasar el cursor.",
      },
      {
        type: "mejora",
        text: "El menú contraído no muestra barras de desplazamiento y el contenido principal aprovecha el espacio liberado.",
      },
      {
        type: "mejora",
        text: "El botón para contraer y expandir el menú está disponible en el encabezado.",
      },
    ],
  },
  {
    version: "1.3.2",
    date: "2026-10-22",
    title: "Ajustes generales",
    changes: [
      {
        type: "correccion",
        text: "Correcciones menores de estabilidad y de visualización en el listado de propiedades.",
      },
    ],
  },
]
