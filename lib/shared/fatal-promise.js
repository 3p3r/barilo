const { exitHook } = require("./exit-hook");

async function fatalPromise(innerPromise = Promise.resolve()) {
  let dirty = true;
  exitHook(() => {
    if (dirty) {
      console.error("Operation aborted.");
      process.exit(1);
    }
  });
  await innerPromise.finally(() => (dirty = false));
}

module.exports = { fatalPromise };
