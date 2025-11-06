# Solución: Visualización de Desafíos y Entregas

## Problema Reportado
El usuario reportó dos problemas críticos:
1. **Los usuarios no pueden ver los desafíos** de un hackathon
2. **Los usuarios no pueden subir entregas** para los desafíos

## Soluciones Implementadas

### 1. Visualización de Desafíos en Hackathon ✅

**Archivo modificado:** `frontend/src/app/hackathones/[id]/page.tsx`

#### Cambios realizados:

**A. Imports agregados:**
```typescript
import { challengeService } from '@/services/challenge.service';
import { Challenge } from '@/types/challenge';
import { Target, FileText } from 'lucide-react';
```

**B. Estado agregado:**
```typescript
const [categories, setCategories] = useState<any[]>([]);
const [categoriesWithChallenges, setCategoriesWithChallenges] = useState<Map<string, Challenge[]>>(new Map());
```

**C. Función para cargar categorías y desafíos:**
```typescript
const loadCategoriesAndChallenges = async (hackathonId: string) => {
  // Cargar categorías del hackathon
  const response = await fetch(
    `${API_URL}/categories/hackathon/${hackathonId}`
  );

  if (response.ok) {
    const categoriesData = await response.json();
    setCategories(categoriesData);

    // Cargar desafíos para cada categoría
    const challengesMap = new Map<string, Challenge[]>();
    for (const category of categoriesData) {
      const challenges = await challengeService.getByCategory(category.id);
      if (challenges.length > 0) {
        challengesMap.set(category.id, challenges);
      }
    }
    setCategoriesWithChallenges(challengesMap);
  }
};
```

**D. Sección visual de desafíos:**
```tsx
{/* Desafíos del Hackathon */}
{categories.length > 0 && categoriesWithChallenges.size > 0 && (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
      <Target className="h-6 w-6 text-purple-600" />
      Desafíos
    </h2>

    <div className="space-y-6">
      {categories.map((category) => {
        const challenges = categoriesWithChallenges.get(category.id);
        if (!challenges || challenges.length === 0) return null;

        return (
          <div key={category.id} className="border-l-4 border-purple-500 pl-4">
            <h3>{category.nombre}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {challenges.map((challenge) => (
                <Link href={`/desafios/${challenge.id}`}>
                  {/* Card del desafío con: */}
                  {/* - Título */}
                  {/* - Nivel de dificultad */}
                  {/* - Descripción */}
                  {/* - Puntos */}
                  {/* - Fecha límite */}
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  </div>
)}
```

#### Características de la visualización:
- ✅ Muestra desafíos agrupados por categoría (Programación, IA, Análisis de Datos, etc.)
- ✅ Cards clickeables que llevan al detalle del desafío
- ✅ Muestra nivel de dificultad con colores:
  - Verde: Fácil
  - Amarillo: Medio
  - Rojo: Difícil
- ✅ Muestra puntos del desafío
- ✅ Muestra fecha límite de entrega
- ✅ Diseño responsivo (2 columnas en desktop, 1 en mobile)

---

### 2. Funcionalidad de Subir Entregas ✅

#### A. Botón en Página de Desafío

**Archivo modificado:** `frontend/src/app/desafios/[id]/page.tsx`

**Cambio realizado:**
```tsx
// ANTES: Botón sin funcionalidad
<button>
  <Upload className="h-5 w-5" />
  Enviar Solución
</button>

// DESPUÉS: Link funcional a página de nueva entrega
<Link href={`/desafios/${challenge.id}/nueva-entrega`}>
  <Upload className="h-5 w-5" />
  Enviar Solución
</Link>
```

**Condición de visualización:**
```typescript
const canSubmitSolution =
  user?.role === 'CAMPISTA' &&
  challenge?.estado === ChallengeStatus.PUBLISHED;
```

#### B. Nueva Página: Subir Entrega

**Archivo creado:** `frontend/src/app/desafios/[id]/nueva-entrega/page.tsx`

**Características completas:**

1. **Validaciones de acceso:**
   - Solo usuarios autenticados
   - Solo rol CAMPISTA
   - Usuario debe pertenecer al menos a un equipo

2. **Formulario de entrega:**
   - **Selección de equipo:** Dropdown con todos los equipos del usuario
   - **Subida de archivo:** Drag & drop o click para seleccionar PDF
   - **Observaciones:** Textarea opcional para comentarios

