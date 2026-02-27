'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { users, content, tasks } from '@/lib/db/schema';
import { eq, count } from 'drizzle-orm';
import { generateTags } from '@/lib/ai/gemini';
import { upsertContentEmbedding } from '@/lib/ai/embeddings';
import { generateSummary } from '@/lib/ai/summarization';
import { syncContentToNeo4j } from '@/lib/neo4j/sync';

type OnboardingResult = {
  success: boolean;
  message: string;
  data?: {
    onboardingCompleted: boolean;
    onboardingStep: number;
  };
};

export async function getOnboardingStatus(): Promise<OnboardingResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: 'Unauthorized' };
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { onboardingCompleted: true, onboardingStep: true },
  });

  if (!user) {
    return { success: false, message: 'User not found' };
  }

  return {
    success: true,
    message: 'OK',
    data: {
      onboardingCompleted: user.onboardingCompleted,
      onboardingStep: user.onboardingStep,
    },
  };
}

export async function updateOnboardingStep(step: number): Promise<OnboardingResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: 'Unauthorized' };
  }

  if (step < 0 || step > 4) {
    return { success: false, message: 'Invalid step' };
  }

  await db
    .update(users)
    .set({ onboardingStep: step, updatedAt: new Date() })
    .where(eq(users.id, session.user.id));

  return {
    success: true,
    message: 'Step updated',
    data: { onboardingCompleted: false, onboardingStep: step },
  };
}

export async function completeOnboarding(): Promise<OnboardingResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: 'Unauthorized' };
  }

  await db
    .update(users)
    .set({
      onboardingCompleted: true,
      onboardingStep: 4,
      onboardingCompletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.user.id));

  return {
    success: true,
    message: 'Onboarding completed',
    data: { onboardingCompleted: true, onboardingStep: 4 },
  };
}

export async function skipOnboarding(): Promise<OnboardingResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: 'Unauthorized' };
  }

  await db
    .update(users)
    .set({
      onboardingCompleted: true,
      onboardingSkippedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.user.id));

  return {
    success: true,
    message: 'Onboarding skipped',
    data: { onboardingCompleted: true, onboardingStep: 0 },
  };
}

type SeedResult = {
  success: boolean;
  message: string;
  seeded: number;
};

