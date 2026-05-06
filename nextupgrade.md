# Next Upgrade Plan

## Goal
Make the infrastructure account-agnostic by removing hardcoded AWS account IDs, creating ECR repos in Terraform, and using their repository URLs in ECS task definitions. Update the rebuild script to derive account info dynamically.

## Why
The current setup hardcodes the AWS account ID in Terraform and the rebuild script. If AWS Academy issues a new lab account, deployments will fail because ECR URLs and role ARNs point to the old account.

## Plan Overview
1. Add AWS caller identity data source and locals in Terraform.
2. Create ECR repositories in Terraform and use their repository URLs.
3. Replace hardcoded role ARNs with a variable for the role name.
4. Update ECS task definitions to use the dynamic repo URLs.
5. Update the rebuild script to derive the AWS account ID dynamically.
6. Validate and apply changes.

## Terraform Changes

### 1) Add AWS caller identity and locals
Add a data source and locals for account ID and ECR registry:

```hcl
data "aws_caller_identity" "current" {}

locals {
  account_id   = data.aws_caller_identity.current.account_id
  ecr_registry = "${local.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com"
}
```

### 2) Add execution role name variable
Add a new variable for the role name, defaulting to LabRole:

```hcl
variable "execution_role_name" {
  type    = string
  default = "LabRole"
}
```

### 3) Create ECR repositories in Terraform
Add ECR repos for backend and frontend:

```hcl
resource "aws_ecr_repository" "backend" {
  name = "backend-repo"
}

resource "aws_ecr_repository" "frontend" {
  name = "frontend-repo"
}
```

Optional but recommended:
- Enable image scanning on push.
- Add lifecycle policies for old images.

### 4) Update ECS task definitions
Replace hardcoded image URLs and role ARN:

```hcl
execution_role_arn = "arn:aws:iam::${local.account_id}:role/${var.execution_role_name}"
```

Use repository URLs from Terraform:

```hcl
image = "${aws_ecr_repository.backend.repository_url}:latest"
```

And for frontend:

```hcl
image = "${aws_ecr_repository.frontend.repository_url}:latest"
```

### 5) Optional output additions
Expose ECR repo URLs as outputs (useful for scripts or CI):

```hcl
output "backend_repo_url" {
  value = aws_ecr_repository.backend.repository_url
}

output "frontend_repo_url" {
  value = aws_ecr_repository.frontend.repository_url
}
```

## Rebuild Script Updates

### 1) Derive account ID dynamically
Replace hardcoded account ID with a dynamic lookup:

```bash
AWS_ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text --region "$AWS_REGION")"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
```

### 2) Remove the fixed account ID check
Instead of failing on a mismatch, just use the account from AWS STS and continue.

### 3) Optionally read ECR repo URLs from Terraform outputs
If you add outputs for ECR repo URLs, the script can do:

```bash
BACKEND_REPO_URL="$(terraform -chdir="$TERRAFORM_DIR" output -raw backend_repo_url)"
FRONTEND_REPO_URL="$(terraform -chdir="$TERRAFORM_DIR" output -raw frontend_repo_url)"
```

Then build and push to those URLs directly.

## Migration Steps
1. Update Terraform code as described above.
2. Run `terraform init` and `terraform apply` to create ECR repos and update ECS task definitions.
3. Update the rebuild script to derive account ID dynamically.
4. Build and push images using the new repo URLs.
5. Force ECS redeploy and verify services are stable.

## Validation Checklist
- `aws sts get-caller-identity` returns the correct account.
- `terraform apply` succeeds without hardcoded account ID errors.
- ECR repos exist and match the expected names.
- ECS services deploy and pull the latest images.
- ALB endpoints are reachable after redeploy.

## Notes
- If the AWS Academy account changes, no code changes are required.
- If the IAM execution role name is different, set `execution_role_name` via terraform.tfvars or TF_VAR_execution_role_name.
