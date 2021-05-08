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

const unsubscribe = store.subscribe(() => {
  renderCounter(store.getState());
});

store.subscribe(() => {
  console.log(" the store has changed ");
});

setInterval(() => {
  store.dispatch({ type: "INC" });
}, 1000);
