import { SERMON_TEMPLATE } from './sermons'

export interface StudyTemplate {
  id: string
  name: string
  description: string
  sections: { id: string; label: string; hint: string }[]
}

export const TEMPLATES: StudyTemplate[] = [
  {
    id: 'soap',
    name: 'SOAP Study',
    description: 'Scripture · Observation · Application · Prayer',
    sections: [
      { id: 'scripture', label: 'Scripture', hint: 'Write out the passage that stood out to you.' },
      { id: 'observation', label: 'Observation', hint: 'What does the text say? Who, what, when, where?' },
      { id: 'application', label: 'Application', hint: 'How does this apply to your life today?' },
      { id: 'prayer', label: 'Prayer', hint: 'Respond to God about what you have seen.' }
    ]
  },
  {
    id: 'inductive',
    name: 'Inductive Study',
    description: 'Observation · Interpretation · Application',
    sections: [
      { id: 'context', label: 'Context', hint: 'Author, audience, setting, surrounding passages.' },
      { id: 'observation', label: 'Observation', hint: 'What does it say? Repeated words, contrasts, lists, connectives.' },
      { id: 'interpretation', label: 'Interpretation', hint: 'What does it mean? What did it mean to the original hearers?' },
      { id: 'application', label: 'Application', hint: 'What must change in me because this is true?' }
    ]
  },
  {
    id: 'word',
    name: 'Word Study',
    description: 'Trace a word through Scripture and its original language',
    sections: [
      { id: 'word', label: 'Word & Definition', hint: 'The word, where it appears, its plain meaning.' },
      { id: 'original', label: 'Original Language', hint: "Hebrew/Greek term, Strong's number, range of meaning." },
      { id: 'usage', label: 'Usage & Cross References', hint: 'Key passages where this word appears; how usage varies.' },
      { id: 'insights', label: 'Insights', hint: 'What the study reveals; conclusions.' }
    ]
  },
  {
    id: 'character',
    name: 'Character Study',
    description: 'Study a person of Scripture',
    sections: [
      { id: 'background', label: 'Background', hint: 'Family, era, setting, key passages about them.' },
      { id: 'events', label: 'Key Events', hint: 'The defining moments of their life.' },
      { id: 'qualities', label: 'Character Qualities', hint: 'Strengths, weaknesses, how they responded to God.' },
      { id: 'lessons', label: 'Lessons', hint: 'What their life teaches; how it points to Christ.' }
    ]
  },
  {
    id: 'chapter',
    name: 'Chapter Summary',
    description: 'Digest one chapter',
    sections: [
      { id: 'title', label: 'Chapter Title', hint: 'Give the chapter a short title of your own.' },
      { id: 'summary', label: 'Summary', hint: 'The chapter in your own words.' },
      { id: 'keyverse', label: 'Key Verse', hint: 'The verse that carries the chapter.' },
      { id: 'takeaway', label: 'Takeaway', hint: 'One thing to keep.' }
    ]
  }
]

/**
 * Sermon notes carry their own structure (lib/sermons.ts) and are written in
 * their own tab, so the template is kept out of the "new study" list — but it
 * is still resolved here, so a sermon prints and lists with proper headings.
 */
export function getTemplate(id: string | null): StudyTemplate | undefined {
  const found = TEMPLATES.find(t => t.id === id)
  if (found) return found
  return id === SERMON_TEMPLATE.id
    ? { ...SERMON_TEMPLATE, sections: SERMON_TEMPLATE.sections.map(s => ({ ...s })) }
    : undefined
}
