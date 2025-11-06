# Requerimiento: Formación Automática de Equipos

**Fecha:** 4 de Noviembre, 2025
**Prioridad:** ALTA
**Estado:** PENDIENTE DE IMPLEMENTACIÓN

---

## 📋 Descripción General

El sistema debe formar automáticamente equipos cuando se cierra la inscripción de un hackathon, para aquellos participantes que se inscribieron individualmente pero no formaron equipo.

---

## 🎯 Requisitos Funcionales

### 1. Límite de Participantes por Hackathon

**Configuración en Hackathon:**
- Campo: `maxParticipantes` (ejemplo: 45 personas)
- Este límite ya existe en la entidad `Hackathon`
- Debe validarse al momento de inscripción

**Ejemplo:**
```typescript
{
  nombre: "Hackathon IA 2025",
  maxParticipantes: 45,
  minMiembrosEquipo: 1,
  maxMiembrosEquipo: 3,
  // ...
}
```

---

### 2. Formación Automática de Equipos

**Trigger:**
- Cuando la inscripción del hackathon se cierra (fecha límite pasada)
- O cuando un organizador ejecuta "Cerrar Inscripciones" manualmente

**Proceso:**
1. **Identificar participantes sin equipo:**
   - Usuarios inscritos (`registrations` con status APPROVED)
   - Que NO pertenecen a ningún equipo (`teams` para ese hackathon)

2. **Agrupar participantes:**
   - Respetar `minMiembrosEquipo` y `maxMiembrosEquipo`
   - Preferencia: equipos de tamaño `maxMiembrosEquipo`
   - Si sobran participantes, distribuir equitativamente

3. **Crear equipos automáticamente:**
   - Nombre genérico: "Equipo 1", "Equipo 2", "Equipo 3", etc.
   - Código único generado automáticamente
   - Asignar líder: el primer participante del equipo (aleatorio o por orden de inscripción)
   - Estado: `activo: true`

4. **Asignar participantes:**
   - Agregar todos los miembros al equipo
   - Actualizar registros de inscripción con el `teamId`

**Algoritmo Sugerido:**
```typescript
// Ejemplo con 45 participantes, equipos de 3
Total: 45 participantes sin equipo
maxMiembrosEquipo: 3

Resultado:
- 15 equipos de 3 personas
- Nombres: "Equipo 1" hasta "Equipo 15"
```

**Algoritmo con Resto:**
```typescript
// Ejemplo con 47 participantes, equipos de 3
Total: 47 participantes sin equipo
maxMiembrosEquipo: 3

Opción 1 (preferida):
- 14 equipos de 3 personas (42)
- 1 equipo de 5 personas (5)
Total: 15 equipos

Opción 2:
- 15 equipos de 3 personas (45)
- 1 equipo de 2 personas (2)
Total: 16 equipos
```

---

### 3. Edición de Nombre de Equipo

**Funcionalidad:**
- Los miembros del equipo pueden cambiar el nombre
- Solo el líder puede editarlo (opcional: todos los miembros pueden votar)
- El nombre debe actualizarse en tiempo real en:
  - Lista de equipos
  - Dashboard del hackathon
  - Tabla de posiciones (leaderboard)
  - Entregas del equipo

**Validaciones:**
- Nombre único por hackathon
- Longitud mínima: 3 caracteres
- Longitud máxima: 50 caracteres
- No permitir nombres ofensivos (opcional: lista negra)

**Endpoint Sugerido:**
```typescript
PATCH /api/teams/:teamId
Body: {
  nombre: "Nuevo nombre del equipo"
}
```

---

### 4. Filtros de Elegibilidad por Departamento

**Nueva Configuración en Hackathon:**

Agregar campos:
```typescript
interface Hackathon {
  // ... campos existentes

  // NUEVO: Filtros geográficos
  departamentosPermitidos?: string[]; // Ejemplo: ["CALDAS", "QUINDÍO"]
  municipiosPermitidos?: string[];    // Opcional: más específico

  // NUEVO: Restricción activa
  restriccionGeografica: boolean;     // true/false
}
```

