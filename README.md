# Developer Portal Backend

This application handles backend work for the [Developer Portal](https://github.com/department-of-veterans-affairs/developer-portal). It replaced a [Lambda function](https://github.com/department-of-veterans-affairs/developer-portal-lambda-backend) that handled applications for sandbox environment credentials.

When a user applies for a key, several things happen:
- If the user asks for access to a standard API (one secured with a symmetric key), a number of requests are made to the [Kong](https://konghq.com/kong/) admin API. The first requests whether the consumer already exists based on the tuple of organization and last name that are provided. After an existing consumer is returned or a new one is created, the correct ACLs for the requested standard APIs are attached to the consumer and a new key is generated. **Note: the same consumer can have many keys, and when an ACL is added to a consumer, all existing keys also get access to the new API.**
- If the user asks for access to an OAuth API, a request is made to [Okta](https://www.okta.com/) to create a new application named after the tuple of the organization and last name combined with the current timestamp. Requests in DEV and PROD both go to our only non-production Okta organization `https://deptva-eval.okta.com/` using the [Okta API](https://developer.okta.com/docs/reference/api/apps/).
- A record of the user's signup request is saved in a DynamoDB table, which includes details like their name, email, organization, and which APIs they requested, among other fields. **Note: the DynamoDB table is not the canonical source of information for which consumers have access to which APIs. Kong is the canonical source for standard APIs, and Okta is the canonical source for OAuth APIs. Consumers can and do have their access changed outside of the context of the initial application that updates the DynamoDB table.**
- An email is sent via GovDelivery to the address the user provided that includes some combination of an api key, client id, and client secret.
- A message is sent to Lighthouse Slack about the signup. Production signups go to `#feed-dx` and nonprod signups go to `#dev-signup-feed`. 

## Running Locally
This Express server is written in TypeScript and uses [Node v12+](https://nodejs.org/en/download/).

This application relies on several backing services and uses `docker-compose` to run them locally. Docker is responsible for configuring and running Kong and DynamoDB, in addition to the application, which is built based on the Dockerfile at the root of the project. 

There are several backing services that are optional when running locally, including: Okta, Slack, GovDelivery, and Sentry.

Before running, you'll need to create a `.env` file at the root of the project, which several of the containers rely on to agree upon credentials. A good initial setup looks like:
```
KONG_HOST=kong
KONG_KEY=taco
KONG_PORT=8000
KONG_PROTOCOL=http
NODE_ENV=development
DYNAMODB_ENDPOINT=http://dynamodb:8000
SLACK_BASE_URL=http://mock:3001/services/slack
SLACK_CHANNEL=#the-fellowship
SLACK_BOT_ID=DenethorBot
SLACK_TOKEN=keep-it-secret-keep-it-safe
GOVDELIVERY_HOST=http://mock:3001/services/govdelivery
GOVDELIVERY_KEY=123
SUPPORT_EMAIL=gandalf@istari.net
OKTA_HOST=http://mock:3001/services/okta
OKTA_TOKEN=123
DEVELOPER_PORTAL_URL=http://localhost:3001
```

With a `.env` in place, use `docker-compose up` to run the application.

To add support for more services, look up the dev environment variables in AWS Parameter Store under `/dvp/dev/developer-portal-backend` and add them to the `.env` file. Other variables include `OKTA_ORG` and `SENTRY_DSN`.

Some variables are difficult to locate from the source. To acquire the `SLACK_BOT_ID` from the Slack API, please use the `/api/auth.test` `POST` call. Documented [here](https://api.slack.com/methods/auth.test).

Example CURL request:
```sh
curl --location --request POST 'https://lighthouseva.slack.com/api/auth.test' \
--header 'Authorization: Bearer <Put SLACK_TOKEN here>'
```

### Running Developer Portal Backend and Developer Portal together locally
1. Set `DEVELOPER_PORTAL_URL` in the developer-portal-backend `.env` to where your Developer Portal is running (default is `http://localhost:3001`)
2. Set `REACT_APP_DEVELOPER_PORTAL_SELF_SERVICE_URL` in the developer-portal `.env.local` to where your Developer Portal Backend is running (default is `http://localhost:9999`)

## Development
The `docker-compose.yml` file defines volumes in the app container so that changes made to the code on the host are picked up inside the container. The default start commmand also has the server hot-reload on changes, so it's convenient to leave the containers running in the background while developing. 

Tests can be run with `npm test` or `npx jest`. The most _correct_ way to run tests is inside the container. To do that, exec into the running app container with `docker-compose exec app bash`. As an editorial note, this author finds running tests to be faster on the host machine. You can npm install and run `npx jest` on the host, but non-linux users need to be careful about modifications to resulting `package-lock.json`.

**Note: If you install a new node module while developing or pull down code with a new dependency defined in `package.json`, know that you will need to rebuild the container to have the application find that module. While app code is mounted with a volume, the node_modules directory is explicitly ignored. Rebuild the container with `docker-compose build`, and you should be all set.**

The code will be linted in CI, so it may be helfpul to run it locally before pushing the branch. That can be done with `npm run lint`. Because the `lib/` directory came from the previous Lambda codebase, it does not adhere to the same style and is not linted. It is being incrementally fixed to adhere to the new rules.

## Deployment
For information about CICD, [view the README in the cicd directory](./cicd/README.md).

In general, containers are built in CI that are pushed to Elastic Container Registry and then deployed to Fargate.

### Backing Services
The developer-portal-backend is currently deployed in `dvp-dev` and `dvp-prod`. The mapping to backing services is not intuitive for those not already familiar with the system.

#### DEV
**Kong**: Dev connects with Kong running in `dvp-dev` through an `/internal/admin/consumers` route. 

**Okta**: It connects to the `deptva-eval` Okta Org, which is our **only** nonproduction Okta org. 

**DynamoDB**: It records signups in the `dvp-dev-developer-portal-users` table.

#### PROD
**Kong:** The prod backend in `dvp-prod` connects with Kong running in `dvp-sandbox` through an `/internal/admin/consumers` route. This is because "production" signups on the Developer Portal are actually provisioning access to the sandbox environment. The request goes through the revproxy, which sends `/internal` routes, in addition to a couple of other prefixes, to the Kong ELB. 

**Okta:**: It connects to the `deptva-eval` Okta Org, which is our **only** nonproduction Okta org. 

**DynamoDB:** It records signups in the `dvp-prod-developer-portal-users` table.

### Hitting Deployed Services
DEV is available at `POST https://dev-api.va.gov/internal/developer-portal-backend/developer_application`. This route is [configured in Kong](https://github.com/department-of-veterans-affairs/devops/blob/master/lighthouse/gateway/kong_configs/dev_kong.yml) as the `developer-portal-backend` service. 

PROD is available at `POST https://api.va.gov/internal/developer-portal-backend/developer_application`. This route is [configured in Kong](https://github.com/department-of-veterans-affairs/devops/blob/master/lighthouse/gateway/kong_configs/prod_kong.yml) as the `developer-portal-backend` service. 

#### Example CURL
```sh
curl --request POST 'https://dev-api.va.gov/internal/developer-portal-backend/developer_application' \
-H 'Content-Type: application/json' \
-d '{
    "apis": "facilities,health",
    "description": "🔥example for the developer-portal-backend docs!🔥",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "oAuthRedirectURI": "http://localhost:5000/callback",
    "organization": "Example Organization",
    "termsOfService": true
}' 
```

## Troubleshooting

### Debugging in VSCode
In your `.env` file add
```
RUN_COMMAND=watch:debug
```

In VSCode open the command palette (`ctrl/cmd + shift + p`) and select `>Debug: Open launch.json` in the `configurations` array put:
```
        {
            "type": "node",
            "request": "attach",
            "port": 9229,
            "address": "localhost",
            "name": "Docker: Attach to Node",
            "remoteRoot": "/home/node",
            "protocol": "inspector",
            "restart": true
        }
```

Now you can `docker-compose up` and once you see something like `Debugger listening on ws://0.0.0.0:9229/fd733b....` then you can `ctrl/cmd + shift + d` and Run `Docker: Attach to Node`.

Then app should log out:
```
app_1                 | Debugger attached.
```

Once the debugger is attached it will break at the first line. If you press continue, then the server will start and you can debug as normal.

### Logs
To view logs, look in the `/dvp/dvp-dev-dev-portal-be` log group in CloudWatch. The prod log group is `/dvp/dvp-prod-dev-portal-be`. 

[awslogs](https://github.com/jorgebastida/awslogs) is a convenient way to view these log groups. The following command will gather the previous 30 minutes of logs and continuously check for new entries. It requires [having established an MFA session in AWS GovCloud](https://github.com/department-of-veterans-affairs/devops#credentials).
```
awslogs get -ws 30m /dvp/dvp-dev-dev-portal-be
```

### Sentry
Exceptions are captured in [Sentry](http://sentry.vfs.va.gov/). [SOCKS proxy access](https://github.com/department-of-veterans-affairs/va.gov-team/blob/master/platform/working-with-vsp/orientation/request-access-to-tools.md) is required to see Sentry. 
- [dvp-developer-portal-api](http://sentry.vfs.va.gov/vsp/dvp-developer-portal-api/). Use the "environment" dropdown at the top of the Sentry UI to toggle environment-specific error filtering.

Need to modify how Sentry is configured in the application? SOCKS proxy access is required to reach our Sentry instance from your local machine. To test out error reporting in a local environment you would need to configure the Sentry client to proxy through it. It's likely easier to deploy another route that consistently throws an exception.

### Deploying a one-off container
Sometimes, a problem will show up where a deployed environment is the only place iterating toward a solution is possible. For example, there have been connectivity issues related to certificates that can only be tested from within the VAEC. Instead of continually merging PRs, it's easier to build a container locally, push it to ECR, and then create a new revision of the task definition that Fargate is running that points to your test container.

First login to the ECR. To get the command, visit ECR in the AWS Console, search for the `/dvp/developer-portal-backend` repository, and then click `View push commands` in the upper-right. The steps to push a container are all listed. Make sure to tag your container with something easy to differentiate like `your-name-test`.

Next go to ECS for the [`dev_dev_portal_backend_cluster`](https://console.amazonaws-us-gov.com/ecs/home?region=us-gov-west-1#/clusters/dev_dev_portal_be_cluster/services), click the `Tasks` tab and then the `Task Definition` of the currently running task. Click the button to `Create new revision`. Go down to the `Container Definitions` section and click the `dvp-dev-dev-portal-be` container. In the window that slides out, change the tag of the image listed in the `Image*` textarea to the one of your new test image. Click `Update` and then click `Create`. 

With the new revision made, go to the cluster again and click the service `dvp-dev-dev-portal-be` and then `Update` in the top right. In the revision dropdown, you can select your new revision that you just created. `Skip to review` and then `Update Service`. 

**Note: If you already have a revision with your test container tag on it from past attempts, you can just use that again instead of creating a new one. If you're not changing revisions while you're iterating, just check the `Force redeploy` box while keeping the same revision to make it pull the container again.**

Now just wait for your new task to get up and running in Fargate. It will take a few minutes to start up, and then both tasks will run together for a brief period of time before the old one shuts down.

This container will remain in place until overwritten by another run through this flow, a PR merge runs the release Codebuild job, or the manual Codebuild job is triggered against the dev cluster.

