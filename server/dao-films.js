"use strict";

/* Data Access Object (DAO) module for accessing films data */

const db = require("./db");
const dayjs = require("dayjs");

const filters = {
  "filter-favorite": {
    label: "Favorites",
    url: "/filter/filter-favorite",
    filterFunction: (film) => film.favorite,
  },
  "filter-best": {
    label: "Best Rated",
    url: "/filter/filter-best",
    filterFunction: (film) => film.rating >= 5,
  },
  "filter-lastmonth": {
    label: "Seen Last Month",
    url: "/filter/filter-lastmonth",
    filterFunction: (film) => isSeenLastMonth(film),
  },
  "filter-unseen": {
    label: "Unseen",
    url: "/filter/filter-unseen",
    filterFunction: (film) => (film.watchDate.isValid() ? false : true),
  },
};

const isSeenLastMonth = (film) => {
  if ("watchDate" in film && film.watchDate) {
    // Accessing watchDate only if defined
    const diff = film.watchDate.diff(dayjs(), "month");
    const isLastMonth = diff <= 0 && diff > -1; // last month
    return isLastMonth;
  }
};

// This function retrieves the whole list of films from the database.
exports.listFilms = (filter, userId) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM films WHERE user = ?";
    db.all(sql, [userId], (err, rows) => {
      if (err) {
        reject(err);
      }
      if (rows == undefined) {
        resolve([]);
      }
      const films = rows.map((e) => {
        // WARN: the database returns only lowercase fields. So, to be compliant with the client-side, we convert "watchdate" to the camelCase version ("watchDate").
        const film = Object.assign({}, e, { watchDate: dayjs(e.watchdate) }); // adding camelcase "watchDate"
        delete film.watchdate; // removing lowercase "watchdate"
        return film;
      });

      // WARN: if implemented as if(filters[filter]) returns true also for filter = 'constructor' but then .filterFunction does not exists
      if (filters.hasOwnProperty(filter))
        resolve(films.filter(filters[filter].filterFunction));
      else resolve(films);
    });
  });
};

// This function retrieves a film given its id and the associated user id.
exports.getFilm = (id) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM films WHERE id=?";
    db.get(sql, [id], (err, row) => {
      if (err) {
        reject(err);
      }
      if (row == undefined) {
        resolve({ error: "Film not found." });
      } else {
        // WARN: database is case insensitive. Converting "watchDate" to camel case format
        const film = Object.assign({}, row, { watchDate: row.watchdate }); // adding camelcase "watchDate"
        delete film.watchdate; // removing lowercase "watchdate"
        resolve(film);
      }
    });
  });
};

/**
 * This function adds a new film in the database.
 * The film id is added automatically by the DB, and it is returned as this.lastID.
 */
exports.createFilm = (film) => {
  return new Promise((resolve, reject) => {
    const sql =
      "INSERT INTO films (title, favorite, watchdate, rating, user) VALUES(?, ?, ?, ?, ?)";
    db.run(
      sql,
      [film.title, film.favorite, film.watchDate, film.rating, film.user],
      function (err) {
        if (err) {
          reject(err);
        }
        // Returning the newly created object with the DB additional properties to the client.
        resolve(exports.getFilm(this.lastID));
      }
    );
  });
};

// This function updates an existing film given its id and the new properties.
exports.updateFilm = (film, userId) => {
  return new Promise((resolve, reject) => {
    const sql =
      "UPDATE films SET title = ?, favorite = ?, watchdate = ?, rating = ?, user = ? WHERE id = ? AND user = ?";
    db.run(
      sql,
      [
        film.title,
        film.favorite,
        film.watchDate,
        film.rating,
        film.user,
        film.id,
        userId,
      ],
      function (err) {
        if (err) {
          reject(err);
        }
        resolve(exports.getFilm(film.id));
      }
    );
  });
};

// This function deletes an existing film given its id.
exports.deleteFilm = (id, userId) => {
  return new Promise((resolve, reject) => {
    const sql = "DELETE FROM films WHERE id = ? AND user = ?";
    db.run(sql, [id, userId], (err) => {
      if (err) {
        reject(err);
      } else resolve(null);
    });
  });
};
