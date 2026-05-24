#!/bin/bash
git add .
git commit . -m "Fixed stuff"
git push
npm ci --legacy-peer-deps

# Build for production with full backend URL
docker buildx build \
  --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_API_BASE_URL=https://www.smartfleets.ai/api \
  --build-arg NEXT_PUBLIC_API_URL=https://www.smartfleets.ai/api \
  --build-arg NEXT_PUBLIC_AMPLITUDE_API_KEY=e4b7265974934afe3673c8491ec39af9 \
  -t hpooni/fleet-manager-app-frontend:latest \
  --push \
  .

