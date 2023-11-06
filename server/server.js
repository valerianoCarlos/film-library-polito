"use strict";

/*** Importing modules ***/
const express = require("express");
const morgan = require("morgan"); // logging middleware
const { check, validationResult } = require("express-validator"); // validation middleware
const passport = require("passport"); // auth middleware
const LocalStrategy = require("passport-local").Strategy; // username and password for login
const session = require("express-session"); // enable sessions
const cors = require("cors"); // cross-origin resource sharing middleware

const filmDao = require("./dao-films"); // module for accessing the films table in the DB
const userDao = require("./dao-users"); // module for accessing the users table in the DB

/*** Set up Passport ***/
// set up the "username and password" login strategy
// by setting a function to verify username and password
passport.use(
  new LocalStrategy(function (username, password, done) {
    userDao.getUser(username, password).then((user) => {
      if (!user)
        return done(null, false, {
          message: "Incorrect username and/or password.",
        });
      return done(null, user);
    });
  })
);

// serialize and de-serialize the user (user object <-> session)
// we serialize the user id and we store it in the session: the session is very small in this way
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// starting from the data in the session, we extract the current (logged-in) user
passport.deserializeUser((id, done) => {
  userDao
    .getUserById(id)
    .then((user) => {
      done(null, user); // this will be available in req.user
    })
    .catch((err) => {
      done(err, null);
    });
});

/*** init express and set-up the middlewares ***/
const app = express();
app.use(morgan("dev"));
app.use(express.json());
const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
};
app.use(cors(corsOptions));

// custom middleware: check if a given request is coming from an authenticated user
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ error: "Not authenticated" });
};

// set up the session
app.use(
  session({
    // by default, Passport uses a MemoryStore to keep track of the sessions
    secret: "x776ms1vdFkTWGva", //personalize this random string, should be a secret value
    resave: false,
    saveUninitialized: false,
  })
);

// then, init passport
app.use(passport.initialize());
app.use(passport.session());

/*** Utility Functions ***/

// This function is used to format express-validator errors as strings
const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
  return `${location}[${param}]: ${msg}`;
};

/*** Films APIs ***/

// 1. Retrieve the list of all the available films.
// GET /api/films
// This route returns the FilmLibrary. It handles also "filter=?" query parameter
app.get("/api/films", (req, res) => {
  // get films that match optional filter in the query
  const userId = req.isAuthenticated() ? req.user.id : -1;
  filmDao
    .listFilms(req.query.filter, userId)
    // NOTE: "invalid dates" (i.e., missing dates) are set to null during JSON serialization
    .then((films) => {
      res.json(films);
    })
    .catch((err) => res.status(500).json(err)); // always return a json and an error message
});

// 2. Retrieve a film, given its “id”.
// GET /api/films/<id>
// Given a film id, this route returns the associated film from the library.
app.get(
  "/api/films/:id",
  [check("id").isInt({ min: 1 })], // check: is the id a positive integer?
  async (req, res) => {
    try {
      const result = await filmDao.getFilm(req.params.id);
      if (result.error) res.status(404).json(result);
      // NOTE: "invalid dates" (i.e., missing dates) are set to null during JSON serialization
      else res.json(result);
    } catch (err) {
      res.status(500).end();
    }
  }
);

// 3. Create a new film, by providing all relevant information.
// POST /api/films
// This route adds a new film to film library.
app.post(
  "/api/films",
  isLoggedIn,
  [
    check("title").isLength({ min: 1, max: 160 }),
    check("favorite").isBoolean(),
    // only date (first ten chars) and valid ISO
    check("watchDate")
      .isLength({ min: 10, max: 10 })
      .isISO8601({ strict: true })
      .optional({ checkFalsy: true }),
    check("rating").isInt({ min: 0, max: 5 }),
  ],
  async (req, res) => {
    // Is there any validation error?
    const errors = validationResult(req).formatWith(errorFormatter); // format error message
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ") }); // error message is a single string with all error joined together
    }

    // WARN: note that we expect watchDate with capital D but the databases does not care and uses lowercase letters, so it returns "watchdate"
    const film = {
      title: req.body.title,
      favorite: req.body.favorite,
      watchDate: req.body.watchDate, // A different method is required if also time is present. For instance: (req.body.watchDate || '').split('T')[0]
      rating: req.body.rating,
      user: req.user.id,
    };

    try {
      const result = await filmDao.createFilm(film); // NOTE: createFilm returns the new created object
      res.json(result);
    } catch (err) {
      res.status(503).json({
        error: `Database error during the creation of new film: ${err}`,
      });
    }
  }
);

