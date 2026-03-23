# Data Processing Agreement (DPA)

**Last Updated: March 2026**

This Data Processing Agreement ("DPA") supplements the Terms of Service and applies to the processing of personal data through the Lead Scraper Service.

---

## 1. Scope & Definitions

### 1.1 Applicability
This DPA applies when you use Lead Scraper to process personal data as defined by:
- GDPR (Regulation (EU) 2016/679)
- CCPA (California Consumer Privacy Act)
- LGPD (Lei Geral de Proteção de Dados)
- Other applicable data protection laws

### 1.2 Definitions

| Term | Definition |
|------|-----------|
| **Data Controller** | You - the entity determining how and why personal data is processed |
| **Data Processor** | Lead Scraper - processes data only as directed by the Controller |
| **Processing** | Any operation on personal data (collection, analysis, storage, deletion) |
| **Personal Data** | Information identifying or relating to a natural person |
| **Data Subject** | The individual whose data is being processed |
| **Standard Contractual Clauses (SCCs)** | EU-approved contracts for international data transfers |

### 1.3 Role Clarity
- **You are the Data Controller** - You collect leads, decide how to contact them, determine retention
- **Lead Scraper is the Data Processor** - We process data ONLY as you direct
- **Your customers/prospects are Data Subjects** - The individuals whose contact info is in the leads

---

## 2. Processing Instructions & Scope

### 2.1 Data You Control

You, as Data Controller, determine:
- **What data to collect** - Which fields (emails, phone, etc.)
- **Where from** - Public sources, LinkedIn, directories, etc.
- **How long to keep it** - Retention policies
- **What to do with it** - Contact frequency, channels, purposes
- **Who accesses it** - Your team, integrated tools

### 2.2 Data Processing We Perform

Lead Scraper, as Processor, provides:
- **Data scraping & collection** - From sources you specify
- **Storage & indexing** - Encrypted databases
- **AI qualification** - Lead scoring and segmentation
- **API delivery** - Access via REST APIs
- **Analytics** - Usage metrics and reporting
- **Compliance monitoring** - Rate limiting, abuse detection
- **Data deletion** - Per your retention instructions

### 2.3 Processing Limitations

Lead Scraper will:
- Process data ONLY per your written instructions
- NOT process data for Lead Scraper's own commercial purposes
- NOT combine your data with other customers' data
- NOT use your data for Lead Scraper marketing
- NOT share your data without your explicit consent
- NOT process sensitive data (unless you explicitly instruct)

---

## 3. Data Security & Protection

### 3.1 Security Obligations

Lead Scraper implements:

| Security Measure | Standard | Details |
|-----------------|----------|---------|
| **Encryption at Rest** | AES-256 | Industry-standard encryption |
| **Encryption in Transit** | TLS 1.3 | Secure data channels |
| **Access Control** | RBAC | Role-based permissions |
| **Authentication** | MFA available | Multi-factor authentication |
| **Monitoring** | 24/7 | Intrusion detection systems |
| **Vulnerability Testing** | Quarterly | Penetration testing, code audits |
| **Incident Response** | <1 hour | Security incident team |
| **Compliance Certs** | SOC 2 Type II | Third-party verified security |

### 3.2 Infrastructure Security
- Multi-region AWS deployment with automated failover
- VPC isolation and security groups
- WAF (Web Application Firewall) protection
- DDoS protection
- Regular backup and disaster recovery testing
- No data in-flight between regions without encryption

### 3.3 Personnel & Access
- Employees sign confidentiality agreements
- Least privilege access principles
- Background checks for security personnel
- No employee access to customer data without audit trail
- Mandatory security training (annual)
- Third-party security contractors NDA'd

### 3.4 Sub-processor Management

Lead Scraper uses these sub-processors:

| Sub-processor | Purpose | Safeguards |
|--------------|---------|-----------|
| Amazon Web Services (AWS) | Infrastructure & hosting | Standard Contractual Clauses, SOC 2 |
| Stripe / PayPal | Payment processing | PCI DSS Level 1 compliance |
| SendGrid | Email notifications | GDPR Data Processing Addendum |
| Google Analytics | Usage analytics | Analytics Data Processing Terms |
| Datadog | System monitoring | Data Processing Agreement |
| Auth0 | Authentication | Standard Contractual Clauses |

You authorize these sub-processors. We will notify you of material changes. You may object within 30 days.

