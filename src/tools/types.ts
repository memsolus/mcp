import type { MemsolusClient } from '@memsolus/sdk';

export interface JsonSchemaProperty {
  readonly type: string;
  readonly description: string;
  readonly enum?: readonly string[];
}

export interface JsonSchemaObject {
  readonly type: 'object';
  readonly properties: Record<string, JsonSchemaProperty>;
  readonly required?: readonly string[];
}

export interface ToolDefinition {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: JsonSchemaObject;
  readonly handler: (
    args: Record<string, unknown>,
    client: MemsolusClient,
  ) => Promise<unknown>;
}
