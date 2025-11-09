#!/bin/bash

# Tide Table Vue - Deployment Script using rsync
# This script syncs the dist folder to your production server

set -e

# Configuration
REMOTE_USER="${REMOTE_USER:-root}"
REMOTE_HOST="${REMOTE_HOST:-your-server.com}"
REMOTE_PATH="${REMOTE_PATH:-/var/www/tidetable}"
LOCAL_PATH="./dist"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if dist folder exists
if [ ! -d "$LOCAL_PATH" ]; then
    print_error "dist folder not found. Please run 'npm run build' first."
    exit 1
fi

# Check if rsync is installed
if ! command -v rsync &> /dev/null; then
    print_error "rsync is not installed. Please install it first."
    exit 1
fi

# Validate configuration
if [ "$REMOTE_HOST" = "your-server.com" ]; then
    print_error "Please set REMOTE_HOST environment variable or edit this script"
    echo "Usage: REMOTE_HOST=your-server.com REMOTE_USER=root REMOTE_PATH=/var/www/tidetable ./deploy.sh"
    exit 1
fi

print_status "Starting deployment..."
print_status "Source: $LOCAL_PATH"
print_status "Destination: $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH"

# Confirm before proceeding
read -p "Continue with deployment? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Deployment cancelled."
    exit 0
fi

# Run rsync with optimized options
# -a: archive mode (preserves permissions, timestamps, etc.)
# -v: verbose
# -z: compress during transfer
# --delete: delete files on remote that don't exist locally
# --exclude: exclude node_modules and other unnecessary files
# --progress: show progress
# --stats: show transfer statistics

print_status "Syncing files..."

rsync -avz \
    --delete \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='.env' \
    --exclude='*.map' \
    --progress \
    --stats \
    "$LOCAL_PATH/" \
    "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/"

if [ $? -eq 0 ]; then
    print_status "Deployment completed successfully!"
    print_status "Files synced to: $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH"
else
    print_error "Deployment failed!"
    exit 1
fi

