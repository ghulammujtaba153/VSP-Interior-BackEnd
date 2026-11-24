export default (sequelize, DataTypes) => {
  const Payslip = sequelize.define(
    'Payslip',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      payrollRunId: { type: DataTypes.INTEGER, allowNull: false },
      userId: { type: DataTypes.INTEGER, allowNull: false },
      basePay: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
      overtimePay: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
      allowances: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
      grossPay: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
      payeTax: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
      kiwiSaverEmployee: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
      kiwiSaverEmployer: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
      studentLoan: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
      otherDeductions: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
      esct: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
      netPay: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
      paymentDate: { type: DataTypes.DATE, allowNull: true },
      paymentMethod: { type: DataTypes.STRING, allowNull: true },
      payslipPdfUrl: { type: DataTypes.STRING, allowNull: true },
      costCentre: { type: DataTypes.STRING, allowNull: true },
    },
    { tableName: 'payslips', timestamps: true }
  )

  Payslip.associate = (models) => {
    Payslip.belongsTo(models.PayrollRun, { foreignKey: 'payrollRunId', as: 'payrollRun' })
    Payslip.belongsTo(models.User, { foreignKey: 'userId', as: 'user' })
    Payslip.hasMany(models.PayrollDeduction, { foreignKey: 'payslipId', as: 'deductions' })
  }

  return Payslip
}
