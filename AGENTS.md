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

## 3. Future Agent Capabilities

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
