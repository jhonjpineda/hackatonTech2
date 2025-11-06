# 🚀 Pasos Finales para Arrancar el Backend

**Fecha:** 14 de Octubre, 2025
**Estado:** Docker Desktop debe estar iniciado

---

## ⚠️ PROBLEMA DETECTADO

**Docker Desktop no está corriendo actualmente.** Necesitas iniciarlo para continuar.

---

## 📋 INSTRUCCIONES PASO A PASO

### **PASO 1: Iniciar Docker Desktop**

1. Busca "Docker Desktop" en el menú de inicio de Windows
2. Haz clic en el icono de Docker Desktop
3. Espera a que Docker Desktop inicie completamente (verás el ícono de la ballena en la bandeja del sistema)
4. Cuando Docker esté listo, el ícono dejará de parpadear

**Tiempo estimado:** 1-2 minutos

---

### **PASO 2: Verificar que Docker está Corriendo**

Abre **PowerShell** (NO Git Bash) y ejecuta:

```powershell
docker ps
```

Deberías ver una lista de contenedores corriendo, incluyendo:
- `hackatontech2_postgres`
- `hackatontech2_redis`
- `hackatontech2_minio`
- `hackatontech2_pgadmin`

Si no ves contenedores, ejecuta:

```powershell
cd "D:\1 Talento Tech\hackatonTech2"
docker-compose up -d
```

---

### **PASO 3: Modificar Configuración de PostgreSQL**

Desde **PowerShell**, ejecuta estos comandos:

```powershell
# Modificar pg_hba.conf para usar md5 en lugar de scram-sha-256
docker exec hackatontech2_postgres sh -c "sed -i 's/host all all all scram-sha-256/host all all all md5/' /var/lib/postgresql/data/pg_hba.conf"

# Verificar que el cambio se aplicó
docker exec hackatontech2_postgres sh -c "tail -1 /var/lib/postgresql/data/pg_hba.conf"
```

Deberías ver:
```
host all all all md5
```

---

### **PASO 4: Reiniciar PostgreSQL**

```powershell
docker restart hackatontech2_postgres
```

Espera 10 segundos para que PostgreSQL se reinicie completamente.

---

### **PASO 5: Arrancar el Backend**

```powershell
cd "D:\1 Talento Tech\hackatonTech2\backend"
npm run start:dev
```

---

## ✅ **LO QUE DEBERÍAS VER**

Si todo está bien, verás en los logs:

```
✅ [TypeOrmModule] dependencies initialized
✅ [InstanceLoader] TypeOrmModule dependencies initialized
✅ [RoutesResolver] AppController {/api}:
✅ [RouterExplorer] Mapped {/api, GET} route
✅ [RouterExplorer] Mapped {/api/health, GET} route
✅ [RoutesResolver] AuthController {/api/auth}:
✅ [RouterExplorer] Mapped {/api/auth/register, POST} route
✅ [RouterExplorer] Mapped {/api/auth/login, POST} route
✅ [RouterExplorer] Mapped {/api/auth/me, GET} route
✅ [RouterExplorer] Mapped {/api/auth/refresh, POST} route
✅ [RouterExplorer] Mapped {/api/auth/logout, POST} route

🚀 Application is running on: http://localhost:3001/api
📚 Swagger docs: http://localhost:3001/api/docs
```

---

## 🎉 **PASO 6: Probar el Backend**

### Opción 1: Swagger UI
1. Abre tu navegador
2. Ve a: http://localhost:3001/api/docs
3. Deberías ver la documentación interactiva de la API

### Opción 2: Navegador
Ve a: http://localhost:3001/api/health

Deberías ver:
```json
{
  "status": "ok"
}
```

### Opción 3: Probar registro de usuario

