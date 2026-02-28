/**
 * Content templates for quick capture
 */

export interface ContentTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  type: 'note' | 'link';
  defaultTitle: string;
  bodyTemplate: string;
  defaultTags: string[];
}

export const TEMPLATES: ContentTemplate[] = [
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    icon: 'Users',
    description: 'Capture key points and action items from meetings',
    type: 'note',
    defaultTitle: 'Meeting Notes - {date}',
    bodyTemplate: '### Attendees\n\n*Who was in the meeting?*\n\n### Agenda\n\n*What was discussed?*\n\n### Key Decisions\n\n*What was decided?*\n\n### Action Items\n\n- [ ] *What needs to happen next?*\n',
    defaultTags: ['meeting', 'notes'],
  },
  {
    id: 'book-highlights',
    name: 'Book Highlights',
    icon: 'BookOpen',
    description: 'Save key passages and notes from books',
    type: 'note',
    defaultTitle: 'Book Highlights - {date}',
    bodyTemplate: '### Book Title\n\n*What are you reading?*\n\n### Author\n\n*Who wrote it?*\n\n### Key Highlights\n\n> *Paste your favorite passage here...*\n\n### My Thoughts\n\n*What stood out to you?*\n',
    defaultTags: ['book', 'highlights'],
  },
  {
    id: 'article-summary',
    name: 'Article Summary',
    icon: 'Newspaper',
    description: 'Summarize articles and web content',
    type: 'link',
    defaultTitle: 'Article Summary - {date}',
    bodyTemplate: '### Key Takeaways\n\n- *Main point from the article*\n\n### Summary\n\n*Brief overview in your own words*\n\n### My Notes\n\n*Why does this matter to you?*\n',
    defaultTags: ['article', 'summary'],
  },
  {
    id: 'learning-journal',
    name: 'Learning Journal',
    icon: 'GraduationCap',
    description: 'Document what you learned today',
    type: 'note',
    defaultTitle: 'Learning Journal - {date}',
    bodyTemplate: '### What I Learned\n\n*Describe the concept or skill*\n\n### How I Can Apply This\n\n*Where will you use this?*\n\n### Questions to Explore\n\n- *What do you still want to know?*\n',
    defaultTags: ['learning', 'journal'],
  },
  {
    id: 'project-idea',
    name: 'Project Idea',
    icon: 'Lightbulb',
    description: 'Capture and flesh out project ideas',
    type: 'note',
    defaultTitle: 'Project Idea - {date}',
    bodyTemplate: '### Idea\n\n*Describe your idea in one sentence*\n\n### Problem It Solves\n\n*Who benefits and why?*\n\n### Key Features\n\n- *Core feature or capability*\n\n### Next Steps\n\n- [ ] *First thing to do*\n',
    defaultTags: ['project', 'idea'],
  },
];

/**
 * Get a template by ID
 */
export function getTemplate(id: string): ContentTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

/**
 * Fill template placeholders with current date/time
 */
export function fillTemplatePlaceholders(str: string): string {
  const now = new Date();
  const date = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const time = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return str.replace(/\{date\}/g, date).replace(/\{time\}/g, time);
}
