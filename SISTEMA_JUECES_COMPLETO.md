# Sistema de Gestión de Jueces - Documentación Completa

## Resumen Ejecutivo

Se ha implementado un sistema completo de gestión de jueces para la plataforma HackatonTech2 que permite a los administradores crear usuarios con rol de juez, asignarlos a hackathones específicos, y permitir que los jueces evalúen las entregas de los equipos asignados.

## Funcionalidades Implementadas

### 1. Creación de Usuarios Jueces (Administrador)

**Ubicación**: `/admin/jueces`

**Características**:
- Formulario de creación de jueces con validación
- Generación automática de contraseña temporal
- Envío de email con credenciales al juez
- Modal de confirmación mostrando contraseña temporal (solo visible una vez)
- Lista de todos los jueces registrados
- Estado y datos de contacto de cada juez

**Campos del formulario**:
- Documento de identidad (obligatorio)
- Email (obligatorio)
- Nombres (obligatorio)
- Apellidos (obligatorio)
- Teléfono (opcional)

**Seguridad**:
- El juez debe cambiar la contraseña en el primer inicio de sesión
- Solo usuarios con rol ORGANIZADOR pueden crear jueces
- Validación de duplicados por documento y email

### 2. Asignación de Jueces a Hackathones

**Ubicación**: `/admin/hackathones/[id]/jueces`

**Características**:
- Asignar jueces a hackathones específicos
- Dos modalidades de asignación:
  - **Ver todos los equipos**: El juez puede evaluar a todos los equipos del hackathon
  - **Equipos específicos**: Seleccionar manualmente qué equipos puede evaluar el juez
- Lista de jueces asignados al hackathon
- Visualización de permisos de cada juez
- Remover asignaciones

**Flujo de asignación**:
1. Seleccionar juez del listado disponible
2. Elegir modalidad (todos los equipos o específicos)
3. Si es específico, seleccionar equipos de una lista con checkbox
4. Confirmar asignación

### 3. Panel de Juez

**Ubicación**: `/juez`

**Características**:
- Dashboard con estadísticas:
  - Hackathones asignados
  - Equipos accesibles
  - Estado del juez
- Tarjetas de hackathones asignados con:
  - Nombre y descripción del hackathon
  - Fecha de asignación
  - Tipo de acceso (todos los equipos o específicos)
  - Botón para ver entregas
- Instrucciones para jueces

### 4. Vista de Entregas para Juez

**Ubicación**: `/juez/hackathon/[id]`

**Características**:
- Estadísticas del hackathon:
  - Equipos accesibles
  - Total de desafíos
  - Total de entregas
  - Entregas pendientes de evaluación
- Filtros por estado:
  - Todas
  - Pendientes (SUBMITTED, UNDER_REVIEW)
  - Evaluadas (EVALUATED)
- Lista de entregas con:
  - Título y descripción
  - Estado con badge visual
  - Equipo que envió
  - Desafío al que pertenece
  - Fecha de envío
  - Calificación (si ya está evaluada)
  - Botón para ver archivo PDF
  - Botón para evaluar

**Restricción de acceso**:
- El juez solo ve entregas de equipos que tiene asignados
- Si puede ver todos los equipos, se cargan todas las entregas del hackathon

## Estructura del Backend

### Entidad JudgeAssignment

