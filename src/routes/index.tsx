import { createFileRoute } from "@tanstack/react-router";

import { ConversionList } from "../components/conversion-list";
import { DownloadActions } from "../components/download-actions";
import { Dropzone } from "../components/dropzone";
import { outputFormats } from "../lib/types";
import { useConversionQueue } from "../lib/use-conversion-queue";

export const Route = createFileRoute("/")({ component: App });

export function App() {
	const {
		addFiles,
		doneItems,
		format,
		isConverting,
		items,
		notice,
		queueSummary,
		removeItem,
		retryItem,
		setFormat,
	} = useConversionQueue();

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
						onRemove={removeItem}
						onRetry={retryItem}
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
