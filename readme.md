# Full Stack Review

An app that maintains a list of users.

## Client/Server

- sequelize
- postgres
- express
- react

mkdir fullstackdemo
npm init -y

https://gist.github.com/DannyBoyNYC/12ed25aed343d0b5d3d819ac070d8ca6

.gitignore:

```js
$ touch .gitignore
$ echo node_modules >> .gitignore
```

package.json:

```js
{
  "name": "full-stack-demo",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "build": "webpack",
    "build:dev": "npm run build -- --watch --mode=development",
    "start:dev": "npm run build:dev & nodemon server --ignore dist/ --ignore src/"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "express": "^4.17.1",
    "pg": "^8.5.1",
    "sequelize": "^6.3.5"
  },
  "devDependencies": {
    "@babel/core": "^7.12.9",
    "@babel/preset-react": "^7.12.7",
    "axios": "^0.21.0",
    "babel-loader": "^8.2.2",
    "nodemon": "^2.0.6",
    "react": "^17.0.1",
    "react-dom": "^17.0.1",
    "webpack": "^5.9.0",
    "webpack-cli": "^4.2.0"
  }
}
```

webpack.config.js:

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: "babel-loader",
        exclude: /node_modules/,
        options: {
          presets: ["@babel/preset-react"],
        },
      },
    ],
  },
};
```

Add webpack and package and npm i

npm run
npm run start:dev
mkdir src
touch src/index.js
touch server.js
npm run start:dev

Note the dist folder

```js
$ echo dist >> .gitignore
```

```js
docker run --name my-postgres -e POSTGRES_PASSWORD=mysecretpassword -p 5432:5432 -d --rm postgres:13.0
docker exec -it -u postgres my-postgres psql
```

```js
CREATE DATABASE acme_db;
```

Add server.js:

```js
const express = require("express");
const { static } = express;
const path = require("path");

const app = express();

app.use("/dist", static(path.join(__dirname, "dist")));

app.get("/", (req, res, next) =>
  res.sendFile(path.join(__dirname, "index.html"))
);

app.get("/api/users", async (req, res, next) => {
  try {
    res.send(await User.findAll());
  } catch (ex) {
    next(ex);
  }
});

const init = async () => {
  try {
    await syncAndSeed();
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`listening on port ${port}`));
  } catch (ex) {
    console.log(ex);
  }
};

const Sequelize = require("sequelize");
const { STRING } = Sequelize;
const conn = new Sequelize(
  "postgres://postgres:mysecretpassword@localhost:5432/acme_db"
);

const User = conn.define("user", {
  name: STRING,
});
const syncAndSeed = async () => {
  await conn.sync({ force: true });
  await Promise.all([
    User.create({ name: "moe" }),
    User.create({ name: "larry" }),
    User.create({ name: "lucy" }),
  ]);
};

init();
```

Test:

`localhost:3000/api/users`
`localhost:3000`

Add index.html

```js
<html>
  <head>
    <script src="/dist/main.js" defer></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

Add src/index.js

```js
import React from "react";
import { render } from "react-dom";

const App = () => {
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/users").then((response) =>
      response.json().then((data) => {
        setUsers(data);
        setLoading(false);
      })
    );
  }, []);

  if (loading) {
    return "....loading";
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
```

## Server Reorg

1. server/index.js

- change the paths

```js
app.use("/dist", static(path.join(__dirname, "../dist")));
...
res.sendFile(path.join(__dirname, "../index.html"))
```

2. Duplicate server/index.js as db.js and edit:

```js
const Sequelize = require("sequelize");
const { STRING } = Sequelize;
const conn = new Sequelize(
  "postgres://postgres:mysecretpassword@localhost:5432/acme_db"
);

const User = conn.define("user", {
  name: STRING,
});
const syncAndSeed = async () => {
  await conn.sync({ force: true });
  await Promise.all([
    User.create({ name: "moe" }),
    User.create({ name: "larry" }),
    User.create({ name: "lucy" }),
  ]);
};

module.exports = {
  models: {
    User,
  },
  syncAndSeed,
};
```

3. Remove the db code from /server/index.js and import the exports (destructuring)

```js
const {
  syncAndSeed,
  models: { User },
} = require("./db");
```

e.g.: /server/index.js

```js
const {
  syncAndSeed,
  models: { User },
} = require("./db");
const express = require("express");
const { static } = express;
const path = require("path");

const app = express();

app.use("/dist", static(path.join(__dirname, "../dist")));

app.get("/", (req, res, next) =>
  res.sendFile(path.join(__dirname, "../index.html"))
);

app.get("/api/users", async (req, res, next) => {
  try {
    res.send(await User.findAll());
  } catch (ex) {
    next(ex);
  }
});

const init = async () => {
  try {
    await syncAndSeed();
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`listening on port ${port}`));
  } catch (ex) {
    console.log(ex);
  }
};

init();
```

separate db.js into:

/server/db/index.js

