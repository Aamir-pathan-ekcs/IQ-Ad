import { Sequelize } from 'sequelize';

const sequelize = new Sequelize('admin_newsQuest_track', 'newsQuest_track', 'newsQuest_track@@321', {
  host: '165.22.213.254',
  port: 8443,
  dialect: 'mysql',
  logging: false,
});

export default sequelize;
