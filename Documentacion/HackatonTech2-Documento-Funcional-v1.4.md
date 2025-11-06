# HackatonTech2 - Documento de Análisis Funcional

## 1. Resumen Ejecutivo

El proyecto HackatonTech2 es una plataforma web que permitirá a los participantes inscritos en TalentoTech participar en hackathones organizadas de manera estructurada. El sistema debe integrarse con SIGA (Sistema de Información y Gestión Académica) para validar la elegibilidad de los participantes y potencialmente con Moodle para gestión académica complementaria.

## 2. Integración con Sistemas Existentes

### 2.1 SIGA - Sistema de Información y Gestión Académica

**APIs Identificadas:**
- **generarToken()**: Autenticación inicial del sistema
- **autenticar()**: Validación de credenciales de usuarios
- **obtenerInformacionReporte1003()**: Consulta de participantes inscritos con documento cargado

**Campos Disponibles del Reporte 1003:**
- Datos personales: nombres, apellidos, documento, fecha expedición, correo
- Información demográfica: departamento, municipio, género, teléfono
- Datos académicos: programa de interés, modalidad de formación, disponibilidad horaria
- Estado de inscripción: aprobación, fechas de solicitud y aprobación

**Programas Identificados en SIGA:**
- Programación
- Análisis de Datos
- Ciberseguridad
- Inteligencia Artificial
- Arquitectura en la Nube
- Blockchain

### 2.2 Moodle - Sistema de Gestión de Aprendizaje

**Consulta SQL Existente (Plugin Adhoc):**
La consulta actual extrae información completa de campistas inscritos en bootcamps, incluyendo:

**Datos del Estudiante:**
- Cédula, nombres, apellidos, correo
- Campos personalizados: lote, modalidad, departamento, municipio, cohorte, pago

**Datos del Curso/Bootcamp:**
- Código y nombre del curso
- Fechas de creación, inicio y finalización
- Filtros: cursos VIRTUALES (VIRT) y PRESENCIALES (PRES)

**Personal Académico:**
- Ejecutor Técnico, Mentor, Monitor
- Ejecutor Inglés, Ejecutor Habilidades de Poder

**API a Desarrollar para HackatonTech2:**
Simplificación de la consulta existente enfocada en:
```sql
-- Datos mínimos necesarios para validación temática
SELECT 
    u.username AS cedula_estudiante,
    CONCAT(u.firstname, ' ', u.lastname) AS nombre_completo,
    u.email AS correo,
    c.shortname AS codigo_bootcamp,
    c.fullname AS nombre_bootcamp,
    TO_CHAR(TO_TIMESTAMP(c.startdate), 'YYYY-MM-DD') AS fecha_inicio,
    TO_CHAR(TO_TIMESTAMP(c.enddate), 'YYYY-MM-DD') AS fecha_fin
FROM prefix_course c
INNER JOIN prefix_context ctx ON c.id = ctx.instanceid AND ctx.contextlevel = 50
INNER JOIN prefix_role_assignments ra ON ctx.id = ra.contextid
INNER JOIN prefix_user u ON u.id = ra.userid
INNER JOIN prefix_role r ON r.id = ra.roleid
WHERE r.shortname = 'student' 
    AND u.deleted = 0 AND u.suspended = 0 
    AND c.visible = 1
    AND u.username = ? -- Parámetro: cédula del campista
```

**Mapeo Bootcamp → Tema Hackathon:**
- Identificar bootcamps por `shortname` o `fullname` que contengan palabras clave
- Programación: cursos con "PROG", "DESARROLLO", "SOFTWARE"
- IA: cursos con "IA", "INTELIGENCIA", "ARTIFICIAL"
- Datos: cursos con "DATOS", "DATA", "ANALYTICS"
- Cloud: cursos con "CLOUD", "NUBE", "AWS", "AZURE"
- Blockchain: cursos con "BLOCKCHAIN", "CRIPTO"
- Ciberseguridad: cursos con "CYBER", "SEGURIDAD", "SECURITY"