**Datos desde SIGA:**
- Los usuarios ya tienen `departamentoResidencia` y `municipioResidencia`
- Estos datos vienen del campo `departamento` y `municipio` de SIGA

**Validación de Elegibilidad:**

Actualizar método `checkEligibility()` en `HackathonsService`:

```typescript
async checkEligibility(hackathonId: string, userId: string) {
  // ... validaciones existentes

  // NUEVO: Validar departamento
  if (hackathon.restriccionGeografica && hackathon.departamentosPermitidos) {
    const userDepartamento = user.departamentoResidencia?.toUpperCase();
    const permitidos = hackathon.departamentosPermitidos.map(d => d.toUpperCase());

    if (!permitidos.includes(userDepartamento)) {
      reasons.push(
        `Solo pueden participar personas de: ${hackathon.departamentosPermitidos.join(', ')}`
      );
      isEligible = false;
    }
  }

  // NUEVO: Validar municipio (opcional)
  if (hackathon.restriccionGeografica && hackathon.municipiosPermitidos) {
    const userMunicipio = user.municipioResidencia?.toUpperCase();
    const permitidos = hackathon.municipiosPermitidos.map(m => m.toUpperCase());

    if (!permitidos.includes(userMunicipio)) {
      reasons.push(
        `Solo pueden participar personas de: ${hackathon.municipiosPermitidos.join(', ')}`
      );
      isEligible = false;
    }
  }

  return { isEligible, reasons };
}
```

---

## 🗂️ Estructura de Base de Datos

### Tabla: hackathons (Agregar campos)

```sql
ALTER TABLE hackathons
ADD COLUMN restriccion_geografica BOOLEAN DEFAULT FALSE,
ADD COLUMN departamentos_permitidos TEXT[], -- Array de strings
ADD COLUMN municipios_permitidos TEXT[];    -- Array de strings
```

### Tabla: teams (Ya existe, sin cambios necesarios)

```sql
-- Ya tiene:
- id
- nombre (editable)
- codigo (único)
- descripcion
- lider_id
- hackathon_id
- activo
- created_at
- updated_at
```

---

## 📊 Flujo de Usuario

### Escenario 1: Inscripción con Formación Automática

```
1. Usuario se inscribe individualmente al hackathon
   ↓
2. No forma equipo antes de la fecha límite
   ↓
3. Sistema cierra inscripciones (fecha límite o manual)
   ↓
4. Sistema detecta 45 participantes sin equipo
   ↓
5. Sistema crea 15 equipos de 3 personas
   - Equipo 1: Usuario A (líder), Usuario B, Usuario C
   - Equipo 2: Usuario D (líder), Usuario E, Usuario F
   - ...
   - Equipo 15: Usuario X (líder), Usuario Y, Usuario Z
   ↓
6. Usuarios reciben notificación por email:
   "Has sido asignado al Equipo 5 del Hackathon IA 2025"
   ↓
7. Usuarios pueden:
   - Ver su equipo en /equipos
   - El líder puede cambiar el nombre del equipo
   - Todos pueden colaborar en entregas
```

### Escenario 2: Filtro por Departamento

```
1. Organizador crea hackathon:
   - Nombre: "Hackathon Eje Cafetero 2025"
   - restriccionGeografica: true
   - departamentosPermitidos: ["CALDAS", "QUINDÍO", "RISARALDA"]
   ↓
2. Usuario de ANTIOQUIA intenta inscribirse
   ↓
3. Sistema valida elegibilidad
   ↓
4. Resultado: NO ELEGIBLE
   Mensaje: "Solo pueden participar personas de: CALDAS, QUINDÍO, RISARALDA"
   ↓
5. Usuario ve mensaje en página del hackathon
   (No aparece botón de inscripción)
```

### Escenario 3: Cambio de Nombre de Equipo

