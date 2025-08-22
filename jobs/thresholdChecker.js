import cron from "node-cron";
import db from "../models/index.js";


const { Inventory, Notification } = db;

// Every 5 minutes
cron.schedule("* * * * *", async () => {
  try {
    const inventoryItems = await Inventory.findAll();

    for (const item of inventoryItems) {
      const { name, itemCode, quantity, minThreshold, maxThreshold } = item;

      // check below min
      if (minThreshold !== null && quantity < minThreshold) {
        const message = `${name} (${itemCode}) is below its minimum threshold.`;
        
        // Check if there's already an unseen notification with the same message
        const existingNotification = await Notification.findOne({
          where: {
            message: message,
            seen: false
          }
        });

        // Only create if no unseen notification exists
        if (!existingNotification) {
          await Notification.create({ message });
          console.log(`Created notification: ${message}`);
        }
      }

      // check above max
      if (maxThreshold !== null && quantity > maxThreshold) {
        const message = `${name} (${itemCode}) is above its maximum threshold.`;
        
        // Check if there's already an unseen notification with the same message
        const existingNotification = await Notification.findOne({
          where: {
            message: message,
            seen: false
          }
        });

        // Only create if no unseen notification exists
        if (!existingNotification) {
          await Notification.create({ message });
          console.log(`Created notification: ${message}`);
        }
      }
    }
    console.log("Threshold check completed");
  } catch (error) {
    console.error("Cron job error:", error);
  }
});
