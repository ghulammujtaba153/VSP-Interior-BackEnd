export default (sequelize, DataTypes) => {
  const PayrollDeduction = sequelize.define(
    'PayrollDeduction',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      payslipId: { type: DataTypes.INTEGER, allowNull: false },
      type: { type: DataTypes.STRING, allowNull: false },
      amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      description: { type: DataTypes.STRING, allowNull: true },
      irdCode: { type: DataTypes.STRING, allowNull: true },
    },
    { tableName: 'payroll_deductions', timestamps: true }
  )

  PayrollDeduction.associate = (models) => {
    PayrollDeduction.belongsTo(models.Payslip, { foreignKey: 'payslipId', as: 'payslip' })
  }

  return PayrollDeduction
}
