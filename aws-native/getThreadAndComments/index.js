const AWS = require('aws-sdk');

const dynamo = new AWS.DynamoDB.DocumentClient();

async function dbGetThread(threadId) {
    const searchResult = await dynamo.get({TableName: 'threads', Key: { id: threadId }}).promise();
    return searchResult.Item;
}

async function dbGetAllCommentsForThread(threadId) {
    const commentsSearch = await dynamo.scan({
        TableName: 'comments',
        FilterExpression: 'threadId = :threadId',
        ExpressionAttributeValues: {
            ':threadId': threadId, // using this to escape the string and prevent 'SQL' injections
        }
    }).promise();

    return commentsSearch.Items;
}

exports.handler = wrapHandler(async ({httpMethod, queryStringParameters}) => {
    if (httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers: { allow: 'OPTIONS, GET' } };
    }
    if (httpMethod !== 'GET') {
        return { statusCode: 405 }; // Method Not Allowed
    }

    const threadId = queryStringParameters.thread;
    if (!threadId) {
        return { statusCode: 422, body: { error: 'Query parameter "thread" must be set' } }; // Unprocessable Entity
    }

    const thread = await dbGetThread(threadId);
    if (!thread) {
        return { statusCode: 422, body: { error: 'Thread not found' } }; // Unprocessable Entity
    }

    const unsortedComments = await dbGetAllCommentsForThread(threadId);
    const comments = unsortedComments.sort((a, b) => new Date(b.creationTime) - new Date(a.creationTime));

    return {
        statusCode: 200, // OK
        body: {
            thread,
            comments,
        }
    };
});

function wrapHandler(originalHandler) {
    return async function handlerWrapper({ httpMethod, queryStringParameters, body, headers }) {
        try {
            const jsonBody = body ? JSON.parse(body) : {};
            const result = await originalHandler({ httpMethod, queryStringParameters, jsonBody, headers });
            if (result.body) { // if we have a body, convert it to a JSON string
                result.body = JSON.stringify(result.body);
                result.headers = {
                    'content-type': 'application/json',
                    ...result.headers,
                }
            }
            return result;
        } catch(e) {
            return {
                statusCode: 500, // Server error
                headers: {
                    'content-type': 'application/json',
                },
                body: JSON.stringify({
                    error: 'Internal server error',
                    message: e.message,
                    stack: e.stack,
                }),
            };
        }
    };
}