## 3. Flujo de Usuarios y Funcionalidades

### 3.1 Proceso de Registro de Campistas

1. **Validación Inicial:**
   - El campista ingresa número de documento y fecha de expedición
   - El sistema consulta la API del reporte 1003 de SIGA
   - Se valida la existencia y estado del participante

2. **Confirmación de Registro:**
   - Mostrar datos precargados para confirmación
   - Filtrar información según programa de interés registrado en SIGA
   - Solicitar confirmación de inscripción

3. **Creación de Credenciales:**
   - Usuario: número de documento
   - Contraseña temporal enviada por correo
   - Forzar cambio de contraseña en primer acceso

4. **Notificación:**
   - Envío de correo con credenciales y enlace de acceso

### 3.2 Gestión de Equipos

1. **Creación de Equipos:**
   - Un campista puede crear un equipo
   - Definir nombre y descripción del equipo
   - **Límite máximo: 5 personas por equipo**

2. **Invitaciones:**
   - Buscar campistas registrados por correo/documento
   - Enviar invitaciones por correo electrónico
   - Notificar a no registrados para que se unan a la plataforma

3. **Gestión de Membresías:**
   - Aceptar/rechazar invitaciones
   - Control de límite máximo de 5 miembros por equipo
   - Gestión de roles dentro del equipo (líder/miembro)

## 4. Roles del Sistema

### 4.1 Campista
- Registrarse en hackathones
- Crear y gestionar equipos
- Participar en retos
- **Visualizar retos:** Acceder a descripción digital y/o descargar PDF del reto
- Ver tabla de posiciones
- Consultar rúbricas de evaluación de cada reto

### 4.2 Juez
- Evaluar proyectos de equipos según rúbricas configuradas
- Asignar puntuaciones por cada rúbrica de evaluación
- **Acceder a información del reto:** Visualizar descripción y descargar PDF si está disponible
- Acceso a criterios detallados y escalas de calificación por reto
- Dashboard de evaluación con seguimiento por equipo y reto

### 4.3 Administrador/Coordinador
- Crear y configurar hackathones
- **Gestionar retos:** Crear retos de dos formas:
  - Digitación directa en la plataforma con editor de texto enriquecido
  - Carga de archivos PDF con especificaciones completas del reto
- Definir temas por hackathon
- **Configurar rúbricas de evaluación:** Crear y asignar rúbricas personalizadas por reto
- **Gestionar criterios de calificación:** Definir porcentajes, escalas y descripciones de rúbricas
- Gestionar jueces y asignarlos a retos específicos
- Configurar parámetros temporales del evento (fechas, duraciones, límites)
- **Gestión de archivos:** Subir, visualizar y eliminar PDFs de retos

## 5. Estructura de Hackathones

### 5.1 Configuración de Eventos
- **Nombre:** Ejemplo: "Hackaton_octubre_2025"
- **Duración:** Parametrizable (horas/días)
- **Fechas:** Inicio y fin del evento
- **Ventana de inscripción:** Parametrizable con límite de tiempo para inscripciones
- **Corte de elegibilidad:** Solo participantes inscritos en SIGA hasta 1 día antes del cierre de convocatoria
- **Temas disponibles:** Selección de las 6 áreas principales

### 5.2 Temas y Retos

**Temas Principales:**
- Programación
- Inteligencia Artificial
- Análisis de Datos
- Arquitectura en la Nube
- Blockchain
- Ciberseguridad

**Estructura de Retos:**
- Cada tema puede tener múltiples retos
- Cada reto tiene una puntuación asignada
- Criterios de evaluación definidos por tema

**Creación de Retos (Dos Modalidades):**

**Opción 1: Digitación Directa en Plataforma**
- El administrador/coordinador crea el reto directamente en el sistema
- Campos a completar:
  - Nombre del reto
  - Descripción detallada (editor de texto enriquecido)
  - Objetivos
  - Entregables esperados
  - Recursos disponibles
  - Tiempo estimado
  - Criterios de éxito
- Permite edición y actualización en tiempo real

