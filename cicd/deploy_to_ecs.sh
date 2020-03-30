#!/usr/bin/env bash

# deploy container to ECS/Fargate
# args: ghVersion, name, environment

command -v /root/fargate >/dev/null 2>&1 || { echo >&2 "I require fargatecli but it's not installed.  Aborting."; exit 1; }

DOCKER_IMAGE=dvp/developer-portal-backend

if [ $# -le 2 ]; then
  echo "Not enough parameters"
fi

for (( e=3; e <= $#; e++))
do
  fargate service deploy ${!e}-"$2" --image $DOCKER_IMAGE:"$1"
done

