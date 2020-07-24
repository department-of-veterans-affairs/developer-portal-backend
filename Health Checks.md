# Health Checks

## Overview
The route `/health_check` can be used to verify the current health status of the developer-portal-backend. The overall health of the developer-portal-backend is considered "vibrant" if all monitored services are healthly, otherwise it is considered "lackluster."

## Adding a monitored service
The `MonitoredService` interface can be implemented to expose the method `healthCheck` on any service. This health check should return a promise that resolves to a `ServiceHealthCheckResponse` object. This object includes a boolean value `healthy` based on whether the result of the health check was satisfactory. The health check should not throw errors but handle them internally and report them using the `ServiceHealthCheckResponse`. The service can then be added to the `MonitoredService` array in [`healthCheckHandler`](./routes/HealthCheck.ts) so that is included in requests to `/health_check`. 

## Health Check Definitions

### Kong
Kong is considered healthy if the Kong admin consumer used by developer-portal-backend to create and modify consumers is able to query itself on the connected instance. Kong is considered unhealthly if it responds with an error, the wrong consumer name, or an error occurs during this health check.

The name of the consumer to query currently matches across all environments, including when when running locally using Docker, so it is currently a private attribute of the Kong Service. If the environments where to for some reason drift in their naming of the Kong admin consumer, this value would need to be moved to an environmental variable for this health check to continue to work across all environments.

### Okta
Okta is considered healthy if it is able to return the user making requests to the client. Okta is considered unhealthly if it responds with an error, the response was not instantiated by a constructor name "User", or an error occurs during this health check.

The Okta API allows you to substitute "me" for the user's id to fetch the current user linked to a token or session (https://developer.okta.com/docs/reference/api/users/#get-user). This allows us to request the admin user without adding an env variable identifying the user.

### Dynamo
DynamoDB is considered healthy if a table scan with a limit of 1 can return a record. DynamoDB is considered unhealthy if the scan returns an error, the count of returned data is not 1, or an error occurs during this health check.

### Gov Delivery
Not yet implemented.

### Slack
Not yet implemented.