3. **Validaciones de archivo:**
   - Solo archivos PDF
   - Tamaño máximo: 10MB
   - Visualización del nombre y tamaño del archivo seleccionado

4. **Proceso de envío:**
   ```typescript
   // 1. Subir archivo PDF al servidor
   const uploadFormData = new FormData();
   uploadFormData.append('file', selectedFile);
   const uploadResponse = await fetch('/upload/pdf', {
     method: 'POST',
     body: uploadFormData,
   });
   const { url: pdfUrl } = await uploadResponse.json();

   // 2. Crear submission con la URL del PDF
   const submissionData = {
     challengeId: challenge.id,
     teamId: formData.teamId,
     urlArchivo: pdfUrl,
     observaciones: formData.observaciones,
   };
   await submissionService.create(submissionData, token);
   ```

5. **Manejo de casos especiales:**
   - **Sin equipos:** Muestra alerta con botón para crear equipo
   - **Un solo equipo:** Pre-selecciona automáticamente
   - **Múltiples equipos:** Usuario elige el equipo

6. **Feedback visual:**
   - Loading states durante carga de datos
   - Loading state durante envío
   - Toast notifications para éxito/error
   - Redirección a página del desafío después del envío

---

## Flujo Completo de Usuario

### 1. Ver Hackathon y Desafíos
```
Usuario → Hackathones → [Selecciona uno] → Ve lista de desafíos agrupados por categoría
```

### 2. Ver Detalle de Desafío
```
Usuario → Click en desafío → Ve información completa:
  - Descripción
  - Criterios de evaluación
  - Recursos
  - Entregables
  - Fecha límite
  - PDF descargable (si existe)
```

### 3. Enviar Solución
```
Usuario (CAMPISTA) → Click "Enviar Solución" → Página de nueva entrega:
  1. Selecciona equipo
  2. Sube archivo PDF (drag & drop o click)
  3. Agrega observaciones (opcional)
  4. Click "Enviar Entrega"
  ↓
Sistema:
  1. Valida archivo (tipo, tamaño)
  2. Sube PDF al servidor
  3. Crea registro de submission
  4. Notifica éxito
  5. Redirige a página del desafío
```

---

## API Endpoints Utilizados

| Método | Ruta | Descripción | Usado por |
|--------|------|-------------|-----------|
| GET | `/categories/hackathon/:id` | Obtener categorías del hackathon | Página hackathon |
| GET | `/challenges/category/:categoryId` | Obtener desafíos de categoría | Página hackathon |
| GET | `/challenges/:id` | Obtener detalle de desafío | Página desafío |
| POST | `/upload/pdf` | Subir archivo PDF | Nueva entrega |
| POST | `/submissions` | Crear nueva entrega | Nueva entrega |
| GET | `/teams` | Obtener equipos del usuario | Nueva entrega |

---

## Archivos Modificados/Creados

### Frontend
| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `frontend/src/app/hackathones/[id]/page.tsx` | Modificado | Agregada sección de desafíos |
| `frontend/src/app/desafios/[id]/page.tsx` | Modificado | Botón de entrega ahora funcional |
| `frontend/src/app/desafios/[id]/nueva-entrega/page.tsx` | **CREADO** | Página completa para subir entregas |

### Servicios (Sin cambios - ya existían)
- ✅ `frontend/src/services/challenge.service.ts` - Ya tiene método `getByCategory()`
- ✅ `frontend/src/services/submission.service.ts` - Ya tiene método `create()`
- ✅ `frontend/src/services/team.service.ts` - Ya tiene método `getAll()`

### Backend (Sin cambios - endpoints ya existían)
- ✅ `/api/challenges/category/:categoryId` - Ya implementado
- ✅ `/api/submissions` POST - Ya implementado
- ✅ `/api/upload/pdf` POST - Ya implementado

---

## Validaciones Implementadas

### Frontend
1. ✅ Usuario autenticado
2. ✅ Rol CAMPISTA para subir entregas
3. ✅ Usuario debe pertenecer a un equipo
4. ✅ Archivo debe ser PDF
5. ✅ Tamaño máximo 10MB
6. ✅ Equipo seleccionado obligatorio

### Backend (Ya existentes)
1. ✅ Autenticación JWT
2. ✅ Validación de permisos por rol
3. ✅ Validación de que el usuario pertenece al equipo
4. ✅ Validación de que el desafío está publicado
5. ✅ Validación de tipo de archivo
6. ✅ Un equipo solo puede tener una entrega por desafío

---

## Casos de Uso Cubiertos

