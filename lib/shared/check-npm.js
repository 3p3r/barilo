const assert = require("assert");

module.exports = function () {
  return !!process.env["npm_command"];
};
