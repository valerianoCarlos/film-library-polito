import "dayjs";
import dayjs from "dayjs";

import { Table, Button, Stack } from "react-bootstrap/";
import { Link, useLocation } from "react-router-dom";

function FilmTable(props) {
  const filteredFilms = props.films;

  const headers = ["#", "Title", "Favorite", "Watched", "Rating", "Actions"];

  return (
    <Table>
      <thead>
        <tr>
          {headers.map((header, index) => (
            <th key={index}>{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {filteredFilms.map((film) => (
          <FilmRow
            key={film.id}
            filmData={film}
            deleteFilm={props.deleteFilm}
            updateFilm={props.updateFilm}
          />
        ))}
      </tbody>
    </Table>
  );
}

function FilmRow(props) {
  let statusClass = null;

  switch (props.filmData.status) {
    case "added":
      statusClass = "table-success";
      break;
    case "deleted":
      statusClass = "table-danger";
      break;
    case "updated":
      statusClass = "table-warning";
      break;
    default:
      break;
  }

  const formatWatchDate = (dayJsDate, format) => {
    return dayJsDate && dayJsDate instanceof dayjs
      ? dayJsDate.format(format)
      : "";
  };

  // location is used to pass state to the edit (or add) view so that we may be able to come back to the last filter view
  const location = useLocation();

  return (
    <tr className={statusClass}>
      <th>{props.filmData.id}</th>
      <td className={props.filmData.favorite ? "text-danger" : ""}>
        {props.filmData.title}
      </td>
      <td>
        <i
          className={
            props.filmData.favorite
              ? "bi bi-heart-fill text-danger"
              : "bi bi-heart"
          }
          onClick={() =>
            props.updateFilm({
              ...props.filmData,
              favorite: !props.filmData.favorite,
            })
          }
          style={{ fontSize: "1.3em", cursor: "pointer" }}
        />
      </td>
      <td>{formatWatchDate(props.filmData.watchDate, "MMMM D, YYYY")}</td>
      <td>
        <Stack direction="horizontal" gap={1}>
          <Rating
            rating={props.filmData.rating}
            maxStars={5}
            updateRating={(newRating) =>
              props.updateFilm({ ...props.filmData, rating: newRating })
            }
          />
        </Stack>
      </td>
      <td>
        <Link
          className="btn btn-primary"
          to={"/edit/" + props.filmData.id}
          state={{ nextpage: location.pathname }}
        >
          <i className="bi bi-pencil-square" />
        </Link>
        &nbsp;
        <Button
          variant="danger"
          onClick={() => props.deleteFilm(props.filmData.id)}
        >
          <i className="bi bi-trash" />
        </Button>
      </td>
    </tr>
  );
}

function Rating(props) {
  return [...Array(props.maxStars)].map((_, index) => (
    <i
      key={index}
      className={
        index < props.rating ? "bi bi-star-fill text-warning" : "bi bi-star"
      }
      style={{ fontSize: "1.3em", cursor: "pointer" }}
      onClick={() => props.updateRating(index + 1)}
    />
  ));
}

export default FilmTable;
