const XML_TAG_PATTERN = /<[a-z][a-z0-9-]*(?:\s[^>]*)?>[\s\S]*?<\/[a-z][a-z0-9-]*>/gi;
const SELF_CLOSING_TAG_PATTERN = /<[a-z][a-z0-9-]*(?:\s[^>]*)?\s*\/>/gi;

const PLAN_HEADER_PATTERN = /^#\s+(?:Plan:\s*)?(.+?)$/m;
const IMPLEMENT_PLAN_PREFIX = /^Implement the following plan:\s*/i;

const BOILERPLATE_PREFIXES: readonly RegExp[] = [
  /^Please\s+/i,
  /^Can you\s+/i,
  /^Could you\s+/i,
  /^I want you to\s+/i,
  /^I need you to\s+/i,
  /^I'd like you to\s+/i,
];

const MAX_TITLE_LENGTH = 100;

export const UNTITLED = 'Untitled Session';

export function findFirstMeaningfulTitle(contents: readonly string[]): string {
  for (const content of contents) {
    const title = generateTitle(content);
    if (title !== UNTITLED) {
      return title;
    }
  }
  return UNTITLED;
}

export function stripSystemXmlContent(rawContent: string): string {
  let content = rawContent;
  content = content.replace(XML_TAG_PATTERN, '');
  content = content.replace(SELF_CLOSING_TAG_PATTERN, '');
  content = content.replace(/\s+/g, ' ').trim();
  return content;
}

export function generateTitle(rawContent: string): string {
  // 1. Strip XML tags (preserve newlines for plan header detection)
  let content = rawContent;
  content = content.replace(XML_TAG_PATTERN, '');
  content = content.replace(SELF_CLOSING_TAG_PATTERN, '');
  content = content.trim();

  // 2. Try to extract plan name from markdown header (needs newlines intact)
  const planMatch = IMPLEMENT_PLAN_PREFIX.test(content) ? PLAN_HEADER_PATTERN.exec(content) : null;

  if (planMatch) {
    content = planMatch[1]!.trim();
  } else {
    // 3. Strip "Implement the following plan:" prefix
    content = content.replace(IMPLEMENT_PLAN_PREFIX, '');

    // 4. Strip markdown header prefixes (e.g. "# Title", "## Title")
    content = content.replace(/^#{1,6}\s+/gm, '');

    // 5. Strip boilerplate prefixes
    for (const prefix of BOILERPLATE_PREFIXES) {
      content = content.replace(prefix, '');
    }
  }

  // 6. Clean whitespace — collapse multiple spaces/newlines into single space
  content = content.replace(/\s+/g, ' ').trim();

  // 7. Fallback for empty content
  if (!content) {
    return 'Untitled Session';
  }

  // 8. Truncate smartly at word boundary
  if (content.length > MAX_TITLE_LENGTH) {
    const truncated = content.slice(0, MAX_TITLE_LENGTH);
    const lastSpace = truncated.lastIndexOf(' ');
    content = lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated;
  }

  return content;
}
