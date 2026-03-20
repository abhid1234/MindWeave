import type { LandingPageData } from '@/components/seo/LandingPageTemplate';

type UseCasePageData = LandingPageData & {
  title: string;
  description: string;
  targetKeyword: string;
};

export const useCasePages: Record<string, UseCasePageData> = {
  'ai-note-taking': {
    title: 'AI Note Taking App',
    description:
      'Capture ideas instantly and let AI organize them for you. Mindweave is the AI note taking app that tags, connects, and surfaces your notes when you need them most.',
    targetKeyword: 'ai note taking app',
    hero: {
      title: 'The AI Note Taking App That Actually Thinks With You',
      subtitle:
        'Stop fighting your notes. Mindweave uses AI to auto-tag every capture, surface related ideas, and answer questions across your entire knowledge base — so your notes work as hard as you do.',
      cta: { text: 'Start Taking Smarter Notes', href: '/register' },
    },
    problem: {
      title: 'Your Notes Are Piling Up — And You Can Never Find Anything',
      paragraphs: [
        'You capture ideas constantly: meeting notes, article summaries, shower thoughts, research snippets. But days later, when you actually need that insight, it has vanished into a sea of unorganized text.',
        'Manual tagging is tedious and inconsistent. Search returns too many or too few results. You end up re-reading old notes hoping to stumble upon the right one. This is note-taking as archaeology, not productivity.',
        'The problem is not that you take bad notes — it is that your tool forces you to do all the organizational work. A smarter tool should handle that for you.',
      ],
    },
    solution: {
      title: 'AI That Organizes As You Capture',
      description:
        'Mindweave automatically tags every note the moment you save it, using Google Gemini to understand context and meaning — not just keywords. Semantic search finds what you mean, not just what you typed. And when you need an answer, just ask: Mindweave reads across all your notes and responds with evidence.',
    },
    features: [
      {
        icon: 'Sparkles',
        title: 'Instant AI Tagging',
        description:
          'Every note is analyzed and tagged automatically on save. No manual categorization needed — Mindweave infers topics, themes, and entities for you.',
      },
      {
        icon: 'Search',
        title: 'Semantic Search',
        description:
          'Find notes by meaning, not just exact words. Search for "renewable energy" and surface notes about solar panels, wind turbines, and carbon credits.',
      },
      {
        icon: 'Brain',
        title: 'Knowledge Q&A',
        description:
          'Ask questions in plain English and get answers grounded in your own notes. Mindweave cites exactly which captures informed each answer.',
      },
      {
        icon: 'Zap',
        title: 'Capture in Seconds',
        description:
          'A focused capture form keeps friction near zero. Paste a link, type a thought, or upload a file — Mindweave handles the rest.',
      },
    ],
    socialProof: { githubStars: 4, testCount: '2,675+' },
  },

  'second-brain': {
    title: 'Second Brain App',
    description:
      'Build a second brain that remembers everything for you. Mindweave connects your notes, bookmarks, and learnings into a living knowledge graph you can query with AI.',
    targetKeyword: 'second brain app',
    hero: {
      title: 'Build a Second Brain That Never Forgets',
      subtitle:
        'Mindweave is the second brain app that captures everything you learn, automatically connects related ideas, and lets you query your knowledge in plain English — like having a research assistant who has read all your notes.',
      cta: { text: 'Build Your Second Brain', href: '/register' },
    },
    problem: {
      title: "You're Learning Constantly — But Most of It Disappears",
      paragraphs: [
        'Every week you read articles, watch talks, attend meetings, and have ideas. You save them somewhere — a folder, a notes app, bookmarks — with good intentions. But the information siloes up and the connections between ideas never form.',
        'Building a second brain is supposed to solve this. But most tools make you do all the work: manually linking notes, curating tags, writing summaries. It becomes a second job instead of a second brain.',
        'A real second brain should offload cognitive work, not add more.',
      ],
    },
    solution: {
      title: 'AI That Forms the Connections You Would Miss',
      description:
        'Mindweave builds your second brain automatically. Drop in notes, links, and files — the AI tags them, creates vector embeddings that understand meaning, and surfaces related items when you view any capture. Over time, Mindweave becomes a living map of everything you know, queryable in plain English.',
    },
    features: [
      {
        icon: 'Brain',
        title: 'Automatic Knowledge Graph',
        description:
          'Mindweave uses vector embeddings to map semantic relationships between all your captures — surfacing connections you would never find manually.',
      },
      {
        icon: 'Search',
        title: 'Query Your Own Mind',
        description:
          'Ask anything. Mindweave searches across your entire knowledge base semantically and answers with citations from your own notes.',
      },
      {
        icon: 'Sparkles',
        title: 'AI-Powered Tagging',
        description:
          'Every capture is categorized automatically. Your second brain stays organized without you lifting a finger.',
      },
      {
        icon: 'BookOpen',
        title: 'Capture Anything',
        description:
          'Notes, URLs, files — Mindweave ingests all formats and makes them searchable and queryable the moment they arrive.',
      },
    ],
    socialProof: { githubStars: 4, testCount: '2,675+' },
  },

  researchers: {
    title: 'Research Note Organizer',
    description:
      'The research note organizer built for deep thinkers. Mindweave uses AI to tag, connect, and query your research so you spend more time thinking and less time hunting for sources.',
    targetKeyword: 'research note organizer',
    hero: {
      title: 'Stop Hunting for Sources. Start Thinking.',
      subtitle:
        'Mindweave is the research note organizer that automatically indexes everything you read, links related papers and ideas, and lets you ask questions across your entire literature — so you can focus on the research, not the filing.',
      cta: { text: 'Organize Your Research', href: '/register' },
    },
    problem: {
      title: 'Researchers Spend More Time Finding Notes Than Writing Them',
      paragraphs: [
        'Academic research generates enormous volumes of notes: paper summaries, interview transcripts, field observations, theoretical musings. The cognitive load of organizing all of it is enormous — and it never stops growing.',
        'Folder hierarchies break down as topics overlap. Keyword search misses synonyms and related concepts. You re-read notes you already have because you can not find them. Connections between ideas get lost.',
        'What researchers need is a tool that handles organization automatically — so the only thing demanding cognitive effort is the research itself.',
      ],
    },
    solution: {
      title: 'A Research Assistant That Has Read Everything You Have',
      description:
        'Mindweave ingests your research notes and literature summaries, tags them using AI, and builds a semantic index across your entire corpus. When you need to remember what a paper said about a specific mechanism, just ask. When you want to find everything related to a concept, search by meaning. Mindweave handles the retrieval so you can handle the reasoning.',
    },
    features: [
      {
        icon: 'Search',
        title: 'Semantic Literature Search',
        description:
          'Find relevant notes and summaries by concept, not just keyword. Mindweave understands synonyms, related theories, and domain-specific language.',
      },
      {
        icon: 'Brain',
        title: 'Cross-Source Q&A',
        description:
          'Ask questions that span multiple papers and note sets. Mindweave synthesizes answers from your full research corpus with citations.',
      },
      {
        icon: 'Sparkles',
        title: 'Automatic Categorization',
        description:
          'AI tags every capture with relevant topics, methods, and entities — so your research library stays organized as it grows.',
      },
      {
        icon: 'BookOpen',
        title: 'Capture Papers and Web Sources',
        description:
          'Save paper summaries, article links, and raw notes in one place. Mindweave makes everything searchable and queryable.',
      },
    ],
    socialProof: { githubStars: 4, testCount: '2,675+' },
  },

  developers: {
    title: 'Developer Knowledge Base',
    description:
      'The developer knowledge base powered by AI. Save code snippets, architecture decisions, debugging notes, and documentation links — then find them instantly with semantic search.',
    targetKeyword: 'developer knowledge base',
    hero: {
      title: 'The Developer Knowledge Base That Finds What You Mean',
      subtitle:
        'Stop grepping your notes for that one Stack Overflow fix. Mindweave is the developer knowledge base that auto-tags your snippets and docs, understands technical context, and answers questions across everything you have ever saved.',
      cta: { text: 'Build Your Dev Knowledge Base', href: '/register' },
    },
    problem: {
      title: 'Every Developer Has the Same Problem: Too Many Notes, Too Hard to Find',
      paragraphs: [
        'You write things down: that obscure Docker networking fix, the architecture decision record from six months ago, the regex you spent an hour crafting. But finding them again means remembering exactly where you put them and what words you used.',
        'Browser bookmarks are a graveyard. Gist is unsearchable. Notion is overkill. Your wiki is out of date. Nothing is connected, and nothing surfaces the right context at the right time.',
        'Developers need a knowledge base as smart as they are — one that understands technical concepts, not just literal strings.',
      ],
    },
    solution: {
      title: 'A Technical Knowledge Base That Understands Code and Context',
      description:
        'Mindweave uses AI embeddings trained on technical content to give semantic search that actually works for developers. Save a note about "fixing CORS in Express" and find it later when you search for "cross-origin request headers" or "preflight error". Ask questions like "how did I configure the database connection pool last time?" and get an answer with a direct link to the relevant note.',
    },
    features: [
      {
        icon: 'Search',
        title: 'Technical Semantic Search',
        description:
          'Search by concept, error message, or technology. Mindweave understands that "OOM killer" and "out of memory" are the same thing.',
      },
      {
        icon: 'Zap',
        title: 'Zero-Friction Capture',
        description:
          'Paste a URL, drop in a code snippet, or type a quick note. Mindweave indexes it immediately and makes it findable from any query.',
      },
      {
        icon: 'Brain',
        title: 'Ask Your Codebase Notes',
        description:
          'Query your saved architecture decisions, debugging notes, and setup guides with natural language — no exact keyword required.',
      },
      {
        icon: 'Sparkles',
        title: 'Auto-Tag by Technology',
        description:
          'AI automatically tags every note with the relevant languages, frameworks, and tools — so your knowledge base stays organized without effort.',
      },
    ],
    socialProof: { githubStars: 4, testCount: '2,675+' },
  },

  students: {
    title: 'AI Study Tool',
    description:
      'The AI study tool that turns your notes into a personal tutor. Mindweave organizes your lecture notes and readings, then lets you quiz yourself and ask questions in plain English.',
    targetKeyword: 'ai study tool',
    hero: {
      title: 'Study Smarter With an AI That Has Read All Your Notes',
      subtitle:
        'Mindweave is the AI study tool that organizes your lecture notes and readings automatically, then lets you ask questions and get answers grounded in your own material — like having a tutor who knows exactly what your professor covered.',
      cta: { text: 'Study Smarter Today', href: '/register' },
    },
    problem: {
      title: 'Your Notes Are Everywhere and Exam Week Is Coming',
      paragraphs: [
        'Lectures, textbook chapters, online readings, highlighted PDFs — by the time exams approach, your study material is scattered across a dozen places with no coherent organization. You spend hours just locating the right section before you can even start reviewing.',
        'Passive re-reading is also an inefficient way to study. You need to actively recall and connect concepts. But that is hard when your notes are a linear dump of information with no structure or cross-referencing.',
        'Students need a smarter way to store, organize, and interact with their course material.',
      ],
    },
    solution: {
      title: 'Your Notes, Organized and Ready to Answer Your Questions',
      description:
        'Mindweave automatically organizes everything you save with AI tagging, then builds a semantic index across all your course material. Before an exam, ask it "explain the difference between monetary and fiscal policy" and it will answer using your own lecture notes and readings — with citations. It is studying with an AI tutor who only knows what your professor taught.',
    },
    features: [
      {
        icon: 'Brain',
        title: 'Ask Questions About Your Material',
        description:
          'Get explanations of course concepts using your own notes as the source. No hallucinations — Mindweave only answers from what you have saved.',
      },
      {
        icon: 'Search',
        title: 'Find Anything in Seconds',
        description:
          'Search your notes semantically. Find every mention of a concept across all your lecture notes and readings instantly.',
      },
      {
        icon: 'Sparkles',
        title: 'Auto-Organize by Topic',
        description:
          'AI tags every note with the relevant subject, topic, and subtopic — so your study library is always organized, even when you capture in a hurry.',
      },
      {
        icon: 'BookOpen',
        title: 'Capture Lectures and Readings',
        description:
          'Paste in lecture summaries, article links, and reading notes. Mindweave makes them all searchable and queryable from one place.',
      },
    ],
    socialProof: { githubStars: 4, testCount: '2,675+' },
  },

  'open-source': {
    title: 'Open Source Note Taking',
    description:
      'Mindweave is an open-source note taking app with AI superpowers. Self-host it, inspect the code, and own your data — no vendor lock-in, no black boxes.',
    targetKeyword: 'open source note taking',
    hero: {
      title: 'Open Source Note Taking With AI — Own Your Knowledge',
      subtitle:
        'Mindweave is fully open source. Inspect every line of code, self-host on your own infrastructure, and use AI-powered search and tagging without handing your notes to a third-party cloud service.',
      cta: { text: 'Get Started for Free', href: '/register' },
    },
    problem: {
      title: 'Proprietary Note Apps Are Black Boxes With Your Most Sensitive Data',
      paragraphs: [
        'Your notes contain your most private thinking: business strategies, personal reflections, research in progress, passwords and credentials. Most note-taking apps ask you to trust them with all of it — while offering no visibility into how your data is stored, processed, or potentially shared.',
        'Vendor lock-in is real. Proprietary formats and closed APIs mean migrating your knowledge base is painful or impossible. And AI features in closed-source apps mean your notes are being sent to opaque third-party models with no way to audit what happens next.',
        'For privacy-conscious users and developers, closed-source note apps are a non-starter.',
      ],
    },
    solution: {
      title: 'Full Transparency. Full Control. Full AI.',
      description:
        'Mindweave is open source under MIT — every component, every server action, every AI integration is readable and auditable. Self-host it on your own server and your notes never leave your infrastructure. Or use the hosted version knowing exactly how it works. Either way, you get full AI-powered tagging, semantic search, and knowledge Q&A with no black boxes.',
    },
    features: [
      {
        icon: 'Star',
        title: 'MIT Licensed and Auditable',
        description:
          'Every line of code is public. Audit the AI integrations, the database schema, and the auth layer — then decide if you trust it.',
      },
      {
        icon: 'Zap',
        title: 'Self-Host on Your Infrastructure',
        description:
          'Deploy Mindweave on your own server with Docker. Your notes stay on your hardware, your network, your terms.',
      },
      {
        icon: 'Sparkles',
        title: 'AI Features Without Sacrifice',
        description:
          'Get auto-tagging, semantic search, and knowledge Q&A — powered by Google Gemini — without giving up transparency or control.',
      },
      {
        icon: 'Brain',
        title: 'No Vendor Lock-In',
        description:
          'Open schema, open API, open data. Migrate your notes any time. Mindweave will never hold your knowledge hostage.',
      },
    ],
    socialProof: { githubStars: 4, testCount: '2,675+' },
  },
};
