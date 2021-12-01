const sfn = require("@aws-cdk/aws-stepfunctions");
const { StepFactory } = require("./step-factory");

class PassStep extends StepFactory {
  async create() {
    return new sfn.Pass(this, "Pass");
  }

  static purpose() {
    return "Pass data through as-is (debugging)";
  }
}

module.exports = { PassStep };
