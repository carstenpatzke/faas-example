const jwt = require('jsonwebtoken');
const AWS = require('aws-sdk');
const process = require('process');
const bcrypt = require('bcrypt');

const jwtKey = process.env.JWT_KEY;
if (!jwtKey) {
    throw new Error('JWT_KEY is not set in environment');
}

const dynamo = new AWS.DynamoDB.DocumentClient();
const saltRounds = 10;

exports.handler = async ({httpMethod, body}) => {
    try {
        if (httpMethod === 'OPTIONS') {
            return { statusCode: 204, headers: { allow: 'OPTIONS, POST' } };
        }
        if (httpMethod !== 'POST') {
            return { statusCode: 405 }; // Method Not Allowed
        }

        const {username, password} = JSON.parse(body);
        const existingUserSearch = await dynamo.get({TableName: 'users', Key: { username }}).promise();
        if (existingUserSearch.Item) {
            return {
                statusCode: 422, // Unprocessable Entity
                body: JSON.stringify({error: 'Username already taken'})
            };
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);

        await dynamo.put({TableName: 'users', Item: {username, password: hashedPassword}}).promise();
        const token = jwt.sign({ username }, jwtKey);

        return {
            statusCode: 200, // OK
            body: JSON.stringify({token}),
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
