# AI Agents in Mindweave

This document describes the AI agents integrated into Mindweave and how they enhance the personal knowledge management experience.

## Overview

Mindweave uses a multi-agent AI architecture to provide intelligent features:

1. **Claude AI** (Anthropic) - Content understanding, tagging, and Q&A
2. **Google Gemini** - Vector embeddings for semantic search
3. **Future Agents** - Planned capabilities for enhanced knowledge management

## Agent Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Mindweave Platform                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Claude AI  │  │Google Gemini │  │Future Agents │      │
│  │              │  │              │  │              │      │
│  │ • Tagging    │  │ • Embeddings │  │ • Analytics  │      │
│  │ • Q&A        │  │ • Semantic   │  │ • Insights   │      │
│  │ • Summary    │  │   Search     │  │ • Recs       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│              PostgreSQL + pgvector Database                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Claude AI Agent

**Purpose**: Natural language understanding and content intelligence

**Model**: Claude 3.5 Sonnet (claude-3-5-sonnet-20241022)

**API Provider**: Anthropic

### Capabilities

#### A. Auto-Tagging (Implemented in Feature #6)

Automatically generates relevant tags for captured content.

**Implementation**: `lib/ai/claude.ts` - `generateTags()`

**Process**:
1. User captures note/link/file
2. Claude analyzes title, body, and URL
3. Returns 3-7 relevant tags
4. Stored in `content.autoTags` column

**Example**:
```typescript
const tags = await generateTags({
  type: 'note',
  title: 'Machine Learning Best Practices',
  body: 'Tips for training neural networks...',
});
// Returns: ['machine-learning', 'neural-networks', 'best-practices', 'ai']
```

**Prompt Strategy**:
- Instructs Claude to return tags as lowercase, hyphenated strings
- Focuses on extracting key topics, technologies, and concepts
- Avoids generic tags like "information" or "content"

#### B. Knowledge Q&A (Implemented in Feature #9)

Interactive chat interface to query your knowledge base.

**Implementation**: `lib/ai/claude.ts` - `answerQuestion()`

**Process**:
1. User asks a question
2. Relevant content retrieved via semantic search
3. Claude analyzes content and generates answer
4. Citations provided with source content

**Example Use Cases**:
- "What are my notes about React hooks?"
- "Summarize everything I've saved about machine learning"
- "What did I learn from the article about databases?"

**Prompt Strategy**:
- Provides relevant content as context
- Instructs Claude to cite sources
- Handles "I don't know" gracefully when content doesn't contain the answer

#### C. Content Summarization (Implemented in Feature #6)

Generates concise summaries of long-form content.

**Implementation**: `lib/ai/claude.ts` - `summarizeContent()`

**Use Cases**:
- Summarize long articles before saving
- Generate previews for content cards
- Create quick references from detailed notes

**Example**:
```typescript
const summary = await summarizeContent({
  title: 'Complete Guide to TypeScript',
  body: '... 5000 word article ...',
});
// Returns: "Comprehensive TypeScript guide covering types, interfaces..."
```

### Configuration

**Environment Variable**: `ANTHROPIC_API_KEY`

**API Settings**:
```typescript
{
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 1024,
  temperature: 0.7
}
```

**Cost Optimization**:
- Uses streaming for Q&A responses
- Batches multiple tagging requests when possible
- Implements request caching for repeated queries

### Rate Limits & Error Handling

**Rate Limits**:
- 50 requests per minute (default tier)
- 40,000 tokens per minute

**Error Handling**:
- Automatic retry with exponential backoff
- Graceful degradation (e.g., skip auto-tagging on failure)
- User-friendly error messages

---

## 2. Google Gemini Embeddings Agent

**Purpose**: Vector embeddings for semantic search

**Model**: text-embedding-004

**API Provider**: Google AI Studio

### Capabilities

#### Vector Embedding Generation

Converts text content into 768-dimensional vectors for similarity search.

**Implementation**: `lib/ai/embeddings.ts` - `generateEmbedding()`

**Process**:
1. Content is captured or updated
2. Gemini generates 768-dimensional embedding vector
3. Stored in `embeddings` table with pgvector
4. Used for semantic search queries

