export default (sequelize, DataTypes) => {
  const PayrollRun = sequelize.define(
    'PayrollRun',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      month: { type: DataTypes.STRING, allowNull: false },
      year: { type: DataTypes.INTEGER, allowNull: false },
      payPeriodId: { type: DataTypes.INTEGER, allowNull: true },
      status: {
        type: DataTypes.ENUM('draft', 'review', 'approved', 'paid', 'locked'),
        defaultValue: 'draft',
      },
      lockedAt: { type: DataTypes.DATE, allowNull: true },
      lockedById: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: 'payroll_runs', timestamps: true }
  )

  PayrollRun.associate = (models) => {
    PayrollRun.belongsTo(models.PayPeriod, { foreignKey: 'payPeriodId', as: 'payPeriod' })
    PayrollRun.hasMany(models.Payslip, { foreignKey: 'payrollRunId', as: 'payslips' })
  }

  return PayrollRun
}
