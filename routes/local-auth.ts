import express = require('express');
import passport = require('passport');
import { Strategy as LocalStrategy } from 'passport-local';
import { v4 as uuid } from 'uuid';

import { hashPassword, comparePassword } from '../helper/hash';
import db from '../helper/database';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    export interface User {
      id: string;
      name: string;
    }
  }
}

declare module 'express-session' {
  export interface SessionData {
    messages?: string[];
  }
}

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

passport.serializeUser((user: Express.User, cb) => {
  process.nextTick(() => {
    cb(null, { id: user.id, name: user.name });
  });
});

passport.deserializeUser((user: Express.User, cb) => {
  process.nextTick(() => {
    return cb(null, user);
  });
});

const authRouter = express.Router();

authRouter.get('/*', (req, res, next) => {
  if (req.user) {
    res.redirect('/');
  }
  next();
});

authRouter.get('/login', (req, res) => {
  const msgs = req.session.messages || [];
  res.locals.messages = msgs;
  res.locals.hasMessages = msgs.length > 0;
  req.session.messages = [];
  res.render('login');
});

authRouter.post(
  '/login/password',
  passport.authenticate('local', {
    successReturnToOrRedirect: '/',
    failureRedirect: '/login',
    failureMessage: true,
  }),
);

authRouter.get('/signup', (req, res) => {
  res.locals.signUpFailed = false;
  res.render('signup');
});

authRouter.post('/signup', (req, res, next) => {
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
  const hashedPassword = hashPassword(req.body.password);
  db.run(
    'INSERT INTO users (id, name, username, hashed_password) VALUES (?, ?, ?, ?)',
    [uuid(), req.body.name, req.body.username, hashedPassword],
    function (err) {
      if (err) {
        return next(err);
      }
      const user = {
        id: req.user?.id ?? '',
        name: req.user?.name ?? '',
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

export default authRouter;
