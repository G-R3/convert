export function createConcurrencyLimiter(maxConcurrent: number) {
	let activeCount = 0;
	const queue: Array<() => void> = [];

	const runNext = () => {
		activeCount -= 1;
		const next = queue.shift();
		next?.();
	};

	return async function limit<T>(task: () => Promise<T>) {
		if (activeCount >= maxConcurrent) {
			await new Promise<void>((resolve) => {
				queue.push(resolve);
			});
		}

		activeCount += 1;

		try {
			return await task();
		} finally {
			runNext();
		}
	};
}
