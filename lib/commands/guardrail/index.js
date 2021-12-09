const _ = require("lodash");
const isJson = require("is-json");
const storage = require("node-persist");
const { program } = require("commander");
const { yamlParse } = require("yaml-cfn");
const patternBuilder = require("../../vendor/evb/src/commands/pattern/pattern-builder");
const inputBuilder = require("../../vendor/evb/src/commands/input/input-transformer-builder");
const {
  selectFrom,
  selectConfirm,
  editor,
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
  .action(() => fatalPromise(entrypoint()));

async function entrypoint() {
  await storage.init({ stringify: (data) => JSON.stringify(data, null, 2) });
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

  let eventPattern;
  console.log("Enter your input event pattern.");
  const usePatternBuilder = await selectConfirm("Use event pattern builder?");
  if (usePatternBuilder) {
    eventPattern = await patternBuilder.buildPattern(format, schemaApi);
  } else {
    const pattern = await editor("Enter your event pattern JSON/YAML");
    eventPattern = isJson(pattern) ? JSON.parse(pattern) : yamlParse(pattern);
  }

  let transformer;
  const addInputTransformer = await selectConfirm("Add an input transformer?");
  if (addInputTransformer) {
    console.log("Enter your input transformer.");
    const useInputBuilder = await selectConfirm("Use input transform builder?");
    if (useInputBuilder) {
      transformer = await inputBuilder.build(format, schemaApi);
    } else {
      const pattern = await editor("Enter your input transformer JSON/YAML");
      transformer = isJson(pattern) ? JSON.parse(pattern) : yamlParse(pattern);
    }
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

  if (addInputTransformer) {
    const cfnRule = rule.node.defaultChild;
    cfnRule.addOverride("Properties.Targets.0.InputTransformer", transformer);
  }

  // TODO: find a way to rename the stack here
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
