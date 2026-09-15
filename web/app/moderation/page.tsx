import React from 'react';
import { notFound } from 'next/navigation';
import { ModerationConsole } from '../../components/moderation-console';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Private review | SHIOK', description: 'Private resident report review.',
  robots: { index: false, follow: false }, alternates: { canonical: null }, openGraph: null, twitter: null };

export default function ModerationPage() {
  if (process.env.SHIOK_MODERATION_ENABLED !== 'true') notFound();
  return <ModerationConsole enabled />;
}
