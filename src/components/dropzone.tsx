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
		<label
			htmlFor={inputId}
			onDragLeave={handleDragLeave}
			onDragOver={handleDragOver}
			onDrop={handleDrop}
			className={[
				"flex min-h-48 cursor-pointer flex-col items-center justify-center border border-dashed px-6 py-12 text-center transition-all duration-200",
				isDragging
					? "border-accent shadow-[inset_0_0_80px_rgba(196,163,90,0.04)]"
					: "border-border hover:border-text-muted",
				disabled ? "cursor-not-allowed opacity-40" : "",
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

			<p className="text-sm text-text-secondary">
				Drop <code className="text-text">.tiff</code> files here
			</p>

			<span className="mt-3 text-xs text-text-muted">
				or{" "}
				<button
					className="hover-underline text-text-secondary underline-offset-4 transition-colors hover:text-text"
					onClick={(event) => {
						event.preventDefault();
						inputRef.current?.click();
					}}
					type="button"
				>
					browse
				</button>
			</span>
		</label>
	);
}
