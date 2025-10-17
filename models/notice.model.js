export default (sequelize, DataTypes) => {
  const Notice = sequelize.define(
    "Notice",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      fileUrl: {
        type: DataTypes.STRING(512),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("active", "inactive"),
        allowNull: false,
        defaultValue: "active",
      },
    },
    {
      tableName: "notices",
      timestamps: true, // adds createdAt & updatedAt
    }
  );


  return Notice;
};