**Vector Dimensions**: 768 (optimized for text-embedding-004)

**Example**:
```typescript
const embedding = await generateEmbedding(
  'Machine learning is a subset of artificial intelligence'
);
// Returns: [0.123, -0.456, 0.789, ...] (768 numbers)
```

#### Semantic Search (Implemented in Feature #8)

Find content by meaning, not just keywords.

**Implementation**: `lib/ai/embeddings.ts` - `searchSimilarContent()`

**Process**:
1. User query converted to embedding vector
2. pgvector performs cosine similarity search
3. Returns top N most similar content items
4. Sorted by relevance score

**Example Queries**:
- "AI and machine learning" → finds ML-related content
- "database optimization" → finds performance tuning notes
- "javascript frameworks" → finds React, Vue, Angular content

**SQL Query**:
```sql
SELECT *, embedding <=> $1 as distance
FROM embeddings
INNER JOIN content ON embeddings.content_id = content.id
WHERE content.user_id = $2
ORDER BY distance ASC
LIMIT 10;
```

### Configuration

**Environment Variable**: `GOOGLE_AI_API_KEY`

**API Settings**:
```typescript
{
  model: 'text-embedding-004',
  dimensions: 768,
  taskType: 'SEMANTIC_SIMILARITY'
}
```

**Database**:
- Uses pgvector extension (v0.8.1)
- Vector type: `vector(768)`
- Index: `HNSW` for fast approximate search

### Performance Optimization

**Batch Processing**:
- Generates embeddings for multiple items in parallel
- Limits: 100 items per batch

**Caching**:
- Embeddings cached in database
- Only regenerated if content changes

**Index Strategy**:
- HNSW index for sub-millisecond search
- Automatic index updates on insert

---

## 3. Ralph - Autonomous Development Agent

**Purpose**: Autonomous feature development with test-driven workflow

**Type**: Development automation agent

**Implementation**: Bash script loop with AI assistant integration

### Overview

Ralph is an autonomous AI agent that implements product requirements iteratively with comprehensive testing and quality assurance. Unlike the AI agents above that process user content, Ralph is a development agent that helps build the Mindweave application itself.

**Key Characteristics**:
- **Autonomous**: Runs without manual intervention for multiple iterations
- **Test-Driven**: Writes tests first, then implementation (≥80% coverage required)
- **Quality-Focused**: Enforces strict quality gates (tests, types, lint, build)
- **Learning**: Documents patterns and gotchas for future iterations
- **Iterative**: Works through stories one at a time until completion

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Ralph Agent Loop                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────┐           │
│  │  1. Read prd.json (Product Requirements)     │           │
│  └──────────────────────────────────────────────┘           │
│                        ↓                                     │
│  ┌──────────────────────────────────────────────┐           │
│  │  2. Select highest-priority incomplete story │           │
│  └──────────────────────────────────────────────┘           │
│                        ↓                                     │
│  ┌──────────────────────────────────────────────┐           │
│  │  3. Create feature branch                    │           │
│  └──────────────────────────────────────────────┘           │
│                        ↓                                     │
│  ┌──────────────────────────────────────────────┐           │
│  │  4. Implement with TDD (tests first)         │           │
│  └──────────────────────────────────────────────┘           │
│                        ↓                                     │
│  ┌──────────────────────────────────────────────┐           │
│  │  5. Run quality checks (≥80% coverage)       │           │
│  └──────────────────────────────────────────────┘           │
│                        ↓                                     │
│  ┌──────────────────────────────────────────────┐           │
│  │  6. Merge to main, verify no regressions     │           │
│  └──────────────────────────────────────────────┘           │
│                        ↓                                     │
│  ┌──────────────────────────────────────────────┐           │
│  │  7. Update status in prd.json                │           │
│  └──────────────────────────────────────────────┘           │
│                        ↓                                     │
│  ┌──────────────────────────────────────────────┐           │
│  │  8. Log learnings to progress.txt            │           │
│  └──────────────────────────────────────────────┘           │
│                        ↓                                     │
│  ┌──────────────────────────────────────────────┐           │
│  │  9. Commit metadata (prd.json, progress.txt) │           │
│  └──────────────────────────────────────────────┘           │
│                        ↓                                     │
│             Continue until all stories pass                  │
│              or max iterations reached                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Implementation Files

