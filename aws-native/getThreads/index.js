const AWS = require('aws-sdk');

const dynamo = new AWS.DynamoDB.DocumentClient();

async function dbReadAllThreads() {
    const result = await dynamo.scan({TableName: 'threads'}).promise();
    return result.Items;
}

exports.handler = wrapHandler(async ({httpMethod}) => {
    if (httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers: { allow: 'OPTIONS, GET' } };
    }
    if (httpMethod !== 'GET') {
        return { statusCode: 405 }; // Method Not Allowed
    }

    const unsortedThreads = await dbReadAllThreads();
    const threads = unsortedThreads.sort((a, b) => new Date(b.creationTime) - new Date(a.creationTime));

    return { statusCode: 200, body: { threads } };
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
