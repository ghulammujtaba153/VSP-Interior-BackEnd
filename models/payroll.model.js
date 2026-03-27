export default (sequelize, DataTypes) => {
  const Payroll = sequelize.define(
    "Payroll",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      month: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      year: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      baseSalary: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      overtimeSalary: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
      },
      bonus: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
      },
      deduction: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
      },
      netSalary: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("pending", "paid"),
        defaultValue: "pending",
      },
      paymentDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      paymentMethod: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "payrolls",
      timestamps: true,
    }
  );

  Payroll.associate = (models) => {
    Payroll.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });
  };

  return Payroll;
};