**Core Files**:
- `scripts/ralph/ralph.sh` - Main execution script (bash loop)
- `scripts/ralph/CLAUDE.md` - Prompt template for AI agent
- `scripts/ralph/prd.json` - Product requirements and task status
- `scripts/ralph/progress.txt` - Learning log from iterations

**Skills** (User-invocable commands):
- `/ralph-loop` - Start Ralph autonomous loop
- `/ralph-status` - Check progress and view completed stories
- `/ralph-prd` - View/edit product requirements

### Workflow Detail

#### 1. Story Selection
Ralph reads `prd.json` and finds the highest-priority story with `"passes": false`.

**Story Structure**:
```json
{
  "id": "feature-4",
  "title": "Full-text Search",
  "description": "Implement search functionality...",
  "acceptance_criteria": [
    "Search bar component",
    "Server action for search",
    "≥80% test coverage",
    "All quality checks passing"
  ],
  "priority": 1,
  "passes": false,
  "completed_at": null
}
```

#### 2. Feature Branch Creation
```bash
git checkout -b feature/full-text-search
```

**Naming Convention**: `feature/story-name` (lowercase, hyphenated)

#### 3. Test-Driven Implementation

**TDD Workflow**:
1. Write tests FIRST (unit, component, integration, E2E)
2. Run tests (should fail initially)
3. Implement feature code
4. Run tests (should pass)
5. Refactor if needed
6. Verify coverage ≥80%

**Test Types Required**:
- Unit tests for business logic functions
- Component tests for React components (React Testing Library)
- Integration tests for API routes and database operations
- E2E tests for critical user flows (Playwright)

#### 4. Quality Gates

All checks must pass before merge:

```bash
npm test              # All tests pass
npm run test:coverage # Coverage ≥ 80%
npm run type-check    # No TypeScript errors
npm run lint          # No ESLint warnings
npm run build         # Production build succeeds
```

**Coverage Thresholds**:
- Statements: ≥80%
- Branches: ≥80%
- Functions: ≥80%
- Lines: ≥80%

#### 5. Merge to Main

```bash
git checkout main
git merge feature/story-name --no-ff  # No fast-forward
git push origin main
git branch -d feature/story-name      # Delete merged branch
```

**Post-Merge Verification**:
```bash
# CRITICAL: Run ALL tests in main to catch regressions
npm test              # All unit & integration tests
npm run test:e2e      # All E2E tests
npm run test:coverage # Verify coverage maintained
npm run type-check    # TypeScript validation
npm run lint          # Code quality
npm run build         # Production build
```

**If tests fail in main**: STOP immediately, fix issue, re-run all tests.

#### 6. Status Update

Update `prd.json`:
```json
{
  "id": "feature-4",
  "passes": true,
  "completed_at": "2026-01-21T12:00:00Z"
}
```

#### 7. Progress Logging

Append to `progress.txt`:
```
## Iteration 3 - 2026-01-21T12:00:00Z
Story: feature-4 (Full-text Search)
Status: Complete
Coverage: 85.2%

### What Worked
- PostgreSQL full-text search with ts_rank
- Combined keyword and filter search

### Challenges
- URL encoding for special characters
- Test coverage initially at 75%

### Learnings
- Use to_tsquery() for proper operator handling
- Mock searchParams with 'as any' in tests

### Gotchas
- Remember to index tsvector columns
- Search needs debouncing in UI
```

#### 8. Metadata Commit

```bash
git add scripts/ralph/prd.json scripts/ralph/progress.txt
git commit -m "chore: Update Ralph task status for full-text-search

Story: Full-text Search
Status: Complete
Coverage: 85.2%

Co-Authored-By: Ralph AI <ralph@mindweave.dev>"
```

### Completion Signal

When all stories have `"passes": true`, Ralph outputs:

```
<promise>COMPLETE</promise>
```

The bash script detects this and exits gracefully.

### Quality Standards

Ralph enforces these standards for every story:

