const defaultSuccess = {
  description: 'Success',
  content: {
    'application/json': {
      schema: {
        $ref: '#/components/schemas/ApiSuccess',
      },
    },
  },
};

const noContent = {
  description: 'No content',
};

const defaultError = {
  description: 'Error',
  content: {
    'application/json': {
      schema: {
        $ref: '#/components/schemas/ApiError',
      },
    },
  },
};

const authParam = [
  {
    in: 'header',
    name: 'Authorization',
    required: true,
    schema: { type: 'string', example: 'Bearer <access-token>' },
  },
];

const careerIdParam = {
  in: 'path',
  name: 'careerId',
  required: true,
  schema: { type: 'string' },
};

const idParam = {
  in: 'path',
  name: 'id',
  required: true,
  schema: { type: 'string' },
};

const paths = {
  '/api/health': {
    get: {
      tags: ['Core'],
      summary: 'Health check',
      responses: { 200: defaultSuccess },
    },
  },
  '/api/auth/signup': {
    post: {
      tags: ['Auth'],
      summary: 'Sign up',
      responses: { 201: defaultSuccess, 400: defaultError, 409: defaultError },
    },
  },
  '/api/auth/login': {
    post: {
      tags: ['Auth'],
      summary: 'Login',
      responses: { 200: defaultSuccess, 401: defaultError },
    },
  },
  '/api/auth/refresh': {
    post: {
      tags: ['Auth'],
      summary: 'Refresh access token',
      responses: { 200: defaultSuccess, 401: defaultError },
    },
  },
  '/api/auth/logout': {
    post: {
      tags: ['Auth'],
      summary: 'Logout',
      responses: { 204: noContent },
    },
  },
  '/api/auth/forgot-password': {
    post: {
      tags: ['Auth'],
      summary: 'Request password reset token',
      responses: { 200: defaultSuccess, 400: defaultError },
    },
  },
  '/api/auth/reset-password': {
    post: {
      tags: ['Auth'],
      summary: 'Reset password with token',
      responses: { 200: defaultSuccess, 400: defaultError },
    },
  },
  '/api/users/me': {
    get: {
      tags: ['Users'],
      summary: 'Get current user',
      parameters: authParam,
      responses: { 200: defaultSuccess, 401: defaultError },
    },
    patch: {
      tags: ['Users'],
      summary: 'Update current user',
      parameters: authParam,
      responses: { 200: defaultSuccess, 400: defaultError, 401: defaultError },
    },
    delete: {
      tags: ['Users'],
      summary: 'Delete current user',
      parameters: authParam,
      responses: { 204: noContent, 401: defaultError },
    },
  },
  '/api/careers': {
    get: {
      tags: ['Careers'],
      summary: 'List careers',
      parameters: authParam,
      responses: { 200: defaultSuccess, 401: defaultError },
    },
    post: {
      tags: ['Careers'],
      summary: 'Create career',
      parameters: authParam,
      responses: { 201: defaultSuccess, 400: defaultError, 401: defaultError },
    },
  },
  '/api/careers/{id}': {
    get: {
      tags: ['Careers'],
      summary: 'Get career',
      parameters: [...authParam, idParam],
      responses: { 200: defaultSuccess, 401: defaultError, 404: defaultError },
    },
    patch: {
      tags: ['Careers'],
      summary: 'Update career',
      parameters: [...authParam, idParam],
      responses: { 200: defaultSuccess, 400: defaultError, 401: defaultError, 404: defaultError },
    },
    delete: {
      tags: ['Careers'],
      summary: 'Delete career',
      parameters: [...authParam, idParam],
      responses: { 204: noContent, 401: defaultError, 404: defaultError },
    },
  },
  '/api/careers/{id}/activate': {
    post: {
      tags: ['Careers'],
      summary: 'Activate career',
      parameters: [...authParam, idParam],
      responses: { 200: defaultSuccess, 401: defaultError, 404: defaultError },
    },
  },
  '/api/careers/{id}/performance-insights': {
    get: {
      tags: ['Careers'],
      summary: 'Generate AI insights from recent performance and full career data',
      parameters: [...authParam, idParam],
      responses: { 200: defaultSuccess, 400: defaultError, 401: defaultError, 404: defaultError, 502: defaultError },
    },
  },
  '/api/careers/{careerId}/matches': {
    get: {
      tags: ['Matches'],
      summary: 'List matches',
      parameters: [...authParam, careerIdParam],
      responses: { 200: defaultSuccess, 401: defaultError, 404: defaultError },
    },
    post: {
      tags: ['Matches'],
      summary: 'Create match',
      parameters: [...authParam, careerIdParam],
      responses: { 201: defaultSuccess, 400: defaultError, 401: defaultError, 404: defaultError },
    },
  },
  '/api/careers/{careerId}/matches/analyze-performance': {
    post: {
      tags: ['Matches'],
      summary: 'Analyze performance image(s) and suggest match fields',
      parameters: [...authParam, careerIdParam],
      responses: { 200: defaultSuccess, 400: defaultError, 401: defaultError, 404: defaultError, 502: defaultError },
    },
  },
  '/api/careers/{careerId}/matches/{id}': {
    get: {
      tags: ['Matches'],
      summary: 'Get match',
      parameters: [...authParam, careerIdParam, idParam],
      responses: { 200: defaultSuccess, 401: defaultError, 404: defaultError },
    },
    patch: {
      tags: ['Matches'],
      summary: 'Update match',
      parameters: [...authParam, careerIdParam, idParam],
      responses: { 200: defaultSuccess, 400: defaultError, 401: defaultError, 404: defaultError },
    },
    delete: {
      tags: ['Matches'],
      summary: 'Delete match',
      parameters: [...authParam, careerIdParam, idParam],
      responses: { 204: noContent, 401: defaultError, 404: defaultError },
    },
  },
  '/api/careers/{careerId}/matches/{id}/pin': {
    post: {
      tags: ['Matches'],
      summary: 'Toggle match pin',
      parameters: [...authParam, careerIdParam, idParam],
      responses: { 200: defaultSuccess, 401: defaultError, 404: defaultError },
    },
  },
  '/api/careers/{careerId}/matches/{id}/performance-image': {
    post: {
      tags: ['Matches'],
      summary: 'Upload or replace match performance image',
      parameters: [...authParam, careerIdParam, idParam],
      responses: { 200: defaultSuccess, 400: defaultError, 401: defaultError, 404: defaultError },
    },
    delete: {
      tags: ['Matches'],
      summary: 'Delete match performance image',
      parameters: [...authParam, careerIdParam, idParam],
      responses: { 200: defaultSuccess, 401: defaultError, 404: defaultError },
    },
  },
  '/api/careers/{careerId}/trophies': {
    get: {
      tags: ['Seasons'],
      summary: 'List trophies',
      parameters: [...authParam, careerIdParam],
      responses: { 200: defaultSuccess, 401: defaultError, 404: defaultError },
    },
    post: {
      tags: ['Seasons'],
      summary: 'Create trophy',
      parameters: [...authParam, careerIdParam],
      responses: { 201: defaultSuccess, 400: defaultError, 401: defaultError, 404: defaultError },
    },
  },
  '/api/careers/{careerId}/trophies/{id}': {
    delete: {
      tags: ['Seasons'],
      summary: 'Delete trophy',
      parameters: [...authParam, careerIdParam, idParam],
      responses: { 204: noContent, 401: defaultError, 404: defaultError },
    },
  },
  '/api/careers/{careerId}/challenges': {
    get: {
      tags: ['Seasons'],
      summary: 'List season challenges',
      parameters: [...authParam, careerIdParam],
      responses: { 200: defaultSuccess, 401: defaultError, 404: defaultError },
    },
    post: {
      tags: ['Seasons'],
      summary: 'Create season challenge',
      parameters: [...authParam, careerIdParam],
      responses: { 201: defaultSuccess, 400: defaultError, 401: defaultError, 404: defaultError },
    },
  },
  '/api/careers/{careerId}/challenges/{id}': {
    patch: {
      tags: ['Seasons'],
      summary: 'Update season challenge',
      parameters: [...authParam, careerIdParam, idParam],
      responses: { 200: defaultSuccess, 400: defaultError, 401: defaultError, 404: defaultError },
    },
    delete: {
      tags: ['Seasons'],
      summary: 'Delete season challenge',
      parameters: [...authParam, careerIdParam, idParam],
      responses: { 204: noContent, 401: defaultError, 404: defaultError },
    },
  },
  '/api/careers/{careerId}/narrative-tags': {
    get: {
      tags: ['Seasons'],
      summary: 'List narrative tags',
      parameters: [...authParam, careerIdParam],
      responses: { 200: defaultSuccess, 401: defaultError, 404: defaultError },
    },
    post: {
      tags: ['Seasons'],
      summary: 'Create narrative tag',
      parameters: [...authParam, careerIdParam],
      responses: { 201: defaultSuccess, 400: defaultError, 401: defaultError, 404: defaultError },
    },
  },
  '/api/careers/{careerId}/narrative-tags/{id}': {
    delete: {
      tags: ['Seasons'],
      summary: 'Delete narrative tag',
      parameters: [...authParam, careerIdParam, idParam],
      responses: { 204: noContent, 401: defaultError, 404: defaultError },
    },
  },
  '/api/careers/{careerId}/skill-spends': {
    get: {
      tags: ['Skills'],
      summary: 'List skill spends',
      parameters: [...authParam, careerIdParam],
      responses: { 200: defaultSuccess, 401: defaultError, 404: defaultError },
    },
    post: {
      tags: ['Skills'],
      summary: 'Create skill spend',
      parameters: [...authParam, careerIdParam],
      responses: { 201: defaultSuccess, 400: defaultError, 401: defaultError, 404: defaultError },
    },
  },
  '/api/careers/{careerId}/skill-spends/{id}': {
    delete: {
      tags: ['Skills'],
      summary: 'Delete skill spend',
      parameters: [...authParam, careerIdParam, idParam],
      responses: { 204: noContent, 401: defaultError, 404: defaultError },
    },
  },
  '/api/careers/{careerId}/attribute-targets': {
    get: {
      tags: ['Skills'],
      summary: 'List attribute targets',
      parameters: [...authParam, careerIdParam],
      responses: { 200: defaultSuccess, 401: defaultError, 404: defaultError },
    },
    post: {
      tags: ['Skills'],
      summary: 'Create attribute target',
      parameters: [...authParam, careerIdParam],
      responses: { 201: defaultSuccess, 400: defaultError, 401: defaultError, 404: defaultError },
    },
  },
  '/api/careers/{careerId}/attribute-targets/{id}': {
    patch: {
      tags: ['Skills'],
      summary: 'Update attribute target',
      parameters: [...authParam, careerIdParam, idParam],
      responses: { 200: defaultSuccess, 400: defaultError, 401: defaultError, 404: defaultError },
    },
    delete: {
      tags: ['Skills'],
      summary: 'Delete attribute target',
      parameters: [...authParam, careerIdParam, idParam],
      responses: { 204: noContent, 401: defaultError, 404: defaultError },
    },
  },
  '/api/careers/{careerId}/archetype-stage': {
    get: {
      tags: ['Skills'],
      summary: 'Get archetype stage',
      parameters: [...authParam, careerIdParam],
      responses: { 200: defaultSuccess, 401: defaultError, 404: defaultError },
    },
    put: {
      tags: ['Skills'],
      summary: 'Upsert archetype stage',
      parameters: [...authParam, careerIdParam],
      responses: { 200: defaultSuccess, 400: defaultError, 401: defaultError, 404: defaultError },
    },
  },
  '/api/careers/{careerId}/training-logs': {
    get: {
      tags: ['Skills'],
      summary: 'List training logs',
      parameters: [...authParam, careerIdParam],
      responses: { 200: defaultSuccess, 401: defaultError, 404: defaultError },
    },
    post: {
      tags: ['Skills'],
      summary: 'Create training log',
      parameters: [...authParam, careerIdParam],
      responses: { 201: defaultSuccess, 400: defaultError, 401: defaultError, 404: defaultError },
    },
  },
  '/api/careers/{careerId}/training-logs/{id}': {
    delete: {
      tags: ['Skills'],
      summary: 'Delete training log',
      parameters: [...authParam, careerIdParam, idParam],
      responses: { 204: noContent, 401: defaultError, 404: defaultError },
    },
  },
  '/api/careers/{careerId}/offers': {
    get: {
      tags: ['Transfers'],
      summary: 'List transfer offers',
      parameters: [...authParam, careerIdParam],
      responses: { 200: defaultSuccess, 401: defaultError, 404: defaultError },
    },
    post: {
      tags: ['Transfers'],
      summary: 'Create transfer offer',
      parameters: [...authParam, careerIdParam],
      responses: { 201: defaultSuccess, 400: defaultError, 401: defaultError, 404: defaultError },
    },
  },
  '/api/careers/{careerId}/offers/{id}': {
    patch: {
      tags: ['Transfers'],
      summary: 'Update transfer offer',
      parameters: [...authParam, careerIdParam, idParam],
      responses: { 200: defaultSuccess, 400: defaultError, 401: defaultError, 404: defaultError },
    },
    delete: {
      tags: ['Transfers'],
      summary: 'Delete transfer offer',
      parameters: [...authParam, careerIdParam, idParam],
      responses: { 204: noContent, 401: defaultError, 404: defaultError },
    },
  },
  '/api/careers/{careerId}/contracts': {
    get: {
      tags: ['Transfers'],
      summary: 'List contracts',
      parameters: [...authParam, careerIdParam],
      responses: { 200: defaultSuccess, 401: defaultError, 404: defaultError },
    },
    post: {
      tags: ['Transfers'],
      summary: 'Create contract',
      parameters: [...authParam, careerIdParam],
      responses: { 201: defaultSuccess, 400: defaultError, 401: defaultError, 404: defaultError },
    },
  },
  '/api/careers/{careerId}/contracts/{id}': {
    delete: {
      tags: ['Transfers'],
      summary: 'Delete contract',
      parameters: [...authParam, careerIdParam, idParam],
      responses: { 204: noContent, 401: defaultError, 404: defaultError },
    },
  },
  '/api/careers/{careerId}/agent-notes': {
    get: {
      tags: ['Transfers'],
      summary: 'List agent notes',
      parameters: [...authParam, careerIdParam],
      responses: { 200: defaultSuccess, 401: defaultError, 404: defaultError },
    },
    post: {
      tags: ['Transfers'],
      summary: 'Create agent note',
      parameters: [...authParam, careerIdParam],
      responses: { 201: defaultSuccess, 400: defaultError, 401: defaultError, 404: defaultError },
    },
  },
  '/api/careers/{careerId}/agent-notes/{id}': {
    delete: {
      tags: ['Transfers'],
      summary: 'Delete agent note',
      parameters: [...authParam, careerIdParam, idParam],
      responses: { 204: noContent, 401: defaultError, 404: defaultError },
    },
  },
  '/api/careers/{careerId}/injuries': {
    get: {
      tags: ['Profile'],
      summary: 'List injuries',
      parameters: [...authParam, careerIdParam],
      responses: { 200: defaultSuccess, 401: defaultError, 404: defaultError },
    },
    post: {
      tags: ['Profile'],
      summary: 'Create injury',
      parameters: [...authParam, careerIdParam],
      responses: { 201: defaultSuccess, 400: defaultError, 401: defaultError, 404: defaultError },
    },
  },
  '/api/careers/{careerId}/injuries/{id}': {
    patch: {
      tags: ['Profile'],
      summary: 'Update injury',
      parameters: [...authParam, careerIdParam, idParam],
      responses: { 200: defaultSuccess, 400: defaultError, 401: defaultError, 404: defaultError },
    },
    delete: {
      tags: ['Profile'],
      summary: 'Delete injury',
      parameters: [...authParam, careerIdParam, idParam],
      responses: { 204: noContent, 401: defaultError, 404: defaultError },
    },
  },
  '/api/careers/{careerId}/suspensions': {
    get: {
      tags: ['Profile'],
      summary: 'List suspensions',
      parameters: [...authParam, careerIdParam],
      responses: { 200: defaultSuccess, 401: defaultError, 404: defaultError },
    },
    post: {
      tags: ['Profile'],
      summary: 'Create suspension',
      parameters: [...authParam, careerIdParam],
      responses: { 201: defaultSuccess, 400: defaultError, 401: defaultError, 404: defaultError },
    },
  },
  '/api/careers/{careerId}/suspensions/{id}': {
    delete: {
      tags: ['Profile'],
      summary: 'Delete suspension',
      parameters: [...authParam, careerIdParam, idParam],
      responses: { 204: noContent, 401: defaultError, 404: defaultError },
    },
  },
  '/api/careers/{careerId}/press-notes': {
    get: {
      tags: ['Profile'],
      summary: 'List press notes',
      parameters: [...authParam, careerIdParam],
      responses: { 200: defaultSuccess, 401: defaultError, 404: defaultError },
    },
    post: {
      tags: ['Profile'],
      summary: 'Create press note',
      parameters: [...authParam, careerIdParam],
      responses: { 201: defaultSuccess, 400: defaultError, 401: defaultError, 404: defaultError },
    },
  },
  '/api/careers/{careerId}/press-notes/{id}': {
    delete: {
      tags: ['Profile'],
      summary: 'Delete press note',
      parameters: [...authParam, careerIdParam, idParam],
      responses: { 204: noContent, 401: defaultError, 404: defaultError },
    },
  },
  '/api/careers/{careerId}/achievements': {
    get: {
      tags: ['Profile'],
      summary: 'List achievements',
      parameters: [...authParam, careerIdParam],
      responses: { 200: defaultSuccess, 401: defaultError, 404: defaultError },
    },
    post: {
      tags: ['Profile'],
      summary: 'Unlock achievement',
      parameters: [...authParam, careerIdParam],
      responses: { 201: defaultSuccess, 400: defaultError, 401: defaultError, 404: defaultError },
    },
  },
  '/api/careers/{careerId}/achievements/{id}': {
    patch: {
      tags: ['Profile'],
      summary: 'Update achievement',
      parameters: [...authParam, careerIdParam, idParam],
      responses: { 200: defaultSuccess, 400: defaultError, 401: defaultError, 404: defaultError },
    },
  },
  '/api/sync/import': {
    post: {
      tags: ['Sync'],
      summary: 'Import career payload',
      parameters: authParam,
      responses: { 201: defaultSuccess, 400: defaultError, 401: defaultError },
    },
  },
  '/api/sync/export/{careerId}': {
    get: {
      tags: ['Sync'],
      summary: 'Export career payload',
      parameters: [...authParam, careerIdParam],
      responses: { 200: defaultSuccess, 401: defaultError, 404: defaultError },
    },
  },
};

const components = {
  schemas: {
    ApiSuccess: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Success' },
        data: {},
        meta: { type: 'object' },
      },
      required: ['success', 'message', 'data'],
    },
    ApiError: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'BAD_REQUEST' },
            message: { type: 'string', example: 'Validation failed' },
            details: { type: 'object' },
          },
          required: ['code', 'message'],
        },
      },
      required: ['success', 'error'],
    },
  },
};

const tags = [
  { name: 'Core', description: 'Core endpoints' },
  { name: 'Auth', description: 'Authentication endpoints' },
  { name: 'Users', description: 'User account endpoints' },
  { name: 'Careers', description: 'Career save slot management' },
  { name: 'Matches', description: 'Match log endpoints' },
  { name: 'Seasons', description: 'Season-related resources' },
  { name: 'Skills', description: 'Skill progression resources' },
  { name: 'Transfers', description: 'Transfer and contract tracking' },
  { name: 'Profile', description: 'Player profile records' },
  { name: 'Sync', description: 'Import/export compatibility endpoints' },
];

module.exports = {
  paths,
  components,
  tags,
};
