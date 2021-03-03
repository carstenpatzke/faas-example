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

async function dbAddThread(row) {
    await threadTable.insert(row);
}

module.exports = async function createNewThreadHandler({ httpMethod, queryStringParameters, jsonBody, headers }) {
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
}
