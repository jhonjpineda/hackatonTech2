# ⚡ Quick Start - HackatonTech2

Guía rápida para tener el proyecto funcionando en **5 minutos**.

---

## 🚀 Inicio Rápido

### 1. Clonar Repositorio (Si aplica)

```bash
git clone <repo-url>
cd hackatonTech2
```

### 2. Backend

```bash
cd backend

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env

# Iniciar servidor
npm run start:dev
```

✅ **Backend corriendo en**: http://localhost:5000

### 3. Frontend (En otra terminal)

```bash
cd frontend

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.local.example .env.local

# Iniciar aplicación
npm run dev
```

✅ **Frontend corriendo en**: http://localhost:3000

---

## 🎯 Datos de Prueba

### Crear Datos Iniciales (Seeds)

```bash
cd backend
npm run seed
```

Esto crea:
- ✅ 6 Topics (Programas de interés)
- ✅ 3 Usuarios de prueba

### Credenciales de Acceso

| Rol | Email | Contraseña |
|-----|-------|------------|
| **Organizador** | organizador@hackatontech.com | Password123! |
| **Juez** | juez@hackatontech.com | Password123! |
| **Campista** | campista@hackatontech.com | Password123! |

---

## 🧪 Probar la API

### Opción 1: Swagger UI

Visita: http://localhost:5000/api/docs

### Opción 2: cURL

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "documento": "1000000003",
    "password": "Password123!"
  }'

# Obtener perfil (reemplaza {TOKEN})
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer {TOKEN}"
```

---

## 📧 Configurar Email (Opcional)

Por defecto, los emails se imprimen en la consola del backend.

**Para usar email real (Gmail):**

1. Edita `backend/.env`:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-app-password
```

2. Genera App Password en Gmail:
   https://myaccount.google.com/apppasswords

---

## 🔐 Configurar SIGA (Cuando tengas credenciales)

Edita `backend/.env`:

```env
SIGA_API_URL=https://siga.talentotech2.com.co/api
SIGA_API_KEY=tu-api-key
```

---

## ✅ Verificar Instalación

### Backend ✅

- [ ] Servidor inicia sin errores
- [ ] Swagger disponible en /api/docs
- [ ] Login funciona con usuario de prueba
- [ ] Seeds ejecutados correctamente

### Frontend ✅

- [ ] Aplicación abre en localhost:3000
- [ ] No hay errores en consola
- [ ] Build exitoso con `npm run build`

---

## 🆘 Problemas Comunes

### Puerto ocupado

```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

### node_modules corrupto

```bash
rm -rf node_modules package-lock.json
npm install
```

### Base de datos no crea

```bash
# Eliminar BD y recrear
rm backend/database.sqlite
cd backend && npm run start:dev
```

---

## 📚 Documentación Completa

- **Configuración Detallada**: [SETUP.md](./Documentacion/SETUP.md)
- **API Completa**: [API_DOCUMENTATION.md](./Documentacion/API_DOCUMENTATION.md)
- **Resumen de Implementación**: [IMPLEMENTATION_SUMMARY.md](./Documentacion/IMPLEMENTATION_SUMMARY.md)

---

## 🎉 ¡Listo!

Tu entorno está configurado y funcionando.

**Próximos pasos:**
1. Explorar la aplicación en http://localhost:3000
2. Probar el login con las credenciales de prueba
3. Revisar la documentación de la API
4. Configurar credenciales SIGA cuando las tengas

---

**¿Problemas?** Consulta [SETUP.md](./Documentacion/SETUP.md) para más detalles.
