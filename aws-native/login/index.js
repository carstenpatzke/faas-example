const jwt = require('jsonwebtoken');
const AWS = require('aws-sdk');
const process = require('process');
const bcrypt = require('bcrypt');

const jwtKey = process.env.JWT_KEY;
if (!jwtKey) {
    throw new Error('JWT_KEY is not set in environment');
}

const dynamo = new AWS.DynamoDB.DocumentClient();

async function dbReadUserByUsername(username) {
    const searchResult = await dynamo.get({TableName: 'users', Key: { username }}).promise();
    return searchResult.Item;
}

exports.handler = wrapHandler(async ({ httpMethod, jsonBody }) => {
    if (httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers: { allow: 'OPTIONS, POST' } };
    }
    if (httpMethod !== 'POST') {
        return { statusCode: 405 }; // Method Not Allowed
    }

    const { username, password } = jsonBody;
    if (!username || !password) {
        return { statusCode: 422, body: { error: 'Requires username and password' } }; // Unprocessable Entity
    }

    const foundUser = await dbReadUserByUsername(username);
    if (!foundUser) {
        return { statusCode: 422, body: { error: 'Unknown username' } }; // Unprocessable Entity
    }

    if (!await bcrypt.compare(password, foundUser.password)) {
        return { statusCode: 422, body: { error: 'Invalid password' } }; // Unprocessable Entity
    }

    const token = jwt.sign({ username }, jwtKey);

    return { statusCode: 200, body: { token } }; // OK
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
