/**
 * WordPress Currency Display Script
 *
 * Este script modifica automáticamente la visualización de precios en Estatik
 * para incluir el símbolo de moneda (USD o ARS) basado en los custom fields.
 *
 * Instalación:
 * 1. Copiar este archivo a: wp-content/themes/tu-tema/js/currency-display.js
 * 2. Encolar el script en functions.php (ver instrucciones abajo)
 */

;(() => {
  // Esperar a que el DOM esté completamente cargado
  function initCurrencyDisplay() {
    // Función para formatear precio con moneda
    function formatPriceWithCurrency(priceElement) {
      if (!priceElement || priceElement.dataset.currencyProcessed) {
        return
      }

      // Obtener el precio numérico
      const priceText = priceElement.textContent || priceElement.innerText
      const numericPrice = priceText.replace(/[^0-9.,]/g, "").replace(",", ".")

      // Buscar el campo de moneda en el elemento padre
      const propertyCard = priceElement.closest(".es-property, article, .property-item, .es-property-archive__item")

      if (!propertyCard) return

      // Buscar meta field de moneda
      let currency = "USD" // Default
      const currencyField = propertyCard.querySelector("[data-currency]")

      if (currencyField) {
        currency = currencyField.dataset.currency
      } else {
        // Buscar en custom fields si están expuestos
        const customFields = propertyCard.querySelectorAll(".es-property__meta-item")
        customFields.forEach((field) => {
          const label = field.querySelector(".es-property__meta-label")
          if (label && label.textContent.includes("Currency")) {
            const value = field.querySelector(".es-property__meta-value")
            if (value) currency = value.textContent.trim()
          }
        })
      }

      // Determinar símbolo y formato
      let symbol = "$"
      let currencyCode = "USD"

      if (currency === "ARS" || currency === "Pesos" || currency.toLowerCase().includes("peso")) {
        symbol = "$"
        currencyCode = "ARS"
      } else if (currency === "USD" || currency === "Dólares" || currency.toLowerCase().includes("dólar")) {
        symbol = "USD"
        currencyCode = "USD"
      }

      // Crear el HTML con moneda
      const formattedPrice = Number.parseFloat(numericPrice).toLocaleString("es-AR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })

      // Badge de moneda con estilo
      const currencyBadge = `<span class="property-currency-badge property-currency-${currencyCode.toLowerCase()}" style="
        display: inline-block;
        background: ${currencyCode === "USD" ? "#10b981" : "#f59e0b"};
        color: white;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.75em;
        font-weight: 600;
        margin-right: 6px;
        vertical-align: middle;
      ">${currencyCode}</span>`

      // Actualizar el contenido
      priceElement.innerHTML = `${currencyBadge}${symbol}${formattedPrice}`
      priceElement.dataset.currencyProcessed = "true"
    }

    // Función para procesar todos los precios
    function processAllPrices() {
      // Selectores comunes de Estatik para precios
      const priceSelectors = [
        ".es-property__price",
        ".es-property-price",
        ".property-price",
        ".es-price",
        ".price-value",
        '[class*="price"]',
      ]

      priceSelectors.forEach((selector) => {
        const priceElements = document.querySelectorAll(selector)
        priceElements.forEach(formatPriceWithCurrency)
      })
    }

    // Ejecutar inmediatamente
    processAllPrices()

    // Observar cambios en el DOM para contenido dinámico
    const observer = new MutationObserver((mutations) => {
      let shouldProcess = false

      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (
              node.nodeType === 1 &&
              (node.classList?.contains("es-property") || node.querySelector?.(".es-property__price"))
            ) {
              shouldProcess = true
            }
          })
        }
      })

      if (shouldProcess) {
        processAllPrices()
      }
    })

    // Configurar el observer
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    // Re-procesar cuando se cargan nuevas propiedades (AJAX)
    document.addEventListener("estatik:properties_loaded", processAllPrices)
    document.addEventListener("estatik:property_updated", processAllPrices)
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCurrencyDisplay)
  } else {
    initCurrencyDisplay()
  }
})()