```typescript
@Entity('judge_assignments')
export class JudgeAssignment {
  id: string;
  juezId: string;
  hackathonId: string;
  assignedTeams: Team[];
  canSeeAllTeams: boolean;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Relaciones**:
- `juez`: ManyToOne con User
- `hackathon`: ManyToOne con Hackathon
- `assignedTeams`: ManyToMany con Team

### Endpoints del Backend

#### Judge Assignments (`/api/judge-assignments`)

**POST /** - Asignar juez a hackathon
- Body: `{ juezId, hackathonId, teamIds? }`
- Permisos: ORGANIZADOR
- Valida que el usuario sea JUEZ
- Valida que los equipos pertenezcan al hackathon
- Crea relación ManyToMany con equipos si se especifican

**GET /judge/:juezId** - Obtener asignaciones de un juez
- Permisos: ORGANIZADOR, JUEZ
- Retorna hackathones asignados con equipos

**GET /hackathon/:hackathonId** - Obtener jueces de un hackathon
- Permisos: ORGANIZADOR
- Retorna todos los jueces asignados con sus equipos

**PUT /:assignmentId** - Actualizar equipos asignados
- Body: `{ teamIds? }`
- Permisos: ORGANIZADOR
- Actualiza la lista de equipos asignados

**DELETE /:assignmentId** - Remover asignación
- Permisos: ORGANIZADOR
- Marca la asignación como inactiva

**GET /my-assignments** - Mis asignaciones (juez autenticado)
- Permisos: JUEZ
- Retorna hackathones asignados al juez actual

**GET /accessible-teams/:hackathonId** - Equipos accesibles
- Permisos: JUEZ
- Retorna equipos que el juez puede ver en un hackathon
- Si `canSeeAllTeams` es true, retorna todos los equipos del hackathon

#### Auth (`/api/auth`)

**POST /create-judge** - Crear usuario juez
- Body: `{ documento, email, nombres, apellidos, telefono? }`
- Permisos: ORGANIZADOR
- Genera contraseña temporal
- Envía email con credenciales
- Marca `mustChangePassword` como true

**GET /judges** - Listar todos los jueces
- Permisos: ORGANIZADOR
- Retorna usuarios con role JUEZ

### Servicio JudgeAssignmentsService

**Métodos principales**:
- `assignJudgeToHackathon()`: Asigna juez con validaciones completas
- `getJudgeAssignments()`: Obtiene asignaciones de un juez
- `getHackathonJudges()`: Obtiene jueces de un hackathon
- `updateJudgeAssignment()`: Actualiza equipos asignados
- `removeJudgeAssignment()`: Desactiva asignación
- `canJudgeAccessSubmission()`: Verifica si un juez puede acceder a una entrega
- `getAccessibleTeamsForJudge()`: Obtiene equipos accesibles para un juez

**Lógica de acceso**:
```typescript
if (assignment.canSeeAllTeams) {
  // Retornar todos los equipos del hackathon
  return await this.teamRepository
    .createQueryBuilder('team')
    .leftJoinAndSelect('team.category', 'category')
    .where('category.hackathonId = :hackathonId', { hackathonId })
    .getMany();
}

// Retornar solo equipos asignados
return assignment.assignedTeams;
```

## Estructura del Frontend

### Servicios

#### `judge-assignment.service.ts`

```typescript
interface JudgeAssignment {
  id: string;
  juezId: string;
  hackathonId: string;
  canSeeAllTeams: boolean;
  activo: boolean;
  juez?: User;
  hackathon?: Hackathon;
  assignedTeams?: Team[];
}

