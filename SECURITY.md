# Security Policy

## Supported Versions
Security fixes are provided for the latest release:

| Version | Supported          |
| :------ | :----------------- |
| 0.1.x   | :white_check_mark: |
| < 0.1   | :x:                |

---

## Reporting a Vulnerability

We take the security of KuraCode very seriously. If you believe you have discovered a vulnerability or security flaw, **please do not disclose it publicly** via GitHub Issues or discussions.

Instead, please report vulnerabilities privately:

1. **GitHub Security Advisory (Preferred):**  
   Navigate to the **Security** tab of this repository and click **"Report a vulnerability"**. This creates an isolated, encrypted draft advisory.

2. **Email Maintainer:**  
   If private advisories are unavailable, send an email to the project maintainer:  
   `kuracode-security@proton.me` or `sahinur.islam@outlook.com` with:
   - Description of the potential vulnerability
   - Step-by-step reproduction instructions or proof of concept (PoC)
   - Affected browser, extension version, and operating system
   - Any proposed remediation

---

## Response Timeline
- **Initial acknowledgment:** within 48 hours
- **Assessment and triage:** within 5 business days
- **Fix and disclosure schedule:** coordinated release following responsible disclosure principles.

---

## Secret Scanning and Protection
This repository enforces automated secret detection via CI workflows and pre-commit checks. Never commit API keys, personal access tokens, or sensitive user environment parameters.
