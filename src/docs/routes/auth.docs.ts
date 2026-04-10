/**
 * Swagger docs for Auth routes
 * Each route has: description, request body, and response examples
 */

export const authDocs = {
  // ── POST /api/auth/register ───────────────────────────────────────────────
  '/api/auth/register': {
    post: {
      tags: ['Auth'],
      summary: 'Register a new user',
      description: 'Creates a new account. Returns a JWT token and user info.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['username', 'email', 'password'],
              properties: {
                username: { type: 'string', example: 'john_doe', minLength: 3, maxLength: 30 },
                email:    { type: 'string', example: 'john@example.com', format: 'email' },
                password: { type: 'string', example: 'secret123', minLength: 6 },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'User created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  token: { type: 'string', example: 'eyJhbGci...' },
                  user: {
                    type: 'object',
                    properties: {
                      _id:      { type: 'string' },
                      username: { type: 'string' },
                      email:    { type: 'string' },
                      isOnline: { type: 'boolean' },
                    },
                  },
                },
              },
            },
          },
        },
        400: { description: 'Validation error or email/username already taken' },
        500: { description: 'Server error' },
      },
    },
  },

  // ── POST /api/auth/login ──────────────────────────────────────────────────
  '/api/auth/login': {
    post: {
      tags: ['Auth'],
      summary: 'Login with email and password',
      description: 'Returns a JWT token if credentials are correct.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password'],
              properties: {
                email:    { type: 'string', example: 'john@example.com' },
                password: { type: 'string', example: 'secret123' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Login successful',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  token: { type: 'string' },
                  user: { type: 'object' },
                },
              },
            },
          },
        },
        400: { description: 'Missing fields' },
        401: { description: 'Invalid email or password' },
      },
    },
  },
};
