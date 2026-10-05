# Security Policy

neverupload's core promise is that **files never leave the user's device**. We treat anything
that breaks that promise as a security issue of the highest priority.

## Supported versions

Only the latest version on the `main` branch (and the live site built from it) is supported.

## Reporting a vulnerability

**Please do not open a public issue.** Instead, use
[GitHub's private vulnerability reporting](https://github.com/99proteam/neverupload/security/advisories/new).

Please include:

- what the issue is and its impact,
- steps to reproduce (a proof-of-concept file is welcome if it contains no private data),
- the browser and OS you used.

You can expect a first reply within 7 days. We'll keep you updated and credit you in the
release notes unless you prefer to stay anonymous.

## What counts

Examples of in-scope issues:

- Any way file contents or metadata could be sent off the device
- Bypasses of the Content Security Policy
- Script injection (XSS) through crafted file names, PDFs or images
- A malicious file that can do more than crash or hang its own browser tab
- Supply-chain concerns with our dependencies or GitHub Actions workflows

Out of scope: a crafted file making the tab run out of memory or freeze (please report it as a
normal bug), and issues in browsers that are no longer supported by their vendor.
