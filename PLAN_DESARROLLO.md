# Plan de Desarrollo - HackatonTech2

## Estado Actual del Sistema ✅

### Backend (NestJS + TypeORM + SQLite)
- ✅ API funcionando en `http://localhost:3001/api`
- ✅ Autenticación JWT completa (register, login, refresh, logout)
- ✅ Base de datos SQLite configurada y funcionando
- ✅ Swagger documentación disponible en `/api/docs`
- ✅ Usuarios con roles: CAMPISTA, JUEZ, ORGANIZADOR

### Frontend (Next.js 14 + Tailwind CSS)
- ✅ Aplicación funcionando en `http://localhost:3000`
- ✅ Tailwind CSS configurado correctamente
- ✅ Páginas implementadas: Login, Register, Dashboard
- ✅ Sidebar con navegación
- ✅ Context API para autenticación
- ✅ Diseño profesional y responsivo

### Usuarios de Prueba

#### Usuario Regular (Campista)
- **Email:** juan@test.com
- **Password:** (el que creaste)
- **Rol:** CAMPISTA

#### Usuario Administrador (Organizador)
- **Email:** admin@hackatontech2.com
- **Password:** Admin123!
- **Rol:** ORGANIZADOR

---

## Próximos Pasos de Desarrollo

### Fase 1: Gestión de Hackathones 🎯 (Prioridad Alta)

#### Backend
1. **Módulo de Hackathones**
   - [ ] Crear entidad `Hackathon` con TypeORM
   - [ ] Implementar CRUD completo
   - [ ] Endpoints para:
     - Crear hackathon (solo ORGANIZADOR)
     - Listar hackathones (público/privado)
     - Ver detalle de hackathon
     - Actualizar hackathon (solo ORGANIZADOR)
     - Eliminar hackathon (solo ORGANIZADOR)
     - Inscribirse a hackathon (CAMPISTA)
     - Ver participantes (autenticado)

#### Frontend
2. **Página de Hackathones** (`/hackathones`)
   - [ ] Lista de hackathones activos/próximos/finalizados
   - [ ] Filtros por estado, fecha, categoría
   - [ ] Vista de tarjetas con información resumida
   - [ ] Botón "Inscribirse" para campistas
   - [ ] Botón "Crear Hackathon" para organizadores

3. **Página de Detalle de Hackathon** (`/hackathones/[id]`)
   - [ ] Información completa del hackathon
   - [ ] Desafíos asociados
   - [ ] Equipos participantes
   - [ ] Cronograma
   - [ ] Premios
   - [ ] Inscripción directa

4. **Formulario de Creación/Edición** (`/hackathones/nuevo`, `/hackathones/[id]/editar`)
   - [ ] Formulario completo con validación
   - [ ] Subida de imágenes/logos
   - [ ] Editor de descripción enriquecida
   - [ ] Configuración de fechas y reglas

---

### Fase 2: Gestión de Equipos 👥 (Prioridad Alta)

#### Backend
1. **Módulo de Equipos**
   - [ ] Crear entidad `Team` con TypeORM
   - [ ] Relaciones: Team ↔ User (muchos a muchos)
   - [ ] Relaciones: Team ↔ Hackathon
   - [ ] Endpoints para:
     - Crear equipo
     - Invitar miembros
     - Aceptar/rechazar invitaciones
     - Listar equipos del usuario
     - Ver detalle de equipo
     - Actualizar equipo
     - Eliminar equipo
     - Abandonar equipo

#### Frontend
2. **Página de Equipos** (`/equipos`)
   - [ ] Mis equipos
   - [ ] Invitaciones pendientes
   - [ ] Crear nuevo equipo
   - [ ] Buscar equipos públicos

3. **Página de Detalle de Equipo** (`/equipos/[id]`)
   - [ ] Información del equipo
   - [ ] Lista de miembros con roles
   - [ ] Proyectos del equipo
   - [ ] Chat del equipo (opcional)
   - [ ] Gestión de miembros (para líder)

---

### Fase 3: Gestión de Proyectos 💻 (Prioridad Alta)

