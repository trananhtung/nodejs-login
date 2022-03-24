import sqlite3 = require('sqlite3');
import crypto = require('crypto');
import path from 'path';

const db = new sqlite3.Database(
  path.join(process.cwd(), 'database', 'user.db'),
);

db.serialize(function () {
  db.run(
    'CREATE TABLE IF NOT EXISTS users ( \
    username TEXT UNIQUE, \
    hashed_password BLOB, \
    salt BLOB \
  )',
  );

  db.run(
    'CREATE TABLE IF NOT EXISTS todos ( \
    owner_id INTEGER NOT NULL, \
    title TEXT NOT NULL, \
    completed INTEGER \
  )',
  );

  // create an initial user (username: alice, password: letmein)
  const salt = crypto.randomBytes(16);
  db.run(
    'INSERT OR IGNORE INTO users (username, hashed_password, salt) VALUES (?, ?, ?)',
    ['alice', crypto.pbkdf2Sync('letmein', salt, 310000, 32, 'sha256'), salt],
  );
});

export default db;
