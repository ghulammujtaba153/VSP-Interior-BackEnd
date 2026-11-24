export default (sequelize, DataTypes) => {
  const EmploymentProfile = sequelize.define(
    'EmploymentProfile',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
      employeeNumber: { type: DataTypes.STRING, allowNull: true },
      department: { type: DataTypes.STRING, allowNull: true },
      jobTitle: { type: DataTypes.STRING, allowNull: true },
      costCentre: { type: DataTypes.STRING, allowNull: true },
      managerId: { type: DataTypes.INTEGER, allowNull: true },
      employmentType: {
        type: DataTypes.ENUM('full_time', 'part_time', 'contractor'),
        defaultValue: 'full_time',
      },
      startDate: { type: DataTypes.DATEONLY, allowNull: true },
      endDate: { type: DataTypes.DATEONLY, allowNull: true },
      standardHoursPerWeek: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 40,
      },
      standardHoursPerDay: {
        type: DataTypes.DECIMAL(4, 2),
        defaultValue: 8,
      },
      hourlyRate: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      annualSalary: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
      irdTaxCode: { type: DataTypes.STRING, defaultValue: 'M' },
      kiwiSaverEnrolled: { type: DataTypes.BOOLEAN, defaultValue: false },
      kiwiSaverRate: { type: DataTypes.DECIMAL(5, 2), defaultValue: 3 },
      kiwiSaverEmployerRate: { type: DataTypes.DECIMAL(5, 2), defaultValue: 3 },
      bankAccount: { type: DataTypes.STRING, allowNull: true },
    },
    { tableName: 'employment_profiles', timestamps: true }
  )

  EmploymentProfile.associate = (models) => {
    EmploymentProfile.belongsTo(models.User, { foreignKey: 'userId', as: 'user' })
    EmploymentProfile.belongsTo(models.User, { foreignKey: 'managerId', as: 'manager' })
  }

  return EmploymentProfile
}
