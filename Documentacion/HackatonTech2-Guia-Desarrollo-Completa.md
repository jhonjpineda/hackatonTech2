jest.spyOn(prisma.hackathon, 'findMany').mockResolvedValue(mockHackathons as any);

      const result = await service.findAll();

      expect(result).toEqual(mockHackathons);
      expect(prisma.hackathon.findMany).toHaveBeenCalled();
    });
  });
});
```

### Testing E2E

```typescript
// test/hackathons.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';

describe('Hackathons (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Obtener token de autenticación
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        cedula: '1000000000',
        password: 'Admin123!',
      });

    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/hackathons (GET)', () => {
    it('debería retornar lista de hackathons', () => {
      return request(app.getHttpServer())
        .get('/api/hackathons')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/api/hackathons (POST)', () => {
    it('debería crear un nuevo hackathon', () => {
      return request(app.getHttpServer())
        .post('/api/hackathons')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nombre: 'Test Hackathon E2E',
          descripcion: 'Descripción de prueba',
          fechaInicio: '2025-12-01T00:00:00Z',
          fechaFin: '2025-12-03T23:59:59Z',
          fechaInicioInscripcion: '2025-11-01T00:00:00Z',
          fechaCierreInscripcion: '2025-11-30T23:59:59Z',
          maxMiembrosPorEquipo: 5,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.nombre).toBe('Test Hackathon E2E');
        });
    });

    it('debería fallar sin autenticación', () => {
      return request(app.getHttpServer())
        .post('/api/hackathons')
        .send({
          nombre: 'Test Sin Auth',
        })
        .expect(401);
    });
  });
});
```

### Scripts de Testing en package.json

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  }
}
```

---

## 12. Buenas Prácticas

### Estructura de Código

#### 1. Separación de Responsabilidades

```typescript
// ✅ CORRECTO: Lógica separada en capas

// Controller - Solo maneja HTTP
@Controller('api/equipos')
export class EquiposController {
  constructor(private equiposService: EquiposService) {}

  @Post()
  async create(@Body() dto: CreateEquipoDto, @CurrentUser() user: any) {
    return this.equiposService.create(dto, user.id);
  }
}

// Service - Lógica de negocio
@Injectable()
export class EquiposService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateEquipoDto, liderId: number) {
    // Validaciones de negocio
    await this.validarMaximoEquipos(liderId, dto.hackathonId);
    
    // Crear equipo
    return this.prisma.equipo.create({
      data: { ...dto, liderId }
    });
  }

  private async validarMaximoEquipos(liderId: number, hackathonId: number) {
    // Lógica de validación
  }
}

// ❌ INCORRECTO: Todo en el controller
@Controller('api/equipos')
export class EquiposController {
  @Post()
  async create(@Body() dto: CreateEquipoDto) {
    // NO mezclar lógica de negocio aquí
    const equipos = await prisma.equipo.findMany(...);
    if (equipos.length > 5) throw new Error();
    return prisma.equipo.create(...);
  }
}
```

#### 2. Uso de DTOs para Validación

```typescript
// ✅ CORRECTO: DTO con validaciones

import { IsString, IsInt, Min, Max, IsNotEmpty } from 'class-validator';

export class CreateEquipoDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  descripcion?: string;

  @IsInt()
  @Min(1)
  hackathonId: number;
}

// Uso en controller
@Post()
async create(@Body() createEquipoDto: CreateEquipoDto) {
  // createEquipoDto ya está validado
}

// ❌ INCORRECTO: Sin validación
@Post()
async create(@Body() body: any) {
  // body puede tener cualquier cosa
}
```

#### 3. Manejo de Errores

```typescript
// ✅ CORRECTO: Errores específicos y descriptivos

import { NotFoundException, ConflictException } from '@nestjs/common';

async findOne(id: number) {
  const equipo = await this.prisma.equipo.findUnique({ where: { id } });
  
  if (!equipo) {
    throw new NotFoundException(`Equipo con ID ${id} no encontrado`);
  }
  
  return equipo;
}

async agregarMiembro(equipoId: number, usuarioId: number) {
  const equipo = await this.findOne(equipoId);
  
  if (equipo.miembros.length >= 5) {
    throw new ConflictException('El equipo ya tiene el máximo de miembros (5)');
  }
  
  // Agregar miembro...
}

// ❌ INCORRECTO: Errores genéricos
async findOne(id: number) {
  const equipo = await this.prisma.equipo.findUnique({ where: { id } });
  
  if (!equipo) {
    throw new Error('No encontrado'); // Muy genérico
  }
}
```

#### 4. Transacciones de Base de Datos

```typescript
// ✅ CORRECTO: Usar transacciones para operaciones múltiples

async crearEquipoConMiembros(dto: CreateEquipoDto, liderId: number, miembrosIds: number[]) {
  return this.prisma.$transaction(async (prisma) => {
    // 1. Crear equipo
    const equipo = await prisma.equipo.create({
      data: {
        nombre: dto.nombre,
        hackathonId: dto.hackathonId,
        liderId,
      }
    });

    // 2. Agregar miembros
    await prisma.equipoMiembro.createMany({
      data: miembrosIds.map(usuarioId => ({
        equipoId: equipo.id,
        usuarioId,
      }))
    });

    // 3. Enviar notificaciones
    await this.notificacionesService.notificarNuevoEquipo(equipo.id);

    return equipo;
  });
}

// ❌ INCORRECTO: Sin transacción (puede quedar inconsistente)
async crearEquipoConMiembros(dto: CreateEquipoDto, liderId: number, miembrosIds: number[]) {
  const equipo = await this.prisma.equipo.create({ ... });
  // Si falla aquí, el equipo queda sin miembros
  await this.prisma.equipoMiembro.createMany({ ... });
}
```

#### 5. Variables de Entorno

```typescript
// ✅ CORRECTO: Usar ConfigService

@Injectable()
export class SigaService {
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('SIGA_BASE_URL');
  }
}

// ❌ INCORRECTO: Usar process.env directamente
@Injectable()
export class SigaService {
  private baseUrl = process.env.SIGA_BASE_URL; // No type-safe
}
```

#### 6. Nomenclatura Consistente

