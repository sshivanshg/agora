# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| main    | Yes       |

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Please email security@agora-debates.dev with:
- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested mitigations

You will receive a response within 48 hours. We aim to release a patch within 7 days of confirmation.

## Scope

- Prompt injection attacks on debate personas
- Authentication bypasses in the API
- Data leakage between user sessions
- SSRF via the fact-checker's web search integration
- SQL injection via the Drizzle query layer

## Out of scope

- Theoretical attacks without a proof of concept
- Social engineering of maintainers
- Issues in dependencies that are already publicly disclosed upstream

We appreciate responsible disclosure and will credit researchers in release notes unless they prefer to remain anonymous.
