#!/bin/bash
# Install dependencies
npm install

# Print directory structure for debugging
echo "Directory structure:"
ls -la

# Print models directory structure
echo "Models directory:"
ls -la models/

# Print environment variables (without values for security)
echo "Environment variables set:"
env | grep -v "KEY\|URI\|SECRET" | cut -d= -f1

# Ready to start
echo "Build completed successfully"