### 3.5 What We Cannot Guarantee
- Lead Scraper cannot guarantee data protection against:
  - Nation-state cyber attacks
  - Zero-day exploits unknown to the industry
  - Physical compromise of data centers (rare)
- You remain responsible for using strong passwords, enabling 2FA, and monitoring account activity

---

## 4. Your Responsibilities as Data Controller

### 4.1 Legal Authority
You confirm that:
- You have the legal right to collect and process the leads
- You obtained data through lawful means
- You comply with all applicable data protection laws
- You have proper legal basis (consent, legitimate interest, legal obligation, etc.)

### 4.2 Compliance Obligations
You are responsible for:
- Complying with GDPR, CCPA, LGPD, and local laws
- Informing data subjects how their data is collected and used
- Obtaining necessary consents (where required)
- Responding to data subject rights requests (access, deletion, portability)
- Maintaining accurate information
- Determining retention periods
- Handling data subject requests promptly
- Documenting your legal basis for processing

### 4.3 Data Subject Rights Requests
When a data subject exercises their rights (access, deletion, portability, etc.):
- You will notify Lead Scraper within 10 business days
- We will assist by deleting data within 30 days
- We will provide data exports for portability requests
- We will certify completion in writing

### 4.4 Prohibited Uses
You agree NOT to use the Service to:
- Collect data from minors without parental consent
- Process special category data (race, health, etc.) without appropriate safeguards
- Violate wiretapping or electronic surveillance laws
- Scrape against website terms of service (without proper terms)
- Combine data from Lead Scraper with other databases to track individuals
- Discriminate based on protected characteristics
- Violate FCRA, FDCPA, or fair lending laws
- Engage in fraud, impersonation, or deception

### 4.5 Data Protection Impact Assessment (DPIA)
If your processing is high-risk, you must:
- Conduct a DPIA before using Lead Scraper
- Share results with Lead Scraper upon request
- Implement mitigations for identified risks

---

## 5. International Data Transfers

### 5.1 EU to US Transfers
For processing by Lead Scraper (US-based), transfers comply with:

**Standard Contractual Clauses (SCCs)**
- EU Commission Decision 2021/915 (Updated SCCs)
- Applies to all customer data transferred from EU to US
- Supplementary safeguards specified in Clause 11 of SCCs
- You accept that US government surveillance laws exist but are limited

**Adequacy Mechanisms**
- If relying on Adequacy Decisions, those laws govern instead
- SCCs are the primary mechanism as of March 2026

### 5.2 Supplementary Safeguards
Beyond standard contractual clauses:
- Lead Scraper doesn't store EU personal data on US government-accessible servers
- We encrypt data before transfer
- We provide tools for you to control data location (EU-only option available)
- We limit sub-processor transfers to those with adequate protections

### 5.3 Your Options
You can:
- Use Lead Scraper with standard safeguards (SCCs)
- Request EU-only data residency (available for Enterprise customers)
- Conduct your own adequacy/necessity assessment

### 5.4 Transfers to Other Regions
If we process data in other regions:
- We use Standard Contractual Clauses
- We document legal basis and local laws
- We implement equivalent security measures
- We notify you of material legal changes

---

## 6. Data Subject Rights Support

### 6.1 Access Requests (Right to Access)
When a data subject requests their information:
1. You notify Lead Scraper within 10 days
2. Lead Scraper extracts data within 5 business days
3. You provide the data to the subject

Data available for export:
- All lead attributes stored
- Processing history (when data was scraped)
- AI qualification scores
- Contact attempt logs
- Preference/unsubscribe status

### 6.2 Deletion Requests (Right to be Forgotten)
When a data subject requests deletion:
1. You notify Lead Scraper within 10 days
2. Lead Scraper deletes data within 30 days
3. We confirm deletion in writing

**Exception:** We may retain where:
- Required by law (tax records 7 years, court orders)
- Necessary for Lead Scraper's legitimate security interests
- You instruct otherwise

### 6.3 Portability Requests (Right to Data Portability)
When a data subject requests their data:
1. You notify Lead Scraper
2. We provide data in structured, commonly-used format (CSV, JSON)
3. Within 15 business days

Format available:
- All collected lead data
- AI scores
- Custom field values
- Interaction history

### 6.4 Correction/Rectification Requests
- You can update/correct data in your dashboard
- Lead Scraper does not independently correct data
- You remain responsible for accuracy

