const fs = { existsSync: () => false, mkdirSync: () => undefined };
export default fs;
export const { existsSync, mkdirSync } = fs;
