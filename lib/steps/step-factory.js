const { Construct } = require("constructs");

class StepFactoryInternal {
  static count = 0;
}

class StepFactory extends Construct {
  /**
   * @param {Construct} scope
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

  static totalSteps() {
    return StepFactoryInternal.count;
  }

  static id(name = "Step") {
    return `${name}-${StepFactory.totalSteps()}`;
  }
}

module.exports = { StepFactory };