```js
const conn = require("./conn");
const User = require("./User");

const syncAndSeed = async () => {
  await conn.sync({ force: true });
  await Promise.all([
    User.create({ name: "moe" }),
    User.create({ name: "larry" }),
    User.create({ name: "lucy" }),
  ]);
};

module.exports = {
  models: {
    User,
  },
  syncAndSeed,
};
```

/server/db/conn.js

```js
const Sequelize = require("sequelize");
const conn = new Sequelize(
  "postgres://postgres:mysecretpassword@localhost:5432/acme_db"
);

module.exports = conn;
```

/server/db/User.js

```js
const conn = require("./conn");
const { STRING } = conn.Sequelize;

const User = conn.define("user", {
  name: STRING,
});

module.exports = User;
```

## Reorg Frontend

Change src to client and add entry to webpack:

```js
module.exports = {
  entry: "./client/index.js",
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: "babel-loader",
        exclude: /node_modules/,
        options: {
          presets: ["@babel/preset-react"],
        },
      },
    ],
  },
};
```

Server restarts when client changes (add `console.log(' starting ')` to front end)

In package:

```js
"start:dev": "npm run build:dev & nodemon server --ignore dist/ --ignore client/",
```

Add output to webpack:

```js
const path = require("path");
module.exports = {
  entry: "./client/index.js",
  output: {
    path: path.join(__dirname, "public"),
    filename: "bundle.js",
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: "babel-loader",
        exclude: /node_modules/,
        options: {
          presets: ["@babel/preset-react"],
        },
      },
    ],
  },
};
```

Test and get rid of dist

Edit index.html to point to public/bundle:

```js
<html>
  <head>
    <script src="/public/bundle.js" defer></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

And modify server/index.js:

```js
app.use("/public", static(path.join(__dirname, "../public")));
```

In package:

```js
"start:dev": "npm run build:dev & nodemon server --ignore public/ --ignore client/",
```

In gitignore

```
node_modules;
public/bundle.js
```

Create App.js:

```js
import React from "react";

export const App = () => {
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/users").then((response) =>
      response.json().then((data) => {
        setUsers(data);
        setLoading(false);
      })
    );
  }, []);

  if (loading) {
    return "....loading";
  }

  return (
    <ul>
      {users.map((user) => {
        return <li key={user.id}>{user.name}</li>;
      })}
    </ul>
  );
};
```

And

```js
import React, { Component } from "react";
import { render } from "react-dom";
import { App } from "./App";

render(<App />, document.querySelector("#root"));
```

Break out Users into a components folder:

/client/components/Users.js

```js
import React from "react";

const Users = ({ users }) => {
  return (
    <div>
      <h2>Users ({users.length})</h2>
      <ul>
        {users.map((user) => {
          return <li key={user.id}>{user.name}</li>;
        })}
      </ul>
    </div>
  );
};

export default Users;
```

and import it into App:

```js
import Users from "./Components/Users";
```

## Deploy

Add a start command to package:

```js
  "scripts": {
    "build": "webpack",
    "build:dev": "npm run build -- --watch --mode=development",
    "start:dev": "npm run build:dev & nodemon server --ignore public/ --ignore client/",
    "start": "node server"
  },
```

Push to Github and create a Heroku account.

## Redux

### Pub Sub

```html
<html>
  <head>
    <!-- <script src="/dist/main.js" defer></script> -->
  </head>
  <body>
    <h1>Users</h1>
    <div id="root"></div>
    <h2>Counter</h2>
    <div id="count"></div>
  </body>
  <script>
    const renderCounter = (count) => {
      const html = `<h3>The count is ${count}</h3>`;
      document.querySelector("#count").innerHTML = html;
    };
    let count = 0;
    renderCounter(count);
  </script>
</html>
```

```js
const renderCounter = (count) => {
  const html = `<h3>The count is ${count}</h3>`;
  document.querySelector("#count").innerHTML = html;
};
let count = 0;
renderCounter(count);

setInterval(() => {
  count = count + 1;
  renderCounter(count);
}, 1000);
```

### Store

Subscribers and state

Pub and sub to it.

```js
const renderCounter = (count) => {
  const html = `<h3>The count is ${count}</h3>`;
  document.querySelector("#count").innerHTML = html;
};

const store = {
  state: 0,
  listeners: [],
  dispatch: function (newState) {
    this.state = newState;
  },
};

renderCounter(store.state);

setInterval(() => {
  store.dispatch(store.state + 1);
  renderCounter(store.state);
}, 1000);
```

Add an array of listeners for subscribers

```js
const renderCounter = (count) => {
  const html = `<h3>The count is ${count}</h3>`;
  document.querySelector("#count").innerHTML = html;
};

const store = {
  state: 0,
  listeners: [],
  dispatch: function (newState) {
    this.state = newState;
    this.listeners.forEach((listener) => {
      listener();
    });
  },
  subscribe: function (listener) {
    this.listeners.push(listener);
  },
};

// renderCounter(store.state);
store.subscribe(() => {
  renderCounter(store.state);
});

setInterval(() => {
  store.dispatch(store.state + 1);
  // renderCounter(store.state);
}, 1000);
```

Add multiple subscribers:

```js
const renderCounter = (count) => {
  const html = `<h3>The count is ${count}</h3>`;
  document.querySelector("#count").innerHTML = html;
};

