/**
 * Marketplace Seeding Script
 *
 * Seeds the marketplace with realistic collections from multiple creators
 * so the browse page looks populated and compelling.
 *
 * Usage:
 *   cd apps/web && tsx ../../scripts/seed-marketplace.ts
 *
 * Idempotent — checks for existing seed users before creating.
 */

import { db } from '../apps/web/lib/db/client';
import {
  users,
  content,
  collections,
  contentCollections,
  collectionMembers,
  marketplaceListings,
} from '../apps/web/lib/db/schema';
import { eq } from 'drizzle-orm';

// ── Seed creators ──────────────────────────────────────────────────────

const CREATORS = [
  {
    email: 'sarah.chen@mindweave.seed',
    name: 'Sarah Chen',
    username: 'sarahchen',
    bio: 'Full-stack dev. Open source contributor. Writing about React, TypeScript, and system design.',
    image: null,
  },
  {
    email: 'marcus.johnson@mindweave.seed',
    name: 'Marcus Johnson',
    username: 'marcusj',
    bio: 'Product designer at a Series B startup. Obsessed with design systems and user research.',
    image: null,
  },
  {
    email: 'priya.sharma@mindweave.seed',
    name: 'Priya Sharma',
    username: 'priyasharma',
    bio: 'Data scientist & ML engineer. Sharing everything I learn about AI, stats, and Python.',
    image: null,
  },
  {
    email: 'alex.rivera@mindweave.seed',
    name: 'Alex Rivera',
    username: 'alexr',
    bio: 'Indie hacker building in public. Productivity nerd. Notion → Mindweave convert.',
    image: null,
  },
  {
    email: 'emma.watson@mindweave.seed',
    name: 'Emma Watson',
    username: 'emmaw',
    bio: 'Career coach & leadership consultant. Helping devs level up beyond the code.',
    image: null,
  },
];

// ── Collection definitions ─────────────────────────────────────────────

interface ContentItem {
  type: 'note' | 'link';
  title: string;
  body?: string;
  url?: string;
  tags: string[];
}

interface CollectionDef {
  creatorIndex: number;
  name: string;
  description: string;
  color: string;
  category: string;
  marketplaceDesc: string;
  viewCount: number;
  cloneCount: number;
  isFeatured: boolean;
  items: ContentItem[];
}

