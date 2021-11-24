const program = require("commander");
const AWS = require("aws-sdk");
const builder = require("./input-transformer-builder");

program
  .command("input")
  .alias("i")
  .option("-f, --format <json|yaml>", "Select output format", "json")
  .description("Starts an EventBridge InputTransformer builder")
  .action(async (cmd) => {
    const schemaApi = new AWS.Schemas();
    await builder.build(cmd.format, schemaApi);
  });