```typescript
// ✅ CORRECTO: Nombres descriptivos y consistentes

// Servicios
export class HackathonsService { }
export class EquiposService { }

// Controllers
export class HackathonsController { }
export class EquiposController { }

// DTOs
export class CreateHackathonDto { }
export class UpdateHackathonDto { }

// Interfaces
export interface TablaDeposiciones { }
export interface DatosEvaluacion { }

// ❌ INCORRECTO: Inconsistente
export class HackatonService { } // Mezcla de español/inglés
export class equipoService { } // Minúscula inicial
export class EquipoSrv { } // Abreviado
```

---

## 13. Comandos Útiles de Desarrollo

### NPM Scripts Recomendados

```json
{
  "scripts": {
    // Backend
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    
    // Build
    "build": "nest build",
    "prebuild": "rimraf dist",
    
    // Testing
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    
    // Database
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:migrate:prod": "prisma migrate deploy",
    "prisma:studio": "prisma studio",
    "prisma:seed": "ts-node prisma/seed.ts",
    "db:reset": "prisma migrate reset",
    
    // Linting
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\""
  }
}
```

### Comandos Git Útiles

```bash
# Crear feature branch
git checkout -b feature/nombre-feature

# Commit siguiendo convención
git commit -m "feat: agregar sistema de evaluaciones"
git commit -m "fix: corregir cálculo de puntuaciones"
git commit -m "docs: actualizar README"

# Actualizar desde main
git pull origin main --rebase

# Push de feature
git push origin feature/nombre-feature
```

---

## 14. Configuración de VSCode

### settings.json

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "non-relative",
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.next": true
  }
}
```

### Extensiones Recomendadas

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",
    "bradlc.vscode-tailwindcss",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-typescript-next",
    "usernamehw.errorlens",
    "gruntfuggly.todo-tree"
  ]
}
```

---

## 15. Checklist de Desarrollo

### Antes de Iniciar una Feature

- [ ] Crear branch desde main actualizado
- [ ] Verificar que las dependencias estén instaladas
- [ ] Base de datos con migraciones actualizadas
- [ ] Variables de entorno configuradas

### Durante el Desarrollo

- [ ] Seguir la estructura de carpetas establecida
- [ ] Crear DTOs con validaciones
- [ ] Implementar manejo de errores apropiado
- [ ] Agregar logs donde sea necesario
- [ ] Documentar funciones complejas
- [ ] Usar transacciones cuando sea necesario

### Antes de Hacer Commit

- [ ] Ejecutar linter: `npm run lint`
- [ ] Ejecutar formatter: `npm run format`
- [ ] Ejecutar tests: `npm run test`
- [ ] Verificar que el código compile: `npm run build`
- [ ] Revisar cambios con `git diff`

### Antes de Pull Request

- [ ] Actualizar branch con main
- [ ] Resolver conflictos si existen
- [ ] Tests pasando al 100%
- [ ] Documentación actualizada
- [ ] Commits bien descritos

---

## 16. Resumen de Tecnologías - Solo Desarrollo

### Stack Principal

```
┌─────────────────────────────────────────────┐
│           DESARROLLO LOCAL                   │
├─────────────────────────────────────────────┤
│                                              │
│  Frontend:                                   │
│  ├─ Next.js 14 (React 18)                   │
│  ├─ TypeScript                               │
│  ├─ Tailwind CSS                             │
│  └─ React Query + Axios                      │
│                                              │
│  Backend:                                    │
│  ├─ NestJS 10                                │
│  ├─ TypeScript                               │
│  ├─ Prisma ORM                               │
│  └─ Socket.io                                │
│                                              │
│  Base de Datos:                              │
│  ├─ PostgreSQL 15                            │
│  └─ Redis 7                                  │
│                                              │
│  Herramientas:                               │
│  ├─ Docker Compose                           │
│  ├─ Jest (Testing)                           │
│  ├─ ESLint + Prettier                        │
│  └─ Git                                      │
└─────────────────────────────────────────────┘
```

### Versiones Específicas

```json
{
  "node": "20.x",
  "typescript": "5.x",
  "nestjs": "10.x",
  "nextjs": "14.x",
  "react": "18.x",
  "prisma": "5.x",
  "postgresql": "15.x",
  "redis": "7.x"
}
```

---

## 17. Próximos Pasos

### Fase 1: Setup (Semana 1)

1. **Día 1-2:** Configurar entorno de desarrollo
   - Instalar Node.js, VSCode, Docker
   - Clonar repositorio base
   - Configurar Docker Compose
   - Verificar que todo funcione

2. **Día 3-4:** Setup de Backend
   - Crear proyecto NestJS
   - Configurar Prisma
   - Crear schema inicial
   - Ejecutar primera migración

3. **Día 5:** Setup de Frontend
   - Crear proyecto Next.js
   - Configurar Tailwind
   - Crear estructura de carpetas
   - Integrar con API

### Fase 2: Desarrollo Core (Semanas 2-12)

Seguir el plan de implementación definido en el documento de arquitectura, enfocándose en:

1. Módulo de Autenticación
2. Integración SIGA
3. Módulo de Hackathons
4. Módulo de Equipos
5. Sistema de Retos y Rúbricas
6. Sistema de Evaluaciones
7. WebSockets y Tiempo Real
8. Testing y Refinamiento

---

## 📚 Recursos de Aprendizaje

### Documentación Oficial

- **NestJS:** https://docs.nestjs.com
- **Next.js:** https://nextjs.org/docs
- **Prisma:** https://www.prisma.io/docs
- **TypeScript:** https://www.typescriptlang.org/docs
- **PostgreSQL:** https://www.postgresql.org/docs
- **Socket.io:** https://socket.io/docs

### Tutoriales Recomendados

- NestJS Fundamentals: https://courses.nestjs.com
- Next.js 14 App Router: https://nextjs.org/learn
- Prisma Quickstart: https://www.prisma.io/docs/getting-started
- TypeScript Handbook: https://www.typescriptlang.org/docs/handbook

---

**Documento Técnico de Desarrollo**  
**Versión:** 3.0 - Enfoque 100% Desarrollo  
**Fecha:** Octubre 2025  
**Estado:** Listo para Implementación

Este documento se enfoca exclusivamente en las tecnologías de programación y desarrollo, sin consideraciones de infraestructura o deployment. Úsalo como guía técnica durante todo el proceso de desarrollo de HackatonTech2.model Equipo {
  id              Int       @id @default(autoincrement())
  hackathonId     Int
  hackathon       Hackathon @relation(fields: [hackathonId], references: [id], onDelete: Cascade)
  nombre          String
  liderId         Int
  lider           Usuario   @relation("EquipoLider", fields: [liderId], references: [id])
  createdAt       DateTime  @default(now())
  
  miembros        EquipoMiembro[]
  evaluaciones    Evaluacion[]
  
  @@map("equipos")
}

