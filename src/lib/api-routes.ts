export interface ApiRoute {
  group: string
  method: string
  path: string
  auth: boolean
  desc: string
  body?: string
  response: string
  params?: string
}

export const ROUTES: ApiRoute[] = [
  // AUTH
  { group: 'Auth', method: 'POST', path: '/api/auth/gsws-login', auth: false, desc: 'Login with email/password (WP or native)', body: '{"email":"","password":""}', response: '{"success":true,"user":{...}}' },
  { group: 'Auth', method: 'POST', path: '/api/auth/register', auth: false, desc: 'Register new native account', body: '{"name":"","email":"","password":"","couponCode":""}', response: '{"success":true,"message":"..."}' },
  { group: 'Auth', method: 'POST', path: '/api/auth/forgot-password', auth: false, desc: 'Send password reset email', body: '{"email":""}', response: '{"success":true}' },
  { group: 'Auth', method: 'POST', path: '/api/auth/reset-password', auth: false, desc: 'Reset password with token', body: '{"token":"","password":""}', response: '{"success":true}' },
  { group: 'Auth', method: 'GET', path: '/api/auth/verify-email', auth: false, desc: 'Verify email address', params: '?token=', response: '{"success":true}' },
  { group: 'Auth', method: 'GET', path: '/api/auth/me', auth: true, desc: 'Get current session user', response: '{"user":{id,email,role,creditBalance,...}}' },
  { group: 'Auth', method: 'POST', path: '/api/auth/logout', auth: true, desc: 'Logout and clear session', response: '{"success":true}' },

  // PACKAGES
  { group: 'Packages', method: 'GET', path: '/api/packages/list', auth: true, desc: 'List all packages for current user', response: '[{id,domain,status,label,...}]' },
  { group: 'Packages', method: 'GET', path: '/api/packages/types', auth: true, desc: 'List available package types from reseller', response: '[{id,label,description,...}]' },
  { group: 'Packages', method: 'POST', path: '/api/packages/create', auth: true, desc: 'Create new hosting package', body: '{"domain":"","type":"","stackUserId":""}', response: '{"success":true,"packageId":""}' },
  { group: 'Packages', method: 'POST', path: '/api/packages/delete', auth: true, desc: 'Delete a hosting package', body: '{"packageId":""}', response: '{"success":true}' },
  { group: 'Packages', method: 'GET', path: '/api/packages/[id]/web/info', auth: true, desc: 'Get package web info and stats', response: '{diskUsage,bandwidth,maintenanceMode,...}' },
  { group: 'Packages', method: 'GET', path: '/api/packages/[id]/bandwidth', auth: true, desc: 'Get bandwidth usage', response: '{used,limit,...}' },
  { group: 'Packages', method: 'GET', path: '/api/packages/[id]/storage', auth: true, desc: 'Get disk usage', response: '{used,limit,...}' },
  { group: 'Packages', method: 'GET', path: '/api/packages/[id]/logs', auth: true, desc: 'Get error/access logs', params: '?type=error|access', response: '[{...}]' },
  { group: 'Packages', method: 'GET', path: '/api/packages/[id]/malware', auth: true, desc: 'Get malware scan results', response: '{status,threats,...}' },
  { group: 'Packages', method: 'POST', path: '/api/packages/[id]/malware', auth: true, desc: 'Trigger malware scan', response: '{"success":true}' },

  // DNS
  { group: 'DNS', method: 'GET', path: '/api/packages/[id]/dns', auth: true, desc: 'Get DNS records for package', response: '[{type,host,data,ttl,...}]' },
  { group: 'DNS', method: 'POST', path: '/api/packages/[id]/dns', auth: true, desc: 'Add DNS record', body: '{"type":"A","host":"@","data":"1.2.3.4","ttl":3600}', response: '{"success":true}' },
  { group: 'DNS', method: 'DELETE', path: '/api/packages/[id]/dns', auth: true, desc: 'Delete DNS record', body: '{"ref":""}', response: '{"success":true}' },
  { group: 'DNS', method: 'GET', path: '/api/packages/[id]/nameservers', auth: true, desc: 'Get nameservers', response: '["ns1.20i.com","ns2.20i.com"]' },
  { group: 'DNS', method: 'POST', path: '/api/packages/[id]/nameservers', auth: true, desc: 'Update nameservers', body: '{"nameservers":["ns1...","ns2..."]}', response: '{"success":true}' },

  // EMAIL
  { group: 'Email', method: 'GET', path: '/api/packages/[id]/email/all', auth: true, desc: 'Get all email config (mailboxes, forwarders, etc)', response: '{mailboxes:[],forwarders:[],...}' },
  { group: 'Email', method: 'GET', path: '/api/packages/[id]/email/mailbox', auth: true, desc: 'List mailboxes', response: '[{email,quota,...}]' },
  { group: 'Email', method: 'POST', path: '/api/packages/[id]/email/mailbox', auth: true, desc: 'Create mailbox', body: '{"local":"","domain":"","password":"","quotaMB":1000}', response: '{"success":true}' },
  { group: 'Email', method: 'DELETE', path: '/api/packages/[id]/email/mailbox', auth: true, desc: 'Delete mailbox', body: '{"local":"","domain":""}', response: '{"success":true}' },
  { group: 'Email', method: 'POST', path: '/api/packages/[id]/email/mailbox/password', auth: true, desc: 'Change mailbox password', body: '{"local":"","domain":"","password":""}', response: '{"success":true}' },
  { group: 'Email', method: 'GET', path: '/api/packages/[id]/email/forwarder', auth: true, desc: 'List email forwarders', response: '[{local,domain,destinations}]' },
  { group: 'Email', method: 'POST', path: '/api/packages/[id]/email/forwarder', auth: true, desc: 'Create forwarder', body: '{"local":"","domain":"","destinations":[]}', response: '{"success":true}' },
  { group: 'Email', method: 'DELETE', path: '/api/packages/[id]/email/forwarder', auth: true, desc: 'Delete forwarder', body: '{"local":"","domain":""}', response: '{"success":true}' },
  { group: 'Email', method: 'GET', path: '/api/packages/[id]/email/addons', auth: true, desc: 'Get email addon billing info', response: '{mailboxCount,freeAllowance,monthlyCharge}' },
  { group: 'Email', method: 'GET', path: '/api/packages/[id]/email/quota', auth: true, desc: 'Get email quota usage', response: '{used,limit}' },
  { group: 'Email', method: 'GET', path: '/api/packages/[id]/email/autoresponder', auth: true, desc: 'List autoresponders', response: '[{...}]' },
  { group: 'Email', method: 'POST', path: '/api/packages/[id]/email/autoresponder', auth: true, desc: 'Create autoresponder', body: '{"local":"","domain":"","message":"","subject":""}', response: '{"success":true}' },
  { group: 'Email', method: 'DELETE', path: '/api/packages/[id]/email/autoresponder', auth: true, desc: 'Delete autoresponder', body: '{"responderId":""}', response: '{"success":true}' },
  { group: 'Email', method: 'GET', path: '/api/packages/[id]/email/catchall', auth: true, desc: 'Get catchall config', response: '{enabled,destination}' },
  { group: 'Email', method: 'POST', path: '/api/packages/[id]/email/catchall', auth: true, desc: 'Set catchall', body: '{"destination":""}', response: '{"success":true}' },
  { group: 'Email', method: 'POST', path: '/api/packages/[id]/email/spam', auth: true, desc: 'Update spam filter settings', body: '{"level":"low|medium|high"}', response: '{"success":true}' },
  { group: 'Email', method: 'POST', path: '/api/packages/[id]/email/dkim', auth: true, desc: 'Enable/configure DKIM', body: '{"domain":""}', response: '{"success":true}' },
  { group: 'Email', method: 'POST', path: '/api/packages/[id]/email/webmail', auth: true, desc: 'Get webmail SSO URL', response: '{"url":"https://..."}' },
  { group: 'Email', method: 'POST', path: '/api/packages/[id]/email/wildcard', auth: true, desc: 'Enable wildcard email', body: '{"domain":""}', response: '{"success":true}' },
  { group: 'Email', method: 'DELETE', path: '/api/packages/[id]/email/wildcard', auth: true, desc: 'Disable wildcard email', body: '{"domain":""}', response: '{"success":true}' },

  // SSL
  { group: 'SSL', method: 'GET', path: '/api/packages/[id]/ssl', auth: true, desc: 'Get SSL certificates', response: '[{domain,expiry,type,...}]' },
  { group: 'SSL', method: 'POST', path: '/api/packages/[id]/ssl', auth: true, desc: 'Install/request SSL certificate', body: '{"domain":"","type":"letsencrypt"}', response: '{"success":true}' },
  { group: 'SSL', method: 'GET', path: '/api/packages/[id]/security/forcessl', auth: true, desc: 'Get force HTTPS status', response: '{"enabled":true}' },
  { group: 'SSL', method: 'POST', path: '/api/packages/[id]/security/forcessl', auth: true, desc: 'Toggle force HTTPS', body: '{"enabled":true}', response: '{"success":true}' },

  // CDN
  { group: 'CDN', method: 'POST', path: '/api/packages/[id]/cdn/feature', auth: true, desc: 'Enable/disable CDN feature', body: '{"enabled":true}', response: '{"success":true}' },
  { group: 'CDN', method: 'POST', path: '/api/packages/[id]/cdn/purge', auth: true, desc: 'Purge CDN cache', body: '{"urls":[]}', response: '{"success":true}' },
  { group: 'CDN', method: 'POST', path: '/api/packages/[id]/cdn/cache', auth: true, desc: 'Update CDN cache settings', body: '{"ttl":3600}', response: '{"success":true}' },
  { group: 'CDN', method: 'POST', path: '/api/packages/[id]/cdn/headers', auth: true, desc: 'Set custom CDN headers', body: '{"headers":[]}', response: '{"success":true}' },
  { group: 'CDN', method: 'POST', path: '/api/packages/[id]/cdn/block', auth: true, desc: 'Block rules (general)', body: '{}', response: '{"success":true}' },
  { group: 'CDN', method: 'POST', path: '/api/packages/[id]/cdn/block/countries', auth: true, desc: 'Block countries', body: '{"countries":["CN","RU"]}', response: '{"success":true}' },
  { group: 'CDN', method: 'POST', path: '/api/packages/[id]/cdn/block/ips', auth: true, desc: 'Block IP addresses', body: '{"ips":["1.2.3.4"]}', response: '{"success":true}' },

  // DATABASES
  { group: 'Databases', method: 'GET', path: '/api/packages/[id]/databases', auth: true, desc: 'List databases', response: '[{name,user,size}]' },
  { group: 'Databases', method: 'POST', path: '/api/packages/[id]/databases', auth: true, desc: 'Create database', body: '{"name":"","user":"","password":""}', response: '{"success":true}' },
  { group: 'Databases', method: 'DELETE', path: '/api/packages/[id]/databases', auth: true, desc: 'Delete database', body: '{"name":""}', response: '{"success":true}' },
  { group: 'Databases', method: 'PATCH', path: '/api/packages/[id]/databases', auth: true, desc: 'Update database user password', body: '{"user":"","password":""}', response: '{"success":true}' },

  // PHP
  { group: 'PHP', method: 'POST', path: '/api/packages/[id]/php/version', auth: true, desc: 'Set PHP version', body: '{"version":"8.2"}', response: '{"success":true}' },
  { group: 'PHP', method: 'POST', path: '/api/packages/[id]/php/config', auth: true, desc: 'Update PHP config (php.ini)', body: '{"key":"memory_limit","value":"256M"}', response: '{"success":true}' },

  // SUBDOMAINS
  { group: 'Subdomains', method: 'GET', path: '/api/packages/[id]/subdomains', auth: true, desc: 'List subdomains', response: '[{name,document_root}]' },
  { group: 'Subdomains', method: 'POST', path: '/api/packages/[id]/subdomains', auth: true, desc: 'Create subdomain', body: '{"name":"sub","domain":"example.com","docroot":"/"}', response: '{"success":true}' },
  { group: 'Subdomains', method: 'DELETE', path: '/api/packages/[id]/subdomains', auth: true, desc: 'Delete subdomain', body: '{"name":"","domain":""}', response: '{"success":true}' },

  // TASKS
  { group: 'Tasks', method: 'GET', path: '/api/packages/[id]/tasks', auth: true, desc: 'List cron jobs', response: '[{id,command,schedule,enabled}]' },
  { group: 'Tasks', method: 'POST', path: '/api/packages/[id]/tasks', auth: true, desc: 'Create cron job', body: '{"command":"","schedule":"0 * * * *"}', response: '{"success":true}' },
  { group: 'Tasks', method: 'PATCH', path: '/api/packages/[id]/tasks', auth: true, desc: 'Update cron job', body: '{"taskId":"","enabled":true}', response: '{"success":true}' },
  { group: 'Tasks', method: 'DELETE', path: '/api/packages/[id]/tasks', auth: true, desc: 'Delete cron job', body: '{"taskId":""}', response: '{"success":true}' },

  // BACKUPS
  { group: 'Backups', method: 'GET', path: '/api/packages/[id]/backups', auth: true, desc: 'List available backups', response: '[{date,size,type}]' },
  { group: 'Backups', method: 'POST', path: '/api/packages/[id]/backups', auth: true, desc: 'Restore from backup', body: '{"date":""}', response: '{"success":true}' },

  // WORDPRESS
  { group: 'WordPress', method: 'POST', path: '/api/packages/[id]/wordpress/update', auth: true, desc: 'Update WordPress core/plugins/themes', body: '{"type":"core|plugins|themes"}', response: '{"success":true}' },
  { group: 'WordPress', method: 'POST', path: '/api/packages/[id]/wordpress/staging', auth: true, desc: 'Create/push staging environment', body: '{"type":"live|staging"}', response: '{"success":true}' },
  { group: 'WordPress', method: 'POST', path: '/api/packages/[id]/wordpress/plugins', auth: true, desc: 'Manage plugins', body: '{"action":"activate|deactivate","plugin":""}', response: '{"success":true}' },
  { group: 'WordPress', method: 'POST', path: '/api/packages/[id]/wordpress/themes', auth: true, desc: 'Manage themes', body: '{"action":"activate","theme":""}', response: '{"success":true}' },
  { group: 'WordPress', method: 'POST', path: '/api/packages/[id]/wordpress/settings', auth: true, desc: 'Update WordPress settings', body: '{"key":"","value":""}', response: '{"success":true}' },
  { group: 'WordPress', method: 'POST', path: '/api/packages/[id]/wordpress/searchreplace', auth: true, desc: 'Search and replace in DB', body: '{"search":"","replace":""}', response: '{"success":true,"count":0}' },

  // DOMAINS
  { group: 'Domains', method: 'GET', path: '/api/domains/list', auth: true, desc: 'List all domains', response: '[{name,expiry,status,...}]' },
  { group: 'Domains', method: 'GET', path: '/api/domains/search', auth: true, desc: 'Search domain availability', params: '?q=example', response: '[{name,available,price}]' },
  { group: 'Domains', method: 'POST', path: '/api/domains/register', auth: true, desc: 'Register new domain', body: '{"name":"","contact":{},"privacyService":true}', response: '{"success":true}' },
  { group: 'Domains', method: 'POST', path: '/api/domains/transfer', auth: true, desc: 'Transfer domain in', body: '{"name":"","authCode":""}', response: '{"success":true}' },
  { group: 'Domains', method: 'POST', path: '/api/domains/[domain]/renew', auth: true, desc: 'Renew domain', body: '{"years":1}', response: '{"success":true}' },
  { group: 'Domains', method: 'GET', path: '/api/domains/[domain]/dns', auth: true, desc: 'Get domain DNS records', response: '[{type,host,data,ttl}]' },
  { group: 'Domains', method: 'POST', path: '/api/domains/[domain]/dns', auth: true, desc: 'Add DNS record', body: '{"type":"","host":"","data":""}', response: '{"success":true}' },
  { group: 'Domains', method: 'DELETE', path: '/api/domains/[domain]/dns', auth: true, desc: 'Delete DNS record', body: '{"ref":""}', response: '{"success":true}' },
  { group: 'Domains', method: 'GET', path: '/api/domains/[domain]/nameservers', auth: true, desc: 'Get nameservers', response: '["ns1...","ns2..."]' },
  { group: 'Domains', method: 'POST', path: '/api/domains/[domain]/nameservers', auth: true, desc: 'Update nameservers', body: '{"nameservers":[]}', response: '{"success":true}' },
  { group: 'Domains', method: 'GET', path: '/api/domains/[domain]/contacts', auth: true, desc: 'Get WHOIS contacts', response: '{registrant:{},admin:{},tech:{}}' },
  { group: 'Domains', method: 'POST', path: '/api/domains/[domain]/contacts', auth: true, desc: 'Update WHOIS contacts', body: '{"registrant":{},"admin":{},"tech":{}}', response: '{"success":true}' },
  { group: 'Domains', method: 'GET', path: '/api/domains/[domain]/dnssec', auth: true, desc: 'Get DNSSEC status', response: '{"enabled":false}' },
  { group: 'Domains', method: 'POST', path: '/api/domains/[domain]/dnssec', auth: true, desc: 'Enable/disable DNSSEC', body: '{"enabled":true}', response: '{"success":true}' },
  { group: 'Domains', method: 'GET', path: '/api/domains/[domain]/privacy', auth: true, desc: 'Get WHOIS privacy status', response: '{"enabled":true}' },
  { group: 'Domains', method: 'POST', path: '/api/domains/[domain]/privacy', auth: true, desc: 'Toggle WHOIS privacy', body: '{"enabled":true}', response: '{"success":true}' },
  { group: 'Domains', method: 'GET', path: '/api/domains/[domain]/whois', auth: true, desc: 'Get WHOIS data', response: '{registrar,created,expires,...}' },
  { group: 'Domains', method: 'GET', path: '/api/domains/[domain]/epp', auth: true, desc: 'Get EPP/auth code for transfer out', response: '{"code":"XXXX-XXXX"}' },

  // ACCOUNT
  { group: 'Account', method: 'GET', path: '/api/account/profile', auth: true, desc: 'Get user profile', response: '{name,email,avatar,...}' },
  { group: 'Account', method: 'PATCH', path: '/api/account/profile', auth: true, desc: 'Update profile', body: '{"name":"","avatar":""}', response: '{"success":true}' },
  { group: 'Account', method: 'GET', path: '/api/account/statement', auth: true, desc: 'Get credit statement', response: '[{date,description,amount,balance}]' },
  { group: 'Account', method: 'GET', path: '/api/account/activity', auth: true, desc: 'Get audit log activity', response: '[{action,resource,detail,date}]' },
  { group: 'Account', method: 'GET', path: '/api/account/invoices', auth: true, desc: 'Get invoice/transaction history', params: '?page=1&limit=20', response: '{invoices:[],total,page}' },
  { group: 'Account', method: 'GET', path: '/api/credits', auth: true, desc: 'Get credit balance', response: '{"balance":100.00}' },
  { group: 'Account', method: 'GET', path: '/api/account/members', auth: true, desc: 'List sub-users', response: '[{email,role,status}]' },
  { group: 'Account', method: 'POST', path: '/api/account/members', auth: true, desc: 'Invite sub-user', body: '{"email":"","role":"admin|billing|viewer"}', response: '{"success":true}' },
  { group: 'Account', method: 'DELETE', path: '/api/account/members', auth: true, desc: 'Remove sub-user', body: '{"memberId":""}', response: '{"success":true}' },

  // BILLING
  { group: 'Billing', method: 'POST', path: '/api/account/topup/stripe', auth: true, desc: 'Create Stripe checkout session', body: '{"amount":10}', response: '{"url":"https://checkout.stripe.com/..."}' },
  { group: 'Billing', method: 'POST', path: '/api/account/topup/quick', auth: true, desc: 'Quick top-up with saved card', body: '{"amount":10}', response: '{"success":true,"balance":110}' },
  { group: 'Billing', method: 'GET', path: '/api/account/topup/saved-card', auth: true, desc: 'Get saved payment methods', response: '[{id,brand,last4,expiry}]' },
  { group: 'Billing', method: 'DELETE', path: '/api/account/topup/saved-card', auth: true, desc: 'Remove saved card', body: '{"paymentMethodId":""}', response: '{"success":true}' },
  { group: 'Billing', method: 'GET', path: '/api/renewals', auth: true, desc: 'List upcoming renewals', response: '[{domain,date,cost}]' },
  { group: 'Billing', method: 'POST', path: '/api/renewals', auth: true, desc: 'Renew domain now', body: '{"domain":"","years":1}', response: '{"success":true}' },

  // NOTIFICATIONS
  { group: 'Notifications', method: 'GET', path: '/api/notifications', auth: true, desc: 'List notifications', params: '?unread=true', response: '[{id,title,message,read,date}]' },
  { group: 'Notifications', method: 'PATCH', path: '/api/notifications', auth: true, desc: 'Mark notification as read', body: '{"id":""}', response: '{"success":true}' },
  { group: 'Notifications', method: 'POST', path: '/api/notifications', auth: true, desc: 'Mark all as read', body: '{"action":"mark_all_read"}', response: '{"success":true}' },
  { group: 'Notifications', method: 'DELETE', path: '/api/notifications', auth: true, desc: 'Delete notification', body: '{"id":""}', response: '{"success":true}' },

  // GPU COMPUTE
  { group: 'GPU Compute', method: 'GET', path: '/api/compute/gpu', auth: true, desc: 'List GPU orders + live offers by tier', params: '?tier=entry|workstation|pro|dc|hpc|elite', response: '{orders:[],offers:[],pricing:[]}' },
  { group: 'GPU Compute', method: 'POST', path: '/api/compute/gpu', auth: true, desc: 'Place GPU compute order', body: '{"tier":"","billing_period":"","managed_level":"","template":"","offer_id":""}', response: '{"success":true,"orderId":1,"priceIncVat":0}' },
  { group: 'GPU Compute', method: 'GET', path: '/api/compute/gpu/[orderId]', auth: true, desc: 'Get GPU order + instance status', response: '{order:{},instance:{}}' },
  { group: 'GPU Compute', method: 'POST', path: '/api/compute/gpu/[orderId]', auth: true, desc: 'Control GPU instance', body: '{"action":"start|stop"}', response: '{"success":true}' },
  { group: 'GPU Compute', method: 'DELETE', path: '/api/compute/gpu/[orderId]', auth: true, desc: 'Cancel GPU order and destroy instance', response: '{"success":true}' },

  // VPS
  { group: 'VPS', method: 'GET', path: '/api/compute/vps', auth: true, desc: 'List VPS orders', response: '{orders:[]}' },
  { group: 'VPS', method: 'POST', path: '/api/compute/vps', auth: true, desc: 'Order new VPS', body: '{"service_key":"","image_key":"","region":"","period":1,"add_backup":false}', response: '{"success":true,"orderId":1,"instanceId":""}' },
  { group: 'VPS', method: 'GET', path: '/api/compute/vps/[instanceId]', auth: true, desc: 'Get VPS instance details', response: '{instance:{},order:{}}' },
  { group: 'VPS', method: 'POST', path: '/api/compute/vps/[instanceId]', auth: true, desc: 'Control VPS instance', body: '{"action":"start|stop|restart"}', response: '{"success":true}' },
  { group: 'VPS', method: 'PUT', path: '/api/compute/vps/[instanceId]', auth: true, desc: 'Update VPS display name', body: '{"displayName":""}', response: '{"success":true}' },
  { group: 'VPS', method: 'DELETE', path: '/api/compute/vps/[instanceId]', auth: true, desc: 'Cancel VPS', response: '{"success":true}' },
  { group: 'VPS', method: 'GET', path: '/api/compute/vps/[instanceId]/snapshots', auth: true, desc: 'List VPS snapshots', response: '[{snapshotId,name,createdDate}]' },
  { group: 'VPS', method: 'POST', path: '/api/compute/vps/[instanceId]/snapshots', auth: true, desc: 'Create VPS snapshot', body: '{"name":"","description":""}', response: '{"success":true,"snapshot":{}}' },
  { group: 'VPS', method: 'DELETE', path: '/api/compute/vps/[instanceId]/snapshots/[snapshotId]', auth: true, desc: 'Delete snapshot', response: '{"success":true}' },
  { group: 'VPS', method: 'POST', path: '/api/compute/vps/[instanceId]/snapshots/[snapshotId]', auth: true, desc: 'Rollback to snapshot', body: '{"action":"rollback"}', response: '{"success":true}' },
  { group: 'VPS', method: 'POST', path: '/api/compute/vps/[instanceId]/rescue', auth: true, desc: 'Activate rescue mode', response: '{"success":true}' },

  // SUPPORT
  { group: 'Support', method: 'GET', path: '/api/support/tickets', auth: true, desc: 'List support tickets (own or all for staff)', response: '{tickets:[]}' },
  { group: 'Support', method: 'POST', path: '/api/support/tickets', auth: true, desc: 'Create support ticket', body: '{"subject":"","message":"","priority":"normal|high","package_id":""}', response: '{"success":true,"ticketId":1}' },
  { group: 'Support', method: 'GET', path: '/api/support/tickets/[ticketId]', auth: true, desc: 'Get ticket details', response: '{ticket:{}}' },
  { group: 'Support', method: 'PATCH', path: '/api/support/tickets/[ticketId]', auth: true, desc: 'Update ticket (staff: status/priority)', body: '{"status":"open|resolved","priority":""}', response: '{"success":true}' },
  { group: 'Support', method: 'POST', path: '/api/support/impersonate', auth: true, desc: 'Start customer impersonation (staff only)', body: '{"email":""}', response: '{"url":""}' },
  { group: 'Support', method: 'DELETE', path: '/api/support/impersonate', auth: true, desc: 'End impersonation session', response: '{"success":true}' },

  // CRON
  { group: 'Cron', method: 'GET', path: '/api/cron/sync-packages', auth: false, desc: 'Sync package status from 20i (cron secret)', params: 'x-cron-secret header', response: '{"synced":N}' },
  { group: 'Cron', method: 'GET', path: '/api/cron/bill-email-addons', auth: false, desc: 'Bill monthly email addons (cron secret)', params: 'x-cron-secret header', response: '{"billed":N}' },
  { group: 'Cron', method: 'GET', path: '/api/cron/mailbox-storage', auth: false, desc: 'Sync mailbox storage usage (cron secret)', response: '{"updated":N}' },
  { group: 'Cron', method: 'GET', path: '/api/cron/expire-sessions', auth: false, desc: 'Expire old impersonation sessions (cron secret)', response: '{"expired":N}' },

  // ACCOUNT - API CREDENTIALS & SECURITY
  { group: 'Account', method: 'GET', path: '/api/account/api-credentials', auth: true, desc: 'List API credentials', response: '{credentials:[{id,client_id,client_secret_preview,name,scopes,is_active,last_used_at,created_at}]}' },
  { group: 'Account', method: 'POST', path: '/api/account/api-credentials', auth: true, desc: 'Create API credential (secret returned once)', body: '{"name":"","scopes":"read,write"}', response: '{"success":true,"clientId":"","clientSecret":""}' },
  { group: 'Account', method: 'PATCH', path: '/api/account/api-credentials', auth: true, desc: 'Update API credential (enable/disable, rename)', body: '{"id":0,"is_active":true,"name":""}', response: '{"success":true}' },
  { group: 'Account', method: 'DELETE', path: '/api/account/api-credentials', auth: true, desc: 'Delete API credential', body: '{"id":0}', response: '{"success":true}' },
  { group: 'Account', method: 'GET', path: '/api/account/spend-pin', auth: true, desc: 'Get spend PIN status', response: '{"enabled":true,"threshold":0}' },
  { group: 'Account', method: 'POST', path: '/api/account/spend-pin', auth: true, desc: 'Set or update spend PIN', body: '{"pin":"","threshold":0,"currentPin":""}', response: '{"success":true}' },
  { group: 'Account', method: 'DELETE', path: '/api/account/spend-pin', auth: true, desc: 'Remove spend PIN', body: '{"currentPin":""}', response: '{"success":true}' },
  { group: 'Account', method: 'POST', path: '/api/account/spend-pin/verify', auth: true, desc: 'Verify spend PIN for a high-value action', body: '{"pin":"","amount":0}', response: '{"success":true,"verified":true}' },
  { group: 'Account', method: 'PATCH', path: '/api/account/members', auth: true, desc: 'Update sub-user role/status', body: '{"memberId":"","role":"admin|billing|viewer","status":"active|suspended"}', response: '{"success":true}' },
  { group: 'Account', method: 'GET', path: '/api/invite/[token]', auth: false, desc: 'Get team invite details', response: '{email,ownerName,role}' },
  { group: 'Account', method: 'POST', path: '/api/invite/[token]', auth: false, desc: 'Accept team invite and set password', body: '{"password":""}', response: '{"success":true}' },

  // BILLING
  { group: 'Billing', method: 'POST', path: '/api/account/topup', auth: true, desc: 'Top up credit balance', body: '{"amount":10}', response: '{"success":true,"balance":110}' },
  { group: 'Billing', method: 'PATCH', path: '/api/renewals', auth: true, desc: 'Toggle auto-renew for a renewal item', body: '{"id":"","auto_renew":true}', response: '{"success":true}' },

  // AUTH (additional)
  { group: 'Auth', method: 'POST', path: '/api/auth/login', auth: false, desc: 'Login (legacy alias of gsws-login)', body: '{"email":"","password":""}', response: '{"success":true,"user":{...}}' },
  { group: 'Auth', method: 'GET', path: '/api/auth/reset-password', auth: false, desc: 'Validate password reset token', params: '?token=', response: '{"valid":true}' },

  // DOMAINS (additional)
  { group: 'Domains', method: 'GET', path: '/api/catalogue/domains', auth: true, desc: 'Get TLD pricing catalogue', params: '?tld=&type=register|transfer|renew', response: '[{tld,registerPrice,renewPrice,transferPrice}]' },

  // VPS (additional)
  { group: 'VPS', method: 'GET', path: '/api/compute/vps/[instanceId]/dns', auth: true, desc: 'Get reverse DNS / PTR records for VPS', response: '[{ip,ptr}]' },
  { group: 'VPS', method: 'GET', path: '/api/compute/vps/[instanceId]/firewall', auth: true, desc: 'Get VPS firewall rules', response: '[{id,name,rules}]' },
  { group: 'VPS', method: 'PUT', path: '/api/compute/vps/[instanceId]/firewall', auth: true, desc: 'Replace VPS firewall rules', body: '{"firewallId":"","rules":[]}', response: '{"success":true}' },
  { group: 'VPS', method: 'PATCH', path: '/api/compute/vps/[instanceId]/firewall', auth: true, desc: 'Rename/update VPS firewall', body: '{"firewallId":"","name":""}', response: '{"success":true}' },
  { group: 'VPS', method: 'GET', path: '/api/compute/vps/[instanceId]/images', auth: true, desc: 'List available OS images for VPS reinstall', response: '[{key,name,os}]' },
  { group: 'VPS', method: 'POST', path: '/api/compute/vps/[instanceId]/actions', auth: true, desc: 'Run an action on VPS (alternate control endpoint)', body: '{"action":""}', response: '{"success":true}' },

  // GPU COMPUTE (additional)
  { group: 'GPU Compute', method: 'GET', path: '/api/compute/gpu/[orderId]/logs', auth: true, desc: 'Get GPU instance logs', response: '{logs:""}' },

  // EMAIL (additional)
  { group: 'Email', method: 'DELETE', path: '/api/packages/[id]/email/catchall', auth: true, desc: 'Remove catchall address', body: '{"domain":"","catchallId":""}', response: '{"success":true}' },
  { group: 'Email', method: 'POST', path: '/api/packages/[id]/email/quota', auth: true, desc: 'Recalculate/sync email quota usage', response: '{"success":true}' },

  // SSL (additional)
  { group: 'SSL', method: 'POST', path: '/api/packages/[id]/security/scan', auth: true, desc: 'Trigger a security scan', response: '{"success":true}' },

  // PACKAGES (additional)
  { group: 'Packages', method: 'POST', path: '/api/packages/[id]/applications/install', auth: true, desc: 'Install an application (e.g. via Softaculous)', body: '{"appId":"","domain":""}', response: '{"success":true}' },
  { group: 'Packages', method: 'POST', path: '/api/packages/[id]/apppool', auth: true, desc: 'Configure application pool (Windows hosting)', body: '{}', response: '{"success":true}' },
  { group: 'Packages', method: 'POST', path: '/api/packages/[id]/apppool/recycle', auth: true, desc: 'Recycle application pool (Windows hosting)', response: '{"success":true}' },

  // FILES
  { group: 'Files', method: 'GET', path: '/api/packages/[id]/files/sshkeys', auth: true, desc: 'List SSH keys for package', response: '[{name,fingerprint}]' },
  { group: 'Files', method: 'POST', path: '/api/packages/[id]/files/sshkeys', auth: true, desc: 'Add an SSH key', body: '{"name":"","publicKey":""}', response: '{"success":true}' },
  { group: 'Files', method: 'POST', path: '/api/packages/[id]/files/permissions', auth: true, desc: 'Set file/directory permissions', body: '{"path":"","mode":"755"}', response: '{"success":true}' },

  // MSSQL
  { group: 'MSSQL', method: 'GET', path: '/api/packages/[id]/mssql', auth: true, desc: 'List MSSQL databases (Windows packages)', response: '[{name,user,size}]' },
  { group: 'MSSQL', method: 'POST', path: '/api/packages/[id]/mssql', auth: true, desc: 'Create MSSQL database', body: '{"name":"","user":"","password":""}', response: '{"success":true}' },

  // REDIRECTS
  { group: 'Redirects', method: 'GET', path: '/api/packages/[id]/redirects', auth: true, desc: 'List URL redirects', response: '[{from,to,type,domain}]' },
  { group: 'Redirects', method: 'POST', path: '/api/packages/[id]/redirects', auth: true, desc: 'Create URL redirect', body: '{"domain":"","from":"","to":"","type":"301|302"}', response: '{"success":true}' },
  { group: 'Redirects', method: 'DELETE', path: '/api/packages/[id]/redirects', auth: true, desc: 'Delete URL redirect', body: '{"domain":"","from":"","type":""}', response: '{"success":true}' },

  // MANAGED SERVICES
  { group: 'Managed Services', method: 'GET', path: '/api/managed', auth: true, desc: 'Get managed-service status for a resource', params: '?resource_type=&resource_id=', response: '{managed:false,lockedUntil:null}' },
  { group: 'Managed Services', method: 'POST', path: '/api/managed', auth: true, desc: 'Request managed service for a resource', body: '{"resource_type":"","resource_id":"","resource_name":""}', response: '{"success":true}' },
  { group: 'Managed Services', method: 'PATCH', path: '/api/managed', auth: true, desc: 'Update managed service status', body: '{"resource_type":"","resource_id":""}', response: '{"success":true}' },

  // CRON (additional)
  { group: 'Cron', method: 'GET', path: '/api/cron/check-permissions', auth: false, desc: 'Sync member permission checks (cron secret)', params: 'x-cron-secret header', response: '{"checked":N}' },
  { group: 'Cron', method: 'POST', path: '/api/cron/renew-gpu', auth: false, desc: 'Auto-renew due GPU compute orders (cron secret)', params: 'x-cron-secret header', response: '{"renewed":N}' },
  { group: 'Cron', method: 'POST', path: '/api/cron/renew-vps', auth: false, desc: 'Auto-renew due VPS orders (cron secret)', params: 'x-cron-secret header', response: '{"renewed":N}' },

  // SYSTEM
  { group: 'System', method: 'GET', path: '/api/health', auth: false, desc: 'Platform health check', response: '{"status":"ok","timestamp":"","pid":0}' },
  { group: 'System', method: 'GET', path: '/api/docs/postman-collection', auth: true, desc: 'Download Postman collection for this API', response: '(file download: gsws-api-collection.json)' },
]
