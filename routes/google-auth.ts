import express = require('express');
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv = require('dotenv');

dotenv.config();
passport.use(
  new GoogleStrategy(
    {
      callbackURL: '/google/auth/redirect',
      clientID: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    },
    (accessToken, refreshToken, profile, done) => {
      console.log('GoogleStrategy callback');
      console.log(profile);
      done(null, { username: profile.displayName, id: profile.id });
    },
  ),
);

const googleRouter = express.Router();

googleRouter.get(
  '/auth',
  passport.authenticate('google', { scope: ['profile'] }),
);

googleRouter.get(
  '/auth/redirect',
  passport.authenticate('google'),
  (req, res) => {
    res.send(req.query);
  },
);

export default googleRouter;
