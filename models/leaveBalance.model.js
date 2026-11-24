export default (sequelize, DataTypes) => {
  const LeaveBalance = sequelize.define(
    'LeaveBalance',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      userId: { type: DataTypes.INTEGER, allowNull: false },
      leaveType: {
        type: DataTypes.ENUM('annual', 'sick', 'bereavement', 'unpaid', 'other'),
        allowNull: false,
      },
      year: { type: DataTypes.INTEGER, allowNull: false },
      entitled: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
      used: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
      pending: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
      remaining: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
    },
    { tableName: 'leave_balances', timestamps: true }
  )

  LeaveBalance.associate = (models) => {
    LeaveBalance.belongsTo(models.User, { foreignKey: 'userId', as: 'user' })
  }

  return LeaveBalance
}
