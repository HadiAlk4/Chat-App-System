import { closeTestDb } from "./setup.js";

export const mochaHooks = {
  async afterAll() {
    await closeTestDb();
  },
};
