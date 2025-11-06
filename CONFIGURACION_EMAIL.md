# Configuración de Email para HackatonTech2

## 📧 Correo Institucional: `soportetech@ucaldas.edu.co`

Para que el sistema envíe correos electrónicos reales (códigos de verificación, notificaciones, etc.), necesitas configurar las credenciales SMTP en el backend.

---

## 🔍 Paso 1: Identificar el proveedor de correo de UCaldas

Primero, necesitas saber qué proveedor de correo usa UCaldas. Pregunta a tu administrador de TI o verifica en la configuración de tu correo:

### ✅ Opción A: Office 365 (Microsoft Exchange)
Si al entrar a tu correo ves `outlook.office365.com` o `outlook.office.com`, usas **Office 365**.

**Configuración SMTP:**
```env
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=soportetech@ucaldas.edu.co
EMAIL_PASSWORD=tu_contraseña_real
EMAIL_FROM=HackatonTech2 <soportetech@ucaldas.edu.co>
```

### ✅ Opción B: Servidor SMTP Propio de UCaldas
Si UCaldas tiene su propio servidor de correo.

**Configuración SMTP:**
```env
EMAIL_HOST=smtp.ucaldas.edu.co
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=soportetech@ucaldas.edu.co
EMAIL_PASSWORD=tu_contraseña_real
EMAIL_FROM=HackatonTech2 <soportetech@ucaldas.edu.co>
```

> **Nota:** El servidor SMTP podría ser diferente. Consulta con el administrador de sistemas de UCaldas.

### ✅ Opción C: Gmail Institucional (Google Workspace)
Si UCaldas usa Google Workspace (Gmail institucional).

**Configuración SMTP:**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=soportetech@ucaldas.edu.co
EMAIL_PASSWORD=tu_app_password
EMAIL_FROM=HackatonTech2 <soportetech@ucaldas.edu.co>
```

> **IMPORTANTE para Gmail:** No uses la contraseña normal, usa una **App Password**. Ver instrucciones abajo.

---

## 🔐 Paso 2: Obtener credenciales de acceso

### Para Office 365:
1. Usa la contraseña normal de la cuenta `soportetech@ucaldas.edu.co`
2. **Si tiene autenticación de 2 factores (2FA)**, necesitas crear una "App Password":
   - Ir a: https://account.microsoft.com/security
   - Buscar "App passwords"
   - Crear una nueva contraseña de aplicación

### Para Gmail Institucional:
1. **Habilitar "Acceso de aplicaciones menos seguras"** O mejor...
2. **Crear una App Password** (recomendado):
   - Ir a: https://myaccount.google.com/apppasswords
   - Crear una contraseña para "Mail"
   - Usar esa contraseña generada (16 caracteres) en `EMAIL_PASSWORD`

### Para Servidor Propio de UCaldas:
1. Contacta al administrador de sistemas de UCaldas
2. Solicita:
   - Servidor SMTP: `smtp.ucaldas.edu.co` (o el que corresponda)
   - Puerto: Generalmente `587` (TLS) o `465` (SSL)
   - Usuario: `soportetech@ucaldas.edu.co`
   - Contraseña: La contraseña de la cuenta

---

## ⚙️ Paso 3: Configurar el archivo `.env` del backend

1. Abre el archivo: `backend/.env`

2. Busca la sección **EMAIL - NOTIFICACIONES**

3. Edita las variables con tus credenciales reales:

```env
# ==============================================
# EMAIL - NOTIFICACIONES
# ==============================================
EMAIL_HOST=smtp.office365.com               # Cambiar según tu proveedor
EMAIL_PORT=587                              # Puerto SMTP
EMAIL_SECURE=false                          # false para TLS (puerto 587), true para SSL (puerto 465)
EMAIL_USER=soportetech@ucaldas.edu.co       # Tu correo institucional
EMAIL_PASSWORD=TU_CONTRASEÑA_REAL_AQUI      # IMPORTANTE: Reemplazar con tu contraseña
EMAIL_FROM=HackatonTech2 <soportetech@ucaldas.edu.co>  # Nombre y correo del remitente
```

4. **Guarda el archivo**

---

## 🚀 Paso 4: Reiniciar el backend

Después de configurar las credenciales, reinicia el servidor backend:

```bash
cd backend
npm run start:dev
```

Si las credenciales son correctas, verás en los logs:
```
[NestFactory] Starting Nest application...
[EmailService] Email service initialized successfully
```

Si hay un error, verás:
```
[EmailService] WARN: Configuración de email no encontrada. Usando modo MOCK.
```

---

## ✅ Paso 5: Probar el envío de correos

### Prueba 1: Registro de usuario
1. Abre el frontend: http://localhost:3000/register
2. Ingresa un documento válido de SIGA
3. **Deberías recibir un correo REAL** con el código de verificación

### Prueba 2: Endpoint de prueba (opcional)

Puedes crear un endpoint temporal para probar el envío:

```bash
curl -X POST "http://localhost:3001/api/auth/register/siga" \
  -H "Content-Type: application/json" \
  -d '{"documento":"1038646992"}'
