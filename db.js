import { Sequelize } from 'sequelize';

const sequelize = new Sequelize('admin_newsQuest_track', 'newsQuest_track', 'newsQuest_track@@321', {
  host: 'https://dev.ekcs.co',
  port: 3306,
  dialect: 'mysql',
  logging: false,
});

export default sequelize;
