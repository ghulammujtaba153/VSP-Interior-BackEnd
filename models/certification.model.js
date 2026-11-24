export default (sequelize, DataTypes) => {
  const Certification = sequelize.define(
    'Certification',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      userId: { type: DataTypes.INTEGER, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      issuer: { type: DataTypes.STRING, allowNull: true },
      certificateNumber: { type: DataTypes.STRING, allowNull: true },
      issuedDate: { type: DataTypes.DATEONLY, allowNull: true },
      expiryDate: { type: DataTypes.DATEONLY, allowNull: true },
      status: {
        type: DataTypes.ENUM('valid', 'expiring_soon', 'expired'),
        defaultValue: 'valid',
      },
      documentUrl: { type: DataTypes.STRING, allowNull: true },
      renewalReminderDays: { type: DataTypes.INTEGER, defaultValue: 30 },
    },
    { tableName: 'certifications', timestamps: true }
  )

  Certification.associate = (models) => {
    Certification.belongsTo(models.User, { foreignKey: 'userId', as: 'user' })
  }

  return Certification
}
