import dayjs from "dayjs";

import { useState } from "react";
import { Form, Button } from "react-bootstrap";
import { Link, useNavigate, useLocation } from "react-router-dom";

const FilmForm = (props) => {
  /*
   * Creating a state for each parameter of the film.
   * There are two possible cases:
   * - if we are creating a new film, the form is initialized with the default values.
   * - if we are editing a film, the form is pre-filled with the previous values.
   */
  const [formFields, setFormFields] = useState(
    props.film
      ? {
          title: props.film.title,
          favorite: props.film.favorite,
          watchDate: props.film.watchDate
            ? props.film.watchDate.format("YYYY-MM-DD")
            : "",
          rating: props.film.rating ? props.film.rating : 0,
        }
      : {
          title: "",
          favorite: false,
          watchDate: "",
          rating: 0,
        }
  );
  /*
   * Creating a state for each error associated to a parameter of the film.
   * If the input is not valid on submit, the errors are shown to the user.
   */
  const [formErrors, setFormErrors] = useState({});

  const setField = (field, value) => {
    // set form field to the new value
    setFormFields({ ...formFields, [field]: value });

    // if there were errors for this field, now remove them
    if (!!formErrors[field]) {
      setFormErrors({ ...formErrors, [field]: null });
    }
  };

  const validateForm = () => {
    const errors = {};

    // Check if the title is valid
    if (!formFields.title || formFields.title === "") {
      errors.title = "Please provide a title for the film.";
    }
    // Check if the rating is valid
    if (formFields.rating < 0 || formFields.rating > 5) {
      errors.rating = "Rating must be a number between 0 and 5.";
    }
    return errors;
  };

  // useNavigate hook is necessary to change page
  const navigate = useNavigate();
  const location = useLocation();

  // if the film is saved (eventually modified) we return to the list of all films,
  // otherwise, if cancel is pressed, we go back to the previous location (given by the location state)
  const nextpage = location.state?.nextpage || "/";

  const handleSubmit = (event) => {
    event.preventDefault();

    const errors = validateForm();
    // If there are errors, set UI to show it
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // String.trim() method is used for removing leading and ending whitespaces from the title.
    const film = {
      title: formFields.title.trim(),
      favorite: formFields.favorite,
      rating: formFields.rating,
    };
    if (formFields.watchDate)
      // adding watchDate only if it is defined
      film.watchDate = dayjs(formFields.watchDate);

    if (props.film) {
      film.id = props.film.id;
      props.updateFilm(film);
    } else props.addFilm(film);

    navigate("/");
  };

  return (
    <>
      <h2 className="py-2">{props.film ? "Edit film" : "Add a new film"}</h2>
      <Form
        noValidate
        className="block-example border border-primary border-3 rounded-4 mb-0 form-padding"
        onSubmit={handleSubmit}
      >
        <Form.Group className="mb-3">
          <Form.Label>Title</Form.Label>
          <Form.Control
            name="title"
            type="text"
            value={formFields.title}
            onChange={(event) => setField("title", event.target.value)}
            isInvalid={!!formErrors.title}
          />
          <Form.Control.Feedback type="invalid">
            {formErrors.title}
          </Form.Control.Feedback>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Check
            name="favorite"
            type="checkbox"
            label="Favorite"
            defaultChecked={formFields.favorite}
            onChange={(event) =>
              setField("favorite", event.target.checked ? 1 : 0)
            }
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Watch Date</Form.Label>
          <Form.Control
            name="watch-date"
            type="date"
            value={formFields.watchDate}
            onChange={(event) => setField("watchDate", event.target.value)}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Rating</Form.Label>
          <Form.Control
            name="rating"
            type="number"
            min={0}
            max={5}
            step={1}
            value={formFields.rating}
            onChange={(ev) => setField("rating", ev.target.value)}
            isInvalid={!!formErrors.rating}
          />
          <Form.Control.Feedback type="invalid">
            {formErrors.rating}
          </Form.Control.Feedback>
        </Form.Group>
        <Button className="mb-3" variant="primary" type="submit">
          Submit
        </Button>
        &nbsp;
        <Link className="btn btn-danger mb-3" to={nextpage}>
          Cancel
        </Link>
      </Form>
    </>
  );
};

export default FilmForm;
