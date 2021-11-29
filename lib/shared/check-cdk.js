const assert = require("assert");

module.exports = function () {
  return !!process.env["CDK_CLI_VERSION"];
};
