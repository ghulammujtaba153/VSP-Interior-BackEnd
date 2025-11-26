export default (sequelize, DataTypes) => {
  const ProjectCostSheet = sequelize.define(
    "ProjectCostSheet",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      projectId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      unitName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      drawingNo: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      Revision: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      Measure: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      quantity: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      unitType: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      unitLength: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      wasteOverRide: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      location: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      cabinetLookUp: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
      },
      wallPanelling: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
      },
      hardwareLookUp: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
      },
      trims: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
      },
      splitBattens: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
      },
      drawers: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
      },
      hinges: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
      },
      miscItems: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
      },
      buyInItems: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
      },
      other: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {
          extraFreight: {
            description: "",
            extraQuantity: "",
            height: "",
            length: "",
            depth: "",
            measures: "",
            quantity: "",
            rate: "",
            subTotal: "",
            notes: ""
          },
          draftingHours: {
            measures: "",
            quantity: "",
            rate: "",
            subTotal: "",
            notes: ""
          }
        },
      },
      extraLabourHours: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {
          extraHourMachining: {
            measures: "",
            quantity: "",
            rate: "",
            subTotal: "",
            notes: ""
          },
          extraHourAssembly: {
            measures: "",
            quantity: "",
            rate: "",
            subTotal: "",
            notes: ""
          },
          extraHourSite: {
            measures: "",
            quantity: "",
            rate: "",
            subTotal: "",
            notes: ""
          },
        },
      },
      totals: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {
          materials: {
            quantity: "",
            cost: "",
            markup: "",
            sell: "",
            overRideMarkUp: "",
          },
          BuyInItems: {
            quantity: "",
            cost: "",
            markup: "",
            sell: "",
            overRideMarkUp: "",
          },
          freight: {
            quantity: "",
            cost: "",
            markup: "",
            sell: "",
            overRideMarkUp: "",
          },
          drafting: {
            quantity: "",
            cost: "",
            markup: "",
            sell: "",
            overRideMarkUp: "",
          },
          machining: {
            quantity: "",
            cost: "",
            markup: "",
            sell: "",
            overRideMarkUp: "",
          },
          assembly: {
            quantity: "",
            cost: "",
            markup: "",
            sell: "",
            overRideMarkUp: "",
          },
          install: {
            quantity: "",
            cost: "",
            markup: "",
            sell: "",
            overRideMarkUp: "",
          }
        },
      },
    },
    {
      tableName: "project_cost_sheets",
      timestamps: true,
    }
  );

  ProjectCostSheet.associate = (models) => {
    ProjectCostSheet.belongsTo(models.ProjectSetup, { 
      foreignKey: 'projectId', 
      as: 'project' 
    });
  };

  return ProjectCostSheet;
};