import { Sequelize } from 'sequelize';

const sequelize = new Sequelize('admin_newsQuest_track', 'newsQuest_track', 'newsQuest_track@@321', {
  host: 'dev.ekcs.co',
  port: 8443,
  dialect: 'mysql',
  logging: false,
});

export default sequelize;
