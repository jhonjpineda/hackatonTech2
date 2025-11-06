# 🚀 Cómo Iniciar HackatonTech2

## ⚠️ IMPORTANTE: Bug de Prisma en Git Bash

Existe un bug conocido de Prisma en entornos Windows MSYS/Git Bash que impide que el servidor inicie correctamente. **La solución es usar PowerShell o CMD nativo de Windows.**

## 📋 Pasos para Iniciar el Sistema

### 1️⃣ Verificar que Docker esté corriendo

Los servicios de base de datos deben estar activos:

```powershell
docker ps
```

Deberías ver corriendo:
- hackatontech2_postgres (puerto 5432)
- hackatontech2_redis (puerto 6379)
- hackatontech2_minio (puerto 9000-9001)

Si NO están corriendo, inícielos con:

```powershell
cd "D:\1 Talento Tech\hackatonTech2\backend"
docker-compose up -d
```

### 2️⃣ Iniciar el Backend

**Abre PowerShell o CMD (NO Git Bash)** y ejecuta:

```powershell
cd "D:\1 Talento Tech\hackatonTech2\backend"
npm run start:dev
```

Espera a ver el mensaje:
```
🚀 Application is running on: http://localhost:3001/api
📚 Swagger docs: http://localhost:3001/api/docs
```

### 3️⃣ Iniciar el Frontend

**Abre otra ventana de PowerShell o CMD** y ejecuta:

```powershell
cd "D:\1 Talento Tech\hackatonTech2\frontend"
npm run dev
```

Espera a ver:
```
▲ Next.js 14.2.33
- Local:        http://localhost:3000
✓ Ready in X.Xs
```

## 🌐 URLs del Sistema

- **Frontend (Aplicación Web)**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **Documentación Swagger**: http://localhost:3001/api/docs
- **Health Check**: http://localhost:3001/api/health

## 🔐 Probar el Sistema

1. Abre tu navegador en http://localhost:3000
2. Verás la página de login
3. Haz clic en "Regístrate aquí" para crear una cuenta
4. Completa el formulario:
   - Documento: cualquier número
   - Nombres: tu nombre
   - Apellidos: tus apellidos
   - Email: tu email
   - Contraseña: mínimo 6 caracteres
   - Teléfono: opcional

5. Después del registro, serás redirigido automáticamente al Dashboard

## 📊 Servicios de Base de Datos

| Servicio | Puerto | Usuario | Contraseña | Base de Datos |
|----------|--------|---------|------------|---------------|
| PostgreSQL | 5432 | postgres | password123 | hackatontech2_dev |
| Redis | 6379 | - | - | - |
| MinIO | 9000 | minioadmin | minioadmin123 | - |
| pgAdmin | 5050 | admin@admin.com | admin | - |

## 🛑 Detener los Servidores

Para detener el backend/frontend: **Ctrl + C** en la ventana de PowerShell

Para detener Docker:
```powershell
cd "D:\1 Talento Tech\hackatonTech2\backend"
docker-compose down
```

## ❓ Problemas Comunes

### "Internal Server Error" en /api o /api/docs

**Causa**: El backend no se inició correctamente desde Git Bash

**Solución**: Cierra Git Bash y usa PowerShell o CMD para iniciar el backend

### "ERR_CONNECTION_REFUSED"

**Causa**: El servidor no está corriendo

**Solución**: Verifica que ejecutaste `npm run start:dev` y espera el mensaje de éxito

### Error de base de datos

**Causa**: Docker no está corriendo o PostgreSQL no inició

**Solución**:
```powershell
docker ps  # Verifica que los contenedores estén corriendo
docker-compose up -d  # Si no están corriendo, inícielos
```

## 📚 Endpoints Disponibles

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión
- `GET /api/auth/me` - Usuario actual (requiere token)
- `POST /api/auth/refresh` - Refrescar token
- `POST /api/auth/logout` - Cerrar sesión

### Health
- `GET /api` - Health check básico
- `GET /api/health` - Health check detallado

## ✅ Todo Implementado

- ✅ Sistema de autenticación completo (JWT)
- ✅ Registro e inicio de sesión
- ✅ Dashboard de usuario
- ✅ Base de datos PostgreSQL con 19 tablas
- ✅ Validación de formularios
- ✅ Encriptación de contraseñas
- ✅ Documentación Swagger automática
- ✅ Frontend responsivo con TailwindCSS

¡El sistema está listo para usar! 🎉
