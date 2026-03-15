# BeeChat API

REST API backend profesional para la aplicación de mensajería BeeChat, construida con Node.js, Express y SQL Server.

## Stack Tecnológico

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Base de Datos**: SQL Server (mssql)
- **Autenticación**: JWT (access + refresh tokens)
- **Seguridad**: bcryptjs, helmet, cors, rate-limiting
- **Validaciones**: express-validator
- **Archivos**: multer
- **Logs**: winston + morgan

## Estructura del Proyecto

```
src/
├── config/          → Configuración de DB, JWT, multer, swagger
├── database/        → Conexión pool y helper de queries
├── modules/         → Módulos de negocio (auth, users, chats, etc.)
│   ├── auth/
│   ├── users/
│   ├── contacts/
│   ├── chats/
│   ├── messages/
│   ├── groups/
│   ├── stories/
│   ├── uploads/
│   ├── admin/
│   ├── devices/
│   ├── notifications/
│   └── bee_assist/
├── middlewares/     → Auth, error handler, rate limiter, upload
├── utils/           → Helpers de respuesta, logger, paginación, tokens
├── shared/          → Constantes, enums, AppError
├── sockets/         → Stub preparado para Socket.IO
├── app.js           → Factory de Express
└── server.js        → Punto de entrada
database/
└── scripts/         → SQL: base de datos, tablas, índices, seed
uploads/             → Archivos multimedia subidos por usuarios
logs/                → Archivos de log
```

## Instalación Local

### Prerrequisitos

- Node.js 18 o superior
- SQL Server (local o remoto) con SSMS
- npm o yarn

### Pasos

**1. Clonar e instalar dependencias**

```bash
git clone https://github.com/MauricioSancho/beechat-api.git
cd beechat-api
npm install
```

**2. Configurar variables de entorno**

```bash
cp .env.example .env
# Editar .env con tus credenciales reales
```

Variables mínimas requeridas:
- `DB_SERVER`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (mínimo 64 caracteres cada uno)

**3. Crear la base de datos**

Abrir SQL Server Management Studio (SSMS) y ejecutar los scripts en orden:

```
database/scripts/01_create_database.sql
database/scripts/02_create_tables.sql
database/scripts/03_create_indexes.sql
database/scripts/04_seed_data.sql
```

**4. Iniciar el servidor**

```bash
# Desarrollo (con hot-reload)
npm run dev

# Producción
npm start
```

El servidor arrancará en `http://localhost:3000`

### Verificar que funciona

```bash
# Health check
curl http://localhost:3000/api/v1/health

# Registrar usuario
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"phone":"+5491155551234","username":"testuser","password":"Test@1234","displayName":"Test User"}'
```

---

## Endpoints Principales

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/v1/auth/register` | - | Registrar usuario |
| POST | `/api/v1/auth/login` | - | Iniciar sesión |
| POST | `/api/v1/auth/logout` | JWT | Cerrar sesión |
| POST | `/api/v1/auth/refresh-token` | Cookie | Renovar access token |
| GET | `/api/v1/users/me` | JWT | Obtener perfil propio |
| PUT | `/api/v1/users/me` | JWT | Actualizar perfil |
| GET | `/api/v1/contacts` | JWT | Listar contactos |
| GET | `/api/v1/chats` | JWT | Listar chats |
| POST | `/api/v1/chats/private` | JWT | Crear/obtener chat privado |
| GET | `/api/v1/chats/:id/messages` | JWT | Mensajes de un chat |
| POST | `/api/v1/chats/:id/messages` | JWT | Enviar mensaje |
| POST | `/api/v1/groups` | JWT | Crear grupo |
| POST | `/api/v1/stories` | JWT | Crear story |
| POST | `/api/v1/uploads/image` | JWT | Subir imagen |
| POST | `/api/v1/admin/login` | - | Login administrador |
| GET | `/api/v1/admin/dashboard` | JWT+Admin | Panel admin |

Ver lista completa de 50+ endpoints en la documentación Swagger (próxima fase).

---

## Formato de Respuesta API

```json
// Éxito
{
  "success": true,
  "data": { ... }
}

// Lista paginada
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 143,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User not found"
  }
}

// Error de validación
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Validation failed",
    "details": [
      { "field": "phone", "message": "Phone number is required" }
    ]
  }
}
```

---

## Despliegue en Plesk

### Prerrequisitos en el servidor
- Node.js 18+ instalado en Plesk
- SQL Server accesible desde el servidor
- Dominio o subdominio configurado

### Pasos

**1. Subir archivos**

Subir el proyecto al servidor (excluyendo `node_modules/`, `.env`, `uploads/`, `logs/`).

**2. Configurar la aplicación Node.js en Plesk**

1. Ir a **Dominios** → Tu dominio → **Node.js**
2. Modo de aplicación: **Production**
3. Versión de Node.js: `18.x` o superior
4. Archivo raíz de la aplicación: `src/server.js`
5. Directorio de la aplicación: la carpeta del proyecto

**3. Instalar dependencias**

En la consola de Plesk o SSH:
```bash
cd /ruta/a/beechat-api
npm install --production
```

**4. Variables de entorno**

En Plesk → Variables de entorno, agregar todas las de `.env.example` con valores de producción:
- `NODE_ENV=production`
- `PORT` (Plesk lo asigna automáticamente)
- Credenciales de SQL Server de producción
- JWT secrets seguros (64+ caracteres aleatorios)
- `BASE_URL=https://tudominio.com`
- `DB_ENCRYPT=true` (recomendado en producción)

**5. Crear carpetas de uploads y logs**

```bash
mkdir -p uploads/images uploads/videos uploads/audio uploads/documents logs
chmod 755 uploads logs
```

**6. Ejecutar scripts SQL**

Conectar a SQL Server de producción con SSMS y ejecutar los scripts en orden numérico.

**7. Iniciar la aplicación**

Usar el botón **Restart** en la sección Node.js de Plesk, o desde SSH:
```bash
npm start
```

**8. Verificar**

```bash
curl https://tudominio.com/api/v1/health
```

### Consideraciones de Producción

- Los archivos en `uploads/` deben tener permisos de escritura
- Configurar backup regular de la base de datos SQL Server
- Usar HTTPS (certificado SSL en Plesk)
- Activar `DB_ENCRYPT=true` para conexiones SQL Server
- Rotar los JWT secrets periódicamente
- Monitorear `logs/app.log`

---

## Próximas Fases

### Fase 2 — Mensajería en Tiempo Real (Socket.IO)
- Mensajes en tiempo real por chat
- Indicadores de escritura
- Confirmaciones de entrega/lectura en vivo
- Presencia de usuarios (online/offline)

### Fase 3 — Notificaciones Push
- Integración Firebase Cloud Messaging (FCM)
- Notificaciones por nuevo mensaje
- Notificaciones por mención en grupos

### Fase 4 — Documentación y Testing
- Swagger/OpenAPI 3.0 completo
- Tests unitarios por módulo
- Tests de integración de endpoints

### Fase 5 — IA y Features Avanzados
- Bee Assist con integración real a OpenAI
- Búsqueda semántica de mensajes
- Resumen automático de conversaciones largas

---

## Credenciales de Prueba (Seed)

Después de ejecutar el script de seed:

**Admin**:
- Email: `admin@beechat.com`
- Password: `Admin@BeeChat2024`

> ⚠️ Cambiar estas credenciales inmediatamente en producción.
