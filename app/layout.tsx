import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Linked List Visualizer',
  description: 'A visual representation of a linked list with color boxes',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
} 