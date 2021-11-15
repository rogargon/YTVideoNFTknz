# Chainlink NodeJS Youtube External Adapter

This adapter checks if the description of a particular YouTube video (using its video identifier) contains the
provided text. This can be useful to check if a particular on-chain account has control over a YouTube video.

For instance, the user is requested to add a hash of the video content to the YouTube description. The adapter allows
building an oracle that verifies if the hash is actually present in the video description (using YouTube API through
the adapter). The oracle brings on-chain if the hash is currently part of the video description.

This feature is currently used by the CopyrightLY project to help support authorship claims with evidence, including
that the claimer has previously published the video on YouTube.

## Input Params

- `id`: The ID that YouTube uses to uniquely identify the video.
- `hash`: The text whose presence will be checked, it should be included in the description of the video 
retrieved through YouTube's API.

## Input example

```json
{ "id": 1, 
  "data": { 
    "id": "ZwVNLDIJKVA", 
    "hash": "QmPP8X2rWc2uanbnKpxfzEAAuHPuThQRtxpoY8CYVJxDj8"
  }
}
```

## Output example

```json
{
   "jobRunID": 0,
   "data":{
      "result": true
   },
   "result": true
}
```

## Install Locally

Install dependencies:

```bash
yarn
```

### Test

Run the local tests:

```bash
yarn test
```

Natively run the application (defaults to port 8080):

### Run

```bash
yarn start
```

## Call the external adapter/API server

```bash
curl -X POST -H "content-type:application/json" "http://localhost:8080/" --data '{ "id": 0, "data": { "id": "ZwVNLDIJKVA", "hash": "QmPP8X2rWc2uanbnKpxfzEAAuHPuThQRtxpoY8CYVJxDj9" } }'
```

## Docker

If you wish to use Docker to run the adapter, you can build the image by running the following command:

```bash
docker build . -t external-adapter
```

Then run it with:

```bash
docker run -p 8080:8080 -it external-adapter:latest
```

## Serverless hosts

After [installing locally](#install-locally):

### Create the zip

```bash
zip -r external-adapter.zip .
```

### Install to AWS Lambda

- In Lambda Functions, create function
- On the Create function page:
  - Give the function a name
  - Use Node.js 12.x for the runtime
  - Choose an existing role or create a new one
  - Click Create Function
- Under Function code, select "Upload a .zip file" from the Code entry type drop-down
- Click Upload and select the `external-adapter.zip` file
- Handler:
    - index.handler for REST API Gateways
    - index.handlerv2 for HTTP API Gateways
- Add the environment variable (repeat for all environment variables):
  - Key: API_KEY
  - Value: Your_API_key
- Save

#### To Set Up an API Gateway (HTTP API)

If using a HTTP API Gateway, Lambda's built-in Test will fail, but you will be able to externally call the function successfully.

- Click Add Trigger
- Select API Gateway in Trigger configuration
- Under API, click Create an API
- Choose HTTP API
- Select the security for the API
- Click Add

#### To Set Up an API Gateway (REST API)

If using a REST API Gateway, you will need to disable the Lambda proxy integration for Lambda-based adapter to function.

- Click Add Trigger
- Select API Gateway in Trigger configuration
- Under API, click Create an API
- Choose REST API
- Select the security for the API
- Click Add
- Click the API Gateway trigger
- Click the name of the trigger (this is a link, a new window opens)
- Click Integration Request
- Uncheck Use Lamba Proxy integration
- Click OK on the two dialogs
- Return to your function
- Remove the API Gateway and Save
- Click Add Trigger and use the same API Gateway
- Select the deployment stage and security
- Click Add

### Install to GCP

- In Functions, create a new function, choose to ZIP upload
- Click Browse and select the `external-adapter.zip` file
- Select a Storage Bucket to keep the zip in
- Function to execute: gcpservice
- Click More, Add variable (repeat for all environment variables)
  - NAME: API_KEY
  - VALUE: Your_API_key

## Job Definition

```json
{
  "name": "yt-oracle",
  "initiators": [
    {
      "type": "runlog",
      "params": {
        "address": "0x81946354ba92c4ef22506e9de975df674dec8a92"
      }
    }
  ],
  "tasks": [
    {
      "type": "yt_oracle"
    },
    {
      "type": "ethbool"
    },
    {
      "type": "ethtx"
    }
  ]
}
```
