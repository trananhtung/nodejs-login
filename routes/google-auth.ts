import express = require('express');
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv = require('dotenv');
import { v4 as uuid } from 'uuid';

import db from '../helper/database';

dotenv.config();
passport.use(
  new GoogleStrategy(
    {
      callbackURL: '/google/auth/redirect',
      clientID: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    },
    (accessToken, refreshToken, profile, done) => {
      db.run(
        'INSERT OR IGNORE INTO users (id, name, username) VALUES (?, ?, ?)',
        [profile.id, 'profile.displayName', uuid()],
      );
      done(null, {
        id: profile.id,
        name: profile.displayName,
      });
    },
  ),
);

passport.serializeUser(function (user, done) {
  process.nextTick(function () {
    done(null, { id: user.id, name: user.name });
  });
});

passport.deserializeUser(function (user: Express.User, done) {
  process.nextTick(function () {
    return done(null, user);
  });
});

const googleRouter = express.Router();

googleRouter.get('/*', (req, res, next) => {
  if (req.user) {
    res.redirect('/');
  }
  next();
});

googleRouter.get(
  '/auth',
  passport.authenticate('google', { scope: ['profile'] }),
);

googleRouter.get(
  '/auth/redirect',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res, next) => {
    console.log(req);
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

export default googleRouter;
