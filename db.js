import { Sequelize } from 'sequelize';

const sequelize = new Sequelize('tegnavideo_db', 'tegnavideo_usr', 'aExBjonoDcO!PUaQ', {
  host: '134.209.151.179',
  port: 3015,
  dialect: 'mysql',
  logging: false,
});

export default sequelize;
