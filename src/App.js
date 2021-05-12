import React from "react";
import store from "./store";
import Nav from "./Nav";
import Users from "./Users";

const App = () => {
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/users")
      .then((response) => response.json())
      .then((users) => {
        store.dispatch({
          type: "SET_USERS",
          users,
        });
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <h3>Loading...</h3>;
  }

  return (
    <>
      <Nav />
      <Users />
    </>
  );
};

export default App;
