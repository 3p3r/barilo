const _ = require("lodash");
const storage = require("node-persist");
const { program } = require("commander");
const patternBuilder = require("../../vendor/evb/src/commands/pattern/pattern-builder");
const inputBuilder = require("../../vendor/evb/src/commands/input/input-transformer-builder");
const {
  selectFrom,
  selectConfirm,
} = require("../../vendor/evb/src/commands/shared/input-util");
const { checkPatches, fatalPromise } = require("../../shared");
const AWS = require("aws-sdk");
const cdk = require("aws-cdk-lib/core");
const sfn = require("aws-cdk-lib/aws-stepfunctions");
const events = require("aws-cdk-lib/aws-events");
const targets = require("aws-cdk-lib/aws-events-targets");
const stepFactories = require("../../steps");

program
  .command("create-guardrail")
  .description("Starts a Guardrail builder")
  .hook("preAction", checkPatches)
  .action((cmd) => fatalPromise(entrypoint(cmd)));

async function entrypoint(cmd) {
  await storage.init();
  const schemaApi = new AWS.Schemas();
  const format = "json";
  console.log("Creating a guardrail...");

  const app = new cdk.App();
  const stack = new cdk.Stack(app);
  const steps = [
    new sfn.Pass(stack, "Normalize", {
      inputPath: "$",
      outputPath: "$.normalized",
      resultPath: "$.normalized.barilo.state",
      comment: "Normalizes input to the state machine",
    }),
  ];

  console.log("Enter your input event pattern:");
  const eventPattern = await patternBuilder.buildPattern(format, schemaApi);

  const useInputBuilder = await selectConfirm(
    "Would you like to add an input transformer?"
  );

  let inputTransformer;
  if (useInputBuilder) {
    console.log("Enter your input event transformer:");
    inputTransformer = await inputBuilder.build(format, schemaApi);
  }

  for await (const step of readSteps(stack)) {
    steps.push(step);
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
}

async function* readSteps(stack) {
  let more = true;
  while (more) {
    const hashes = createStepHashMap();
    const userPurpose = await selectFrom(Object.values(hashes));
    const type = _.findKey(hashes, (purpose) => purpose === userPurpose);
    const step = await new stepFactories[type](stack, type).create();
    more = await selectConfirm("Add another action?");
    yield step;
  }
}

function createStepHashMap() {
  const keys = Object.keys(stepFactories);
  const steps = keys.reduce((step, key) => {
    step[key] = stepFactories[key].purpose();
    return step;
  }, {});
  return steps;
}
