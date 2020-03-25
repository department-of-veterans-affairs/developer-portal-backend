set -x

admin_api='http://kong:8001'

# create a service to proxy to the admin api
service_id=$(curl -s "$admin_api/services" \
  -d 'url=http://localhost:8001/consumers' \
  | jq -r '.id')

# create route associated with the previously created service
curl -s "$admin_api/services/$service_id/routes" \
  -F 'protocols=http' \
  -F 'paths[]=/api_management/consumers' \
  -F 'methods[]=POST' \
  -F 'methods[]=GET'

# add key-auth plugin
curl -s "$admin_api/plugins" \
  -F 'name=key-auth'

# create consumer for the developer portal backend to access the
# kong admin api
admin_consumer='devportalbackend'
curl -s "$admin_api/consumers" \
  -F "username=$admin_consumer"

# create a key for the new consumer
curl -s "$admin_api/consumers/$admin_consumer/key-auth" \
  -F "key=$KONG_KEY"

