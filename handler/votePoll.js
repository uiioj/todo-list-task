const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");

const {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);

module.exports.handler = async (event) => {
  try {
    const pollId = event.pathParameters.id;

    const body = JSON.parse(event.body);
    const { option } = body; // ✅ نص الخيار

    const result = await dynamo.send(
      new GetCommand({
        TableName: process.env.POLLS_TABLE,
        Key: { pollId },
      })
    );

    const poll = result.Item;

    if (!poll) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Poll not found" }),
      };
    }

    if (!option) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Option required" }),
      };
    }

    // 🔥 تحديث التصويت بالنص
    const updatedOptions = poll.options.map((opt) => {
      if (opt.text === option) {
        return { ...opt, votes: opt.votes + 1 };
      }
      return opt;
    });

    const exists = poll.options.some((o) => o.text === option);

    if (!exists) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Option not found" }),
      };
    }

    const totalVotes = (poll.totalVotes || 0) + 1;

    await dynamo.send(
      new UpdateCommand({
        TableName: process.env.POLLS_TABLE,
        Key: { pollId },
        UpdateExpression: "SET options = :o, totalVotes = :t",
        ExpressionAttributeValues: {
          ":o": updatedOptions,
          ":t": totalVotes,
        },
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Vote submitted" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message }),
    };
  }
};
