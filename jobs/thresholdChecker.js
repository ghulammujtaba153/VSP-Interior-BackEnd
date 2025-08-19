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
        await Notification.create({ message });
      }

      // check above max
      if (maxThreshold !== null && quantity > maxThreshold) {
        const message = `${name} (${itemCode}) is above its maximum threshold.`;
        await Notification.create({ message });
      }
    }
    console.log("schedule notification")
  } catch (error) {
    console.error("Cron job error:", error);
  }
});
