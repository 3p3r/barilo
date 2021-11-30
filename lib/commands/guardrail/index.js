const { program } = require("commander");
const patternBuilder = require("../../vendor/evb/src/commands/pattern/pattern-builder");
const inputBuilder = require("../../vendor/evb/src/commands/input/input-transformer-builder");
const {
  selectFrom,
} = require("../../vendor/evb/src/commands/shared/input-util");
const AWS = require("aws-sdk");
const cdk = require("@aws-cdk/core");
const sfn = require("@aws-cdk/aws-stepfunctions");
const events = require("@aws-cdk/aws-events");
const targets = require("@aws-cdk/aws-events-targets");

program
  .command("create-guardrail")
  .description("Starts a Guardrail builder")
  .hook("preAction", () => {
    require("../../shared/check-env")();
  })
  .action(async () => {
    const schemaApi = new AWS.Schemas();
    const format = "json";
    console.log("Creating a guardrail...");

    const app = new cdk.App();
    const stack = new cdk.Stack(app);
    const steps = [new sfn.Pass(stack, "Start")];

    console.log("Enter your input event pattern:");
    const eventPattern = await patternBuilder.buildPattern(format, schemaApi);

    console.log("Would you like to add an input transformer?");
    const useInputBuilder = await selectFrom(["yes", "no"], undefined, true);

    let inputTransformer;
    if (useInputBuilder === "yes") {
      console.log("Enter your input event transformer:");
      inputTransformer = await inputBuilder.build(format, schemaApi);
    }

    const definition = steps.reduce((graph, node) => graph.next(node));
    const machine = new sfn.StateMachine(stack, "Machine", { definition });
    const rule = new events.Rule(stack, "Rule", {
      targets: [new targets.SfnStateMachine(machine)],
      eventPattern,
    });

    if (useInputBuilder) {
      const cfnRule = rule.node.defaultChild;
      cfnRule.addOverride(
        "Properties.Targets.0.InputTransformer",
        inputTransformer
      );
    }
  });