const SAMPLE_CONTENT = [
  // Productivity & Learning (4 items)
  {
    type: 'note' as const,
    title: 'Try These Demo Tasks to See Mindweave in Action',
    body: 'Welcome to Mindweave! Try these tasks to see what your AI knowledge hub can do:\n\n**Task 1: Semantic Search**\nGo to Search and type: "how to be more focused and productive"\nNotice how it finds results across different topics — productivity, morning routines, even Atomic Habits — by understanding meaning, not just matching keywords.\n\n**Task 2: Knowledge Q&A**\nGo to Ask and try these questions:\n- "What are the best learning techniques?"\n- "Summarize my notes about healthy habits"\n- "What programming concepts have I saved?"\nThe AI reads your saved content and gives you real answers with citations.\n\n**Task 3: Capture Something New**\nGo to Capture and save a note about something you learned today. Watch how AI auto-tags it instantly — no manual organizing needed.\n\n**Task 4: Explore Your Library**\nGo to Library and try filtering by type (notes vs links) or by tags. Click any card to see its full content. Star your favorites.\n\n**Task 5: Cross-Topic Discovery**\nSearch for "self-improvement" and see how it connects book notes, health tips, and productivity systems — content you might not have found with a keyword search.',
    tags: ['getting-started', 'mindweave', 'demo'],
    isFavorite: true,
    daysAgo: 13,
  },
  {
    type: 'note' as const,
    title: 'The Feynman Technique for Learning',
    body: 'The Feynman Technique is a powerful method for understanding complex topics. It has four steps:\n\n1. **Choose a concept** — Pick something you want to understand deeply\n2. **Teach it simply** — Explain it as if teaching a child, using plain language\n3. **Identify gaps** — Notice where your explanation breaks down\n4. **Review and simplify** — Go back to source material, fill gaps, and simplify further\n\nThis technique works because it forces active recall and exposes shallow understanding. Named after physicist Richard Feynman, who was known for making complex physics intuitive.',
    tags: ['learning', 'study-techniques', 'productivity'],
    isFavorite: false,
    daysAgo: 12,
  },
  {
    type: 'note' as const,
    title: 'Daily Productivity System',
    body: 'A simple but effective daily productivity framework:\n\n**Morning (Planning)**\n- Review your top 3 priorities for the day\n- Time-block your calendar for deep work sessions\n- Clear quick tasks (under 2 minutes) first\n\n**Midday (Execution)**\n- Focus on your #1 priority during peak energy hours\n- Use 25-minute Pomodoro intervals for sustained focus\n- Take a proper lunch break away from screens\n\n**Evening (Review)**\n- Log what you accomplished\n- Capture any new ideas or tasks that came up\n- Set tomorrow\'s top 3 priorities\n\nConsistency beats intensity. A steady daily rhythm compounds into massive progress over weeks and months.',
    tags: ['productivity', 'time-management', 'habits'],
    isFavorite: false,
    daysAgo: 11,
  },
  {
    type: 'link' as const,
    title: 'How to Learn Anything Fast - YouTube',
    body: 'A comprehensive video guide on accelerated learning techniques including spaced repetition, active recall, interleaving practice, and the importance of sleep for memory consolidation. Great companion to the Feynman Technique notes.',
    url: 'https://youtube.com',
    tags: ['learning', 'video', 'study-techniques'],
    isFavorite: false,
    daysAgo: 10,
  },
  // Technology & AI (5 items)
  {
    type: 'note' as const,
    title: 'Introduction to Machine Learning',
    body: 'Machine Learning (ML) is a subset of artificial intelligence where systems learn from data rather than being explicitly programmed.\n\n**Key Types:**\n- **Supervised Learning** — Training with labeled data (classification, regression)\n- **Unsupervised Learning** — Finding patterns in unlabeled data (clustering, dimensionality reduction)\n- **Reinforcement Learning** — Learning through trial and error with rewards\n\n**Common Algorithms:**\n- Linear/Logistic Regression\n- Decision Trees & Random Forests\n- Neural Networks & Deep Learning\n- Support Vector Machines\n\n**Practical Applications:** Recommendation systems, image recognition, natural language processing, fraud detection, and autonomous vehicles.',
    tags: ['machine-learning', 'ai', 'technology'],
    isFavorite: true,
    daysAgo: 9,
  },
  {
    type: 'note' as const,
    title: 'JavaScript Async/Await Patterns',
    body: 'Modern JavaScript async patterns for clean, readable asynchronous code:\n\n**Basic Pattern:**\n```javascript\nasync function fetchData() {\n  const response = await fetch("/api/data");\n  return response.json();\n}\n```\n\n**Parallel Execution:**\n```javascript\nconst [users, posts] = await Promise.all([\n  fetchUsers(),\n  fetchPosts()\n]);\n```\n\n**Error Handling:**\n```javascript\ntry {\n  const data = await riskyOperation();\n} catch (error) {\n  handleError(error);\n}\n```\n\n**Key Tips:** Always handle promise rejections. Use Promise.all for independent operations. Avoid sequential awaits when operations can run in parallel.',
    tags: ['javascript', 'programming', 'web-development'],
    isFavorite: false,
    daysAgo: 8,
  },
  {
    type: 'note' as const,
    title: 'Understanding REST API Design',
    body: 'Best practices for designing clean, intuitive REST APIs:\n\n**Resource Naming:**\n- Use nouns, not verbs: `/users` not `/getUsers`\n- Use plural forms: `/articles` not `/article`\n- Nest for relationships: `/users/123/posts`\n\n**HTTP Methods:**\n- GET — Read resources\n- POST — Create resources\n- PUT — Full update\n- PATCH — Partial update\n- DELETE — Remove resources\n\n**Status Codes:**\n- 200 OK, 201 Created, 204 No Content\n- 400 Bad Request, 401 Unauthorized, 404 Not Found\n- 500 Internal Server Error\n\n**Pagination:** Use query params like `?page=2&limit=20` and return total count in response headers or body.',
    tags: ['api-design', 'web-development', 'programming'],
    isFavorite: false,
    daysAgo: 7,
  },
  {
    type: 'link' as const,
    title: 'React Documentation',
    body: 'The official React documentation site. Covers everything from getting started to advanced patterns like server components, hooks, and state management. Essential reference for modern React development.',
    url: 'https://react.dev',
    tags: ['react', 'web-development', 'documentation'],
    isFavorite: false,
    daysAgo: 6,
  },
  {
    type: 'link' as const,
    title: 'PostgreSQL Tutorial',
    body: 'Comprehensive PostgreSQL documentation covering installation, SQL basics, advanced queries, indexing strategies, performance tuning, and extensions like pgvector for AI applications.',
    url: 'https://www.postgresql.org/docs/',
    tags: ['postgresql', 'database', 'documentation'],
    isFavorite: false,
    daysAgo: 5,
  },
  // Health & Wellness (3 items)
  {
    type: 'note' as const,
    title: 'Healthy Meal Prep Ideas',
    body: 'Weekly meal prep strategy for nutritious, balanced eating:\n\n**Sunday Prep (2 hours):**\n- Cook a large batch of grains (brown rice, quinoa)\n- Roast mixed vegetables (sweet potato, broccoli, bell peppers)\n- Prepare 2 protein sources (grilled chicken, baked tofu)\n- Wash and chop salad ingredients\n- Make 2 sauces (tahini dressing, peanut sauce)\n\n**Quick Assembly Meals:**\n- Grain bowls with roasted veggies and protein\n- Salads with mixed greens and toppings\n- Wraps with hummus, veggies, and protein\n- Stir-fry with pre-cut vegetables\n\n**Tips:** Use glass containers for storage. Prep ingredients, not full meals, for variety. Most prepped ingredients last 4-5 days refrigerated.',
    tags: ['health', 'nutrition', 'meal-prep'],
    isFavorite: false,
    daysAgo: 4,
  },
  {
    type: 'note' as const,
    title: 'Morning Routine for Peak Performance',
    body: 'A science-backed morning routine to optimize energy and focus:\n\n**First 30 Minutes:**\n- Get sunlight exposure within 10 minutes of waking (sets circadian rhythm)\n- Hydrate with a full glass of water before coffee\n- 5 minutes of light stretching or movement\n\n**Next 30 Minutes:**\n- Mindfulness meditation (10 minutes) — reduces cortisol, improves focus\n- Journal 3 things you\'re grateful for\n- Review your day\'s top priorities\n\n**Key Principles:**\n- Delay caffeine 90 minutes after waking for best effect\n- Avoid checking phone/email for the first hour\n- Keep the routine under 60 minutes so it\'s sustainable\n\nResearch shows it takes about 66 days to form a habit, so be patient with yourself.',
    tags: ['wellness', 'habits', 'morning-routine'],
    isFavorite: false,
    daysAgo: 3,
  },
  {
    type: 'link' as const,
    title: 'The Science of Sleep',
    body: 'Dr. Andrew Huberman\'s research-based guide on optimizing sleep quality. Covers sleep stages, circadian rhythm management, light exposure protocols, temperature regulation, and evidence-based supplements for better sleep.',
    url: 'https://hubermanlab.com',
    tags: ['health', 'sleep', 'science'],
    isFavorite: false,
    daysAgo: 3,
  },
  // Creative & Personal (3 items)
  {
    type: 'note' as const,
    title: 'Book Notes: Atomic Habits',
    body: 'Key takeaways from James Clear\'s "Atomic Habits":\n\n**The 4 Laws of Behavior Change:**\n1. **Make it Obvious** — Design your environment for success. Use implementation intentions: "I will [behavior] at [time] in [location]"\n2. **Make it Attractive** — Bundle temptations. Pair habits you need with habits you want\n3. **Make it Easy** — Reduce friction for good habits, increase it for bad ones. Start with 2-minute versions\n4. **Make it Satisfying** — Track habits visually. Never miss twice in a row\n\n**Core Ideas:**\n- Habits are the compound interest of self-improvement\n- Focus on systems, not goals\n- Identity-based habits: "I am a person who..." vs "I want to..."\n- The plateau of latent potential — results come after consistent effort',
    tags: ['books', 'habits', 'self-improvement'],
    isFavorite: true,
    daysAgo: 2,
  },
  {
    type: 'note' as const,
    title: 'Travel Bucket List Ideas',
    body: 'Dream destinations and experiences to explore:\n\n**Cultural Immersion:**\n- Kyoto, Japan — temples, tea ceremonies, cherry blossom season\n- Marrakech, Morocco — souks, riads, Sahara desert excursions\n- Oaxaca, Mexico — food scene, mezcal, indigenous crafts\n\n**Natural Wonders:**\n- Iceland — Northern Lights, hot springs, glacier hiking\n- New Zealand — fjords, bungee jumping, Hobbiton\n- Patagonia — Torres del Paine, glaciers, end-of-the-world feel\n\n**City Adventures:**\n- Lisbon, Portugal — historic trams, pastéis de nata, fado music\n- Seoul, South Korea — K-culture, street food, ancient palaces\n\n**Planning Tips:** Travel in shoulder seasons for fewer crowds and lower prices. Learn 10 phrases in the local language. Book accommodations with kitchens to save on food.',
    tags: ['travel', 'personal', 'bucket-list'],
    isFavorite: false,
    daysAgo: 1,
  },
  {
    type: 'link' as const,
    title: 'Markdown Guide',
    body: 'A comprehensive reference for Markdown syntax. Covers basic formatting, links, images, code blocks, tables, and extended syntax. Useful for writing well-formatted notes in Mindweave and documentation.',
    url: 'https://www.markdownguide.org',
    tags: ['writing', 'documentation', 'tools'],
    isFavorite: false,
    daysAgo: 0,
  },
] as const;

