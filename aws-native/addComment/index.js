const jwt = require('jsonwebtoken');
const AWS = require('aws-sdk');
const uniqid = require('uniqid');

const jwtKey = process.env.JWT_KEY;
if (!jwtKey) {
    throw new Error('JWT_KEY is not set in environment');
}

const dynamo = new AWS.DynamoDB.DocumentClient();

async function dbDoesThreadExists(threadId) {
    const threadSearch = await dynamo.get({TableName: 'threads', Key: { id: threadId }}).promise();
    return !!threadSearch.Item;
}

async function dbAddComment(row) {
    await dynamo.put({TableName: 'comments', Item: row}).promise();
}

exports.handler = wrapHandler(async ({httpMethod, jsonBody, headers}) => {
    if (httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers: { allow: 'OPTIONS, POST' } };
    }
    if (httpMethod !== 'POST') {
        return { statusCode: 405 }; // Method Not Allowed
    }

    const token = headers.authorization?.split(' ')[1];
    if (!token) {
        return { statusCode: 401 }; // Unauthorized
    }

    let username;
    try {
        const data = jwt.verify(token, jwtKey);
        username = data.username;
    } catch(e) {
        return { statusCode: 401 }; // Unauthorized
    }

    const { text, threadId } = jsonBody;
    if (!text || !threadId) {
        return { statusCode: 422, body: { error: 'Requires text and threadId' } }; // Unprocessable Entity
    }

    if (!(await dbDoesThreadExists(threadId))) {
        return { statusCode: 422, body: { error: 'Thread not found' } }; // Unprocessable Entity
    }

    const id = uniqid();
    const creationTime = new Date().toISOString();

    await dbAddComment({ id, threadId, text, username, creationTime });

    return { statusCode: 200, body: { id } }; // OK
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
