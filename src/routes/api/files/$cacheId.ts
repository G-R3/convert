import { createFileRoute } from "@tanstack/react-router";

import { getCachedFile } from "../../../lib/server/file-cache";

export const Route = createFileRoute("/api/files/$cacheId")({
	server: {
		handlers: {
			GET: async ({ params }) => {
				const file = getCachedFile(params.cacheId);

				if (!file) {
					return new Response("This converted file is no longer available.", {
						status: 404,
					});
				}

				return new Response(file.buffer, {
					headers: {
						"Content-Disposition": `attachment; filename="${file.filename}"`,
						"Content-Length": String(file.buffer.byteLength),
						"Content-Type": file.contentType,
					},
				});
			},
		},
	},
});
