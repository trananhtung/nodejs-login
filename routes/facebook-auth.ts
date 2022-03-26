import express = require('express');
import passport from 'passport';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import dotenv = require('dotenv');
import { v4 as uuid } from 'uuid';

import db from '../helper/database';

dotenv.config();
passport.use(
  new FacebookStrategy(
    {
      callbackURL: '/facebook/auth/redirect',
      clientID: process.env.FACEBOOK_CLIENT_ID ?? '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET ?? '',
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

const facebookRouter = express.Router();

facebookRouter.get('/*', (req, res, next) => {
  if (req.user) {
    res.redirect('/');
  }
  next();
});

facebookRouter.get('/auth', passport.authenticate('facebook'));

facebookRouter.get(
  '/auth/redirect',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
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

export default facebookRouter;
