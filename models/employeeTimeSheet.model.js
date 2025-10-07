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
        allowNull: false,
      },
      breakTime: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      overWork: {
        type: DataTypes.TIME, // assuming you want to store time worked overtime
        allowNull: true,
        defaultValue: "00:00:00",
      },
      status: {
        type: DataTypes.ENUM("pending", "approved", "rejected"),
        allowNull: false,
        defaultValue: "pending",
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
  };

  return EmployeeTimeSheet;
};
