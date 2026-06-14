module.exports = {
  apps: [
    {
      name: 'gsws',
      script: 'node_modules/.bin/next',
      args: 'start --port 3020',
      instances: 6,
      exec_mode: 'cluster',
      cwd: '/home/ovie/gsws',
      max_memory_restart: '500M',
      exp_backoff_restart_delay: 100,
      min_uptime: '30s',
      max_restarts: 10,
      autorestart: true,
    },
    {
      name: 'sws-terminal',
      script: 'terminal-server.js',
      instances: 2,
      exec_mode: 'cluster',
      cwd: '/home/ovie/gsws',
      max_memory_restart: '300M',
      exp_backoff_restart_delay: 100,
      min_uptime: '30s',
      max_restarts: 10,
      autorestart: true,
    }
  ]
}
