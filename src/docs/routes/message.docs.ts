/**
 * Swagger docs for Message and Conversation routes
 */

export const messageDocs = {
  // ── GET /api/messages/:conversationId ─────────────────────────────────────
  '/api/messages/{conversationId}': {
    get: {
      tags: ['Messages'],
      summary: 'Get all messages in a conversation',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'conversationId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'The ID of the conversation',
        },
      ],
      responses: {
        200: {
          description: 'List of messages',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    _id:            { type: 'string' },
                    conversationId: { type: 'string' },
                    text:           { type: 'string' },
                    content:        { type: 'string', description: 'Alias for text' },
                    edited:         { type: 'boolean' },
                    status:         { type: 'string', enum: ['sent', 'delivered', 'seen'] },
                    createdAt:      { type: 'string', format: 'date-time' },
                    sender: {
                      type: 'object',
                      properties: {
                        _id:      { type: 'string' },
                        username: { type: 'string' },
                        email:    { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Not a participant' },
      },
    },
  },

  // ── POST /api/messages ────────────────────────────────────────────────────
  '/api/messages': {
    post: {
      tags: ['Messages'],
      summary: 'Send a new message',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['conversationId', 'text'],
              properties: {
                conversationId: { type: 'string', example: '64abc...' },
                text:           { type: 'string', example: 'Hello!' },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'Message sent' },
        400: { description: 'Validation error' },
        403: { description: 'Not a participant' },
      },
    },
  },

  // ── PUT /api/messages/:messageId ──────────────────────────────────────────
  '/api/messages/{messageId}': {
    put: {
      tags: ['Messages'],
      summary: 'Edit a message',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'messageId', in: 'path', required: true, schema: { type: 'string' } },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['text'],
              properties: { text: { type: 'string', example: 'Edited message' } },
            },
          },
        },
      },
      responses: {
        200: { description: 'Message updated' },
        403: { description: 'Not your message' },
        404: { description: 'Message not found' },
      },
    },

    // ── DELETE /api/messages/:messageId ───────────────────────────────────
    delete: {
      tags: ['Messages'],
      summary: 'Delete a message',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'messageId', in: 'path', required: true, schema: { type: 'string' } },
      ],
      responses: {
        200: { description: 'Message deleted' },
        403: { description: 'Not your message' },
        404: { description: 'Message not found' },
      },
    },
  },
};

export const conversationDocs = {
  // ── GET /api/conversations ────────────────────────────────────────────────
  '/api/conversations': {
    get: {
      tags: ['Conversations'],
      summary: 'Get all conversations for the logged-in user',
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: 'List of conversations' },
        401: { description: 'Unauthorized' },
      },
    },
    post: {
      tags: ['Conversations'],
      summary: 'Create a new conversation (direct or group)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              oneOf: [
                {
                  title: 'Direct conversation',
                  type: 'object',
                  required: ['participantId'],
                  properties: { participantId: { type: 'string' } },
                },
                {
                  title: 'Group conversation',
                  type: 'object',
                  required: ['isGroup', 'groupName', 'participantIds'],
                  properties: {
                    isGroup:        { type: 'boolean', example: true },
                    groupName:      { type: 'string', example: 'Dev Team' },
                    participantIds: { type: 'array', items: { type: 'string' } },
                  },
                },
              ],
            },
          },
        },
      },
      responses: {
        200: { description: 'Existing or new conversation returned' },
        201: { description: 'New group conversation created' },
      },
    },
  },

  '/api/conversations/{conversationId}': {
    delete: {
      tags: ['Conversations'],
      summary: 'Delete a conversation (removes all messages)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'conversationId', in: 'path', required: true, schema: { type: 'string' } },
      ],
      responses: {
        200: { description: 'Conversation deleted' },
        404: { description: 'Conversation not found' },
      },
    },
  },
};
