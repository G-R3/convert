import { formatBytes } from "../lib/file-queue";
import type { ConversionQueueItem } from "../lib/types";

interface ConversionListProps {
	items: ConversionQueueItem[];
	onRemove: (itemId: string) => void;
	onRetry: (itemId: string) => void;
}

const statusOpacity: Record<ConversionQueueItem["status"], string> = {
	done: "opacity-100",
	failed: "opacity-100",
	processing: "animate-pulse-subtle",
	queued: "opacity-40",
};

export function ConversionList({
	items,
	onRemove,
	onRetry,
}: ConversionListProps) {
	if (items.length === 0) {
		return (
			<div className="border-t border-border py-8 text-sm text-text-muted">
				Your conversion queue is empty. Add a few TIFF scans to get started.
			</div>
		);
	}

	return (
		<div>
			{items.map((item) => {
				const result = item.result;

				return (
					<article
						key={item.id}
						className={[
							"flex flex-col gap-2 border-t border-border py-4 sm:flex-row sm:items-baseline sm:justify-between",
							statusOpacity[item.status],
						].join(" ")}
					>
						<div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4">
							<span className="truncate text-sm text-text">
								{item.file.name}
							</span>

							<span className="flex flex-wrap gap-3 text-xs text-text-muted">
								<span>{formatBytes(item.file.size)}</span>
								{result ? (
									<>
										<span className="text-text-muted">&rarr;</span>
										<span>{formatBytes(result.size)}</span>
										{result.width && result.height ? (
											<span>
												{result.width}&times;{result.height}
											</span>
										) : null}
										<span>{result.elapsedMs}ms</span>
									</>
								) : null}
							</span>
						</div>

						<div className="flex items-baseline gap-4 text-xs">
							<span
								className={
									item.status === "failed"
										? "text-red-400/80"
										: "text-text-muted"
								}
							>
								{item.status}
							</span>

							{result ? (
								<a
									className="hover-underline text-accent underline-offset-4"
									href={result.downloadUrl}
								>
									download
								</a>
							) : null}

							{item.status === "failed" ? (
								<button
									className="hover-underline text-text-secondary underline-offset-4"
									onClick={() => onRetry(item.id)}
									type="button"
								>
									retry
								</button>
							) : null}

							<button
								className="text-text-muted transition-colors hover:text-text-secondary"
								onClick={() => onRemove(item.id)}
								type="button"
							>
								remove
							</button>
						</div>

						{item.errorMessage ? (
							<p className="text-xs text-red-400/70">{item.errorMessage}</p>
						) : null}
					</article>
				);
			})}
		</div>
	);
}
