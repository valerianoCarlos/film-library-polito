/*
 * [2022/2023]
 * Applicazioni Web I
 * Film Library App
 */

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./App.css";

import { React, useState, useEffect } from "react";
import { Container, Toast, ToastContainer } from "react-bootstrap/";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { Navigation } from "./components/Navigation";
import {
  MainLayout,
  AddLayout,
  EditLayout,
  DefaultLayout,
  NotFoundLayout,
} from "./components/PageLayout";
import { LoginForm } from "./components/AuthComponents";

import MessageContext from "./contexts/MessageContext";
import UserContext from "./contexts/UserContext";
import API from "./apis/API";

function App() {
  // This state contains the list of films (it is initialized from a predefined array).
  const [films, setFilms] = useState([]);

  // This state contains the last film ID (the ID is continuously incremented and never decresead).
  const [lastFilmId, setLastFilmId] = useState(-1);

  // This state contains the currently logged in user, if any
  const [user, setUser] = useState(undefined);

  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  /**
   * Defining a structure for Filters
   * Each filter is identified by a unique name and is composed by the following fields:
   * - A label to be shown in the GUI
   * - An URL of the corresponding route (it MUST match /filter/<filter-key>)
   */
  const filters = {
    "filter-all": { label: "All", url: "" },
    "filter-favorite": {
      label: "Favorites",
      url: "/filter/filter-favorite",
    },
    "filter-best": {
      label: "Best Rated",
      url: "/filter/filter-best",
    },
    "filter-lastmonth": {
      label: "Seen Last Month",
      url: "/filter/filter-lastmonth",
    },
    "filter-unseen": {
      label: "Unseen",
      url: "/filter/filter-unseen",
    },
  };

  function handleErrors(err) {
    console.log("err: " + JSON.stringify(err)); // Only for debug
    let errMsg = JSON.stringify(err);
    if (err.errors) {
      if (err.errors[0]) {
        if (err.errors[0].msg) {
          errMsg = err.errors[0].msg;
        }
      }
    } else if (err.error) {
      errMsg = err.error;
    }
    setMessage(errMsg);
    setTimeout(() => setDirty(true), 2000); // Fetch correct version from server, after a while
  }

  // This function sets the user that just logged in
  const loginSuccessful = (user) => {
    setUser(user);
    setLoggedIn(true);
    setDirty(true); // load latest version of data, if appropriate
    setMessage("Welcome, " + user.name);
  };

  const doLogOut = async () => {
    await API.logOut();
    setLoggedIn(false);
    setUser(undefined);
    /* set state to empty if appropriate */
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // here you have the user info, if already logged in
        const user = await API.getUserInfo();
        setLoggedIn(true);
        setUser(user);
      } catch (err) {
        // NO need to do anything: user is simply not yet authenticated
        // handleErrors(err);
      }
    };
    checkAuth();
  }, []);

  // This function add the new film into the FilmLibrary array
  const addFilm = (newFilm) => {
    setFilms((films) => [
      ...films,
      { id: lastFilmId, status: "added", ...newFilm },
    ]);
    setLastFilmId((id) => id + 1);
    API.addFilm(newFilm)
      .then(() => setDirty(true))
      .catch((err) => handleErrors(err));
  };

  // This function updates a film already stored into the FilmLibrary array
  const updateFilm = (newFilm) => {
    setFilms((oldFilms) => {
      return oldFilms.map((film) => {
        if (newFilm.id === film.id)
          return {
            status: "updated",
            ...newFilm,
          };
        else return film;
      });
    });
    API.updateFilm(newFilm)
      .then(() => setDirty(true))
      .catch((err) => handleErrors(err));
  };

  // This function removes a film from the FilmLibrary array
  const deleteFilm = (filmId) => {
    setFilms((oldFilms) =>
      oldFilms.map((film) =>
        film.id !== filmId
          ? film
          : Object.assign({}, film, { status: "deleted" })
      )
    );
    API.deleteFilm(filmId)
      .then(() => setDirty(true))
      .catch((err) => handleErrors(err));
  };

  return (
    <BrowserRouter>
      <UserContext.Provider value={{ user, loggedIn }}>
        <MessageContext.Provider value={{ handleErrors }}>
          <Container fluid className="App">
            <Navigation logout={doLogOut} />
            <Routes>
              <Route
                path="/"
                element={
                  <DefaultLayout
                    films={films}
                    filters={filters}
                    setDirty={setDirty}
                  />
                }
              >
                <Route
                  index
                  element={
                    <MainLayout
                      films={films}
                      filters={filters}
                      setFilms={(films) => {
                        setFilms(films);
                        setLastFilmId(Math.max(...films.map((f) => f.id)) + 1);
                      }}
                      deleteFilm={deleteFilm}
                      updateFilm={updateFilm}
                      dirty={dirty}
                      setDirty={setDirty}
                    />
                  }
                />
                <Route
                  path="filter/:filterLabel"
                  element={
                    <MainLayout
                      films={films}
                      filters={filters}
                      setFilms={(films) => {
                        setFilms(films);
                        setLastFilmId(Math.max(...films.map((f) => f.id)) + 1);
                      }}
                      deleteFilm={deleteFilm}
                      updateFilm={updateFilm}
                      dirty={dirty}
                      setDirty={setDirty}
                    />
                  }
                />
                <Route
                  path="add"
                  element={<AddLayout filters={filters} addFilm={addFilm} />}
                />
                <Route
                  path="edit/:filmId"
                  element={
                    <EditLayout
                      films={films}
                      filters={filters}
                      updateFilm={updateFilm}
                    />
                  }
                />
                <Route
                  path="login"
                  element={<LoginForm loginSuccessful={loginSuccessful} />}
                />
                <Route path="*" element={<NotFoundLayout />} />
              </Route>
            </Routes>
            <ToastContainer className="p-3" position="bottom-center">
              <Toast
                show={message !== ""}
                onClose={() => setMessage("")}
                delay={4000}
                autohide
              >
                <Toast.Header>
                  <strong className="me-auto">Notification</strong>
                </Toast.Header>
                <Toast.Body>{message}</Toast.Body>
              </Toast>
            </ToastContainer>
          </Container>
        </MessageContext.Provider>
      </UserContext.Provider>
    </BrowserRouter>
  );
}

export default App;
