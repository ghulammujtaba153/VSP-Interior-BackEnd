export default (sequelize, DataTypes) => {
  const LeavePolicy = sequelize.define(
    'LeavePolicy',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, allowNull: false },
      leaveType: {
        type: DataTypes.ENUM('annual', 'sick', 'bereavement', 'unpaid', 'other'),
        allowNull: false,
      },
      annualEntitlementDays: { type: DataTypes.DECIMAL(5, 2), defaultValue: 20 },
      carryOverDays: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
      isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    { tableName: 'leave_policies', timestamps: true }
  )

  return LeavePolicy
}
