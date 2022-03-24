import express = require('express');
import connectEnsureLogin = require('connect-ensure-login');

import db from '../helper/database';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  url: string;
}

const ensureLoggedIn = connectEnsureLogin.ensureLoggedIn();

const loadTodoList: express.RequestHandler = (req, res, next) => {
  db.all(
    'SELECT rowid AS id, * FROM todos WHERE owner_id = ?',
    [req.user?.id],
    function (err, rows) {
      if (err) {
        return next(err);
      }

      const todos = rows.map(function (row) {
        return {
          id: row.id,
          title: row.title,
          completed: row.completed == 1 ? true : false,
          url: '/' + row.id,
        };
      });
      res.locals.todos = todos;
      res.locals.activeCount = todos.filter(function (todo) {
        return !todo.completed;
      }).length;
      res.locals.completedCount = todos.length - res.locals.activeCount;
      next();
    },
  );
};

const indexRouter = express.Router();

/* GET home page. */
indexRouter.get(
  '/',
  function (req, res, next) {
    if (!req.user) {
      return res.render('home');
    }
    next();
  },
  loadTodoList,
  function (req, res) {
    res.locals.filter = null;
    res.render('index', { user: req.user });
  },
);

indexRouter.get('/active', ensureLoggedIn, loadTodoList, function (req, res) {
  res.locals.todos = res.locals.todos.filter(function (todo: Todo) {
    return !todo.completed;
  });
  res.locals.filter = 'active';
  res.render('index', { user: req.user });
});

indexRouter.get(
  '/completed',
  ensureLoggedIn,
  loadTodoList,
  function (req, res) {
    res.locals.todos = res.locals.todos.filter(function (todo: Todo) {
      return todo.completed;
    });
    res.locals.filter = 'completed';
    res.render('index', { user: req.user });
  },
);

indexRouter.post(
  '/',
  ensureLoggedIn,
  function (req, res, next) {
    req.body.title = req.body.title.trim();
    next();
  },
  function (req, res, next) {
    if (req.body.title !== '') {
      return next();
    }
    return res.redirect('/' + (req.body.filter || ''));
  },
  function (req, res, next) {
    db.run(
      'INSERT INTO todos (owner_id, title, completed) VALUES (?, ?, ?)',
      [req.user?.id, req.body.title, req.body.completed == true ? 1 : null],
      function (err) {
        if (err) {
          return next(err);
        }
        return res.redirect('/' + (req.body.filter || ''));
      },
    );
  },
);

indexRouter.post(
  '/:id(\\d+)',
  ensureLoggedIn,
  function (req, res, next) {
    req.body.title = req.body.title.trim();
    next();
  },
  function (req, res, next) {
    if (req.body.title !== '') {
      return next();
    }
    db.run(
      'DELETE FROM todos WHERE rowid = ? AND owner_id = ?',
      [req.params.id, req.user?.id],
      function (err) {
        if (err) {
          return next(err);
        }
        return res.redirect('/' + (req.body.filter || ''));
      },
    );
  },
  function (req, res, next) {
    db.run(
      'UPDATE todos SET title = ?, completed = ? WHERE rowid = ? AND owner_id = ?',
      [
        req.body.title,
        req.body.completed !== undefined ? 1 : null,
        req.params.id,
        req.user?.id,
      ],
      function (err) {
        if (err) {
          return next(err);
        }
        return res.redirect('/' + (req.body.filter || ''));
      },
    );
  },
);

indexRouter.post(
  '/:id(\\d+)/delete',
  ensureLoggedIn,
  function (req, res, next) {
    db.run(
      'DELETE FROM todos WHERE rowid = ? AND owner_id = ?',
      [req.params.id, req.user?.id],
      function (err) {
        if (err) {
          return next(err);
        }
        return res.redirect('/' + (req.body.filter || ''));
      },
    );
  },
);

indexRouter.post('/toggle-all', ensureLoggedIn, function (req, res, next) {
  db.run(
    'UPDATE todos SET completed = ? WHERE owner_id = ?',
    [req.body.completed !== undefined ? 1 : null, req.user?.id],
    function (err) {
      if (err) {
        return next(err);
      }
      return res.redirect('/' + (req.body.filter || ''));
    },
  );
});

indexRouter.post('/clear-completed', ensureLoggedIn, function (req, res, next) {
  db.run(
    'DELETE FROM todos WHERE owner_id = ? AND completed = ?',
    [req.user?.id, 1],
    function (err) {
      if (err) {
        return next(err);
      }
      return res.redirect('/' + (req.body.filter || ''));
    },
  );
});

export default indexRouter;
