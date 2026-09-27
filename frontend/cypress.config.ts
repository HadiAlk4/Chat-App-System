import { defineConfig } from 'cypress';
import { Db, MongoClient } from 'mongodb';

// The backend under test must be started with MONGO_DB_NAME=chat-app-test.
const MONGO_URL = process.env['MONGO_URL'] ?? 'mongodb://localhost:27017';
const TEST_DB_NAME = 'chat-app-test';

async function withTestDb<T>(work: (db: Db) => Promise<T>): Promise<T> {
  const client = new MongoClient(MONGO_URL);
  try {
    await client.connect();
    return await work(client.db(TEST_DB_NAME));
  } finally {
    await client.close();
  }
}

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4200',
    setupNodeEvents(on) {
      on('task', {
        resetDb: () => withTestDb(async (db) => {
          await db.dropDatabase();
          return null;
        }),
        countUsers: () => withTestDb((db) => db.collection('users').countDocuments()),
      });
    },
  },

  component: {
    devServer: {
      framework: 'angular',
      bundler: 'webpack',
    },
    specPattern: '**/*.cy.ts',
  },
});
