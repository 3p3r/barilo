const program = require("commander");
const patternBuilder = require("../../vendor/evb/src/commands/pattern/pattern-builder");
const inputBuilder = require("../../vendor/evb/src/commands/input/input-transformer-builder");
const {
  selectFrom,
} = require("../../vendor/evb/src/commands/shared/input-util");
const AWS = require("aws-sdk");
program
  .command("guardrail")
  .alias("g")
  .description("Starts a Guardrail builder")
  .action(async (cmd) => {
    const schemaApi = new AWS.Schemas();
    const format = "json";
    console.log("Creating a guardrail...");

    console.log("Enter your input event pattern:");
    await patternBuilder.buildPattern(format, schemaApi);

    console.log("Would you like to add an input transformer?");
    const useInputBuilder = await selectFrom(["yes", "no"], undefined, true);

    if (useInputBuilder === "yes") {
      console.log("Enter your input event transformer:");
      await inputBuilder.build(format, schemaApi);
    }
  });
