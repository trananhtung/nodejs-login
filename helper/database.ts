import sqlite3 = require('sqlite3');
import path from 'path';
import { v4 as uuid } from 'uuid';
import mkdirp = require('mkdirp');
import { hashPassword } from './hash';

mkdirp.sync(path.join(process.cwd(), 'database'));
const db = new sqlite3.Database(
  path.join(process.cwd(), 'database', 'user.db'),
);

db.serialize(function () {
  db.run(
    'CREATE TABLE IF NOT EXISTS users ( id TEXT UNIQUE, name TEXT, username TEXT UNIQUE, hashed_password BLOB)',
  );

  db.run(
    'CREATE TABLE IF NOT EXISTS todos ( \
    owner_id INTEGER NOT NULL, \
    title TEXT NOT NULL, \
    completed INTEGER \
  )',
  );

  db.run(
    'INSERT OR IGNORE INTO users (id, name, username, hashed_password) VALUES (?, ?, ?, ?)',
    [uuid(), 'Admin good boy', 'admin', hashPassword('123456789')],
  );
});

export default db;
