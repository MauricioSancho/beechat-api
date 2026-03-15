/**
 * Configuración Swagger/OpenAPI 3.0
 * Docs disponibles en:  GET /api/docs
 * Spec JSON en:         GET /api/docs.json
 */

const swaggerConfig = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BeeChat API',
      version: '1.0.0',
      description: `
## BeeChat REST API

Backend para la aplicación de mensajería BeeChat.

### Autenticación
Usa **Bearer JWT**. Obtén tu token con \`POST /auth/login\` y pégalo en el botón **Authorize** arriba.

### Refresh Token
Se guarda en una **cookie HttpOnly** llamada \`refreshToken\`. No es accesible desde JS.
      `,
    },
    servers: [
      {
        url: process.env.BASE_URL
          ? `${process.env.BASE_URL}/api/v1`
          : 'http://localhost:3005/api/v1',
        description: process.env.NODE_ENV === 'production' ? 'Production' : 'Development',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Pega el access token obtenido en /auth/login',
        },
      },
      schemas: {
        // ── Respuesta genérica ──────────────────────────────────
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' },
            data: { type: 'object' },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'array', items: {} },
            pagination: {
              type: 'object',
              properties: {
                page:       { type: 'integer', example: 1 },
                limit:      { type: 'integer', example: 20 },
                total:      { type: 'integer', example: 150 },
                totalPages: { type: 'integer', example: 8 },
              },
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Something went wrong' },
            errors:  { type: 'array', items: { type: 'object' } },
          },
        },
        // ── Auth ────────────────────────────────────────────────
        AuthResponse: {
          type: 'object',
          properties: {
            success:      { type: 'boolean', example: true },
            message:      { type: 'string',  example: 'Login successful' },
            data: {
              type: 'object',
              properties: {
                accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
                user: { $ref: '#/components/schemas/UserPublic' },
              },
            },
          },
        },
        // ── User ────────────────────────────────────────────────
        UserPublic: {
          type: 'object',
          properties: {
            id:           { type: 'integer', example: 1 },
            uuid:         { type: 'string',  format: 'uuid' },
            username:     { type: 'string',  example: 'john_doe' },
            display_name: { type: 'string',  example: 'John Doe' },
            avatar_url:   { type: 'string',  nullable: true },
            bio:          { type: 'string',  nullable: true },
            is_verified:  { type: 'boolean', example: true },
            last_seen:    { type: 'string',  format: 'date-time', nullable: true },
          },
        },
        // ── Message ─────────────────────────────────────────────
        Message: {
          type: 'object',
          properties: {
            id:           { type: 'integer', example: 42 },
            uuid:         { type: 'string',  format: 'uuid' },
            chat_id:      { type: 'integer', example: 5 },
            sender_id:    { type: 'integer', example: 1 },
            content:      { type: 'string',  example: 'Hola mundo' },
            message_type: { type: 'string',  enum: ['text','image','video','audio','document'] },
            is_edited:    { type: 'boolean', example: false },
            created_at:   { type: 'string',  format: 'date-time' },
          },
        },
      },
      // ── Respuestas reutilizables ─────────────────────────────
      responses: {
        ValidationError: {
          description: 'Error de validación en los parámetros enviados',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        Unauthorized: {
          description: 'Token inválido o no enviado',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        NotFound: {
          description: 'Recurso no encontrado',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  // Archivos donde swagger-jsdoc busca anotaciones @swagger
  apis: ['./src/modules/**/*.routes.js'],
};

module.exports = { swaggerConfig };
