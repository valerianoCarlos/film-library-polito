import React, { useContext } from "react";

import { Navbar, Button, Nav, Stack } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import UserContext from "../contexts/UserContext";

const Navigation = (props) => {
  const navigate = useNavigate();

  const { user, loggedIn } = useContext(UserContext);

  return (
    <Navbar
      bg="primary"
      expand="sm"
      variant="dark"
      fixed="top"
      className="navbar-padding"
    >
      <Navbar.Brand style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
        <i className="bi bi-collection-play icon-size me-2" /> Film Library
      </Navbar.Brand>
      <Navbar.Toggle />
      <Navbar.Collapse className="justify-content-end">
        {loggedIn ? (
          <Stack direction="horizontal" gap={3}>
            <Navbar.Text className="fs-5">
              {"Signed in as: " + user.name}
            </Navbar.Text>
            <Button variant="danger" onClick={props.logout}>
              Logout
            </Button>
          </Stack>
        ) : (
          <Nav>
            <Nav.Link>
              <i
                className="bi bi-person-circle icon-size"
                onClick={() => navigate("/login")}
              />
            </Nav.Link>
          </Nav>
        )}
      </Navbar.Collapse>
    </Navbar>
  );
};

export { Navigation };
