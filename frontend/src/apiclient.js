import Vue from 'vue';
import jwt from 'jsonwebtoken';

/**
 * {
 *  index: number,
 *  method: string,
 *  path: string,
 *  time: number, // in sec
 * }
 */
export const lastExecutions = Vue.observable([]);
export const loggedInDetails = Vue.observable({ username: '' });

const sessionStorageTokenName = 'apitoken';
const sessionStorageProviderName = 'provider';

const awsBackend = 'https://5p58wh8205.execute-api.eu-central-1.amazonaws.com/postingboard-';
const googleBackend = 'https://europe-west3-faas-test-project.cloudfunctions.net/faas-test-application-api-dev-';
let apiBasePath;
export const currentBackend = Vue.observable({ provider: '' });

export function switchBackendTo(provider) {
    logout();
    sessionStorage.setItem(sessionStorageProviderName, provider);
    refreshProvider();
}

function refreshProvider() {
    const provider = sessionStorage.getItem(sessionStorageProviderName) ?? 'aws';
    if (provider == 'aws') {
        apiBasePath = awsBackend;
        currentBackend.provider = 'aws';
    } else {
        apiBasePath = googleBackend;
        currentBackend.provider = 'google';
    }
}

let index = 0;

function updateUserDetails() {
    const apiToken = sessionStorage.getItem(sessionStorageTokenName);
    if (apiToken) {
        const {username} = jwt.decode(apiToken);
        loggedInDetails.username = username;
    } else {
        loggedInDetails.username = '';
    }
}

async function makeApiRequest(method, path, data) {
    let time = -1;
    try {
        const apiToken = sessionStorage.getItem(sessionStorageTokenName);
        let headers = {};
        if (apiToken) {
            headers.authorization = `Token ${apiToken}`;
        }
        if (data) {
            headers['Content-Type'] = 'application/json';
        }

        const start = performance.now();
        const response = await fetch(`${apiBasePath}${path}`, {
            method,
            headers,
            body: data ? JSON.stringify(data) : undefined,
        });
        const end = performance.now();
        time = end - start;

        let responseBody = {};
        try {
            responseBody = await response.json();
        }
        catch
        {
            /* ignore */
        }
        return {
            status: response.status,
            body: responseBody,
        };
    }
    catch(e) {
        console.warn('makeApiRequest error', e);
        throw e;
    }
    finally {
        index++;

        console.log(`${path} took ${(time).toFixed(2)} ms`);
        lastExecutions.push({
            index,
            method,
            path,
            time,
        });
        if(lastExecutions.length > 10) {
            lastExecutions.shift();
        }
    }
}

export async function login(username, password) {
    const response = await makeApiRequest('POST', 'login', {
        username,
        password,
    });
    console.log('loginresponse', response);
    if (response.status === 200) {
        sessionStorage.setItem(sessionStorageTokenName, response.body.token);
        updateUserDetails();
    }
    return response;
}

export async function register(username, password) {
    const response = await makeApiRequest('POST', 'register', {
        username,
        password,
    });
    if (response.status === 200) {
        sessionStorage.setItem(sessionStorageTokenName, response.body.token);
        updateUserDetails();
    }
    return response;
}

export async function logout() {
    sessionStorage.removeItem(sessionStorageTokenName);
    updateUserDetails();
}

export async function getThreads() {
    return await makeApiRequest('GET', 'getThreads');
}

export async function createThread(title, text) {
    return await makeApiRequest('POST', 'createNewThread', {
        title,
        text,
    });
}

export async function getThreadAndComments(threadId) {
    return await makeApiRequest('GET', `getThreadAndComments?thread=${threadId}`);
}

export async function addComment(threadId, text) {
    return await makeApiRequest('POST', 'addComment', {
        threadId,
        text,
    });
}

export function setup() {
    updateUserDetails();
    refreshProvider();
}
