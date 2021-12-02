const AWS = require("aws-sdk");
const cdk = require("aws-cdk-lib/core");
const { ok } = require("assert");

async function getTopicArnByName(name) {
  const SNS = new AWS.SNS();
  const topics = await getAllTopics();
  const mapped = topics.map(({ TopicArn }) => ({
    arn: TopicArn,
    name: cdk.Arn.split(TopicArn, cdk.ArnFormat.COLON_RESOURCE_NAME).resource,
  }));
  const found = mapped.find(({ name: topic }) => topic === name);
  ok(found, `Failed to find matching topic ARN for: "${name}"`);
  return found.arn;
  async function getAllTopics(token = undefined) {
    const res = await SNS.listTopics({ NextToken: token }).promise();
    if (res.NextToken) {
      const nested = getAllTopics(res.NextToken);
      return res.Topics.concat(nested);
    } else {
      return res.Topics;
    }
  }
}

module.exports = { getTopicArnByName };
