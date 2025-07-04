#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored message
print_message() {
    color=$1
    message=$2
    echo -e "${color}${message}${NC}"
}

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    print_message $RED "Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check Python version
python_version=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
if (( $(echo "$python_version < 3.8" | bc -l) )); then
    print_message $RED "Python version must be 3.8 or higher. Current version: $python_version"
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    print_message $BLUE "Creating Python virtual environment..."
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        print_message $RED "Failed to create virtual environment."
        exit 1
    fi
    print_message $GREEN "Virtual environment created successfully."
else
    print_message $BLUE "Virtual environment already exists."
fi

# Activate virtual environment
print_message $BLUE "Activating virtual environment..."
source venv/bin/activate
if [ $? -ne 0 ]; then
    print_message $RED "Failed to activate virtual environment."
    exit 1
fi

# Upgrade pip
print_message $BLUE "Upgrading pip..."
python -m pip install --upgrade pip
if [ $? -ne 0 ]; then
    print_message $RED "Failed to upgrade pip."
    exit 1
fi

# Install dependencies
print_message $BLUE "Installing Python dependencies..."
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    print_message $RED "Failed to install dependencies."
    exit 1
fi

# Setup T5 model
print_message $BLUE "Setting up T5 model..."
python src/scripts/setup_t5.py --model_dir models/t5 --model_size t5-base
if [ $? -ne 0 ]; then
    print_message $RED "Failed to setup T5 model."
    exit 1
fi

print_message $GREEN "\nPython environment setup completed successfully!"
print_message $BLUE "\nTo activate the virtual environment in the future, run:"
echo "source venv/bin/activate"

# Create a batch file for Windows users
cat > activate_env.bat << EOL
@echo off
call venv\Scripts\activate.bat
EOL

print_message $BLUE "\nFor Windows users, run:"
echo "activate_env.bat"

print_message $GREEN "\nYou can now start developing!"