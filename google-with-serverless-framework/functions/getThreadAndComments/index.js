const { Spanner } = require('@google-cloud/spanner');

const spanner = new Spanner();
const instance = spanner.instance('my-cloud-spanner-instance');
const database = instance.database('postingboard');
const threadTable = database.table('Threads');

async function dbGetThread(threadId) {
    const [[row]] = await threadTable.read({
        columns: ['id', 'username', 'title', 'text', 'creationTime'],
        keys: [threadId],
    });
    return row?.toJSON();
}

async function dbGetAllCommentsForThread(threadId) {
    const query = {
        sql: 'SELECT * FROM Comments WHERE threadId = @threadId',
        params: {
            threadId,
        }
    };
    const [rows] = await database.run(query);
    return rows.map(row => row.toJSON());
}

module.exports = async function getThreadAndCommentsHandler({ httpMethod, queryStringParameters, jsonBody }) {
    if (httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers: { allow: 'OPTIONS, GET' } };
    }
    if (httpMethod !== 'GET') {
        return { statusCode: 405 }; // Method Not Allowed
    }

    const threadId = queryStringParameters.thread;
    if (!threadId) {
        return { statusCode: 422, body: { error: 'Query parameter "thread" must be set' } }; // Unprocessable Entity
    }

    const thread = await dbGetThread(threadId);
    if (!thread) {
        return { statusCode: 422, body: { error: 'Thread not found' } }; // Unprocessable Entity
    }

    const unsortedComments = await dbGetAllCommentsForThread(threadId);
    const comments = unsortedComments.sort((a, b) => new Date(b.creationTime) - new Date(a.creationTime));

    return {
        statusCode: 200, // OK
        body: {
            thread,
            comments,
        }
    };
}
