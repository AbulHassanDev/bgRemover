import { SEO_ROUTE_LIST } from '../data/seoContent';
import { SAMPLE_IMAGES } from '../data/presets';
import { SampleImage } from '../types';

interface ModelContextTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: {
    readOnlyHint?: boolean;
    consequentialHint?: boolean;
    untrustedContentHint?: boolean;
  };
  execute: (input: Record<string, unknown>) => Promise<unknown> | unknown;
}

interface ModelContextContainer {
  registerTool?: (tool: ModelContextTool) => void;
  unregisterTool?: (name: string) => void;
}

interface NavigatorWithModelContext extends Navigator {
  modelContext?: ModelContextContainer;
}

interface DocumentWithModelContext extends Document {
  modelContext?: ModelContextContainer;
}

export interface AgentBridgeCallbacks {
  getState: () => {
    currentPath: string;
    activeTab: string;
    hasImage: boolean;
    imageStatus: string | null;
    batchCount: number;
  };
  navigateRoute: (path: string) => void;
  openBatch: () => void;
  selectSample: (sample: SampleImage) => void;
  resetStudio: () => void;
}

export function registerAgenticTools(callbacks: AgentBridgeCallbacks): () => void {
  const nav = typeof navigator !== 'undefined' ? (navigator as NavigatorWithModelContext) : null;
  const doc = typeof document !== 'undefined' ? (document as DocumentWithModelContext) : null;
  const modelContext =
    (nav?.modelContext && typeof nav.modelContext.registerTool === 'function'
      ? nav.modelContext
      : null) ||
    (doc?.modelContext && typeof doc.modelContext.registerTool === 'function'
      ? doc.modelContext
      : null);

  if (!modelContext || typeof modelContext.registerTool !== 'function') {
    return () => {};
  }

  const registeredNames: string[] = [];

  const tools: ModelContextTool[] = [
    {
      name: 'get_studio_state',
      description:
        'Returns current ClearCut AI studio navigation route, active tab (editor or batch), image processing status, and batch queue count.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      annotations: { readOnlyHint: true, consequentialHint: false },
      execute: () => callbacks.getState(),
    },
    {
      name: 'list_workflows',
      description:
        'Lists all 10 ClearCut AI background removal workflow pages and built-in sample image IDs.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      annotations: { readOnlyHint: true, consequentialHint: false },
      execute: () => ({
        workflows: SEO_ROUTE_LIST.map((r) => ({
          path: r.path,
          name: r.navLabel,
          title: r.title,
          description: r.description,
        })),
        samples: SAMPLE_IMAGES.map((s) => ({
          id: s.id,
          title: s.title,
          category: s.category,
        })),
      }),
    },
    {
      name: 'navigate_workflow',
      description:
        'Navigates to one of the 10 ClearCut AI background removal workflow routes (e.g. /ecommerce-product-cutout or /batch-background-remover).',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            enum: SEO_ROUTE_LIST.map((r) => r.path),
            description: 'Target workflow route path',
          },
        },
        required: ['path'],
      },
      annotations: { readOnlyHint: false, consequentialHint: false },
      execute: (input) => {
        const targetPath = typeof input.path === 'string' ? input.path : '/';
        callbacks.navigateRoute(targetPath);
        return { navigatedTo: targetPath };
      },
    },
    {
      name: 'open_batch_queue',
      description: 'Switches the studio directly to the multi-image Batch Queue & ZIP export view.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      annotations: { readOnlyHint: false, consequentialHint: false },
      execute: () => {
        callbacks.openBatch();
        return { activeTab: 'batch' };
      },
    },
    {
      name: 'run_sample_background_removal',
      description:
        'Loads one of the built-in sample images and immediately runs client-side AI background removal.',
      inputSchema: {
        type: 'object',
        properties: {
          sampleId: {
            type: 'string',
            enum: SAMPLE_IMAGES.map((s) => s.id),
            description: 'ID of the built-in sample image to process',
          },
        },
        required: ['sampleId'],
      },
      annotations: { readOnlyHint: false, consequentialHint: false },
      execute: (input) => {
        const sample = SAMPLE_IMAGES.find((s) => s.id === input.sampleId);
        if (!sample) {
          return { error: 'Unknown sampleId', available: SAMPLE_IMAGES.map((s) => s.id) };
        }
        callbacks.selectSample(sample);
        return { started: true, sampleId: sample.id, title: sample.title };
      },
    },
    {
      name: 'reset_studio',
      description: 'Clears the active studio image and returns to the upload dropzone.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      annotations: { readOnlyHint: false, consequentialHint: false },
      execute: () => {
        callbacks.resetStudio();
        return { reset: true };
      },
    },
  ];

  for (const tool of tools) {
    try {
      modelContext.registerTool(tool);
      registeredNames.push(tool.name);
    } catch {
      // Ignore if browser runtime restricts duplicate registration
    }
  }

  return () => {
    if (typeof modelContext.unregisterTool !== 'function') return;
    for (const name of registeredNames) {
      try {
        modelContext.unregisterTool(name);
      } catch {
        // Ignore cleanup errors
      }
    }
  };
}
