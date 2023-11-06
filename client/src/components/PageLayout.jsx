import React, { useEffect, useContext, useState } from "react";
import { Row, Col, Button, Spinner, Container } from "react-bootstrap";
import { Link, useParams, useLocation, Outlet } from "react-router-dom";

import FilmForm from "./FilmForm";
import FilmTable from "./FilmLibrary";
import { RouteFilters } from "./Filters";
import API from "../apis/API";
import MessageContext from "../contexts/MessageContext";
import UserContext from "../contexts/UserContext";

function DefaultLayout(props) {
  return (
    <Row className="vh-100">
      <Col md={2} bg="light" className="below-nav border-end" id="left-sidebar">
        <RouteFilters items={props.filters} setDirty={props.setDirty} />
      </Col>
      <Col md={10} className="below-nav">
        <Outlet />
      </Col>
    </Row>
  );
}

function MainLayout(props) {
  const { user, loggedIn } = useContext(UserContext);

  const location = useLocation();

  const dirty = props.dirty;

  const { handleErrors } = useContext(MessageContext);

  const { filterLabel } = useParams();
  const filterName = props.filters[filterLabel]
    ? props.filters[filterLabel].label
    : "All";
  const filterId = filterLabel || (location.pathname === "/" && "filter-all");

  useEffect(() => {
    if (dirty && loggedIn) {
      API.getFilms(filterId)
        .then((films) => {
          props.setFilms(films);
          props.setDirty(false);
        })
        .catch((err) => handleErrors(err));
    }
  }, [filterId, dirty, loggedIn]);

  return loggedIn ? (
    <>
      <h1 className="py-2">{filterName}</h1>
      <FilmTable
        films={props.films}
        deleteFilm={props.deleteFilm}
        updateFilm={props.updateFilm}
      />
      <Link
        className="btn btn-primary btn-lg fixed-right-bottom"
        to="/add"
        state={{ nextpage: location.pathname }}
      >
        {" "}
        &#43;{" "}
      </Link>
    </>
  ) : (
    <LoggedOutLayout />
  );
}

function AddLayout(props) {
  return <FilmForm addFilm={props.addFilm} />;
}

function EditLayout(props) {
  const { filmId } = useParams();
  const [film, setFilm] = useState(null);

  useEffect(() => {
    API.getFilm(filmId)
      .then((film) => setFilm(film))
      .catch((err) => handleErrors(err));
  }, [filmId]);

  return film ? <FilmForm film={film} updateFilm={props.updateFilm} /> : <></>;
}

function NotFoundLayout() {
  return (
    <Container className="below-nav center-inside">
      <h3>This is not the route you are looking for!</h3>
      <Link to="/">
        <Button variant="primary">Home</Button>
      </Link>
    </Container>
  );
}

function LoggedOutLayout() {
  return (
    <Container className="below-nav center-inside">
      <h3>Login to see your films</h3>
      <Link to="/login">
        <Button variant="primary">Login</Button>
      </Link>
    </Container>
  );
}

function LoadingLayout() {
  return (
    <Container className="below-nav center-inside">
      <Spinner />
    </Container>
  );
}

export {
  DefaultLayout,
  AddLayout,
  EditLayout,
  NotFoundLayout,
  MainLayout,
  LoadingLayout,
};
