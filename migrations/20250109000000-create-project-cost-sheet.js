'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('project_cost_sheets', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      projectId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'project_setups',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      unitName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      drawingNo: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      Revision: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      Measure: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      qunatity: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      unitType: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      unitLength: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      wasteOverRide: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      location: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      cabinetLookUp: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
      },
      wallPanelling: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
      },
      hardwareLookUp: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
      },
      trims: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
      },
      splitBattens: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
      },
      drawers: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
      },
      hinges: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
      },
      miscItems: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
      },
      buyInItems: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
      },
      other: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {
          extraFreight: {
            description: "",
            extraQunatity: "",
            height: "",
            length: "",
            depth: "",
            measures: "",
            qunatity: "",
            rate: "",
            subTotal: "",
            notes: ""
          },
          draftingHours: {
            measures: "",
            qunatity: "",
            rate: "",
            subTotal: "",
            notes: ""
          }
        },
      },
      extraLabourHours: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {
          extraHourMachining: {
            measures: "",
            qunatity: "",
            rate: "",
            subTotal: "",
            notes: ""
          },
          extraHourAssembly: {
            measures: "",
            qunatity: "",
            rate: "",
            subTotal: "",
            notes: ""
          },
          extraHourSite: {
            measures: "",
            qunatity: "",
            rate: "",
            subTotal: "",
            notes: ""
          },
        },
      },
      totals: {
        type: Sequelize.JSON,
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
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('project_cost_sheets');
  },
};

