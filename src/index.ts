export { loadConfig } from '_config';
export type { McpConfig } from '_config';

export { createServer } from './server.js';
export type { ServerInstance } from './server.js';

export { filterByEntitlements } from './entitlements.js';
export type { McpEntitlements, FilteredCapabilities } from './entitlements.js';

export type { ToolDefinition } from '_tools/index';

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
  getKnowledgeTool,
  getKnowledgeEntryTool,
  graphSearchTool,
  graphTraverseTool,
  graphQueryTool,
  getDashboardSummaryTool,
  getMemoryProfileTool,
  listEntitiesTool,
  allTools,
} from '_tools/index';

export type { ResourceDefinition } from '_resources/index';

export {
  workspaceSummaryResource,
  knowledgeMergedResource,
  memoryByIdResource,
  entitiesResource,
  allResources,
} from '_resources/index';

export type { PromptDefinition, PromptArgument } from '_prompts/index';

export {
  recallContextPrompt,
  sessionHandoffPrompt,
  decisionLogPrompt,
  allPrompts,
} from '_prompts/index';
