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
              At AgentLead, we want you to be satisfied with your purchase. This Refund Policy outlines the terms under which refunds may be issued for our subscription plans.
            </p>
          </section>

          {/* 1 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Subscription Plans</h2>
            <p>
              AgentLead offers paid subscription plans billed on a monthly or annual basis. All subscriptions are processed through Stripe. By subscribing, you agree to the billing terms associated with your selected plan.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Cancellation Policy</h2>
            <p className="mb-3">You may cancel your subscription at any time. Here is how cancellation works:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li><span className="text-gray-300">Cancel Anytime:</span> You can cancel your subscription from your account settings or by contacting us at support@agentlead.io.</li>
              <li><span className="text-gray-300">Access Until Period End:</span> After cancellation, you will retain full access to the Service until the end of your current billing period.</li>
              <li><span className="text-gray-300">No Prorated Refunds:</span> We do not issue prorated refunds for unused time remaining in a billing period after cancellation.</li>
              <li><span className="text-gray-300">Auto-Renewal:</span> If you do not cancel before the end of your billing period, your subscription will automatically renew and you will be charged for the next period.</li>
            </ul>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Refund Eligibility</h2>
            <p className="mb-3">Refunds are handled as follows:</p>

            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 mb-4">
              <h3 className="text-lg font-medium text-white mb-2">First Payment Refund Window</h3>
              <p className="text-gray-400">
                If you are unhappy with the Service, you may request a refund within <span className="text-white font-medium">14 days</span> of your first subscription payment. Refund requests within this window will be considered on a case-by-case basis. We may issue a full or partial refund at our discretion.
              </p>
            </div>

            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 mb-4">
              <h3 className="text-lg font-medium text-white mb-2">After 14 Days</h3>
              <p className="text-gray-400">
                After 14 days from your first payment, or for any subsequent billing periods, refunds are generally not available. You can cancel your subscription to prevent future charges, and you will continue to have access until your current billing period ends.
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
            <h2 className="text-xl font-semibold text-white mb-3">4. Annual Subscriptions</h2>
            <p>
              Annual subscriptions are billed as a single payment for 12 months of service. The 14-day refund window applies from the date of payment. After this window, no refunds are available for annual plans. You may contact us to discuss switching to a monthly plan for future billing periods.
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
