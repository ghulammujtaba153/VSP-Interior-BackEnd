export default (sequelize, DataTypes) => {
    const Worker = sequelize.define('worker', {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: false
        },
        address: {
            type: DataTypes.STRING,
            allowNull: false
        },
        jobTitle: {
            type: DataTypes.STRING,
            allowNull: false
        },
        weeklyHours: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        hourlyRate: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'workers',
        timestamps: true,
    })

    Worker.associate = (models) => {
        Worker.hasMany(models.ProjectWorker, { foreignKey: 'workerId', as: 'projectWorkers' });
    }   

    return Worker;
}