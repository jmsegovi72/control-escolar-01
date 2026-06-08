export type ComponentCategory = 'primitive' | 'composed' | 'pattern';

export type ComponentStatus = 'ready' | 'draft' | 'planned';

export type ComponentRegistryItem = {
  id: string;
  name: string;
  category: ComponentCategory;
  status: ComponentStatus;
  description: string;
  importPath: string;
  docsPath?: string;
};
