import React from 'react'

const LAST_UPDATED = "2024-12-19"

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto prose prose-gray dark:prose-invert">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Bexforte Privacy Policy</h1>
        <p className="text-muted-foreground">
          Last Updated: {LAST_UPDATED}
        </p>
      </div>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
        <div className="space-y-4">
          <p>
            At Bexforte, operated by Bexoni Labs, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our comprehensive project management and business operations platform.
          </p>
          <p>
            Please read this Privacy Policy carefully. If you do not agree with the terms of this Privacy Policy, please do not access the application.
          </p>
          <p>
            We reserve the right to make changes to this Privacy Policy at any time and for any reason. We will alert you about any changes by updating the "Last Updated" date of this Privacy Policy. You are encouraged to periodically review this Privacy Policy to stay informed of updates.
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
        
        <h3 className="text-xl font-semibold mb-3">2.1 Personal Information</h3>
        <div className="space-y-4">
          <p>We may collect personal information that you voluntarily provide to us when you:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Register for an account or create an organization</li>
            <li>Use our Services (invoices, receipts, projects, feedback, walls, paths)</li>
            <li>Contact us for support</li>
            <li>Subscribe to our newsletter or marketing communications</li>
            <li>Participate in surveys or feedback forms</li>
          </ul>
          <p>This information may include:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Name and contact information (email address, phone number)</li>
            <li>Business information (company name, address, tax ID)</li>
            <li>Payment information (processed securely through third-party providers)</li>
            <li>Profile information and preferences</li>
            <li>Communication preferences</li>
          </ul>
        </div>

        <h3 className="text-xl font-semibold mb-3 mt-6">2.2 Business Data</h3>
        <div className="space-y-4">
          <p>As part of our Services, we collect and store business-related data including:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Invoice and receipt data</li>
            <li>Project information and deliverables</li>
            <li>Customer and client information</li>
            <li>Feedback and survey responses</li>
            <li>Wall content (documents, images, videos, files)</li>
            <li>Path configurations and link collections</li>
            <li>Payment and transaction records</li>
            <li>Communication logs and correspondence</li>
          </ul>
        </div>

        <h3 className="text-xl font-semibold mb-3 mt-6">2.3 Technical Information</h3>
        <div className="space-y-4">
          <p>We automatically collect certain technical information when you use our Services:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Device information (IP address, browser type, operating system)</li>
            <li>Usage data (pages visited, features used, time spent)</li>
            <li>Log data (access times, error logs, performance data)</li>
            <li>Cookies and similar tracking technologies</li>
            <li>Analytics data to improve our Services</li>
          </ul>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
        <div className="space-y-4">
          <p>We use the information we collect for various purposes, including:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Service Provision:</strong> To provide, maintain, and improve our Services</li>
            <li><strong>Account Management:</strong> To create and manage your account and organization</li>
            <li><strong>Communication:</strong> To send you important updates, notifications, and support messages</li>
            <li><strong>Payment Processing:</strong> To process payments and manage subscriptions</li>
            <li><strong>Customer Support:</strong> To respond to your inquiries and provide technical support</li>
            <li><strong>Security:</strong> To protect against fraud, abuse, and security threats</li>
            <li><strong>Legal Compliance:</strong> To comply with applicable laws and regulations</li>
            <li><strong>Analytics:</strong> To analyze usage patterns and improve our Services</li>
            <li><strong>Marketing:</strong> To send you promotional materials (with your consent)</li>
          </ul>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">4. Information Sharing and Disclosure</h2>
        <div className="space-y-4">
          <p>We do not sell, trade, or otherwise transfer your personal information to third parties except in the following circumstances:</p>
          
          <h3 className="text-xl font-semibold mb-3 mt-6">4.1 Service Providers</h3>
          <p>We may share your information with trusted third-party service providers who assist us in operating our Services, including:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Payment processors (Stripe, PayPal)</li>
            <li>Cloud storage providers (Supabase, AWS)</li>
            <li>Email service providers</li>
            <li>Analytics services</li>
            <li>Customer support tools</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-6">4.2 Legal Requirements</h3>
          <p>We may disclose your information if required to do so by law or in response to valid requests by public authorities.</p>

          <h3 className="text-xl font-semibold mb-3 mt-6">4.3 Business Transfers</h3>
          <p>In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.</p>

          <h3 className="text-xl font-semibold mb-3 mt-6">4.4 Consent</h3>
          <p>We may share your information with your explicit consent for specific purposes.</p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
        <div className="space-y-4">
          <p>
            We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Encryption of data in transit and at rest</li>
            <li>Regular security assessments and updates</li>
            <li>Access controls and authentication mechanisms</li>
            <li>Secure data centers and infrastructure</li>
            <li>Employee training on data protection</li>
            <li>Incident response procedures</li>
          </ul>
          <p>
            However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
        <div className="space-y-4">
          <p>
            We retain your personal information for as long as necessary to provide our Services and fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.
          </p>
          <p>
            When you delete your account, we will delete or anonymize your personal information, except where we are required to retain it for legal, regulatory, or legitimate business purposes.
          </p>
          <p>
            Business data (invoices, receipts, projects, etc.) may be retained for longer periods to comply with legal and regulatory requirements, particularly for tax and accounting purposes.
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">7. Your Rights and Choices</h2>
        <div className="space-y-4">
          <p>Depending on your location, you may have certain rights regarding your personal information:</p>
          
          <h3 className="text-xl font-semibold mb-3 mt-6">7.1 Access and Portability</h3>
          <p>You have the right to access and receive a copy of your personal information in a structured, machine-readable format.</p>

          <h3 className="text-xl font-semibold mb-3 mt-6">7.2 Correction</h3>
          <p>You have the right to correct inaccurate or incomplete personal information.</p>

          <h3 className="text-xl font-semibold mb-3 mt-6">7.3 Deletion</h3>
          <p>You have the right to request deletion of your personal information, subject to certain exceptions.</p>

          <h3 className="text-xl font-semibold mb-3 mt-6">7.4 Restriction</h3>
          <p>You have the right to restrict the processing of your personal information in certain circumstances.</p>

          <h3 className="text-xl font-semibold mb-3 mt-6">7.5 Objection</h3>
          <p>You have the right to object to the processing of your personal information for certain purposes.</p>

          <h3 className="text-xl font-semibold mb-3 mt-6">7.6 Withdraw Consent</h3>
          <p>Where processing is based on consent, you have the right to withdraw your consent at any time.</p>

          <p className="mt-4">
            To exercise these rights, please contact us at support@bexoni.com. We will respond to your request within a reasonable timeframe and in accordance with applicable law.
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">8. Cookies and Tracking Technologies</h2>
        <div className="space-y-4">
          <p>
            We use cookies and similar tracking technologies to enhance your experience on our platform. Cookies are small data files stored on your device that help us:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Remember your preferences and settings</li>
            <li>Analyze how you use our Services</li>
            <li>Improve our Services and user experience</li>
            <li>Provide personalized content and features</li>
            <li>Ensure security and prevent fraud</li>
          </ul>
          <p>
            You can control cookies through your browser settings. However, disabling cookies may affect the functionality of our Services.
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">9. International Data Transfers</h2>
        <div className="space-y-4">
          <p>
            Your information may be transferred to and processed in countries other than your own. We ensure that such transfers comply with applicable data protection laws and implement appropriate safeguards to protect your information.
          </p>
          <p>
            When we transfer personal information from the European Economic Area (EEA) to other countries, we rely on adequacy decisions by the European Commission or implement appropriate safeguards such as standard contractual clauses.
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">10. Children's Privacy</h2>
        <div className="space-y-4">
          <p>
            Our Services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
          </p>
          <p>
            If we discover that we have collected personal information from a child under 13, we will take steps to delete such information from our systems.
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">11. Third-Party Services</h2>
        <div className="space-y-4">
          <p>
            Our Services may contain links to third-party websites or services. We are not responsible for the privacy practices or content of these third parties. We encourage you to read the privacy policies of any third-party services you use.
          </p>
          <p>
            Some of our key third-party integrations include:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Payment Processing:</strong> Stripe, PayPal for secure payment processing</li>
            <li><strong>Cloud Infrastructure:</strong> Supabase, AWS for data storage and processing</li>
            <li><strong>Email Services:</strong> For transactional and marketing communications</li>
            <li><strong>Analytics:</strong> For understanding usage patterns and improving our Services</li>
          </ul>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">12. Changes to This Privacy Policy</h2>
        <div className="space-y-4">
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
          </p>
          <p>
            We encourage you to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
          </p>
          <p>
            If we make material changes to this Privacy Policy, we will notify you through our Services or by email at least 30 days before the changes take effect.
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">13. Contact Us</h2>
        <div className="space-y-4">
          <p>
            If you have any questions about this Privacy Policy or our privacy practices, please contact us:
          </p>
          <div className="bg-lightCard dark:bg-darkCard p-4 rounded-none">
            <p><strong className='text-primary text-base'>Email:</strong> support@bexoni.com</p>
            <p><strong className='text-primary text-base'>Address:</strong> P.O. Box 21095, RPO University Avenue,  Charlottetown, PE,<br /> C1A 9H6, Canada</p>
            <p><strong className='text-primary text-base'>Parent Company:</strong> <a target="_blank" href="https://www.bexoni.com" className="text-primary hover:underline">Bexoni Labs</a></p>
          </div>
          <p>
            We will respond to your inquiry within a reasonable timeframe and in accordance with applicable law.
          </p>
        </div>
      </section>
    </div>
  )
}
