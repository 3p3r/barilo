const program = require("commander");
const patternBuilder = require("./pattern-builder");
const AWS = require("aws-sdk");
program
  .command("pattern")
  .alias("p")
  .option("-f, --format <json|yaml>", "Select output format", "json")
  .description("Starts an EventBridge pattern builder")
  .action(async (cmd) => {
    const schemaApi = new AWS.Schemas();
    const pattern = await patternBuilder.buildPattern(cmd.format, schemaApi);
  });
