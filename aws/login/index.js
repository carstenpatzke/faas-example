const jwt = require('jsonwebtoken');
const AWS = require('aws-sdk');
const process = require('process');
const bcrypt = require('bcrypt');

const jwtKey = process.env.JWT_KEY;
if (!jwtKey) {
    throw new Error('JWT_KEY is not set in environment');
}

const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async ({httpMethod, body}) => {
    try {
        if (httpMethod === 'OPTIONS') {
            return { statusCode: 204, headers: { allow: 'OPTIONS, POST' } };
        }
        if (httpMethod !== 'POST') {
            return { statusCode: 405 }; // Method Not Allowed
        }

        const {username, password} = JSON.parse(body);
        if (!username || !password) {
            return { statusCode: 422, body: JSON.stringify({error: 'Requires username and password'}) }; // Unprocessable Entity
        }

        const existingUserSearch = await dynamo.get({TableName: 'users', Key: { username }}).promise();
        if (!existingUserSearch.Item) {
            return { statusCode: 422, body: JSON.stringify({error: 'Unknown username'}) }; // Unprocessable Entity
        }

        if (!await bcrypt.compare(password, existingUserSearch.Item.password)) {
            return { statusCode: 422, body: JSON.stringify({error: 'Invalid password'}) };
        }

        const token = jwt.sign({ username }, jwtKey);

        return {
            statusCode: 200, // OK
            body: JSON.stringify({
                token,
            }),
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
