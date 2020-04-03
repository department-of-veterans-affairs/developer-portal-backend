CICD Workflow


## CICD scripts
- cicd/increment.sh
  - smart incrementer for version numbers
- tag_containers.py
  - tags container <commitId> in ECR with a <version> tag
- deploy_to_ecs.sh
  - deploys new containers to ECS/Fargate
- slackpost.sh
  - Handles slack notifications


## CI
- Codebuild CI job at /buildspec.yml runs on every code push to the repository
  - uses the pre-built environment from Codebuild
  - uses docker 18 runtime
  - prebuild (failure fails entire job)
    - installs AWS CLI
    - builds the CI Docker image (docker build --target base)
    - lints the code
    - runs the CI tests
    - copies the junit reporter results to the pwd (currently govcloud reports are not working)
  - build (failure does not fail job)
    - builds the Docker image (docker build --target prod)
    - tags the image with the current commit ID
  - post_build
    - pushes the Docker image to ECR

## Release/Deploy
- when PR is merged to master, it will trigger cicd/buildspec-release.yml in Codebuild for the project dev-portal-backend-release.
  - Uses a stock ubuntu 18.04 image
  - cicd/buildspec-release.yml install necessary components
    - awscli
    - jq
    - python3 / pip3
    - docker (needed for ECR login/tagging)
    - ecs-deploy (fabfuel/ecs-deploy)
    - hub (github/hub)
  - pre_build
    - logs into ECR
    - creates a new release in Github by naively incrementing the last digit of the version (configurable behavior in cicd/increment.sh)
    - tags the ECR image that matches the current git commit ID
    - uses cicd/tag_containers.py which will wait on a CI build if necessary
  - build
    - deploy script is triggered to lower environments for CD
    - cicd/deploy_to_ecs.sh 
      - configurable for allowed environments
