const checkCdk = require("./check-cdk");
const checkNpm = require("./check-npm");

module.exports = function () {
  if (!checkCdk()) {
    console.error(
      "You must run this application as a CDK application. Use 'npm run synth'"
    );
    process.exit(1);
  }

  if (!checkNpm()) {
    console.error(
      "You must run this application as a NPM run command. Use 'npm run synth'"
    );
    process.exit(1);
  }
};