const COLLECTIONS: CollectionDef[] = [
  // ── Sarah Chen's collections ──
  {
    creatorIndex: 0,
    name: 'React Patterns & Best Practices',
    description: 'Battle-tested React patterns I use daily',
    color: '#3B82F6',
    category: 'programming',
    marketplaceDesc:
      'A curated collection of React patterns, hooks, and architectural decisions from 5 years of production React. Includes compound components, render props, custom hooks, state machines, and performance optimization techniques.',
    viewCount: 847,
    cloneCount: 124,
    isFeatured: true,
    items: [
      {
        type: 'note',
        title: 'Compound Component Pattern',
        body: `## Compound Components

The compound component pattern lets you create expressive, declarative APIs for your components. Think \`<select>\` and \`<option>\`.

### When to use
- Components with shared implicit state
- Flexible composition (user controls rendering order)
- Clean API surface

### Example
\`\`\`tsx
<Tabs defaultValue="code">
  <Tabs.List>
    <Tabs.Trigger value="code">Code</Tabs.Trigger>
    <Tabs.Trigger value="preview">Preview</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="code">...</Tabs.Content>
  <Tabs.Content value="preview">...</Tabs.Content>
</Tabs>
\`\`\`

Uses React.createContext internally to share state between parent and children without prop drilling.`,
        tags: ['react', 'patterns', 'components'],
      },
      {
        type: 'note',
        title: 'Custom Hook: useDebounce',
        body: `## useDebounce Hook

\`\`\`ts
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
\`\`\`

### Usage
\`\`\`ts
const debouncedSearch = useDebounce(searchQuery, 300);

useEffect(() => {
  fetchResults(debouncedSearch);
}, [debouncedSearch]);
\`\`\`

Key: the cleanup function cancels the previous timer on each re-render.`,
        tags: ['react', 'hooks', 'typescript'],
      },
      {
        type: 'note',
        title: 'React Server Components Mental Model',
        body: `## RSC Mental Model

Think of your component tree as two layers:
1. **Server layer** — runs once on the server, can access DB/filesystem directly
2. **Client layer** — hydrates in the browser, handles interactivity

### Rules of thumb
- Default to server components (they're the default in Next.js App Router)
- Add 'use client' only when you need: useState, useEffect, event handlers, browser APIs
- Server components can import client components, NOT the reverse
- Pass server data as props to client components (serialized at the boundary)

### Performance wins
- Zero JS bundle for server components
- Direct database access (no API layer needed)
- Streaming with Suspense boundaries`,
        tags: ['react', 'rsc', 'nextjs', 'architecture'],
      },
      {
        type: 'link',
        title: 'React.dev — Thinking in React',
        url: 'https://react.dev/learn/thinking-in-react',
        body: 'The official guide to breaking down UI into components. Still the best introduction to the React mental model.',
        tags: ['react', 'tutorial', 'fundamentals'],
      },
      {
        type: 'note',
        title: 'Performance: React.memo vs useMemo vs useCallback',
        body: `## When to memoize (and when NOT to)

### React.memo
Wraps a component to skip re-renders if props haven't changed.
**Use when**: component is expensive to render AND receives the same props frequently.
**Skip when**: props change on every render anyway (defeats the purpose).

### useMemo
Caches the result of an expensive computation.
**Use when**: heavy calculations (sorting large arrays, complex transformations).
**Skip when**: simple operations — the memoization overhead isn't worth it.

### useCallback
Caches a function reference. Primarily useful when passing callbacks to memoized children.
**Use when**: passing callbacks to React.memo'd children.
**Skip when**: the child isn't memoized (the stable reference doesn't help).

### Golden rule
Profile first. Don't memoize everything — it adds cognitive and runtime overhead.`,
        tags: ['react', 'performance', 'optimization'],
      },
      {
        type: 'link',
        title: 'TanStack Query — Data Fetching Library',
        url: 'https://tanstack.com/query/latest',
        body: 'The best data fetching library for React. Handles caching, deduplication, background refetching, optimistic updates, and pagination out of the box.',
        tags: ['react', 'data-fetching', 'library'],
      },
      {
        type: 'note',
        title: 'Error Boundaries in Practice',
        body: `## Error Boundaries

Error boundaries catch JS errors in their child component tree and display a fallback UI.

### Key points
- Only class components can be error boundaries (use react-error-boundary for a hooks-friendly wrapper)
- They catch errors during rendering, lifecycle methods, and constructors
- They do NOT catch: event handlers, async code, SSR, errors in the boundary itself

### Pattern
\`\`\`tsx
<ErrorBoundary fallback={<ErrorCard />}>
  <Suspense fallback={<Skeleton />}>
    <AsyncComponent />
  </Suspense>
</ErrorBoundary>
\`\`\`

Place boundaries strategically — around route segments, data-fetching zones, and third-party widgets.`,
        tags: ['react', 'error-handling', 'patterns'],
      },
    ],
  },
  {
    creatorIndex: 0,
    name: 'TypeScript Cheat Sheet',
    description: 'Quick reference for TypeScript patterns and utility types',
    color: '#2563EB',
    category: 'programming',
    marketplaceDesc:
      'Essential TypeScript patterns, utility types, and advanced techniques. From generics and conditional types to template literal types and the infer keyword. Perfect for intermediate devs leveling up.',
    viewCount: 612,
    cloneCount: 89,
    isFeatured: false,
    items: [
      {
        type: 'note',
        title: 'Utility Types Cheat Sheet',
        body: `## Built-in Utility Types

| Type | What it does |
|------|-------------|
| \`Partial<T>\` | Makes all properties optional |
| \`Required<T>\` | Makes all properties required |
| \`Pick<T, K>\` | Picks specific properties |
| \`Omit<T, K>\` | Removes specific properties |
| \`Record<K, V>\` | Creates object type with key K and value V |
| \`Exclude<T, U>\` | Removes types from union |
| \`Extract<T, U>\` | Extracts types from union |
| \`NonNullable<T>\` | Removes null and undefined |
| \`ReturnType<T>\` | Gets return type of function |
| \`Parameters<T>\` | Gets parameter types as tuple |`,
        tags: ['typescript', 'cheatsheet', 'types'],
      },
      {
        type: 'note',
        title: 'Discriminated Unions',
        body: `## Discriminated Unions

The most powerful pattern in TypeScript for modeling domain logic.

\`\`\`ts
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function handle(result: Result<User>) {
  if (result.success) {
    // TypeScript knows result.data exists here
    console.log(result.data.name);
  } else {
    // TypeScript knows result.error exists here
    console.error(result.error);
  }
}
\`\`\`

The \`success\` field is the discriminant — it narrows the type in each branch.`,
        tags: ['typescript', 'patterns', 'types'],
      },
      {
        type: 'note',
        title: 'Generics Explained Simply',
        body: `## Generics = Type Parameters

Think of generics as "type arguments" — just like functions take value arguments, generic types take type arguments.

\`\`\`ts
// Without generics: loses type info
function first(arr: any[]): any { return arr[0]; }

// With generics: preserves type
function first<T>(arr: T[]): T { return arr[0]; }

const n = first([1, 2, 3]);    // n: number
const s = first(['a', 'b']);    // s: string
\`\`\`

### Constraints
\`\`\`ts
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
\`\`\`

\`K extends keyof T\` means K must be a valid key of T.`,
        tags: ['typescript', 'generics', 'fundamentals'],
      },
      {
        type: 'link',
        title: 'TypeScript Handbook',
        url: 'https://www.typescriptlang.org/docs/handbook/',
        body: 'The official TypeScript handbook. Comprehensive reference for all language features.',
        tags: ['typescript', 'documentation', 'reference'],
      },
      {
        type: 'note',
        title: 'Zod + TypeScript: Schema-First Validation',
        body: `## Zod: Runtime validation with full type inference

\`\`\`ts
import { z } from 'zod';

const UserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().min(0).optional(),
});

// Infer the TypeScript type from the schema
type User = z.infer<typeof UserSchema>;
// { name: string; email: string; age?: number }

// Runtime validation
const result = UserSchema.safeParse(input);
if (result.success) {
  // result.data is fully typed as User
}
\`\`\`

Single source of truth for types AND validation.`,
        tags: ['typescript', 'zod', 'validation'],
      },
    ],
  },

  // ── Marcus Johnson's collections ──
  {
    creatorIndex: 1,
    name: 'Design System Foundations',
    description: 'Everything you need to build a design system from scratch',
    color: '#8B5CF6',
    category: 'design',
    marketplaceDesc:
      'A complete guide to building design systems — from color tokens and typography scales to component APIs and documentation. Drawn from building design systems at 3 startups.',
    viewCount: 523,
    cloneCount: 67,
    isFeatured: true,
    items: [
      {
        type: 'note',
        title: 'Color Token Architecture',
        body: `## Color Tokens: Three Layers

### 1. Primitive tokens (raw values)
\`blue-500: #3B82F6\`, \`gray-100: #F3F4F6\`

### 2. Semantic tokens (meaning)
\`color-primary: {blue-500}\`, \`color-surface: {gray-100}\`

### 3. Component tokens (specific usage)
\`button-bg-primary: {color-primary}\`, \`card-bg: {color-surface}\`

### Why three layers?
- Primitives rarely change
- Semantic tokens handle theming (dark mode = remap semantic → different primitives)
- Component tokens handle specific overrides without breaking the system

### Tools
- Figma Variables (native token support)
- Style Dictionary (token → CSS/JSON/Swift/Kotlin)`,
        tags: ['design-systems', 'color', 'tokens'],
      },
      {
        type: 'note',
        title: 'Typography Scale',
        body: `## Type Scale Using Modular Ratios

Pick a base size (16px) and a ratio (1.25 = Major Third):

| Step | Size | Use |
|------|------|-----|
| xs | 12.8px | Captions, metadata |
| sm | 14px | Secondary text |
| base | 16px | Body text |
| lg | 20px | Subheadings |
| xl | 25px | Section headings |
| 2xl | 31.25px | Page titles |
| 3xl | 39px | Hero text |

### Line height rules
- Body text: 1.5–1.6
- Headings: 1.1–1.3
- Tight layouts: 1.3–1.4

### Font pairing
One serif + one sans-serif is safest. Or just use Inter for everything — it works.`,
        tags: ['design-systems', 'typography', 'scale'],
      },
      {
        type: 'note',
        title: 'Component API Design Principles',
        body: `## Designing Component APIs

### 1. Composition over configuration
Bad: \`<Button leftIcon="check" rightIcon="arrow" label="Submit" loading />\`
Good: \`<Button><Check /> Submit <Arrow /></Button>\`

### 2. Sensible defaults
Every prop should have a good default. The zero-prop version should work.

### 3. Consistent naming
- \`size\`: sm | md | lg (not small/medium/large)
- \`variant\`: primary | secondary | ghost | destructive
- Boolean props: \`isDisabled\`, \`isLoading\` (or just \`disabled\`, \`loading\`)

### 4. Forward refs and spread props
Always forward refs. Always spread remaining props onto the root element.
\`\`\`tsx
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(variants({ variant, size }))} {...props} />
  )
);
\`\`\``,
        tags: ['design-systems', 'components', 'api-design'],
      },
      {
        type: 'link',
        title: 'Radix UI Primitives',
        url: 'https://www.radix-ui.com/primitives',
        body: 'Unstyled, accessible component primitives. The best foundation for building a design system with React. Used by shadcn/ui.',
        tags: ['design-systems', 'accessibility', 'react'],
      },
      {
        type: 'note',
        title: 'Spacing System: 4px Grid',
        body: `## The 4px Base Grid

All spacing values are multiples of 4px:

| Token | Value | Use |
|-------|-------|-----|
| space-1 | 4px | Tight gaps (icon + label) |
| space-2 | 8px | Related elements |
| space-3 | 12px | Form fields |
| space-4 | 16px | Standard padding |
| space-6 | 24px | Section gaps |
| space-8 | 32px | Card padding |
| space-12 | 48px | Section spacing |
| space-16 | 64px | Page sections |

### Why 4px?
- Aligns with most font metrics
- Divisible by 2 (half-steps work for fine-tuning)
- Tailwind's spacing scale is already 4px-based (1 = 0.25rem = 4px)`,
        tags: ['design-systems', 'spacing', 'layout'],
      },
      {
        type: 'link',
        title: 'Design Tokens Community Group',
        url: 'https://www.designtokens.org/',
        body: 'The W3C community group defining an open standard for design tokens. Important for cross-platform design system interoperability.',
        tags: ['design-systems', 'tokens', 'standards'],
      },
    ],
  },
  {
    creatorIndex: 1,
    name: 'UI/UX Research Methods',
    description: 'Research techniques for product teams',
    color: '#A855F7',
    category: 'design',
    marketplaceDesc:
      'Practical guide to user research methods — when to use which, how to run sessions, and how to synthesize findings. Covers usability testing, interviews, surveys, card sorting, and analytics.',
    viewCount: 389,
    cloneCount: 45,
    isFeatured: false,
    items: [
      {
        type: 'note',
        title: 'Research Method Picker',
        body: `## Which Research Method?

### Discover (what to build)
- **User interviews** — Open-ended exploration of needs and pain points
- **Contextual inquiry** — Observe users in their natural environment
- **Diary studies** — Users log behavior over days/weeks

### Evaluate (is it usable)
- **Usability testing** — Watch 5 users complete tasks on your prototype
- **A/B testing** — Quantitative comparison of two variants
- **Heuristic evaluation** — Expert review against usability principles

### Understand (information architecture)
- **Card sorting** — Users group/label content into categories
- **Tree testing** — Users find items in a proposed nav structure

### Rule of thumb
Discovery = qualitative (interviews, observation)
Evaluation = mixed (usability tests + analytics)
Optimization = quantitative (A/B tests, surveys)`,
        tags: ['ux-research', 'methods', 'product'],
      },
      {
        type: 'note',
        title: 'Running Usability Tests',
        body: `## Usability Testing Playbook

### Prep (1 day)
1. Define 3–5 realistic tasks
2. Write a discussion guide (intro, tasks, debrief)
3. Set up recording (screen + face) — Lookback, Maze, or Loom

### Recruit (2–3 days)
- 5 participants is enough to find ~85% of usability issues (Nielsen)
- Recruit from your target persona
- Offer incentive ($50–$100 gift card)

### Run (30–45 min each)
1. Warm-up: "Tell me about how you currently..."
2. Tasks: "Please show me how you would..."
3. Think aloud: "Keep talking about what you're thinking"
4. Never lead: "What would you expect to happen?" not "Click that button"
5. Debrief: "What was hardest? What would you change?"

### Synthesize
- Rainbow spreadsheet: rows = findings, columns = participants
- Severity rating: Critical / Major / Minor / Cosmetic
- Top 3 findings → action items`,
        tags: ['ux-research', 'usability-testing', 'playbook'],
      },
      {
        type: 'note',
        title: 'Survey Design Tips',
        body: `## Writing Good Survey Questions

### DO
- Use clear, simple language
- One question = one concept
- Start broad, get specific
- Include "N/A" or "I don't know" options
- Randomize answer order for opinion questions

### DON'T
- Ask leading questions ("How much did you love our new feature?")
- Use double negatives ("Do you not disagree?")
- Ask two things at once ("Was it fast and easy?")
- Use jargon your users won't understand
- Make every question required

### Scale tips
- 5-point Likert is standard (Strongly disagree → Strongly agree)
- Always label all points, not just endpoints
- Keep scales consistent throughout the survey

### Sample size
- Quantitative: 100+ responses for statistical significance
- Qualitative (open-ended): 30–50 is often enough for theme saturation`,
        tags: ['ux-research', 'surveys', 'methodology'],
      },
      {
        type: 'link',
        title: 'Nielsen Norman Group — Research Methods',
        url: 'https://www.nngroup.com/articles/which-ux-research-methods/',
        body: 'The definitive guide to choosing UX research methods. Great framework for behavioral vs attitudinal, qualitative vs quantitative.',
        tags: ['ux-research', 'reference', 'nngroup'],
      },
    ],
  },

  // ── Priya Sharma's collections ──
  {
    creatorIndex: 2,
    name: 'Machine Learning Fundamentals',
    description: 'Core ML concepts explained simply',
    color: '#10B981',
    category: 'science',
    marketplaceDesc:
      'Machine learning fundamentals without the math overload. Covers supervised/unsupervised learning, model evaluation, feature engineering, and common algorithms. With Python code snippets and intuitive explanations.',
    viewCount: 934,
    cloneCount: 156,
    isFeatured: true,
    items: [
      {
        type: 'note',
        title: 'ML Algorithm Decision Tree',
        body: `## Which Algorithm Should I Use?

### Classification (predict a category)
- **Logistic Regression** — Start here. Simple, interpretable, fast.
- **Random Forest** — Good default. Handles non-linear relationships.
- **XGBoost** — When you need peak performance. Wins Kaggle competitions.
- **Neural Network** — When you have lots of data and complex patterns.

### Regression (predict a number)
- **Linear Regression** — Start here. Check assumptions first.
- **Random Forest Regressor** — Non-linear relationships.
- **XGBoost Regressor** — Peak performance.

### Clustering (find groups)
- **K-Means** — Fast, simple. Must specify K.
- **DBSCAN** — Finds arbitrary-shaped clusters. Handles noise.
- **Hierarchical** — When you want a dendrogram of cluster relationships.

### Dimensionality Reduction
- **PCA** — Linear. Fast. Good for visualization.
- **t-SNE** — Non-linear. Great for 2D visualization.
- **UMAP** — Faster t-SNE. Preserves global structure better.`,
        tags: ['machine-learning', 'algorithms', 'guide'],
      },
      {
        type: 'note',
        title: 'Model Evaluation Metrics',
        body: `## Beyond Accuracy

Accuracy is misleading for imbalanced datasets. Use these instead:

### Classification
- **Precision** — Of predicted positives, how many are correct? (spam filter: avoid false alarms)
- **Recall** — Of actual positives, how many did we find? (cancer detection: don't miss cases)
- **F1 Score** — Harmonic mean of precision & recall. Good single metric.
- **AUC-ROC** — Model's ability to distinguish classes. 0.5 = random, 1.0 = perfect.

### Regression
- **RMSE** — Root Mean Squared Error. Same units as target. Penalizes large errors.
- **MAE** — Mean Absolute Error. Less sensitive to outliers than RMSE.
- **R²** — Proportion of variance explained. 1.0 = perfect. Can be negative (worse than mean).

### Always use
- **Cross-validation** — k-fold (k=5 or 10) to get reliable estimates
- **Train/validation/test split** — Never evaluate on training data`,
        tags: ['machine-learning', 'evaluation', 'metrics'],
      },
      {
        type: 'note',
        title: 'Feature Engineering Playbook',
        body: `## Feature Engineering: Where the Magic Happens

### Numerical features
- **Scaling**: StandardScaler (mean=0, std=1) or MinMaxScaler (0-1)
- **Log transform**: For right-skewed distributions (income, prices)
- **Binning**: Convert continuous → categorical (age groups)
- **Polynomial**: x² , x³ for capturing non-linear relationships

### Categorical features
- **One-hot encoding**: For <10 categories
- **Target encoding**: For high-cardinality (zip codes). Mean of target per category.
- **Ordinal encoding**: When order matters (low/medium/high)

### Text features
- **TF-IDF**: Classic. Weighted word frequencies.
- **Embeddings**: Modern. Dense vector representations (sentence-transformers).

### Date/time features
- Extract: year, month, day, dayOfWeek, hour, isWeekend
- Cyclical: sin/cos encoding for month, hour (so Dec is close to Jan)

### Missing values
- Numerical: median imputation (robust to outliers)
- Categorical: mode or "missing" category
- Consider: missingness itself can be informative (add is_missing flag)`,
        tags: ['machine-learning', 'feature-engineering', 'data'],
      },
      {
        type: 'link',
        title: 'scikit-learn Documentation',
        url: 'https://scikit-learn.org/stable/user_guide.html',
        body: 'The gold standard Python ML library. Excellent documentation with visual explanations of every algorithm.',
        tags: ['machine-learning', 'python', 'scikit-learn'],
      },
      {
        type: 'note',
        title: 'Bias-Variance Tradeoff',
        body: `## The Most Important Concept in ML

### Bias (underfitting)
Model is too simple to capture the pattern.
- Symptoms: high training error, high validation error
- Fix: more features, more complex model, less regularization

### Variance (overfitting)
Model memorizes training data including noise.
- Symptoms: low training error, high validation error
- Fix: more data, simpler model, regularization, dropout, early stopping

### The sweet spot
Total error = Bias² + Variance + Irreducible noise

As model complexity increases:
- Bias decreases (captures more patterns)
- Variance increases (more sensitive to training data)
- Goal: find the complexity that minimizes total error

### Practical checks
- Learning curves: plot train/val error vs. training set size
- If they converge high → high bias (need more complex model)
- If big gap → high variance (need more data or regularization)`,
        tags: ['machine-learning', 'theory', 'fundamentals'],
      },
      {
        type: 'link',
        title: 'fast.ai — Practical Deep Learning',
        url: 'https://course.fast.ai/',
        body: 'Best free deep learning course. Top-down approach: build things first, understand theory later. Uses PyTorch.',
        tags: ['deep-learning', 'course', 'pytorch'],
      },
      {
        type: 'note',
        title: 'Python ML Stack',
        body: `## The Essential Python ML Stack

### Data handling
- **pandas** — DataFrames for tabular data
- **polars** — Faster pandas alternative (Rust-based)
- **numpy** — Array math

### ML modeling
- **scikit-learn** — Classical ML (random forest, SVM, etc.)
- **XGBoost / LightGBM** — Gradient boosting (best for tabular)
- **PyTorch** — Deep learning

### Visualization
- **matplotlib** — Low-level, customizable
- **seaborn** — Statistical visualizations
- **plotly** — Interactive charts

### Experiment tracking
- **MLflow** — Open-source, self-hosted
- **Weights & Biases** — Cloud-based, great UI

### Workflow
\`\`\`
Load data (pandas) → EDA (seaborn) → Feature eng (pandas/numpy)
→ Model (sklearn/xgboost) → Evaluate (sklearn.metrics)
→ Track (mlflow) → Deploy (FastAPI + Docker)
\`\`\``,
        tags: ['python', 'machine-learning', 'tools'],
      },
    ],
  },
  {
    creatorIndex: 2,
    name: 'LLM Prompt Engineering',
    description: 'Effective prompting techniques for ChatGPT, Claude, and Gemini',
    color: '#059669',
    category: 'science',
    marketplaceDesc:
      'Battle-tested prompt engineering techniques that actually work. Chain-of-thought, few-shot, system prompts, structured output, and real-world patterns for coding, writing, and analysis tasks.',
    viewCount: 1243,
    cloneCount: 203,
    isFeatured: true,
    items: [
      {
        type: 'note',
        title: 'Core Prompting Techniques',
        body: `## The Prompting Hierarchy

### 1. Zero-shot
Just ask directly. Works for simple tasks.
"Translate this to French: Hello, how are you?"

### 2. Few-shot
Provide examples. The model pattern-matches.
"Classify the sentiment:
'Great product!' → Positive
'Terrible service.' → Negative
'It works fine.' → ?"

### 3. Chain-of-thought (CoT)
"Think step by step" — forces reasoning.
"What is 47 × 23? Let's think step by step."

### 4. Self-consistency
Run CoT multiple times, take majority vote.
Most reliable for math/logic but expensive.

### 5. ReAct (Reason + Act)
Interleave reasoning with tool use.
"Thought: I need to look up the population. Action: search('US population 2025')"

### Rule of thumb
Start simple (zero-shot). Add complexity only when needed.`,
        tags: ['llm', 'prompting', 'techniques'],
      },
      {
        type: 'note',
        title: 'System Prompt Patterns',
        body: `## Writing Effective System Prompts

### Structure
\`\`\`
You are [role] that [capability].

## Rules
- [constraint 1]
- [constraint 2]

## Output Format
[describe expected format]

## Examples
[1-2 examples of ideal input/output]
\`\`\`

### Key patterns
1. **Role assignment**: "You are a senior Python developer reviewing code"
2. **Constraints**: "Never suggest deprecated APIs. Always include error handling."
3. **Output format**: "Respond in JSON with keys: summary, confidence, reasoning"
4. **Persona consistency**: "Maintain a friendly, concise tone. No fluff."

### Anti-patterns
- Don't say "you're the best AI" (doesn't help)
- Don't write paragraphs of context (be concise)
- Don't use threats ("or else") — models don't respond to that`,
        tags: ['llm', 'system-prompts', 'patterns'],
      },
      {
        type: 'note',
        title: 'Structured Output with LLMs',
        body: `## Getting Reliable JSON from LLMs

### Option 1: Prompt engineering
"Respond ONLY with valid JSON. No explanation. Format:
\`\`\`json
{ "summary": "...", "sentiment": "positive|negative|neutral", "confidence": 0.0-1.0 }
\`\`\`"

### Option 2: JSON mode (API)
Most APIs now support a JSON mode flag:
- OpenAI: response_format: { type: "json_object" }
- Anthropic: Use tool_use with a schema
- Gemini: responseMimeType: "application/json"

### Option 3: Function calling / Tool use
Define a schema, model fills it in. Most reliable method.

### Validation pipeline
1. Get JSON from LLM
2. Parse with JSON.parse() (handle errors)
3. Validate with Zod schema
4. If invalid, retry with error message

### Tips
- Always provide an example of the exact format you want
- Use enums for categorical fields
- Keep the schema flat (deeply nested = more errors)`,
        tags: ['llm', 'json', 'structured-output'],
      },
      {
        type: 'note',
        title: 'RAG: Retrieval Augmented Generation',
        body: `## RAG Architecture

### The problem
LLMs have training cutoffs and hallucinate facts. RAG grounds responses in your data.

### How it works
1. **Index**: Split documents into chunks → embed with text-embedding model → store in vector DB
2. **Retrieve**: Embed user query → find top-K similar chunks via cosine similarity
3. **Generate**: Pass retrieved chunks as context → LLM generates answer

### Chunking strategies
- Fixed size (512 tokens) with 50-token overlap — simple, works well
- Semantic chunking — split on topic boundaries
- Sentence-based — split on sentences, group to target size

### Retrieval tips
- Hybrid search: combine vector similarity + keyword search (BM25)
- Re-ranking: use a cross-encoder to re-score top results
- Query expansion: rephrase query for better recall

### Common pitfalls
- Chunks too small → missing context
- Chunks too large → diluted relevance
- Not enough chunks → missing information
- Too many chunks → confusing the LLM`,
        tags: ['llm', 'rag', 'architecture'],
      },
      {
        type: 'link',
        title: 'Anthropic Prompt Engineering Guide',
        url: 'https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview',
        body: 'Official guide from Anthropic on prompting Claude effectively. Excellent section on XML tags, chain-of-thought, and structured outputs.',
        tags: ['llm', 'claude', 'documentation'],
      },
    ],
  },

  // ── Alex Rivera's collections ──
  {
    creatorIndex: 3,
    name: 'Indie Hacker Playbook',
    description: 'Everything I learned building and launching 3 products',
    color: '#F59E0B',
    category: 'business',
    marketplaceDesc:
      'Hard-won lessons from launching 3 indie products (1 failed, 1 acqui-hired, 1 profitable). Covers idea validation, MVPs, pricing, launch strategies, and growing without VC money.',
    viewCount: 756,
    cloneCount: 98,
    isFeatured: false,
    items: [
      {
        type: 'note',
        title: 'Idea Validation Framework',
        body: `## Validate Before You Build

### The validation ladder (cheapest → most expensive)
1. **Google Trends** — Is interest growing or dying?
2. **Reddit/Twitter search** — Are people complaining about this problem?
3. **Landing page test** — Can you get email signups?
4. **Concierge MVP** — Do the service manually for 5 people
5. **Paid pre-orders** — Will anyone pay before it exists?

### Red flags
- "Everyone needs this" (no one needs it)
- You can't find competitors (no market)
- You need to explain the problem (it's not painful enough)
- The target user is "everyone" (it's no one)

### Green flags
- People are already using ugly spreadsheets/hacks to solve it
- Competitors exist but have bad reviews on specific issues
- You've felt this pain yourself
- Someone says "shut up and take my money" on the landing page`,
        tags: ['business', 'validation', 'indie-hacking'],
      },
      {
        type: 'note',
        title: 'Pricing 101 for SaaS',
        body: `## SaaS Pricing Principles

### Rule #1: Charge more than you think
Most indie hackers underprice by 2–5x. If no one complains, you're too cheap.

### Pricing models
- **Flat rate**: $29/mo. Simple. Good for starting out.
- **Usage-based**: Pay per API call/GB/seat. Scales with value delivered.
- **Tiered**: Free → Pro → Team. Most common SaaS model.
- **Per-seat**: $X/user/month. Predictable, grows with team size.

### How to set your price
1. What does the customer currently pay to solve this? (baseline)
2. How much time/money does your solution save? (value)
3. Charge 10–20% of the value delivered
4. Example: Saves 10 hrs/month × $50/hr = $500 value → charge $49–99/mo

### Free tier guidelines
- Generous enough to be genuinely useful
- Limited enough that power users need to upgrade
- Time-based trials convert better than feature-limited free plans`,
        tags: ['saas', 'pricing', 'business'],
      },
      {
        type: 'note',
        title: 'Launch Checklist',
        body: `## Pre-Launch (2 weeks before)
- [ ] Landing page with clear value prop
- [ ] Email capture for waitlist
- [ ] Create accounts: Product Hunt, Twitter/X, Reddit, Hacker News
- [ ] Write launch post drafts (iterate 3x)
- [ ] Prepare demo video/GIF (< 60 seconds)
- [ ] Set up analytics (Plausible or PostHog)
- [ ] Test payment flow end-to-end

## Launch Day
- [ ] Product Hunt: submit at 12:01 AM PT
- [ ] Hacker News: "Show HN" post
- [ ] Twitter thread with demo GIF
- [ ] Reddit posts in relevant subreddits (genuine, not spammy)
- [ ] Email your waitlist
- [ ] Personal outreach to 20 warm contacts

## Post-Launch (week 1)
- [ ] Respond to EVERY comment/question
- [ ] Fix critical bugs within hours
- [ ] Collect testimonials from early users
- [ ] Write a "what I learned" blog post
- [ ] Set up customer feedback channel (Canny, Discord, or email)`,
        tags: ['launch', 'checklist', 'indie-hacking'],
      },
      {
        type: 'link',
        title: 'Indie Hackers',
        url: 'https://www.indiehackers.com/',
        body: 'Community of founders building profitable businesses. Great revenue interviews and milestone posts for inspiration.',
        tags: ['indie-hacking', 'community', 'inspiration'],
      },
      {
        type: 'note',
        title: 'Growth Without Paid Ads',
        body: `## Organic Growth Channels (Ranked by ROI)

### 1. SEO (long game, compounding)
- Write 20 "best X for Y" and "X vs Y" comparison posts
- Target long-tail keywords (less competition)
- Programmatic SEO: generate pages from data (city pages, tool comparisons)

### 2. Community building
- Be helpful on Twitter, Reddit, Discord (don't pitch — help)
- Create a free tool/resource related to your product
- Open-source something useful

### 3. Content marketing
- Write about your journey (building in public)
- Share real numbers (MRR, users, conversion rates)
- "How I built X" posts get massive engagement

### 4. Referral loops
- Give existing users a reason to share (bonus features, credit)
- Make the product inherently shareable (public profiles, embeds)
- "Powered by [Product]" badges on free tier

### 5. Partnerships
- Integrate with popular tools in your space
- Get listed in app marketplaces/directories
- Co-create content with complementary products`,
        tags: ['growth', 'marketing', 'indie-hacking'],
      },
    ],
  },
  {
    creatorIndex: 3,
    name: 'Productivity System',
    description: 'My personal productivity stack and workflows',
    color: '#EAB308',
    category: 'productivity',
    marketplaceDesc:
      'The productivity system I use to ship products while working a day job. Covers time blocking, task management, note-taking workflows, and energy management. No hustle culture — sustainable output.',
    viewCount: 445,
    cloneCount: 62,
    isFeatured: false,
    items: [
      {
        type: 'note',
        title: 'Time Blocking Method',
        body: `## Time Blocking: My Daily Framework

### Morning block (2 hrs) — Deep work
- No meetings, no Slack, no email
- Work on the ONE most important task
- Phone on DND, browser on focus mode

### Midday block (2 hrs) — Collaborative work
- Meetings, code reviews, Slack catch-up
- Quick tasks (< 15 min each)

### Afternoon block (2 hrs) — Creative/exploration
- Side project work
- Learning and reading
- Writing (blog posts, documentation)

### Rules
1. Block time in calendar AS IF they're meetings
2. Batch similar tasks (all emails in one block, all meetings in another)
3. Build in 30-min buffer between blocks
4. Protect your morning block at ALL costs — this is where 80% of value is created`,
        tags: ['productivity', 'time-management', 'deep-work'],
      },
      {
        type: 'note',
        title: 'Energy Management > Time Management',
        body: `## It's Not About Time — It's About Energy

### Track your energy patterns for 1 week
Rate energy 1–10 every 2 hours. You'll find a clear pattern.

### Most people
- Peak energy: 9–11 AM → deep thinking, hard problems
- Medium energy: 2–4 PM → collaborative work, meetings
- Low energy: 4–6 PM → admin tasks, email, easy work

### Design your day around energy
- Never schedule your hardest task during low energy
- Creative work during peak energy
- Routine tasks during low energy (they require less)

### Energy boosters
- 20-min walk after lunch (prevents the 2 PM crash)
- 8-min power nap (set alarm, don't go over)
- Switch task types when energy drops (context switch = mini reset)

### Energy drainers
- Back-to-back meetings (stack them with breaks)
- Decision fatigue (batch decisions, create defaults)
- Multitasking (it's a myth — you're context switching)`,
        tags: ['productivity', 'energy', 'habits'],
      },
      {
        type: 'note',
        title: 'The Capture Habit',
        body: `## Capture Everything, Process Later

### Why
Your brain is for having ideas, not storing them. Every unwritten thought is cognitive overhead.

### The system
1. **Capture** — Write it down immediately (Mindweave, phone notes, voice memo)
2. **Process** — Weekly review: tag, organize, delete
3. **Connect** — Link related ideas. Surprising connections emerge over time.
4. **Create** — Turn connected ideas into content, products, actions

### Tools
- Mindweave (obviously) — AI-tagged, searchable, semantic search
- Physical notebook — For meetings and brainstorming (digitize later)
- Voice memos — For ideas while walking/driving

### Weekly review (30 min, Sunday evening)
- Review all captured items from the week
- Tag and organize into collections
- Star the best ideas for deeper exploration
- Delete anything that no longer resonates`,
        tags: ['productivity', 'note-taking', 'pkm'],
      },
      {
        type: 'link',
        title: 'Cal Newport — Deep Work',
        url: 'https://calnewport.com/deep-work-rules-for-focused-success-in-a-distracted-world/',
        body: 'The book that changed how I structure my work day. Deep work = rare, valuable, and the key to producing at an elite level.',
        tags: ['productivity', 'deep-work', 'books'],
      },
    ],
  },

  // ── Emma Watson's collections ──
  {
    creatorIndex: 4,
    name: 'Tech Career Growth',
    description: 'Level up from senior to staff engineer and beyond',
    color: '#EC4899',
    category: 'career',
    marketplaceDesc:
      'Career advice for developers who want to grow beyond coding. Covers the senior → staff → principal ladder, writing effective docs, influencing without authority, and building your professional brand.',
    viewCount: 678,
    cloneCount: 87,
    isFeatured: true,
    items: [
      {
        type: 'note',
        title: 'The Staff Engineer Skill Set',
        body: `## What Makes a Staff Engineer

### Technical skills (necessary but not sufficient)
- System design at scale
- Making good tradeoffs (not just "the right answer")
- Debugging complex cross-system issues
- Technical writing (RFCs, ADRs, documentation)

### The actual differentiators
1. **Scope**: You identify important problems, not just solve assigned ones
2. **Influence**: You change how your org builds software
3. **Alignment**: You connect technical decisions to business outcomes
4. **Mentoring**: You multiply the team's output, not just your own
5. **Communication**: You translate between executives and engineers

### Common staff archetypes (from Will Larson)
- **Tech Lead**: Drives a specific team's technical direction
- **Architect**: Owns cross-team technical vision
- **Solver**: Tackles the hardest, ambiguous problems
- **Right Hand**: Extends an executive's bandwidth

### What it's NOT
- Writing the most code
- Being the smartest person in the room
- Having the most opinions`,
        tags: ['career', 'staff-engineer', 'growth'],
      },
      {
        type: 'note',
        title: 'Writing Effective RFCs',
        body: `## RFC Template

### Title
[One-line description of the proposal]

### Status
Draft / In Review / Accepted / Rejected

### Context
What's the problem? Why now? What happens if we do nothing?
(2–3 paragraphs max)

### Proposal
What are you proposing? Be specific enough to implement.

### Alternatives Considered
What else did you consider? Why is your proposal better?
(This section builds trust — it shows you did your homework)

### Tradeoffs
- What are we gaining?
- What are we giving up?
- What risks does this introduce?

### Rollout Plan
How do we get from here to there? Phases, migration strategy, rollback plan.

### Open Questions
What's unresolved? What do you need input on?

---

### Tips
- Keep it under 2 pages (no one reads long RFCs)
- Write for the reviewer, not yourself
- Include diagrams (one diagram > 1000 words)
- Circulate a draft to 2–3 people before the full review`,
        tags: ['career', 'writing', 'rfc', 'communication'],
      },
      {
        type: 'note',
        title: '1:1 Meeting Guide for Engineers',
        body: `## Getting the Most from 1:1s with Your Manager

### Come prepared
Bring 2–3 topics. Don't waste the time on status updates (that's what standups are for).

### Good 1:1 topics
- "I'm blocked on X. Here's what I've tried. I need Y."
- "I want to grow toward [goal]. What opportunities do you see?"
- "I noticed [problem]. Here's my proposed solution."
- "I'd like feedback on [specific thing I did this week]."
- "What's the most important thing I could be working on?"

### Career growth questions
- "What would I need to demonstrate to be promoted?"
- "Who in the org is doing great work that I can learn from?"
- "What skills would make me more impactful?"
- "Where do you see the team heading in 6 months?"

### Anti-patterns
- Only talking when there's a problem (build the relationship first)
- Never asking for feedback (your manager has context you don't)
- Complaining without proposing solutions
- Treating it as optional (it's your most leveraged 30 minutes)`,
        tags: ['career', 'management', '1on1', 'growth'],
      },
      {
        type: 'link',
        title: 'StaffEng.com',
        url: 'https://staffeng.com/',
        body: 'Collection of stories from staff+ engineers about what the role actually looks like in practice. Great for understanding the path.',
        tags: ['career', 'staff-engineer', 'stories'],
      },
      {
        type: 'note',
        title: 'Building Your Developer Brand',
        body: `## Developer Branding (Without Being Cringe)

### Why bother?
- Better job opportunities come to you
- Conference speaking invitations
- Open source contributions get noticed
- You become the "go-to person" for your niche

### The formula
Pick ONE niche + ONE platform + consistency.
"I write about [X] every [frequency] on [platform]."

### Content ideas (no original research needed)
- "What I learned this week" posts
- "How I fixed [tricky bug]" writeups
- "X vs Y: when to use which" comparisons
- Explain a concept you just learned (teach to learn)
- Share your dotfiles, setup, or workflow

### Platforms (pick ONE to start)
- **Blog/Newsletter**: Long-form, SEO value, you own it
- **Twitter/X**: Short-form, fast feedback, networking
- **LinkedIn**: Professional, great for career content
- **YouTube**: High effort but high reward per piece
- **Dev.to/Hashnode**: Built-in developer audience

### Consistency > quality
A decent post every week beats a perfect post every quarter.`,
        tags: ['career', 'branding', 'content-creation'],
      },
    ],
  },
  {
    creatorIndex: 4,
    name: 'Learning How to Learn',
    description: 'Evidence-based techniques for faster skill acquisition',
    color: '#F472B6',
    category: 'learning',
    marketplaceDesc:
      'Science-backed learning techniques for developers. Covers spaced repetition, active recall, deliberate practice, and the Feynman technique. Learn anything faster and retain it longer.',
    viewCount: 512,
    cloneCount: 71,
    isFeatured: false,
    items: [
      {
        type: 'note',
        title: 'Spaced Repetition',
        body: `## Spaced Repetition: Remember Anything Forever

### The problem
We forget 50% of new information within 24 hours (Ebbinghaus curve).

### The solution
Review at increasing intervals:
- Day 1: Learn it
- Day 2: Review
- Day 4: Review
- Day 7: Review
- Day 14: Review
- Day 30: Review

Each successful review doubles the interval.

### How to implement
1. **Flashcards**: Use Anki or Mindweave's spaced repetition reminders
2. **Active recall**: Don't re-read — quiz yourself
3. **Keep cards atomic**: One concept per card
4. **Use cloze deletions**: "The time complexity of binary search is {{O(log n)}}"

### What to space-repeat as a developer
- Keyboard shortcuts for your editor
- API method signatures you use often
- Design patterns and when to apply them
- System design concepts (CAP theorem, etc.)
- Language-specific gotchas`,
        tags: ['learning', 'spaced-repetition', 'memory'],
      },
      {
        type: 'note',
        title: 'The Feynman Technique',
        body: `## Feynman Technique: Learn by Teaching

### The 4 steps
1. **Choose a concept** — "What is a closure in JavaScript?"
2. **Explain it simply** — Write as if teaching a 12-year-old. No jargon.
3. **Identify gaps** — Where did you get stuck? Where did you use jargon?
4. **Simplify and refine** — Go back to the source, fill gaps, simplify again.

### Why it works
- Forces active processing (not passive re-reading)
- Exposes gaps in understanding immediately
- Creates mental models, not just memorized facts

### In practice
- Write a blog post explaining the concept
- Explain it to a rubber duck (or a colleague)
- Create a Mindweave note as if writing for someone else
- If you can't explain it simply, you don't understand it well enough

### Richard Feynman's insight
"The first principle is that you must not fool yourself — and you are the easiest person to fool."`,
        tags: ['learning', 'feynman', 'teaching'],
      },
      {
        type: 'note',
        title: 'Deliberate Practice for Developers',
        body: `## Deliberate Practice (Not Just "Practice")

### Regular practice vs deliberate practice
- Regular: Solve LeetCode problems you can already do. Comfortable.
- Deliberate: Tackle problems just beyond your ability. Uncomfortable.

### The framework
1. **Specific goal**: Not "get better at algorithms" → "Solve medium graph problems in 30 min"
2. **Just beyond your ability**: If success rate is >80%, increase difficulty
3. **Immediate feedback**: Run tests, compare to solutions, time yourself
4. **Full attention**: No background music, no Slack, no multitasking

### For developers
- **Coding**: Implement data structures from scratch (not from tutorials)
- **System design**: Redesign a real system (e.g., how would you build Twitter?)
- **Debugging**: Practice with someone else's buggy code
- **Code review**: Review open-source PRs and compare your feedback to maintainer's

### Time investment
- 1 hour of deliberate practice > 4 hours of passive learning
- 30 min/day × 5 days = massive improvement in 3 months`,
        tags: ['learning', 'deliberate-practice', 'skills'],
      },
      {
        type: 'link',
        title: 'Learning How to Learn — Coursera',
        url: 'https://www.coursera.org/learn/learning-how-to-learn',
        body: 'Free course by Barbara Oakley. Covers focused vs diffuse thinking, chunking, memory techniques, and overcoming procrastination. The most enrolled MOOC ever.',
        tags: ['learning', 'course', 'neuroscience'],
      },
    ],
  },
];