#### Backend
1. **Módulo de Proyectos**
   - [ ] Crear entidad `Project` con TypeORM
   - [ ] Relaciones: Project ↔ Team
   - [ ] Relaciones: Project ↔ Hackathon
   - [ ] Endpoints para:
     - Crear proyecto
     - Subir archivos (código, documentación)
     - Actualizar proyecto
     - Ver proyectos del hackathon
     - Ver detalle de proyecto

#### Frontend
2. **Página de Proyectos** (`/proyectos`)
   - [ ] Mis proyectos
   - [ ] Proyectos del equipo
   - [ ] Estado de entrega
   - [ ] Crear nuevo proyecto

3. **Página de Detalle de Proyecto** (`/proyectos/[id]`)
   - [ ] Información del proyecto
   - [ ] Enlaces a repositorio
   - [ ] Archivos adjuntos
   - [ ] Descripción y tecnologías
   - [ ] Evaluaciones recibidas (si aplica)

4. **Formulario de Proyecto** (`/proyectos/nuevo`)
   - [ ] Campos: nombre, descripción, tecnologías
   - [ ] Link a repositorio GitHub
   - [ ] Subida de archivos
   - [ ] Asociar a hackathon y equipo

---

### Fase 4: Desafíos 🏆 (Prioridad Media)

#### Backend
1. **Módulo de Desafíos**
   - [ ] Crear entidad `Challenge` con TypeORM
   - [ ] Relaciones: Challenge ↔ Hackathon
   - [ ] Endpoints para:
     - Crear desafío (ORGANIZADOR)
     - Listar desafíos de hackathon
     - Ver detalle de desafío
     - Actualizar desafío
     - Eliminar desafío

#### Frontend
2. **Página de Desafíos** (`/desafios`)
   - [ ] Lista de desafíos por hackathon
   - [ ] Filtros por categoría/dificultad
   - [ ] Estado de completitud

3. **Página de Detalle de Desafío** (`/desafios/[id]`)
   - [ ] Descripción completa
   - [ ] Criterios de evaluación
   - [ ] Recursos sugeridos
   - [ ] Equipos que están trabajando en él

---

### Fase 5: Sistema de Evaluaciones ⭐ (Prioridad Media)

#### Backend
1. **Módulo de Evaluaciones**
   - [ ] Crear entidad `Evaluation` con TypeORM
   - [ ] Relaciones: Evaluation ↔ Project
   - [ ] Relaciones: Evaluation ↔ Judge (User)
   - [ ] Endpoints para:
     - Asignar jueces a proyectos (ORGANIZADOR)
     - Crear evaluación (JUEZ)
     - Ver evaluaciones de un proyecto
     - Calcular puntaje final
     - Ranking de proyectos

#### Frontend
2. **Página de Evaluaciones** (`/evaluaciones`)
   - [ ] Para JUEZ: Proyectos asignados para evaluar
   - [ ] Para ORGANIZADOR: Gestión de evaluaciones
   - [ ] Para CAMPISTA: Ver evaluaciones recibidas (si aplica)

3. **Formulario de Evaluación** (`/evaluaciones/nuevo`)
   - [ ] Criterios de evaluación configurables
   - [ ] Puntajes por categoría
   - [ ] Comentarios
   - [ ] Guardar como borrador
   - [ ] Enviar evaluación final

4. **Página de Rankings** (`/rankings`)
   - [ ] Tabla de posiciones por hackathon
   - [ ] Filtros por categoría
   - [ ] Visualización de puntajes

---

### Fase 6: Mejoras y Funcionalidades Adicionales 🚀 (Prioridad Baja)

1. **Sistema de Notificaciones**
   - [ ] Notificaciones en tiempo real (WebSocket)
   - [ ] Notificaciones por email
   - [ ] Centro de notificaciones en el header

2. **Integración con SIGA**
   - [ ] Autenticación con SIGA
   - [ ] Sincronización de datos de campistas
   - [ ] Validación de documentos

3. **Integración con Moodle** (Opcional)
   - [ ] Importar información de cursos
   - [ ] Vincular hackathones con cursos

4. **Sistema de Archivos (MinIO)**
   - [ ] Subida de logos de hackathones
   - [ ] Archivos adjuntos en proyectos
   - [ ] Imágenes de perfil de usuarios

