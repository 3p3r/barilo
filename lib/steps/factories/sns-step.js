const sfn = require("@aws-cdk/aws-stepfunctions");
const sns = require("@aws-cdk/aws-sns");
const tasks = require("@aws-cdk/aws-stepfunctions-tasks");
const { StepFactory } = require("../step-factory");
const { getTopicArnByName } = require("../../shared");
const { text } = require("../../vendor/evb/src/commands/shared/input-util");

class SnsStep extends StepFactory {
  async create() {
    const topic = await text("SNS topic that the task will publish to");
    const message = await text("Message you want to send");
    const topicArn = await getTopicArnByName(topic);
    return new tasks.SnsPublish(this, "SNS", {
      topic: sns.Topic.fromTopicArn(this, "Topic", topicArn),
      message: sfn.TaskInput.fromText(message),
    });
  }

  static purpose() {
    return "Publish a message to an SNS topic";
  }
}

module.exports = { SnsStep };