const SAMPLE_TASKS = [
  {
    title: 'Try Semantic Search',
    description: 'Go to Search and type "how to be more focused and productive". Notice how it finds results across different topics by understanding meaning, not just matching keywords.',
    status: 'todo',
    priority: 'high',
    daysAgo: 0,
  },
  {
    title: 'Ask your Knowledge Base a Question',
    description: 'Go to Ask AI and try: "What are the best learning techniques?" or "Summarize my notes about healthy habits". The AI reads your saved content and gives answers with citations.',
    status: 'todo',
    priority: 'high',
    daysAgo: 0,
  },
  {
    title: 'Capture your First Note',
    description: 'Go to Capture and save a note about something you learned today. Watch how AI auto-tags it instantly — no manual organizing needed.',
    status: 'todo',
    priority: 'medium',
    daysAgo: 0,
  },
  {
    title: 'Explore your Library',
    description: 'Go to Library and try filtering by type (notes vs links) or by tags. Click any card to see its full content. Star your favorites.',
    status: 'todo',
    priority: 'medium',
    daysAgo: 0,
  },
  {
    title: 'Discover Cross-Topic Connections',
    description: 'Search for "self-improvement" and see how it connects book notes, health tips, and productivity systems — content you might not have found with a keyword search.',
    status: 'todo',
    priority: 'low',
    daysAgo: 0,
  },
];

