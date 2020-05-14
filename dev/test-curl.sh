curl --location --request POST 'http://localhost:9999/developer_application' \
--header 'Content-Type: application/json' \
--data-raw '{
    "apis": "facilities",
    "description": "testing developer-portal-backend 🥰",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "oAuthRedirectURI": "",
    "organization": "Example Organization",
    "oAuthApplicationType": "",
    "termsOfService": true
}' | jq '.'
