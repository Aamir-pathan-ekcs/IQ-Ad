import { Sequelize } from 'sequelize';

const sequelize = new Sequelize('newsQuest_track', 'root', '', {
  host: 'localhost',
  port: 3306,
  dialect: 'mysql',
  logging: false,
});

export default sequelize;
