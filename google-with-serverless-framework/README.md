# Postingboard in Google Cloud Functions

## Setup

1. Create a project called `faas-test-project` in google cloud platform console
2. `npm i -g serverless`
3. [Create your gcloud keyfile.json](https://www.serverless.com/framework/docs/providers/google/guide/credentials/#get-credentials--assign-roles)
4. `serverless deploy`
5. Go into your [Cloud Spanner instance](https://console.cloud.google.com/spanner/instances/) and add a new database called 'postingboard' with the given schema
6. Allow `allUsers` access to [your functions](https://console.cloud.google.com/functions/list) with 'cloud function invoker' rule

## Database schema
Database: `postingboard`
```sql
CREATE TABLE Users (
    username STRING(64),
    password STRING(64)
) PRIMARY KEY (username);

CREATE TABLE Threads (
    id STRING(16),
    username STRING(64),
    title STRING(MAX),
    text STRING(MAX),
    creationTime STRING(32)
) PRIMARY KEY (id);

CREATE TABLE Comments (
    id STRING(16),
    threadId STRING(16),
    username STRING(64),
    text STRING(MAX),
    creationTime STRING(32)
) PRIMARY KEY (id);
```
