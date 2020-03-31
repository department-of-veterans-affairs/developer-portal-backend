#!/usr/bin/env bash

# deploy container to ECS/Fargate
# args: $1 = ghVersion
#       $2 = name
#       $3 = environment
#       $4 = environment (optional)
#       $5... = environment (optional)

command -v ecs >/dev/null 2>&1 || { echo >&2 "I require ecs-deploy but it's not installed.  Aborting."; exit 1; }

# cluster name uses underscores instead of hyphens
NAME_UNDERSCORE="${2//-/_}"

if [ $# -le 2 ]; then
  echo "Not enough parameters"
fi

for (( e=3; e <= $#; e++))
do
  case "${!e}" in
    dev|staging)
      echo "Deploying $1 of $2 to ${!e}..."
      ecs deploy ${!e}_"${NAME_UNDERSCORE}"_cluster "dvp-"${!e}-"$2" --tag "$1" --timeout 1200
      ;;
    *)
      echo "Usage: deploy-to-ecs.sh ghVersion name environment [environment...]"
      echo "Environment must be dev or staging, or both"
      ;;
  esac
done

