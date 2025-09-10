import db from "../../models/index.js"

const { Worker, Audit } = db

export const createWorker = async (req, res) => {
    try {
        const worker = await Worker.create(req.body)
        res.status(201).json(worker)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}



export const importCSV = async (req, res) => {
    const { userId, workers } = req.body;

    try {
        // Get existing workers from DB
        const existingWorkers = await Worker.findAll({ attributes: ["email"] });
        const existingEmails = new Set(existingWorkers.map(e => e.email));

        // Filter out duplicates by email
        const uniqueWorkers = workers.filter(worker => !existingEmails.has(worker.email));

        let insertedWorkers = [];
        if (uniqueWorkers.length > 0) {
            insertedWorkers = await Worker.bulkCreate(uniqueWorkers.map(row => ({ ...row })));

            // Audit log only when new workers are added
            await Audit.create({ 
                userId, 
                action: 'import', 
                tableName: 'workers', 
                newData: insertedWorkers 
            });
        }

        res.status(201).json({
            message: `Processed successfully, added: ${insertedWorkers.length}, skipped: ${workers.length - insertedWorkers.length}`,
            inserted: insertedWorkers.length,
            skipped: workers.length - insertedWorkers.length,
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};




export const getAllWorkers = async (req, res) => {
    let { page = 1, limit = 10, search = "", status = "", jobTitle = "" } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const offset = (page - 1) * limit;

    // Build search conditions
    const whereConditions = {};
    if (search.trim() !== "") {
        whereConditions[db.Sequelize.Op.or] = [
            { name: { [db.Sequelize.Op.iLike]: `%${search}%` } },
            { email: { [db.Sequelize.Op.iLike]: `%${search}%` } },
            { phone: { [db.Sequelize.Op.iLike]: `%${search}%` } },
        ];
    }
    if (status && status !== "") {
        whereConditions.status = status;
    }
    if (jobTitle && jobTitle !== "") {
        whereConditions.jobTitle = jobTitle;
    }

    try {
        const workers = await Worker.findAndCountAll({
            where: whereConditions,
            offset,
            limit,
            order: [["createdAt", "DESC"]],
        });
        res.status(200).json({
            total: workers.count,
            workers: workers.rows,
            page,
            limit,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}



export const getWorkerById = async (req, res) => {
    try {
        const worker = await Worker.findByPk(req.params.id)
        if (!worker) {
            return res.status(404).json({ message: "Worker not found" })
        }
        res.status(200).json(worker)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}



export const updateWorker = async (req, res) => {
  try {
    const { id } = req.params;

    // Update the worker
    const [updated] = await Worker.update(req.body, {
      where: { id },
    });

    if (updated) {
      const updatedWorker = await Worker.findByPk(id);
      return res.status(200).json(updatedWorker);
    }

    return res.status(404).json({ message: "Worker not found" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




export const deleteWorker = async (req, res) => {
    try {
        const worker = await Worker.destroy({ where: { id: req.params.id } })
        res.status(200).json({ message: "Worker deleted successfully" })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}