const cdk = require("@aws-cdk/core");
const sfn = require("@aws-cdk/aws-stepfunctions");

class StepFactoryInternal {
  static count = 0;
}

class StepFactory extends cdk.Construct {
  /**
   * @param {cdk.Construct} scope
   * @param {string} id
   */
  constructor(scope, id) {
    super(scope, `${id}-${StepFactoryInternal.count++}`);
  }

  async create() {
    throw new Error("not implemented");
  }

  static purpose() {
    throw new Error("not implemented");
  }
}

module.exports = { StepFactory };
