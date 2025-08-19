import db from '../../models/index.js';

const {Audit, User} = db


export const getAudit = async (req, res) => {
    try {
        const audits = await Audit.findAll({
            include: [
                {
                    model: User,
                    attributes: ['id', 'name', 'email']
                }
            ],
            order: [['createdAt', 'DESC']]
        })
        
        res.status(200).json({ total: audits.length, audits})
    } catch (error) {
        res.status(500).json({message: "Internal server error", error: error.message})
    }
}
