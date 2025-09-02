import React from 'react'
import Link from 'next/link'

const LAST_UPDATED = "2024-12-19"

export default function RefundPolicy() {
  return (
    <div className="max-w-4xl mx-auto prose prose-gray dark:prose-invert">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Bexforte Refund Policy</h1>
        <p className="text-muted-foreground">
          Last Updated: {LAST_UPDATED}
        </p>
      </div>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">1. Overview</h2>
        <div className="space-y-4">
          <p>
            This Refund Policy outlines the terms and conditions regarding refunds for Bexforte services. By using our Services, you agree to the terms outlined in this policy.
          </p>
          <p>
            Bexforte is committed to providing excellent service and customer satisfaction. However, we have specific policies in place to ensure fair and consistent handling of refund requests.
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">2. Refund Eligibility</h2>
        <div className="space-y-4">
          <h3 className="text-xl font-semibold mb-3">2.1 General Refund Policy</h3>
          <p>
            <strong>Bexforte does not offer refunds beyond 3 days of the renewal charge.</strong> This policy applies to all subscription renewals and charges.
          </p>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
            <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Important Notice</h4>
            <p className="text-yellow-700 dark:text-yellow-300">
              If you see a charge and wish to dispute it, you have <strong>3 days from the charge date</strong> to reach out and request a refund. After this 3-day period, no refunds will be processed.
            </p>
          </div>

          <h3 className="text-xl font-semibold mb-3 mt-6">2.2 Refund Request Process</h3>
          <p>To request a refund, you must:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Contact us within 3 days of the charge date</li>
            <li>Provide your account information and charge details</li>
            <li>Explain the reason for your refund request</li>
            <li>Submit your request to support@bexoni.com</li>
          </ul>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">3. Subscription Management</h2>
        <div className="space-y-4">
          <h3 className="text-xl font-semibold mb-3">3.1 Cancellation Policy</h3>
          <p>
            If you cancel your subscription, the cancellation takes effect at the end of your current billing cycle. You will continue to have access to all paid features until the end of your current billing period.
          </p>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Billing Management</h4>
            <p className="text-blue-700 dark:text-blue-300">
              You can manage your subscription, including cancellations, upgrades, and downgrades, directly in your account settings at the{' '}
              <Link href="/protected/settings/billing" className="text-primary hover:underline font-medium">
                billing management page
              </Link>.
            </p>
          </div>

          <h3 className="text-xl font-semibold mb-3 mt-6">3.2 Plan Changes</h3>
          <div className="space-y-4">
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-semibold text-green-700 dark:text-green-300">Upgrades</h4>
              <p>
                If you upgrade to a higher-priced plan, the upgrade takes effect immediately. You will be charged the prorated difference for the remaining time in your current billing cycle.
              </p>
            </div>
            
            <div className="border-l-4 border-orange-500 pl-4">
              <h4 className="font-semibold text-orange-700 dark:text-orange-300">Downgrades</h4>
              <p>
                If you downgrade to a lower-priced plan, the downgrade takes effect at the beginning of your next billing cycle. You will continue to have access to your current plan's features until the end of your current billing period.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">4. Non-Refundable Items</h2>
        <div className="space-y-4">
          <p>The following items are generally non-refundable:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Charges older than 3 days from the charge date</li>
            <li>Usage-based charges that have already been consumed</li>
            <li>Third-party service fees (payment processing, etc.)</li>
            <li>Custom development or implementation services</li>
            <li>Training or consulting services that have been delivered</li>
          </ul>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">5. Processing Time</h2>
        <div className="space-y-4">
          <p>
            Approved refunds will be processed within 5-10 business days. The refund will be credited back to the original payment method used for the purchase.
          </p>
          <p>
            Please note that it may take additional time for the refund to appear in your account, depending on your bank or payment provider's processing time.
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">6. Dispute Resolution</h2>
        <div className="space-y-4">
          <p>
            If you believe you have been charged incorrectly or have concerns about a charge, please contact us immediately at support@bexoni.com. We will investigate the matter and work with you to resolve any billing disputes.
          </p>
          <p>
            For payment disputes, we may require additional information to verify the charge and your account status.
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">7. Account Management</h2>
        <div className="space-y-4">
          <p>
            You have full control over your subscription and billing through your account settings. We encourage you to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Review your billing history regularly</li>
            <li>Set up payment method notifications</li>
            <li>Monitor your subscription status</li>
            <li>Update your payment information as needed</li>
            <li>Contact us immediately if you notice any unauthorized charges</li>
          </ul>
          
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
            <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">Self-Service Options</h4>
            <p className="text-green-700 dark:text-green-300">
              Most billing and subscription management can be handled directly through your account. Visit the{' '}
              <Link href="/protected/settings/billing" className="text-primary hover:underline font-medium">
                billing management page
              </Link>{' '}
              to view your subscription details, update payment methods, or make plan changes.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">8. Changes to This Policy</h2>
        <div className="space-y-4">
          <p>
            We reserve the right to modify this Refund Policy at any time. Changes will be effective immediately upon posting on our website. We will notify users of any material changes to this policy.
          </p>
          <p>
            Continued use of our Services after changes to this policy constitutes acceptance of the updated terms.
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">9. Contact Information</h2>
        <div className="space-y-4">
          <p>
            If you have any questions about this Refund Policy or need to request a refund, please contact us:
          </p>
          <div className="bg-lightCard dark:bg-darkCard p-4 rounded-none">
            <p><strong className='text-primary text-base'>Email:</strong> support@bexoni.com</p>
            <p><strong className='text-primary text-base'>Address:</strong> P.O. Box 21095, RPO University Avenue,  Charlottetown, PE,<br /> C1A 9H6, Canada</p>
            <p><strong className='text-primary text-base'>Parent Company:</strong> <a target="_blank" href="https://www.bexoni.com" className="text-primary hover:underline">Bexoni Labs</a></p>
          </div>
          <p>
            For billing-related inquiries, please include your account information and charge details to help us assist you more efficiently.
          </p>
        </div>
      </section>
    </div>
  )
}
