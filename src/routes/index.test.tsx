// @vitest-environment jsdom

import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
	ConversionQueueItem,
	ConversionQueueItemPatch,
	ConvertedFileResult,
} from "../lib/types";

const { pendingRuns, runConversionQueueMock, uploadSequence } = vi.hoisted(
	() => ({
		pendingRuns: [] as Array<() => void>,
		runConversionQueueMock: vi.fn(),
		uploadSequence: { value: 0 },
	}),
);

vi.mock("../components/conversion-list", () => ({
	ConversionList: ({
		items,
		onRemove,
		onRetry,
	}: {
		items: Array<
			Pick<ConversionQueueItem, "errorMessage" | "file" | "id" | "status">
		>;
		onRemove: (itemId: string) => void;
		onRetry: (itemId: string) => void;
	}) => (
		<ul>
			{items.map((item) => (
				<li key={item.id}>
					{item.file.name}:{item.status}
					{item.status === "failed" ? (
						<button onClick={() => onRetry(item.id)} type="button">
							retry {item.file.name}
						</button>
					) : null}
					<button onClick={() => onRemove(item.id)} type="button">
						remove {item.file.name}
					</button>
				</li>
			))}
		</ul>
	),
}));

vi.mock("../components/download-actions", () => ({
	DownloadActions: () => null,
}));

vi.mock("../components/dropzone", () => ({
	Dropzone: ({
		onFilesSelected,
	}: {
		disabled: boolean;
		onFilesSelected: (files: File[]) => void;
	}) => (
		<button
			onClick={() => {
				uploadSequence.value += 1;
				onFilesSelected([
					new File(["test"], `scan-${uploadSequence.value}.tif`, {
						type: "image/tiff",
					}),
				]);
			}}
			type="button"
		>
			Upload TIFF
		</button>
	),
}));

vi.mock("../lib/file-queue", async () => {
	const actual =
		await vi.importActual<typeof import("../lib/file-queue")>(
			"../lib/file-queue",
		);

	return {
		...actual,
		runConversionQueue: runConversionQueueMock,
	};
});

import { App } from "./index";

function createResult(file: File): ConvertedFileResult {
	return {
		cacheId: file.name,
		contentType: "image/jpeg",
		downloadUrl: `/downloads/${file.name}`,
		elapsedMs: 25,
		filename: file.name.replace(/\.(tif|tiff)$/i, ".jpg"),
		height: 100,
		size: 128,
		sourceFormat: "tiff",
		width: 100,
	};
}

async function completeNextRun() {
	const completeRun = pendingRuns.shift();

	if (!completeRun) {
		throw new Error("Expected a pending conversion run.");
	}

	await act(async () => {
		completeRun();
		await Promise.resolve();
	});
}

describe("App queue flow", () => {
	afterEach(() => {
		cleanup();
	});

	beforeEach(() => {
		pendingRuns.length = 0;
		uploadSequence.value = 0;

		runConversionQueueMock.mockReset();
		runConversionQueueMock.mockImplementation(
			async ({
				items,
				onItemUpdate,
			}: {
				items: ConversionQueueItem[];
				onItemUpdate: (itemId: string, patch: ConversionQueueItemPatch) => void;
			}) => {
				const queuedItems = items.filter((item) => item.status === "queued");

				for (const item of queuedItems) {
					onItemUpdate(item.id, {
						errorMessage: undefined,
						result: undefined,
						status: "processing",
					});
				}

				await new Promise<void>((resolve) => {
					pendingRuns.push(() => {
						for (const item of queuedItems) {
							onItemUpdate(item.id, {
								errorMessage: undefined,
								result: createResult(item.file),
								status: "done",
							});
						}

						resolve();
					});
				});
			},
		);
	});

	it("continues processing after a completed single upload and refreshes the notice", async () => {
		render(<App />);

		fireEvent.click(screen.getByRole("button", { name: "Upload TIFF" }));

		expect(await screen.findByText("1 file converting to JPEG.")).toBeTruthy();

		await completeNextRun();

		expect(await screen.findByText("Converted 1 file.")).toBeTruthy();
		expect(runConversionQueueMock).toHaveBeenCalledTimes(1);
		expect(screen.getByText("scan-1.tif:done")).toBeTruthy();

		fireEvent.click(screen.getByRole("button", { name: "Upload TIFF" }));

		await waitFor(() => {
			expect(runConversionQueueMock).toHaveBeenCalledTimes(2);
		});

		expect(
			await screen.findByText("1 file converting to JPEG, 1 file complete."),
		).toBeTruthy();

		await completeNextRun();

		expect(await screen.findByText("Converted 2 files.")).toBeTruthy();
		expect(screen.getByText("scan-2.tif:done")).toBeTruthy();
	});

	it("clears the notice after removing the last queue item", async () => {
		render(<App />);

		fireEvent.click(screen.getByRole("button", { name: "Upload TIFF" }));

		expect(await screen.findByText("1 file converting to JPEG.")).toBeTruthy();

		await completeNextRun();

		expect(await screen.findByText("Converted 1 file.")).toBeTruthy();

		fireEvent.click(screen.getByRole("button", { name: "remove scan-1.tif" }));

		await waitFor(() => {
			expect(screen.queryByText("Converted 1 file.")).toBeNull();
		});
	});

	it("retries a failed item and resumes automatic processing", async () => {
		runConversionQueueMock
			.mockImplementationOnce(
				async ({
					items,
					onItemUpdate,
				}: {
					items: ConversionQueueItem[];
					onItemUpdate: (
						itemId: string,
						patch: ConversionQueueItemPatch,
					) => void;
				}) => {
					const queuedItems = items.filter((item) => item.status === "queued");

					for (const item of queuedItems) {
						onItemUpdate(item.id, {
							errorMessage: undefined,
							result: undefined,
							status: "processing",
						});
					}

					for (const item of queuedItems) {
						onItemUpdate(item.id, {
							errorMessage: "Conversion failed.",
							result: undefined,
							status: "failed",
						});
					}
				},
			)
			.mockImplementationOnce(
				async ({
					items,
					onItemUpdate,
				}: {
					items: ConversionQueueItem[];
					onItemUpdate: (
						itemId: string,
						patch: ConversionQueueItemPatch,
					) => void;
				}) => {
					const queuedItems = items.filter((item) => item.status === "queued");

					for (const item of queuedItems) {
						onItemUpdate(item.id, {
							errorMessage: undefined,
							result: undefined,
							status: "processing",
						});
					}

					for (const item of queuedItems) {
						onItemUpdate(item.id, {
							errorMessage: undefined,
							result: createResult(item.file),
							status: "done",
						});
					}
				},
			);

		render(<App />);

		fireEvent.click(screen.getByRole("button", { name: "Upload TIFF" }));

		expect(
			await screen.findByText("1 file failed and can be retried."),
		).toBeTruthy();
		expect(screen.getByText("scan-1.tif:failed")).toBeTruthy();
		expect(runConversionQueueMock).toHaveBeenCalledTimes(1);

		fireEvent.click(screen.getByRole("button", { name: "retry scan-1.tif" }));

		await waitFor(() => {
			expect(runConversionQueueMock).toHaveBeenCalledTimes(2);
		});
		expect(await screen.findByText("Converted 1 file.")).toBeTruthy();
		expect(screen.getByText("scan-1.tif:done")).toBeTruthy();
	});
});
