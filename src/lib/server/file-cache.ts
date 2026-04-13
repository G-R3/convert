import { randomUUID } from "node:crypto";

interface CacheEntry {
	buffer: Buffer;
	contentType: string;
	filename: string;
	createdAt: number;
}

const RESULT_TTL_MS = 1000 * 60 * 30;
const resultCache = new Map<string, CacheEntry>();

export function putCachedFile(entry: Omit<CacheEntry, "createdAt">) {
	pruneExpiredEntries();

	const cacheId = randomUUID();
	resultCache.set(cacheId, {
		...entry,
		createdAt: Date.now(),
	});

	return cacheId;
}

export function getCachedFile(cacheId: string) {
	pruneExpiredEntries();
	return resultCache.get(cacheId);
}

export function getCachedFiles(cacheIds: string[]) {
	pruneExpiredEntries();

	return cacheIds
		.map((cacheId) => {
			const entry = resultCache.get(cacheId);

			if (!entry) {
				return null;
			}

			return {
				cacheId,
				...entry,
			};
		})
		.filter((entry): entry is NonNullable<typeof entry> => entry !== null);
}

function pruneExpiredEntries() {
	const cutoff = Date.now() - RESULT_TTL_MS;

	for (const [cacheId, entry] of resultCache.entries()) {
		if (entry.createdAt < cutoff) {
			resultCache.delete(cacheId);
		}
	}
}
