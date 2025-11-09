# 🏆 HackatonTech2 - Plataforma de Gestión de Hackathones

![Hackathon](https://img.shields.io/badge/Hackathon-Platform-b64cff?style=for-the-badge)
![NestJS](https://img.shields.io/badge/Backend-NestJS-e0234e?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Frontend-Next.js-000000?style=for-the-badge)

Plataforma completa para la gestión de hackathones, equipos, retos, entregas y evaluaciones.

## 🚀 Inicio Rápido

### Requisitos Previos
- Node.js 18+
- PostgreSQL 14+
- npm o yarn

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/hackatonTech2.git
cd hackatonTech2

# Instalar dependencias del backend
cd backend
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Ejecutar migraciones
npm run migration:run

# Iniciar backend
npm run start:dev

# En otra terminal, instalar y ejecutar frontend
cd ../frontend
npm install
npm run dev
```

### Acceso
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **Swagger Docs**: http://localhost:3001/api/docs

## 📚 Documentación Completa

Para entender cómo usar el sistema completo, pruebas end-to-end y flujo de trabajo:

👉 **[Ver GUIA_SISTEMA_COMPLETO.md](./GUIA_SISTEMA_COMPLETO.md)**

## 🎯 Características Principales

### ✅ Gestión de Hackathones
- Crear y administrar hackathones
- Categorías por temas de interés
- Fechas de inicio y fin
- Estados: Pendiente, En Progreso, Finalizado

### ✅ Sistema de Retos
- Crear retos con porcentajes (suma debe ser 100%)
- Validación automática de porcentajes
- Dificultad: Fácil, Medio, Difícil, Experto
- Criterios de evaluación mediante rúbricas

### ✅ Equipos
- Creación y gestión de equipos
- Sistema de líderes y miembros
- Asignación por categorías
- Múltiples equipos por usuario

### ✅ Sistema de Entregas
- Subir entregas con título, descripción y archivos
- Estados: Borrador, Enviada, En Revisión, Evaluada
- Soporte para PDFs, URLs de repos, demos y videos
- Tecnologías utilizadas

### ✅ Evaluación por Jueces
- Asignación de jueces a hackathones
- Evaluación mediante rúbricas ponderadas
- Cálculo automático de puntajes
- Restricción: jueces solo ven sus hackathones asignados

### ✅ Tabla de Posiciones (Leaderboard)
- Ranking por reto
- Ranking general del hackathon
- Cálculo basado en porcentajes
- Visualización en tiempo real

### ✅ Seguridad
- Autenticación JWT
- Roles: Campista, Juez, Organizador
- Cambio obligatorio de contraseña en primer acceso
- Permisos granulares por rol

## 🎨 Diseño

Diseño moderno con colores personalizables:
- 🟣 Purple Primary: `#b64cff`
- 🔵 Cyan Accent: `#00ffff`
- ⚫ Dark Background: `#12013e`
- 🔷 Navy: `#1d1d3e`

## 🏗️ Tecnologías

### Backend
- **NestJS** - Framework Node.js
- **TypeORM** - ORM para PostgreSQL
- **PostgreSQL** - Base de datos
- **Passport JWT** - Autenticación
- **Swagger** - Documentación API
- **Class Validator** - Validaciones

### Frontend
- **Next.js 14** - Framework React
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos
- **React Hot Toast** - Notificaciones
- **Lucide Icons** - Iconografía

## 📁 Estructura del Proyecto

```
hackatonTech2/
├── backend/              # API NestJS
│   ├── src/
│   │   ├── auth/        # Autenticación y autorización
│   │   ├── hackathons/  # Gestión de hackathones
│   │   ├── challenges/  # Retos
│   │   ├── teams/       # Equipos
│   │   ├── submissions/ # Entregas
│   │   ├── evaluations/ # Evaluaciones
│   │   └── entities/    # Entidades TypeORM
│   └── uploads/         # Archivos subidos
│
├── frontend/            # App Next.js
│   ├── src/
│   │   ├── app/        # Pages (App Router)
│   │   ├── components/ # Componentes reutilizables
│   │   ├── contexts/   # Context API
│   │   ├── services/   # Servicios API
│   │   └── types/      # Tipos TypeScript
│
└── GUIA_SISTEMA_COMPLETO.md  # 📖 Documentación completa
```

## 👥 Roles y Permisos

### 🎓 CAMPISTA
- Crear y unirse a equipos
- Subir entregas para retos
- Ver sus calificaciones
- Ver leaderboard

### ⚖️ JUEZ
- Ver solo hackathones asignados
- Ver solo equipos asignados
- Evaluar entregas usando rúbricas
- NO puede crear equipos ni entregas

### 👨‍💼 ORGANIZADOR
- Crear y gestionar hackathones
- Crear retos y rúbricas
- Asignar jueces
- Ver todas las entregas y evaluaciones
- Gestionar equipos y categorías

## 🧪 Pruebas

Sigue el flujo completo de prueba en la [Guía del Sistema](./GUIA_SISTEMA_COMPLETO.md#-escenario-de-prueba-completo).

## 📝 Variables de Entorno

### Backend (.env)
```env
# Base de datos
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=tu_password
DATABASE_NAME=hackatontech2

# JWT
JWT_SECRET=tu_secret_jwt_super_seguro
JWT_EXPIRATION=7d

# Otros
PORT=3001
NODE_ENV=development
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está disponible bajo licencia MIT.

## 📧 Contacto

HackatonTech2 Platform

---

**¡Lee la [Guía Completa del Sistema](./GUIA_SISTEMA_COMPLETO.md) para información detallada!** 📖
