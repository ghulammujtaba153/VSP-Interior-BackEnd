import db from '../../models/index.js';
const {Inventory, Audit} = db;

export const createInventory = async (req, res) => {
    try {
        const inventory = await Inventory.create(req.body);
        console.log(inventory);
        await Audit.create({ userId: req.body.userId, action: 'create', tableName: 'inventory', newData: inventory.get() });
        res.status(201).json({
            message: "Inventory created successfully",
            inventory
        });
    } catch (error) {
        res.status(500).json({              
            message: "Error creating inventory",
            error: error.message
        });
    }
}

export const getInventory = async (req, res) => {
    try{
        const inventory = await Inventory.findAll({
            include: [
                {
                    model: db.Suppliers,
                    as: 'supplier'
                }
            ]
        });
        res.status(200).json({
            message: "Inventory fetched successfully",
            inventory
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching inventory",
            error: error.message
        });
    }
}

export const updateInventory = async (req, res) => {
    try{
        const inventory = await Inventory.findByPk(req.params.id);
        if(!inventory){
            return res.status(404).json({
                message: "Inventory not found"
            });
        }
        await inventory.update(req.body);
        await Audit.create({ userId: req.body.userId, action: 'update', tableName: 'inventory', oldData: inventory.get(), newData: req.body });
        res.status(200).json({
            message: "Inventory updated successfully",
            inventory
        });
    } catch (error) {
        res.status(500).json({
            message: "Error updating inventory",
        });
    }
}



export const deleteInventory = async (req, res) => {
    try{
        const inventory = await Inventory.findByPk(req.params.id);
        if(!inventory){
            return res.status(404).json({
                message: "Inventory not found"
            });
        }
        await inventory.destroy();
        await Audit.create({ userId: req.body.userId, action: 'delete', tableName: 'inventory', oldData: inventory.get() });
        res.status(200).json({
            message: "Inventory deleted successfully",
        });
    } catch(error){
        res.status(500).json({
            message: "Error deleting inventory",
            error: error.message
        });
    }
}