**Opción 2: Carga de Documento PDF**
- El administrador/coordinador sube un archivo PDF con la información completa del reto
- El PDF debe contener:
  - Especificación completa del reto
  - Criterios de evaluación
  - Recursos y referencias
  - Entregables requeridos
- Sistema almacena el PDF y lo hace disponible para descarga
- URL del PDF accesible para campistas y jueces
- Validaciones: tamaño máximo (10MB), formato PDF válido

**Combinación de Ambas:**
- Opción de tener descripción básica en plataforma + PDF adjunto con detalles
- El PDF complementa la información digital
- Flexibilidad según necesidades del coordinador

### 5.3 Sistema de Puntuación y Evaluación

**Configuración de Rúbricas (Parametrizable por Administrador):**

**Estructura de Evaluación:**
```
Hackathon > Tema > Reto > Rúbricas de Evaluación
```

**Ejemplo de Configuración:**
- **Hackaton:** "Hackaton_octubre_2025"
- **Tema:** "Ciberseguridad" 
- **Reto 1:** "Sistema de Detección de Intrusiones"
  - **Rúbrica 1:** "Cumplimiento de Visualización" - 10%
  - **Rúbrica 2:** "Funcionalidad Técnica" - 25%
  - **Rúbrica 3:** "Innovación y Creatividad" - 20%
  - **Rúbrica 4:** "Implementación de Seguridad" - 30%
  - **Rúbrica 5:** "Presentación y Documentación" - 15%
  - **Total:** 100%

**Configuración Flexible:**
- Número de rúbricas por reto: 1 a N (sin límite fijo)
- Porcentajes configurables que deben sumar 100%
- Escalas de calificación por rúbrica (ej: 1-5, 1-10, 1-100)
- Descripción detallada por cada rúbrica

**Cálculo de Puntuación:**
```
Puntuación Final del Reto = Σ (Calificación Rúbrica × Porcentaje Rúbrica)
Puntuación Total del Equipo = Σ (Puntuación Final de todos los Retos)
```

**Funcionalidades del Sistema:**
- Tabla de posiciones en tiempo real
- Historial detallado de evaluaciones por rúbrica
- Reportes de calificación por juez y por reto
- Validación automática de porcentajes (deben sumar 100%)

## 6. Consideraciones Técnicas

### 6.1 Arquitectura de Integración

**SIGA (Sistema Primario):**
- **Autenticación:** Tokens de acceso con renovación automática
- **Endpoint principal:** obtenerInformacionReporte1003() para validación de campistas
- **Sincronización:** Actualización periódica desde reporte 1003

**Moodle (Sistema Secundario):**
- **Consulta existente:** Plugin Adhoc con SQL completo disponible
- **API simplificada:** Endpoint REST que encapsule la consulta SQL existente
- **Parámetros:** Cédula del campista como filtro principal
- **Respuesta:** Lista de bootcamps donde participó el campista

**HackatonTech2 (Sistema Central):**
- **Gestión de sesiones:** Manejo seguro de credenciales de usuario
- **Cache de validaciones:** Almacenamiento temporal de consultas SIGA/Moodle
- **Motor de recomendaciones:** Lógica de mapeo bootcamp → tema hackathon

### 6.2 Validaciones Críticas

**Validación Primaria (Obligatoria):**
- **Elegibilidad básica:** Solo campistas en reporte 1003 pueden registrarse (verificados o no verificados)
- **Ventana de inscripción:** Validar que la inscripción en SIGA sea hasta 1 día antes del cierre de convocatoria
- **Tiempo límite parametrizable:** Los participantes tienen un límite de tiempo configurable para inscribirse en hackathones

**Validación Secundaria (Recomendada/Opcional):**
- **Coincidencia temática:** Si el campista participó en bootcamp de Moodle, verificar que el tema del hackathon coincida con su bootcamp
- **Mapeo de temas:** Programación ↔ Bootcamp Programación, IA ↔ Bootcamp IA, etc.
- **Filtrado inteligente:** Mostrar preferentemente temas donde el campista tiene experiencia en bootcamp

