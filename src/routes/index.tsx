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
		<main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
			<section className="rounded-[32px] border border-white/10 bg-slate-950/70 p-4 shadow-2xl shadow-black/20 backdrop-blur">
				<div className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
					<div className="space-y-5 rounded-[28px] bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_32%),linear-gradient(160deg,rgba(15,23,42,0.96),rgba(2,6,23,0.96))] p-5 sm:p-7">
						<div className="space-y-3">
							<p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100/70">
								Film scan workflow
							</p>
							<h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
								Convert TIFF files locally with quality-first defaults.
							</h1>
							<p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
								Drop in a batch of film scans, convert them in parallel to JPEG
								or PNG, and download each file on its own or grab everything at
								once when the queue finishes. Nothing is uploaded to a remote
								service.
							</p>
						</div>

						<Dropzone disabled={false} onFilesSelected={addFiles} />
					</div>

					<aside className="space-y-4 rounded-[28px] border border-white/8 bg-white/[0.04] p-5">
						<div className="space-y-2">
							<p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
								Output
							</p>
							<div className="grid grid-cols-2 gap-2">
								{outputFormats.map((value) => {
									const isSelected = value === format;

									return (
										<button
											key={value}
											className={[
												"rounded-2xl px-4 py-3 text-sm font-semibold transition",
												isSelected
													? "bg-cyan-300 text-slate-950"
													: "bg-white/6 text-slate-200 hover:bg-white/10",
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

						<div className="rounded-3xl border border-white/8 bg-black/10 p-4">
							<p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
								Quality defaults
							</p>
							<ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
								<li>
									JPEG uses high quality, progressive output, and 4:4:4 chroma.
								</li>
								<li>
									PNG stays lossless with light compression for faster batches.
								</li>
								<li>Orientation and metadata are preserved when supported.</li>
							</ul>
						</div>

						<div className="rounded-3xl border border-white/8 bg-black/10 p-4">
							<p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
								Queue summary
							</p>
							<div className="mt-4 grid grid-cols-2 gap-3 text-sm">
								<SummaryCard label="Total" value={queueSummary.total} />
								<SummaryCard label="Queued" value={queueSummary.queued} />
								<SummaryCard
									label="Processing"
									value={queueSummary.processing}
								/>
								<SummaryCard label="Done" value={queueSummary.done} />
							</div>
							{queueSummary.failed > 0 ? (
								<p className="mt-3 text-sm text-rose-200">
									{queueSummary.failed} file
									{queueSummary.failed === 1 ? "" : "s"} failed. Retry them from
									the queue below.
								</p>
							) : null}
						</div>

						<div className="rounded-3xl border border-cyan-300/10 bg-cyan-300/[0.06] p-4 text-sm leading-6 text-slate-300">
							Converted files are cached locally in memory for download while
							this app stays open.
						</div>
					</aside>
				</div>
			</section>

			<section className="space-y-4 rounded-[28px] border border-white/10 bg-slate-950/55 p-5 backdrop-blur">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h2 className="text-xl font-semibold text-white">
							Conversion queue
						</h2>
						<p className="text-sm text-slate-400">
							Queued files begin converting automatically and run in parallel.
						</p>
					</div>
					<DownloadActions
						cacheIds={doneItems.flatMap((item) =>
							item.result ? [item.result.cacheId] : [],
						)}
						doneCount={doneItems.length}
					/>
				</div>

				{notice ? (
					<div className="rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.06] px-4 py-3 text-sm text-cyan-50">
						{notice}
					</div>
				) : null}

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
		</main>
	);
}

function SummaryCard({ label, value }: { label: string; value: number }) {
	return (
		<div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3">
			<p className="text-xs uppercase tracking-[0.2em] text-slate-500">
				{label}
			</p>
			<p className="mt-2 text-2xl font-semibold text-white">{value}</p>
		</div>
	);
}