```

Si todo está bien configurado, el usuario recibirá un email en `penaospinakevinandres3@gmail.com`.

---

## 🔒 Seguridad: Proteger las credenciales

### ⚠️ IMPORTANTE: NO subir credenciales a Git

1. Verifica que `.env` está en `.gitignore`:

```bash
# En backend/.gitignore debe estar:
.env
.env.local
.env.*.local
```

2. **Nunca hagas commit de las credenciales reales**

3. Para producción, usa variables de entorno del servidor o servicios como:
   - AWS Secrets Manager
   - Azure Key Vault
   - Heroku Config Vars
   - Railway Variables

---

## 🐛 Solución de Problemas

### Error: "Invalid login credentials"
**Causa:** Contraseña incorrecta o 2FA activado
**Solución:**
- Verifica que la contraseña sea correcta
- Si tienes 2FA, usa una App Password

### Error: "Connection timeout"
**Causa:** Servidor SMTP incorrecto o puerto bloqueado
**Solución:**
- Verifica el servidor SMTP con tu administrador
- Prueba con puerto `465` y `EMAIL_SECURE=true`

### Error: "Authentication failed"
**Causa:** Autenticación SMTP no permitida
**Solución:**
- Para Office 365: Habilitar "SMTP AUTH" en el panel de administración
- Para Gmail: Habilitar "Acceso de aplicaciones menos seguras"

### Los correos no llegan
**Posibles causas:**
1. **Spam:** Revisa la carpeta de spam/correo no deseado
2. **Dominio no verificado:** Algunos proveedores requieren verificar el dominio
3. **Límites de envío:** Office 365 tiene límite de ~30 emails/minuto

---

## 📞 Contacto para Soporte

Si tienes problemas con la configuración:

1. **Administrador de TI de UCaldas**: Para obtener credenciales SMTP
2. **Soporte Microsoft (Office 365)**: Si usas Office 365
3. **Documentación del proveedor**: Consulta la documentación SMTP de tu proveedor

---

## 📚 Referencias

- [Nodemailer Documentation](https://nodemailer.com/)
- [Office 365 SMTP Settings](https://learn.microsoft.com/en-us/exchange/mail-flow-best-practices/how-to-set-up-a-multifunction-device-or-application-to-send-email-using-microsoft-365-or-office-365)
- [Gmail SMTP Settings](https://support.google.com/mail/answer/7126229)

---

## ✅ Checklist de Configuración

- [ ] Identificar proveedor de correo de UCaldas
- [ ] Obtener credenciales SMTP (usuario y contraseña/app password)
- [ ] Configurar variables en `backend/.env`
- [ ] Reiniciar servidor backend
- [ ] Verificar logs del backend (sin errores de email)
- [ ] Probar registro de usuario
- [ ] Verificar recepción de email
- [ ] Confirmar que `.env` está en `.gitignore`

---

**Última actualización:** 29 de Octubre de 2025