const store = {
  state: 0,
  listeners: [],
  dispatch: function (newState) {
    this.state = newState;
    this.listeners.forEach((listener) => {
      listener();
    });
  },
  subscribe: function (listener) {
    this.listeners.push(listener);
  },
  logListeners: function () {
    console.log(" listeners ", this.listeners);
  },
};

store.subscribe(() => {
  renderCounter(store.state);
});

store.subscribe(() => {
  console.log(" the store has changed ");
});

setInterval(() => {
  store.dispatch(store.state + 1);
  store.logListeners();
}, 1000);
```

Unsubscribing

```js
const countEl = document.querySelector("#count");

const renderCounter = (count) => {
  const html = `<h3>The count is ${count}</h3>`;
  countEl.innerHTML = html;
};

countEl.addEventListener("click", () => {
  console.log(" clicked ");
});

const store = {
  state: 0,
  listeners: [],
  dispatch: function (newState) {
    this.state = newState;
    this.listeners.forEach((listener) => {
      listener();
    });
  },
  subscribe: function (listener) {
    this.listeners.push(listener);
    // return a function that allows you to unsub
    return () => {
      this.listeners = this.listeners.filter(
        (_listener) => _listener !== listener
      );
    };
  },
  logListeners: function () {
    console.log(" listeners ", this.listeners);
  },
};

const unsubscribe = store.subscribe(() => {
  renderCounter(store.state);
});
console.log(" unsubscribe ", unsubscribe);

store.subscribe(() => {
  console.log(" the store has changed ");
});

setInterval(() => {
  store.dispatch(store.state + 1);
  store.logListeners();
}, 1000);
```

Add the unsub to the click listener

```js
const countEl = document.querySelector("#count");

const renderCounter = (count) => {
  const html = `<h3>The count is ${count}</h3>`;
  countEl.innerHTML = html;
};

countEl.addEventListener("click", () => {
  unsubscribe();
});

const store = {
  state: 0,
  listeners: [],
  dispatch: function (newState) {
    this.state = newState;
    this.listeners.forEach((listener) => {
      listener();
    });
  },
  subscribe: function (listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(
        (_listener) => _listener !== listener
      );
    };
  },
};

const unsubscribe = store.subscribe(() => {
  renderCounter(store.state);
});

store.subscribe(() => {
  console.log(" the store has changed ");
});

setInterval(() => {
  store.dispatch(store.state + 1);
}, 1000);
```

Note the use of 'this' in the unsub function.

We have closure here so the 'this' points to the 'this' in the object when it is returned.

Try:

```js
dispatch: (newState) => {
    this.state = newState;
    this.listeners.forEach((listener) => {
      listener();
    });
  },
```

Rollback and try:

```js
return function () {
  this.listeners = this.listeners.filter((_listener) => _listener !== listener);
};
```

## Redux

https://cdnjs.com/ - full version

```html
<script
  src="https://cdnjs.cloudflare.com/ajax/libs/redux/4.1.0/redux.js"
  integrity="sha512-tqb5l5obiKEPVwTQ5J8QJ1qYaLt+uoXe1tbMwQWl6gFCTJ5OMgulwIb3l2Lu7uBqdlzRf5yBOAuLL4+GkqbPPw=="
  crossorigin="anonymous"
></script>
```

`console.log(" ", Redux);`

```js
const store = Redux.createStore();

// const store = {
//   state: 0,
//   listeners: [],
//   dispatch: function (newState) {
//     this.state = newState;
//     this.listeners.forEach((listener) => {
//       listener();
//     });
//   },
//   subscribe: function (listener) {
//     this.listeners.push(listener);
//     return () => {
//       this.listeners = this.listeners.filter(
//         (_listener) => _listener !== listener
//       );
//     };
//   },
// };

// const unsubscribe = store.subscribe(() => {
//   renderCounter(store.state);
// });

// store.subscribe(() => {
//   console.log(" the store has changed ");
// });

setInterval(() => {
  // store.dispatch(store.state + 1);
}, 1000);
```

```js
const store = Redux.createStore(() => {
  return "foo";
});

console.log(" redux state ", store.getState());
```

```js
const store = Redux.createStore((state = 0, action) => {
  return state;
});
```

```js
const countEl = document.querySelector("#count");

const renderCounter = (count) => {
  const html = `<h3>The count is ${count}</h3>`;
  countEl.innerHTML = html;
};

countEl.addEventListener("click", () => {
  unsubscribe();
});

const store = Redux.createStore((state = 0, action) => {
  if (action.type === "INC") {
    return (state = state + 1);
  }
  return state;
});

// const unsubscribe = store.subscribe(() => {
//   renderCounter(store.state);
// });

store.subscribe(() => {
  console.log(" the store has changed ");
});

setInterval(() => {
  store.dispatch({ type: "INC" });
}, 1000);
```

Removed code. We are only responsible for describing how the store is gong to change based on the action type.

```js
const unsubscribe = store.subscribe(() => {
  renderCounter(store.getState());
});
```
