import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
	createQueueItems,
	filterAcceptedFiles,
	runConversionQueue,
} from "./file-queue";
import {
	applyQueueItemPatch,
	buildAddFilesNotice,
	buildQueueNotice,
	getCompletedItems,
	hasQueuedItems,
	removeQueueItem,
	retryQueueItem,
	summarizeQueue,
} from "./queue-state";
import type { ConversionQueueItem, OutputFormat } from "./types";

export function useConversionQueue() {
	const [items, setItems] = useState<ConversionQueueItem[]>([]);
	const [format, setFormat] = useState<OutputFormat>("jpeg");
	const [isConverting, setIsConverting] = useState(false);
	const [dropNotice, setDropNotice] = useState<string | null>(null);
	const isMountedRef = useRef(true);

	useEffect(() => {
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	useEffect(() => {
		if (!hasQueuedItems(items) || isConverting) {
			return;
		}

		setIsConverting(true);

		void runConversionQueue({
			format,
			items,
			onItemUpdate: (itemId, patch) => {
				setItems((currentItems) =>
					applyQueueItemPatch(currentItems, itemId, patch),
				);
			},
		}).finally(() => {
			if (isMountedRef.current) {
				setIsConverting(false);
			}
		});
	}, [format, isConverting, items]);

	const queueSummary = useMemo(() => summarizeQueue(items), [items]);
	const doneItems = useMemo(() => getCompletedItems(items), [items]);
	const notice = useMemo(
		() =>
			buildQueueNotice({
				dropNotice,
				format,
				queueSummary,
			}),
		[dropNotice, format, queueSummary],
	);

	const addFiles = useCallback(
		(incomingFiles: File[]) => {
			const acceptedFiles = filterAcceptedFiles(incomingFiles);
			const skippedCount = incomingFiles.length - acceptedFiles.length;

			if (acceptedFiles.length > 0) {
				setItems((currentItems) => [
					...currentItems,
					...createQueueItems(acceptedFiles),
				]);
			}

			setDropNotice(
				buildAddFilesNotice({
					acceptedCount: acceptedFiles.length,
					format,
					skippedCount,
				}),
			);
		},
		[format],
	);

	const removeItem = useCallback((itemId: string) => {
		setItems((currentItems) => {
			const nextItems = removeQueueItem(currentItems, itemId);

			if (nextItems.length === 0) {
				setDropNotice(null);
			}

			return nextItems;
		});
	}, []);

	const retryItem = useCallback((itemId: string) => {
		setItems((currentItems) => retryQueueItem(currentItems, itemId));
	}, []);

	return {
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
	};
}
