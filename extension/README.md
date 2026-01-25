# Ángulos Oblicuos - Chrome Extension

Captura texto de cualquier página web y añádelo a tu reservorio de ideas.

## Instalación

1. **Convertir iconos**: Chrome requiere iconos PNG. Convierte los SVGs en `icons/` a PNG:
   - `icon16.svg` → `icon16.png` (16x16)
   - `icon48.svg` → `icon48.png` (48x48)
   - `icon128.svg` → `icon128.png` (128x128)

   Puedes usar cualquier herramienta como Inkscape, ImageMagick, o un conversor online.

2. **Cargar en Chrome**:
   - Abre `chrome://extensions/`
   - Activa "Modo desarrollador" (esquina superior derecha)
   - Clic en "Cargar extensión sin empaquetar"
   - Selecciona esta carpeta (`extension/`)

3. **Configurar API URL** (si no usas localhost):
   - Clic en el icono de la extensión
   - Cambia la URL de la API en la configuración
   - Clic en "guardar"

## Uso

1. Selecciona cualquier texto en una página web
2. Clic derecho → "Añadir al reservorio"
3. El badge mostrará ✓ (éxito) o ! (error)

## Requisitos

- API de Ángulos Oblicuos ejecutándose (por defecto en `http://localhost:8000`)
- La API debe tener CORS configurado para permitir peticiones desde la extensión
