import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
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
            Terms of Service
          </span>
        </h1>
        <p className="text-gray-500 mb-12">Last updated: March 27, 2026</p>

        <div className="space-y-10 text-gray-300 leading-relaxed">
          {/* 1 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using AgentLead (the "Service"), operated by AgentLead ("Company", "we", "us", or "our") at agentlead.io, you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Service. We reserve the right to update these Terms at any time. Continued use of the Service after changes constitutes acceptance of the revised Terms.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Eligibility</h2>
            <p>
              You must be at least 18 years of age and have the legal capacity to enter into a binding agreement to use the Service. By using AgentLead, you represent and warrant that you meet these requirements. If you are using the Service on behalf of a business or other legal entity, you represent that you have the authority to bind that entity to these Terms.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Account Registration and Security</h2>
            <p>
              To use certain features of the Service, you must create an account. You agree to provide accurate, current, and complete information during registration and to keep your account information up to date. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately at support@agentlead.io if you suspect unauthorized access to your account.
            </p>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Subscription and Payment Terms</h2>
            <p className="mb-3">
              AgentLead offers paid subscription plans. By subscribing, you agree to the following:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li><span className="text-gray-300">Auto-Renewal:</span> Subscriptions automatically renew at the end of each billing cycle (monthly or annual) unless you cancel before the renewal date.</li>
              <li><span className="text-gray-300">Payment:</span> All payments are processed securely through Stripe. You authorize us to charge your selected payment method for the applicable subscription fees.</li>
              <li><span className="text-gray-300">Price Changes:</span> We may change subscription prices with at least 30 days' notice. Price changes take effect at the start of your next billing cycle.</li>
              <li><span className="text-gray-300">Cancellation:</span> You may cancel your subscription at any time. Upon cancellation, you will retain access to the Service until the end of your current billing period. No prorated refunds are issued for partial billing periods.</li>
              <li><span className="text-gray-300">Refunds:</span> Please refer to our <Link to="/refund-policy" className="text-cyan-400 hover:underline">Refund Policy</Link> for details on refund eligibility.</li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Permitted Use of the Service</h2>
            <p className="mb-3">
              AgentLead provides tools for lead generation, AI-powered lead qualification, and outreach automation. You may use the Service for lawful business purposes, including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>Scraping publicly available business information from the web</li>
              <li>Qualifying and scoring leads using AI</li>
              <li>Automating personalized outreach via direct messages and comments</li>
              <li>Exporting lead data for use in your CRM or business tools</li>
            </ul>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Data Scraping Disclaimer</h2>
            <p>
              All data provided through the Service, including scraped leads and business information, is provided on an "as-is" and "as-available" basis. AgentLead makes no guarantees, representations, or warranties regarding the accuracy, completeness, timeliness, or reliability of any data obtained through the Service. You acknowledge that publicly available data may be outdated, incomplete, or inaccurate, and you use such data at your own risk.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. User Responsibilities</h2>
            <p className="mb-3">You agree to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>Comply with all applicable local, state, national, and international laws and regulations, including but not limited to data protection laws (GDPR, CCPA), anti-spam laws (CAN-SPAM, CASL), and platform terms of service</li>
              <li>Not use the Service to send unsolicited bulk messages ("spam") or harass any individual or business</li>
              <li>Respect recipient opt-out requests promptly and maintain suppression lists</li>
              <li>Not use the Service for any illegal, fraudulent, or deceptive purposes</li>
              <li>Not attempt to reverse-engineer, decompile, or disassemble any part of the Service</li>
              <li>Not interfere with or disrupt the Service or its infrastructure</li>
              <li>Not share your account credentials with unauthorized parties</li>
            </ul>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Intellectual Property</h2>
            <p>
              The Service, including its software, design, text, graphics, logos, and all other content, is owned by AgentLead and is protected by copyright, trademark, and other intellectual property laws. You are granted a limited, non-exclusive, non-transferable license to use the Service in accordance with these Terms. You may not copy, modify, distribute, or create derivative works based on the Service without our prior written consent. Data you collect through the Service belongs to you, subject to the terms herein.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Limitation of Liability</h2>
            <p className="mb-3">
              To the maximum extent permitted by applicable law:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>AgentLead shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, business opportunities, or goodwill.</li>
              <li>Our total aggregate liability for any claims arising out of or related to the Service shall not exceed the amount you paid to AgentLead in the twelve (12) months preceding the claim.</li>
              <li>AgentLead is not responsible for any damages arising from your use of scraped data, including but not limited to claims from third parties whose data was collected.</li>
              <li>The Service is provided "as is" and "as available" without warranties of any kind, whether express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement.</li>
            </ul>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless AgentLead, its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses (including reasonable attorneys' fees) arising out of or in connection with your use of the Service, your violation of these Terms, or your violation of any rights of a third party.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Termination</h2>
            <p>
              We may suspend or terminate your account and access to the Service at any time, with or without cause, and with or without notice. Grounds for termination include, but are not limited to, violation of these Terms, illegal activity, non-payment, or abuse of the Service. Upon termination, your right to use the Service ceases immediately. You may terminate your account at any time by canceling your subscription and contacting us at support@agentlead.io.
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">12. Dispute Resolution</h2>
            <p>
              Any disputes arising out of or related to these Terms or the Service shall first be attempted to be resolved through good-faith negotiation. If negotiation fails, disputes shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association, conducted in the State of Delaware. You agree to waive any right to participate in a class action lawsuit or class-wide arbitration.
            </p>
          </section>

          {/* 13 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">13. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States of America, without regard to its conflict of law provisions. Any legal action or proceeding arising under these Terms shall be brought exclusively in the federal or state courts located in Delaware.
            </p>
          </section>

          {/* 14 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">14. Severability</h2>
            <p>
              If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.
            </p>
          </section>

          {/* 15 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">15. Entire Agreement</h2>
            <p>
              These Terms, together with our <Link to="/privacy" className="text-cyan-400 hover:underline">Privacy Policy</Link> and <Link to="/refund-policy" className="text-cyan-400 hover:underline">Refund Policy</Link>, constitute the entire agreement between you and AgentLead regarding the use of the Service and supersede all prior agreements, representations, and understandings.
            </p>
          </section>

          {/* 16 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">16. Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us:
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
            <Link to="/privacy" className="hover:text-cyan-400 transition-colors">Privacy Policy</Link>
            <Link to="/refund-policy" className="hover:text-cyan-400 transition-colors">Refund Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
