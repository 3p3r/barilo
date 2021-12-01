const assert = require("assert");

function checkCdk() {
  return !!process.env["CDK_CLI_VERSION"];
}

module.exports = { checkCdk };
