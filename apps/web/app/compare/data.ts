import type { LandingPageData } from '@/components/seo/LandingPageTemplate';
import type { ComparisonTableProps } from '@/components/seo/ComparisonTable';

export interface ComparePageData extends LandingPageData {
  title: string;
  description: string;
  targetKeyword: string;
  comparison: ComparisonTableProps;
}

const SOCIAL_PROOF = { githubStars: 4, testCount: '2,675+' };

const COMMON_CTA = { text: 'Try Mindweave Free', href: '/register' };

export const comparePages: Record<string, ComparePageData> = {
  notion: {
    title: 'Mindweave vs Notion',
    description:
      'See how Mindweave compares to Notion. Get semantic search, AI auto-tagging, and knowledge Q&A that Notion simply does not offer — all open source and free forever.',
    targetKeyword: 'mindweave vs notion',
    hero: {
      title: 'Mindweave vs Notion',
      subtitle:
        'Notion is a great workspace tool, but it was not built for personal knowledge management with AI at its core. Mindweave gives you semantic search, AI auto-tagging, and conversational Q&A over your notes — free forever.',
      cta: COMMON_CTA,
    },
    problem: {
      title: 'Why Notion falls short for knowledge management',
      paragraphs: [
        'Notion is an excellent all-in-one workspace, but its AI features are locked behind a paid add-on and focus on document generation rather than helping you rediscover what you already know.',
        'Searching Notion relies on keywords. If you cannot remember the exact phrase you used, finding that insight you captured six months ago becomes a frustrating exercise.',
        'There is no built-in way to ask a question and have Notion synthesize an answer from across your entire knowledge base. You end up doing that work manually.',
      ],
    },
    solution: {
      title: 'A knowledge hub built around AI from the ground up',
      description:
        'Mindweave was designed specifically for capturing and rediscovering personal knowledge. Every note and bookmark is embedded with vector semantics so you can search by meaning, not just keywords. Ask any question and get an answer synthesized from your own knowledge base — no extra subscription required.',
    },
    features: [
      {
        icon: 'Search',
        title: 'Semantic Search',
        description:
          'Find content by meaning, not just keywords. Ask "ideas about distributed systems" and surface every relevant note even if you never used those exact words.',
      },
      {
        icon: 'Sparkles',
        title: 'AI Auto-Tagging',
        description:
          'Every piece of content is automatically tagged by Gemini AI the moment you save it. No manual categorisation required.',
      },
      {
        icon: 'Brain',
        title: 'Knowledge Q&A',
        description:
          'Ask any question and get an answer grounded in your own notes using retrieval-augmented generation (RAG). Notion AI generates text; Mindweave surfaces your knowledge.',
      },
      {
        icon: 'BookOpen',
        title: 'Open Source & Free Forever',
        description:
          'Mindweave is fully open source. No freemium tier, no AI add-on cost — the full feature set is free for everyone.',
      },
    ],
    socialProof: SOCIAL_PROOF,
    comparison: {
      competitor: 'Notion',
      features: [
        { name: 'Note Taking', mindweave: true, competitor: true },
        { name: 'Web Clipper / Bookmarks', mindweave: true, competitor: true },
        { name: 'Rich Text Editing', mindweave: true, competitor: true },
        { name: 'Semantic Search (vector search by meaning)', mindweave: true, competitor: false },
        { name: 'AI Auto-Tagging', mindweave: true, competitor: false },
        { name: 'Knowledge Q&A (RAG)', mindweave: true, competitor: false },
        { name: 'Open Source', mindweave: true, competitor: false },
        { name: 'Free Forever', mindweave: true, competitor: false },
      ],
    },
  },

  obsidian: {
    title: 'Mindweave vs Obsidian',
    description:
      'Compare Mindweave and Obsidian. While Obsidian is powerful for local markdown files, Mindweave adds built-in semantic search, AI auto-tagging, and knowledge Q&A without needing any plugins.',
    targetKeyword: 'mindweave vs obsidian',
    hero: {
      title: 'Mindweave vs Obsidian',
      subtitle:
        'Obsidian is loved for its local-first markdown approach, but AI features require third-party plugins and additional configuration. Mindweave ships with semantic search, auto-tagging, and Q&A out of the box.',
      cta: COMMON_CTA,
    },
    problem: {
      title: 'Why Obsidian requires extra work to get AI features',
      paragraphs: [
        'Obsidian is a powerful tool for building a local graph of markdown files, but semantic search and AI capabilities are not built in — they depend on community plugins that vary in quality and maintenance.',
        'Setting up vector search in Obsidian means installing and configuring multiple plugins, managing API keys separately, and hoping each plugin stays compatible across updates.',
        'There is no integrated Q&A feature. Getting answers from your vault typically means copy-pasting notes into an external chat tool, breaking your focus.',
      ],
    },
    solution: {
      title: 'AI-powered knowledge management without the plugin maze',
      description:
        'Mindweave gives you everything in one place: capture notes and bookmarks, get automatic AI tags, search by meaning, and ask questions about your knowledge base — all working together from day one with no plugin configuration needed.',
    },
    features: [
      {
        icon: 'Search',
        title: 'Built-in Semantic Search',
        description:
          'Vector search is a core feature, not a plugin. Search your entire knowledge base by meaning instantly, with no setup required.',
      },
      {
        icon: 'Sparkles',
        title: 'Automatic AI Tagging',
        description:
          'Gemini AI tags every item on capture. Obsidian requires manual tagging or a plugin; Mindweave does it for you.',
      },
      {
        icon: 'Brain',
        title: 'Native Knowledge Q&A',
        description:
          'Ask questions and get synthesized answers from your notes using RAG. No external tools, no copy-pasting — just ask.',
      },
      {
        icon: 'Zap',
        title: 'Zero Configuration',
        description:
          'Sign up and start capturing. No vault setup, no plugin management, no API key juggling across multiple tools.',
      },
    ],
    socialProof: SOCIAL_PROOF,
    comparison: {
      competitor: 'Obsidian',
      features: [
        { name: 'Note Taking', mindweave: true, competitor: true },
        { name: 'Web Clipper / Bookmarks', mindweave: true, competitor: true },
        { name: 'Rich Text Editing', mindweave: true, competitor: true },
        { name: 'Semantic Search (vector search by meaning)', mindweave: true, competitor: false },
        { name: 'AI Auto-Tagging', mindweave: true, competitor: false },
        { name: 'Knowledge Q&A (RAG)', mindweave: true, competitor: false },
        { name: 'Open Source', mindweave: true, competitor: false },
        { name: 'Free Forever', mindweave: true, competitor: true },
      ],
    },
  },

  evernote: {
    title: 'Mindweave vs Evernote',
    description:
      'Compare Mindweave and Evernote. Evernote pioneered digital note-taking but lacks AI-powered semantic search and knowledge Q&A. Mindweave is open source, free forever, and built for the AI era.',
    targetKeyword: 'mindweave vs evernote',
    hero: {
      title: 'Mindweave vs Evernote',
      subtitle:
        'Evernote pioneered digital note-taking but has not kept pace with AI. Mindweave offers semantic search, AI auto-tagging, and knowledge Q&A — all open source and free, with no subscription required.',
      cta: COMMON_CTA,
    },
    problem: {
      title: 'Why Evernote struggles to keep up with modern AI tools',
      paragraphs: [
        'Evernote was built around keyword search and notebooks. In an era where AI can surface what you mean rather than what you typed, that model shows its age quickly.',
        'Evernote is a freemium product with note count and device limits on the free tier, pushing you toward a paid subscription just to use it across your devices.',
        'There is no way to ask Evernote a question and get an intelligent answer synthesized from your own notes. You are still doing the connecting and summarising yourself.',
      ],
    },
    solution: {
      title: 'The modern, open-source alternative to Evernote',
      description:
        'Mindweave replaces the Evernote workflow with something built for the AI era. Capture notes and links, let AI tag them automatically, find anything by meaning with semantic search, and ask questions to get synthesized answers from your knowledge base — all without a subscription or device limit.',
    },
    features: [
      {
        icon: 'Search',
        title: 'Semantic Search vs Keyword Search',
        description:
          'Evernote searches for words you typed. Mindweave searches for what you meant, surfacing relevant notes even when the wording differs.',
      },
      {
        icon: 'Sparkles',
        title: 'AI Auto-Tagging',
        description:
          'Mindweave tags every item automatically with Gemini AI. No manual notebooks or tags needed — your knowledge is organised from the moment you save it.',
      },
      {
        icon: 'Brain',
        title: 'Knowledge Q&A',
        description:
          'Ask any question and get an answer grounded in your notes. Evernote offers no equivalent; you must do the synthesis yourself.',
      },
      {
        icon: 'BookOpen',
        title: 'Open Source, No Subscription',
        description:
          'Mindweave is fully open source and free forever. No paid tiers, no device limits, no vendor lock-in.',
      },
    ],
    socialProof: SOCIAL_PROOF,
    comparison: {
      competitor: 'Evernote',
      features: [
        { name: 'Note Taking', mindweave: true, competitor: true },
        { name: 'Web Clipper / Bookmarks', mindweave: true, competitor: true },
        { name: 'Rich Text Editing', mindweave: true, competitor: true },
        { name: 'Semantic Search (vector search by meaning)', mindweave: true, competitor: false },
        { name: 'AI Auto-Tagging', mindweave: true, competitor: false },
        { name: 'Knowledge Q&A (RAG)', mindweave: true, competitor: false },
        { name: 'Open Source', mindweave: true, competitor: false },
        { name: 'Free Forever', mindweave: true, competitor: false },
      ],
    },
  },
};
