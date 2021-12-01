const AWS = require("aws-sdk");
const { ok } = require("assert");

async function getQueueArnByName(name) {
  const SQS = new AWS.SQS();
  const { QueueUrl } = await SQS.getQueueUrl({
    QueueName: name,
  }).promise();
  ok(QueueUrl, `Failed to get QueueUrl for: "${name}"`);
  const { Attributes } = await SQS.getQueueAttributes({
    AttributeNames: ["QueueArn"],
    QueueUrl,
  }).promise();
  return Attributes["QueueArn"];
}

module.exports = { getQueueArnByName };
