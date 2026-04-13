import { describe, expect, it } from "vitest";

import {
	createQueueItems,
	filterAcceptedFiles,
	formatBytes,
	isTiffFilename,
} from "./file-queue";

describe("file queue helpers", () => {
	it("accepts tif and tiff filenames", () => {
		expect(isTiffFilename("scan-01.tif")).toBe(true);
		expect(isTiffFilename("scan-02.TIFF")).toBe(true);
		expect(isTiffFilename("scan-03.jpg")).toBe(false);
	});

	it("filters out unsupported files", () => {
		const files = [
			new File(["a"], "roll-1.tif", { type: "image/tiff" }),
			new File(["b"], "roll-2.tiff", { type: "image/tiff" }),
			new File(["c"], "notes.txt", { type: "text/plain" }),
		];

		expect(filterAcceptedFiles(files).map((file) => file.name)).toEqual([
			"roll-1.tif",
			"roll-2.tiff",
		]);
	});

	it("creates queued items with ids", () => {
		const items = createQueueItems([
			new File(["a"], "scan-01.tif", { type: "image/tiff" }),
		]);

		expect(items).toHaveLength(1);
		expect(items[0]?.status).toBe("queued");
		expect(items[0]?.id).toBeTruthy();
	});

	it("formats byte counts into readable sizes", () => {
		expect(formatBytes(900)).toBe("900 B");
		expect(formatBytes(2048)).toBe("2.0 KB");
		expect(formatBytes(11 * 1024 * 1024)).toBe("11 MB");
	});
});
