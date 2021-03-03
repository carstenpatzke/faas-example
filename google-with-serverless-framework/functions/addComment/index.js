const { Spanner } = require('@google-cloud/spanner');
const uniqid = require('uniqid');
const jwt = require('jsonwebtoken');

const jwtKey = process.env.JWT_KEY;
if (!jwtKey) {
    throw new Error('JWT_KEY is not set in environment');
}

const spanner = new Spanner();
const instance = spanner.instance('my-cloud-spanner-instance');
const database = instance.database('postingboard');
const threadTable = database.table('Threads');
const commentTable = database.table('Comments');

async function dbDoesThreadExists(threadId) {
    const [[row]] = await threadTable.read({
        columns: ['id'],
        keys: [threadId],
    });
    return !!row;
}

async function dbAddComment(row) {
    commentTable.insert(row);
}

module.exports = async function addCommentHandler({ httpMethod, queryStringParameters, jsonBody, headers }) {
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
}
