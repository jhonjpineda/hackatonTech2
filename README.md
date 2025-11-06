# HackatonTech2 - Plataforma de Gestión de Hackathones

Plataforma completa para gestionar hackathones, equipos, desafíos y evaluaciones desarrollada con NestJS y Next.js.

## 🚀 Características Principales

- **Gestión de Hackathones**: Crear, publicar y administrar hackathones
- **Gestión de Equipos**: Formar equipos, agregar miembros, categorías
- **Desafíos**: Crear retos con diferentes niveles de dificultad
- **Sistema de Entregas**: Equipos pueden subir soluciones en PDF
- **Sistema de Jueces**: Asignar jueces a hackathones para evaluar entregas
- **Roles de Usuario**: CAMPISTA, JUEZ, ORGANIZADOR
- **Integración SIGA**: Sincronización con sistema externo
- **Sistema de Rúbricas**: Evaluación estructurada

## 🛠️ Tecnologías

### Backend
- NestJS
- TypeORM
- SQLite
- JWT Authentication
- Nodemailer
- Swagger/OpenAPI

### Frontend
- Next.js 14 (App Router)
- React 18
- TypeScript
- TailwindCSS
- React Hot Toast
- Date-fns

## 📋 Prerequisitos

- Node.js 18+
- npm o yarn

## 🔧 Instalación

### Backend

```bash
cd backend
npm install
```

Crear archivo `.env` en `backend/`:

```env
NODE_ENV=development
PORT=3001
JWT_SECRET=tu_secret_key_aqui
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10

# Email (opcional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASSWORD=tu_password
EMAIL_FROM=noreply@hackatontech.com

# Frontend URL
FRONTEND_URL=http://localhost:3000

# SIGA Integration (opcional)
SIGA_API_URL=http://siga-api.example.com
```

### Frontend

```bash
cd frontend
npm install
```

Crear archivo `.env.local` en `frontend/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## 🚀 Ejecución

### Desarrollo

**Backend:**
```bash
cd backend
npm run start:dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

Acceder a:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- Swagger Docs: http://localhost:3001/api-docs

### Producción

**Backend:**
```bash
cd backend
npm run build
npm run start:prod
```

**Frontend:**
```bash
cd frontend
npm run build
npm run start
```

## 👥 Roles de Usuario

### CAMPISTA
- Registrarse e inscribirse en hackathones
- Crear y unirse a equipos
- Subir entregas para desafíos
- Ver calificaciones

### JUEZ
- Ver hackathones asignados
- Acceder a entregas de equipos asignados
- Evaluar entregas usando rúbricas
- Proporcionar retroalimentación

### ORGANIZADOR
- Crear y gestionar hackathones
- Crear desafíos y rúbricas
- Crear usuarios jueces
- Asignar jueces a hackathones
- Ver todas las entregas y evaluaciones

## 📚 Documentación Adicional

- [Sistema de Jueces Completo](SISTEMA_JUECES_COMPLETO.md)
- [Implementación de Submissions](RESUMEN_IMPLEMENTACION_SUBMISSIONS.md)
- [Solución Desafíos y Entregas](SOLUCION_DESAFIOS_Y_ENTREGAS.md)
- [Funcionalidad Agregar Miembros](FUNCIONALIDAD_AGREGAR_MIEMBROS.md)

## 🗂️ Estructura del Proyecto

```
hackatonTech2/
├── backend/
│   ├── src/
│   │   ├── auth/              # Autenticación y autorización
│   │   ├── hackathons/        # Gestión de hackathones
│   │   ├── categories/        # Categorías de hackathones
│   │   ├── teams/             # Gestión de equipos
│   │   ├── challenges/        # Desafíos/retos
│   │   ├── submissions/       # Entregas de equipos
│   │   ├── evaluations/       # Evaluaciones de jueces
│   │   ├── rubrics/           # Rúbricas de evaluación
│   │   ├── judge-assignments/ # Asignación de jueces
│   │   ├── topics/            # Temas de interés
│   │   ├── email/             # Servicio de emails
│   │   ├── upload/            # Subida de archivos
│   │   ├── siga/              # Integración SIGA
│   │   └── entities/          # Entidades TypeORM
│   └── database.sqlite        # Base de datos SQLite
│
└── frontend/
    ├── src/
    │   ├── app/               # App Router (Next.js 14)
    │   │   ├── admin/         # Páginas de administración
    │   │   ├── juez/          # Panel de jueces
    │   │   ├── equipos/       # Gestión de equipos
    │   │   ├── desafios/      # Vista de desafíos
    │   │   └── hackathones/   # Vista de hackathones
    │   ├── components/        # Componentes reutilizables
    │   ├── services/          # Servicios API
    │   ├── types/             # Tipos TypeScript
    │   └── lib/               # Utilidades
    └── public/                # Archivos estáticos
```

## 🔐 Seguridad

- Autenticación JWT
- Guards de roles (RolesGuard)
- Validación de permisos en backend y frontend
- Contraseñas hasheadas con bcrypt
- CORS configurado
- Validación de datos de entrada

## 🧪 Características Implementadas

- ✅ Autenticación y autorización
- ✅ Gestión de hackathones
- ✅ Gestión de equipos
- ✅ Agregar miembros a equipos
- ✅ Desafíos y rúbricas
- ✅ Sistema de entregas (PDF)
- ✅ Creación de usuarios jueces
- ✅ Asignación de jueces a hackathones
- ✅ Panel de jueces para ver entregas
- ⏳ Sistema de calificación/evaluación (próximo)

## 📝 Licencia

Este proyecto fue desarrollado para Talento Tech.

## 👨‍💻 Desarrollo

Proyecto desarrollado con Claude Code.
