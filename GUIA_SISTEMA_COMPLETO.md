# 🎯 Guía Completa del Sistema HackatonTech2

## 📋 Tabla de Contenidos
1. [Sistema de Retos](#sistema-de-retos)
2. [Sistema de Entregas](#sistema-de-entregas)
3. [Sistema de Evaluación](#sistema-de-evaluación)
4. [Tabla de Posiciones](#tabla-de-posiciones)
5. [Flujo Completo](#flujo-completo)

---

## 1️⃣ Sistema de Retos

### Crear Retos (Organizador)
**Ruta:** `/desafios/nuevo`

**Características:**
- **Porcentaje**: Cada reto debe tener un porcentaje del hackathon total
- **Validación automática**: El sistema verifica que la suma no exceda 100%
- **Campos requeridos:**
  - Título
  - Descripción
  - Porcentaje (0-100%)
  - Dificultad (Fácil, Medio, Difícil, Experto)
  - Categoría
  - Fecha límite (opcional)
  - Criterios de evaluación
  - Recursos y entregables

**Ejemplo:**
```
Reto 1: Backend API - 40%
Reto 2: Frontend UI - 35%
Reto 3: Documentación - 25%
Total: 100% ✓
```

### Ver Retos
**Rutas:**
- Lista general: `/desafios`
- Detalle: `/desafios/[id]`
- Por categoría: Filtrado automático

---

## 2️⃣ Sistema de Entregas

### Para Equipos (CAMPISTA)

#### Crear Nueva Entrega
**Ruta:** `/entregas/nueva?teamId=xxx&challengeId=xxx`

**Campos disponibles:**
- Título de la entrega
- Descripción detallada
- URL del repositorio (GitHub, GitLab, etc.)
- URL de la demo en vivo
- URL del video explicativo
- Tecnologías utilizadas (selección múltiple)
- Documentación adicional

**Estados de la entrega:**
- 🟡 **DRAFT**: Borrador (editable)
- 🔵 **SUBMITTED**: Enviada (no editable)
- 🟠 **UNDER_REVIEW**: En revisión por jueces
- 🟢 **EVALUATED**: Evaluada y calificada
- 🔴 **REJECTED**: Rechazada

#### Ver Entregas del Equipo
**Ruta:** `/equipos/[id]/entregas`

Muestra:
- Todas las entregas del equipo
- Estado de cada entrega
- Botones de acción según estado
- Calificaciones recibidas (si ya fueron evaluadas)

#### Editar Entrega (solo borradores)
**Ruta:** `/entregas/[id]/editar`

Solo disponible si el estado es DRAFT.

### Para Jueces

#### Ver Entregas de un Reto
**Ruta:** `/desafios/[id]/entregas`

Muestra:
- Todas las entregas del reto
- Solo de hackathones donde está asignado como juez
- Filtro por estado
- Acceso rápido a evaluar

---

## 3️⃣ Sistema de Evaluación

### Rúbricas
Cada reto puede tener múltiples **rúbricas** (criterios de evaluación):

**Ejemplo para un reto de 40%:**
```
Rúbrica 1: Funcionalidad - 50% del reto = 20% del hackathon
Rúbrica 2: Código limpio - 30% del reto = 12% del hackathon
Rúbrica 3: Innovación - 20% del reto = 8% del hackathon
```

### Evaluar como Juez
**Ruta:** `/juez/entrega/[id]/evaluar`

**Proceso:**
1. Ver detalles de la entrega
2. Por cada rúbrica:
   - Calificar en la escala definida (ej: 1-10)
   - Agregar comentarios específicos
3. El sistema calcula automáticamente el puntaje ponderado
4. Guardar evaluación

**Validaciones:**
- ✓ Solo jueces pueden evaluar
- ✓ Un juez solo evalúa una vez por rúbrica/equipo
- ✓ La calificación debe estar en el rango de la escala
- ✓ No puede evaluar equipos de hackathones donde no está asignado

### Cálculo de Puntaje
```
Calificación Juez: 8/10
Porcentaje Rúbrica: 50%
Porcentaje Reto: 40%

Puntaje = (8/10) * 0.50 * 0.40 * 100 = 16 puntos
```

---

## 4️⃣ Tabla de Posiciones

### Por Reto
**Ruta:** `/desafios/[id]/leaderboard`

Muestra:
- Ranking de equipos en ese reto específico
- Puntaje obtenido (del porcentaje del reto)
- Promedio de evaluaciones
- Medallasautom para top 3

### Por Hackathon (General)
**Ruta:** `/hackathones/[id]/leaderboard` *(si existe)*

Muestra:
- Ranking general sumando todos los retos
- Máximo: 100 puntos
- Desglose por reto
- Progreso visual

---

## 5️⃣ Flujo Completo

### Fase 1: Configuración (Organizador)
1. Crear hackathon
2. Crear categorías
3. **Crear retos con porcentajes** (suma debe ser 100%)
4. Crear rúbricas para cada reto
5. Asignar jueces

### Fase 2: Participación (Equipos)
1. Inscribirse al hackathon
2. Formar equipos
3. Ver retos disponibles
4. **Trabajar en los retos**
5. **Subir entregas** (pueden guardar borradores)
6. **Enviar entregas** cuando estén listas

### Fase 3: Evaluación (Jueces)
1. Ver hackathones asignados
2. Ver equipos asignados (si es específico)
3. Ver entregas pendientes
4. **Evaluar cada entrega usando las rúbricas**
5. El sistema calcula puntajes automáticamente

### Fase 4: Resultados
1. **Tabla de posiciones se actualiza automáticamente**
2. Los equipos pueden ver sus calificaciones
3. Los organizadores pueden ver el ranking completo

---

## 🔐 Permisos por Rol

### ORGANIZADOR
- ✓ Crear/editar/eliminar retos
- ✓ Crear/editar rúbricas
- ✓ Ver todas las entregas
- ✓ Ver todas las evaluaciones
- ✓ Ver tabla de posiciones completa

### JUEZ
- ✓ Ver solo hackathones asignados
- ✓ Ver solo equipos asignados (si aplica)
- ✓ Evaluar entregas usando rúbricas
- ✓ Ver tabla de posiciones de sus hackathones
- ✗ NO puede crear equipos
- ✗ NO puede subir entregas
- ✗ NO puede ver configuración SIGA

### CAMPISTA
- ✓ Crear/unirse a equipos
- ✓ Subir entregas para retos
- ✓ Ver sus calificaciones
- ✓ Ver tabla de posiciones
- ✗ NO puede evaluar
- ✗ NO puede asignar jueces

---

## 🎨 Diseño de la Plataforma

**Colores aplicados:**
- Primary Purple: `#b64cff`
- Cyan: `#00ffff`
- Dark Background: `#12013e`
- Navy: `#1d1d3e`

**Consistencia:**
- ✓ Todos los formularios tienen buen contraste
- ✓ Inputs claros: texto oscuro en fondo claro
- ✓ Inputs oscuros: texto blanco en fondo oscuro
- ✓ Placeholders visibles
- ✓ Estados de color consistentes

---

## ✅ Funcionalidades Implementadas

### Backend
- ✅ Entidades completas (Challenge, Submission, Evaluation, Rubric)
- ✅ Validación de porcentajes de retos (no exceder 100%)
- ✅ CRUD completo de entregas
- ✅ Sistema de evaluación con rúbricas
- ✅ Cálculo automático de leaderboard
- ✅ Validación de permisos por rol
- ✅ Restricción de jueces solo a hackathones asignados

### Frontend
- ✅ Formulario de creación de retos con porcentaje
- ✅ Formulario de subir entregas
- ✅ Lista de entregas por equipo
- ✅ Lista de entregas por reto
- ✅ Interfaz de evaluación para jueces
- ✅ Tabla de posiciones por reto
- ✅ Contraste de colores corregido en todos los formularios
- ✅ Restricción visual para jueces

---

## 🧪 Escenario de Prueba Completo

### 1. Como Organizador
```bash
1. Login como organizador
2. Crear hackathon "TechFest 2025"
3. Crear categoría "Desarrollo Web"
4. Crear 3 retos:
   - "Backend API" - 40%
   - "Frontend React" - 35%
   - "Documentación" - 25%
5. Para cada reto, crear 2-3 rúbricas
6. Crear jueces y asignarlos al hackathon
```

### 2. Como Campista
```bash
1. Login como campista
2. Crear equipo "CodeMasters"
3. Ver retos disponibles
4. Subir entrega para "Backend API"
   - Agregar URL repositorio
   - Agregar URL demo
   - Guardar como borrador
5. Editar y completar
6. Enviar entrega final
7. Repetir para otros retos
```

### 3. Como Juez
```bash
1. Login como juez
2. Ver hackathones asignados
3. Ver entregas pendientes de evaluación
4. Evaluar entrega de "CodeMasters":
   - Calificar rúbrica "Funcionalidad": 8/10
   - Calificar rúbrica "Código limpio": 9/10
   - Agregar comentarios
   - Guardar evaluación
```

### 4. Ver Resultados
```bash
1. Ir a leaderboard del reto
2. Ver ranking actualizado
3. Ver puntajes calculados automáticamente
```

---

## 📞 Soporte

Si algo no funciona:
1. Verificar que el backend esté corriendo
2. Verificar que el frontend esté corriendo
3. Revisar la consola del navegador
4. Revisar logs del backend
5. Verificar permisos del usuario

---

**Última actualización:** 2025-11-07
**Versión:** 1.0
**Estado:** ✅ Sistema completo implementado y funcional
