# 📧 Configuración de Gmail Institucional - UCaldas

## Correo: `soportetech@ucaldas.edu.co`

---

## 🎯 Resumen Rápido

Para enviar emails desde el sistema necesitas:
1. ✅ Habilitar verificación en 2 pasos en tu cuenta de Google
2. ✅ Crear una "App Password" (contraseña de aplicación)
3. ✅ Configurar esa contraseña en el archivo `.env`
4. ✅ Reiniciar el backend
5. ✅ ¡Listo! Los emails se enviarán automáticamente

---

## 📝 Paso 1: Habilitar Verificación en 2 Pasos

### ¿Por qué es necesario?
Google requiere la verificación en 2 pasos para poder crear App Passwords (contraseñas de aplicación).

### Instrucciones:

1. **Abre tu navegador** e inicia sesión con `soportetech@ucaldas.edu.co`

2. **Ve a tu cuenta de Google**:
   ```
   https://myaccount.google.com/
   ```

3. En el menú izquierdo, click en **"Seguridad"**

4. Busca la sección **"Cómo inicias sesión en Google"**

5. Click en **"Verificación en 2 pasos"** o **"2-Step Verification"**
   ```
   https://myaccount.google.com/signinoptions/two-step-verification
   ```

6. Click en **"Empezar"** o **"Get Started"**

7. Sigue las instrucciones:
   - Ingresa tu contraseña
   - Ingresa tu número de teléfono
   - Recibirás un código por SMS
   - Ingresa el código
   - Click en **"Activar"**

8. ✅ **Verificación en 2 pasos activada**

---

## 🔐 Paso 2: Crear App Password (Contraseña de Aplicación)

### ¿Qué es una App Password?
Es una contraseña especial de 16 caracteres que Google genera para que aplicaciones de terceros (como nuestro backend) puedan enviar emails sin comprometer tu contraseña principal.

### Instrucciones:

1. **Ve a App Passwords**:
   ```
   https://myaccount.google.com/apppasswords
   ```

   **Alternativa:** Ve a https://myaccount.google.com/ → Seguridad → Contraseñas de aplicaciones

2. Es posible que te pida **volver a iniciar sesión** - hazlo

3. En la pantalla "App passwords":

   **Opción A - Pantalla Nueva:**
   - Verás un campo para escribir el nombre de la app
   - Escribe: `HackatonTech2`
   - Click en **"Crear"** o **"Create"**

   **Opción B - Pantalla Antigua:**
   - En "Select app": Elige **"Mail"** o **"Correo"**
   - En "Select device": Elige **"Other (Custom name)"** o **"Otro (Nombre personalizado)"**
   - Escribe: `HackatonTech2`
   - Click en **"Generate"** o **"Generar"**

4. **Google mostrará una contraseña de 16 caracteres** como esta:
   ```
   abcd efgh ijkl mnop
   ```
   O sin espacios:
   ```
   abcdefghijklmnop
   ```

5. **⚠️ IMPORTANTE: Copia esta contraseña AHORA**
   - Esta contraseña solo se muestra UNA VEZ
   - Si la pierdes, tendrás que crear una nueva
   - Puedes copiarla con espacios o sin espacios (ambos funcionan)

6. Click en **"Listo"** o **"Done"**

---

## ⚙️ Paso 3: Configurar el Backend

### Instrucciones:

1. **Abre el archivo**: `backend/.env`

2. **Busca la sección** `EMAIL - NOTIFICACIONES`

3. **Encuentra esta línea**:
   ```env
   EMAIL_PASSWORD=TU_APP_PASSWORD_DE_16_CARACTERES_AQUI
   ```

4. **Reemplaza** con la contraseña que copiaste:
   ```env
   EMAIL_PASSWORD=abcd efgh ijkl mnop
   ```
   O sin espacios:
   ```env
   EMAIL_PASSWORD=abcdefghijklmnop
   ```

