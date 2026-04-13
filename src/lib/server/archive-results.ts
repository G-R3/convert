import { zipSync } from "fflate";

export function archiveResults(
	files: Array<{
		buffer: Buffer;
		filename: string;
	}>,
) {
	const zipEntries: Record<string, Uint8Array> = {};

	for (const file of files) {
		zipEntries[file.filename] = new Uint8Array(file.buffer);
	}

	return Buffer.from(zipSync(zipEntries, { level: 0 }));
}
