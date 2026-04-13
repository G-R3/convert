import { type DragEvent, useId, useRef, useState } from "react";

interface DropzoneProps {
	disabled?: boolean;
	onFilesSelected: (files: File[]) => void;
}

export function Dropzone({ disabled = false, onFilesSelected }: DropzoneProps) {
	const inputId = useId();
	const inputRef = useRef<HTMLInputElement>(null);
	const [isDragging, setIsDragging] = useState(false);

	const submitFiles = (files: FileList | null) => {
		if (!files || files.length === 0 || disabled) {
			return;
		}

		onFilesSelected(Array.from(files));
	};

	const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
		event.preventDefault();
		if (!disabled) {
			setIsDragging(true);
		}
	};

	const handleDragLeave = (event: DragEvent<HTMLLabelElement>) => {
		event.preventDefault();
		setIsDragging(false);
	};

	const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
		event.preventDefault();
		setIsDragging(false);
		submitFiles(event.dataTransfer.files);
	};

	return (
		<div className="rounded-[28px] border border-white/10 bg-white/5 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
			<label
				htmlFor={inputId}
				onDragLeave={handleDragLeave}
				onDragOver={handleDragOver}
				onDrop={handleDrop}
				className={[
					"flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-[22px] border border-dashed px-6 py-10 text-center transition",
					isDragging
						? "border-cyan-300 bg-cyan-400/10"
						: "border-white/15 bg-black/10 hover:border-cyan-200/60 hover:bg-white/5",
					disabled ? "cursor-not-allowed opacity-60" : "",
				].join(" ")}
			>
				<input
					ref={inputRef}
					accept=".tif,.tiff,image/tiff"
					className="sr-only"
					disabled={disabled}
					id={inputId}
					multiple
					onChange={(event) => {
						submitFiles(event.target.files);
						event.currentTarget.value = "";
					}}
					type="file"
				/>
				<div className="max-w-xl space-y-4">
					<p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/70">
						Local-only TIFF conversion
					</p>
					<h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
						Drop your TIFF scans here.
					</h2>
					<p className="text-sm leading-7 text-slate-300 sm:text-base">
						Add as many <code>.tif</code> or <code>.tiff</code> files as you
						want. Everything is processed locally, conversions run in parallel,
						and finished files stay ready for individual or bulk download.
					</p>
					<div className="flex flex-wrap items-center justify-center gap-3 pt-2">
						<button
							className="rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
							onClick={(event) => {
								event.preventDefault();
								inputRef.current?.click();
							}}
							type="button"
						>
							Choose TIFF files
						</button>
						<span className="text-sm text-slate-400">
							or drag and drop a whole batch
						</span>
					</div>
				</div>
			</label>
		</div>
	);
}
