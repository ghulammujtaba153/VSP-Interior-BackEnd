export default (sequelize, DataTypes) => {
    const GanttChart = sequelize.define(
        "GanttChart",
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            projectSetupJobId: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            name: {
                type: DataTypes.STRING(200),
                allowNull: false,
            },
            start: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            end: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            progress: {
                type: DataTypes.FLOAT,
                allowNull: false,
                defaultValue: 0,
            },
            dependencies: {
                type: DataTypes.JSONB,
                allowNull: true,
                defaultValue: [],
            },
            project: {
                // stage/group name (e.g. Design, Production)
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            status: {
                type: DataTypes.ENUM("pending", "in-progress", "completed"),
                defaultValue: "pending",
            },
        },
        {
            tableName: "gantt_chart",
            timestamps: true,
        }
    );

    GanttChart.associate = (models) => {
        GanttChart.belongsTo(models.ProjectSetupJob, {
            foreignKey: "projectSetupJobId",
            as: "ganttChart",
        });

        
    };

    return GanttChart;
};

