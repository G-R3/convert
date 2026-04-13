import { unzipSync } from "fflate";
import { describe, expect, it } from "vitest";

import { archiveResults } from "./server/archive-results";

describe("archiveResults", () => {
	it("creates a zip with all converted files", () => {
		const archive = archiveResults([
			{
				buffer: Buffer.from("first-image"),
				filename: "scan-001.jpg",
			},
			{
				buffer: Buffer.from("second-image"),
				filename: "scan-002.png",
			},
		]);

		const unzipped = unzipSync(new Uint8Array(archive));

		expect(Object.keys(unzipped).sort()).toEqual([
			"scan-001.jpg",
			"scan-002.png",
		]);
		expect(Buffer.from(unzipped["scan-001.jpg"] ?? []).toString()).toBe(
			"first-image",
		);
		expect(Buffer.from(unzipped["scan-002.png"] ?? []).toString()).toBe(
			"second-image",
		);
	});
});
