#!/bin/bash

# Ralph: Autonomous AI Agent Loop
# Repeatedly runs Claude Code until all product requirements are complete
# Each iteration operates with fresh context, preserving memory through:
# - Git history (commits from previous iterations)
# - progress.txt (learnings and context)
# - prd.json (which stories are done)

set -euo pipefail

# Configuration
MAX_ITERATIONS=10
TOOL="claude"  # Default to Claude Code
PRD_FILE="scripts/ralph/prd.json"
PROGRESS_FILE="scripts/ralph/progress.txt"
CLAUDE_PROMPT="scripts/ralph/CLAUDE.md"
BRANCH_TRACKER="scripts/ralph/.last-branch"
ARCHIVE_DIR="scripts/ralph/archive"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --tool)
      TOOL="$2"
      shift 2
      ;;
    --max-iterations)
      MAX_ITERATIONS="$2"
      shift 2
      ;;
    *)
      if [[ "$1" =~ ^[0-9]+$ ]]; then
        MAX_ITERATIONS="$1"
      fi
      shift
      ;;
  esac
done

# Validate tool
if [[ "$TOOL" != "claude" && "$TOOL" != "amp" ]]; then
  echo -e "${RED}Error: Tool must be 'claude' or 'amp'${NC}"
  exit 1
fi

# Check required files
if [[ ! -f "$PRD_FILE" ]]; then
  echo -e "${RED}Error: $PRD_FILE not found${NC}"
  echo "Run the PRD generation skill first to create your requirements."
  exit 1
fi

# Check for required tools
if ! command -v jq &> /dev/null; then
  echo -e "${RED}Error: jq is not installed${NC}"
  echo "Install with: sudo apt-get install jq  # or brew install jq"
  exit 1
fi

# Extract current branch from PRD
CURRENT_BRANCH=$(jq -r '.branch // "main"' "$PRD_FILE")

# Handle branch changes (archive previous run)
if [[ -f "$BRANCH_TRACKER" ]]; then
  LAST_BRANCH=$(cat "$BRANCH_TRACKER")
  if [[ "$CURRENT_BRANCH" != "$LAST_BRANCH" ]]; then
    echo -e "${YELLOW}Branch changed from $LAST_BRANCH to $CURRENT_BRANCH${NC}"
    echo "Archiving previous run..."

    # Create archive directory with timestamp
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    ARCHIVE_SUBDIR="$ARCHIVE_DIR/${LAST_BRANCH}_${TIMESTAMP}"
    mkdir -p "$ARCHIVE_SUBDIR"

    # Archive old files
    [[ -f "$PROGRESS_FILE" ]] && cp "$PROGRESS_FILE" "$ARCHIVE_SUBDIR/"
    [[ -f "$PRD_FILE" ]] && cp "$PRD_FILE" "$ARCHIVE_SUBDIR/"

    # Reset progress log for new branch
    > "$PROGRESS_FILE"

    echo -e "${GREEN}Archived to $ARCHIVE_SUBDIR${NC}"
  fi
fi

# Save current branch
echo "$CURRENT_BRANCH" > "$BRANCH_TRACKER"

# Initialize progress file if it doesn't exist
if [[ ! -f "$PROGRESS_FILE" ]]; then
  echo "# Ralph Progress Log" > "$PROGRESS_FILE"
  echo "Started: $(date -Iseconds)" >> "$PROGRESS_FILE"
  echo "" >> "$PROGRESS_FILE"
fi

# Count incomplete stories
INCOMPLETE_COUNT=$(jq '[.stories[] | select(.passes == false)] | length' "$PRD_FILE")
TOTAL_COUNT=$(jq '.stories | length' "$PRD_FILE")

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Ralph Agent Loop v1.0          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "Tool:              ${GREEN}$TOOL${NC}"
echo -e "Max Iterations:    ${GREEN}$MAX_ITERATIONS${NC}"
echo -e "Branch:            ${GREEN}$CURRENT_BRANCH${NC}"
echo -e "Stories:           ${YELLOW}$INCOMPLETE_COUNT${NC} incomplete / ${GREEN}$TOTAL_COUNT${NC} total"
echo -e "PRD File:          $PRD_FILE"
echo -e "Progress Log:      $PROGRESS_FILE"
echo ""

# Check if all stories are complete
if [[ "$INCOMPLETE_COUNT" -eq 0 ]]; then
  echo -e "${GREEN}✓ All stories complete!${NC}"
  exit 0
fi

# Main iteration loop
for ((i=1; i<=MAX_ITERATIONS; i++)); do
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}Iteration $i of $MAX_ITERATIONS${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  # Log iteration start
  echo "## Iteration $i - $(date -Iseconds)" >> "$PROGRESS_FILE"

  # Run Claude Code or Amp with permissions
  if [[ "$TOOL" == "claude" ]]; then
    echo -e "${YELLOW}Running Claude Code...${NC}"

    # Run Claude with the CLAUDE.md prompt
    # The prompt will read prd.json and progress.txt
    PROMPT_CONTENT=$(cat "$CLAUDE_PROMPT")
    OUTPUT=$(claude --print "$PROMPT_CONTENT" 2>&1 || true)
  else
    echo -e "${YELLOW}Running Amp CLI...${NC}"
    PROMPT_CONTENT=$(cat "scripts/ralph/prompt.md")
    OUTPUT=$(amp --print "$PROMPT_CONTENT" 2>&1 || true)
  fi

  echo "$OUTPUT"

  # Check for completion signal
  if echo "$OUTPUT" | grep -q "<promise>COMPLETE</promise>"; then
    echo -e "${GREEN}✓ Ralph signaled completion!${NC}"
    echo ""
    echo "Iteration $i: Agent signaled COMPLETE" >> "$PROGRESS_FILE"

    # Final status check
    INCOMPLETE_COUNT=$(jq '[.stories[] | select(.passes == false)] | length' "$PRD_FILE")

    if [[ "$INCOMPLETE_COUNT" -eq 0 ]]; then
      echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
      echo -e "${GREEN}║     All Stories Successfully Complete  ║${NC}"
      echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
      exit 0
    else
      echo -e "${YELLOW}Warning: Agent signaled complete but $INCOMPLETE_COUNT stories remain${NC}"
      echo "Continuing to next iteration..."
    fi
  fi

  # Update progress with summary
  echo "Status: $INCOMPLETE_COUNT incomplete stories remaining" >> "$PROGRESS_FILE"
  echo "" >> "$PROGRESS_FILE"

  # Small delay between iterations
  if [[ $i -lt $MAX_ITERATIONS ]]; then
    sleep 2
  fi
done

# Max iterations reached without completion
echo ""
echo -e "${RED}╔════════════════════════════════════════╗${NC}"
echo -e "${RED}║   Maximum Iterations Reached           ║${NC}"
echo -e "${RED}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Ralph completed $MAX_ITERATIONS iterations without finishing all stories.${NC}"
echo ""

INCOMPLETE_COUNT=$(jq '[.stories[] | select(.passes == false)] | length' "$PRD_FILE")
echo -e "Remaining stories: ${YELLOW}$INCOMPLETE_COUNT${NC}"
echo ""
echo "Next steps:"
echo "  1. Review progress.txt for learnings and blockers"
echo "  2. Check prd.json to see which stories are incomplete"
echo "  3. Consider running more iterations: ./scripts/ralph/ralph.sh --max-iterations 20"
echo "  4. Or manually complete remaining stories and update prd.json"

exit 1
