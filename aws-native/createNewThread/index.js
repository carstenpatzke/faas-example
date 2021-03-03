const jwt = require('jsonwebtoken');
const AWS = require('aws-sdk');
const uniqid = require('uniqid');

const jwtKey = process.env.JWT_KEY;
if (!jwtKey) {
    throw new Error('JWT_KEY is not set in environment');
}

const dynamo = new AWS.DynamoDB.DocumentClient();

async function dbAddThread(row) {
    await dynamo.put({TableName: 'threads', Item: row}).promise();
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

    const { title, text } = jsonBody;
    if (!title || !text) {
        return { statusCode: 422, body: { error: 'Requires tile and text' } }; // Unprocessable Entity
    }

    const id = uniqid();
    const creationTime = new Date().toISOString();

    await dbAddThread({ id, title, username, text, creationTime });

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