**Testing**:
- Minimum 80% code coverage (statements, branches, functions, lines)
- All test types present (unit, component, integration, E2E)
- No skipped or pending tests
- All tests passing in both feature branch AND main

**Code Quality**:
- TypeScript strict mode, no `any` without justification
- Zero ESLint warnings
- Production build successful
- No console errors in browser

**Git Hygiene**:
- Descriptive commit messages
- Feature branches for each story
- Clean main branch history (no fast-forward merges)
- Main branch always stable and deployable

### Error Handling

**If Tests Fail**:
- DO NOT mark story as complete
- DO NOT proceed to next story
- Fix the issue immediately
- Re-run all quality checks

**If Build Fails**:
- Review TypeScript errors
- Check for missing dependencies
- Verify import paths
- Fix and rebuild

**If Coverage < 80%**:
- Write additional tests
- Focus on untested branches
- Test edge cases and error paths
- Review coverage report for gaps

**If Merge Creates Regressions**:
- Revert merge if needed
- Fix regression in new commit
- Re-run full test suite
- Never leave main branch broken

### Configuration

**Environment Variables**:
```bash
# None required - Ralph uses existing project config
```

**Tool Selection**:
```bash
# Default: claude
./scripts/ralph/ralph.sh

# Use Amp CLI instead
./scripts/ralph/ralph.sh --tool amp

# Custom max iterations
./scripts/ralph/ralph.sh --max-iterations 20
./scripts/ralph/ralph.sh 20  # Shorthand
```

**Max Iterations**: Default 10, adjustable

### Usage Examples

#### Start Ralph Loop
```bash
# From project root
./scripts/ralph/ralph.sh

# Or using skill command
/ralph-loop
```

#### Check Status
```bash
# View progress
/ralph-status

# Check specific story
/ralph-prd view feature-4
```

#### Manage Stories
```bash
# View all stories
/ralph-prd

# Add new story
/ralph-prd add

# Edit story
/ralph-prd edit feature-4

# Mark story complete manually
/ralph-prd complete feature-4
```

### Branch Change Detection

Ralph automatically detects when the branch changes in `prd.json` and:
1. Archives previous run's files to `scripts/ralph/archive/{branch}_{timestamp}/`
2. Resets `progress.txt` for the new branch
3. Continues with new branch's stories

**Archive Structure**:
```
scripts/ralph/archive/
├── main_20260120_143000/
│   ├── progress.txt
│   └── prd.json
└── feature-search_20260121_090000/
    ├── progress.txt
    └── prd.json
```

### Best Practices

