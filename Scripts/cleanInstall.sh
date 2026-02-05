#!/bin/bash

################################################################################
# Script Name:    clean-install.sh
# Description:    Idempotent script to clean and reinstall npm dependencies
# Version:        1.0.0
# Usage:          ./clean-install.sh
################################################################################

set -euo pipefail  # Exit on error, undefined variables, and pipe failures

# Exit Codes
readonly EXIT_SUCCESS=0
readonly EXIT_PACKAGE_JSON_NOT_FOUND=1
readonly EXIT_NPM_NOT_FOUND=2
readonly EXIT_CLEANUP_FAILED=3
readonly EXIT_INSTALL_FAILED=4
readonly EXIT_INTERRUPTED=130

# Color codes for output
readonly COLOR_RESET='\033[0m'
readonly COLOR_INFO='\033[0;36m'
readonly COLOR_SUCCESS='\033[0;32m'
readonly COLOR_WARNING='\033[0;33m'
readonly COLOR_ERROR='\033[0;31m'

################################################################################
# Utility Functions
################################################################################

# Log message with timestamp
log_info() {
    echo -e "${COLOR_INFO}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $*${COLOR_RESET}"
}

log_success() {
    echo -e "${COLOR_SUCCESS}[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS: $*${COLOR_RESET}"
}

log_warning() {
    echo -e "${COLOR_WARNING}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $*${COLOR_RESET}"
}

log_error() {
    echo -e "${COLOR_ERROR}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $*${COLOR_RESET}" >&2
}

# Cleanup handler for interruptions
cleanup_on_interrupt() {
    log_warning "Script interrupted by user"
    exit ${EXIT_INTERRUPTED}
}

################################################################################
# Validation Functions
################################################################################

# Check if package.json exists in current directory
validate_package_json() {
    if [ ! -f "package.json" ]; then
        log_error "package.json not found in current directory"
        log_error "Please run this script from a Node.js project root"
        exit ${EXIT_PACKAGE_JSON_NOT_FOUND}
    fi
    log_info "package.json found"
}

# Check if npm is installed
validate_npm() {
    if ! command -v npm &> /dev/null; then
        log_error "npm command not found"
        log_error "Please install Node.js and npm before running this script"
        exit ${EXIT_NPM_NOT_FOUND}
    fi
    log_info "npm found: $(npm --version)"
}

################################################################################
# Core Functions
################################################################################

# Remove node_modules directory
remove_node_modules() {
    if [ -d "node_modules" ]; then
        log_info "Removing node_modules directory..."
        if rm -rf node_modules; then
            log_success "node_modules directory removed"
        else
            log_error "Failed to remove node_modules directory"
            exit ${EXIT_CLEANUP_FAILED}
        fi
    else
        log_warning "node_modules directory not found, skipping removal"
    fi
}

# Remove package-lock.json file
remove_package_lock() {
    if [ -f "package-lock.json" ]; then
        log_info "Removing package-lock.json..."
        if rm -f package-lock.json; then
            log_success "package-lock.json removed"
        else
            log_error "Failed to remove package-lock.json"
            exit ${EXIT_CLEANUP_FAILED}
        fi
    else
        log_warning "package-lock.json not found, skipping removal"
    fi
}

# Install npm dependencies
install_dependencies() {
    log_info "Installing npm dependencies..."
    if npm install; then
        log_success "Dependencies installed successfully"
    else
        log_error "Failed to install dependencies"
        exit ${EXIT_INSTALL_FAILED}
    fi
}

################################################################################
# Main Function
################################################################################

main() {
    log_info "Starting clean installation process..."
    echo ""
    
    # Run validations
    validate_package_json
    validate_npm
    echo ""
    
    # Perform cleanup
    remove_node_modules
    remove_package_lock
    echo ""
    
    # Install dependencies
    install_dependencies
    echo ""
    
    log_success "Clean installation completed successfully!"
    exit ${EXIT_SUCCESS}
}

################################################################################
# Script Execution
################################################################################

# Set up interrupt handler
trap cleanup_on_interrupt SIGINT SIGTERM

# Execute main function
main "$@"
