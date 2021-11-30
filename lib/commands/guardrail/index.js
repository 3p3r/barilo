const { program } = require("commander");
const patternBuilder = require("../../vendor/evb/src/commands/pattern/pattern-builder");
const inputBuilder = require("../../vendor/evb/src/commands/input/input-transformer-builder");
const {
  selectFrom,
  selectConfirm,
  getDuration,
  text,
} = require("../../vendor/evb/src/commands/shared/input-util");
const AWS = require("aws-sdk");
const cdk = require("@aws-cdk/core");
const sqs = require("@aws-cdk/aws-sqs");
const sns = require("@aws-cdk/aws-sns");
const sfn = require("@aws-cdk/aws-stepfunctions");
const tasks = require("@aws-cdk/aws-stepfunctions-tasks");
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

    for await (const step of readActions(stack, steps.length)) {
      steps.push(step);
    }

    console.log("Enter your input event pattern:");
    const eventPattern = await patternBuilder.buildPattern(format, schemaApi);

    const useInputBuilder = await selectConfirm(
      "Would you like to add an input transformer?"
    );

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

async function* readActions(stack, index) {
  let more = true;
  let step = null;
  while (more) {
    const type = await selectFrom(Object.values(ACTIONS), "Select an action");

    switch (type) {
      case ACTIONS.PASS:
        step = new sfn.Pass(stack, `Pass${index}`);
        break;
      case ACTIONS.WAIT:
        const duration = await getDuration("Enter a duration (example: 15s)");
        step = new sfn.Wait(stack, `Wait${index}`, {
          time: cdk.Duration.seconds(duration),
        });
        break;
      case ACTIONS.SQS:
        const queue = text("Enter the SQS queue that messages will be sent to");
        const body = text("Enter the text message to send to the queue");
        step = new tasks.SqsSendMessage(stack, `SQS${index}`, {
          queue: sqs.Queue.fromQueueArn(stack, `Queue${index}`, queue),
          messageBody: sfn.TaskInput.fromText(body),
        });
        break;
      case ACTIONS.SNS:
        const topic = text("Enter the SNS topic that the task will publish to");
        const message = text("Enter the message you want to send");
        step = new tasks.SnsPublish(stack, `SNS${index}`, {
          topic: sns.Topic.fromTopicArn(topic),
          message: sfn.TaskInput.fromText(body),
        });
        break;
      case ACTIONS.NONE:
      default:
        const quit = await selectConfirm("End adding actions?");
        if (quit) return;
        break;
    }

    more = await selectConfirm("Add another action?");
    yield step;
  }
}

const ACTIONS = {
  PASS: "pass",
  WAIT: "wait",
  SQS: "sqs message",
  SNS: "sns publish",
  NONE: "none",
};
