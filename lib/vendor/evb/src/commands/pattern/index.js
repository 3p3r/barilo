const program = require("commander");
const patternBuilder = require("./pattern-builder");
const AWS = require("aws-sdk");
program
  .command("pattern")
  .alias("p")
  .option("-f, --format <json|yaml>", "Select output format", "json")
  .option("-p, --profile [profile]", "AWS profile to use")
  .option("-t, --template [template]", "Path to template file", "template.yaml")
  .option(
    "--region [region]",
    "The AWS region to use. Falls back on AWS_REGION environment variable if not specified"
  )
  .description("Starts an EventBridge pattern builder")
  .action(async (cmd) => {
    const schemaApi = new AWS.Schemas();
    const pattern = await patternBuilder.buildPattern(cmd.format, schemaApi);
  });
