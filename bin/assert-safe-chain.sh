#!/bin/bash

# Check if npm is aliased to safe-chain
if ! type npm 2>/dev/null | grep -q safe-chain; then
  echo "ERROR: safe-chain is not properly configured as npm alias" >&2
  echo "Please ensure safe-chain is installed and npm is aliased to it" >&2
  exit 1
fi

echo "safe-chain is properly configured"
exit 0
