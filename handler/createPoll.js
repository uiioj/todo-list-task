const crypto = require("crypto");

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");

const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});

const dynamo = DynamoDBDocumentClient.from(client);

module.exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);

    const { question, options } = body;

    if (!question || !options || options.length < 2) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Question and at least 2 options are required",
        }),
      };
    }

    const pollId = crypto.randomUUID();

    const poll = {
      pollId,
      question,
      options: options.map((option) => ({
        text: option,
        votes: 0,
      })),
      totalVotes: 0,
      createdAt: new Date().toISOString(),
    };

    await dynamo.send(
      new PutCommand({
        TableName: process.env.POLLS_TABLE,
        Item: poll,
      })
    );

    return {
      statusCode: 201,
      body: JSON.stringify(poll),
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
