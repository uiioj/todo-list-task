const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");

const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});

const dynamo = DynamoDBDocumentClient.from(client);

module.exports.handler = async (event) => {
  try {
    const pollId = event.pathParameters.id;

    const result = await dynamo.send(
      new GetCommand({
        TableName: process.env.POLLS_TABLE,
        Key: {
          pollId,
        },
      })
    );

    const poll = result.Item;

    if (!poll) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "Poll not found",
        }),
      };
    }

    const results = {
      pollId: poll.pollId,
      question: poll.question,
      totalVotes: poll.totalVotes,
      results: poll.options.map((opt) => ({
        text: opt.text,
        votes: opt.votes,
      })),
    };

    return {
      statusCode: 200,
      body: JSON.stringify(results),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: error.message,
      }),
    };
  }
};
