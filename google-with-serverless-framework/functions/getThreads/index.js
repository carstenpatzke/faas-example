const { Spanner } = require('@google-cloud/spanner');
const spanner = new Spanner();

const instance = spanner.instance('my-cloud-spanner-instance');
const database = instance.database('postingboard');
const threadTable = database.table('Threads');

async function dbReadAllThreads() {
    const [rows] = await threadTable.read({
        columns: ['id', 'username', 'title', 'text', 'creationTime'],
        keySet: { all: true }
    });
    return rows.map(row => row.toJSON());
}

module.exports = async function getThreadsHandler({ httpMethod, queryStringParameters, jsonBody }) {
    if (httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers: { allow: 'OPTIONS, GET' } };
    }
    if (httpMethod !== 'GET') {
        return { statusCode: 405 }; // Method Not Allowed
    }

    const unsortedThreads = await dbReadAllThreads();
    const threads = unsortedThreads.sort((a, b) => new Date(b.creationTime) - new Date(a.creationTime));

    return { statusCode: 200, body: { threads } };
}