### ✅ Usuario sin equipo
- Muestra alerta informativa
- Botón para crear equipo
- No puede enviar entrega

### ✅ Usuario con un equipo
- Equipo pre-seleccionado automáticamente
- Campo deshabilitado
- Puede enviar entrega directamente

### ✅ Usuario con múltiples equipos
- Dropdown con todos sus equipos
- Usuario elige con cuál equipo enviar
- Puede enviar entrega por equipo

### ✅ Desafío no publicado
- Botón "Enviar Solución" no aparece
- Solo organizadores pueden verlo

### ✅ Desafío publicado
- Botón "Enviar Solución" visible para campistas
- Redirect a página de nueva entrega

---

## Screenshots de Flujo (Conceptual)

```
┌─────────────────────────────────────────┐
│  PÁGINA HACKATHON                       │
│  ┌────────────────────────────────────┐ │
│  │ Información del Hackathon          │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │ 📌 DESAFÍOS                        │ │
│  │                                    │ │
│  │ Categoría: Programación            │ │
│  │ ┌──────────┐  ┌──────────┐       │ │
│  │ │Desafío 1 │  │Desafío 2 │       │ │
│  │ │[MEDIO]   │  │[FÁCIL]   │       │ │
│  │ │100 pts   │  │50 pts    │       │ │
│  │ └──────────┘  └──────────┘       │ │
│  │                                    │ │
│  │ Categoría: Inteligencia Artificial │ │
│  │ ┌──────────┐                      │ │
│  │ │Desafío 3 │                      │ │
│  │ │[DIFÍCIL] │                      │ │
│  │ │150 pts   │                      │ │
│  │ └──────────┘                      │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
            ↓ Click en desafío
┌─────────────────────────────────────────┐
│  DETALLE DEL DESAFÍO                    │
│  ┌────────────────────────────────────┐ │
│  │ Título: Crear API REST             │ │
│  │ Dificultad: [MEDIO]                │ │
│  │ Puntos: 100                        │ │
│  │ Fecha límite: 15/11/2025           │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │ Descripción completa...            │ │
│  │ Criterios de evaluación...         │ │
│  │ Recursos disponibles...            │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │ [📤 Enviar Solución]               │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
            ↓ Click en Enviar Solución
┌─────────────────────────────────────────┐
│  NUEVA ENTREGA                          │
│  ┌────────────────────────────────────┐ │
│  │ Equipo: [Mi Equipo ▼]             │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │ 📄 Arrastrar PDF aquí              │ │
│  │    o click para seleccionar        │ │
│  │                                    │ │
│  │  ✓ solucion.pdf (2.5 MB)          │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │ Observaciones:                     │ │
│  │ [________________________]         │ │
│  │ [________________________]         │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │ [Cancelar]  [Enviar Entrega]      │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## Testing Recomendado

### 1. Ver desafíos
- [ ] Navegar a un hackathon con desafíos
- [ ] Verificar que se muestran agrupados por categoría
- [ ] Click en un desafío lleva a su detalle

### 2. Subir entrega (Usuario con equipo)
- [ ] Login como CAMPISTA
- [ ] Navegar a desafío publicado
- [ ] Click en "Enviar Solución"
- [ ] Seleccionar equipo
- [ ] Subir PDF válido
- [ ] Agregar observaciones
- [ ] Enviar entrega
- [ ] Verificar redirección y toast de éxito

### 3. Sin equipo
- [ ] Login como CAMPISTA sin equipos
- [ ] Navegar a desafío publicado
- [ ] Click en "Enviar Solución"
- [ ] Ver alerta de "no tienes equipos"
- [ ] Click en "Crear Equipo"

### 4. Validaciones
- [ ] Intentar subir archivo que no es PDF → Error
- [ ] Intentar subir archivo > 10MB → Error
- [ ] Intentar enviar sin seleccionar equipo → Error
- [ ] Intentar enviar sin archivo → Error

---

## Mejoras Futuras (Opcionales)

1. **Filtros de desafíos**
   - Por dificultad
   - Por puntos
   - Por fecha límite

2. **Vista previa del PDF**
   - Antes de enviar
   - Usando PDF.js

3. **Edición de entregas**
   - Permitir re-enviar si está en DRAFT
   - Historial de versiones

4. **Notificaciones**
   - Email cuando se envía entrega
   - Push notifications para cambios de estado

5. **Dashboard de entregas**
   - Ver todas mis entregas
   - Estado de cada una
   - Puntaje obtenido