5. **Verifica que todo quede así**:
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=soportetech@ucaldas.edu.co
   EMAIL_PASSWORD=abcdefghijklmnop           # ← Tu contraseña de 16 caracteres
   EMAIL_FROM=HackatonTech2 <soportetech@ucaldas.edu.co>
   ```

6. **Guarda el archivo** (Ctrl + S)

---

## 🧪 Paso 4: Probar la Configuración

### Opción A: Script de Prueba Automático (Recomendado)

```bash
cd backend
node test-email.js
```

**Si todo está bien**, verás:
```
✅ Conexión exitosa con el servidor SMTP!
📧 Enviando email de prueba a: soportetech@ucaldas.edu.co...
✅ Email enviado exitosamente!
```

Y recibirás un email de prueba en `soportetech@ucaldas.edu.co`

**Si hay un error**, el script te mostrará qué está mal y cómo solucionarlo.

### Opción B: Reiniciar el Backend y Verificar Logs

```bash
cd backend
npm run start:dev
```

**Si todo está bien**, verás en los logs:
```
[EmailService] Email service initialized successfully
```

**Si hay un error**, verás:
```
[EmailService] WARN: Configuración de email no encontrada. Usando modo MOCK.
```

---

## 🚀 Paso 5: Probar con Registro Real

1. **Asegúrate de que backend y frontend estén corriendo**:
   ```bash
   # Terminal 1
   cd backend
   npm run start:dev

   # Terminal 2
   cd frontend
   npm run dev
   ```

2. **Abre el navegador**: http://localhost:3000/register

3. **Ingresa un documento válido de SIGA**: Por ejemplo, `1038646992`

4. **Haz click en "Verificar Documento"**

5. **¡Revisa tu correo!** En unos segundos deberías recibir un email como este:

   ```
   De: HackatonTech2 <soportetech@ucaldas.edu.co>
   Para: penaospinakevinandres3@gmail.com
   Asunto: Verificación de Cuenta - HackatonTech2

   Hola KEVIN ANDRES,

   Tu código de verificación es: 849268

   Este código expirará en 24 horas.
   ```

6. **Ingresa el código** en la página y completa el registro

---

## ❌ Solución de Problemas

### Error: "Invalid login credentials" o "Username and Password not accepted"

**Causa:** La App Password es incorrecta

**Solución:**
1. Verifica que copiaste la contraseña completa (16 caracteres)
2. No uses la contraseña normal de Gmail, debe ser la App Password
3. Crea una nueva App Password si es necesario

---

### Error: "2-Step Verification is required"

**Causa:** No has habilitado la verificación en 2 pasos

**Solución:**
1. Ve a https://myaccount.google.com/signinoptions/two-step-verification
2. Activa la verificación en 2 pasos
3. Luego crea la App Password

---

### No veo la opción "App Passwords"

**Posibles causas:**
1. No has activado la verificación en 2 pasos
2. Tu cuenta es administrada por UCaldas y tiene restricciones

**Solución:**
1. Activa primero la verificación en 2 pasos
2. Si tu cuenta es administrada, contacta al administrador de Google Workspace de UCaldas

---

### Los emails llegan a SPAM

**Esto es normal al inicio**. Para evitarlo:

1. **Marca el email como "No es spam"**
2. **Agrega el remitente a contactos**: `soportetech@ucaldas.edu.co`
3. Con el tiempo, Gmail aprenderá que tus emails son legítimos

---

### Error: "Connection timeout"

**Causa:** Firewall bloqueando el puerto 587

**Solución:**
1. Verifica que tu firewall permita conexiones al puerto 587
2. Si estás en una red corporativa, contacta al administrador

---

## 📊 Límites de Gmail

Gmail tiene límites de envío:

| Tipo de Cuenta | Emails por día | Emails por minuto |
|----------------|----------------|-------------------|
| Gmail Gratuito | 500 | ~30 |
| Google Workspace | 2,000 | ~60 |

**Nota:** UCaldas usa Google Workspace (Gmail institucional), así que tienes límite de **2,000 emails/día**.

Para una hackathon con 500 participantes, esto es más que suficiente.

---

## ✅ Checklist de Verificación

Marca cada paso conforme lo completes:

- [ ] Activé la verificación en 2 pasos en `soportetech@ucaldas.edu.co`
- [ ] Creé una App Password en https://myaccount.google.com/apppasswords
- [ ] Copié la contraseña de 16 caracteres
- [ ] Edité `backend/.env` y pegué la App Password en `EMAIL_PASSWORD`
- [ ] Guardé el archivo `.env`
- [ ] Ejecuté `node backend/test-email.js` exitosamente
- [ ] Recibí el email de prueba en `soportetech@ucaldas.edu.co`
- [ ] Reinicié el backend con `npm run start:dev`
- [ ] Probé el registro completo desde el frontend
- [ ] Verifiqué que los emails lleguen correctamente

---

## 🔒 Seguridad

### ⚠️ IMPORTANTE: NO subir credenciales a Git

1. El archivo `.env` ya está en `.gitignore`
2. **NUNCA hagas commit del archivo `.env`**
3. La App Password es como una contraseña - mantenla secreta

### Revocar una App Password

Si crees que tu App Password fue comprometida:

1. Ve a https://myaccount.google.com/apppasswords
2. Click en el ícono de **basura** junto a "HackatonTech2"
3. Crea una nueva App Password
4. Actualiza el archivo `.env`
5. Reinicia el backend

---

## 📞 Soporte

Si tienes problemas:

1. **Ejecuta el script de prueba**: `node backend/test-email.js`
   - Te dará mensajes de error específicos

2. **Revisa los logs del backend**:
   ```bash
   cd backend
   npm run start:dev
   ```
   Busca mensajes de `[EmailService]`

3. **Consulta esta guía**: Revisa la sección "Solución de Problemas"

4. **Ayuda de Google**:
   - https://support.google.com/accounts/answer/185833
   - https://support.google.com/mail/answer/7126229

---

## ✅ ¡Listo!

Una vez completados todos los pasos:
- ✅ Los usuarios recibirán emails REALES con códigos de verificación
- ✅ Los emails vendrán de `soportetech@ucaldas.edu.co`
- ✅ El sistema dejará de usar el modo MOCK
- ✅ Podrás enviar hasta 2,000 emails por día

---

**Última actualización:** 29 de Octubre de 2025

**Correo configurado:** soportetech@ucaldas.edu.co

**Proveedor:** Gmail Institucional (Google Workspace)
