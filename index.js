// save the last called action to use for logging
var lastAction = "Initial state";
// flag to determine if action was dispatched from devtools
var dispatched = false;
// flag to avoid logging dispatched actions
var send = true;

// copied from svelte/store
// used to get the initial state
function get(store) {
  var value = {};
  store.subscribe(function (state) {
    value = state;
  })();
  return value;
}

function connectToDevTools() {
  // connect to redux devtools
  var devTools = window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__.connect();
  if (!devTools) {
    console.info("Could not connect to redux devtools");
  }
  return devTools;
}

// alternative for store.set because it may not have been exported
function setState(store, state) {
  if (typeof store.update !== "function") {
    console.warn("svelte-reduxify: could not update store, make sure to include the update function in your store definition");
    console.warn("Check example here: https://github.com/unlocomqx/svelte-reduxify");
    return;
  }
  store.update(function () {
    return state;
  });
}

function subscribeToStore(store, devTools) {
  store.subscribe(function (value) {
    var action = lastAction || "update";
    lastAction = null;
    if (send) {
      devTools.send(action, value);
    }
  });
}

function initializeDevTools(store, devTools) {
  var initial = get(store);
  devTools.init(initial);
}

function subscribeToDevTools(store, devTools) {
  // JUMP_TO_ACTION: Jump button clicked
  // JUMP_TO_STATE: timeline Slider changed
  // ACTION: action sent from Dispatcher
  // dispatched action could be either state json or store function
  devTools.subscribe(function (message) {
    if (message.type === "DISPATCH" && (message.payload.type === "JUMP_TO_ACTION" || message.payload.type === "JUMP_TO_STATE") && message.state) {
      // set send to false to avoid logging dispatched action
      send = false;
      setState(store, JSON.parse(message.state));
      send = true;
    }

    if (message.type === "ACTION") {
      var payload = message.payload;
      try {
        var new_state = JSON.parse(payload);
        // we have a state in json format
        lastAction = "dispatched state";
        setState(store, new_state);
      } catch (e) {
        if (store.hasOwnProperty(payload)) {
          var fn = store[payload];
          if (typeof fn === "function") {
            // we have a dispatched function, set dispatched flag
            dispatched = true;
            store[payload].call(store);
            dispatched = false;
          }
        }
      }
    }
  });
}

export function reduxify(store) {

  var devTools = connectToDevTools();
  if (!devTools) {
    // early return
    return store;
  }

  // we replace the original functions to be able to read the current function name and log it as an action
  // we exclude core functions
  var excludedProps = ["set", "update", "subscribe"];
  for (const prop in store) {
    if (store.hasOwnProperty(prop)) {
      if (excludedProps.indexOf(prop) === -1) {
        const fn = store[prop];
        if (typeof fn === "function") {
          // we replace the original function by one that allows us to save the function name to use as an action
          // this action will be used for logging
          store[prop] = function () {
            lastAction = (dispatched ? "dispatched " : "") + prop;
            fn.apply(store, arguments);
          };;
        }
      }
    }
  }

  // we subscribe to the store to log actions
  subscribeToStore(store, devTools);

  // log initial state
  initializeDevTools(store, devTools);

  // subscribe to devtools to receive dispatched actions
  subscribeToDevTools(store, devTools);

  // return the "reduxified" store
  return store;
}