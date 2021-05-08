# Full Stack Review

An app that maintains a list of users.

## Client/Server

- sequelize
- postgres
- express

mkdir fullstackdemo
npm init -y

https://gist.github.com/DannyBoyNYC/12ed25aed343d0b5d3d819ac070d8ca6

.gitignore :

```js
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