export async function seedSampleContent(): Promise<SeedResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: 'Unauthorized', seeded: 0 };
  }

  const userId = session.user.id;

  // Guard against double-seeding
  const [{ value: existingCount }] = await db
    .select({ value: count() })
    .from(content)
    .where(eq(content.userId, userId));

  if (existingCount > 0) {
    return { success: true, message: 'User already has content', seeded: 0 };
  }

  const now = new Date();
  const insertValues = SAMPLE_CONTENT.map((item) => {
    const createdAt = new Date(now);
    createdAt.setDate(createdAt.getDate() - item.daysAgo);
    return {
      userId,
      type: item.type,
      title: item.title,
      body: item.body,
      url: 'url' in item ? item.url : undefined,
      tags: [...item.tags],
      isFavorite: item.isFavorite,
      createdAt,
      updatedAt: createdAt,
    };
  });

  const insertedItems = await db
    .insert(content)
    .values(insertValues)
    .returning({ id: content.id });

  // Generate auto-tags and embeddings asynchronously (non-blocking)
  for (let i = 0; i < insertedItems.length; i++) {
    const contentId = insertedItems[i].id;
    const item = SAMPLE_CONTENT[i];

    generateTags({
      title: item.title,
      body: item.body,
      type: item.type,
    })
      .then(async (autoTags) => {
        if (autoTags.length > 0) {
          await db
            .update(content)
            .set({ autoTags })
            .where(eq(content.id, contentId));
        }
      })
      .catch((error) => {
        console.error('Failed to generate auto-tags for seeded content:', contentId, error);
      });

    upsertContentEmbedding(contentId).catch((error) => {
      console.error('Failed to generate embedding for seeded content:', contentId, error);
    });

    // Generate AI summary (fire-and-forget)
    generateSummary({ title: item.title, body: item.body, type: item.type })
      .then(async (summary) => {
        if (summary) {
          await db.update(content).set({ summary }).where(eq(content.id, contentId));
        }
      })
      .catch((error) => {
        console.error('Failed to generate summary for seeded content:', contentId, error);
      });

    // Sync content node to Neo4j (fire-and-forget)
    syncContentToNeo4j(contentId).catch((error) => {
      console.error('Failed to sync seeded content to Neo4j:', contentId, error);
    });
  }

  // Seed sample tasks for the demo
  const taskValues = SAMPLE_TASKS.map((task) => {
    const createdAt = new Date(now);
    createdAt.setDate(createdAt.getDate() - task.daysAgo);
    return {
      userId,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      createdAt,
      updatedAt: createdAt,
    };
  });

  await db.insert(tasks).values(taskValues);

  return {
    success: true,
    message: 'Sample content and tasks seeded successfully',
    seeded: insertedItems.length + taskValues.length,
  };
}
