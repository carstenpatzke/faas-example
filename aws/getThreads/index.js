const AWS = require('aws-sdk');

const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async ({httpMethod}) => {
    try {
        if (httpMethod === 'OPTIONS') {
            return { statusCode: 204, headers: { allow: 'OPTIONS, GET' } };
        }
        if (httpMethod !== 'GET') {
            return { statusCode: 405 }; // Method Not Allowed
        }

        const result = await dynamo.scan({TableName: 'threads'}).promise();

        // sort threads by time DESC
        const threads = result.Items.sort((a, b) => new Date(b.creationTime) - new Date(a.creationTime));

        return {
            statusCode: 200, // OK
            body: JSON.stringify({
                threads,
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
