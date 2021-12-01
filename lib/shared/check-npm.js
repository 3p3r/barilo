const assert = require("assert");

function checkNpm() {
  return !!process.env["npm_command"];
}

module.exports = { checkNpm };