5. **Dashboard Mejorado**
   - [ ] Gráficas de estadísticas
   - [ ] Calendario de eventos
   - [ ] Actividad reciente detallada
   - [ ] Métricas en tiempo real

6. **Perfil de Usuario**
   - [ ] Página de perfil completo
   - [ ] Editar información personal
   - [ ] Cambiar contraseña
   - [ ] Ver historial de participaciones
   - [ ] Insignias y logros

7. **Búsqueda Global**
   - [ ] Buscar hackathones, equipos, proyectos
   - [ ] Autocompletado
   - [ ] Filtros avanzados

8. **Sistema de Chat** (Opcional)
   - [ ] Chat de equipo
   - [ ] Mensajes directos
   - [ ] Canal general del hackathon

---

## Estructura de Desarrollo Recomendada

### Por Módulo (Vertical)
Para cada funcionalidad seguir este orden:
1. ✅ Diseñar entidades y relaciones (Backend)
2. ✅ Implementar DTOs y validaciones (Backend)
3. ✅ Crear servicios y repositorios (Backend)
4. ✅ Desarrollar controladores y endpoints (Backend)
5. ✅ Documentar en Swagger (Backend)
6. ✅ Crear servicios de API (Frontend)
7. ✅ Implementar componentes UI (Frontend)
8. ✅ Conectar con backend (Frontend)
9. ✅ Pruebas manuales
10. ✅ Refinamiento y correcciones

### Orden Sugerido de Implementación
1. **Hackathones** (base del sistema)
2. **Equipos** (necesario para proyectos)
3. **Proyectos** (entrega de trabajos)
4. **Desafíos** (contexto de los proyectos)
5. **Evaluaciones** (calificación)
6. **Mejoras adicionales** (UX y features extra)

---

## Tecnologías a Implementar

### Backend
- TypeORM (ORM para SQLite)
- Class Validator (validación de DTOs)
- JWT Strategy (autenticación)
- Multer (subida de archivos)
- MinIO/S3 (almacenamiento de archivos)
- Socket.IO (WebSockets para notificaciones)
- Nodemailer (emails)

### Frontend
- React Hook Form (formularios)
- Zod o Yup (validación de formularios)
- React Query/SWR (cache y estado del servidor)
- Zustand o Context API (estado global)
- Chart.js o Recharts (gráficas)
- Date-fns (manejo de fechas)
- React Dropzone (subida de archivos)
- Socket.IO Client (WebSockets)

---

## Convenciones de Código

### Backend
```typescript
// Nomenclatura de archivos
hackathons.controller.ts
hackathons.service.ts
hackathon.entity.ts
create-hackathon.dto.ts

// Nomenclatura de clases
export class Hackathon { }
export class CreateHackathonDto { }
export class HackathonsController { }
export class HackathonsService { }
```

### Frontend
```typescript
// Nomenclatura de archivos
HackathonCard.tsx       // Componentes
hackathonService.ts     // Servicios
useHackathons.ts        // Hooks personalizados
hackathonTypes.ts       // Tipos

// Nomenclatura de rutas
/hackathones            // Lista
/hackathones/[id]       // Detalle
/hackathones/nuevo      // Crear
/hackathones/[id]/editar // Editar
```

---

## Próxima Sesión de Desarrollo

### Recomendación: Empezar con Hackathones

**Tareas para la próxima sesión:**
1. Crear entidad `Hackathon` en el backend
2. Implementar DTOs de creación y actualización
3. Desarrollar servicio con CRUD completo
4. Crear controlador con endpoints
5. Documentar en Swagger
6. Crear página de lista de hackathones en frontend
7. Implementar formulario de creación (solo organizadores)

**Estimación:** 2-3 horas de desarrollo

---

## Recursos Útiles

- **Documentación NestJS:** https://docs.nestjs.com
- **Documentación TypeORM:** https://typeorm.io
- **Documentación Next.js:** https://nextjs.org/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **React Hook Form:** https://react-hook-form.com

---

*Última actualización: 2025-10-16*
*Estado: Sistema base funcionando, listo para implementar módulos principales*
