module.exports = {
  ...require("../steps/pass-step"),
  ...require("../steps/sns-step"),
  ...require("../steps/sqs-step"),
  ...require("../steps/wait-step"),
};
