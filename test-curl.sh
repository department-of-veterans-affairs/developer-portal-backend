curl --location --request POST 'http://localhost:9999/developer_application' \
--header 'Content-Type: application/json' \
--data-raw '{
    "apis": "facilities",
    "description": "",
    "email": "kalil@adhocteam.us",
    "firstName": "Kalil",
    "lastName": "Smith-Nuevelle",
    "oAuthRedirectURI": "",
    "organization": "Ad Hoc",
    "termsOfService": true
}' | jq '.'
