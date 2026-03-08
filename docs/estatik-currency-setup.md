# Configuración de Monedas en Estatik

## Problema
Actualmente solo está configurada la moneda ARS (Pesos Argentinos) en Estatik, pero tenemos propiedades en:
- USD: 65 propiedades
- ARS: 4 propiedades  
- DOP: 3 propiedades

## Solución

### Paso 1: Agregar USD (Dólares) en Estatik

1. En WordPress, ir a **Estatik > Data Manager > Units & Formats**
2. En la sección "Configuración de moneda", hacer clic en **agregar nueva moneda**
3. Configurar USD:
   - **Código de moneda**: USD
   - **Firmar**: $
   - **Posición de la señal**: Antes de $100
   - **Separador de mil**: . (punto)
   - **Separador decimal**: , (coma)
   - **Decimal digits**: 0

### Paso 2: Agregar DOP (Pesos Dominicanos) en Estatik

1. En la misma sección, agregar otra moneda
2. Configurar DOP:
   - **Código de moneda**: DOP
   - **Firmar**: RD$
   - **Posición de la señal**: Antes de $100
   - **Separador de mil**: ,
   - **Separador decimal**: .
   - **Decimal digits**: 2

### Paso 3: Verificar el Campo de Moneda

El campo que usa Estatik para la moneda de cada propiedad es:
- **Meta key**: `es_property_price_currency`
- **Valores posibles**: USD, ARS, DOP

### Resultado Esperado

Después de configurar y ejecutar el código actualizado:
- Las propiedades con `currency: 'USD'` aparecerán con "$" (dólares)
- Las propiedades con `currency: 'ARS'` aparecerán con "$" (pesos argentinos)
- Las propiedades con `currency: 'DOP'` aparecerán con "RD$" (pesos dominicanos)

Estatik detectará automáticamente la moneda de cada propiedad y la formateará según la configuración.
