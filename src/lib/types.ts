export const outputFormats = ["jpeg", "png"] as const;

export type OutputFormat = (typeof outputFormats)[number];

export type QueueStatus = "queued" | "processing" | "done" | "failed";

export interface ConvertedFileResult {
	cacheId: string;
	contentType: string;
	downloadUrl: string;
	elapsedMs: number;
	filename: string;
	height: number | null;
	size: number;
	sourceFormat: string | null;
	width: number | null;
}

export interface ConversionQueueItem {
	errorMessage?: string;
	file: File;
	id: string;
	result?: ConvertedFileResult;
	status: QueueStatus;
}
