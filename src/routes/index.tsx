import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { ConversionList } from "../components/conversion-list";
import { DownloadActions } from "../components/download-actions";
import { Dropzone } from "../components/dropzone";
import {
	createQueueItems,
	filterAcceptedFiles,
	runConversionQueue,
} from "../lib/file-queue";
import {
	type ConversionQueueItem,
	type OutputFormat,
	outputFormats,
} from "../lib/types";

export const Route = createFileRoute("/")({ component: App });

function App() {
	const [items, setItems] = useState<ConversionQueueItem[]>([]);
	const [format, setFormat] = useState<OutputFormat>("jpeg");
	const [isConverting, setIsConverting] = useState(false);
	const [notice, setNotice] = useState<string | null>(null);

	useEffect(() => {
		const hasQueuedItems = items.some((item) => item.status === "queued");

		if (!hasQueuedItems || isConverting) {
			return;
		}

		let isCancelled = false;
		setIsConverting(true);

		void runConversionQueue({
			format,
			items,
			onItemUpdate: (itemId, patch) => {
				setItems((currentItems) =>
					currentItems.map((item) =>
						item.id === itemId ? { ...item, ...patch } : item,
					),
				);
			},
		}).finally(() => {
			if (!isCancelled) {
				setIsConverting(false);
			}
		});

		return () => {
			isCancelled = true;
		};
	}, [format, isConverting, items]);

	const doneItems = useMemo(
		() => items.filter((item) => item.status === "done" && item.result),
		[items],
	);

	const queueSummary = useMemo(() => {
		return {
			done: items.filter((item) => item.status === "done").length,
			failed: items.filter((item) => item.status === "failed").length,
			processing: items.filter((item) => item.status === "processing").length,
			queued: items.filter((item) => item.status === "queued").length,
			total: items.length,
		};
	}, [items]);

	const addFiles = (incomingFiles: File[]) => {
		const acceptedFiles = filterAcceptedFiles(incomingFiles);
		const skippedCount = incomingFiles.length - acceptedFiles.length;

		if (acceptedFiles.length > 0) {
			setItems((currentItems) => [
				...currentItems,
				...createQueueItems(acceptedFiles),
			]);
		}

		if (acceptedFiles.length === 0) {
			setNotice("Only TIFF files are supported right now.");
			return;
		}

		if (skippedCount > 0) {
			setNotice(
				`Added ${acceptedFiles.length} TIFF file${
					acceptedFiles.length === 1 ? "" : "s"
				}. Skipped ${skippedCount} unsupported file${
					skippedCount === 1 ? "" : "s"
				}.`,
			);
			return;
		}

		setNotice(
			`Queued ${acceptedFiles.length} TIFF file${
				acceptedFiles.length === 1 ? "" : "s"
			} for ${format.toUpperCase()} conversion.`,
		);
	};

	return (
		<main className="flex h-screen flex-col overflow-hidden lg:flex-row">
			{/* Left panel — fixed input area */}
			<div className="flex flex-col justify-between border-b border-border px-6 py-10 sm:px-10 sm:py-14 lg:h-screen lg:w-[420px] lg:shrink-0 lg:overflow-y-auto lg:border-b-0 lg:border-r">
				<div>
					<header className="animate-fade-in animate-fade-in-1">
						<h1 className="font-serif text-5xl tracking-tight text-text sm:text-6xl">
							convert.
						</h1>
						<p className="mt-4 text-sm text-text-secondary">
							fast TIFF to JPEG or PNG, locally.
						</p>
					</header>

					<hr className="my-8 border-t border-border" />

					<section className="animate-fade-in animate-fade-in-2">
						<div className="flex items-center gap-6">
							<span className="text-xs uppercase tracking-[0.2em] text-text-muted">
								Output
							</span>
							<div className="flex gap-1">
								{outputFormats.map((value) => {
									const isSelected = value === format;
									return (
										<button
											key={value}
											className={[
												"px-4 py-2 text-sm transition-colors duration-200",
												isSelected
													? "bg-accent text-bg"
													: "text-text-secondary hover:text-text",
											].join(" ")}
											disabled={isConverting}
											onClick={() => setFormat(value)}
											type="button"
										>
											{value.toUpperCase()}
										</button>
									);
								})}
							</div>
						</div>
					</section>

					<section className="animate-fade-in animate-fade-in-3 mt-8">
						<Dropzone disabled={false} onFilesSelected={addFiles} />
					</section>

					{notice ? (
						<div className="animate-fade-in mt-6 border-l-2 border-accent pl-4 text-sm text-text-secondary">
							{notice}
						</div>
					) : null}
				</div>

				<footer className="mt-10 hidden lg:block">
					<hr className="border-t border-border" />
					<p className="mt-4 text-xs text-text-muted">
						convert — local tiff processing
					</p>
				</footer>
			</div>

			{/* Right panel — scrollable queue */}
			<div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-10 sm:px-10 sm:py-14">
				<div className="animate-fade-in animate-fade-in-4 flex items-baseline justify-between">
					<div className="flex items-baseline gap-4">
						<h2 className="font-serif text-2xl text-text">Queue</h2>
						{items.length > 0 ? (
							<span className="text-sm text-text-muted">
								{queueSummary.done} of {queueSummary.total}
							</span>
						) : null}
					</div>
					<DownloadActions
						cacheIds={doneItems.flatMap((item) =>
							item.result ? [item.result.cacheId] : [],
						)}
						doneCount={doneItems.length}
					/>
				</div>

				{queueSummary.failed > 0 ? (
					<p className="mt-3 text-sm text-red-400/80">
						{queueSummary.failed} file
						{queueSummary.failed === 1 ? "" : "s"} failed.
					</p>
				) : null}

				<section className="animate-fade-in animate-fade-in-5 mt-6 flex-1">
					<ConversionList
						items={items}
						onRemove={(itemId) => {
							setItems((currentItems) =>
								currentItems.filter((item) => item.id !== itemId),
							);
						}}
						onRetry={(itemId) => {
							setItems((currentItems) =>
								currentItems.map((item) =>
									item.id === itemId
										? {
												...item,
												errorMessage: undefined,
												result: undefined,
												status: "queued",
											}
										: item,
								),
							);
						}}
					/>
				</section>

				<footer className="mt-10 lg:hidden">
					<hr className="border-t border-border" />
					<p className="mt-4 pb-6 text-center text-xs text-text-muted">
						convert — local tiff processing
					</p>
				</footer>
			</div>
		</main>
	);
}
