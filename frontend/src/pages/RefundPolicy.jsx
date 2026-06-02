import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function RefundPolicy() {
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
            Refund Policy
          </span>
        </h1>
        <p className="text-gray-500 mb-12">Last updated: March 27, 2026</p>

        <div className="space-y-10 text-gray-300 leading-relaxed">
          {/* Intro */}
          <section>
            <p>
              At AgentLead, we want you to be satisfied with your purchase. This Refund Policy outlines the terms under which refunds may be issued for our setup fees and services.
            </p>
          </section>

          {/* 1 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Setup Fees &amp; Services</h2>
            <p>
              AgentLead is provided as a done-for-you service with a one-time setup fee that is agreed and invoiced before work begins. Pricing is tailored to your engagement and confirmed in writing. We do not charge recurring subscription fees unless separately agreed with you in writing.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Service Term</h2>
            <p className="mb-3">Because AgentLead is a setup-fee service rather than a subscription:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li><span className="text-gray-300">No Auto-Renewal:</span> There are no automatic recurring charges. You will not be billed again without a new written agreement.</li>
              <li><span className="text-gray-300">Ongoing Access:</span> After setup is complete, you retain access to the Service for the term described in your engagement.</li>
              <li><span className="text-gray-300">Stopping Service:</span> You may stop using the Service at any time by contacting us at support@agentlead.io.</li>
            </ul>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Refund Eligibility</h2>
            <p className="mb-3">Refunds are handled as follows:</p>

            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 mb-4">
              <h3 className="text-lg font-medium text-white mb-2">Before Setup Begins</h3>
              <p className="text-gray-400">
                If you request a refund of your setup fee <span className="text-white font-medium">before we have begun setup work</span>, we will issue a full refund. Once setup work has started, the fee covers the time and configuration already performed.
              </p>
            </div>

            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 mb-4">
              <h3 className="text-lg font-medium text-white mb-2">After Setup Has Begun</h3>
              <p className="text-gray-400">
                Once setup work is underway or complete, refunds are evaluated on a case-by-case basis depending on the work performed. We'll always try to make things right — reach out and we'll discuss options.
              </p>
            </div>

            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
              <h3 className="text-lg font-medium text-white mb-2">Exceptional Circumstances</h3>
              <p className="text-gray-400">
                We may issue refunds in exceptional circumstances, such as extended service outages, billing errors, or duplicate charges. These are evaluated on a case-by-case basis.
              </p>
            </div>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Payment Method</h2>
            <p>
              Setup fees are invoiced and may be paid by bank transfer or another method we agree with you. If we enable card payment in the future, it will be handled by a third-party payment provider and the refund terms above will continue to apply.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. How to Request a Refund</h2>
            <p className="mb-3">To request a refund, follow these steps:</p>
            <ol className="list-decimal list-inside space-y-2 text-gray-400">
              <li>Email us at <a href="mailto:support@agentlead.io" className="text-cyan-400 hover:underline">support@agentlead.io</a> with the subject line "Refund Request"</li>
              <li>Include your account email address and the reason for your refund request</li>
              <li>Our team will review your request and respond within 3-5 business days</li>
              <li>If approved, refunds are processed to your original payment method and may take 5-10 business days to appear on your statement</li>
            </ol>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Chargebacks</h2>
            <p>
              We encourage you to contact us directly before initiating a chargeback with your bank or credit card company. We are committed to resolving any billing issues promptly. Filing a chargeback without first contacting us may result in suspension of your account.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Changes to This Policy</h2>
            <p>
              We reserve the right to modify this Refund Policy at any time. Changes will be posted on this page with an updated "Last updated" date. Material changes will be communicated via email. The refund terms in effect at the time of your purchase will apply to that transaction.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Contact Us</h2>
            <p>
              If you have any questions about this Refund Policy, please contact us:
            </p>
            <div className="mt-3 text-gray-400">
              <p>AgentLead</p>
              <p>Email: <a href="mailto:support@agentlead.io" className="text-cyan-400 hover:underline">support@agentlead.io</a></p>
              <p>Website: <a href="https://agentlead.io" className="text-cyan-400 hover:underline">agentlead.io</a></p>
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-sm">&copy; 2026 AgentLead. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link to="/terms" className="hover:text-cyan-400 transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-cyan-400 transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