### 6.5 Restriction of Processing
- You can request restrictions in your account settings
- Lead Scraper will flag restricted records
- We'll store but not actively process them
- Upon request, we lift restrictions

---

## 7. Data Breach Notification

### 7.1 Lead Scraper's Obligations
If Lead Scraper detects a breach:
- **Within 24 hours:** Notify you with incident details
- **Within 72 hours:** Provide:
  - Description of personal data affected
  - Likely consequences of the breach
  - Measures taken/proposed to mitigate harm
  - Contact for further information

### 7.2 Incident Details
Notification includes:
- What happened (attack type, vulnerability exploited)
- When it occurred (discovery date vs. likely breach date)
- Scope (how many records, which types)
- Potential impact (identity theft risk, financial exposure, etc.)
- What we're doing about it (patches, investigation, monitoring)
- What you should do (notify authorities, warn users)

### 7.3 Your Notification Obligations
You are responsible for:
- Notifying data subjects where legally required
- Notifying regulators (e.g., ICO for UK/EU)
- Publishing breach notices
- Managing public communications

Lead Scraper will support by providing information and documentation.

### 7.4 Post-Breach Review
After any breach, Lead Scraper will:
- Conduct a root cause analysis
- Document findings in writing
- Implement preventive measures
- Demonstrate fixes to you upon request

---

## 8. Audits & Compliance Verification

### 8.1 Lead Scraper Audits
- Annual SOC 2 Type II audit (third-party verified)
- SOC 2 reports available to customers upon NDA
- Quarterly security assessments
- Annual penetration testing by external firm

### 8.2 Right to Audit
You have the right to:
- Request copies of security certifications (SOC 2, etc.)
- Request specific security documentation
- Perform reasonable audits (with 30 days notice)
- Engage third-party auditors

Audit requests should be reasonable in scope and frequency (max 1 per year unless:
- Regulatory requirement
- Security incident occurred
- Material change in security posture)

Lead Scraper may redact competitors' info and trade secrets.

### 8.3 Compliance Documentation
Lead Scraper will provide:
- Privacy impact assessments (upon request)
- Sub-processor list and agreements
- Data processing mapping
- Security controls documentation
- Breach response procedures

### 8.4 Regulatory Cooperation
If regulators request information about your processing:
- Lead Scraper will cooperate with your disclosure
- We'll notify you of regulatory requests (unless legally prohibited)
- We'll provide truthful documentation of our role

---

## 9. Data Deletion & Retention

### 9.1 Standard Retention
Lead Scraper retains data:
- **Active processing:** While you're an active customer
- **Post-deletion:** 90 days (for recovery/backup purposes)
- **Legal holds:** Until legal obligation satisfied
- **Dispute resolution:** Until resolution (typically 12 months)

### 9.2 Deletion Procedures
Upon account deletion or data purge:
1. You request deletion through dashboard or support
2. We queue deletion (immediate flag, 30-day purge)
3. Within 30 days, data deleted from active systems
4. Backup copies deleted within 90 days
5. We provide deletion certificate upon request

### 9.3 Residual Data
We cannot guarantee deletion of:
- Data in system backups (separate from primary deletion)
- Data in logs or anonymized analytics (removed of identifiers)
- Data required by law (retained per legal requirement)

---

## 10. Sub-Processor Changes

### 10.1 Notification Procedure
- Material sub-processor changes: 30 days advance notice
- We'll email you and provide new processor's data processing terms
- You may object within 30 days

### 10.2 What Constitutes Material Change
- Adding/removing a sub-processor
- Changing location of data processing
- Changing sub-processor's security posture
- NOT material: Updates to processor's address/contact

### 10.3 Your Right to Object
If you object to a sub-processor:
- Notify us within 30 days in writing
- We'll work with you to find alternatives
- If no resolution, you may terminate (paying pro-rata refund)

### 10.4 Current Sub-processors
See Section 3.4 for current list. Updated lists available at:
https://leadscraper.io/legal/sub-processors

---

## 11. Data Processing Minimization

### 11.1 Purpose Limitation
Lead Scraper processes data only for:
- Providing the Service as contracted
- Improving the Service (anonymized analytics)
- Compliance and legal obligations
- Security and fraud prevention

We will NOT use data for:
- Creating profiles for behavioral targeting
- Selling or trading data
- Training competitor products
- Determining creditworthiness or insurance

