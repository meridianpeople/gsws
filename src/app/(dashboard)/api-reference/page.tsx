'use client'
import { useState } from 'react'

const ROUTES = [
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
  { group: 'Email', method: 'POST', path: '/api/packages/[id]/email/mailbox', auth: true, desc: 'Create mailbox', body: '{"local":"","domain":"","password":"","quota":0}', response: '{"success":true}' },
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
  { group: 'Domains', method: 'POST', path: '/api/domains/[domain]/contacts', auth: true, desc: 'Update WHOIS contacts', body: '{registrant:{},admin:{},tech:{}}', response: '{"success":true}' },
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

  // TOPUP
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

  // COMPUTE - GPU
  { group: 'GPU Compute', method: 'GET', path: '/api/compute/gpu', auth: true, desc: 'List GPU orders + live offers by tier', params: '?tier=entry|workstation|pro|dc|hpc|elite', response: '{orders:[],offers:[],pricing:[]}' },
  { group: 'GPU Compute', method: 'POST', path: '/api/compute/gpu', auth: true, desc: 'Place GPU compute order', body: '{"tier":"","billing_period":"","managed_level":"","template":"","offer_id":""}', response: '{"success":true,"orderId":1,"priceIncVat":0}' },
  { group: 'GPU Compute', method: 'GET', path: '/api/compute/gpu/[orderId]', auth: true, desc: 'Get GPU order + instance status', response: '{order:{},instance:{}}' },
  { group: 'GPU Compute', method: 'POST', path: '/api/compute/gpu/[orderId]', auth: true, desc: 'Control GPU instance', body: '{"action":"start|stop"}', response: '{"success":true}' },
  { group: 'GPU Compute', method: 'DELETE', path: '/api/compute/gpu/[orderId]', auth: true, desc: 'Cancel GPU order and destroy instance', response: '{"success":true}' },

  // COMPUTE - VPS
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
]

const GROUPS = [...new Set(ROUTES.map(r => r.group))]

const METHOD_COLORS: Record<string, { bg: string; text: string }> = {
  GET:    { bg: '#dbeafe', text: '#1d4ed8' },
  POST:   { bg: '#dcfce7', text: '#166534' },
  PUT:    { bg: '#fef9c3', text: '#92400e' },
  PATCH:  { bg: '#fef3c7', text: '#b45309' },
  DELETE: { bg: '#fee2e2', text: '#991b1b' },
  HEAD:   { bg: '#f3f4f6', text: '#374151' },
}

export default function APIReferencePage() {
  const [search, setSearch] = useState('')
  const [activeGroup, setActiveGroup] = useState('All')
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = ROUTES.filter(r => {
    const matchGroup = activeGroup === 'All' || r.group === activeGroup
    const matchSearch = !search || r.path.toLowerCase().includes(search.toLowerCase()) || r.desc.toLowerCase().includes(search.toLowerCase())
    return matchGroup && matchSearch
  })

  const grouped = GROUPS.reduce((acc, g) => {
    const routes = filtered.filter(r => r.group === g)
    if (routes.length) acc[g] = routes
    return acc
  }, {} as Record<string, typeof ROUTES>)

  return (
    <div style={{ maxWidth: '960px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111', margin: 0 }}>API Reference</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          {ROUTES.length} endpoints · All routes require session cookie unless marked public · Base URL: <code style={{ background: '#f3f4f6', padding: '1px 5px', borderRadius: '3px', fontSize: '12px' }}>https://sws.geig.co.uk</code>
        </p>
      </div>

      {/* Search + filter */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search endpoints..."
          style={{ flex: 1, minWidth: '200px', padding: '9px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px' }} />
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['All', ...GROUPS].map(g => (
            <button key={g} onClick={() => setActiveGroup(g)}
              style={{ padding: '8px 12px', background: activeGroup === g ? '#1a6ef5' : '#f3f4f6', color: activeGroup === g ? '#fff' : '#444', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Routes */}
      {Object.entries(grouped).map(([group, routes]) => (
        <div key={group} style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#111', margin: '0 0 10px', paddingBottom: '8px', borderBottom: '2px solid #f3f4f6' }}>
            {group} <span style={{ fontWeight: 400, color: 'var(--text-secondary)', fontSize: '12px' }}>({routes.length})</span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {routes.map((r, i) => {
              const key = r.method + r.path
              const isOpen = expanded === key
              const mc = METHOD_COLORS[r.method] || METHOD_COLORS.GET
              return (
                <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                  <button onClick={() => setExpanded(isOpen ? null : key)}
                    style={{ width: '100%', padding: '10px 14px', background: isOpen ? '#f8faff' : '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: mc.bg, color: mc.text, minWidth: '52px', textAlign: 'center', flexShrink: 0 }}>
                      {r.method}
                    </span>
                    <code style={{ fontSize: '12px', color: '#1a1a1a', fontFamily: 'monospace', flex: 1 }}>{r.path}</code>
                    {!r.auth && <span style={{ fontSize: '10px', background: '#fef9c3', color: '#92400e', padding: '1px 5px', borderRadius: '3px', fontWeight: 600, flexShrink: 0 }}>PUBLIC</span>}
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', flex: 2 }}>{r.desc}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{isOpen ? '▲' : '▼'}</span>
                  </button>

                  {isOpen && (
                    <div style={{ padding: '14px 16px', background: '#f9fafb', borderTop: '1px solid #f3f4f6' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: r.body ? '1fr 1fr' : '1fr', gap: '12px' }}>
                        {r.params && (
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase' }}>Query Params</div>
                            <pre style={{ margin: 0, fontSize: '11px', background: 'var(--card-bg)', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '8px 10px', overflow: 'auto' }}>{r.params}</pre>
                          </div>
                        )}
                        {r.body && (
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase' }}>Request Body</div>
                            <pre style={{ margin: 0, fontSize: '11px', background: 'var(--card-bg)', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '8px 10px', overflow: 'auto' }}>{r.body}</pre>
                          </div>
                        )}
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase' }}>Response</div>
                          <pre style={{ margin: 0, fontSize: '11px', background: 'var(--card-bg)', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '8px 10px', overflow: 'auto' }}>{r.response}</pre>
                        </div>
                      </div>
                      <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                        🔐 Auth: {r.auth ? 'Session cookie required' : 'Public — no auth required'}
                        {!r.auth && r.group === 'Cron' && ' (x-cron-secret header required)'}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