// ── Main seed function ─────────────────────────────────────────────────

async function main() {
  console.log('🏪 Seeding Knowledge Marketplace...\n');

  // 1. Create or find seed creators
  const creatorIds: string[] = [];

  for (const creator of CREATORS) {
    const existing = await db.query.users.findFirst({
      where: eq(users.email, creator.email),
    });

    if (existing) {
      console.log(`  ✓ Creator exists: ${creator.name}`);
      creatorIds.push(existing.id);
    } else {
      const [newUser] = await db
        .insert(users)
        .values({
          name: creator.name,
          email: creator.email,
          emailVerified: new Date(),
          username: creator.username,
          bio: creator.bio,
          image: creator.image,
          isProfilePublic: true,
        })
        .returning();
      console.log(`  ✅ Created creator: ${creator.name} (@${creator.username})`);
      creatorIds.push(newUser.id);
    }
  }

  console.log('');

  // 2. Create collections, content, and marketplace listings
  let collectionsCreated = 0;
  let itemsCreated = 0;
  let listingsCreated = 0;

  for (const col of COLLECTIONS) {
    const userId = creatorIds[col.creatorIndex];
    const creatorName = CREATORS[col.creatorIndex].name;

    // Check if collection already exists (by name + user)
    const existingCollection = await db.query.collections.findFirst({
      where: (c, { and, eq: e }) =>
        and(e(c.userId, userId), e(c.name, col.name)),
    });

    if (existingCollection) {
      console.log(`  ⏭  Skipping "${col.name}" by ${creatorName} (already exists)`);
      continue;
    }

    // Create collection
    const [newCollection] = await db
      .insert(collections)
      .values({
        userId,
        name: col.name,
        description: col.description,
        color: col.color,
        isPublic: true,
      })
      .returning();
    collectionsCreated++;

    // Add owner to collection members
    await db.insert(collectionMembers).values({
      collectionId: newCollection.id,
      userId,
      role: 'owner',
    });

    // Create content items and link to collection
    for (const item of col.items) {
      const [newContent] = await db
        .insert(content)
        .values({
          userId,
          type: item.type,
          title: item.title,
          body: item.body || null,
          url: item.url || null,
          tags: item.tags,
          autoTags: [],
        })
        .returning();

      await db.insert(contentCollections).values({
        contentId: newContent.id,
        collectionId: newCollection.id,
      });

      itemsCreated++;
    }

    // Create marketplace listing
    await db.insert(marketplaceListings).values({
      collectionId: newCollection.id,
      userId,
      category: col.category,
      description: col.marketplaceDesc,
      isFeatured: col.isFeatured,
      viewCount: col.viewCount,
      cloneCount: col.cloneCount,
    });
    listingsCreated++;

    console.log(
      `  ✅ "${col.name}" by ${creatorName} — ${col.items.length} items, ${col.category}, ${col.isFeatured ? '⭐ featured' : ''}`
    );
  }

  console.log('');
  console.log('─'.repeat(50));
  console.log(`  Creators:    ${CREATORS.length}`);
  console.log(`  Collections: ${collectionsCreated} new`);
  console.log(`  Items:       ${itemsCreated} new`);
  console.log(`  Listings:    ${listingsCreated} new`);
  console.log('─'.repeat(50));
  console.log('');
  console.log('🎉 Marketplace seeding complete!');
  console.log('   Visit /marketplace to see the results.');
  console.log('');

  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Seeding failed:', error);
  console.error(error);
  process.exit(1);
});