model EquipoMiembro {
  id          Int       @id @default(autoincrement())
  equipoId    Int
  equipo      Equipo    @relation(fields: [equipoId], references: [id], onDelete: Cascade)
  usuarioId   Int
  usuario     Usuario   @relation(fields: [usuarioId], references: [id])
  fechaUnion  DateTime  @default(now())
  
  @@unique([equipoId, usuarioId])
  @@map("equipo_miembros")
}

model Evaluacion {
  id              Int       @id @default(autoincrement())
  equipoId        Int
  equipo          Equipo    @relation(fields: [equipoId], references: [id])
  rubricaId       Int
  rubrica         Rubrica   @relation(fields: [rubricaId], references: [id])
  juezId          Int
  juez            Usuario   @relation(fields: [juezId], references: [id])
  puntuacion      Decimal   @db.Decimal(5, 2)
  comentarios     String?
  fechaEvaluacion DateTime  @default(now())
  
  @@unique([equipoId, rubricaId, juezId])
  @@map("evaluaciones")
}
```

### Comandos Prisma Útiles

```bash
# Crear migración después de cambios en schema
npx prisma migrate dev --name nombre_migracion

# Generar cliente de Prisma
npx prisma generate

# Abrir Prisma Studio (GUI para ver datos)
npx prisma studio

# Aplicar migraciones en producción
npx prisma migrate deploy

# Resetear base de datos (desarrollo)
npx prisma migrate reset

