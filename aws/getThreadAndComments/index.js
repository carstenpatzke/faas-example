const AWS = require('aws-sdk');

const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async ({httpMethod, queryStringParameters}) => {
    try {
        if (httpMethod === 'OPTIONS') {
            return { statusCode: 204, headers: { allow: 'OPTIONS, GET' } };
        }
        if (httpMethod !== 'GET') {
            return { statusCode: 405 }; // Method Not Allowed
        }

        const threadId = queryStringParameters.thread;
        if (!threadId) {
            return { statusCode: 422, body: JSON.stringify({error: 'Query parameter "thread" must be set'}) }; // Unprocessable Entity
        }

        const threadSearch = await dynamo.get({TableName: 'threads', Key: { id: threadId }}).promise();
        if (!threadSearch.Item) {
            return { statusCode: 422, body: JSON.stringify({error: 'Thread not found'}) }; // Unprocessable Entity
        }
        const thread = threadSearch.Item;

        const commentsSearch = await dynamo.scan({
            TableName: 'comments',
            FilterExpression: 'threadId = :threadId',
            ExpressionAttributeValues: {
                ':threadId': threadId, // using this to escape the string and prevent 'SQL' injections
            }
        }).promise();

        // sort comments by time DESC
        const comments = commentsSearch.Items.sort((a, b) => new Date(b.creationTime) - new Date(a.creationTime));

        return {
            statusCode: 200, // OK
            body: JSON.stringify({
                thread,
                comments,
            })
        };
    } catch(e) {
        return {
            statusCode: 500, // Server error
            body: JSON.stringify({
                message: e.message,
                stack: e.stack,
            }),
        };
    }
};
