# 📡 Documentación API - HackatonTech2

## 🌐 Base URL

```
http://localhost:5000/api
```

## 🔐 Autenticación

La API usa **JWT (JSON Web Tokens)** para autenticación.

### Headers Requeridos

```http
Authorization: Bearer {token}
Content-Type: application/json
```

---

## 📚 Endpoints

### 1. Autenticación (`/auth`)

#### 1.1 Login

**POST** `/auth/login`

Inicia sesión con documento y contraseña.

**Request:**
```json
{
  "documento": "1000000003",
  "password": "Password123!"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "documento": "1000000003",
    "email": "campista@hackatontech.com",
    "nombres": "Carlos",
    "apellidos": "Participante",
    "role": "CAMPISTA",
    "status": "ACTIVE"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

#### 1.2 Registro Directo

**POST** `/auth/register`

Registro de usuario sin SIGA.

**Request:**
```json
{
  "documento": "1234567890",
  "email": "usuario@example.com",
  "password": "Password123!",
  "nombres": "Juan",
  "apellidos": "Pérez",
  "telefono": "3001234567"
}
```

**Response:** Mismo formato que login

---

#### 1.3 Registro con SIGA - Paso 1

**POST** `/auth/register/siga`

Inicia el proceso de registro validando el documento en SIGA.

**Request:**
```json
{
  "documento": "1028009034",
  "fechaExpedicion": "2010-09-03"
}
```

**Response:**
```json
{
  "message": "Se ha enviado un código de verificación a tu correo electrónico",
  "email": "va***a@hotmail.com"
}
```

---

#### 1.4 Verificar Token - Paso 2

**POST** `/auth/verify-token`

Verifica que el token recibido por email sea válido.

**Request:**
```json
{
  "token": "123456"
}
```

**Response:**
```json
{
  "isValid": true,
  "user": {
    "documento": "1028009034",
    "nombres": "KATHERIN VANESSA",
    "apellidos": "ATEHORTUA GOMEZ",
    "email": "vanessa_0828@hotmail.com",
    "interestTopics": [
      {
        "id": "uuid",
        "nombre": "Inteligencia Artificial",
        "codigo": "INTELIGENCIA_ARTIFICIAL"
      }
    ]
  }
}
```

---

#### 1.5 Completar Registro - Paso 3

**POST** `/auth/complete-registration`

Completa el registro estableciendo la contraseña.

**Request:**
```json
{
  "token": "123456",
  "password": "MiPassword123!",
  "interestTopicIds": ["uuid-topic-1", "uuid-topic-2"]
}
```

**Response:** Mismo formato que login

---

#### 1.6 Reenviar Token

**POST** `/auth/resend-token/:documento`

Reenvía el código de verificación al correo.

**Response:**
```json
{
  "message": "Se ha reenviado el código de verificación",
  "email": "va***a@hotmail.com"
}
```

---

#### 1.7 Obtener Usuario Actual

**GET** `/auth/me`

🔒 Requiere autenticación

**Response:**
```json
{
  "id": "uuid",
  "documento": "1000000003",
  "email": "campista@hackatontech.com",
  "nombres": "Carlos",
  "apellidos": "Participante",
  "role": "CAMPISTA",
  "status": "ACTIVE",
  "interestTopics": [...]
}
```

---

### 2. Hackathons (`/hackathons`)

#### 2.1 Listar Hackathons

**GET** `/hackathons`

**Query Parameters:**
- `estado`: `DRAFT` | `PUBLISHED` | `IN_PROGRESS` | `FINISHED` | `CANCELLED`
- `publicado`: `true` | `false`

**Response:**
```json
[
  {
    "id": "uuid",
    "nombre": "Hackaton IA Octubre 2025",
    "descripcion": "Hackathon de Inteligencia Artificial",
    "estado": "PUBLISHED",
    "modalidad": "VIRTUAL",
    "fechaInicio": "2025-10-25T08:00:00Z",
    "fechaFin": "2025-10-27T18:00:00Z",
    "fechaLimiteInscripcion": "2025-10-24T23:59:59Z",
    "inscripcionAbierta": true,
    "publicado": true,
    "organizador": {
      "id": "uuid",
      "nombres": "Juan",
      "apellidos": "Organizador",
      "email": "organizador@hackatontech.com"
    },
    "topics": [
      {
        "id": "uuid",
        "nombre": "Inteligencia Artificial",
        "codigo": "INTELIGENCIA_ARTIFICIAL"
      }
    ]
  }
]
```

---

#### 2.2 Obtener Hackathons Públicos

**GET** `/hackathons/public`

Obtiene solo los hackathons publicados.

---

#### 2.3 Obtener Hackathon por ID

**GET** `/hackathons/:id`

**Response:** Objeto hackathon completo

---

#### 2.4 Crear Hackathon

**POST** `/hackathons`

🔒 Requiere rol: `ORGANIZADOR`

**Request:**
```json
{
  "nombre": "Hackaton IA Octubre 2025",
  "descripcion": "Hackathon de Inteligencia Artificial",
  "descripcionCorta": "Demuestra tus habilidades en IA",
  "modalidad": "VIRTUAL",
  "fechaInicio": "2025-10-25T08:00:00Z",
  "fechaFin": "2025-10-27T18:00:00Z",
  "fechaLimiteInscripcion": "2025-10-24T23:59:59Z",
  "minMiembrosEquipo": 1,
  "maxMiembrosEquipo": 5,
  "maxParticipantes": 100,
  "topicsIds": ["uuid-topic-1"],
  "requisitos": "Conocimientos básicos de Python y ML",
  "premios": "1er lugar: $1,000,000 COP",
  "reglas": "Código original, trabajo en equipo...",
  "inscripcionAbierta": true,
  "publicado": false
}
```

---

#### 2.5 Verificar Elegibilidad

**GET** `/hackathons/:id/eligibility`

🔒 Requiere autenticación

Verifica si el usuario puede inscribirse en el hackathon.

**Response:**
```json
{
  "isEligible": true,
  "reasons": [],
  "user": {...},
  "hackathon": {...}
}
```

**Posibles razones de no elegibilidad:**
- `"El hackathon no está publicado"`
- `"Las inscripciones están cerradas"`
- `"La fecha límite de inscripción ha pasado"`
- `"Usuario rechazado en SIGA"`
- `"No tienes temas de interés compatibles"`
- `"Ya estás inscrito en este hackathon"`
- `"El hackathon ha alcanzado el límite de participantes"`

---

#### 2.6 Inscribirse en Hackathon

**POST** `/hackathons/:id/register`

🔒 Requiere autenticación

**Response:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "hackathonId": "uuid",
  "status": "APPROVED",
  "isEligible": true,
  "registrationDate": "2025-10-18T10:30:00Z"
}
```

