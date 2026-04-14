import { describe, expect, it } from "vitest";

import {
	applyQueueItemPatch,
	buildAddFilesNotice,
	buildQueueNotice,
	getCompletedItems,
	hasQueuedItems,
	removeQueueItem,
	retryQueueItem,
	summarizeQueue,
} from "./queue-state";
import type { ConversionQueueItem, ConvertedFileResult } from "./types";

function createResult(filename: string): ConvertedFileResult {
	return {
		cacheId: filename,
		contentType: "image/jpeg",
		downloadUrl: `/downloads/${filename}`,
		elapsedMs: 25,
		filename,
		height: 100,
		size: 128,
		sourceFormat: "tiff",
		width: 100,
	};
}

function createItem(
	id: string,
	status: ConversionQueueItem["status"],
	overrides: Partial<ConversionQueueItem> = {},
): ConversionQueueItem {
	return {
		file: new File(["test"], `${id}.tif`, { type: "image/tiff" }),
		id,
		status,
		...overrides,
	};
}

describe("queue state helpers", () => {
	it("summarizes queue counts and completed downloads", () => {
		const items = [
			createItem("queued", "queued"),
			createItem("processing", "processing"),
			createItem("done", "done", {
				result: createResult("done.jpg"),
			}),
			createItem("failed", "failed", {
				errorMessage: "Conversion failed.",
			}),
		];

		expect(summarizeQueue(items)).toEqual({
			done: 1,
			failed: 1,
			processing: 1,
			queued: 1,
			total: 4,
		});
		expect(hasQueuedItems(items)).toBe(true);
		expect(
			getCompletedItems(items).map((item) => item.result.filename),
		).toEqual(["done.jpg"]);
	});

	it("builds queue notices for active, failed, and completed states", () => {
		expect(
			buildQueueNotice({
				dropNotice: "Queued 1 TIFF file for JPEG conversion.",
				format: "jpeg",
				queueSummary: {
					done: 1,
					failed: 0,
					processing: 1,
					queued: 1,
					total: 3,
				},
			}),
		).toBe("1 file converting to JPEG, 1 file queued, 1 file complete.");

		expect(
			buildQueueNotice({
				dropNotice: null,
				format: "png",
				queueSummary: {
					done: 1,
					failed: 2,
					processing: 0,
					queued: 0,
					total: 3,
				},
			}),
		).toBe("1 file complete. 2 files failed and can be retried.");

		expect(
			buildQueueNotice({
				dropNotice: null,
				format: "jpeg",
				queueSummary: {
					done: 2,
					failed: 0,
					processing: 0,
					queued: 0,
					total: 2,
				},
			}),
		).toBe("Converted 2 files.");
	});

	it("builds drop notices for accepted, mixed, and unsupported selections", () => {
		expect(
			buildAddFilesNotice({
				acceptedCount: 2,
				format: "png",
				skippedCount: 0,
			}),
		).toBe("Queued 2 TIFF files for PNG conversion.");

		expect(
			buildAddFilesNotice({
				acceptedCount: 1,
				format: "jpeg",
				skippedCount: 2,
			}),
		).toBe("Added 1 TIFF file. Skipped 2 unsupported files.");

		expect(
			buildAddFilesNotice({
				acceptedCount: 0,
				format: "jpeg",
				skippedCount: 1,
			}),
		).toBe("Only TIFF files are supported right now.");
	});

	it("applies patches, retries failures, and removes items predictably", () => {
		const failedItem = createItem("failed", "failed", {
			errorMessage: "Boom",
		});
		const items = [
			createItem("queued", "queued"),
			failedItem,
			createItem("done", "done", {
				result: createResult("done.jpg"),
			}),
		];

		const patchedItems = applyQueueItemPatch(items, "queued", {
			status: "processing",
		});
		expect(patchedItems[0]?.status).toBe("processing");

		const retriedItems = retryQueueItem(items, failedItem.id);
		expect(retriedItems[1]).toMatchObject({
			errorMessage: undefined,
			result: undefined,
			status: "queued",
		});

		expect(
			removeQueueItem(items, failedItem.id).map((item) => item.id),
		).toEqual(["queued", "done"]);
	});
});