- assignJudge(data, token)
- getJudgeAssignments(juezId, token)
- getMyAssignments(token)
- getHackathonJudges(hackathonId, token)
- updateAssignment(assignmentId, data, token)
- removeAssignment(assignmentId, token)
- getAccessibleTeams(hackathonId, token)
```

#### Extensión de `auth.service.ts`

```typescript
- createJudge(judgeData): Promise<{ user: User; temporaryPassword: string }>
- getAllJudges(): Promise<User[]>
```

### Páginas Implementadas

1. **`/admin/jueces/page.tsx`**
   - Gestión completa de jueces
   - Creación de usuarios
   - Listado de jueces
   - Modal de contraseña temporal

2. **`/admin/hackathones/[id]/jueces/page.tsx`**
   - Asignación de jueces a hackathon
   - Selección de equipos
   - Gestión de permisos
   - Remover asignaciones

3. **`/juez/page.tsx`**
   - Dashboard del juez
   - Vista de hackathones asignados
   - Estadísticas personalizadas

4. **`/juez/hackathon/[id]/page.tsx`**
   - Vista de entregas del hackathon
   - Filtros por estado
   - Acceso solo a equipos asignados
   - Enlaces para evaluar

## Sistema de Emails

### Email de Creación de Juez

**Asunto**: "Bienvenido como Juez - HackatonTech2"

**Contenido**:
- Saludo personalizado
- Explicación del rol
- Credenciales de acceso:
  - Documento de ingreso
  - Contraseña temporal (visible)
- Advertencia de cambio obligatorio de contraseña
- Responsabilidades del juez
- Link de inicio de sesión

**Modo MOCK** (sin configuración SMTP):
```
========================================
[MOCK EMAIL] CREDENCIALES DE JUEZ
Usuario: Juan Pérez
Email: juan@example.com
Documento: 1234567890
Contraseña Temporal: a1b2c3d4e5f6
========================================
```

## Flujos de Usuario

### Flujo 1: Administrador crea juez

1. Admin accede a `/admin/jueces`
2. Hace clic en "Crear Juez"
3. Completa formulario con datos del juez
4. Sistema valida datos
5. Se genera contraseña temporal
6. Se crea usuario con role JUEZ
7. Se envía email al juez
8. Se muestra modal con contraseña (guardar ahora)
9. Juez aparece en el listado

### Flujo 2: Administrador asigna juez a hackathon

1. Admin accede a hackathon específico
2. Navega a sección de jueces
3. Hace clic en "Asignar Juez"
4. Selecciona juez del dropdown
5. Decide si puede ver todos los equipos o específicos
6. Si específico, selecciona equipos con checkbox
7. Confirma asignación
8. Asignación aparece en el listado

### Flujo 3: Juez evalúa entregas

1. Juez inicia sesión con documento y contraseña temporal
2. Sistema solicita cambio de contraseña
3. Juez accede a `/juez`
4. Ve sus hackathones asignados
5. Selecciona un hackathon
6. Ve lista de entregas de equipos asignados
7. Filtra por estado (pendientes/evaluadas)
8. Hace clic en "Evaluar" en una entrega
9. Accede a página de evaluación (siguiente fase)

## Seguridad y Validaciones

### Backend

1. **Autenticación y Autorización**:
   - Guards JWT para todas las rutas
   - RolesGuard para verificar permisos
   - Decorator @Roles para especificar roles permitidos

2. **Validaciones de Asignación**:
   - Verificar que el usuario sea JUEZ
   - Verificar que el hackathon exista
   - Prevenir asignaciones duplicadas
   - Validar que equipos pertenezcan al hackathon

3. **Validaciones de Acceso**:
   - Método `canJudgeAccessSubmission()` verifica permisos antes de mostrar entregas
   - `getAccessibleTeamsForJudge()` retorna solo equipos permitidos

### Frontend

1. **Validación de Roles**:
   - useEffect verifica role al cargar componentes
   - Redirección si el usuario no tiene permisos

2. **Validación de Formularios**:
   - Campos obligatorios
   - Formato de email
   - Prevención de duplicados en frontend

## Base de Datos

### Tablas Creadas

#### `judge_assignments`
```sql
CREATE TABLE judge_assignments (
  id VARCHAR PRIMARY KEY,
  juez_id VARCHAR NOT NULL,
  hackathon_id VARCHAR NOT NULL,
  can_see_all_teams BOOLEAN DEFAULT TRUE,
  activo BOOLEAN DEFAULT TRUE,
  created_at DATETIME,
  updated_at DATETIME,
  FOREIGN KEY (juez_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (hackathon_id) REFERENCES hackathons(id) ON DELETE CASCADE
);
```

#### `judge_assigned_teams` (ManyToMany)
```sql
CREATE TABLE judge_assigned_teams (
  judge_assignment_id VARCHAR NOT NULL,
  team_id VARCHAR NOT NULL,
  PRIMARY KEY (judge_assignment_id, team_id),
  FOREIGN KEY (judge_assignment_id) REFERENCES judge_assignments(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);
```

## Archivos Creados/Modificados

### Backend

**Nuevos archivos**:
- `backend/src/entities/judge-assignment.entity.ts`
- `backend/src/judge-assignments/judge-assignments.service.ts`
- `backend/src/judge-assignments/judge-assignments.controller.ts`
- `backend/src/judge-assignments/judge-assignments.module.ts`

**Modificados**:
- `backend/src/app.module.ts` - Agregada entidad y módulo
- `backend/src/auth/auth.service.ts` - Métodos `createJudge()` y `getAllJudges()`
- `backend/src/auth/auth.controller.ts` - Endpoints para jueces
- `backend/src/email/email.service.ts` - Método `sendJudgeCreationEmail()`

### Frontend

**Nuevos archivos**:
- `frontend/src/services/judge-assignment.service.ts`
- `frontend/src/app/admin/jueces/page.tsx`
- `frontend/src/app/admin/hackathones/[id]/jueces/page.tsx`
- `frontend/src/app/juez/page.tsx`
- `frontend/src/app/juez/hackathon/[id]/page.tsx`

**Modificados**:
- `frontend/src/services/auth.service.ts` - Métodos para gestión de jueces

## Próximos Pasos (No Implementados)

### Sistema de Calificación de Entregas

**Pendiente de implementar**:
1. Página `/juez/entrega/[id]/evaluar`
2. Formulario de evaluación con rúbricas
3. Backend para crear/actualizar evaluaciones
4. Cálculo de puntaje final
5. Visualización de evaluaciones para equipos

**Requisitos**:
- Integración con sistema de rúbricas existente
- Múltiples evaluaciones por entrega (varios jueces)
- Promedio de calificaciones
- Retroalimentación textual

### Mejoras Sugeridas

1. **Notificaciones**:
   - Email al juez cuando se le asigna un hackathon
   - Notificación al equipo cuando su entrega es evaluada

2. **Dashboard Mejorado**:
   - Gráficos de progreso de evaluación
   - Estadísticas de calificaciones
   - Histórico de evaluaciones

3. **Filtros Avanzados**:
   - Filtrar entregas por desafío
   - Filtrar por equipo
   - Búsqueda por nombre

4. **Export/Report**:
   - Exportar evaluaciones a PDF
   - Reporte de calificaciones por hackathon
   - Certificados para equipos

## Pruebas Recomendadas

### Flujo Completo

1. **Crear Juez**:
   - ✅ Crear juez con datos válidos
   - ✅ Verificar email recibido (o logs en modo MOCK)
   - ✅ Verificar que aparece en listado

2. **Asignar a Hackathon**:
   - ✅ Asignar con "ver todos los equipos"
   - ✅ Asignar con equipos específicos
   - ✅ Intentar asignar mismo juez dos veces (debe fallar)
   - ✅ Verificar en listado de asignaciones

3. **Login y Acceso**:
   - ✅ Login con contraseña temporal
   - ✅ Forzar cambio de contraseña
   - ✅ Acceder a dashboard de juez
   - ✅ Verificar que solo ve hackathones asignados

4. **Ver Entregas**:
   - ✅ Acceder a hackathon asignado
   - ✅ Verificar que solo ve equipos asignados
   - ✅ Probar filtros (todas/pendientes/evaluadas)
   - ✅ Verificar que no puede acceder a hackathones no asignados

### Casos Borde

1. Juez sin asignaciones
2. Hackathon sin equipos
3. Hackathon sin entregas
4. Juez con múltiples hackathones
5. Actualizar equipos asignados después de la asignación inicial

## Resumen de Implementación

✅ **Completado**:
- Entidad JudgeAssignment con relaciones ManyToMany
- Backend completo para gestión de jueces
- Endpoints REST con autenticación y autorización
- Sistema de emails para jueces
- Páginas de administración
- Panel de juez
- Vista de entregas con filtros
- Restricción de acceso por equipos asignados

⏳ **Pendiente**:
- Sistema de calificación/evaluación
- Página de evaluación individual
- Integración con rúbricas
- Cálculo de puntajes finales

## Conclusión

El sistema de gestión de jueces está completamente funcional para permitir que administradores creen jueces, los asignen a hackathones específicos (con o sin restricción de equipos), y que los jueces puedan ver las entregas de los equipos asignados. La siguiente fase natural es implementar el sistema de calificación donde los jueces pueden evaluar las entregas usando rúbricas.
