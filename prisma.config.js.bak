const env = require('dotenv');

env.config();

if (!process.env.DB_URL) {
  throw new Error('DB_URL IS NOT DEFINED.');
}

const config = {
  schema: './apps/auth_microservice/db/schema.prisma',

  dataSources: [
    {
      name: 'db',
      url: process.env.DB_URL,
      adapter: 'postgres',
    },
  ],
};

module.exports = config;