```
1. Equipo 5 es formado automáticamente
   ↓
2. Líder (Usuario X) va a /equipos/[id]
   ↓
3. Click en "Editar Equipo"
   ↓
4. Cambia nombre de "Equipo 5" a "Los Innovadores"
   ↓
5. Sistema valida:
   - Nombre único ✓
   - Longitud válida ✓
   ↓
6. Actualiza en todas las vistas:
   - Lista de equipos
   - Leaderboard
   - Entregas
   - Notificaciones
```

---

## 🔧 Implementación Técnica

### 1. Backend - Servicio de Formación Automática

**Archivo:** `backend/src/teams/teams.service.ts`

```typescript
/**
 * Forma equipos automáticamente para participantes sin equipo
 */
async autoFormTeams(hackathonId: string): Promise<Team[]> {
  // 1. Obtener hackathon
  const hackathon = await this.hackathonRepository.findOne({
    where: { id: hackathonId },
  });

  if (!hackathon) {
    throw new NotFoundException('Hackathon no encontrado');
  }

  // 2. Obtener participantes sin equipo
  const registrations = await this.registrationRepository.find({
    where: {
      hackathonId,
      status: RegistrationStatus.APPROVED,
      teamId: IsNull(), // No tienen equipo
    },
    relations: ['user'],
  });

  if (registrations.length === 0) {
    return [];
  }

  // 3. Calcular número de equipos
  const maxSize = hackathon.maxMiembrosEquipo;
  const totalParticipants = registrations.length;
  const numTeams = Math.ceil(totalParticipants / maxSize);

  // 4. Distribuir participantes
  const teams: Team[] = [];
  let participantIndex = 0;

  for (let i = 1; i <= numTeams; i++) {
    // Calcular tamaño del equipo
    const remainingParticipants = totalParticipants - participantIndex;
    const remainingTeams = numTeams - i + 1;
    const teamSize = Math.ceil(remainingParticipants / remainingTeams);

    // Crear equipo
    const teamMembers = registrations.slice(
      participantIndex,
      participantIndex + teamSize
    );

    const team = this.teamRepository.create({
      nombre: `Equipo ${i}`,
      codigo: this.generateTeamCode(),
      descripcion: 'Equipo formado automáticamente',
      liderId: teamMembers[0].userId,
      hackathonId,
      activo: true,
    });

    await this.teamRepository.save(team);

    // Asignar miembros (excepto el líder)
    for (let j = 1; j < teamMembers.length; j++) {
      const member = this.teamMemberRepository.create({
        teamId: team.id,
        userId: teamMembers[j].userId,
      });
      await this.teamMemberRepository.save(member);
    }

    // Actualizar registrations con teamId
    for (const reg of teamMembers) {
      reg.teamId = team.id;
      await this.registrationRepository.save(reg);
    }

    teams.push(team);
    participantIndex += teamSize;
  }

  return teams;
}
```

### 2. Backend - Endpoint

**Archivo:** `backend/src/hackathons/hackathons.controller.ts`

```typescript
@Post(':id/auto-form-teams')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ORGANIZADOR)
@ApiBearerAuth()
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Formar equipos automáticamente' })
async autoFormTeams(@Param('id') id: string, @Request() req: any) {
  return this.hackathonsService.autoFormTeams(id, req.user.sub);
}
```

### 3. Frontend - Botón para Organizador

**Archivo:** `frontend/src/app/hackathones/[id]/page.tsx`

```tsx
{isOrganizador && !hackathon.inscripcionAbierta && (
  <Button onClick={handleAutoFormTeams}>
    Formar Equipos Automáticamente
  </Button>
)}
```

---

## 📧 Notificaciones

### Email de Asignación a Equipo

**Asunto:** Has sido asignado a un equipo - {Hackathon Name}

**Cuerpo:**
```
Hola {Usuario},

Has sido asignado automáticamente al **{Nombre Equipo}** para el hackathon:

🏆 **{Hackathon Nombre}**

**Tu equipo:**
- Líder: {Nombre Líder}
- Miembros: {Lista de miembros}

Puedes ver los detalles de tu equipo aquí:
[Ver Mi Equipo]

El líder del equipo puede cambiar el nombre del equipo en cualquier momento.

¡Mucha suerte en el hackathon!

---
HackatonTech2 - TalentoTech
```

