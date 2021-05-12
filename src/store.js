import { createStore, combineReducers } from "redux";

const usersReducer = (state = [], action) => {
  console.log(" FOO ", action.users);
  switch (action.type) {
    case "SET_USERS":
      state = action.users;
      break;
    case "CREATE_USER":
      state = [...state, action.user];
      break;
    case "DESTROY_USER":
      state = state.filter((user) => user.id !== action.user.id);
      break;
  }
  return state;
};

const reducer = combineReducers({
  users: usersReducer,
});

const store = createStore(reducer);

export default store;
