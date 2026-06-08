import type { QRL } from '@builder.io/qwik';

export type FileUploadMode = 'document' | 'bulk';

export type FileUploadItem = {
  id: string;
  name: string;
  sizeLabel?: string;
  status?: 'ready' | 'uploaded' | 'error';
  message?: string;
};

export type FileUploadProps = {
  label: string;
  description?: string;
  mode?: FileUploadMode;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  error?: string;
  helpText?: string;
  maxSizeLabel?: string;
  templateLabel?: string;
  files?: FileUploadItem[];
  onBrowse$?: QRL<() => void>;
  onTemplate$?: QRL<() => void>;
  onRemove$?: QRL<(file: FileUploadItem) => void>;
};
