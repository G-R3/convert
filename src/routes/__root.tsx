import { TanStackDevtools } from "@tanstack/react-devtools";
import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				content: "width=device-width, initial-scale=1",
				name: "viewport",
			},
			{
				title: "convert — local tiff processing",
			},
			{
				content:
					"Convert TIFF scans to JPEG or PNG locally with parallel processing and bulk downloads.",
				name: "description",
			},
		],
		links: [
			{
				href: appCss,
				rel: "stylesheet",
			},
			{
				href: "https://fonts.googleapis.com",
				rel: "preconnect",
			},
			{
				href: "https://fonts.gstatic.com",
				rel: "preconnect",
				crossOrigin: "anonymous",
			},
			{
				href: "https://fonts.googleapis.com/css2?family=Instrument+Serif&family=IBM+Plex+Mono:wght@400;500;600&display=swap",
				rel: "stylesheet",
			},
		],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body className="font-mono antialiased wrap-anywhere">
				{children}
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
