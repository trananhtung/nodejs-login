import express = require('express');
import passport = require('passport');
import crypto = require('crypto');
import { Strategy as LocalStrategy } from 'passport-local';
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

        crypto.pbkdf2(
          password,
          row.salt,
          310000,
          32,
          'sha256',
          function (err, hashedPassword) {
            if (err) {
              return cb(err);
            }
            if (!crypto.timingSafeEqual(row.hashed_password, hashedPassword)) {
              return cb(null, false, {
                message: 'Incorrect username or password.',
              });
            }
            return cb(null, row);
          },
        );
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
  res.render('signup');
});

authRouter.post('/signup', function (req, res, next) {
  const salt = crypto.randomBytes(16);
  crypto.pbkdf2(
    req.body.password,
    salt,
    310000,
    32,
    'sha256',
    function (err, hashedPassword) {
      if (err) {
        return next(err);
      }
      db.run(
        'INSERT INTO users (username, hashed_password, salt) VALUES (?, ?, ?)',
        [req.body.username, hashedPassword, salt],
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
    },
  );
});

export default authRouter;
