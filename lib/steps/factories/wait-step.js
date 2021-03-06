const cdk = require("aws-cdk-lib/core");
const sfn = require("aws-cdk-lib/aws-stepfunctions");
const {
  getDuration,
} = require("../../vendor/evb/src/commands/shared/input-util");
const { StepFactory } = require("../step-factory");

class WaitStep extends StepFactory {
  async create() {
    const duration = await getDuration("Enter a duration (example: 15s)");
    return new sfn.Wait(this, StepFactory.id("Wait"), {
      time: sfn.WaitTime.duration(cdk.Duration.seconds(duration)),
    });
  }

  static purpose() {
    return "Wait a pre-specified amount of time";
  }
}

module.exports = { WaitStep };
