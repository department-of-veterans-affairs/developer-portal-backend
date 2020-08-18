# Node Mock Server for VA Services

## Where to find docs for node-mock-server
This server was originally developed by [smollweide](https://github.com/smollweide). We currently haven't made any modifications. The repo is located on [Github](https://github.com/smollweide/node-mock-server).

## Running node-mock-server
```
docker build -t developer-portal-services-mock:latest .
docker run -p 3001:3001 -i developer-portal-services-mock:latest
```
Then you can access the UI at localhost:3001

## Adding a new endpoint
Using the UI you can select (+add new endpoint) and add what path you would like to use and select the HTTP verb

## Path Parameters
The `{param}` in the path input indicates a path parameter that is dynamic and you can pull from the URL. In the mock you can reference it as `<%=params.param%>`
For example:
```
/api/v1/apps/{appId}/groups/{groupId}
{
    "id": "<%=params.groupId%>",
    "lastUpdated": "2000-09-01T09:00:00.000Z",
    "priority": 0
}
```
This returns an id that equals that last path parameter in the URL.
```
/api/v1/apps/123/groups/fellowship
{
    "id": "fellowship",
    "lastUpdated": "2000-09-01T09:00:00.000Z",
    "priority": 0
}
```

## Query Parameters
You can also reference query parameters in the mock like so `<%=query.test%>`
For example:
```
/fake/endpoint
{
    "data": "<%=query.person%>"
}
```
Then you call the endpoint and get
```
/fake/endpoint?person=Bill
{
    "data": "Bill"
}
```

## Things to discover
While using this package there doesn't seem to be an implementation of body parameters. This is probably something that needs to be enhanced.