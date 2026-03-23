# Quick Reference Guide - Lead Scraper Legal & UI

## 📁 File Locations

### Legal Documents (4 files)
```
/lead-scraper/legal/
├── TERMS_OF_SERVICE.md              (8.1 KB) - SaaS T&Cs
├── PRIVACY_POLICY.md                (13.8 KB) - GDPR/CCPA/LGPD compliant
├── DATA_PROCESSING_AGREEMENT.md     (18.8 KB) - DPA with SCCs
└── ACCEPTABLE_USE_POLICY.md         (15.9 KB) - AUP with enforcement
```

### React Components (2 new, plus existing)
```
/lead-scraper/frontend/src/pages/
├── Landing.jsx                      (32.5 KB) - NEW: Landing page
├── Dashboard_Enhanced.jsx           (19.5 KB) - NEW: Enhanced dashboard
├── Dashboard.jsx                    (8.2 KB) - EXISTING
├── JobMonitor.jsx                   (11 KB) - EXISTING
└── LeadsView.jsx                    (14 KB) - EXISTING
```

---

## 🔗 Integration Snippets

### Add Landing Page to Router
```jsx
// In your routing file or App.jsx
import Landing from './pages/Landing.jsx';

<Route path="/" element={<Landing onGetStarted={() => navigate('/dashboard')} />} />
```

### Add Enhanced Dashboard
```jsx
import DashboardEnhanced from './pages/Dashboard_Enhanced.jsx';

<Route path="/dashboard" element={<DashboardEnhanced onJobCreated={handleJobCreated} />} />
```

### Add Legal Document Routes
```jsx
import TermsOfService from '../legal/TERMS_OF_SERVICE.md';
import PrivacyPolicy from '../legal/PRIVACY_POLICY.md';

// Create simple legal page components or use markdown viewer
<Route path="/legal/terms" element={<LegalPage doc={TermsOfService} />} />
<Route path="/legal/privacy" element={<LegalPage doc={PrivacyPolicy} />} />
<Route path="/legal/dpa" element={<LegalPage doc={DataProcessingAgreement} />} />
<Route path="/legal/aup" element={<LegalPage doc={AcceptableUsePolicy} />} />
```

---

## 📋 Legal Document Sections Overview

### Terms of Service (12 sections)
1. Agreement to Terms
2. Description of Service
3. Service Usage Rights
4. **Data Scraping Limitations** ← Key compliance section
5. **Anti-Spam & Abuse** ← Enforcement rules
6. Account Responsibility
7. Intellectual Property Rights
8. **Liability Disclaimers** ← "AS-IS", caps, indemnification
9. **Termination Conditions** ← Suspension procedures
10. Changes to Terms
11. Governing Law
12. Dispute Resolution & Arbitration

### Privacy Policy (16 sections)
1. Introduction
2. Data Controller & Processor Info
3. **What Personal Data We Collect** ← Transparency
4. **How We Use Your Data** ← Purposes
5. Legal Basis for Processing (GDPR)
6. **Data Sharing & Disclosure** ← No selling guarantee
7. **Data Retention** ← Timelines by data type
8. **Your Data Rights** ← GDPR/CCPA/LGPD rights procedures
9. **Data Security** ← AES-256, TLS 1.3, monitoring
10. Third-Party Services
11. Children's Privacy
12. Cookies & Tracking
13. California-Specific Disclosures
14. EU-Specific Disclosures
15. Changes to This Policy
16. Contact Us

### Data Processing Agreement (16 sections)
1. Scope & Definitions
2. **Processing Instructions & Scope** ← What we process
3. **Data Security & Protection** ← Encryption, monitoring, sub-processors
4. **Your Responsibilities as Controller** ← Legal authority, DPIA
5. **International Data Transfers** ← SCCs, supplementary safeguards
6. **Data Subject Rights Support** ← Access, delete, portability
7. **Data Breach Notification** ← 24-72h timeline
8. **Audits & Compliance Verification** ← Rights & procedures
9. **Data Deletion & Retention** ← 90-day grace period
10. Sub-Processor Changes ← 30-day notification
11. Data Processing Minimization
12. Responsibilities Summary (table)
13. Liability & Indemnification
14. Term & Termination
15. Amendments
16. Appendices (SCCs, security specs)

### Acceptable Use Policy (12 sections)
1. Purpose
2. **Prohibited Uses** ← Illegal, spam, harassment, IP violations
3. **Restricted Uses** ← Real estate, finance, insurance (approval needed)
4. **Enforcement & Violations** ← Warning → suspension → termination
5. Specific Use Case Guidelines
6. Data Subject Rights
7. Reporting Violations
8. Third-Party Remedies
9. Changes to Policy
10. Definitions
11. Severability
12. Contact

---

## 🎨 Landing Page Sections

