set -x

admin_api='http://kong:8001'

# create a service to proxy to the admin api
service_id=$(curl -s "$admin_api/services" \
  -d 'url=http://localhost:8001/consumers' \
  | jq -r '.id')

if [ -z "$service_id" ]
then
      echo "\$service_id not retrieved. exiting."
      exit 1
else
      echo "\$service_id retrieved successfully. continuing."
fi

# create route associated with the previously created service
curl -s "$admin_api/services/$service_id/routes" \
  -d 'protocols=http' \
  -d 'paths[]=/internal/admin/consumers' \
  -d 'methods[]=POST' \
  -d 'methods[]=GET'

# add key-auth plugin
curl -s "$admin_api/plugins" \
  -d 'name=key-auth'

# create consumer for the developer portal backend to access the
# kong admin api
admin_consumer='_internal_DeveloperPortal'
curl -s "$admin_api/consumers" \
  -d "username=$admin_consumer"

# create a key for the new consumer
curl -s "$admin_api/consumers/$admin_consumer/key-auth" \
  -d "key=$KONG_KEY"

