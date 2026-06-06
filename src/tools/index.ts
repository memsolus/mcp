export type { ToolDefinition } from './types.js';

export {
  addMemoryTool,
  searchMemoriesTool,
  getMemoriesTool,
  getMemoryTool,
  updateMemoryTool,
  deleteMemoryTool,
  promoteMemoryTool,
  submitFeedbackTool,
  getMemoryHistoryTool,
} from './memory.js';

export { getKnowledgeTool, getKnowledgeEntryTool } from './knowledge.js';

export { graphSearchTool, graphTraverseTool, graphQueryTool } from './graph.js';

export {
  getDashboardSummaryTool,
  getMemoryProfileTool,
  listEntitiesTool,
} from './utilities.js';

import { addMemoryTool, searchMemoriesTool, getMemoriesTool, getMemoryTool, updateMemoryTool, deleteMemoryTool, promoteMemoryTool, submitFeedbackTool, getMemoryHistoryTool } from './memory.js';
import { getKnowledgeTool, getKnowledgeEntryTool } from './knowledge.js';
import { graphSearchTool, graphTraverseTool, graphQueryTool } from './graph.js';
import { getDashboardSummaryTool, getMemoryProfileTool, listEntitiesTool } from './utilities.js';
import type { ToolDefinition } from './types.js';

export const allTools: readonly ToolDefinition[] = [
  addMemoryTool,
  searchMemoriesTool,
  getMemoriesTool,
  getMemoryTool,
  updateMemoryTool,
  deleteMemoryTool,
  promoteMemoryTool,
  submitFeedbackTool,
  getMemoryHistoryTool,
  getKnowledgeTool,
  getKnowledgeEntryTool,
  graphSearchTool,
  graphTraverseTool,
  graphQueryTool,
  getDashboardSummaryTool,
  getMemoryProfileTool,
  listEntitiesTool,
];
