# Funcionalidad: Agregar Miembros al Equipo

## Resumen
Se ha implementado la funcionalidad completa para que los líderes de equipos puedan buscar y agregar miembros a sus equipos mediante el número de documento.

## Componentes Implementados

### 1. Backend

#### Nuevo Endpoint de Búsqueda
**File: `backend/src/auth/auth.controller.ts`**
- **Ruta:** `GET /api/auth/search-by-documento/:documento`
- **Autenticación:** Requiere JWT token
- **Descripción:** Busca un usuario por su número de documento
- **Respuesta:** Devuelve datos del usuario incluyendo sus temas de interés

```typescript
@Get('search-by-documento/:documento')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
async searchByDocumento(@Param('documento') documento: string) {
  return this.authService.searchByDocumento(documento);
}
```

#### Servicio de Búsqueda
**File: `backend/src/auth/auth.service.ts`**
```typescript
async searchByDocumento(documento: string) {
  const user = await this.userRepository.findOne({
    where: { documento },
    relations: ['interestTopics'],
    select: {
      id: true,
      documento: true,
      nombres: true,
      apellidos: true,
      email: true,
      role: true,
      status: true,
    },
  });

  if (!user) {
    throw new NotFoundException('Usuario no encontrado');
  }

  return user;
}
```

#### Endpoint de Agregar Miembro (Ya existía)
- **Ruta:** `POST /api/teams/:id/members`
- **Body:** `{ userId: string }`
- **Validaciones automáticas:**
  - Verifica que el usuario no esté ya en el equipo
  - Verifica que el usuario no esté en otro equipo de la misma categoría
  - Valida que los temas de interés coincidan con el líder
  - Verifica límites de miembros del hackathon

### 2. Frontend

#### Página de Agregar Miembro
**File: `frontend/src/app/equipos/[id]/agregar-miembro/page.tsx`**

**Características:**
1. **Búsqueda por Documento**
   - Input para ingresar el número de documento
   - Botón de búsqueda con loading state
   - Validación de documento requerido

2. **Visualización de Resultados**
   - Muestra información completa del usuario encontrado:
     - Nombres y apellidos
     - Email
     - Temas de interés (badges)
   - Estados visuales:
     - "Líder del equipo" - si el usuario es el líder
     - "Ya es miembro" - si ya pertenece al equipo
     - "Tú" - si es el usuario actual
     - Botón "Agregar" - si puede ser agregado

3. **Validaciones Frontend**
   - Verifica límite de miembros antes de agregar
   - Solo el líder puede acceder a la página
   - Muestra capacidad actual vs máxima del equipo

4. **Información Contextual**
   - Card con contador de miembros actuales
   - Advertencia si se alcanzó la capacidad máxima
   - Card informativa con reglas de agregado

#### Navegación
**File: `frontend/src/app/equipos/[id]/page.tsx`**
- Botón "Agregar Miembro" visible solo para líderes (líneas 333-340)
- Enlace en sección de miembros vacía (líneas 384-390)
- Redirección a `/equipos/[id]/agregar-miembro`

## Flujo de Usuario

### 1. Líder Crea Equipo
```
/equipos/nuevo → Selecciona categoría → Crea equipo → /equipos/[id]
```

### 2. Líder Agrega Miembros
```
/equipos/[id] → Click "Agregar Miembro" → /equipos/[id]/agregar-miembro
             ↓
Ingresa documento → Busca usuario → Click "Agregar"
             ↓
/equipos/[id] (con nuevo miembro agregado)
```

### 3. Validaciones en Cada Paso

**Al buscar:**
- Usuario debe estar registrado en la plataforma
- Documento debe coincidir exactamente

**Al agregar:**
- Usuario no debe estar ya en el equipo
- Usuario no debe estar en otro equipo de la misma categoría
- Usuario debe tener el mismo tema de interés que el líder (validación SIGA)
- No debe exceder el límite máximo de miembros

## Ejemplos de Uso

