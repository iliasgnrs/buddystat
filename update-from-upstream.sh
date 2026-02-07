#!/bin/bash

# Update from Upstream Script
# This script merges changes from the original Rybbit repository

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}BuddyStat Upstream Update${NC}"
echo "========================="
echo ""

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}Error: Not in a git repository${NC}"
    exit 1
fi

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo -e "${RED}Error: You have uncommitted changes${NC}"
    echo "Please commit or stash your changes first:"
    git status -s
    exit 1
fi

echo -e "${BLUE}Current branch: $(git branch --show-current)${NC}"
echo ""

# Ensure we're on master
if [[ $(git branch --show-current) != "master" ]]; then
    read -p "Switch to master branch? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git checkout master
    else
        echo "Please switch to master branch first"
        exit 1
    fi
fi

echo -e "${YELLOW}Step 1: Fetching upstream changes...${NC}"
if ! git remote | grep -q "^upstream$"; then
    echo "Upstream remote not found. Adding it..."
    git remote add upstream https://github.com/rybbit-io/rybbit.git
fi

git fetch upstream
echo -e "${GREEN}✓ Fetched from upstream${NC}"
echo ""

# Show what would be merged
echo -e "${YELLOW}Step 2: Changes to be merged:${NC}"
echo ""
git log HEAD..upstream/master --oneline --decorate=short | head -20
echo ""

# Count commits
COMMIT_COUNT=$(git rev-list HEAD..upstream/master --count)
echo -e "${BLUE}Total commits to merge: $COMMIT_COUNT${NC}"
echo ""

if [ "$COMMIT_COUNT" = "0" ]; then
    echo -e "${GREEN}You're up to date with upstream!${NC}"
    exit 0
fi

# Confirm merge
read -p "Proceed with merge? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Update cancelled"
    exit 0
fi

# Create branch for merge
MERGE_BRANCH="merge-upstream-$(date +%Y%m%d-%H%M%S)"
echo ""
echo -e "${YELLOW}Step 3: Creating merge branch: ${MERGE_BRANCH}${NC}"
git checkout -b ${MERGE_BRANCH}
echo -e "${GREEN}✓ Created branch${NC}"
echo ""

echo -e "${YELLOW}Step 4: Merging upstream/master...${NC}"
if git merge upstream/master -m "Merge upstream changes from $(date +%Y-%m-%d)"; then
    echo -e "${GREEN}✓ Merge successful!${NC}"
    echo ""
    
    echo -e "${YELLOW}Step 5: Testing the merge...${NC}"
    echo "Please review the changes and test your application:"
    echo ""
    echo -e "${BLUE}Commands:${NC}"
    echo "  # Review changes"
    echo "  git diff master"
    echo ""
    echo "  # Test locally"
    echo "  docker-compose up --build"
    echo ""
    echo "  # If everything works, merge to master:"
    echo "  git checkout master"
    echo "  git merge ${MERGE_BRANCH}"
    echo "  git push origin master"
    echo ""
    echo "  # If there are issues, abort:"
    echo "  git checkout master"
    echo "  git branch -D ${MERGE_BRANCH}"
    
else
    echo -e "${RED}Merge conflicts detected!${NC}"
    echo ""
    echo "Please resolve conflicts manually:"
    echo "  1. Edit conflicted files (git will mark them)"
    echo "  2. Stage resolved files: git add <file>"
    echo "  3. Complete merge: git commit"
    echo ""
    echo "Files with conflicts:"
    git diff --name-only --diff-filter=U
    echo ""
    echo -e "${YELLOW}Tips for resolving conflicts:${NC}"
    echo "  - For .env files: keep your version"
    echo "  - For branding/theme: keep your customizations"
    echo "  - For core features: carefully merge both versions"
    echo ""
    echo "After resolving, run:"
    echo "  git checkout master"
    echo "  git merge ${MERGE_BRANCH}"
    echo "  git push origin master"
    exit 1
fi
