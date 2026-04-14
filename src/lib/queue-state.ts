import type {
	ConversionQueueItem,
	ConversionQueueItemPatch,
	OutputFormat,
} from "./types";

export interface QueueSummary {
	done: number;
	failed: number;
	processing: number;
	queued: number;
	total: number;
}

function formatCount(count: number, noun: string) {
	return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

export function summarizeQueue(items: ConversionQueueItem[]): QueueSummary {
	return {
		done: items.filter((item) => item.status === "done").length,
		failed: items.filter((item) => item.status === "failed").length,
		processing: items.filter((item) => item.status === "processing").length,
		queued: items.filter((item) => item.status === "queued").length,
		total: items.length,
	};
}

export function hasQueuedItems(items: ConversionQueueItem[]) {
	return items.some((item) => item.status === "queued");
}

export function getCompletedItems(items: ConversionQueueItem[]) {
	return items.filter(
		(
			item,
		): item is ConversionQueueItem & {
			result: NonNullable<ConversionQueueItem["result"]>;
		} => item.status === "done" && item.result !== undefined,
	);
}

export function buildQueueNotice({
	dropNotice,
	format,
	queueSummary,
}: {
	dropNotice: string | null;
	format: OutputFormat;
	queueSummary: QueueSummary;
}) {
	if (queueSummary.total === 0) {
		return dropNotice;
	}

	if (queueSummary.processing > 0) {
		const parts = [
			`${formatCount(queueSummary.processing, "file")} converting to ${format.toUpperCase()}`,
		];

		if (queueSummary.queued > 0) {
			parts.push(`${formatCount(queueSummary.queued, "file")} queued`);
		}

		if (queueSummary.done > 0) {
			parts.push(`${formatCount(queueSummary.done, "file")} complete`);
		}

		return `${parts.join(", ")}.`;
	}

	if (queueSummary.queued > 0) {
		const prefix =
			queueSummary.done > 0
				? `${formatCount(queueSummary.done, "file")} complete, `
				: "";

		return `${prefix}${formatCount(queueSummary.queued, "file")} queued for ${format.toUpperCase()} conversion.`;
	}

	if (queueSummary.failed > 0) {
		const prefix =
			queueSummary.done > 0
				? `${formatCount(queueSummary.done, "file")} complete. `
				: "";

		return `${prefix}${formatCount(queueSummary.failed, "file")} failed and can be retried.`;
	}

	if (queueSummary.done > 0) {
		return `Converted ${formatCount(queueSummary.done, "file")}.`;
	}

	return dropNotice;
}

export function buildAddFilesNotice({
	acceptedCount,
	format,
	skippedCount,
}: {
	acceptedCount: number;
	format: OutputFormat;
	skippedCount: number;
}) {
	if (acceptedCount === 0) {
		return "Only TIFF files are supported right now.";
	}

	if (skippedCount > 0) {
		return `Added ${acceptedCount} TIFF file${
			acceptedCount === 1 ? "" : "s"
		}. Skipped ${skippedCount} unsupported file${
			skippedCount === 1 ? "" : "s"
		}.`;
	}

	return `Queued ${acceptedCount} TIFF file${
		acceptedCount === 1 ? "" : "s"
	} for ${format.toUpperCase()} conversion.`;
}

export function applyQueueItemPatch(
	items: ConversionQueueItem[],
	itemId: string,
	patch: ConversionQueueItemPatch,
): ConversionQueueItem[] {
	return items.map((item) =>
		item.id === itemId ? { ...item, ...patch } : item,
	);
}

export function removeQueueItem(
	items: ConversionQueueItem[],
	itemId: string,
): ConversionQueueItem[] {
	return items.filter((item) => item.id !== itemId);
}

export function retryQueueItem(
	items: ConversionQueueItem[],
	itemId: string,
): ConversionQueueItem[] {
	return items.map((item) =>
		item.id === itemId
			? {
					...item,
					errorMessage: undefined,
					result: undefined,
					status: "queued",
				}
			: item,
	);
}
