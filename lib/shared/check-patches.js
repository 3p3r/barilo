const { boolean } = require("boolean");

function checkPatches() {
  if (!boolean(process.env["BARILO_PATCHED"])) {
    console.error(
      "Barilo works with a patched version of the CDK. Run with 'npx cdk ...'"
    );
    process.exit(1);
  }
}

module.exports = { checkPatches };
