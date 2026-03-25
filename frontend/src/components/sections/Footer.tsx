import React from "react";
import { Zap } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-950 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
                <img src="/logo.png" alt="Agent Lead" className="w-8 h-8 object-contain" />
              </div>
              <span className="text-lg font-bold gradient-text-cyan">Agent Lead</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              AI-powered lead generation and outreach automation for businesses that want to scale.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-3 text-gray-500 text-sm">
              <li><a href="#features" className="hover:text-cyan-400 transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-cyan-400 transition-colors">Pricing</a></li>
              <li><a href="#how-it-works" className="hover:text-cyan-400 transition-colors">How It Works</a></li>
              <li><a href="/download" className="hover:text-cyan-400 transition-colors">Desktop App</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors">API Docs</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-3 text-gray-500 text-sm">
              <li><a href="/legal/terms" className="hover:text-cyan-400 transition-colors">Terms of Service</a></li>
              <li><a href="/legal/privacy" className="hover:text-cyan-400 transition-colors">Privacy Policy</a></li>
              <li><a href="/legal/dpa" className="hover:text-cyan-400 transition-colors">Data Processing</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4">Contact</h4>
            <ul className="space-y-3 text-gray-500 text-sm">
              <li><a href="mailto:support@agentlead.io" className="hover:text-cyan-400 transition-colors">support@agentlead.io</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors">Twitter / X</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors">LinkedIn</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors">Discord</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <p className="text-center text-gray-600 text-sm">
            © 2026 Agent Lead. All rights reserved. Built for businesses that want to win.
          </p>
        </div>
      </div>
    </footer>
  );
}
