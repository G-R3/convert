import type { ConvertedFileResult, OutputFormat } from "./types";

export async function convertFile(file: File, format: OutputFormat) {
	const formData = new FormData();
	formData.set("file", file);
	formData.set("format", format);

	const response = await fetch("/api/convert", {
		body: formData,
		method: "POST",
	});

	if (!response.ok) {
		throw new Error(await getErrorMessage(response));
	}

	return (await response.json()) as ConvertedFileResult;
}

export function buildDownloadAllUrl(cacheIds: string[]) {
	const params = new URLSearchParams();

	for (const cacheId of cacheIds) {
		params.append("id", cacheId);
	}

	return `/api/download-all?${params.toString()}`;
}

async function getErrorMessage(response: Response) {
	try {
		const payload = (await response.json()) as { message?: string };
		return payload.message ?? "Something went wrong during conversion.";
	} catch {
		return "Something went wrong during conversion.";
	}
}
