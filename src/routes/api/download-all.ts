import { createFileRoute } from "@tanstack/react-router";

import { archiveResults } from "../../lib/server/archive-results";
import { getCachedFiles } from "../../lib/server/file-cache";

export const Route = createFileRoute("/api/download-all")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const url = new URL(request.url);
				const cacheIds = url.searchParams.getAll("id");

				if (cacheIds.length === 0) {
					return Response.json(
						{ message: "No converted files were selected." },
						{ status: 400 },
					);
				}

				const files = getCachedFiles(cacheIds);

				if (files.length === 0) {
					return Response.json(
						{ message: "Those converted files are no longer available." },
						{ status: 404 },
					);
				}

				const archive = archiveResults(files);

				return new Response(archive, {
					headers: {
						"Content-Disposition": 'attachment; filename="converted-files.zip"',
						"Content-Length": String(archive.byteLength),
						"Content-Type": "application/zip",
					},
				});
			},
		},
	},
});
