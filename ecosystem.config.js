// PM2 config for craft-skills-backend (production)
//
// Usage:
//   pm2 start ecosystem.config.js --env production
//   pm2 save
//   pm2 startup
//
// Notes:
// - NEVER run `npm run build` or `npm run dev` on the VPS.
//   Build locally (npm run build) and upload the `dist/` folder.
// - Install without devDependencies: `npm i --omit=dev`
// - The app auto-restarts if memory exceeds 400MB instead of
//   letting the VPS swap-thrash at 100% CPU.
module.exports = {
    apps: [
        {
            name: 'craft-skills-backend',
            script: 'dist/index.js',
            cwd: '/var/www/html/craft/skills/server',
            instances: 1,
            exec_mode: 'fork',
            autorestart: true,
            max_memory_restart: '400M',
            restart_delay: 5000,
            max_restarts: 20,
            min_uptime: '30s',
            time: true,
            merge_logs: true,
            out_file: './logs/out.log',
            error_file: './logs/error.log',
            env: {
                NODE_ENV: 'production',
            },
            env_production: {
                NODE_ENV: 'production',
            },
        },
    ],
};
