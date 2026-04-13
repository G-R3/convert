import { createFileRoute } from "@tanstack/react-router";

import { convertImage } from "../../lib/server/convert-image";
import { type OutputFormat, outputFormats } from "../../lib/types";

export const Route = createFileRoute("/api/convert")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				const formData = await request.formData();
				const file = formData.get("file");
				const format = formData.get("format");

				if (!(file instanceof File)) {
					return Response.json(
						{ message: "Please attach a TIFF file to convert." },
						{ status: 400 },
					);
				}

				if (
					typeof format !== "string" ||
					!outputFormats.includes(format as OutputFormat)
				) {
					return Response.json(
						{ message: "Please choose either JPEG or PNG." },
						{ status: 400 },
					);
				}

				if (!/\.(tif|tiff)$/i.test(file.name)) {
					return Response.json(
						{ message: "Only .tif and .tiff files are supported right now." },
						{ status: 400 },
					);
				}

				try {
					const buffer = Buffer.from(await file.arrayBuffer());
					const result = await convertImage({
						buffer,
						filename: file.name,
						format,
					});

					return Response.json(result);
				} catch (error) {
					return Response.json(
						{
							message:
								error instanceof Error
									? error.message
									: "Conversion failed on the local server.",
						},
						{ status: 500 },
					);
				}
			},
		},
	},
});
