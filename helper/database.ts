import sqlite3 = require('sqlite3');
import path from 'path';

import { hashPassword } from './hash';

const db = new sqlite3.Database(
  path.join(process.cwd(), 'database', 'user.db'),
);

db.serialize(function () {
  db.run(
    'CREATE TABLE IF NOT EXISTS users ( username TEXT UNIQUE, hashed_password BLOB)',
  );

  db.run(
    'CREATE TABLE IF NOT EXISTS todos ( \
    owner_id INTEGER NOT NULL, \
    title TEXT NOT NULL, \
    completed INTEGER \
  )',
  );

  db.run(
    'INSERT OR IGNORE INTO users (username, hashed_password) VALUES (?, ?)',
    ['admin', hashPassword('123456789')],
  );
});

export default db;
