export default (sequelize, DataTypes) => {
  const EmployeeTimeSheet = sequelize.define(
    "EmployeeTimeSheet",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      employeeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW, // sets default to current date
      },
      startTime: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      endTime: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      overWork: {
        type: DataTypes.TIME,
        allowNull: true,
        defaultValue: "00:00:00",
      },
      breakMinutes: { type: DataTypes.INTEGER, defaultValue: 0 },
      payPeriodId: { type: DataTypes.INTEGER, allowNull: true },
      approvedById: { type: DataTypes.INTEGER, allowNull: true },
      approvedAt: { type: DataTypes.DATE, allowNull: true },
      status: {
        type: DataTypes.ENUM("draft", "submitted", "pending", "approved", "rejected", "locked"),
        allowNull: false,
        defaultValue: "draft",
      },
    },
    {
      tableName: "employee_timesheets",
      timestamps: true,
    }
  );

  EmployeeTimeSheet.associate = (models) => {
    EmployeeTimeSheet.belongsTo(models.User, {
      foreignKey: "employeeId",
      as: "employee",
    });
    EmployeeTimeSheet.belongsTo(models.PayPeriod, {
      foreignKey: "payPeriodId",
      as: "payPeriod",
    });
  };

  return EmployeeTimeSheet;
};
