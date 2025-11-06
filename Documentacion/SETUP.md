# 🚀 Guía de Configuración - HackatonTech2

Esta guía te ayudará a configurar el proyecto HackatonTech2 desde cero.

## 📋 Requisitos Previos

- **Node.js**: v20.8.0 o superior
- **npm**: v10.1.0 o superior
- **Python**: v3.11 o superior (para scripts auxiliares)
- **Git**: Para clonar el repositorio

## 🔧 Configuración del Backend

### 1. Instalación de Dependencias

```bash
cd backend
npm install
```

### 2. Configuración de Variables de Entorno

Copia el archivo `.env.example` a `.env`:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales:

```env
# Configuración mínima para desarrollo
NODE_ENV=development
PORT=5000

# JWT (CAMBIAR EN PRODUCCIÓN)
JWT_SECRET=tu-clave-secreta-super-segura
JWT_REFRESH_SECRET=tu-clave-refresh-super-segura

# SIGA (Obtener credenciales del administrador)
SIGA_API_URL=https://siga.talentotech2.com.co/api
SIGA_API_KEY=tu-api-key-de-siga

# EMAIL (Opcional - Para desarrollo usa modo MOCK)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-app-password

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 3. Configurar Email (Opcional para Desarrollo)

#### Opción A: Modo MOCK (Recomendado para desarrollo)

**No necesitas configurar nada.** Los emails se imprimirán en la consola.

#### Opción B: Usar Gmail

1. Habilita **Verificación en 2 pasos** en tu cuenta de Gmail
2. Genera una **Contraseña de aplicación**:
   - Ve a: https://myaccount.google.com/apppasswords
   - Genera una contraseña para "Mail"
3. Usa esa contraseña en `EMAIL_PASSWORD`

### 4. Inicializar Base de Datos

El proyecto usa SQLite por defecto (desarrollo). La base de datos se crea automáticamente.

**Ejecutar seeds (datos iniciales):**

```bash
npm run seed
```

Esto creará:
- ✅ 6 Topics (Programas de Interés)
- ✅ 3 Usuarios de prueba:
  - **Organizador**: `organizador@hackatontech.com` / `Password123!`
  - **Juez**: `juez@hackatontech.com` / `Password123!`
  - **Campista**: `campista@hackatontech.com` / `Password123!`

### 5. Iniciar el Servidor

**Modo desarrollo (con hot-reload):**

```bash
npm run start:dev
```

**Modo producción:**

```bash
npm run build
npm run start:prod
```

El servidor estará disponible en: `http://localhost:5000`

### 6. Verificar la API

Documentación Swagger: `http://localhost:5000/api/docs`

---

## 🎨 Configuración del Frontend

### 1. Instalación de Dependencias

```bash
cd frontend
npm install
```

### 2. Configuración de Variables de Entorno

Copia el archivo `.env.local.example` a `.env.local`:

```bash
cp .env.local.example .env.local
```

Edita el archivo `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

### 3. Iniciar el Servidor

**Modo desarrollo:**

```bash
npm run dev
```

**Modo producción:**

```bash
npm run build
npm run start
```

La aplicación estará disponible en: `http://localhost:3000`

---

## 🧪 Testing

### Backend

```bash
cd backend

# Tests unitarios
npm run test

# Tests con cobertura
npm run test:cov

# Tests e2e
npm run test:e2e
```

### Frontend

```bash
cd frontend

# Tests con Jest
npm run test

# Tests en modo watch
npm run test:watch
```

---

## 📊 Base de Datos

### SQLite (Desarrollo)

El archivo de base de datos se crea en: `backend/database.sqlite`

**Ver/Editar la base de datos:**

Puedes usar herramientas como:
- [DB Browser for SQLite](https://sqlitebrowser.org/)
- [SQLite Viewer (VS Code Extension)](https://marketplace.visualstudio.com/items?itemName=qwtel.sqlite-viewer)

### Migraciones (Si usas PostgreSQL en producción)

```bash
cd backend

# Generar migración
npm run migration:generate -- -n NombreMigracion

# Ejecutar migraciones
npm run migration:run

# Revertir última migración
npm run migration:revert
```

---

## 🔐 Configuración de SIGA

### Obtener Credenciales

Contacta al administrador de SIGA para obtener:

- `SIGA_API_URL`: URL base de la API
- `SIGA_API_KEY`: Clave de autenticación
- `SIGA_CLIENT_ID`: ID del cliente (si aplica)
- `SIGA_SECRETO`: Secreto del cliente (si aplica)

### Endpoints de SIGA Utilizados

El sistema consume los siguientes endpoints de SIGA:

1. **Autenticación**: `POST /auth/token`
2. **Reporte 1003**: `GET /reportes/reporte1003`
3. **Validar Usuario**: `GET /usuarios/:documento`

### Mapeo de Programas SIGA → Topics

El sistema mapea automáticamente:

| Programa SIGA | Topic Sistema |
|---------------|---------------|
| INTELIGENCIA ARTIFICIAL | Inteligencia Artificial |
| ANALISIS DE DATOS | Análisis de Datos |
| PROGRAMACION | Programación |
| BLOCKCHAIN | Blockchain |
| CIBERSEGURIDAD | Ciberseguridad |
| ARQUITECTURA EN LA NUBE | Arquitectura en la Nube |

---

## 🐳 Docker (Opcional)

Si prefieres usar Docker:

```bash
# Construir contenedores
docker-compose build

# Iniciar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down
```

---

## 📱 Acceso a la Aplicación

### URLs Principales

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Swagger Docs**: http://localhost:5000/api/docs

### Usuarios de Prueba

Después de ejecutar los seeds, puedes usar:

| Email | Contraseña | Rol |
|-------|-----------|-----|
| organizador@hackatontech.com | Password123! | Organizador |
| juez@hackatontech.com | Password123! | Juez |
| campista@hackatontech.com | Password123! | Campista |

---

## 🔍 Troubleshooting

### Error: "Cannot find module"

```bash
# Eliminar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Error: "Port already in use"

```bash
# Backend (puerto 5000)
lsof -ti:5000 | xargs kill -9

# Frontend (puerto 3000)
lsof -ti:3000 | xargs kill -9
```

### Error de conexión con SIGA

1. Verifica que las credenciales sean correctas
2. Verifica que la URL de SIGA sea accesible
3. Revisa los logs: `backend/logs/`

### Emails no se envían

En desarrollo, los emails se imprimen en la consola del backend. Busca:

```
[MOCK EMAIL] To: usuario@example.com
[MOCK EMAIL] Content: ...
```

---

## 📚 Recursos Adicionales

- [Documentación de NestJS](https://docs.nestjs.com/)
- [Documentación de Next.js](https://nextjs.org/docs)
- [TypeORM Docs](https://typeorm.io/)
- [Documentación del Proyecto](./README.md)

---

## 🤝 Soporte

Si tienes problemas, contacta al equipo de desarrollo o abre un issue en el repositorio.

---

**Última actualización**: Octubre 2025
