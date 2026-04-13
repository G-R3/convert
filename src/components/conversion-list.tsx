import { formatBytes } from "../lib/file-queue";
import type { ConversionQueueItem } from "../lib/types";

interface ConversionListProps {
	items: ConversionQueueItem[];
	onRemove: (itemId: string) => void;
	onRetry: (itemId: string) => void;
}

const statusClasses: Record<ConversionQueueItem["status"], string> = {
	done: "bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-300/20",
	failed: "bg-rose-400/15 text-rose-200 ring-1 ring-rose-300/20",
	processing: "bg-amber-400/15 text-amber-100 ring-1 ring-amber-300/20",
	queued: "bg-white/10 text-slate-200 ring-1 ring-white/10",
};

export function ConversionList({
	items,
	onRemove,
	onRetry,
}: ConversionListProps) {
	if (items.length === 0) {
		return (
			<div className="rounded-[24px] border border-dashed border-white/12 bg-black/10 px-6 py-10 text-sm text-slate-400">
				Your conversion queue is empty. Add a few TIFF scans to get started.
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{items.map((item) => {
				const result = item.result;

				return (
					<article
						key={item.id}
						className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
					>
						<div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
							<div className="space-y-3">
								<div className="flex flex-wrap items-center gap-2">
									<h3 className="text-sm font-semibold text-white sm:text-base">
										{item.file.name}
									</h3>
									<span
										className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${statusClasses[item.status]}`}
									>
										{item.status}
									</span>
								</div>
								<div className="flex flex-wrap gap-3 text-xs text-slate-400 sm:text-sm">
									<span>Original: {formatBytes(item.file.size)}</span>
									{result ? (
										<>
											<span>Converted: {formatBytes(result.size)}</span>
											<span>
												Size:{" "}
												{result.width && result.height
													? `${result.width} x ${result.height}`
													: "Unknown"}
											</span>
											<span>{result.elapsedMs} ms</span>
										</>
									) : null}
								</div>
								{item.errorMessage ? (
									<p className="text-sm text-rose-200">{item.errorMessage}</p>
								) : null}
							</div>

							<div className="flex flex-wrap gap-2">
								{result ? (
									<a
										className="rounded-full bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
										href={result.downloadUrl}
									>
										Download
									</a>
								) : null}
								{item.status === "failed" ? (
									<button
										className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
										onClick={() => onRetry(item.id)}
										type="button"
									>
										Retry
									</button>
								) : null}
								<button
									className="rounded-full bg-white/6 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/12"
									onClick={() => onRemove(item.id)}
									type="button"
								>
									Remove
								</button>
							</div>
						</div>
					</article>
				);
			})}
		</div>
	);
}
