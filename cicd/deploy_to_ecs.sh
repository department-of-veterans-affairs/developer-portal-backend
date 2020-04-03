#!/usr/bin/env bash
set -euxo pipefail
# deploy container to ECS/Fargate
# args: $1 = ghVersion
#       $2 = name
#       $3 = environment
#       $4 = environment (optional)
#       $5... = environment (optional)

command -v ecs >/dev/null 2>&1 || { echo >&2 "I require ecs-deploy but it's not installed.  Aborting."; exit 1; }

# cluster name uses underscores instead of hyphens
TAG="${1}"
NAME="${2}"
NAME_UNDERSCORE="${2//-/_}"

if [ $# -le 2 ]; then
  echo "Not enough parameters"
fi

for (( e=3; e <= $#; e++))
do
  # In this loop, the environment is ${!e}
  ENV="${!e}"
  # service is dvp-[ENVIRONMENT]-[NAME]
  SERVICE="dvp-${ENV}-${NAME}"
  # cluster is [ENVIRONMENT]_[NAME_WITH_UNDERSCORES]_cluster
  CLUSTER="${ENV}_${NAME//-/_}_cluster"
  case "${ENV}" in
    dev|staging)
      echo "Deploying ${TAG} of ${NAME} to ${ENV}..."
      # Deploy to each environment and set env vars
      ecs deploy -t "${TAG}" -e "${SERVICE}" CHAMBER_ENV "${ENV}" -e "${SERVICE}" AWS_APP_NAME developer-portal-backend --timeout 1200 "${CLUSTER}" "${SERVICE}"
      ;;
    *)
      echo "Usage: deploy-to-ecs.sh ghVersion name environment [environment...]"
      echo "Environment must be dev or staging, or both"
      ;;
  esac
done