# Ver estado de migraciones
npx prisma migrate status
```

### Seed para Datos Iniciales

```typescript
// prisma/seed.ts
import { PrismaClient, Rol } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Limpiar datos existentes (solo desarrollo)
  await prisma.evaluacion.deleteMany();
  await prisma.equipoMiembro.deleteMany();
  await prisma.equipo.deleteMany();
  await prisma.rubrica.deleteMany();
  await prisma.reto.deleteMany();
  await prisma.tema.deleteMany();
  await prisma.hackathon.deleteMany();
  await prisma.usuario.deleteMany();

  // Crear usuarios de prueba
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const campistaPassword = await bcrypt.hash('Campista123!', 10);
  const juezPassword = await bcrypt.hash('Juez123!', 10);

  const admin = await prisma.usuario.create({
    data: {
      cedula: '1000000000',
      nombres: 'Administrador',
      apellidos: 'Sistema',
      email: 'admin@talentotech2.com',
      password: adminPassword,
      rol: Rol.ADMINISTRADOR,
      activo: true,
    },
  });

  const campista1 = await prisma.usuario.create({
    data: {
      cedula: '1001001001',
      nombres: 'Juan',
      apellidos: 'Pérez',
      email: 'juan.perez@example.com',
      password: campistaPassword,
      rol: Rol.CAMPISTA,
    },
  });

  const campista2 = await prisma.usuario.create({
    data: {
      cedula: '1002002002',
      nombres: 'María',
      apellidos: 'García',
      email: 'maria.garcia@example.com',
      password: campistaPassword,
      rol: Rol.CAMPISTA,
    },
  });

  const juez = await prisma.usuario.create({
    data: {
      cedula: '1003003003',
      nombres: 'Carlos',
      apellidos: 'Rodríguez',
      email: 'carlos.rodriguez@example.com',
      password: juezPassword,
      rol: Rol.JUEZ,
    },
  });

  console.log('✅ Usuarios creados');

  // Crear hackathon de ejemplo
  const hackathon = await prisma.hackathon.create({
    data: {
      nombre: 'Hackathon TalentoTech 2025',
      slug: 'hackathon-talentotech-2025',
      descripcion: 'Primera hackathon nacional de TalentoTech',
      fechaInicio: new Date('2025-11-01'),
      fechaFin: new Date('2025-11-03'),
      fechaCierreInscripcion: new Date('2025-10-30'),
      estado: 'PUBLICADO',
      maxMiembrosPorEquipo: 5,
      temas: {
        create: [
          {
            nombre: 'Programación',
            descripcion: 'Retos de desarrollo de software',
            orden: 1,
            retos: {
              create: [
                {
                  nombre: 'Sistema de Gestión Escolar',
                  tipoContenido: 'DIGITAL',
                  contenidoHtml: '<h2>Descripción</h2><p>Desarrollar un sistema completo de gestión escolar...</p>',
                  rubricas: {
                    create: [
                      {
                        nombre: 'Funcionalidad',
                        descripcion: 'El sistema cumple con todos los requisitos funcionales',
                        porcentaje: 30,
                        escalaMinima: 1,
                        escalaMaxima: 10,
                        orden: 1,
                      },
                      {
                        nombre: 'Código Limpio',
                        descripcion: 'Calidad del código, organización y buenas prácticas',
                        porcentaje: 25,
                        escalaMinima: 1,
                        escalaMaxima: 10,
                        orden: 2,
                      },
                      {
                        nombre: 'UI/UX',
                        descripcion: 'Diseño de interfaz y experiencia de usuario',
                        porcentaje: 20,
                        escalaMinima: 1,
                        escalaMaxima: 10,
                        orden: 3,
                      },
                      {
                        nombre: 'Innovación',
                        descripcion: 'Características innovadoras y creativas',
                        porcentaje: 15,
                        escalaMinima: 1,
                        escalaMaxima: 10,
                        orden: 4,
                      },
                      {
                        nombre: 'Documentación',
                        descripcion: 'Calidad de la documentación técnica',
                        porcentaje: 10,
                        escalaMinima: 1,
                        escalaMaxima: 10,
                        orden: 5,
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            nombre: 'Ciberseguridad',
            descripcion: 'Retos de seguridad informática',
            orden: 2,
          },
          {
            nombre: 'Inteligencia Artificial',
            descripcion: 'Retos de IA y Machine Learning',
            orden: 3,
          },
        ],
      },
    },
  });

  console.log('✅ Hackathon creado');

  // Crear equipo de ejemplo
  const equipo = await prisma.equipo.create({
    data: {
      nombre: 'Los Innovadores',
      hackathonId: hackathon.id,
      liderId: campista1.id,
      miembros: {
        create: [
          { usuarioId: campista1.id },
          { usuarioId: campista2.id },
        ],
      },
    },
  });

  console.log('✅ Equipo creado');

  console.log('\n📋 Credenciales de acceso:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👤 Admin:');
  console.log('   Usuario: 1000000000');
  console.log('   Password: Admin123!');
  console.log('\n👤 Campista 1:');
  console.log('   Usuario: 1001001001');
  console.log('   Password: Campista123!');
  console.log('\n👤 Juez:');
  console.log('   Usuario: 1003003003');
  console.log('   Password: Juez123!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## 7. Autenticación y Seguridad

### Módulo de Autenticación

```typescript
// src/modules/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(cedula: string, password: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { cedula },
    });

    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordValido = await bcrypt.compare(password, usuario.password);
    
    if (!passwordValido) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Actualizar último acceso
    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { updatedAt: new Date() },
    });

    const payload = { 
      sub: usuario.id, 
      cedula: usuario.cedula, 
      rol: usuario.rol 
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      usuario: {
        id: usuario.id,
        cedula: usuario.cedula,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        email: usuario.email,
        rol: usuario.rol,
      },
    };
  }

  async validarUsuario(cedula: string): Promise<any> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { cedula },
      select: {
        id: true,
        cedula: true,
        nombres: true,
        apellidos: true,
        email: true,
        rol: true,
        activo: true,
      },
    });

    return usuario;
  }

  async cambiarPassword(
    usuarioId: number, 
    passwordActual: string, 
    passwordNueva: string
  ) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
    });

    const passwordValido = await bcrypt.compare(passwordActual, usuario.password);
    
    if (!passwordValido) {
      throw new UnauthorizedException('Contraseña actual incorrecta');
    }

    const passwordHash = await bcrypt.hash(passwordNueva, 10);

    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { password: passwordHash },
    });

    return { mensaje: 'Contraseña actualizada exitosamente' };
  }
}
```

### Guards de Autorización

```typescript
// src/auth/guards/jwt-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
```

```typescript
// src/auth/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Rol } from '@prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Rol[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.rol === role);
  }
}
```

### Decoradores Personalizados

```typescript
// src/auth/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { Rol } from '@prisma/client';

export const Roles = (...roles: Rol[]) => SetMetadata('roles', roles);
```

```typescript
// src/auth/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

---

## 8. Integraciones SIGA y Moodle

### Servicio de Integración SIGA

```typescript
// src/modules/integraciones/siga/siga.service.ts
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SigaService {
  private baseUrl: string;
  private clientId: string;
  private secreto: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get('SIGA_BASE_URL');
    this.clientId = this.configService.get('SIGA_CLIENT_ID');
    this.secreto = this.configService.get('SIGA_SECRETO');
  }

  async obtenerToken(): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('client_id', this.clientId);
      formData.append('secreto', this.secreto);

      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/api/rest/obtener_token`, formData)
      );

      return response.data.access_token;
    } catch (error) {
      throw new HttpException(
        'Error al obtener token de SIGA',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  async validarCampista(cedula: string, fechaExpedicion: string) {
    const token = await this.obtenerToken();

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/api/rest/talentotech2/informacion_reporte_1003`,
          { soloactivos: true },
          {
            headers: {
              'token': token,
              'Content-Type': 'application/json'
            }
          }
        )
      );

      const campista = response.data.find(
        (c: any) => c.documento_numero === cedula && 
                    c.fecha_expedicion_documento === fechaExpedicion
      );

      if (!campista) {
        throw new HttpException(
          'Campista no encontrado en SIGA',
          HttpStatus.NOT_FOUND
        );
      }

      return {
        cedula: campista.documento_numero,
        nombres: campista.nombres,
        apellidos: campista.apellidos,
        email: campista.correo_electronico,
        telefono: campista.telefono_celular,
        departamento: campista.departamento,
        municipio: campista.municipio,
        programaInteres: campista.programa_interes,
        fechaNacimiento: campista.fecha_nacimiento,
        fechaExpedicion: campista.fecha_expedicion_documento,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error al consultar SIGA',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }
}
```

### Servicio de Integración Moodle

```typescript
// src/modules/integraciones/moodle/moodle.service.ts
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MoodleService {
  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  async obtenerBootcampsPorCampista(cedula: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.configService.get('MOODLE_API_URL')}/campista-bootcamps/${cedula}`,
          {
            headers: {
              'Authorization': `Bearer ${this.configService.get('MOODLE_API_KEY')}`
            }
          }
        )
      );

      return response.data;
    } catch (error) {
      console.error('Error consultando Moodle:', error.message);
      return [];
    }
  }

  mapearBootcampATema(nombreBootcamp: string): string {
    const keywords = {
      'PROGRAMACION': ['PROG', 'DESARROLLO', 'SOFTWARE', 'DEV'],
      'INTELIGENCIA_ARTIFICIAL': ['IA', 'AI', 'INTELIGENCIA', 'ARTIFICIAL'],
      'ANALISIS_DATOS': ['DATOS', 'DATA', 'ANALYTICS'],
      'ARQUITECTURA_NUBE': ['CLOUD', 'NUBE', 'AWS', 'AZURE'],
      'BLOCKCHAIN': ['BLOCKCHAIN', 'CRIPTO'],
      'CIBERSEGURIDAD': ['CYBER', 'SEGURIDAD', 'SECURITY'],
    };
    
    const texto = nombreBootcamp.toUpperCase();
    
    for (const [tema, palabras] of Object.entries(keywords)) {
      if (palabras.some(palabra => texto.includes(palabra))) {
        return tema;
      }
    }
    
    return 'GENERAL';
  }

  async recomendarTemasParaCampista(cedula: string): Promise<string[]> {
    const bootcamps = await this.obtenerBootcampsPorCampista(cedula);
    
    const temas = bootcamps
      .map((b: any) => this.mapearBootcampATema(b.nombreBootcamp))
      .filter((value: string, index: number, self: string[]) => 
        self.indexOf(value) === index
      );
    
    return temas;
  }
}
```

---

## 9. Sistema de Archivos

### Servicio de Storage con Multer

```typescript
// src/modules/storage/storage.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';

@Injectable()
export class StorageService {
  private uploadPath: string;

  constructor(private configService: ConfigService) {
    this.uploadPath = path.join(process.cwd(), 'uploads');
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory() {
    try {
      await fs.access(this.uploadPath);
    } catch {
      await fs.mkdir(this.uploadPath, { recursive: true });
    }
  }

  async guardarArchivoPDF(
    file: Express.Multer.File,
    hackathonId: number,
    retoId: number
  ): Promise<{ url: string; hash: string; tamano: number }> {
    // Generar hash del archivo
    const hash = createHash('sha256').update(file.buffer).digest('hex');

    // Crear estructura de carpetas
    const dirPath = path.join(
      this.uploadPath,
      'hackathons',
      hackathonId.toString(),
      'retos',
      retoId.toString()
    );

    await fs.mkdir(dirPath, { recursive: true });

    // Guardar archivo
    const fileName = `${Date.now()}_${file.originalname}`;
    const filePath = path.join(dirPath, fileName);

    await fs.writeFile(filePath, file.buffer);

    // Generar URL relativa
    const url = `/uploads/hackathons/${hackathonId}/retos/${retoId}/${fileName}`;

    return {
      url,
      hash,
      tamano: file.size
    };
  }

  async eliminarArchivo(url: string): Promise<void> {
    const filePath = path.join(process.cwd(), url);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error eliminando archivo:', error);
    }
  }
}
```

### Controlador para Upload

```typescript
// src/modules/retos/retos.controller.ts
import { 
  Controller, 
  Post, 
  UseInterceptors, 
  UploadedFile,
  ParseFilePipeBuilder,
  HttpStatus,
  Body,
  Param
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('api/retos')
export class RetosController {
  constructor(
    private retosService: RetosService,
    private storageService: StorageService
  ) {}

  @Post(':temaId/crear-con-pdf')
  @UseInterceptors(FileInterceptor('archivo_pdf'))
  async crearRetoPDF(
    @Param('temaId') temaId: string,
    @Body() createRetoDto: any,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: 'pdf' })
        .addMaxSizeValidator({ maxSize: 10 * 1024 * 1024 }) // 10MB
        .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY })
    )
    file: Express.Multer.File
  ) {
    // Guardar archivo
    const { url, hash, tamano } = await this.storageService.guardarArchivoPDF(
      file,
      createRetoDto.hackathonId,
      null // Se asignará el ID después de crear el reto
    );

    // Crear reto en BD
    return this.retosService.create({
      ...createRetoDto,
      temaId: +temaId,
      tipoContenido: 'PDF',
      archivoPdfUrl: url,
      archivoPdfNombre: file.originalname,
      archivoPdfTamano: tamano,
      archivoPdfHash: hash
    });
  }
}
```

---

## 10. WebSockets y Tiempo Real

### Gateway de WebSocket

```typescript
// src/modules/tiempo-real/tiempo-real.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class TiempoRealGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private conectados: Map<string, any> = new Map();

  handleConnection(client: Socket) {
    console.log(`✅ Cliente conectado: ${client.id}`);
    this.conectados.set(client.id, { socketId: client.id });
  }

  handleDisconnect(client: Socket) {
    console.log(`❌ Cliente desconectado: ${client.id}`);
    this.conectados.delete(client.id);
  }

  @SubscribeMessage('unirse_hackathon')
  handleUnirseHackathon(
    @MessageBody() hackathonId: number,
    @ConnectedSocket() client: Socket
  ) {
    const room = `hackathon_${hackathonId}`;
    client.join(room);
    console.log(`Cliente ${client.id} se unió a ${room}`);
    
    return { event: 'unido', data: { hackathonId, room } };
  }

  @SubscribeMessage('salir_hackathon')
  handleSalirHackathon(
    @MessageBody() hackathonId: number,
    @ConnectedSocket() client: Socket
  ) {
    const room = `hackathon_${hackathonId}`;
    client.leave(room);
    console.log(`Cliente ${client.id} salió de ${room}`);
  }

  // Métodos para emitir eventos
  emitirTablaActualizada(hackathonId: number, tabla: any[]) {
    this.server.to(`hackathon_${hackathonId}`).emit('tabla_actualizada', tabla);
  }

  emitirNuevaEvaluacion(hackathonId: number, evaluacion: any) {
    this.server.to(`hackathon_${hackathonId}`).emit('nueva_evaluacion', evaluacion);
  }

  emitirNotificacion(hackathonId: number, notificacion: any) {
    this.server.to(`hackathon_${hackathonId}`).emit('notificacion', notificacion);
  }
}
```

### Hook de WebSocket en Frontend

```typescript
// src/hooks/useWebSocket.ts
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useWebSocket(hackathonId: number) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [tablaPosiciones, setTablaPosiciones] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_WS_URL!);

    newSocket.on('connect', () => {
      console.log('✅ Conectado al WebSocket');
      setConnected(true);
      newSocket.emit('unirse_hackathon', hackathonId);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Desconectado del WebSocket');
      setConnected(false);
    });

    newSocket.on('tabla_actualizada', (data: any[]) => {
      console.log('📊 Tabla actualizada:', data);
      setTablaPosiciones(data);
    });

    newSocket.on('nueva_evaluacion', (data: any) => {
      console.log('⭐ Nueva evaluación:', data);
      // Mostrar notificación toast
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('salir_hackathon', hackathonId);
      newSocket.disconnect();
    };
  }, [hackathonId]);

  return { socket, tablaPosiciones, connected };
}
```

---

## 11. Testing

### Testing Unitario (Jest)

```typescript
// src/modules/hackathons/hackathons.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { HackathonsService } from './hackathons.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('HackathonsService', () => {
  let service: HackathonsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HackathonsService,
        {
          provide: PrismaService,
          useValue: {
            hackathon: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<HackathonsService>(HackathonsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debería crear un hackathon', async () => {
      const createDto = {
        nombre: 'Test Hackathon',
        fechaInicio: '2025-11-01',
        fechaFin: '2025-11-03',
        fechaCierreInscripcion: '2025-10-30',
      };

      const mockResult = {
        id: 1,
        slug: 'test-hackathon',
        ...createDto,
      };

      jest.spyOn(prisma.hackathon, 'create').mockResolvedValue(mockResult as any);

      const result = await service.create(createDto as any, 1);

      expect(result).toEqual(mockResult);
      expect(prisma.hackathon.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            nombre: createDto.nombre,
          }),
        })
      );
    });
  });

  describe('findAll', () => {
    it('debería retornar un array de hackathons', async () => {
      const mockHackathons = [
        { id: 1, nombre: 'Hackathon 1' },
        { id: 2, nombre: 'Hackathon 2' },
      ];

      jest.spyOn(# HackatonTech2 - Guía Completa de Desarrollo

> **Documento Técnico Enfocado en Desarrollo**  
> **Versión:** 3.0  
> **Fecha:** Octubre 2025

---

## 📋 Índice

1. [Stack Tecnológico de Desarrollo](#1-stack-tecnológico-de-desarrollo)
2. [Estructura del Proyecto](#2-estructura-del-proyecto)
3. [Setup del Entorno de Desarrollo](#3-setup-del-entorno-de-desarrollo)
4. [Backend con NestJS](#4-backend-con-nestjs)
5. [Frontend con Next.js](#5-frontend-con-nextjs)
6. [Base de Datos con Prisma](#6-base-de-datos-con-prisma)
7. [Autenticación y Seguridad](#7-autenticación-y-seguridad)
8. [Integraciones SIGA y Moodle](#8-integraciones-siga-y-moodle)
9. [Sistema de Archivos](#9-sistema-de-archivos)
10. [WebSockets y Tiempo Real](#10-websockets-y-tiempo-real)
11. [Testing](#11-testing)
12. [Buenas Prácticas](#12-buenas-prácticas)

---

## 1. Stack Tecnológico de Desarrollo

### Lenguajes y Frameworks Principales

| Tecnología | Uso | Razón de Elección |
|------------|-----|-------------------|
| **TypeScript** | Todo el proyecto | Type-safety, menos errores, mejor IDE |
| **NestJS** | Backend/API | Arquitectura escalable, modular |
| **Next.js** | Frontend | React con SSR, optimizado |
| **Prisma** | ORM | Type-safe, migrations fáciles |
| **PostgreSQL** | Base de datos | Robusta, relacional |
| **Redis** | Cache | Rápido, pub/sub |
| **Socket.io** | WebSockets | Tiempo real confiable |

### Herramientas de Desarrollo

```json
{
  "Editor": "Visual Studio Code",
  "Extensiones VSCode": [
    "Prisma",
    "ESLint",
    "Prettier",
    "TypeScript",
    "Docker",
    "REST Client"
  ],
  "Node.js": "20 LTS",
  "Package Manager": "npm o pnpm",
  "Git": "Para control de versiones"
}
```

---

## 2. Estructura del Proyecto

### Estructura de Carpetas (Monorepo)

```
hackatontech2/
├── backend/                    # API NestJS
│   ├── src/
│   │   ├── modules/           # Módulos funcionales
│   │   │   ├── auth/          # Autenticación
│   │   │   ├── usuarios/      # Gestión de usuarios
│   │   │   ├── hackathons/    # Hackathons
│   │   │   ├── equipos/       # Equipos
│   │   │   ├── retos/         # Retos
│   │   │   ├── evaluaciones/  # Evaluaciones
│   │   │   ├── integraciones/ # SIGA y Moodle
│   │   │   │   ├── siga/
│   │   │   │   └── moodle/
│   │   │   └── storage/       # Archivos
│   │   ├── common/            # Código compartido
│   │   │   ├── decorators/
│   │   │   ├── guards/
│   │   │   ├── interceptors/
│   │   │   └── filters/
│   │   ├── config/            # Configuración
│   │   └── main.ts            # Entry point
│   ├── prisma/
│   │   ├── schema.prisma      # Schema de BD
│   │   ├── migrations/        # Migraciones
│   │   └── seed.ts           # Datos iniciales
│   ├── test/                  # Tests
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                   # App Next.js
│   ├── src/
│   │   ├── app/               # App Router (Next.js 14)
│   │   │   ├── (auth)/        # Rutas de auth
│   │   │   ├── (dashboard)/   # Dashboards
│   │   │   │   ├── campista/
│   │   │   │   ├── juez/
│   │   │   │   └── admin/
│   │   │   └── layout.tsx
│   │   ├── components/        # Componentes React
│   │   │   ├── ui/           # Componentes base
│   │   │   ├── hackathon/
│   │   │   ├── equipos/
│   │   │   ├── retos/
│   │   │   └── evaluaciones/
│   │   ├── hooks/            # Custom hooks
│   │   ├── services/         # API calls
│   │   ├── types/            # TypeScript types
│   │   ├── utils/            # Utilidades
│   │   └── styles/           # Estilos globales
│   ├── public/               # Assets estáticos
│   ├── package.json
│   └── tsconfig.json
│
├── docker-compose.yml         # Desarrollo local
├── .gitignore
└── README.md
```

---

## 3. Setup del Entorno de Desarrollo

### Prerequisitos

```bash
# Verificar versiones
node --version    # v20.x.x
npm --version     # 10.x.x
git --version     # 2.x.x
```

### Instalación Paso a Paso

```bash
# 1. Clonar repositorio (cuando exista)
git clone https://github.com/talentotech2/hackatontech2.git
cd hackatontech2

# 2. Instalar dependencias del backend
cd backend
npm install

# 3. Instalar dependencias del frontend
cd ../frontend
npm install

# 4. Volver a raíz
cd ..

# 5. Iniciar servicios con Docker (PostgreSQL + Redis)
docker-compose up -d

# 6. Configurar variables de entorno
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# 7. Ejecutar migraciones de BD
cd backend
npx prisma migrate dev
npx prisma generate

# 8. Poblar BD con datos iniciales
npx prisma db seed

# 9. Iniciar backend en desarrollo
npm run start:dev

# En otra terminal, iniciar frontend
cd frontend
npm run dev
```

### Docker Compose para Desarrollo

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: hackatontech2_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin123
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

---

## 4. Backend con NestJS

### Configuración Inicial del Backend

```bash
# Crear proyecto NestJS
npm i -g @nestjs/cli
nest new backend
cd backend

# Instalar dependencias necesarias
npm install @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt
npm install @prisma/client @nestjs/throttler
npm install bcrypt class-validator class-transformer
npm install socket.io @nestjs/websockets @nestjs/platform-socket.io
npm install minio axios

# Dependencias de desarrollo
npm install -D @types/passport-jwt @types/bcrypt prisma
```

### Estructura de un Módulo (Ejemplo: Hackathons)

```typescript
// src/modules/hackathons/hackathons.module.ts
import { Module } from '@nestjs/common';
import { HackathonsController } from './hackathons.controller';
import { HackathonsService } from './hackathons.service';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HackathonsController],
  providers: [HackathonsService],
  exports: [HackathonsService],
})
export class HackathonsModule {}
```

```typescript
// src/modules/hackathons/hackathons.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  UseGuards,
  Query 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiBearerAuth 
} from '@nestjs/swagger';
import { HackathonsService } from './hackathons.service';
import { CreateHackathonDto } from './dto/create-hackathon.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';

@ApiTags('Hackathons')
@ApiBearerAuth()
@Controller('api/hackathons')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HackathonsController {
  constructor(private readonly hackathonsService: HackathonsService) {}

  @Post()
  @Roles('ADMINISTRADOR', 'COORDINADOR')
  @ApiOperation({ summary: 'Crear nuevo hackathon' })
  async create(
    @Body() createHackathonDto: CreateHackathonDto,
    @CurrentUser() user: any
  ) {
    return this.hackathonsService.create(createHackathonDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los hackathons' })
  async findAll(@Query('estado') estado?: string) {
    return this.hackathonsService.findAll(estado);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener hackathon por ID' })
  async findOne(@Param('id') id: string) {
    return this.hackathonsService.findOne(+id);
  }

  @Get(':id/tabla-posiciones')
  @ApiOperation({ summary: 'Obtener tabla de posiciones' })
  async getTablaPosiciones(@Param('id') id: string) {
    return this.hackathonsService.getTablaPosiciones(+id);
  }
}
```

```typescript
// src/modules/hackathons/hackathons.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateHackathonDto } from './dto/create-hackathon.dto';

@Injectable()
export class HackathonsService {
  constructor(private prisma: PrismaService) {}

  async create(createHackathonDto: CreateHackathonDto, creadorId: number) {
    // Generar slug único
    const slug = this.generateSlug(createHackathonDto.nombre);

    return this.prisma.hackathon.create({
      data: {
        ...createHackathonDto,
        slug,
        creadorId,
      },
      include: {
        temas: true,
      },
    });
  }

  async findAll(estado?: string) {
    return this.prisma.hackathon.findMany({
      where: estado ? { estado: estado as any } : {},
      include: {
        temas: {
          include: {
            retos: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
        _count: {
          select: {
            equipos: true,
            inscripciones: true,
          },
        },
      },
      orderBy: {
        fechaInicio: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const hackathon = await this.prisma.hackathon.findUnique({
      where: { id },
      include: {
        temas: {
          include: {
            retos: {
              include: {
                rubricas: true,
              },
            },
          },
        },
        equipos: {
          include: {
            miembros: {
              include: {
                usuario: {
                  select: {
                    id: true,
                    nombres: true,
                    apellidos: true,
                  },
                },
              },
            },
          },
        },
        creador: {
          select: {
            nombres: true,
            apellidos: true,
          },
        },
      },
    });

    if (!hackathon) {
      throw new NotFoundException(`Hackathon con ID ${id} no encontrado`);
    }

    return hackathon;
  }

  async getTablaPosiciones(hackathonId: number) {
    const equipos = await this.prisma.equipo.findMany({
      where: { hackathonId },
      include: {
        evaluaciones: {
          include: {
            rubrica: true,
          },
        },
        miembros: {
          include: {
            usuario: {
              select: {
                nombres: true,
                apellidos: true,
              },
            },
          },
        },
      },
    });

    const tabla = equipos
      .map(equipo => ({
        equipoId: equipo.id,
        nombreEquipo: equipo.nombre,
        miembros: equipo.miembros.length,
        puntuacionTotal: this.calcularPuntuacionTotal(equipo.evaluaciones),
        posicion: 0,
      }))
      .sort((a, b) => b.puntuacionTotal - a.puntuacionTotal)
      .map((item, index) => ({ ...item, posicion: index + 1 }));

    return tabla;
  }

  private calcularPuntuacionTotal(evaluaciones: any[]): number {
    // Agrupar por reto
    const evaluacionesPorReto = evaluaciones.reduce((acc, eval) => {
      const retoId = eval.rubrica.retoId;
      if (!acc[retoId]) acc[retoId] = [];
      acc[retoId].push(eval);
      return acc;
    }, {});

    // Calcular puntuación por reto y sumar
    return Object.values(evaluacionesPorReto).reduce((total: number, evals: any[]) => {
      const puntuacionReto = evals.reduce((sum, eval) => {
        const puntuacionNormalizada = (Number(eval.puntuacion) / eval.rubrica.escalaMaxima) * 100;
        const puntuacionPonderada = puntuacionNormalizada * (Number(eval.rubrica.porcentaje) / 100);
        return sum + puntuacionPonderada;
      }, 0);
      return total + puntuacionReto;
    }, 0);
  }

  private generateSlug(nombre: string): string {
    return nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
```

### DTOs para Validación

```typescript
// src/modules/hackathons/dto/create-hackathon.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsNotEmpty, 
  IsDateString, 
  IsInt, 
  Min, 
  Max, 
  IsOptional 
} from 'class-validator';

export class CreateHackathonDto {
  @ApiProperty({ example: 'Hackathon TalentoTech 2025' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ example: 'Primera hackathon nacional', required: false })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({ example: '2025-11-01T00:00:00Z' })
  @IsDateString()
  fechaInicio: string;

  @ApiProperty({ example: '2025-11-03T23:59:59Z' })
  @IsDateString()
  fechaFin: string;

  @ApiProperty({ example: '2025-10-01T00:00:00Z' })
  @IsDateString()
  fechaInicioInscripcion: string;

  @ApiProperty({ example: '2025-10-30T23:59:59Z' })
  @IsDateString()
  fechaCierreInscripcion: string;

  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(1)
  @Max(10)
  maxMiembrosPorEquipo: number;
}
```

---

## 5. Frontend con Next.js

### Configuración Inicial del Frontend

```bash
# Crear proyecto Next.js
npx create-next-app@latest frontend --typescript --tailwind --app
cd frontend

# Instalar dependencias necesarias
npm install axios react-query socket.io-client
npm install lucide-react react-hook-form zod @hookform/resolvers
npm install recharts date-fns
npm install react-hot-toast
```

### Configuración de Next.js

```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
  },
  images: {
    domains: ['localhost', 'hackatontech2.com'],
  },
}

module.exports = nextConfig
```

### Servicio de API (Axios)

```typescript
// src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado, redirect a login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Hooks Personalizados

```typescript
// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import api from '@/services/api';

interface User {
  id: number;
  cedula: string;
  nombres: string;
  apellidos: string;
  email: string;
  rol: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await api.get('/api/auth/me');
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (cedula: string, password: string) => {
    const response = await api.post('/api/auth/login', { cedula, password });
    const { access_token, usuario } = response.data;
    
    localStorage.setItem('token', access_token);
    setUser(usuario);
    
    return usuario;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/login';
  };

  return { user, loading, login, logout };
}
```

```typescript
// src/hooks/useHackathons.ts
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '@/services/api';

export function useHackathons() {
  return useQuery('hackathons', async () => {
    const response = await api.get('/api/hackathons');
    return response.data;
  });
}

export function useHackathon(id: number) {
  return useQuery(['hackathon', id], async () => {
    const response = await api.get(`/api/hackathons/${id}`);
    return response.data;
  });
}

export function useCreateHackathon() {
  const queryClient = useQueryClient();
  
  return useMutation(
    async (data: any) => {
      const response = await api.post('/api/hackathons', data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('hackathons');
      },
    }
  );
}
```

### Componente de Ejemplo

```typescript
// src/components/hackathon/HackathonCard.tsx
import { Calendar, Users, Trophy } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface HackathonCardProps {
  hackathon: {
    id: number;
    nombre: string;
    descripcion: string;
    fechaInicio: string;
    fechaFin: string;
    estado: string;
    _count: {
      equipos: number;
      inscripciones: number;
    };
  };
}

export function HackathonCard({ hackathon }: HackathonCardProps) {
  const fechaInicio = new Date(hackathon.fechaInicio);
  const fechaFin = new Date(hackathon.fechaFin);

  return (
    <Link href={`/hackathons/${hackathon.id}`}>
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 cursor-pointer">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-gray-900">
            {hackathon.nombre}
          </h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            hackathon.estado === 'EN_CURSO' 
              ? 'bg-green-100 text-green-800'
              : hackathon.estado === 'PUBLICADO'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {hackathon.estado}
          </span>
        </div>

        <p className="text-gray-600 mb-4 line-clamp-2">
          {hackathon.descripcion}
        </p>

        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="w-4 h-4 mr-2" />
            {format(fechaInicio, 'dd MMM', { locale: es })} - {format(fechaFin, 'dd MMM yyyy', { locale: es })}
          </div>

          <div className="flex items-center text-sm text-gray-500">
            <Users className="w-4 h-4 mr-2" />
            {hackathon._count.equipos} equipos · {hackathon._count.inscripciones} inscritos
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <button className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center">
            <Trophy className="w-4 h-4 mr-2" />
            Ver Detalles
          </button>
        </div>
      </div>
    </Link>
  );
}
```

### Página de Dashboard

```typescript
// src/app/(dashboard)/campista/page.tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useHackathons } from '@/hooks/useHackathons';
import { HackathonCard } from '@/components/hackathon/HackathonCard';
import { Loader2 } from 'lucide-react';

export default function CampistaDashboard() {
  const { user } = useAuth();
  const { data: hackathons, isLoading } = useHackathons();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Bienvenido, {user?.nombres}
        </h1>
        <p className="text-gray-600 mt-2">
          Encuentra y participa en hackathones
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hackathons?.map((hackathon: any) => (
          <HackathonCard key={hackathon.id} hackathon={hackathon} />
        ))}
      </div>

      {hackathons?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            No hay hackathones disponibles en este momento
          </p>
        </div>
      )}
    </div>
  );
}
```

---

## 6. Base de Datos con Prisma

### Schema Principal

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Usuario {
  id              Int       @id @default(autoincrement())
  cedula          String    @unique
  nombres         String
  apellidos       String
  email           String    @unique
  password        String
  rol             Rol       @default(CAMPISTA)
  activo          Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  equiposLiderados Equipo[] @relation("EquipoLider")
  miembrosEquipo  EquipoMiembro[]
  evaluaciones    Evaluacion[]
  
  @@map("usuarios")
}

enum Rol {
  CAMPISTA
  JUEZ
  ADMINISTRADOR
  COORDINADOR
}

model Hackathon {
  id                  Int       @id @default(autoincrement())
  nombre              String
  slug                String    @unique
  descripcion         String?
  fechaInicio         DateTime
  fechaFin            DateTime
  fechaCierreInscripcion DateTime
  estado              String    @default("BORRADOR")
  maxMiembrosPorEquipo Int      @default(5)
  createdAt           DateTime  @default(now())
  
  temas               Tema[]
  equipos             Equipo[]
  
  @@map("hackathons")
}

model Tema {
  id            Int       @id @default(autoincrement())
  hackathonId   Int
  hackathon     Hackathon @relation(fields: [hackathonId], references: [id], onDelete: Cascade)
  nombre        String
  descripcion   String?
  orden         Int       @default(0)
  
  retos         Reto[]
  
  @@map("temas")
}

model Reto {
  id                Int       @id @default(autoincrement())
  temaId            Int
  tema              Tema      @relation(fields: [temaId], references: [id], onDelete: Cascade)
  nombre            String
  tipoContenido     String    // DIGITAL, PDF, HIBRIDO
  contenidoHtml     String?
  archivoPdfUrl     String?
  archivoPdfNombre  String?
  createdAt         DateTime  @default(now())
  
  rubricas          Rubrica[]
  
  @@map("retos")
}

model Rubrica {
  id              Int       @id @default(autoincrement())
  retoId          Int
  reto            Reto      @relation(fields: [retoId], references: [id], onDelete: Cascade)
  nombre          String
  descripcion     String
  porcentaje      Decimal   @db.Decimal(5, 2)
  escalaMinima    Int       @default(1)
  escalaMaxima    Int       @default(10)
  orden           Int       @default(0)
  
  evaluaciones    Evaluacion[]
  
  @@map("rubricas")
}

model Equipo {
  id              Int       @id @default(autoincrement())
  hackathonId     Int
  hackathon       Hackathon @relation(fields: [hackathonId], references: [id], onDelete: Cascade)
  nombre          String
  liderId         Int
  lider           Usuario   @relation("EquipoL