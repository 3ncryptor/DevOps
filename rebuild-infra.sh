#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="${ROOT_DIR}/terraform"

AWS_REGION="${TF_VAR_aws_region:-us-east-1}"
AWS_ACCOUNT_ID_EXPECTED="631568866196"
ECR_REGISTRY="${AWS_ACCOUNT_ID_EXPECTED}.dkr.ecr.${AWS_REGION}.amazonaws.com"

BACKEND_REPO="backend-repo"
FRONTEND_REPO="frontend-repo"

ECS_CLUSTER="zentra-cluster"
BACKEND_SERVICE="zentra-backend-service"
FRONTEND_SERVICE="zentra-frontend-service"

TFVARS_FILE="${TERRAFORM_DIR}/terraform.tfvars"
AUTO_CONFIRM=false

log()  { echo "[rebuild] $*"; }
die()  { echo "[rebuild] ERROR: $*" >&2; exit 1; }

usage() {
  cat <<EOF
Usage: $0 [--yes]

--yes   Skip the destroy confirmation prompt.
EOF
}

check_deps() {
  for cmd in aws docker terraform; do
    command -v "$cmd" >/dev/null 2>&1 || die "$cmd is not installed or not in PATH"
  done
  docker info >/dev/null 2>&1 || die "Docker daemon is not running"
  aws sts get-caller-identity --region "$AWS_REGION" >/dev/null 2>&1 || \
    die "AWS credentials are not configured or have expired"
}

check_account() {
  local account_id
  account_id="$(aws sts get-caller-identity --query Account --output text --region "$AWS_REGION")"
  if [[ "$account_id" != "$AWS_ACCOUNT_ID_EXPECTED" ]]; then
    die "AWS account mismatch. Terraform hardcodes ${AWS_ACCOUNT_ID_EXPECTED}, but you are using ${account_id}."
  fi
}

check_tf_vars() {
  if [[ -f "$TFVARS_FILE" ]]; then
    log "Using ${TFVARS_FILE} for Terraform variables."
    return
  fi

  : "${TF_VAR_s3_bucket_name:?TF_VAR_s3_bucket_name is required when terraform.tfvars is missing}"
  : "${TF_VAR_mongodb_uri:?TF_VAR_mongodb_uri is required when terraform.tfvars is missing}"
  : "${TF_VAR_access_token_secret:?TF_VAR_access_token_secret is required when terraform.tfvars is missing}"
  : "${TF_VAR_refresh_token_secret:?TF_VAR_refresh_token_secret is required when terraform.tfvars is missing}"
}

confirm_destroy() {
  if [[ "$AUTO_CONFIRM" == true ]]; then
    return
  fi

  echo "This will DESTROY all Terraform-managed resources and recreate them."
  read -r -p "Type 'yes' to continue: " reply
  if [[ "$reply" != "yes" ]]; then
    die "Aborted."
  fi
}

terraform_init() {
  log "Running terraform init..."
  terraform -chdir="$TERRAFORM_DIR" init -upgrade
}

terraform_destroy() {
  log "Destroying Terraform-managed resources..."
  terraform -chdir="$TERRAFORM_DIR" destroy -auto-approve
}

terraform_apply() {
  log "Applying Terraform configuration..."
  terraform -chdir="$TERRAFORM_DIR" apply -auto-approve
}

get_outputs() {
  BACKEND_URL="$(terraform -chdir="$TERRAFORM_DIR" output -raw backend_url)"
  FRONTEND_URL="$(terraform -chdir="$TERRAFORM_DIR" output -raw frontend_url)"
  NEXT_PUBLIC_API_URL="${BACKEND_URL}/api/v1"
}

ecr_login() {
  log "Logging in to ECR..."
  aws ecr get-login-password --region "$AWS_REGION" \
    | docker login --username AWS --password-stdin "$ECR_REGISTRY"
}

ensure_ecr_repo() {
  local repo=$1
  if aws ecr describe-repositories --repository-names "$repo" --region "$AWS_REGION" >/dev/null 2>&1; then
    return
  fi

  log "Creating ECR repository: ${repo}"
  aws ecr create-repository --repository-name "$repo" --region "$AWS_REGION" >/dev/null
}

build_and_push() {
  log "Building backend image..."
  docker build --platform linux/amd64 -t "${ECR_REGISTRY}/${BACKEND_REPO}:latest" "${ROOT_DIR}/Backend"
  log "Pushing backend image..."
  docker push "${ECR_REGISTRY}/${BACKEND_REPO}:latest"

  log "Building frontend image with NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}..."
  docker build --platform linux/amd64 \
    --build-arg NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" \
    -t "${ECR_REGISTRY}/${FRONTEND_REPO}:latest" "${ROOT_DIR}/Frontend"
  log "Pushing frontend image..."
  docker push "${ECR_REGISTRY}/${FRONTEND_REPO}:latest"
}

redeploy_ecs() {
  log "Forcing ECS redeploys..."
  aws ecs update-service --cluster "$ECS_CLUSTER" --service "$BACKEND_SERVICE" \
    --force-new-deployment --region "$AWS_REGION" >/dev/null
  aws ecs update-service --cluster "$ECS_CLUSTER" --service "$FRONTEND_SERVICE" \
    --force-new-deployment --region "$AWS_REGION" >/dev/null

  log "Waiting for services to stabilize..."
  aws ecs wait services-stable --cluster "$ECS_CLUSTER" \
    --services "$BACKEND_SERVICE" "$FRONTEND_SERVICE" --region "$AWS_REGION"
}

main() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --yes) AUTO_CONFIRM=true; shift ;;
      -h|--help) usage; exit 0 ;;
      *) die "Unknown argument: $1" ;;
    esac
  done

  check_deps
  check_account
  check_tf_vars
  confirm_destroy

  terraform_init
  terraform_destroy
  terraform_apply

  get_outputs

  ecr_login
  ensure_ecr_repo "$BACKEND_REPO"
  ensure_ecr_repo "$FRONTEND_REPO"

  build_and_push
  redeploy_ecs

  log "Done."
  echo "Backend URL:  ${BACKEND_URL}"
  echo "Frontend URL: ${FRONTEND_URL}"
}

main "$@"
