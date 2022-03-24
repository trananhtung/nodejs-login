import express = require('express');
import { ErrorRequestHandler } from 'express';
import path = require('path');
import cookieParser = require('cookie-parser');
import session = require('express-session');
import csrf = require('csurf');
import passport = require('passport');
import logger = require('morgan');
import SQLiteStore = require('connect-sqlite3');
import createError = require('http-errors');

import indexRouter from './routes/index';
import authRouter from './routes/auth';

const app = express();
const SQLiteStoreWithSession = SQLiteStore(session);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.locals.pluralize = require('pluralize');

app.use(
  session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    store: new SQLiteStoreWithSession({
      db: 'sessions.db',
      dir: 'database',
    }),
  }),
);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(csrf({ cookie: true }));
app.use(passport.authenticate('session'));

app.use(function (req, res, next) {
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use('/', indexRouter);
app.use('/', authRouter);

app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
const errorHandler: ErrorRequestHandler = (err, req, res) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
};
app.use(errorHandler);

app.listen(8080, () => {
  console.log('listening on port 8080');
});
