const { Spanner } = require('@google-cloud/spanner');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const spanner = new Spanner();

const instance = spanner.instance('my-cloud-spanner-instance');
const database = instance.database('postingboard');
const userTable = database.table('Users');

const jwtKey = process.env.JWT_KEY;
if (!jwtKey) {
    throw new Error('JWT_KEY is not set in environment');
}

const saltRounds = 10;

async function dbReadUserByUsername(username) {
    const [[row]] = await userTable.read({
        columns: ['username', 'password'],
        keys: [username],
    });
    return row?.toJSON();
}

async function dbAddUser(row) {
    await userTable.insert(row);
}

module.exports = async function registerHandler({ httpMethod, queryStringParameters, jsonBody }) {
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
    if (foundUser) {
        return { statusCode: 422, body: { error: 'Username already taken' } }; // Unprocessable Entity
    }
    
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    await dbAddUser({ username, password: hashedPassword });

    const token = jwt.sign({ username }, jwtKey);

    return { statusCode: 200, body: { token } } // OK
}
