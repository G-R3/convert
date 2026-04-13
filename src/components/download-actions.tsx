import { buildDownloadAllUrl } from "../lib/api";

interface DownloadActionsProps {
	doneCount: number;
	cacheIds: string[];
}

export function DownloadActions({ doneCount, cacheIds }: DownloadActionsProps) {
	const hasDownloads = doneCount > 0 && cacheIds.length > 0;

	return (
		<div className="flex flex-wrap items-center gap-3">
			<a
				className={[
					"rounded-full px-4 py-2 text-sm font-semibold transition",
					hasDownloads
						? "bg-cyan-300 text-slate-950 hover:bg-cyan-200"
						: "pointer-events-none bg-white/8 text-slate-500",
				].join(" ")}
				href={hasDownloads ? buildDownloadAllUrl(cacheIds) : undefined}
			>
				Download all
			</a>
			<span className="text-sm text-slate-400">
				{hasDownloads
					? `${doneCount} converted file${doneCount === 1 ? "" : "s"} ready`
					: "Converted files will be available here once processing finishes."}
			</span>
		</div>
	);
}
