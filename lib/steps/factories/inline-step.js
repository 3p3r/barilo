const cdk = require("aws-cdk-lib/core");
const tasks = require("aws-cdk-lib/aws-stepfunctions-tasks");
const { StepFactory } = require("../step-factory");
const { editor } = require("../../vendor/evb/src/commands/shared/input-util");

class ExpressionStep extends StepFactory {
  async create() {
    const body = (await editor("JavaScript Expression")).trim();
    const expression = `(async (state) => { ${body}; return state; })($.barilo.state)`;
    return new tasks.EvaluateExpression(this, "Expression", {
      expression,
      inputPath: "$",
      outputPath: "$.normalized",
      resultPath: "$.normalized.barilo.state",
      timeout: cdk.Duration.minutes(1),
    });
  }

  static purpose() {
    return "Execute a JavaScript expression";
  }
}

module.exports = { ExpressionStep };
