const sfn = require("aws-cdk-lib/aws-stepfunctions");
const sqs = require("aws-cdk-lib/aws-sqs");
const tasks = require("aws-cdk-lib/aws-stepfunctions-tasks");
const { StepFactory } = require("../step-factory");
const { getQueueArnByName } = require("../../shared");
const { text } = require("../../vendor/evb/src/commands/shared/input-util");

class SqsStep extends StepFactory {
  async create() {
    const queue = await text("SQS queue that messages will be sent to");
    const body = await text("Text message to send to the queue");
    const queueArn = await getQueueArnByName(queue);
    return new tasks.SqsSendMessage(this, StepFactory.id("SQS"), {
      queue: sqs.Queue.fromQueueArn(this, StepFactory.id("Queue"), queueArn),
      messageBody: sfn.TaskInput.fromText(body),
    });
  }

  static purpose() {
    return "Send a message to an SQS queue";
  }
}

module.exports = { SqsStep };
