import cron from "node-cron";
import db from "../../models/index.js";

const { Notification } = db;

export const getNotification = async (req, res) => {
    try {
      const notifications = await Notification.findAll({
        where: { seen: false }
      });
      res.status(200).json(notifications);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  


export const seenNotification = async (req, res) => {
    try {
      await Notification.update(
        { seen: true },
        { where: { id: req.params.id } }
      );
  
      res.status(200).json({ message: "Notification marked as seen." });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  