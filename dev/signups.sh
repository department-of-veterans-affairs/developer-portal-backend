USAGE=$(cat <<-END
USAGE:
This is a simple script to wrap "aws dynamodb scan" and "aws dynamodb query" for
querying the dev environment signup table. Requires an AWS MFA session.

./signups.sh scan [startDate] [endDate]
  Gets all signups between startDate and endDate.

./signups.sh query [email]
  Gets all signups for the user with the given email.
END
)

if [[ -z "$AWS_SECURITY_TOKEN" ]]; then
  echo "Must be run within an MFA session"
  exit 1
fi

if [[ $# -eq 0 ]]; then
  echo "$USAGE"
  exit 0
fi

if [[ "$1" != "scan" && "$1" != "query" ]]; then
  printf "Valid operations are \"scan\" and \"query\"\n\n"
  echo "$USAGE"
  exit 1
fi

operation=$1
if [[ "$operation" == "scan" && $# -ne 3 ]]; then
  printf "\"scan\" require 3 arguments\n\n"
  echo "$USAGE"
  exit 1
fi

if [[ "$operation" == "query" && $# -ne 2 ]]; then
  printf "\"query\" requires 2 arguments\n\n"
  echo "$USAGE"
  exit 1
fi

case $operation in
  scan)
    expression_values="{ \":startDate\": { \"S\": \"$2\" }, \":endDate\": { \"S\": \"$3\" }}"
    aws dynamodb scan --table-name dvp-dev-developer-portal-users \
      --projection-expression 'email, createdAt, apis' \
      --filter-expression 'createdAt BETWEEN :startDate AND :endDate' \
      --expression-attribute-values "$expression_values" \
      | jq -r '.Items[] | "\(.email.S), \(.createdAt.S), \(.apis.S)"'
    ;;
  query)
    expression_values="{ \":email\": { \"S\": \"$2\" }}"
    aws dynamodb query --table-name dvp-dev-developer-portal-users \
      --projection-expression 'email, createdAt, apis' \
      --key-condition-expression 'email = :email' \
      --expression-attribute-values "$expression_values" \
      | jq -r '.Items[] | "\(.email.S), \(.createdAt.S), \(.apis.S)"'
    ;;
esac