### Búsqueda Exitosa
```
Documento: 1003933839
↓
Resultado:
┌─────────────────────────────────────┐
│ ANGELA MILENA LEYTON LEAL           │
│ ✉ angela.leyton@example.com         │
│ 📌 Análisis de Datos                │
│                    [Agregar] ← Botón│
└─────────────────────────────────────┘
```

### Usuario No Encontrado
```
Documento: 9999999999
↓
"No se encontró ningún usuario con ese documento"
```

### Usuario Ya es Miembro
```
Documento: 1003933839
↓
Resultado:
┌─────────────────────────────────────┐
│ ANGELA MILENA LEYTON LEAL           │
│ ✉ angela.leyton@example.com         │
│ 📌 Análisis de Datos                │
│              [Ya es miembro] ← Badge│
└─────────────────────────────────────┘
```

## Seguridad

### Autenticación
- Todos los endpoints requieren JWT válido
- Solo usuarios autenticados pueden buscar

### Autorización
- Solo el líder del equipo puede acceder a la página de agregar miembros
- Redirección automática si no es líder

### Validaciones de Negocio
1. **Mismo tema de interés:** Implementado en backend (`validateSameTopics`)
2. **Un equipo por categoría:** Usuario no puede estar en múltiples equipos de la misma categoría
3. **Límites de miembros:** Respeta `minMiembrosEquipo` y `maxMiembrosEquipo` del hackathon

## API Endpoints Utilizados

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/auth/search-by-documento/:documento` | Buscar usuario por documento |
| GET | `/api/teams/:id` | Obtener detalles del equipo |
| POST | `/api/teams/:id/members` | Agregar miembro al equipo |
| DELETE | `/api/teams/:id/members/:memberId` | Remover miembro del equipo |

## Archivos Modificados/Creados

### Backend
- ✅ `backend/src/auth/auth.controller.ts` - Agregado endpoint de búsqueda
- ✅ `backend/src/auth/auth.service.ts` - Agregado método `searchByDocumento()`

### Frontend
- ✅ `frontend/src/app/equipos/[id]/agregar-miembro/page.tsx` - **NUEVA PÁGINA**
- ✅ `frontend/src/app/equipos/[id]/page.tsx` - Botones de navegación ya existían

### Servicios (Sin cambios)
- ℹ️ `frontend/src/services/team.service.ts` - Ya tenía métodos `addMember()` y `removeMember()`
- ℹ️ `backend/src/teams/teams.service.ts` - Ya tenía toda la lógica de validación

## Testing

### Casos de Prueba Recomendados

1. **Búsqueda de Usuario**
   - ✅ Buscar con documento válido
   - ✅ Buscar con documento inexistente
   - ✅ Buscar sin autenticación (debe fallar)

2. **Agregar Miembro**
   - ✅ Agregar usuario válido
   - ✅ Intentar agregar usuario que ya es miembro
   - ✅ Intentar agregar usuario con tema diferente
   - ✅ Intentar agregar cuando se alcanzó el límite
   - ✅ Intentar agregar como no-líder (debe fallar)

3. **Navegación**
   - ✅ Acceso a página de agregar como líder
   - ✅ Acceso a página de agregar como no-líder (debe redirigir)
   - ✅ Retorno a detalle del equipo después de agregar

## Mejoras Futuras (Opcionales)

1. **Búsqueda Avanzada**
   - Buscar por nombre o email
   - Búsqueda de múltiples usuarios
   - Autocompletado

2. **Invitaciones**
   - Enviar invitación por email
   - Sistema de códigos de invitación
   - Notificaciones push

3. **Gestión Masiva**
   - Importar lista de documentos (CSV)
   - Agregar múltiples miembros a la vez

4. **Analytics**
   - Mostrar usuarios sugeridos basados en temas
   - Historial de búsquedas
   - Miembros frecuentes

## Notas Técnicas

- **Carga automática:** El backend hace auto-reload cuando detecta cambios en los archivos
- **Frontend:** Next.js 14 con App Router - hot reload automático en desarrollo
- **Estado:** Usa React hooks (useState, useEffect) para manejo de estado
- **Notificaciones:** React Hot Toast para feedback al usuario
- **Tipos:** TypeScript con interfaces bien definidas para User y Team
