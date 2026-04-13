import { buildDownloadAllUrl } from "../lib/api";

interface DownloadActionsProps {
	doneCount: number;
	cacheIds: string[];
}

export function DownloadActions({ doneCount, cacheIds }: DownloadActionsProps) {
	const hasDownloads = doneCount > 0 && cacheIds.length > 0;

	if (!hasDownloads) {
		return null;
	}

	return (
		<a
			className="hover-underline text-xs text-accent underline-offset-4"
			href={buildDownloadAllUrl(cacheIds)}
		>
			Download all — {doneCount} file{doneCount === 1 ? "" : "s"}
		</a>
	);
}