**Principio de Validación:** 
- SIGA determina elegibilidad (obligatorio)
- Moodle mejora la experiencia (opcional/recomendatorio)

### 6.3 Notificaciones
- Sistema de correo electrónico para:
  - Credenciales de acceso
  - Invitaciones a equipos
  - Actualizaciones de hackathones
  - Resultados y posiciones

## 7. Flujo de Datos y Validaciones

### 7.1 Flujo Principal de Validación

```
SIGA (Reporte 1003) -> Validación de elegibilidad -> HackatonTech2
     |                  (hasta 1 día antes)           |
     |                                                v
     -> Filtrado por programa de interés -> Precarga de información personal
     
Moodle (API Bootcamps) -> Validación temática opcional -> Recomendación de temas
                       -> Mapeo bootcamp ↔ tema hackathon
```

### 7.2 Lógica de Validación en Cascada

**Paso 1 - Validación Obligatoria (SIGA):**
1. Existencia en reporte 1003 de SIGA
2. Inscripción en SIGA dentro del plazo permitido (hasta 1 día antes del cierre)
3. Precarga de datos personales y programa de interés

**Paso 2 - Validación Opcional (Moodle):**
1. Consultar bootcamps donde participó el campista
2. Mapear bootcamps a temas de hackathon disponibles
3. Mostrar recomendaciones o restricciones sugeridas

**Paso 3 - Selección de Tema:**
- **Con experiencia en Moodle:** Recomendar tema coincidente con bootcamp
- **Sin experiencia en Moodle:** Permitir cualquier tema según programa SIGA
- **Validación cruzada:** Advertir si selecciona tema sin experiencia previa

### 7.3 Mapeo de Bootcamps a Temas

| Bootcamp (Moodle) | Tema Hackathon | Validación |
|-------------------|----------------|------------|
| Bootcamp Programación | Programación | Recomendado |
| Bootcamp IA | Inteligencia Artificial | Recomendado |
| Bootcamp Datos | Análisis de Datos | Recomendado |
| Bootcamp Cloud | Arquitectura en la Nube | Recomendado |
| Bootcamp Blockchain | Blockchain | Recomendado |
| Bootcamp Ciberseguridad | Ciberseguridad | Recomendado |

## 8. Sistema de Rúbricas de Evaluación - Especificación Detallada

### 8.1 Configuración de Rúbricas por Administrador

**Interfaz de Configuración:**
El administrador puede configurar para cada reto:

```
Hackathon: "Hackaton_octubre_2025"
├── Tema: "Ciberseguridad"
    ├── Reto 1: "Sistema de Detección de Intrusiones"
    │   ├── Rúbrica 1: "Cumplimiento de Visualización" (10%)
    │   │   ├── Escala: 1-10 puntos
    │   │   └── Descripción: "Calidad de dashboards y reportes visuales"
    │   ├── Rúbrica 2: "Funcionalidad Técnica" (25%)
    │   │   ├── Escala: 1-10 puntos
    │   │   └── Descripción: "Efectividad del algoritmo de detección"
    │   ├── Rúbrica 3: "Innovación y Creatividad" (20%)
    │   ├── Rúbrica 4: "Implementación de Seguridad" (30%)
    │   └── Rúbrica 5: "Presentación y Documentación" (15%)
    │       └── TOTAL: 100%
    │
    └── Reto 2: "Análisis de Vulnerabilidades"
        ├── Rúbrica 1: "Precisión del Análisis" (40%)
        ├── Rúbrica 2: "Herramientas Utilizadas" (35%)
        └── Rúbrica 3: "Propuesta de Solución" (25%)
            └── TOTAL: 100%
```

### 8.2 Validaciones del Sistema

**Validaciones Automáticas:**
1. **Suma de porcentajes:** Debe totalizar exactamente 100% por reto
2. **Escalas consistentes:** Validar que las puntuaciones estén dentro del rango definido
3. **Rúbricas obligatorias:** Un reto debe tener al menos 1 rúbrica
4. **Evaluaciones completas:** Un juez debe calificar todas las rúbricas de un reto

