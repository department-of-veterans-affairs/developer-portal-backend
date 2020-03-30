#!/usr/bin/env bash

# tag a docker container with a version tag
# args: ghVersion, commitId

command -v aws >/dev/null 2>&1 || { echo >&2 "I require awscli but it's not installed.  Aborting."; exit 1; }
command -v jq >/dev/null 2>&1 || { echo >&2 "I require jq but it's not installed.  Aborting."; exit 1; }

REPOSITORY="dvp/developer-portal-backend"

if [[ "$(aws ecr describe-images --repository-name "$REPOSITORY" --image-ids imageTag="$2"|jq -r .imageDetails[].imageTags[])" == "$2" ]]; then
  echo "Matched."
  MANIFEST="$(aws ecr batch-get-image --repository-name "$REPOSITORY" --image-ids imageTag="$2" --query 'images[].imageManifest' --output text)"
  aws ecr put-image --repository-name "$REPOSITORY" --image-tag "$1" --image-manifest "$MANIFEST"
else
  echo "Not matched."
fi
