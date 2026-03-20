import type { LandingPageData } from '@/components/seo/LandingPageTemplate';

export interface FeaturePageData extends LandingPageData {
  title: string;
  description: string;
  targetKeyword: string;
  docsLink: string;
}

export const featurePages: Record<string, FeaturePageData> = {
  'semantic-search': {
    title: 'Semantic Search for Notes — Mindweave',
    description:
      'Find any note or idea instantly using natural language. Mindweave semantic search understands meaning, not just keywords.',
    targetKeyword: 'semantic search notes',
    docsLink: '/docs/features/search',
    hero: {
      title: 'Find Anything — Even When You Forget the Words',
      subtitle:
        "Stop hunting through folders and failed keyword searches. Mindweave's semantic search understands what you mean, surfacing the right notes even when you can't remember exactly how you wrote them.",
      cta: { text: 'Try Semantic Search Free', href: '/register' },
    },
    problem: {
      title: 'Keyword Search Fails You at the Worst Moment',
      paragraphs: [
        'You wrote a brilliant insight three months ago. Now you need it. You try "productivity," then "focus," then "deep work." Nothing useful comes back. The note is there — you just cannot find it.',
        'Traditional search matches strings, not ideas. One synonym away and your entire knowledge base becomes invisible. The more notes you capture, the harder retrieval gets — the opposite of what a knowledge tool should do.',
        'Meaningful ideas are rarely encoded in predictable keywords. They live in context, in metaphors, in half-formed thoughts. You need a search engine that thinks like you do.',
      ],
    },
    solution: {
      title: 'Search by Meaning, Not Memory',
      description:
        'Mindweave embeds every note you capture into a high-dimensional vector space using Google Gemini\'s text-embedding-004 model. When you search, your query is embedded the same way and matched against your notes by semantic similarity — so "staying focused at work" finds notes about Pomodoro timers, flow state, and deep work, even if none of those words appear in your query.',
    },
    features: [
      {
        icon: 'Search',
        title: 'Natural Language Queries',
        description:
          'Ask questions in plain English. "What did I learn about negotiation?" returns relevant notes instantly, regardless of original wording.',
      },
      {
        icon: 'Brain',
        title: 'Gemini-Powered Embeddings',
        description:
          'Every note is encoded into 768-dimensional vectors using Google Gemini — one of the most capable embedding models available.',
      },
      {
        icon: 'Zap',
        title: 'Sub-Second Results',
        description:
          "pgvector's HNSW index returns approximate nearest-neighbor results in milliseconds, even across thousands of notes.",
      },
      {
        icon: 'Sparkles',
        title: 'Combined Keyword + Semantic',
        description:
          'Run full-text keyword search and semantic search side by side. Get the best of both worlds in a single interface.',
      },
    ],
    socialProof: { githubStars: 4, testCount: '2,675+' },
  },

  'ai-tagging': {
    title: 'Auto Tag Notes with AI — Mindweave',
    description:
      "Let AI automatically tag your notes and bookmarks as you capture them. Mindweave organizes your knowledge so you don't have to.",
    targetKeyword: 'auto tag notes ai',
    docsLink: '/docs/features/tagging',
    hero: {
      title: 'Your Notes, Organized Before You Even Close the Tab',
      subtitle:
        'Manual tagging is a chore nobody keeps up with. Mindweave uses Google Gemini to read every note you capture and apply precise, consistent tags automatically — so your knowledge base stays organized without the overhead.',
      cta: { text: 'Start Auto-Tagging Free', href: '/register' },
    },
    problem: {
      title: "Manual Tagging Sounds Great — Until It Isn't",
      paragraphs: [
        'Every knowledge management system promises the power of tags. In practice, tagging is tedious. You are in flow, you capture a note, and then you have to stop and think: "What tags does this belong under?" It breaks your momentum and you start skipping it.',
        'Then inconsistency creeps in. Sometimes you use "ML," sometimes "machine-learning," sometimes "AI." Notes scatter across tag variants. Your taxonomy becomes a tangle.',
        "The result: a sprawling, under-tagged collection that's harder to navigate than a simple text file. The overhead killed the system.",
      ],
    },
    solution: {
      title: 'Let Gemini Tag Everything for You',
      description:
        "When you save a note or bookmark, Mindweave sends the content to Google Gemini with a structured prompt that extracts 3-7 meaningful tags from the text. These auto-tags appear alongside any tags you choose to add manually, giving you the best of AI precision and personal taxonomy. You capture, Gemini categorizes — it's that simple.",
    },
    features: [
      {
        icon: 'Sparkles',
        title: 'Instant Auto-Tagging on Save',
        description:
          "Tags are generated the moment you capture content. By the time you're reading your saved note, it's already categorized.",
      },
      {
        icon: 'BookOpen',
        title: 'Consistent, Meaningful Tags',
        description:
          'Gemini applies semantically consistent tags — no more "ML" vs. "machine-learning" drift. Your taxonomy stays coherent as your library grows.',
      },
      {
        icon: 'Brain',
        title: 'Understands Context, Not Just Keywords',
        description:
          'The AI reads meaning, not strings. A note about "staying in the zone" gets tagged with "focus," "productivity," and "flow-state" — automatically.',
      },
      {
        icon: 'Zap',
        title: 'Manual Tags Still Work',
        description:
          'Auto-tags and manual tags live side-by-side. Override, supplement, or ignore AI suggestions — you stay in control.',
      },
    ],
    socialProof: { githubStars: 4, testCount: '2,675+' },
  },

  'knowledge-qa': {
    title: 'Knowledge Base Q&A with AI — Mindweave',
    description:
      "Ask questions and get answers sourced from your own notes. Mindweave's RAG-powered Q&A turns your knowledge base into a personal AI assistant.",
    targetKeyword: 'knowledge base qa ai',
    docsLink: '/docs/features/ask',
    hero: {
      title: 'Ask Your Notes a Question. Get a Real Answer.',
      subtitle:
        "Your notes contain the answer — you just can't always find it. Mindweave's Ask feature uses retrieval-augmented generation to pull the most relevant passages from your knowledge base and synthesize a precise answer, with sources you can verify.",
      cta: { text: 'Ask Your Knowledge Base Free', href: '/register' },
    },
    problem: {
      title: "You've Captured Everything. You Can Access Almost Nothing.",
      paragraphs: [
        "Knowledge capture is only half the battle. The other half — retrieval — is where most systems fail. You've diligently saved articles, written notes, and bookmarked ideas for months. But when you actually need an answer, you're back to scrolling and searching.",
        "Generic AI chatbots don't know what you've read. They hallucinate. They don't cite sources. And they can't tell you what you personally learned from a specific book or experience.",
        'What you really need is an AI that knows your notes as well as you do — and can retrieve and reason over them on demand.',
      ],
    },
    solution: {
      title: 'RAG-Powered Q&A Over Your Personal Knowledge Base',
      description:
        'When you ask a question in Mindweave, the system runs a semantic search over your notes to retrieve the most relevant passages. Those passages are assembled into a grounded context window and sent to Google Gemini, which synthesizes a direct answer. Every response is anchored to your actual content — not hallucinated from training data.',
    },
    features: [
      {
        icon: 'Brain',
        title: 'Retrieval-Augmented Generation',
        description:
          'Real RAG, not a chatbot wrapper. Mindweave retrieves the most semantically relevant notes first, then asks Gemini to answer based only on those.',
      },
      {
        icon: 'BookOpen',
        title: 'Cited, Verifiable Answers',
        description:
          'Every answer links back to the source notes it was drawn from, so you can read the original context and trust the response.',
      },
      {
        icon: 'Search',
        title: 'Conversation Memory',
        description:
          'Ask follow-up questions naturally. The chat interface maintains context across your session, refining answers as you dig deeper.',
      },
      {
        icon: 'Star',
        title: 'Grounded in Your Data Only',
        description:
          'Gemini answers based solely on your retrieved notes — reducing hallucination and ensuring every insight is traceable to something you actually captured.',
      },
    ],
    socialProof: { githubStars: 4, testCount: '2,675+' },
  },
};
