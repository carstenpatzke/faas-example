const jwt = require('jsonwebtoken');
const AWS = require('aws-sdk');
const uniqid = require('uniqid');

const jwtKey = process.env.JWT_KEY;
if (!jwtKey) {
    throw new Error('JWT_KEY is not set in environment');
}

const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async ({httpMethod, body, headers}) => {
    try {
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
            const data = jwt.verify(token, jwtKey)
            username = data.username;
        } catch(e) {
            console.log('Exception while jwt.verify', e);
            return { statusCode: 401 }; // Unauthorized
        }

        const {text, threadId} = JSON.parse(body);
        if (!text || !threadId) {
            return { statusCode: 422, body: JSON.stringify({error: 'Requires text and threadId'}) }; // Unprocessable Entity
        }

        const threadSearch = await dynamo.get({TableName: 'threads', Key: { id: threadId }}).promise();
        if (!threadSearch.Item) {
            return { statusCode: 422, body: JSON.stringify({error: 'Thread not found'}) }; // Unprocessable Entity
        }

        const id = uniqid();
        const isoTime = new Date().toISOString();

        await dynamo.put({TableName: 'comments', Item: {id, threadId, text, username, creationTime: isoTime}}).promise();

        return {
            statusCode: 200, // OK
            body: JSON.stringify({
                id,
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
