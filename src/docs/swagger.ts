/**
 * Swagger Setup
 * Combines all route docs and configures the Swagger UI.
 *
 * Access the docs at: http://localhost:5000/api-docs
 */
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { authDocs } from './routes/auth.docs';
import { messageDocs, conversationDocs } from './routes/message.docs';

// ── Build the full OpenAPI spec ───────────────────────────────────────────────
const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Pulse Chat API',
    version: '1.0.0',
    description: 'REST API for the Pulse real-time chat application',
  },
  servers: [
    { url: 'http://localhost:5000', description: 'Local development server' },
  ],
  // ── Security scheme: Bearer JWT ────────────────────────────────────────────
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste your JWT token here (without "Bearer " prefix)',
      },
    },
  },
  // ── Combine all route docs ─────────────────────────────────────────────────
  paths: {
    ...authDocs,
    ...messageDocs,
    ...conversationDocs,
  },
};

// ── Register Swagger UI on Express ────────────────────────────────────────────
export const setupSwagger = (app: Express): void => {
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'Pulse Chat API Docs',
      swaggerOptions: {
        persistAuthorization: true,   // keeps JWT between page refreshes
      },
    })
  );

  console.log('📄 Swagger docs available at http://localhost:5000/api-docs');
};
