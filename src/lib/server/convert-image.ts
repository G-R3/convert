import os from "node:os";
import path from "node:path";

import sharp from "sharp";
import type { OutputFormat } from "../types";
import { createConcurrencyLimiter } from "./concurrency";
import { putCachedFile } from "./file-cache";

const serverConcurrency = Math.max(1, Math.min(os.cpus().length, 4));
const limitConversion = createConcurrencyLimiter(serverConcurrency);

sharp.concurrency(serverConcurrency);

export async function convertImage(input: {
	buffer: Buffer;
	filename: string;
	format: OutputFormat;
}) {
	return limitConversion(async () => {
		const startedAt = performance.now();
		const normalizedFilename = input.filename.trim();
		const sourceBaseName =
			path.basename(normalizedFilename, path.extname(normalizedFilename)) ||
			"converted";

		const pipeline = sharp(input.buffer, {
			failOn: "warning",
			limitInputPixels: false,
		})
			.rotate()
			.keepMetadata()
			.keepIccProfile();

		const metadata = await pipeline.clone().metadata();

		const output =
			input.format === "png"
				? await pipeline
						.clone()
						.png({ compressionLevel: 2, effort: 1 })
						.toBuffer()
				: await pipeline
						.clone()
						.jpeg({
							chromaSubsampling: "4:4:4",
							mozjpeg: true,
							progressive: true,
							quality: 96,
						})
						.toBuffer();

		const filename = `${sourceBaseName}.${input.format === "png" ? "png" : "jpg"}`;
		const contentType = input.format === "png" ? "image/png" : "image/jpeg";
		const cacheId = putCachedFile({
			buffer: output,
			contentType,
			filename,
		});

		return {
			cacheId,
			contentType,
			downloadUrl: `/api/files/${cacheId}`,
			elapsedMs: Math.round(performance.now() - startedAt),
			filename,
			height: metadata.height ?? null,
			size: output.byteLength,
			sourceFormat: metadata.format ?? null,
			width: metadata.width ?? null,
		};
	});
}