### 11.2 Data Minimization
You should collect only necessary data:
- Don't collect sensitive data unless essential
- Avoid collecting health, race, religion, etc.
- Limit to name, email, phone, company, title, location
- Optional fields for legitimate use cases only

### 11.3 Accuracy & Completeness
You are responsible for:
- Ensuring collected data is accurate
- Updating stale information
- Removing invalid records
- Lead Scraper provides tools but doesn't independently verify accuracy

---

## 12. Responsibilities Summary

| Responsibility | Data Controller (You) | Data Processor (Lead Scraper) |
|---|---|---|
| Legal basis for processing | ✓ | ✗ |
| DPIA (high-risk processing) | ✓ | Assist upon request |
| Data subject consent | ✓ | ✗ |
| Notify subjects (privacy notice) | ✓ | ✗ |
| Respond to data subject rights | ✓ | Assist (delete, export) |
| Security measures | ✗ | ✓ |
| Personnel confidentiality | ✗ | ✓ |
| Breach notification to subjects | ✓ | Assist with info |
| Breach notification to regulators | ✓ | Assist if you request |
| Sub-processor management | Approve | Manage/notify |
| International transfer compliance | ✓ | ✓ (jointly) |

---

## 13. Liability & Indemnification

### 13.1 Processor Liability Limits
Lead Scraper's liability for data processing violations is limited to:
- 1 year of fees you've paid
- OR the actual damages, whichever is lower
- Does not apply to indemnification obligations
- Does not apply to gross negligence or willful misconduct

### 13.2 Indemnification
You indemnify Lead Scraper from:
- Claims that your use of scraped data infringes third-party rights
- Claims arising from your non-compliance with this DPA or data laws
- Claims from data subjects you don't properly notify or handle
- Fines from regulators due to your violations (not ours)

### 13.3 Exceptions to Limitations
Liability limits do NOT apply to:
- Data breaches caused by our gross negligence
- Violations of confidentiality obligations
- Failure to delete data as instructed
- Either party's indemnification obligations
- Each party's liability to third parties

---

## 14. Term & Termination

### 14.1 Term
This DPA is effective when you:
- Sign up for Lead Scraper, OR
- Process EU/CA/BR personal data through Lead Scraper

It continues while you use the Service and for data retention period.

### 14.2 Termination Effects
Upon termination:
- Lead Scraper stops processing your data
- We delete data per Section 9 (within 30-90 days)
- Confidentiality obligations survive indefinitely
- Liability obligations survive for claims arising pre-termination

### 14.3 Survival
These sections survive termination:
- Data security and breach notification
- International transfers
- Liability and indemnification
- Confidentiality
- Audit and compliance rights

---

## 15. Amendments

### 15.1 Material Changes
If we materially change this DPA:
- We provide 30 days notice
- You may object
- If you don't accept changes, you may terminate

### 15.2 Legal Changes
If new laws require changes:
- We'll update immediately with notice
- We'll work with you for compliance
- Existing obligations survive unless superseded by law

---

## 16. Contact for DPA Matters

**Data Protection Officer (DPO):**
Email: dpo@leadscraper.io

**Privacy/DPA Inquiries:**
Email: privacy@leadscraper.io

**Processor Contact for Legal Process:**
Email: legal@leadscraper.io

---

## Appendix A: Standard Contractual Clauses

Lead Scraper incorporates by reference the Standard Contractual Clauses for processor-to-controller transfers (EU Commission Decision 2021/915), including:
- Module One (Controller to Processor)
- Supplementary Clauses per Schrems II ruling

Full text: https://ec.europa.eu/commission/presscorner/detail/en/IP_21_2847

---

## Appendix B: Data Security Specifications

| Component | Specification |
|-----------|---|
| Data at Rest | AES-256-GCM encryption, separate key management |
| Data in Transit | TLS 1.3 minimum, perfect forward secrecy |
| Database | Encrypted PostgreSQL with Transparent Data Encryption |
| Backups | Geographically distributed, encrypted, tested quarterly |
| Access Logs | Audit trail, 90-day retention, tamper-evident |
| Penetration Testing | Annual by independent firm, red-team exercises |
| Incident Response | <1 hour detection SLA, dedicated incident team |
| Patch Management | Critical patches within 7 days |

---

**This DPA is governed by the laws applicable to your jurisdiction and incorporates data protection laws (GDPR, CCPA, LGPD, etc.).**

**By using Lead Scraper to process personal data, you agree to this DPA as amended from time to time.**

**Last Updated: March 2026**
