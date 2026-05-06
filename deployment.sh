#!/usr/bin/env bash
set -euo pipefail

# ─── Config ───────────────────────────────────────────────────────────────────
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="631568866196"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

BACKEND_REPO="backend-repo"
FRONTEND_REPO="frontend-repo"

ECS_CLUSTER="zentra-cluster"
BACKEND_SERVICE="zentra-backend-service"
FRONTEND_SERVICE="zentra-frontend-service"

BACKEND_ALB="http://zentra-backend-alb-1307862723.us-east-1.elb.amazonaws.com"
NEXT_PUBLIC_API_URL="${BACKEND_ALB}/api/v1"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ─── Colours ──────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[0;33m'; RED='\033[0;31m'; NC='\033[0m'
info()    { echo -e "${YELLOW}[deploy] $*${NC}"; }
success() { echo -e "${GREEN}[deploy] $*${NC}"; }
error()   { echo -e "${RED}[deploy] $*${NC}" >&2; exit 1; }

# ─── Preflight checks ─────────────────────────────────────────────────────────
check_deps() {
  for cmd in docker aws; do
    command -v "$cmd" &>/dev/null || error "$cmd is not installed or not in PATH"
  done
  docker info &>/dev/null || error "Docker daemon is not running"
  aws sts get-caller-identity --region "$AWS_REGION" &>/dev/null || \
    error "AWS credentials are not configured or have expired"
}

# ─── Parse flags ──────────────────────────────────────────────────────────────
DEPLOY_BACKEND=true
DEPLOY_FRONTEND=true

while [[ $# -gt 0 ]]; do
  case $1 in
    --backend-only)  DEPLOY_FRONTEND=false; shift ;;
    --frontend-only) DEPLOY_BACKEND=false;  shift ;;
    *) error "Unknown flag: $1. Usage: $0 [--backend-only|--frontend-only]" ;;
  esac
done

# ─── ECR login ────────────────────────────────────────────────────────────────
ecr_login() {
  info "Logging in to ECR..."
  aws ecr get-login-password --region "$AWS_REGION" \
    | docker login --username AWS --password-stdin "$ECR_REGISTRY"
  success "ECR login successful"
}

# ─── Build + push backend ─────────────────────────────────────────────────────
deploy_backend() {
  info "Building backend image (linux/amd64)..."
  docker build \
    --platform linux/amd64 \
    -t "${ECR_REGISTRY}/${BACKEND_REPO}:latest" \
    "${ROOT_DIR}/Backend"
  success "Backend image built"

  info "Pushing backend image to ECR..."
  docker push "${ECR_REGISTRY}/${BACKEND_REPO}:latest"
  success "Backend image pushed"

  info "Forcing ECS redeploy for backend..."
  aws ecs update-service \
    --cluster "$ECS_CLUSTER" \
    --service "$BACKEND_SERVICE" \
    --force-new-deployment \
    --region "$AWS_REGION" \
    --output text \
    --query 'service.deployments[0].status' | xargs -I{} echo "  deployment status: {}"
  success "Backend redeploy triggered"
}

# ─── Build + push frontend ────────────────────────────────────────────────────
deploy_frontend() {
  info "Building frontend image (linux/amd64) with NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}..."
  docker build \
    --platform linux/amd64 \
    --build-arg NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" \
    -t "${ECR_REGISTRY}/${FRONTEND_REPO}:latest" \
    "${ROOT_DIR}/Frontend"
  success "Frontend image built"

  info "Pushing frontend image to ECR..."
  docker push "${ECR_REGISTRY}/${FRONTEND_REPO}:latest"
  success "Frontend image pushed"

  info "Forcing ECS redeploy for frontend..."
  aws ecs update-service \
    --cluster "$ECS_CLUSTER" \
    --service "$FRONTEND_SERVICE" \
    --force-new-deployment \
    --region "$AWS_REGION" \
    --output text \
    --query 'service.deployments[0].status' | xargs -I{} echo "  deployment status: {}"
  success "Frontend redeploy triggered"
}

# ─── Wait for services to stabilise ──────────────────────────────────────────
wait_for_stable() {
  local service=$1
  info "Waiting for ${service} to reach steady state (timeout: 5m)..."
  aws ecs wait services-stable \
    --cluster "$ECS_CLUSTER" \
    --services "$service" \
    --region "$AWS_REGION" && success "${service} is stable" \
    || echo -e "${YELLOW}[deploy] Warning: ${service} did not stabilise within timeout — check ECS console${NC}"
}

# ─── Main ─────────────────────────────────────────────────────────────────────
main() {
  info "Starting deployment..."
  check_deps
  ecr_login

  $DEPLOY_BACKEND  && deploy_backend
  $DEPLOY_FRONTEND && deploy_frontend

  $DEPLOY_BACKEND  && wait_for_stable "$BACKEND_SERVICE"
  $DEPLOY_FRONTEND && wait_for_stable "$FRONTEND_SERVICE"

  success "Deployment complete!"
  echo ""
  echo "  Frontend: http://zentra-frontend-alb-1363306630.us-east-1.elb.amazonaws.com"
  echo "  Backend:  ${BACKEND_ALB}"
}

main
