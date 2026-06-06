import type { MemsolusClient } from '@memsolus/sdk';

export interface ResourceDefinition {
  readonly uri: string;
  readonly name: string;
  readonly description: string;
  readonly mimeType: string;
  readonly handler: (client: MemsolusClient, params?: Record<string, string>) => Promise<string>;
}

export const workspaceSummaryResource: ResourceDefinition = {
  uri: 'memsolus://workspace/summary',
  name: 'Workspace Summary',
  description: 'KPIs and current state of the workspace',
  mimeType: 'application/json',
  handler: async (client: MemsolusClient) => {
    const summary = await client.dashboard.summary();
    return JSON.stringify(summary);
  },
};

export const knowledgeMergedResource: ResourceDefinition = {
  uri: 'memsolus://knowledge/merged',
  name: 'Merged Knowledge',
  description: 'Complete merged knowledge base in Markdown',
  mimeType: 'application/json',
  handler: async (client: MemsolusClient) => {
    const result = await client.knowledge.list({ merged: true });
    return JSON.stringify(result);
  },
};

export const memoryByIdResource: ResourceDefinition = {
  uri: 'memsolus://memory/{id}',
  name: 'Memory by ID',
  description: 'Individual memory retrieved by its ID',
  mimeType: 'application/json',
  handler: async (client: MemsolusClient, params?: Record<string, string>) => {
    const id = params?.['id'];
    if (!id) {
      throw new Error('memory id is required');
    }
    const memory = await client.memories.get({ id });
    return JSON.stringify(memory);
  },
};

export const entitiesResource: ResourceDefinition = {
  uri: 'memsolus://entities',
  name: 'Entities',
  description: 'List of entities with memory counts',
  mimeType: 'application/json',
  handler: async (client: MemsolusClient) => {
    const entities = await client.entities.list();
    return JSON.stringify(entities);
  },
};

export const allResources: readonly ResourceDefinition[] = [
  workspaceSummaryResource,
  knowledgeMergedResource,
  memoryByIdResource,
  entitiesResource,
];
