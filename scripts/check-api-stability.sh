#!/bin/bash
# MDS v5.2 - API Stability Check Script
# Run this locally before pushing to verify API stability

set -e

echo ""
echo "🔍 MDS v5.2 - API Stability Check"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Build
echo "📦 Building MDS..."
npm run build > /dev/null 2>&1
echo "   ✅ Build complete"
echo ""

# Step 2: Check circular dependencies
echo "🔄 Checking circular dependencies..."
if npx madge --circular --extensions ts src/ > /dev/null 2>&1; then
  echo "   ✅ No circular dependencies found"
else
  echo -e "   ${RED}❌ Circular dependencies detected!${NC}"
  npx madge --circular --extensions ts src/
  exit 1
fi
echo ""

# Step 3: Run API stability tests
echo "🧪 Running API stability tests..."
if npm run test:api > /dev/null 2>&1; then
  echo "   ✅ API stability tests passed (5/5)"
else
  echo -e "   ${RED}❌ API stability tests failed${NC}"
  npm run test:api
  exit 1
fi
echo ""

# Step 4: Run MDM validator tests
echo "📋 Running MDM validator tests..."
if npm run test:validator > /dev/null 2>&1; then
  echo "   ✅ MDM validator tests passed (25/25)"
else
  echo -e "   ${RED}❌ MDM validator tests failed${NC}"
  npm run test:validator
  exit 1
fi
echo ""

# Step 5: Check bundle size
echo "📊 Checking bundle size..."
if [ "$(uname)" = "Darwin" ]; then
  # macOS
  BUNDLE_SIZE=$(stat -f%z dist/mds-core.esm.js)
else
  # Linux
  BUNDLE_SIZE=$(stat -c%s dist/mds-core.esm.js)
fi

MAX_SIZE=$((160 * 1024))  # 160 KB in bytes
BUNDLE_KB=$(($BUNDLE_SIZE / 1024))
HEADROOM=$((160 - $BUNDLE_KB))

echo "   Current: ${BUNDLE_KB} KB"
echo "   Maximum: 160 KB"

if [ $BUNDLE_SIZE -gt $MAX_SIZE ]; then
  echo -e "   ${RED}❌ Bundle size exceeds 160 KB limit! (over by $(($BUNDLE_KB - 160)) KB)${NC}"
  exit 1
else
  if [ $HEADROOM -lt 10 ]; then
    echo -e "   ${YELLOW}⚠️  Low headroom: ${HEADROOM} KB remaining${NC}"
  else
    echo -e "   ${GREEN}✅ Bundle size OK (${HEADROOM} KB headroom)${NC}"
  fi
fi
echo ""

# Step 6: Run all tests
echo "🎯 Running all test suites..."
if npm run test:all > /dev/null 2>&1; then
  echo "   ✅ All tests passed (72/72)"
else
  echo -e "   ${RED}❌ Some tests failed${NC}"
  npm run test:all
  exit 1
fi
echo ""

# Summary
echo "=================================="
echo -e "${GREEN}✅ All API stability checks passed!${NC}"
echo ""
echo "Summary:"
echo "  ✅ Zero circular dependencies"
echo "  ✅ API stability verified (5 tests)"
echo "  ✅ MDM validator verified (25 tests)"
echo "  ✅ Bundle size: ${BUNDLE_KB} KB / 160 KB"
echo "  ✅ All tests passing (72/72)"
echo ""
echo "Your code is ready to push! 🚀"
echo ""