// 4. Update an existing film, by providing all the relevant information
// PUT /api/films/<id>
// This route allows to modify a film, specifiying its id and the necessary data.
app.put(
  "/api/films/:id",
  isLoggedIn,
  [
    check("id").isInt(),
    check("title").isLength({ min: 1, max: 160 }),
    check("favorite").isBoolean(),
    // only date (first ten chars) and valid ISO
    check("watchDate")
      .isLength({ min: 10, max: 10 })
      .isISO8601({ strict: true })
      .optional({ checkFalsy: true }),
    check("rating").isInt({ min: 0, max: 5 }),
  ],
  async (req, res) => {
    // Is there any validation error?
    const errors = validationResult(req).formatWith(errorFormatter); // format error message
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ") }); // error message is a single string with all error joined together
    }
    // Is the id in the body equal to the id in the url?
    if (req.body.id !== Number(req.params.id)) {
      return res.status(422).json({ error: "URL and body id mismatch" });
    }
    const userId = req.user.id;

    const film = {
      id: req.body.id,
      title: req.body.title,
      favorite: req.body.favorite,
      watchDate: req.body.watchDate,
      rating: req.body.rating,
      user: userId,
    };

    try {
      const result = await filmDao.updateFilm(film, userId);
      res.json(result);
    } catch (err) {
      res.status(503).json({
        error: `Database error during the update of film ${req.params.id}: ${err}`,
      });
    }
  }
);

// 5. Mark an existing film as favorite/unfavorite
// PUT /api/films/<id>/favorite
// This route changes only the favorite value. It could also be a PATCH.
app.put(
  "/api/films/:id/favorite",
  isLoggedIn,
  [check("id").isInt(), check("favorite").isInt({ min: 0, max: 1 })],
  async (req, res) => {
    // Is there any validation error?
    const errors = validationResult(req).formatWith(errorFormatter); // format error message
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ") }); // error message is a single string with all error joined together
    }

    // Is the id in the body equal to the id in the url?
    if (req.body.id !== Number(req.params.id)) {
      return res.status(422).json({ error: "URL and body id mismatch" });
    }

    try {
      const film = await filmDao.getFilm(req.params.id);
      if (film.error) return res.status(404).json(film);
      film.favorite = req.body.favorite; // update favorite property
      const result = await filmDao.updateFilm(film, req.user.id);
      return res.json(result);
    } catch (err) {
      res.status(503).json({
        error: `Database error during the favorite update of film ${req.params.id}`,
      });
    }
  }
);

// 6. Update the rating of a specific film
// PUT /api/films/<id>/rating
// This route changes only the rating value. It could also be a PATCH.
app.put(
  "/api/films/:id/rating",
  isLoggedIn,
  [check("id").isInt(), check("rating").isInt({ min: 0, max: 5 })],
  async (req, res) => {
    // Is there any validation error?
    const errors = validationResult(req).formatWith(errorFormatter); // format error message
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ") }); // error message is a single string with all error joined together
    }

    // Is the id in the body equal to the id in the url?
    if (req.body.id !== Number(req.params.id)) {
      return res.status(422).json({ error: "URL and body id mismatch" });
    }

    try {
      const film = await filmDao.getFilm(req.params.id);
      if (film.error) return res.status(404).json(film);
      film.rating = req.body.rating; // update favorite property
      const result = await filmDao.updateFilm(film, req.user.id);
      return res.json(result);
    } catch (err) {
      res.status(503).json({
        error: `Database error during the rating update of film ${req.params.id}`,
      });
    }
  }
);

// 7. Delete an existing film, given its “id”
// DELETE /api/films/<id>
// Given a film id, this route deletes the associated film from the library.
app.delete(
  "/api/films/:id",
  isLoggedIn,
  [check("id").isInt()],
  async (req, res) => {
    try {
      // NOTE: if there is no film with the specified id, the delete operation is considered successful.
      await filmDao.deleteFilm(req.params.id, req.user.id);
      res.status(200).json({});
    } catch (err) {
      res.status(503).json({
        error: `Database error during the deletion of film ${req.params.id}: ${err} `,
      });
    }
  }
);

/*** Users APIs ***/

// POST /sessions
// login
app.post("/api/sessions", function (req, res, next) {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      // display wrong login messages
      return res.status(401).json(info);
    }
    // success, perform the login
    req.login(user, (err) => {
      if (err) return next(err);

      // req.user contains the authenticated user, we send all the user info back
      // this is coming from userDao.getUser()
      return res.json(req.user);
    });
  })(req, res, next);
});

// DELETE /sessions/current
// logout
app.delete("/api/sessions/current", (req, res) => {
  req.logout(() => {
    res.end();
  });
});

// GET /sessions/current
// check whether the user is logged in or not
app.get("/api/sessions/current", (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json(req.user);
  } else res.status(401).json({ error: "Unauthenticated user!" });
});

// Activating the server
const PORT = 3001;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}/`)
);
