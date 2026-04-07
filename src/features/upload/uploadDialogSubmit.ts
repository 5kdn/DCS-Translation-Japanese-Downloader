import type {
  UploadChangeType,
  UploadDialogEntry,
  UploadDialogSelectedFile,
  UploadTargetType,
} from '@/features/upload/uploadDialogDomain';
import type { CreatePrResponseItem } from '@/lib/client';

export type UploadDialogSubmitPayload = {
  fileName: string;
  fileSize: number;
  entries: UploadDialogEntry[];
  selectedFiles: UploadDialogSelectedFile[];
  targetType: UploadTargetType;
  targetName: string;
  selectedChangeTypes: UploadChangeType[];
  title: string;
  description: string;
};

export type UploadDialogSubmitResult = {
  isSuccess: boolean;
  message: string;
  prNumber?: number | null;
  prUrl?: string | null;
  branchName?: string | null;
  commitSha?: string | null;
  note?: string | null;
};

export type UploadDialogSubmitHandler = (payload: UploadDialogSubmitPayload) => Promise<CreatePrResponseItem[]>;
