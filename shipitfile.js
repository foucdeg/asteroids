module.exports = function (shipit) {
  require('shipit-deploy')(shipit);
  require('shipit-yarn')(shipit);

  shipit.initConfig({
    default: {
      workspace: '/tmp/asteroids',
      deployTo: '/home/fouc/asteroids',
      repositoryUrl: 'https://github.com/foucdeg/augmented-rp',
      ignores: ['.git'],
      keepReleases: 3,
      deleteOnRollback: false,
      shallowClone: true,
      yarn: {
        remote: true,
        installFlags: ['--production']
        cmd: 'run build'
      }
    },
    prod: {
      servers: [
        {
          host: 'vps',
          user: 'fouc'
        }
      ]
    }
  });

  shipit.task('pm2-reload', () => {
    shipit.remote('pm2 reload ecosystem.config.js --only asteroids');
  });

  shipit.on('deployed', () => {
    shipit.start('pm2-reload');
    shipit.emit('reloaded');
  });
};
