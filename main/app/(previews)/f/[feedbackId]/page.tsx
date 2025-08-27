import React from 'react'
import FeedbackForm from './_components/feedback-form'
import { baseUrl } from '@/utils/universal';
import type { Metadata } from 'next'
import { createPageMetadata } from '@/lib/seo'

interface PageProps {
  params: Promise<{ feedbackId: string }>
  searchParams: Promise<{ token?: string }>
}

async function fetchFeedbackState(feedbackId: string, token?: string) {
  if (!token) return null;
  const res = await fetch(
    `${baseUrl}/api/feedback/submit-feedback?feedbackId=${feedbackId}&token=${token}`,
    { cache: "no-store" }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data?.data?.state || null;
}

export default async function FeedbackPage({ params, searchParams }: PageProps) {
  const { feedbackId } = await params;
  const { token } = await searchParams;

  const state = await fetchFeedbackState(feedbackId, token);

  if (state === "draft") {
    return (
      <div className="min-h-screen flex items-center justify-center ">
        <div className="text-center p-8 bg-lightCard dark:bg-darkCard rounded-none shadow-lg">
          <h1 className="text-2xl font-bold text-yellow-600 mb-4">Preview Mode</h1>
          <p className="text-gray-600">This form is in preview mode and cannot be filled out yet.</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center ">
        <div className="text-center p-8 bg-lightCard dark:bg-darkCard rounded-none shadow-lg ">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Link</h1>
          <p className="text-gray-600">This feedback link is missing required information.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <FeedbackForm feedbackId={feedbackId} token={token} />
    </div>
  )
}

export const metadata: Metadata = createPageMetadata({
  title: 'Feedback Form',
  description: 'Fill and submit the requested feedback securely via BexForte.',
});