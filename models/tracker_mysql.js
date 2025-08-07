
import { DataTypes } from 'sequelize';
import sequelize from '../db.js';

const Tracker = sequelize.define('tracker', {
  loopCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  expand: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  fileName: DataTypes.STRING,
  advertiserID: DataTypes.STRING,
  orderID: DataTypes.STRING,
  lineItemID: DataTypes.STRING,
  creativeID: DataTypes.STRING,
  firstQuarter: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  secondQuarter: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  thirdQuarter: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  fourthQuarter: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  clickTime: {
    type: DataTypes.STRING,
    defaultValue: () => new Date().toISOString().split('T')[0]
  }
}, {
  timestamps: false,
});

export default Tracker;