---

## ✅ Checklist de Implementación

### Fase 1: Formación Automática de Equipos
- [ ] Agregar método `autoFormTeams()` en TeamsService
- [ ] Agregar endpoint POST `/hackathons/:id/auto-form-teams`
- [ ] Agregar botón en página de hackathon (solo organizador)
- [ ] Implementar algoritmo de distribución equitativa
- [ ] Generar códigos únicos para equipos
- [ ] Actualizar registrations con teamId
- [ ] Enviar notificaciones por email

### Fase 2: Edición de Nombre de Equipo
- [ ] Verificar endpoint PATCH `/teams/:id` existe
- [ ] Agregar validación de nombre único
- [ ] Agregar validación de longitud
- [ ] Agregar botón "Editar Nombre" en página de equipo
- [ ] Actualizar nombre en todas las vistas en tiempo real
- [ ] Agregar historial de cambios de nombre (opcional)

### Fase 3: Filtros Geográficos
- [ ] Agregar campos a entidad Hackathon:
  - `restriccionGeografica: boolean`
  - `departamentosPermitidos: string[]`
  - `municipiosPermitidos: string[]`
- [ ] Migración de base de datos
- [ ] Actualizar DTO CreateHackathonDto
- [ ] Actualizar formulario de creación de hackathon
- [ ] Actualizar método `checkEligibility()` con validación geográfica
- [ ] Mostrar filtros activos en página del hackathon
- [ ] Agregar selector de departamentos en formulario (UI)

### Fase 4: Testing
- [ ] Test unitario: algoritmo de formación de equipos
- [ ] Test unitario: validación geográfica
- [ ] Test integración: crear hackathon con filtros
- [ ] Test integración: formación automática
- [ ] Test E2E: flujo completo de inscripción y asignación
- [ ] Test E2E: cambio de nombre de equipo

---

## 🎨 Mockups / Wireframes

### Botón de Formación Automática (Organizador)

```
┌─────────────────────────────────────────────────┐
│ Hackathon Detalles                              │
├─────────────────────────────────────────────────┤
│ Estado: Inscripciones Cerradas                  │
│                                                  │
│ 45 participantes inscritos                      │
│ 30 participantes sin equipo                     │
│                                                  │
│ [ Formar Equipos Automáticamente ]              │
│                                                  │
│ Se crearán 10 equipos de 3 personas             │
└─────────────────────────────────────────────────┘
```

### Formulario con Filtros Geográficos

```
┌─────────────────────────────────────────────────┐
│ Crear Hackathon                                 │
├─────────────────────────────────────────────────┤
│ Nombre: [_________________________________]     │
│                                                  │
│ Elegibilidad:                                   │
│ ☑ Restringir por ubicación geográfica           │
│                                                  │
│ Departamentos permitidos:                       │
│ ☑ CALDAS                                        │
│ ☑ QUINDÍO                                       │
│ ☑ RISARALDA                                     │
│ ☐ ANTIOQUIA                                     │
│ ☐ VALLE DEL CAUCA                               │
│                                                  │
│ [ Crear Hackathon ]                             │
└─────────────────────────────────────────────────┘
```

---

## 📝 Notas Adicionales

### Consideraciones de Performance
- La formación automática puede tardar con muchos participantes
- Implementar proceso asíncrono (background job)
- Mostrar progreso al organizador

### Consideraciones de UX
- Permitir a organizadores previsualizar equipos antes de confirmar
- Opción de "Rehacer equipos" si no están satisfechos
- Permitir mover participantes entre equipos manualmente

### Edge Cases
- ¿Qué pasa si un participante se retira después de formar equipos?
- ¿Se pueden disolver equipos automáticos?
- ¿Usuarios pueden solicitar cambio de equipo?

---

**Documento creado:** 4 de Noviembre, 2025
**Última actualización:** 4 de Noviembre, 2025
**Estado:** PENDIENTE DE IMPLEMENTACIÓN
**Prioridad:** ALTA
