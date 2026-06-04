# GSWS Security Policy

## Reporting Vulnerabilities
Contact: ovie@meridianpeople.co.uk

## Known Accepted Risks

### npm audit — PostCSS moderate severity
- CVE: GHSA-qx2v-qp2m-jg93
- Affected: postcss (via next.js build chain)
- Risk: Build-time only, not exploitable at runtime
- Fix: Would require downgrading Next.js to 9.x (breaking change)
- Decision: Accepted — monitored for upstream fix
- Reviewed: 2026-06-04

## Security Controls

| Control | Status | Details |
|---------|--------|---------|
| Authentication | ✅ | Better Auth + bcrypt (12 rounds) |
| Rate limiting | ✅ | Login 10/15min, Register 5/hr, Reset 3/15min |
| Security headers | ✅ | HSTS, X-Frame-Options, X-Content-Type, X-XSS |
| SQL injection | ✅ | Parameterised queries (better-sqlite3) |
| Password storage | ✅ | bcrypt $2b$12$ |
| Password reuse | ✅ | Last 5 passwords checked |
| Session management | ✅ | 7-day sliding, idle timeout 15min |
| Email verification | ✅ | Required for native accounts |
| Secrets management | ✅ | .env.local not in git, 600 permissions |
| DB permissions | ✅ | 600 owner-only |
| Audit logging | ✅ | All actions logged to gsws_audit_log |
| Impersonation | ✅ | Time-limited, logged, email alert |
| IDOR protection | ✅ | All routes scope to user_id |
| Brute force | ✅ | Rate limited, tested |
| HTTPS | ✅ | HSTS enforced |

## Open Ports
| Port | Service | Justification |
|------|---------|---------------|
| 22 | SSH | Server management |
| 25 | SMTP | Email delivery |
| 80 | HTTP | Redirects to HTTPS |
| 443 | HTTPS | Main application |
| 8080/8443 | nginx | Returns 403, not exposed |
| 3306 | MySQL | Shared hosting platform (not GSWS) |
| 21 | FTP | Shared hosting platform (not GSWS) |

## Pending Improvements
- [ ] Content Security Policy (CSP)
- [ ] Redis-based rate limiting (multi-instance)
- [ ] Managed lock on all write routes
- [ ] Port 3306/21 firewall rules (infrastructure team)
