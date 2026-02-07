import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
	title: 'Flash Cards',
	description: 'Learn languages with flash cards'
};

export default function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='en'>
			<body>{children}</body>
		</html>
	);
}