**Story Definition**:
- Clear acceptance criteria (specific and measurable)
- Include test coverage requirement (≥80%)
- Include quality gate requirements (types, lint, build)
- One feature per story (don't combine multiple features)
- Realistic scope (break large features into smaller stories)

**Running Ralph**:
- Review stories in `prd.json` before starting
- Check `progress.txt` for previous learnings
- Monitor output during iterations
- Don't interrupt mid-iteration
- Let Ralph complete one story before stopping

**After Ralph Runs**:
- Review what was completed (`/ralph-status`)
- Check `progress.txt` for learnings
- Verify all tests still pass in main
- Update project documentation if needed
- Commit any manual fixes separately

### Monitoring & Debugging

**Output Files**:
- Ralph outputs to stdout/stderr in real-time
- Check `scripts/ralph/progress.txt` for iteration history
- Check `scripts/ralph/prd.json` for current status

**Common Issues**:

1. **Max iterations reached without completion**
   - Review `progress.txt` for blockers
   - Increase max iterations: `./scripts/ralph/ralph.sh 20`
   - Or finish remaining stories manually

2. **Ralph marks story complete but tests fail**
   - Use `/ralph-prd incomplete feature-X` to reset
   - Fix the issue manually
   - Update acceptance criteria to be more specific

3. **Branch state confusion**
   - Check `.last-branch` file
   - Review archived runs if branch changed
   - Reset with `rm scripts/ralph/.last-branch`

### Conventions from Previous Features

These patterns have proven successful across Features #1-3:

**Server Actions**:
```typescript
// Always in app/actions/ directory
export async function someAction(params: ParamsType): Promise<ResultType> {
  // 1. Authenticate first
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  // 2. Validate with Zod
  const validated = schema.safeParse(params);
  if (!validated.success) {
    return { success: false, error: validated.error };
  }

  // 3. Database operations with Drizzle
  const result = await db.insert(table).values(data);

  // 4. Return result object
  return { success: true, data: result };
}
```

**Component Testing**:
```typescript
// Mock Next.js hooks
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

// Mock server actions
vi.mock('@/app/actions/content', () => ({
  getContentAction: vi.fn(),
}));

// Render with Testing Library
render(<Component />);

// Assert
expect(screen.getByText('Expected')).toBeInTheDocument();
```

**Database Queries**:
```typescript
// Filter at database level (not in-memory)
const items = await db
  .select()
  .from(content)
  .where(
    and(
      eq(content.userId, userId),
      typeFilter ? eq(content.type, typeFilter) : undefined,
      tagFilter ? sql`${content.tags} @> ARRAY[${tagFilter}]::text[]` : undefined
    )
  )
  .orderBy(/* sorting */);
```

**Route Structure**:
- Protected routes: `/dashboard/*`
- Public routes: Root and `/auth/*`
- API routes: `/api/*`

### Integration with Other Agents

Ralph is a **development agent** that builds features that use the **AI agents**:

**Example Flow**:
1. Ralph implements Feature #6 (Claude Auto-Tagging)
2. Creates server action that calls Claude AI agent
3. Tests the integration with mocked Claude API
4. Deploys to production
5. Users capture content → Claude agent generates tags

**Clear Separation**:
- **Ralph**: Develops features (autonomous developer)
- **Claude AI**: Processes user content (tagging, Q&A)
- **Gemini**: Generates embeddings (semantic search)

---

## 4. Future Agent Capabilities

### Planned Features

#### A. Content Analytics Agent

**Purpose**: Generate insights about your knowledge base

**Capabilities**:
- Topic clustering and trend analysis
- Knowledge gap identification
- Reading time and engagement metrics
- Tag co-occurrence analysis

**Implementation Timeline**: Phase 3

#### B. Smart Recommendations Agent

**Purpose**: Suggest related content and learning paths

**Capabilities**:
- "Read next" recommendations
- Related content suggestions
- Duplicate detection
- Knowledge graph visualization

**Implementation Timeline**: Phase 3

#### C. Multi-Modal Agent

**Purpose**: Process images, PDFs, and audio

**Capabilities**:
- OCR for images and PDFs
- Audio transcription
- Video summarization
- Handwriting recognition

**Implementation Timeline**: Phase 4

#### D. Collaborative Agent

**Purpose**: Team knowledge management

**Capabilities**:
- Shared knowledge bases
- Collaborative tagging
- Team insights
- Access control

**Implementation Timeline**: Phase 4

---

## Agent Communication Patterns

### 1. Sequential Processing

Content capture with tagging and embedding:

```
User Input
    ↓
Save Content → Generate Tags → Generate Embedding
    ↓              ↓                ↓
Database      Auto Tags        Vector Store
```

### 2. Parallel Processing

Semantic search with Q&A:

```
User Query
    ↓
    ├─→ Gemini Embedding → Vector Search → Relevant Content
    └─→ Claude Q&A ←────────────────────────┘
                    ↓
                User Response
```

### 3. RAG (Retrieval-Augmented Generation)

Knowledge Q&A flow:

```
1. User Question
2. Generate Query Embedding (Gemini)
3. Vector Search (pgvector)
4. Retrieve Top N Results
5. Build Context (Relevant Content)
6. Generate Answer (Claude)
7. Return with Citations
```

---

## API Keys & Configuration

### Required API Keys

**Development**:
```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=AIzaSy...
```

**Production** (GCP Secret Manager):
```bash
# Secret names
anthropic-api-key
google-ai-api-key
```

### Getting API Keys

#### 1. Anthropic API Key

1. Sign up at https://console.anthropic.com/
2. Navigate to API Keys section
3. Create new API key
4. Copy and save securely

**Pricing**: Pay-as-you-go
- Input: $3 / million tokens
- Output: $15 / million tokens

#### 2. Google AI API Key

1. Visit https://aistudio.google.com/app/apikey
2. Create or select project
3. Generate API key
4. Enable "Generative Language API"

**Pricing**: Free tier available
- 1,500 requests per day (free)
- Pay-as-you-go after free tier

---

## Agent Monitoring & Debugging

### Logging

All agent interactions are logged:

```typescript
console.log('[Claude] Generating tags for content:', contentId);
console.log('[Gemini] Creating embedding, dimensions:', 768);
console.log('[Search] Found', results.length, 'similar items');
```

### Error Tracking

**Common Errors**:

1. **API Key Invalid**
   - Check environment variables
   - Verify key hasn't expired

2. **Rate Limit Exceeded**
   - Implement exponential backoff
   - Reduce request frequency

3. **Token Limit Exceeded**
   - Truncate long content
   - Summarize before processing

4. **Network Timeout**
   - Increase timeout settings
   - Implement retry logic

### Testing Agents Locally

**Test Auto-Tagging**:
```bash
cd apps/web
node -e "
  const { generateTags } = require('./lib/ai/claude');
  generateTags({
    title: 'Test Article',
    body: 'Content about React and TypeScript'
  }).then(console.log);
"
```

**Test Embeddings**:
```bash
node -e "
  const { generateEmbedding } = require('./lib/ai/embeddings');
  generateEmbedding('test content').then(v => console.log(v.length));
"
```

---

## Best Practices

### 1. Prompt Engineering

**DO**:
- Be specific and clear in prompts
- Provide examples when possible
- Set temperature based on task (0.7 for creative, 0.3 for factual)
- Use system messages for consistent behavior

**DON'T**:
- Send sensitive data to external APIs
- Trust outputs without validation
- Ignore rate limits
- Skip error handling

### 2. Cost Management

**Strategies**:
- Cache results when possible
- Batch requests to reduce API calls
- Use cheaper models for simple tasks
- Monitor usage with API dashboards

**Budget Alerts**:
- Set spending limits in API console
- Monitor daily/monthly usage
- Track cost per user/feature

### 3. Privacy & Security

**User Data**:
- Never log API responses containing user data
- Implement request filtering for PII
- Use encryption for API keys
- Follow GDPR/privacy regulations

**API Keys**:
- Never commit to version control
- Rotate keys regularly
- Use different keys for dev/prod
- Implement key expiration policies

### 4. Performance Optimization

**Caching Strategy**:
- Cache embeddings (permanent)
- Cache tags for unchanged content
- Cache search results (5 minutes)
- Don't cache Q&A responses

**Request Batching**:
- Batch tag generation for multiple items
- Batch embedding creation
- Process async where possible

---

## Troubleshooting

### Agent Not Responding

**Check**:
1. API key is set and valid
2. Network connectivity
3. Service status pages
4. Rate limits

**Solutions**:
- Verify environment variables loaded
- Test with curl/postman
- Check API status pages
- Review rate limit headers

### Poor Quality Results

**For Tagging**:
- Provide more context in content
- Adjust temperature setting
- Review prompt engineering
- Check if content is too short

**For Embeddings**:
- Ensure content has meaningful text
- Check vector dimensions match
- Verify database index is working
- Test with known similar content

### High Costs

**Identify**:
- Review API usage dashboard
- Track requests per feature
- Identify high-volume operations
- Analyze token consumption

**Optimize**:
- Reduce unnecessary API calls
- Implement smarter caching
- Use batch operations
- Consider cheaper models for simple tasks

---

## Related Documentation

- [CLAUDE.md](CLAUDE.md) - Development guide with AI integration details
- [lib/ai/claude.ts](apps/web/lib/ai/claude.ts) - Claude API wrapper
- [lib/ai/embeddings.ts](apps/web/lib/ai/embeddings.ts) - Gemini embeddings
- [STATUS.md](STATUS.md) - Feature implementation status

---

## Questions?

For AI agent-related questions:
- Review API documentation: [Anthropic](https://docs.anthropic.com/) | [Google AI](https://ai.google.dev/)
- Check implementation: `apps/web/lib/ai/`
- Report issues: [GitHub Issues](https://github.com/abhid1234/MindWeave/issues)
