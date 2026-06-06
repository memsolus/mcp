import type { MemsolusClient, MemoryPriority } from '@memsolus/sdk';

export interface PromptArgument {
  readonly name: string;
  readonly description: string;
  readonly required: boolean;
}

export interface PromptDefinition {
  readonly name: string;
  readonly description: string;
  readonly arguments: readonly PromptArgument[];
  readonly handler: (
    args: Record<string, string>,
    client: MemsolusClient,
  ) => Promise<string>;
}

export const recallContextPrompt: PromptDefinition = {
  name: 'recall-context',
  description:
    'Retrieve and format relevant context before a task. Searches memories and loads the knowledge profile for the given topic.',
  arguments: [
    {
      name: 'topic',
      description: 'Topic to search for in stored memories',
      required: true,
    },
  ],
  handler: async (args: Record<string, string>, client: MemsolusClient) => {
    const [searchResult, knowledge] = await Promise.all([
      client.memories.search({ query: args['topic'] as string }),
      client.knowledge.list({ merged: true }),
    ]);

    const memoriesSection = JSON.stringify(searchResult);
    const knowledgeSection = JSON.stringify(knowledge);

    return `## Memories\n${memoriesSection}\n\n## Knowledge\n${knowledgeSection}`;
  },
};

export const sessionHandoffPrompt: PromptDefinition = {
  name: 'session-handoff',
  description:
    'Save relevant context at the end of a session. Stores facts, decisions, and context worth remembering in future sessions.',
  arguments: [
    {
      name: 'summary',
      description: 'Summary of what was done in the session',
      required: true,
    },
  ],
  handler: async (args: Record<string, string>, client: MemsolusClient) => {
    const content = `Session Summary: ${args['summary'] as string}`;

    await client.memories.create({
      content,
      priority: 'HIGH' as MemoryPriority,
    });

    return content;
  },
};

export const decisionLogPrompt: PromptDefinition = {
  name: 'decision-log',
  description:
    'Log a decision with alternatives and justification as a high-priority persistent memory.',
  arguments: [
    {
      name: 'decision',
      description: 'The decision that was made',
      required: true,
    },
    {
      name: 'alternatives',
      description: 'Alternative options that were considered',
      required: false,
    },
    {
      name: 'reason',
      description: 'Justification for why this decision was chosen',
      required: false,
    },
  ],
  handler: async (args: Record<string, string>, client: MemsolusClient) => {
    let content = `Decision: ${args['decision'] as string}`;

    if (args['alternatives']) {
      content = `${content}\nAlternatives: ${args['alternatives']}`;
    }

    if (args['reason']) {
      content = `${content}\nReason: ${args['reason']}`;
    }

    await client.memories.create({
      content,
      priority: 'HIGH' as MemoryPriority,
    });

    return content;
  },
};

export const allPrompts: readonly PromptDefinition[] = [
  recallContextPrompt,
  sessionHandoffPrompt,
  decisionLogPrompt,
];
