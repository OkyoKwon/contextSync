export const PRD_REQUIREMENT_STATUSES = ['achieved', 'partial', 'not_started'] as const;
export const PRD_ANALYSIS_STATUSES = ['pending', 'analyzing', 'completed', 'failed'] as const;
export const SUPPORTED_PRD_EXTENSIONS = ['.md', '.txt'] as const;
export const MAX_PRD_FILE_SIZE = 512 * 1024; // 512KB
