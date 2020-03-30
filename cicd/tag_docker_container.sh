#!/usr/bin/env bash

# tag a docker container with a version tag
# args: ghVersion, commitId

command -v aws >/dev/null 2>&1 || { echo >&2 "I require awscli but it's not installed.  Aborting."; exit 1; }
command -v jq >/dev/null 2>&1 || { echo >&2 "I require jq but it's not installed.  Aborting."; exit 1; }

REPOSITORY="dvp/developer-portal-backend"
JOBS="$(aws codebuild list-builds-for-project --project-name dev-portal-backend-ci|jq -r .ids[])"

while read -r status; do
  case $status in
    IN_PROGRESS)
      echo "Build for $2 still in progress..."
      sleep 5
      ;;
    SUCCEEDED)
      echo "Found successful build for $2. Tagging."
      if [[ "$(aws ecr describe-images --repository-name "$REPOSITORY" --image-ids imageTag="$2"|jq -r .imageDetails[].imageTags[])" == "$2" ]]; then
        MANIFEST="$(aws ecr batch-get-image --repository-name "$REPOSITORY" --image-ids imageTag="$2" --query 'images[].imageManifest' --output text)"
        aws ecr put-image --repository-name "$REPOSITORY" --image-tag "$1" --image-manifest "$MANIFEST"
      else
        echo "Failed to tag $REPOSITORY:$1"
        exit 1
      fi
      ;;
    *)
      echo "Build failed or was stopped. Exiting."
      exit 1
      ;;
  esac
done < <(aws codebuild batch-get-builds --ids $JOBS | jq -r --arg COMMIT_ID "$2" '.builds[] | select(.resolvedSourceVersion | contains($COMMIT_ID)) | .buildStatus')