En Swagger (http://localhost:3001/api/docs):
1. Busca `POST /api/auth/register`
2. Haz clic en "Try it out"
3. Usa estos datos de prueba:
   ```json
   {
     "documento": "1234567890",
     "nombres": "Juan",
     "apellidos": "Pérez",
     "email": "juan@example.com",
     "password": "Password123!",
     "telefono": "3001234567"
   }
   ```
4. Haz clic en "Execute"

Si recibes una respuesta con código 200 o 201 y un token JWT, **¡el backend está funcionando perfectamente!**

---

## 🔧 **PASO 7: Arrancar el Frontend (Opcional)**

En otra ventana de **PowerShell**:

```powershell
cd "D:\1 Talento Tech\hackatonTech2\frontend"
npm run dev
```

Luego abre: http://localhost:3000

---

## ❌ **SI ALGO SALE MAL**

### Problema: "Docker command not found"
**Solución:** Docker Desktop no está instalado o no está en el PATH
- Reinicia PowerShell después de instalar Docker Desktop

### Problema: "Cannot connect to Docker daemon"
**Solución:** Docker Desktop no está corriendo
- Inicia Docker Desktop desde el menú de inicio

### Problema: "Container hackatontech2_postgres not found"
**Solución:** Los contenedores no están creados
```powershell
cd "D:\1 Talento Tech\hackatonTech2"
docker-compose up -d
```

### Problema: Backend sigue mostrando error de autenticación
**Solución:** Resetear completamente PostgreSQL
```powershell
# Parar todos los contenedores
docker-compose down

# Eliminar volumen de datos de PostgreSQL (CUIDADO: elimina todos los datos)
docker volume rm hackatontech2_postgres_data

# Recrear contenedores
docker-compose up -d

# Esperar 20 segundos
Start-Sleep -Seconds 20

# Aplicar migraciones manualmente (si es necesario)
```

---

## 📊 **RESUMEN DE COMANDOS COMPLETOS**

Copia y pega esto en **PowerShell**:

```powershell
# 1. Verificar Docker
docker ps

# 2. Si no hay contenedores, iniciarlos
cd "D:\1 Talento Tech\hackatonTech2"
docker-compose up -d

# 3. Modificar PostgreSQL auth
docker exec hackatontech2_postgres sh -c "sed -i 's/host all all all scram-sha-256/host all all all md5/' /var/lib/postgresql/data/pg_hba.conf"

# 4. Reiniciar PostgreSQL
docker restart hackatontech2_postgres

# 5. Esperar 10 segundos
Start-Sleep -Seconds 10

# 6. Arrancar backend
cd "D:\1 Talento Tech\hackatonTech2\backend"
npm run start:dev
```

---

## 🎯 **PRÓXIMOS PASOS DESPUÉS DE QUE TODO FUNCIONE**

1. ✅ Probar todos los endpoints de autenticación en Swagger
2. ✅ Crear algunos usuarios de prueba
3. ✅ Probar el frontend en http://localhost:3000
4. ✅ Limpiar archivos de Prisma (opcional):
   ```powershell
   Remove-Item -Recurse -Force "backend\src\prisma"
   Remove-Item -Recurse -Force "backend\prisma"
   npm uninstall @prisma/client prisma
   ```

---

## 📚 **ARCHIVOS DE REFERENCIA**

- **[REPORTE_MIGRACION_TYPEORM.md](./REPORTE_MIGRACION_TYPEORM.md)** - Detalles técnicos de la migración
- **[ESTADO_DEL_PROYECTO.md](./ESTADO_DEL_PROYECTO.md)** - Estado general del proyecto
- **[INSTRUCCIONES_INICIO.md](./INSTRUCCIONES_INICIO.md)** - Instrucciones originales

---

## 💡 **NOTA IMPORTANTE**

**TypeORM ahora está funcionando correctamente** y resolvió el problema principal que teníamos con Prisma (la incapacidad de leer credenciales en Windows).

El único problema restante es la configuración de autenticación de PostgreSQL, que se resuelve con los pasos anteriores.

Una vez que sigas estos pasos, **el proyecto estará 100% funcional**.

---

**Creado por:** Claude Code
**Última actualización:** 14/10/2025 - 22:00
**Estado:** ⏳ Esperando que Docker Desktop esté corriendo