### 8.3 Cálculo de Puntuaciones

**Ejemplo Práctico:**
```
Reto: "Sistema de Detección de Intrusiones"
- Rúbrica 1 (10%): Juez califica 8/10 → 80 puntos → 80 × 10% = 8 puntos
- Rúbrica 2 (25%): Juez califica 7/10 → 70 puntos → 70 × 25% = 17.5 puntos
- Rúbrica 3 (20%): Juez califica 9/10 → 90 puntos → 90 × 20% = 18 puntos
- Rúbrica 4 (30%): Juez califica 6/10 → 60 puntos → 60 × 30% = 18 puntos
- Rúbrica 5 (15%): Juez califica 8/10 → 80 puntos → 80 × 15% = 12 puntos

Puntuación Final del Reto: 8 + 17.5 + 18 + 18 + 12 = 73.5/100
```

## 9. Gestión de Retos - Especificación Detallada

### 9.1 Modalidades de Creación de Retos

El sistema permite dos formas de crear y gestionar retos, ofreciendo flexibilidad al administrador/coordinador:

#### Opción 1: Digitación Directa en Plataforma

**Características:**
- Editor WYSIWYG (What You See Is What You Get)
- Formateo de texto: negritas, cursivas, listas, enlaces
- Posibilidad de insertar imágenes inline
- Vista previa en tiempo real
- Edición y actualización posterior sin restricciones
- Búsqueda y filtrado fácil de retos

#### Opción 2: Carga de Documento PDF

**Validaciones del Sistema:**
- Formato: Solo archivos .pdf
- Tamaño máximo: 10 MB (configurable)
- Validación de archivo PDF corrupto
- Escaneo de virus/malware
- Verificación de permisos de lectura

**Almacenamiento:**
```
/uploads/hackathons/{hackathon_id}/retos/{reto_id}/
    - reto_deteccion_intrusiones.pdf
    - metadata.json
```

#### Opción 3: Modo Híbrido

**Combinación de Digital + PDF:**
- Descripción básica digitada en plataforma
- PDF adjunto con especificaciones detalladas
- Mejor experiencia: vista rápida + información completa descargable

### 9.2 Ventajas de Cada Modalidad

**Digitación Directa:**
✅ Edición rápida y flexible
✅ Búsqueda indexada en el sistema
✅ Acceso inmediato sin descargas
✅ Responsive en móviles
✅ Versionamiento integrado

**Carga de PDF:**
✅ Reutilización de documentos existentes
✅ Formato profesional y consistente
✅ Incluye diagramas e imágenes complejas
✅ Trabajo offline por coordinadores
✅ Firma digital y validación legal (si se requiere)

**Modo Híbrido:**
✅ Lo mejor de ambos mundos
✅ Vista rápida + detalles completos
✅ Flexibilidad máxima

## 10. Especificaciones Técnicas de Integración Moodle

### 10.1 Consulta SQL Base Disponible

La infraestructura actual de Moodle ya cuenta con una consulta SQL robusta que extrae información completa de campistas y bootcamps. Esta consulta incluye:

**Estructura de Datos Disponible:**
```sql
-- Información completa ya disponible en Moodle
- Estudiante: cédula, nombres, apellidos, correo
- Curso/Bootcamp: código, nombre, fechas (creación, inicio, fin)
- Campos personalizados: lote, modalidad, departamento, municipio, cohorte, pago  
- Personal académico: ejecutores, mentores, monitores por especialidad
- Filtros: modalidad (VIRT/PRES), estado del curso, estado del estudiante
```

### 10.2 API REST Propuesta para HackatonTech2

**Endpoint:** `GET /moodle/api/campista-bootcamps/{cedula}`

