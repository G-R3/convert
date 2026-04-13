import { convertFile } from "./api";
import type { ConversionQueueItem, OutputFormat } from "./types";

export const CLIENT_CONCURRENCY = 4;

export function createQueueItems(files: File[]) {
	return files.map<ConversionQueueItem>((file) => ({
		file,
		id: crypto.randomUUID(),
		status: "queued",
	}));
}

export function filterAcceptedFiles(files: File[]) {
	return files.filter((file) => isTiffFilename(file.name));
}

export function isTiffFilename(filename: string) {
	return /\.(tif|tiff)$/i.test(filename);
}

export function formatBytes(bytes: number) {
	if (bytes < 1024) {
		return `${bytes} B`;
	}

	const units = ["KB", "MB", "GB", "TB"];
	let size = bytes / 1024;
	let unitIndex = 0;

	while (size >= 1024 && unitIndex < units.length - 1) {
		size /= 1024;
		unitIndex += 1;
	}

	return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

interface RunConversionQueueOptions {
	concurrency?: number;
	format: OutputFormat;
	items: ConversionQueueItem[];
	onItemUpdate: (
		itemId: string,
		patch: Partial<
			Pick<ConversionQueueItem, "errorMessage" | "result" | "status">
		>,
	) => void;
}

export async function runConversionQueue({
	concurrency = CLIENT_CONCURRENCY,
	format,
	items,
	onItemUpdate,
}: RunConversionQueueOptions) {
	const pendingItems = items.filter(
		(item) => item.status === "queued" || item.status === "failed",
	);

	if (pendingItems.length === 0) {
		return;
	}

	let nextIndex = 0;

	const runWorker = async () => {
		while (true) {
			const currentIndex = nextIndex;
			nextIndex += 1;

			const item = pendingItems[currentIndex];

			if (!item) {
				return;
			}

			onItemUpdate(item.id, {
				errorMessage: undefined,
				result: undefined,
				status: "processing",
			});

			try {
				const result = await convertFile(item.file, format);

				onItemUpdate(item.id, {
					errorMessage: undefined,
					result,
					status: "done",
				});
			} catch (error) {
				onItemUpdate(item.id, {
					errorMessage:
						error instanceof Error ? error.message : "Conversion failed.",
					result: undefined,
					status: "failed",
				});
			}
		}
	};

	await Promise.all(
		Array.from(
			{ length: Math.min(Math.max(concurrency, 1), pendingItems.length) },
			() => runWorker(),
		),
	);
}
