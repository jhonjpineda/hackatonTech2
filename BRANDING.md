# Universidad del Cauca - Branding

Este documento describe la implementación de la identidad visual de la Universidad del Cauca en la plataforma HackatonTech2.

## Colores Implementados

### Colores Principales
- **Morado**: `#b64cff` (unicauca-purple) - Color primario de la marca
- **Cyan**: `#00ffff` (unicauca-cyan) - Color de acento
- **Lavanda**: `#9fa4ff` (unicauca-lavender) - Color secundario

### Colores de Fondo
- **Dark**: `#12013e` (unicauca-dark) - Fondo principal
- **Navy**: `#1d1d3e` (unicauca-navy) - Fondo de componentes

### Colores de Texto
- **Text Dark**: `#2b1f73` (unicauca-text-dark)
- **Text Darker**: `#312a72` (unicauca-text-darker)

## Tipografía

### Fuente Principal (Implementada)
- **Nunito Sans**: Usada para texto del cuerpo, botones y subtítulos
- Pesos: 300, 400, 600, 700
- Implementada desde Google Fonts

### Fuente Display (Pendiente)
- **Hey August**: Para títulos y textos destacados
- **PENDIENTE**: Necesita archivo de fuente

#### Cómo añadir Hey August

1. Obtener el archivo `HeyAugust.woff2`
2. Colocarlo en: `frontend/src/app/fonts/HeyAugust.woff2`
3. Descomentar las líneas en `frontend/src/app/layout.tsx`:

```typescript
import localFont from 'next/font/local';

const heyAugust = localFont({
  src: [
    {
      path: './fonts/HeyAugust.woff2',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-hey-august',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
});
```

4. Actualizar el body className:
```typescript
<body className={`${nunitoSans.variable} ${heyAugust.variable} font-sans`}>
```

## Archivos Modificados

### Configuración
- `frontend/tailwind.config.js` - Colores y fuentes configuradas
- `frontend/src/app/globals.css` - Variables CSS y estilos base
- `frontend/src/app/layout.tsx` - Configuración de fuentes

### Componentes Actualizados
- `frontend/src/components/layout/Sidebar.tsx` - Navegación con colores UniCauca
- `frontend/src/app/admin/page.tsx` - Panel de administración con branding

## Uso de Colores en Tailwind

Los colores están disponibles como clases de Tailwind:

```jsx
// Backgrounds
className="bg-unicauca-purple"
className="bg-unicauca-navy"
className="bg-unicauca-dark"

// Text
className="text-unicauca-cyan"
className="text-unicauca-lavender"

// Borders
className="border-unicauca-purple"

// Opacity variants
className="bg-unicauca-purple/20"
className="border-unicauca-lavender/30"
```

## Uso de Fuentes

```jsx
// Fuente principal (cuerpo)
className="font-sans"

// Fuente display (títulos) - usa Nunito Sans como fallback hasta que Hey August esté disponible
className="font-display"
```

## Notas

- La fuente Hey August actualmente usa Nunito Sans como fallback
- Los colores están integrados tanto en el sistema de colores personalizado (unicauca-*) como en las escalas primary/secondary para compatibilidad con componentes existentes
- El background del body está configurado a unicauca-dark por defecto
- Los títulos (h1-h6) usan automáticamente la fuente display
