import express = require('express');
import passport = require('passport');
import { Strategy as LocalStrategy } from 'passport-local';

import { hashPassword, comparePassword } from '../helper/hash';
import db from '../helper/database';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface User {
      id: number;
      username: string;
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    messages?: string[];
  }
}

passport.use(
  new LocalStrategy(function verify(username, password, cb) {
    db.get(
      'SELECT rowid AS id, * FROM users WHERE username = ?',
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

passport.serializeUser(function (user: Express.User, cb) {
  process.nextTick(function () {
    cb(null, { id: user.id, username: user.username });
  });
});

passport.deserializeUser(function (user: Express.User, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});

const authRouter = express.Router();

authRouter.get('/login', function (req, res) {
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

authRouter.post('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
});

authRouter.get('/signup', function (req, res) {
  res.locals.signUpFailed = false;
  res.render('signup');
});

authRouter.post('/signup', function (req, res, next) {
  db.get(
    'SELECT rowid AS id, * FROM users WHERE username = ?',
    [req.body.username],
    function (err, row) {
      if (row) {
        res.locals.signUpFailed = true;
        res.locals.signUpMessages = 'Username already taken.';
        res.render('signup');
      }
    },
  );
  const hashedPassword = hashPassword(req.body.password);
  db.run(
    'INSERT INTO users (username, hashed_password) VALUES (?, ?)',
    [req.body.username, hashedPassword],
    function (err) {
      if (err) {
        return next(err);
      }
      const user = {
        id: this.lastID,
        username: req.body.username,
      };
      req.login(user, function (err) {
        if (err) {
          return next(err);
        }
        res.redirect('/');
      });
    },
  );
});

export default authRouter;
