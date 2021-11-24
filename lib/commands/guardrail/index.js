const program = require("commander");
const patternBuilder = require("../../vendor/evb/src/commands/pattern/pattern-builder");
const inputBuilder = require("../../vendor/evb/src/commands/input/input-transformer-builder");
const AWS = require("aws-sdk");
program
  .command("guardrail")
  .alias("g")
  .description("Starts a Guardrail builder")
  .action(async (cmd) => {
    const schemaApi = new AWS.Schemas();
    const format = "json";
    const pattern = await patternBuilder.buildPattern(format, schemaApi);
    const input = await inputBuilder.build(format, schemaApi);
    debugger;
  });
