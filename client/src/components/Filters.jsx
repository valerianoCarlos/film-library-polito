import { useContext } from "react";
import { Nav } from "react-bootstrap/";
import { NavLink } from "react-router-dom";
import UserContext from "../contexts/UserContext";

/**
 * This components requires:
 * - the list of filters labels to show,
 */
const RouteFilters = (props) => {
  const { items } = props;
  const { user, loggedIn } = useContext(UserContext);

  // Converting the object into an array to use map method
  const filterArray = Object.entries(items);

  return (
    <Nav variant="pills" className="flex-column">
      {filterArray.map(([filterName, { label, url }]) => {
        return (
          <NavLink
            className={loggedIn ? "nav-link" : "nav-link disable-link"}
            key={filterName}
            to={url}
            style={{ textDecoration: "none" }}
            onClick={() => props.setDirty(true)}
          >
            {label}
          </NavLink>
        );
      })}
    </Nav>
  );
};

export { RouteFilters };
