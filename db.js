import { Sequelize } from 'sequelize';

const sequelize = new Sequelize('admin_newsQuest_track', 'newsQuest_track', 'newsQuest_track@@321', {
  host: '165.22.213.254:8443', // or your remote host
  dialect: 'mysql',
  logging: false, // optional
});

export default sequelize;
