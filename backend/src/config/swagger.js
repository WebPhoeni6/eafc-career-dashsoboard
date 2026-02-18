const swaggerJsdoc = require('swagger-jsdoc');
const config = require('./env');
const openapi = require('../docs/openapi');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FC26 Career Tracker API',
      version: '1.0.0',
      description: 'Backend API for FC26 Career Tracker',
    },
    servers: [{ url: `http://localhost:${config.PORT}` }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      ...openapi.components,
    },
    tags: openapi.tags,
    paths: openapi.paths,
  },
  apis: ['src/modules/**/*.routes.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
