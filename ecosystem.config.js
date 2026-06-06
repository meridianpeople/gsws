module.exports = {
  apps: [
    {
      name: 'gsws',
      script: 'node_modules/.bin/next',
      args: 'start --port 3020',
      instances: 1,
      exec_mode: 'fork',
      cwd: '/home/ovie/gsws',
    },
    {
      name: 'sws-terminal',
      script: 'terminal-server.js',
      instances: 1,
      exec_mode: 'fork',
      cwd: '/home/ovie/gsws',
    }
  ]
}
