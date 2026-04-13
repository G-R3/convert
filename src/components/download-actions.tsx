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
			className="hover-underline group inline-flex items-center gap-2 text-xs text-accent underline-offset-4"
			href={buildDownloadAllUrl(cacheIds)}
		>
			<span>
				Download all — {doneCount} file{doneCount === 1 ? "" : "s"}
			</span>
			<span className="inline-block transition-transform duration-200 group-hover:translate-x-0.5">
				&rarr;
			</span>
		</a>
	);
}
