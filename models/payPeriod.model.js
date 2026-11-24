export default (sequelize, DataTypes) => {
  const PayPeriod = sequelize.define(
    'PayPeriod',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      startDate: { type: DataTypes.DATEONLY, allowNull: false },
      endDate: { type: DataTypes.DATEONLY, allowNull: false },
      status: {
        type: DataTypes.ENUM('open', 'locked'),
        defaultValue: 'open',
      },
      lockedAt: { type: DataTypes.DATE, allowNull: true },
      lockedById: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: 'pay_periods', timestamps: true }
  )

  return PayPeriod
}
