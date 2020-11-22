[<img src="https://img.shields.io/npm/v/svelte-reduxify">](https://www.npmjs.com/package/svelte-reduxify)

# svelte-reduxify
connect your svelte store to redux devtools with minimal code change

## Installation
```shell script
npm install svelte-reduxify
```

# Usage
```javascript
import { reduxify } from "svelte-reduxify";
const store = reduxify(writable(0));
```

## Full example
Original code from https://svelte.dev/examples#custom-stores
```javascript
import { writable } from 'svelte/store';

function createCount() {
  const {subscribe, set, update } = writable(0);

  return {
    subscribe,
    increment: () => update(n => n + 1),
    decrement: () => update(n => n - 1),
    reset: () => set(0)
  };
}

export const count = createCount();
```
Modified code
```javascript
import { writable } from 'svelte/store';
import { reduxify } from "svelte-reduxify";

function createCount() {
  const {subscribe, set, update } = writable(0);

  return reduxify({
    update, // necessary for updating state from devtools
    subscribe,
    increment: () => update(n => n + 1),
    decrement: () => update(n => n - 1),
    reset: () => set(0)
  });
}

export const count = createCount();
```

Comparison
```diff
  import { writable } from 'svelte/store';
+ import { reduxify } from "svelte-reduxify";
  
  function createCount() {
    const {subscribe, set, update } = writable(0);
 
-   return { 
+   return reduxify({
+     update, // necessary for updating state from devtools
      subscribe,
      increment: () => update(n => n + 1),
      decrement: () => update(n => n - 1),
      reset: () => set(0)
-   }
+   });
  }
  
  export const count = createCount();
```

## Redux DevTools
### View actions
![Redux DevTools](./img/view-actions.png)  
You can "Jump" to states and use the timeline slider

### Dispatch actions and states
You can dispatch an action by name  
![Dispatch Actions](./img/disapatch-actions.png)  
You can also dispatch state in `JSON` format  
![Dispatch States](./img/disapatch-states.png)  
