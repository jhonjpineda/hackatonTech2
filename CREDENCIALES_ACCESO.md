# Credenciales de Acceso - HackatonTech2

## URLs del Sistema

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001/api
- **Swagger Docs:** http://localhost:3001/api/docs

---

## Usuarios de Prueba

### 👤 Usuario Regular (Campista)
```
Email: juan@test.com
Password: [la que creaste durante el registro]
Rol: CAMPISTA
Documento: 123456789
```

Este usuario puede:
- Ver hackathones disponibles
- Crear/unirse a equipos
- Subir proyectos
- Ver evaluaciones recibidas
- Participar en desafíos

---

### 👨‍💼 Usuario Administrador (Organizador)
```
Email: admin@hackatontech2.com
Password: Admin123!
Rol: ORGANIZADOR
Documento: ADMIN001
```

Este usuario puede:
- **Crear y gestionar hackathones**
- **Crear desafíos**
- **Asignar jueces**
- Ver todos los proyectos
- Ver todas las evaluaciones
- Gestionar usuarios (futuro)
- Acceder a estadísticas completas

---

## Cómo Acceder

### 1. Iniciar Sesión como Administrador

1. Abre http://localhost:3000/login
2. Ingresa las credenciales del administrador:
   - Email: `admin@hackatontech2.com`
   - Password: `Admin123!`
3. Serás redirigido al dashboard

### 2. Ver Perfil de Administrador

En el dashboard verás:
- Tu nombre: **Administrador Sistema**
- Tu rol: **ORGANIZADOR**
- Todas las opciones del sidebar disponibles

### 3. Diferencias entre Roles

El sidebar muestra las mismas opciones para todos, pero:
- **ORGANIZADOR:** Puede crear/editar/eliminar hackathones, desafíos, y gestionar el sistema
- **JUEZ:** Puede evaluar proyectos asignados
- **CAMPISTA:** Puede participar, crear equipos, y subir proyectos

---

## Próximos Pasos Recomendados

Una vez autenticado como administrador, el siguiente paso es:

1. **Implementar el módulo de Hackathones** para que puedas crear tu primer hackathon
2. **Implementar el módulo de Equipos** para permitir a los campistas formar equipos
3. **Implementar el módulo de Proyectos** para que los equipos puedan subir sus trabajos

Consulta el archivo `PLAN_DESARROLLO.md` para ver el roadmap completo del proyecto.

---

## Comandos Útiles

### Iniciar el Backend
```bash
cd "d:\1 Talento Tech\hackatonTech2\backend"
npm run start:dev
```

### Iniciar el Frontend
```bash
cd "d:\1 Talento Tech\hackatonTech2\frontend"
npm run dev
```

### Crear Más Usuarios Administradores
```bash
cd "d:\1 Talento Tech\hackatonTech2\backend"
npm run seed
```

---

## Estado Actual del Sistema ✅

- ✅ Backend API funcionando
- ✅ Frontend con Tailwind CSS
- ✅ Sistema de autenticación completo
- ✅ Usuarios con roles
- ✅ Dashboard profesional
- ✅ Navegación por sidebar
- ✅ Base de datos SQLite configurada

**Listo para continuar con el desarrollo de los módulos principales!** 🚀

---

*Última actualización: 2025-10-16*
