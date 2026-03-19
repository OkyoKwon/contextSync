export const SESSION_SOURCES = ['claude_code', 'claude_ai', 'api', 'manual'] as const;
export const SESSION_STATUSES = ['active', 'completed', 'archived'] as const;
export const MESSAGE_ROLES = ['user', 'assistant'] as const;
export const MESSAGE_CONTENT_TYPES = ['prompt', 'response', 'plan'] as const;
