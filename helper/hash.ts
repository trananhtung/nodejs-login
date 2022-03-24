import bcryptjs = require('bcryptjs');

const HASH_LEVEL = 12;

export const hashPassword = (password: string): string => {
  return bcryptjs.hashSync(password, HASH_LEVEL);
};

export const comparePassword = (password: string, hash: string): boolean => {
  return bcryptjs.compareSync(password, hash);
};
