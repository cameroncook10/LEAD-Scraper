import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Nav */}
      <nav className="px-6 py-4 border-b border-gray-800/50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="AgentLead" className="w-9 h-9 object-contain" />
            <span className="font-bold text-base">
              <span className="text-white">Agent</span>
              <span className="text-cyan-400">Lead</span>
            </span>
          </a>
          <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
            Privacy Policy
          </span>
        </h1>
        <p className="text-gray-500 mb-12">Last updated: March 27, 2026</p>

        <div className="space-y-10 text-gray-300 leading-relaxed">
          {/* Intro */}
          <section>
            <p>
              AgentLead ("Company", "we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website at agentlead.io and our desktop application (collectively, the "Service"). Please read this policy carefully. By using the Service, you consent to the practices described herein.
            </p>
          </section>

          {/* 1 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Information We Collect</h2>

            <h3 className="text-lg font-medium text-gray-200 mb-2 mt-4">1.1 Account Information</h3>
            <p className="mb-2">When you create an account, we collect:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>Name and email address</li>
              <li>Google account profile information (when using Google Sign-In)</li>
              <li>Billing information (processed by Stripe; we do not store full payment card details)</li>
              <li>Subscription plan and payment history</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-200 mb-2 mt-4">1.2 Usage Data</h3>
            <p className="mb-2">We automatically collect certain information about your use of the Service, including:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>Device information (operating system, browser type, hardware identifiers)</li>
              <li>IP address and approximate geolocation</li>
              <li>Pages visited, features used, and actions taken within the Service</li>
              <li>Scraping job configurations, campaign settings, and performance metrics</li>
              <li>Error logs and diagnostic data</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-200 mb-2 mt-4">1.3 Scraped Lead Data</h3>
            <p>
              When you use AgentLead to scrape leads, the resulting data (business names, contact information, social media profiles, etc.) is stored in your account. This data is sourced from publicly available information. You are the data controller for any lead data you collect through the Service, and you are responsible for ensuring your use complies with applicable laws.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. How We Use Your Information</h2>
            <p className="mb-2">We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>Provide, operate, and maintain the Service</li>
              <li>Process your subscription and payments</li>
              <li>Send transactional emails (account confirmation, billing receipts, important updates)</li>
              <li>Improve, personalize, and optimize the Service</li>
              <li>Provide customer support and respond to inquiries</li>
              <li>Detect, prevent, and address technical issues, fraud, or security threats</li>
              <li>Comply with legal obligations</li>
              <li>Send marketing communications (only with your consent; you can opt out at any time)</li>
            </ul>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Data Storage and Security</h2>
            <p className="mb-3">
              We take the security of your data seriously and implement industry-standard measures to protect it:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li><span className="text-gray-300">Encryption:</span> All data is encrypted in transit using TLS 1.2+ and at rest using AES-256 encryption</li>
              <li><span className="text-gray-300">Hosting:</span> Our backend infrastructure is hosted on Supabase, which provides enterprise-grade security, automated backups, and row-level security</li>
              <li><span className="text-gray-300">Desktop App:</span> Scraping operations run locally on your machine. Lead data is synced to your secure cloud account</li>
              <li><span className="text-gray-300">Access Controls:</span> Access to user data is restricted to authorized personnel on a need-to-know basis</li>
            </ul>
            <p className="mt-3 text-gray-400 text-sm">
              While we strive to protect your data, no method of electronic storage or transmission is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Third-Party Services</h2>
            <p className="mb-3">
              We use the following third-party services to operate AgentLead. Each has its own privacy policy governing how it handles your data:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li><span className="text-gray-300">Stripe</span> — Payment processing. Stripe collects and processes your payment information. See <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Stripe's Privacy Policy</a>.</li>
              <li><span className="text-gray-300">Supabase</span> — Backend infrastructure, database hosting, and authentication. See <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Supabase's Privacy Policy</a>.</li>
              <li><span className="text-gray-300">Google APIs</span> — Used for Google Sign-In authentication. See <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Google's Privacy Policy</a>.</li>
              <li><span className="text-gray-300">SendGrid</span> — Transactional and marketing email delivery. See <a href="https://www.twilio.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Twilio/SendGrid's Privacy Policy</a>.</li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Cookies and Tracking</h2>
            <p className="mb-3">
              We use cookies and similar tracking technologies to enhance your experience:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li><span className="text-gray-300">Essential Cookies:</span> Required for the Service to function (authentication, session management)</li>
              <li><span className="text-gray-300">Analytics Cookies:</span> Help us understand how users interact with the Service to improve it</li>
              <li><span className="text-gray-300">Preference Cookies:</span> Remember your settings and preferences</li>
            </ul>
            <p className="mt-3">
              You can manage cookie preferences through your browser settings or our cookie consent banner. Disabling essential cookies may affect the functionality of the Service.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Your Rights</h2>

            <h3 className="text-lg font-medium text-gray-200 mb-2 mt-4">6.1 GDPR Rights (European Economic Area)</h3>
            <p className="mb-2">If you are located in the EEA, you have the right to:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li><span className="text-gray-300">Access:</span> Request a copy of the personal data we hold about you</li>
              <li><span className="text-gray-300">Rectification:</span> Request correction of inaccurate or incomplete data</li>
              <li><span className="text-gray-300">Erasure:</span> Request deletion of your personal data ("right to be forgotten")</li>
              <li><span className="text-gray-300">Portability:</span> Request your data in a structured, machine-readable format</li>
              <li><span className="text-gray-300">Restriction:</span> Request restriction of processing under certain circumstances</li>
              <li><span className="text-gray-300">Objection:</span> Object to processing based on legitimate interests or direct marketing</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-200 mb-2 mt-4">6.2 CCPA Rights (California Residents)</h3>
            <p className="mb-2">If you are a California resident, you have the right to:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li><span className="text-gray-300">Right to Know:</span> Request information about the categories and specific pieces of personal information we collect</li>
              <li><span className="text-gray-300">Right to Delete:</span> Request deletion of your personal information</li>
              <li><span className="text-gray-300">Right to Opt-Out:</span> Opt out of the sale of your personal information (we do not sell personal information)</li>
              <li><span className="text-gray-300">Non-Discrimination:</span> We will not discriminate against you for exercising your CCPA rights</li>
            </ul>

            <p className="mt-4">
              To exercise any of these rights, contact us at <a href="mailto:support@agentlead.io" className="text-cyan-400 hover:underline">support@agentlead.io</a>. We will respond to verifiable requests within 30 days.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Data Retention</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li><span className="text-gray-300">Lead Data:</span> Scraped leads are retained in your account until you choose to delete them. You can delete individual leads or all data at any time through the Service.</li>
              <li><span className="text-gray-300">Account Data:</span> If you delete your account, we will retain your data for 30 days in case you wish to reactivate, after which it will be permanently deleted from our systems.</li>
              <li><span className="text-gray-300">Billing Records:</span> We retain billing and transaction records as required by applicable tax and financial regulations (typically 7 years).</li>
              <li><span className="text-gray-300">Usage Logs:</span> Anonymized usage and analytics data may be retained indefinitely for product improvement purposes.</li>
            </ul>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Children's Privacy</h2>
            <p>
              AgentLead is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected data from a person under 18, we will promptly delete that information. If you believe a child has provided us with personal data, please contact us at <a href="mailto:support@agentlead.io" className="text-cyan-400 hover:underline">support@agentlead.io</a>.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your country of residence, including the United States. These countries may have data protection laws that differ from the laws of your country. We take appropriate safeguards to ensure your data is protected in accordance with this Privacy Policy, including standard contractual clauses where applicable.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. When we make material changes, we will notify you by email or by posting a prominent notice on our website at least 30 days before the changes take effect. We encourage you to review this page periodically. Your continued use of the Service after changes become effective constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Contact Information & Data Protection Officer</h2>
            <p>
              If you have any questions about this Privacy Policy or our data practices, or if you wish to exercise your data rights, please contact us:
            </p>
            <div className="mt-3 text-gray-400">
              <p>AgentLead</p>
              <p>Data Protection Officer</p>
              <p>Email: <a href="mailto:support@agentlead.io" className="text-cyan-400 hover:underline">support@agentlead.io</a></p>
              <p>Website: <a href="https://agentlead.io" className="text-cyan-400 hover:underline">agentlead.io</a></p>
            </div>
            <p className="mt-3 text-gray-400 text-sm">
              If you are located in the EEA and believe we have not adequately addressed your data protection concerns, you have the right to lodge a complaint with your local supervisory authority.
            </p>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-sm">&copy; 2026 AgentLead. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link to="/terms" className="hover:text-cyan-400 transition-colors">Terms of Service</Link>
            <Link to="/refund-policy" className="hover:text-cyan-400 transition-colors">Refund Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
