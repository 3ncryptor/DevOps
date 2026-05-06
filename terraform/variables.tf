variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "project_name" {
  type    = string
  default = "zentra"
}

variable "backend_port" {
  type    = number
  default = 8000
}

variable "frontend_port" {
  type    = number
  default = 3000
}

variable "s3_bucket_name" {
  type = string
}

variable "mongodb_uri" {
  type      = string
  sensitive = true
}

variable "access_token_secret" {
  type      = string
  sensitive = true
}

variable "refresh_token_secret" {
  type      = string
  sensitive = true
}
