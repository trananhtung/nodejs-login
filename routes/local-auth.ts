import express = require('express');
import passport = require('passport');
import { Strategy as LocalStrategy } from 'passport-local';
import { v4 as uuid } from 'uuid';

import { hashPassword, comparePassword } from '../helper/hash';
import db from '../helper/database';

passport.use(
  new LocalStrategy((username, password, cb) => {
    db.get(
      'SELECT id, * FROM users WHERE username = ?',
      [username],
      function (err, row) {
        if (err) {
          return cb(err);
        }

        if (!row) {
          return cb(null, false, {
            message: 'Incorrect username or password.',
          });
        }

        if (!comparePassword(password, row.hashed_password)) {
          return cb(null, false, {
            message: 'Incorrect username or password.',
          });
        }
        return cb(null, row);
      },
    );
  }),
);

const localRouter = express.Router();

localRouter.get('/*', (req, res, next) => {
  if (req.user) {
    res.redirect('/');
  }
  next();
});

localRouter.get('/login', (req, res) => {
  const msgs = req.session.messages || [];
  res.locals.messages = msgs;
  res.locals.hasMessages = msgs.length > 0;
  req.session.messages = [];
  res.render('login');
});

localRouter.post(
  '/login/password',
  passport.authenticate('local', {
    successReturnToOrRedirect: '/',
    failureRedirect: '/login',
    failureMessage: true,
  }),
);

localRouter.get('/signup', (req, res) => {
  res.locals.signUpFailed = false;
  res.render('signup');
});

localRouter.post('/signup', (req, res, next) => {
  db.get(
    'SELECT id, * FROM users WHERE username = ?',
    [req.body.username],
    (err, row) => {
      if (row) {
        res.locals.signUpFailed = true;
        res.locals.signUpMessages = 'Username already taken.';
        res.render('signup');
      }
    },
  );
  const id = uuid();
  const hashedPassword = hashPassword(req.body.password);
  db.run(
    'INSERT INTO users (id, name, username, hashed_password) VALUES (?, ?, ?, ?)',
    [id, req.body.name, req.body.username, hashedPassword],
    function (err) {
      if (err) {
        return next(err);
      }
      const user = {
        id,
        name: req.body.name,
      };

      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        res.redirect('/');
      });
    },
  );
});

export default localRouter;
