const fs = require('fs');

// List all sub-folders of the 'functions' directory.
const avaiableFunctions = fs.readdirSync('functions');

// Only load the function that this container is handling.
// If the function target is not defined Google Cloud Function will automatically fail the deployment
const functionName = process.env.FUNCTION_TARGET;
if (avaiableFunctions.includes(functionName)) {
    const handler = require(`./functions/${functionName}`);

    // Wrap the handler so it feels more like AWS-Lambda.
    // Also adding CORS-Headers to it.
    exports[functionName] = async (request, response) => {
        try {
            response.set('Access-Control-Allow-Origin', '*');
            response.set('Access-Control-Allow-Headers', '*');

            const result = await handler({ // Execute handler
                httpMethod: request.method,
                jsonBody: request.body,
                queryStringParameters: request.query,
                headers: request.headers
            });

            if (response.headers?.allow) {
                response.set('Access-Control-Allow-Methods', response.headers?.allow);
            }

            response.status(result.statusCode);
            if (result.body) {
                response.json(result.body);
            } else {
                response.send('');
            }
        } catch(e) {
            response.status(500).json({ // Server error
                error: 'Internal server error',
                message: e.message,
                stack: e.stack
            });
        }
    }
}