---

#### 2.7 Cancelar Inscripción

**DELETE** `/hackathons/:id/register`

🔒 Requiere autenticación

---

#### 2.8 Mis Inscripciones

**GET** `/hackathons/user/registrations`

🔒 Requiere autenticación

Obtiene todas las inscripciones del usuario actual.

---

#### 2.9 Hackathons Disponibles para Mí

**GET** `/hackathons/user/available`

🔒 Requiere autenticación

Obtiene hackathons con información de elegibilidad.

**Response:**
```json
[
  {
    "hackathon": {...},
    "isEligible": true,
    "reasons": []
  }
]
```

---

#### 2.10 Estadísticas de Hackathon

**GET** `/hackathons/:id/stats`

🔒 Requiere rol: `ORGANIZADOR`

**Response:**
```json
{
  "totalRegistrations": 45,
  "approvedRegistrations": 42,
  "pendingRegistrations": 3,
  "cancelledRegistrations": 2,
  "registrationsByTopic": [
    { "topic": "Inteligencia Artificial", "count": 25 },
    { "topic": "Programación", "count": 17 },
    { "topic": "Análisis de Datos", "count": 3 }
  ]
}
```

---

### 3. SIGA (`/siga`)

#### 3.1 Validar Documento

**POST** `/siga/validate`

Valida un documento contra SIGA.

**Request:**
```json
{
  "numeroDocumento": "1028009034",
  "fechaExpedicion": "2010-09-03"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "documento": "1028009034",
    "nombres": "KATHERIN VANESSA",
    "apellidos": "ATEHORTUA GOMEZ",
    "email": "vanessa_0828@hotmail.com",
    "sigaStatus": "APROBADO",
    "programaInteres": "INTELIGENCIA ARTIFICIAL"
  },
  "message": null
}
```

---

#### 3.2 Sincronizar Usuarios desde SIGA

**POST** `/siga/sync`

🔒 Requiere rol: `ADMIN`

Sincroniza usuarios desde el reporte 1003 de SIGA.

**Request:**
```json
{
  "forceSync": false,
  "onlyApproved": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "synced": 60000,
    "created": 1500,
    "updated": 58500,
    "errors": 0
  }
}
```

---

### 4. Topics (`/topics`)

#### 4.1 Listar Topics

**GET** `/topics`

**Response:**
```json
[
  {
    "id": "uuid",
    "nombre": "Inteligencia Artificial",
    "descripcion": "Machine Learning, Deep Learning y AI",
    "codigo": "INTELIGENCIA_ARTIFICIAL",
    "icono": "🤖",
    "colorHex": "#8B5CF6",
    "orden": 2,
    "activo": true
  }
]
```

---

## 🔒 Roles y Permisos

### Roles Disponibles

- **CAMPISTA**: Usuario participante
- **JUEZ**: Evaluador de hackathons
- **ORGANIZADOR**: Creador y gestor de hackathons

### Matriz de Permisos

| Endpoint | CAMPISTA | JUEZ | ORGANIZADOR |
|----------|----------|------|-------------|
| POST /hackathons | ❌ | ❌ | ✅ |
| POST /hackathons/:id/register | ✅ | ✅ | ✅ |
| GET /hackathons/:id/eligibility | ✅ | ✅ | ✅ |
| GET /hackathons/:id/stats | ❌ | ❌ | ✅ |
| GET /hackathons/:id/registrations | ❌ | ✅ | ✅ |

---

## 📊 Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| 200 | Solicitud exitosa |
| 201 | Recurso creado |
| 400 | Solicitud inválida |
| 401 | No autenticado |
| 403 | Sin permisos |
| 404 | Recurso no encontrado |
| 409 | Conflicto (ej: usuario ya existe) |
| 500 | Error del servidor |

---

## 🧪 Testing con Postman/Insomnia

### Colección de Ejemplo

1. **Obtener Token:**
   ```http
   POST http://localhost:5000/api/auth/login
   Body:
   {
     "documento": "1000000003",
     "password": "Password123!"
   }
   ```

2. **Usar Token:**
   ```http
   GET http://localhost:5000/api/auth/me
   Headers:
   Authorization: Bearer {token-from-step-1}
   ```

---

## 📝 Swagger UI

Para una documentación interactiva, visita:

```
http://localhost:5000/api/docs
```

---

**Última actualización**: Octubre 2025
