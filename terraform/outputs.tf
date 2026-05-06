output "backend_url" {
  value       = "http://${aws_lb.backend.dns_name}"
  description = "Stable backend API URL — use this for NEXT_PUBLIC_API_URL"
}

output "frontend_url" {
  value       = "http://${aws_lb.frontend.dns_name}"
  description = "Stable frontend URL"
}
