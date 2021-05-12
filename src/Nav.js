import React from "react";
import { connect } from "react-redux";
import store from "./store";

const Nav = ({ users }) => {
  const createUser = () => {
    fetch("/api/users", {
      method: "post",
    })
      .then((data) => data.json())
      .then((user) =>
        store.dispatch({
          type: "CREATE_USER",
          user,
        })
      );
  };
  return (
    <nav>
      <a href="/">Home</a>
      <a href="#users">Users {users.length}</a>
      <button onClick={createUser}>Create User</button>
    </nav>
  );
};

const mapStateToProps = (state) => ({ users: state.users });

export default connect(mapStateToProps)(Nav);