**Consulta SQL Optimizada:**
```sql
SELECT 
    u.username AS cedula,
    CONCAT(u.firstname, ' ', u.lastname) AS nombre_completo,
    u.email AS correo,
    c.shortname AS codigo_bootcamp,
    c.fullname AS nombre_bootcamp,
    modalidad_data.data AS modalidad,
    TO_CHAR(TO_TIMESTAMP(c.startdate), 'YYYY-MM-DD') AS fecha_inicio,
    TO_CHAR(TO_TIMESTAMP(c.enddate), 'YYYY-MM-DD') AS fecha_fin
FROM prefix_course c
INNER JOIN prefix_context ctx ON c.id = ctx.instanceid AND ctx.contextlevel = 50
INNER JOIN prefix_role_assignments ra ON ctx.id = ra.contextid
INNER JOIN prefix_user u ON u.id = ra.userid
INNER JOIN prefix_role r ON r.id = ra.roleid
LEFT JOIN prefix_user_info_data modalidad_data ON modalidad_data.userid = u.id 
    AND modalidad_data.fieldid = (SELECT id FROM prefix_user_info_field WHERE shortname = 'modalidad')
WHERE r.shortname = 'student' 
    AND u.deleted = 0 AND u.suspended = 0 
    AND c.visible = 1
    AND u.username = ?  -- Parámetro: cédula del campista
ORDER BY c.startdate DESC
```

### 10.3 Lógica de Mapeo Bootcamp → Tema Hackathon

**Algoritmo de Clasificación por Palabras Clave:**
- Programación: cursos con "PROG", "DESARROLLO", "SOFTWARE", "DEV", "CODE"
- IA: cursos con "IA", "AI", "INTELIGENCIA", "ARTIFICIAL", "ML", "MACHINE"
- Datos: cursos con "DATOS", "DATA", "ANALYTICS", "ANALISIS", "BIG_DATA"
- Cloud: cursos con "CLOUD", "NUBE", "AWS", "AZURE", "GCP", "ARQUITECTURA"
- Blockchain: cursos con "BLOCKCHAIN", "CRIPTO", "CRYPTO", "BITCOIN", "WEB3"
- Ciberseguridad: cursos con "CYBER", "SEGURIDAD", "SECURITY", "HACK", "ETHICAL"

## 11. Preguntas y Clarificaciones Pendientes

1. **API Moodle específica:** ¿Qué campos necesitamos del reporte de bootcamps? (nombre bootcamp, fechas, estado participante, etc.)
2. **Gestión de archivos adicionales:** ¿Los equipos pueden subir documentos/código de sus soluciones?
3. **Comunicación:** ¿Se requiere chat o mensajería interna entre equipos?
4. **Reportes:** ¿Qué reportes administrativos se necesitan?
5. **Plazos específicos:** ¿Cuáles son los rangos típicos para los límites de tiempo de inscripción?
6. **Comportamiento sin Moodle:** ¿Qué sucede si un campista no tiene historial en Moodle pero quiere participar?
7. **Restricciones temáticas:** ¿Se permite participar en temas sin experiencia previa o solo se recomienda?
8. **Múltiples jueces:** ¿Un reto puede ser evaluado por varios jueces? ¿Cómo se promedian las calificaciones?
9. **Escalas de rúbricas:** ¿Todas las rúbricas deben usar la misma escala o pueden ser diferentes por rúbrica?
10. **Almacenamiento de PDFs:** ¿Preferencia entre almacenamiento local vs cloud?
11. **Plantillas de retos:** ¿Se requieren plantillas predefinidas para facilitar la creación de retos?

## 12. Próximos Pasos Sugeridos

1. **Definición técnica detallada** de la arquitectura del sistema
2. **Diseño de base de datos** con todas las entidades identificadas  
3. **Especificación de APIs** internas del sistema
4. **Desarrollo de API REST para Moodle** basada en consulta SQL existente
5. **Mockups de interfaz** para los diferentes tipos de usuario
6. **Plan de desarrollo** por fases prioritarias
7. **Estrategia de testing** de integración con SIGA y Moodle

---

**Documento generado:** Octubre 2025  
**Versión:** 1.4 - Análisis Funcional Completo  
**Incluye:** Sistema de Rúbricas Parametrizables + Gestión de Retos (Digital/PDF)  
**Estado:** Listo para Desarrollo