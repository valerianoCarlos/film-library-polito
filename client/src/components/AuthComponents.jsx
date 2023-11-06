import { Form, Button } from "react-bootstrap";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../apis/API";
import MessageContext from "../contexts/MessageContext";

function LoginForm(props) {
  const { handleErrors } = useContext(MessageContext);

  const [credentials, setCredentials] = useState({
    username: "john.doe@polito.it",
    password: "password",
  });
  const [formErrors, setFormErrors] = useState({});

  const navigate = useNavigate();

  const setField = (field, value) => {
    setCredentials({ ...credentials, [field]: value });
    if (!!formErrors[field]) {
      setFormErrors({ ...formErrors, [field]: null });
    }
  };

  const isEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Regular expression for correct email format
    return emailRegex.test(email);
  };

  const validateCredentials = () => {
    const errors = {};

    // Check if the email is valid
    if (!credentials.username || credentials.username === "") {
      errors.username = "Please provide an email.";
    } else if (!isEmail(credentials.username)) {
      errors.username =
        "Please provide a valid email (e.g. mario.rossi@gmail.com)";
    }

    // Check if the password is valid
    if (!credentials.password || credentials.password === "") {
      errors.password = "Please provide a password.";
    }
    return errors;
  };

  const doLogIn = () => {
    API.logIn(credentials)
      .then((user) => {
        props.loginSuccessful(user);
        navigate("/");
      })
      .catch((err) => {
        console.log(credentials);
        handleErrors("Wrong username or password");
      });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const errors = validateCredentials();

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    doLogIn();
  };

  return (
    <>
      <h2 className="py-2">Login</h2>
      <Form
        noValidate
        className="block-example border border-primary border-3 rounded-4 mb-0 form-padding"
        onSubmit={handleSubmit}
      >
        <Form.Group controlId="email" className="mb-3">
          <Form.Label>Email Address</Form.Label>
          <Form.Control
            name="username"
            type="email"
            value={credentials.username}
            onChange={(event) => setField("username", event.target.value)}
            isInvalid={!!formErrors.username}
          />
          <Form.Control.Feedback type="invalid">
            {formErrors.username}
          </Form.Control.Feedback>
        </Form.Group>
        <Form.Group controlId="password" className="mb-3">
          <Form.Label>Password</Form.Label>
          <Form.Control
            name="password"
            type="password"
            value={credentials.password}
            onChange={(event) => setField("password", event.target.value)}
            isInvalid={!!formErrors.password}
          />
          <Form.Control.Feedback type="invalid">
            {formErrors.password}
          </Form.Control.Feedback>
        </Form.Group>
        <Button className="my-2" type="submit">
          Login
        </Button>
        <Button
          className="my-2 mx-2"
          variant="danger"
          onClick={() => navigate("/")}
        >
          Cancel
        </Button>
      </Form>
    </>
  );
}

export { LoginForm };
