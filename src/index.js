import React from "react";
import { render } from "react-dom";

const App = () => {
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/users")
      .then((response) => response.json())
      .then((data) => {
        setUsers(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <h3>Loading...</h3>;
  }

  return (
    <ul>
      {users.map((user) => {
        return <li key={user.id}>{user.name}</li>;
      })}
    </ul>
  );
};

render(<App />, document.querySelector("#root"));