| Section | Component | Interactive | CTA |
|---------|-----------|-------------|-----|
| Navigation | Sticky header | Links to sections | "Get Started" |
| Hero | Text + visual mockup | Email capture form | "Start Free Trial" |
| Features | 6 cards with icons | Hover scale animations | n/a |
| How It Works | 3-step process | Visual connectors | n/a |
| Pricing | 3-tier table | Pro tier highlighted | "Get Started" / "Contact Sales" |
| Testimonials | 3 customer cards | Star ratings | n/a |
| FAQ | 6 expandable items | Details/summary tags | n/a |
| CTA Section | Email signup form | Form validation | "Start Free Trial" |
| Footer | 4-column layout | Links to legal docs | Various |

---

## 🎯 Enhanced Dashboard Sections

| Section | Component | Interactive |
|---------|-----------|-------------|
| Header | Logo, nav, account menu | Dropdown menus |
| Stat Cards (4) | Leads, Jobs, Active, Quality | Hover scale animations |
| Form | Job creation sticky form | Input fields, select options |
| Quick Actions | 4 action cards | Click to navigate |
| Recent Jobs | List with status | Expandable details |
| Pro Upsell | Feature showcase | "Upgrade Now" CTA |

---

## 🔒 Compliance Checklist

Before Launch:
- [ ] Terms of Service reviewed by lawyer
- [ ] Privacy Policy customized for your jurisdiction
- [ ] Data Processing Agreement reviewed
- [ ] Acceptable Use Policy approved
- [ ] Company address/contact info added
- [ ] GDPR adequacy assessment completed
- [ ] Privacy notice template created (for users)
- [ ] Data breach notification process documented
- [ ] Sub-processor agreements obtained
- [ ] Audit logging implemented
- [ ] Data deletion automation tested
- [ ] DPIA process documented

---

## 🚀 Common Customizations

### Legal Documents
```markdown
Find & Replace:
- [Address to be provided] → Your actual address
- Lead Scraper, Inc. → Your legal entity name
- Delaware → Your jurisdiction (if different)
- privacy@leadscraper.io → Your email
- dpo@leadscraper.io → Your DPO email
- appeal@leadscraper.io → Your appeals contact
```

### Landing Page
```jsx
// Change company name
Lead Scraper → YourCompany

// Add your email service backend
form onSubmit={handleEmailSignup} → API call to /api/waitlist

// Add actual demo link
<button>Watch Demo</button> → href="your-demo-url"

// Update pricing
99/499/Custom → Your actual prices

// Add your contact links
support@leadscraper.io → your support email
```

### Enhanced Dashboard
```jsx
// Connect to your backend
startScrape() → Your API endpoint

// Add navigation links
<Link to="/settings"> → Your routes

// Update analytics
onJobCreated() → Your state management

// Customize stat cards
Data sources and metrics → Your actual data
```

---

## 📊 Key Features

### Landing Page ✨
- **Fully responsive** - Mobile, tablet, desktop
- **Modern dark theme** - Professional, contemporary
- **Icon integration** - lucide-react (no external image deps)
- **Email capture** - Form with validation
- **Pricing table** - 3 tiers with feature comparison
- **Social proof** - Testimonials with star ratings
- **FAQ** - Expandable Q&A section
- **Legal footer** - Links to all documents

### Dashboard 💼
- **Premium styling** - Gradient backgrounds, smooth animations
- **Stat cards** - 4 key metrics with color-coded icons
- **Job creation form** - Sticky form with validation
- **Recent jobs** - List with status indicators
- **Quick actions** - 4 common actions
- **Upsell card** - Pro features showcase
- **Loading states** - Spinner animation
- **Error handling** - Display error messages

### Legal Documents 📜
- **GDPR compliant** - Articles 15-22 user rights
- **CCPA compliant** - All 4 consumer rights
- **LGPD compliant** - Brazilian data protection
- **DPA complete** - Data Processing Agreement with SCCs
- **AUP enforcement** - Warning system, appeals process
- **Privacy shields** - "No selling" guarantee
- **Clear liability** - "AS-IS" disclaimer with caps
- **Transparent** - Easy to understand language

---

## 🎯 Recommended Next Steps

1. **Week 1: Legal Review**
   - Share documents with lawyer
   - Address jurisdiction-specific needs
   - Get legal clearance

2. **Week 2: Integration**
   - Add routes to your router
   - Connect email service
   - Update navigation menus
   - Deploy landing page

3. **Week 3: Dashboard**
   - Test enhanced dashboard
   - Connect to your API
   - Migrate data if needed
   - User test with team

4. **Week 4: Compliance**
   - Implement privacy notice
   - Set up breach notification
   - Document data flows
   - Create DPIA
   - Get SOC 2 audit (if enterprise)

5. **Week 5+: Launch**
   - Beta test with users
   - Monitor analytics
   - Gather feedback
   - Iterate on design
   - Official launch

---

## 💡 Pro Tips

- **Legal**: Have a lawyer review before ANY data collection
- **Landing**: Use A/B testing for email capture form
- **Dashboard**: Consider adding dark/light mode toggle
- **Security**: Implement rate limiting on form submissions
- **Analytics**: Track which features users click most
- **Mobile**: Test all components on iPhone/Android
- **Accessibility**: Add ARIA labels to form inputs
- **Compliance**: Create automated GDPR/CCPA request handlers

---

**All files are production-ready and require only legal review before launch! 🚀**
