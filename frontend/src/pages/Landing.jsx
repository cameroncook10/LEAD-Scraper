import React, { useState } from 'react';
import { ArrowRight, Zap, Brain, TrendingUp, Check, Star, Users, Shield, Rocket } from 'lucide-react';

export default function Landing({ onGetStarted }) {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const handleEmailSignup = (e) => {
    e.preventDefault();
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    // In production, submit to backend/email service
    console.log('Email signup:', email);
    setEmail('');
    setEmailError('');
    alert('Thanks! Check your email for early access.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed w-full top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Zap className="w-8 h-8 text-blue-500" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Lead Scraper
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="hover:text-blue-400 transition">Features</a>
              <a href="#how-it-works" className="hover:text-blue-400 transition">How It Works</a>
              <a href="#pricing" className="hover:text-blue-400 transition">Pricing</a>
              <a href="#faq" className="hover:text-blue-400 transition">FAQ</a>
              <button
                onClick={onGetStarted}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-semibold transition"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Hero Text */}
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-block bg-blue-500/10 border border-blue-500/30 rounded-lg px-4 py-2">
                  <span className="text-blue-400 text-sm font-semibold">🚀 AI-Powered Lead Generation</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                  Find & Qualify Leads in <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Minutes</span>
                </h1>
                <p className="text-xl text-slate-300 max-w-lg">
                  Scrape business leads from the web, qualify with AI, and integrate with your CRM. Real-time tracking. No limits.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={onGetStarted}
                  className="group bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-bold text-lg flex items-center justify-center space-x-2 transition transform hover:scale-105"
                >
                  <span>Start 3-Day Trial</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
                </button>
                <button className="border-2 border-slate-600 hover:border-blue-400 text-white px-8 py-4 rounded-lg font-bold transition">
                  Watch Demo
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 text-sm text-slate-400">
                <div className="flex items-center space-x-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Get started in 2 minutes</span>
                </div>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative h-96 md:h-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-3xl blur-3xl"></div>
              <div className="relative bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl border border-slate-700 p-8 space-y-4 shadow-2xl">
                <div className="space-y-3">
                  <div className="h-4 bg-slate-600 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-600 rounded w-1/2"></div>
                </div>
                <div className="grid grid-cols-3 gap-3 pt-6 border-t border-slate-600">
                  <div className="bg-slate-700/50 rounded p-3 text-center">
                    <div className="text-2xl font-bold text-blue-400">2.5K</div>
                    <div className="text-xs text-slate-400">Leads/min</div>
                  </div>
                  <div className="bg-slate-700/50 rounded p-3 text-center">
                    <div className="text-2xl font-bold text-cyan-400">94%</div>
                    <div className="text-xs text-slate-400">Accuracy</div>
                  </div>
                  <div className="bg-slate-700/50 rounded p-3 text-center">
                    <div className="text-2xl font-bold text-purple-400">2m</div>
                    <div className="text-xs text-slate-400">Setup Time</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold">Powerful Features</h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Everything you need to find, qualify, and engage your ideal leads
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1: Web Scraping */}
            <div className="group bg-gradient-to-br from-slate-800 to-slate-700/50 border border-slate-700 hover:border-blue-500/50 rounded-xl p-8 transition transform hover:scale-105 duration-300">
              <div className="bg-blue-500/10 w-14 h-14 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition">
                <Zap className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Lightning-Fast Scraping</h3>
              <p className="text-slate-400 mb-6">
                Scrape leads at high speed from public sources. Real-time monitoring and pause controls.
              </p>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Multiple sources</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Auto rate limiting</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Legal & compliant</span>
                </li>
              </ul>
            </div>

            {/* Feature 2: AI Qualification */}
            <div className="group bg-gradient-to-br from-slate-800 to-slate-700/50 border border-slate-700 hover:border-cyan-500/50 rounded-xl p-8 transition transform hover:scale-105 duration-300">
              <div className="bg-cyan-500/10 w-14 h-14 rounded-lg flex items-center justify-center mb-4 group-hover:bg-cyan-500/20 transition">
                <Brain className="w-7 h-7 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">AI Qualification</h3>
              <p className="text-slate-400 mb-6">
                Automatically score and segment leads using ML. Identify your hottest prospects in seconds.
              </p>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>94% accuracy</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Custom scoring</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Real-time insights</span>
                </li>
              </ul>
            </div>

            {/* Feature 3: Real-Time Tracking */}
            <div className="group bg-gradient-to-br from-slate-800 to-slate-700/50 border border-slate-700 hover:border-purple-500/50 rounded-xl p-8 transition transform hover:scale-105 duration-300">
              <div className="bg-purple-500/10 w-14 h-14 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition">
                <TrendingUp className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Real-Time Tracking</h3>
              <p className="text-slate-400 mb-6">
                Monitor lead engagement, track opens, clicks, and replies. Know what works in real-time.
              </p>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Live dashboards</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Activity logs</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Custom alerts</span>
                </li>
              </ul>
            </div>

            {/* Feature 4: CRM Integration */}
            <div className="group bg-gradient-to-br from-slate-800 to-slate-700/50 border border-slate-700 hover:border-green-500/50 rounded-xl p-8 transition transform hover:scale-105 duration-300">
              <div className="bg-green-500/10 w-14 h-14 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-500/20 transition">
                <Rocket className="w-7 h-7 text-green-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">CRM Integration</h3>
              <p className="text-slate-400 mb-6">
                Sync to popular CRM tools like Salesforce, HubSpot, and Pipedrive. Stay in sync always.
              </p>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>CRM integrations</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Two-way sync</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>API available</span>
                </li>
              </ul>
            </div>

            {/* Feature 5: Data Security */}
            <div className="group bg-gradient-to-br from-slate-800 to-slate-700/50 border border-slate-700 hover:border-red-500/50 rounded-xl p-8 transition transform hover:scale-105 duration-300">
              <div className="bg-red-500/10 w-14 h-14 rounded-lg flex items-center justify-center mb-4 group-hover:bg-red-500/20 transition">
                <Shield className="w-7 h-7 text-red-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Enterprise Security</h3>
              <p className="text-slate-400 mb-6">
                GDPR & CCPA compliant. SOC 2 Type II. AES-256 encryption. Your data is safe with us.
              </p>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Enterprise encryption</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Compliance docs</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>24/7 monitoring</span>
                </li>
              </ul>
            </div>

            {/* Feature 6: Support */}
            <div className="group bg-gradient-to-br from-slate-800 to-slate-700/50 border border-slate-700 hover:border-yellow-500/50 rounded-xl p-8 transition transform hover:scale-105 duration-300">
              <div className="bg-yellow-500/10 w-14 h-14 rounded-lg flex items-center justify-center mb-4 group-hover:bg-yellow-500/20 transition">
                <Users className="w-7 h-7 text-yellow-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Expert Support</h3>
              <p className="text-slate-400 mb-6">
                Get help from our team. Live chat, email, and phone support. Average response: 15 minutes.
              </p>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Live chat & email</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Phone support</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Community forum</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold">How It Works</h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Get leads in 3 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-4 relative">
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-gradient-to-br from-slate-800 to-slate-700/50 border border-slate-700 rounded-xl p-8">
                <div className="absolute -top-5 left-8 bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">
                  1
                </div>
                <div className="mt-4">
                  <h3 className="text-2xl font-bold mb-4">Define Your Search</h3>
                  <p className="text-slate-400">
                    Tell us what you're looking for. Keywords, location, industry, company size. Be specific.
                  </p>
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="hidden md:flex items-center justify-center absolute top-1/3 left-1/3 right-2/3">
              <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-transparent rounded-full"></div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="bg-gradient-to-br from-slate-800 to-slate-700/50 border border-slate-700 rounded-xl p-8">
                <div className="absolute -top-5 left-8 bg-cyan-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">
                  2
                </div>
                <div className="mt-4">
                  <h3 className="text-2xl font-bold mb-4">AI Qualifies Leads</h3>
                  <p className="text-slate-400">
                    Our AI scores each lead for fit. See who's most likely to convert. Filter by quality threshold.
                  </p>
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="hidden md:flex items-center justify-center absolute top-1/3 right-1/3 left-2/3">
              <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-transparent rounded-full"></div>
            </div>

            {/* Step 3 */}
            <div className="relative md:col-start-3">
              <div className="bg-gradient-to-br from-slate-800 to-slate-700/50 border border-slate-700 rounded-xl p-8">
                <div className="absolute -top-5 left-8 bg-purple-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">
                  3
                </div>
                <div className="mt-4">
                  <h3 className="text-2xl font-bold mb-4">Export or Integrate</h3>
                  <p className="text-slate-400">
                    Download CSV, sync to your CRM, or use our API. Start reaching out immediately.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold">Simple, Transparent Pricing</h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              No hidden fees. Pay for what you use.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Starter Plan */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-700/50 border border-slate-700 rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-2">Starter</h3>
              <p className="text-slate-400 mb-6">For freelancers & small teams</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">$99</span>
                <span className="text-slate-400">/month</span>
              </div>
              <button className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-semibold mb-8 transition">
                Get Started
              </button>
              <ul className="space-y-4 text-slate-300">
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>10,000 leads/month</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>AI qualification</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Email support</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>CSV export</span>
                </li>
              </ul>
            </div>

            {/* Pro Plan (Featured) */}
            <div className="bg-gradient-to-br from-blue-900 to-cyan-900/50 border border-blue-500/50 rounded-xl p-8 relative transform scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <p className="text-slate-300 mb-6">For growing sales teams</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">$499</span>
                <span className="text-slate-300">/month</span>
              </div>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold mb-8 transition">
                Get Started
              </button>
              <ul className="space-y-4 text-slate-300">
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>100,000 leads/month</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>AI qualification</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>CRM integrations</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>API access</span>
                </li>
              </ul>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-700/50 border border-slate-700 rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
              <p className="text-slate-400 mb-6">For large organizations</p>
              <div className="mb-6">
                <span className="text-3xl font-bold">Custom</span>
              </div>
              <button className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-semibold mb-8 transition">
                Contact Sales
              </button>
              <ul className="space-y-4 text-slate-300">
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Unlimited leads</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Custom integrations</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Dedicated support</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>SSO & advanced security</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>SLA guarantee</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold">What Users Say</h2>
            <p className="text-xl text-slate-400">Hear from early adopters using Agent Lead</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Sarah Chen',
                title: 'Sales Director, TechFlow',
                quote: 'Lead Scraper cut our lead generation time from days to hours. The AI qualification is scary accurate.',
                rating: 5
              },
              {
                name: 'Marcus Johnson',
                title: 'Founder, GrowthCo',
                quote: 'Best investment we made this year. ROI is incredible. Support team is genuinely helpful.',
                rating: 5
              },
              {
                name: 'Emily Rodriguez',
                title: 'VP Sales, Innovate Inc',
                quote: 'The real-time tracking dashboard gives us insights we never had before. Game changer for our team.',
                rating: 5
              }
            ].map((testimonial, i) => (
              <div key={i} className="bg-gradient-to-br from-slate-800 to-slate-700/50 border border-slate-700 rounded-xl p-8">
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-300 mb-6 italic">"{testimonial.quote}"</p>
                <div>
                  <p className="font-bold">{testimonial.name}</p>
                  <p className="text-sm text-slate-400">{testimonial.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'Is Lead Scraper GDPR & CCPA compliant?',
                a: 'Yes! We provide comprehensive compliance tools. See our Data Processing Agreement for full details.'
              },
              {
                q: 'Can I integrate with my CRM?',
                a: 'Yes! We integrate with Salesforce, HubSpot, Pipedrive, and more. Check our integrations page.'
              },
              {
                q: 'What if I need more leads than my plan allows?',
                a: 'No problem! You can add leads anytime. Upgrade your plan or purchase add-ons as needed.'
              },
              {
                q: 'How accurate is the AI qualification?',
                a: 'Our AI achieves 94% accuracy on lead scoring. Accuracy depends on the data quality and your specific criteria.'
              },
              {
                q: 'Do you offer a free trial?',
                a: 'Yes! Every plan includes a 3-day free trial. You\'ll enter your card upfront but won\'t be charged until the trial ends. We send a cancellation reminder before your first charge.'
              },
              {
                q: 'What kind of support do you offer?',
                a: 'Live chat, email, and phone support. Pro/Enterprise customers get priority support with 15-minute response SLA.'
              }
            ].map((item, i) => (
              <details key={i} className="group bg-gradient-to-br from-slate-800 to-slate-700/50 border border-slate-700 rounded-xl p-6 cursor-pointer hover:border-blue-500/50 transition">
                <summary className="flex items-center justify-between font-bold text-lg">
                  {item.q}
                  <span className="group-open:rotate-180 transition duration-300">▼</span>
                </summary>
                <p className="text-slate-400 mt-4">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl p-12 text-center space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold">Ready to Get Started?</h2>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Start generating qualified leads with Agent Lead.
          </p>
          <form onSubmit={handleEmailSignup} className="max-w-md mx-auto space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email..."
              className="w-full px-6 py-3 rounded-lg bg-white text-slate-900 font-medium placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            {emailError && <p className="text-red-200 text-sm">{emailError}</p>}
            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-lg font-bold flex items-center justify-center space-x-2 transition"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
          <p className="text-blue-100 text-sm">No credit card required • Get started in 2 minutes</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Zap className="w-6 h-6 text-blue-500" />
                <span className="font-bold">Lead Scraper</span>
              </div>
              <p className="text-slate-400 text-sm">
                The fastest way to find and qualify business leads.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#features" className="hover:text-blue-400 transition">Features</a></li>
                <li><a href="#pricing" className="hover:text-blue-400 transition">Pricing</a></li>
                <li><a href="#how-it-works" className="hover:text-blue-400 transition">How It Works</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="/legal/terms" className="hover:text-blue-400 transition">Terms of Service</a></li>
                <li><a href="/legal/privacy" className="hover:text-blue-400 transition">Privacy Policy</a></li>
                <li><a href="/legal/dpa" className="hover:text-blue-400 transition">Data Processing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Contact</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="mailto:support@leadscraper.io" className="hover:text-blue-400 transition">support@leadscraper.io</a></li>
                <li className="hover:text-blue-400 transition">Twitter</li>
                <li className="hover:text-blue-400 transition">LinkedIn</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-8">
            <p className="text-center text-slate-400 text-sm">
              © 2026 Lead Scraper. All rights reserved. | Built with ❤️ for sales teams.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
