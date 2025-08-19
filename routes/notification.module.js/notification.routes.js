import express from "express";
import { getNotification, seenNotification } from "../../controller/notification/notification.controller.js";

const notificationRouter = express()

notificationRouter.get("/get", getNotification)
notificationRouter.put("/seen/:id", seenNotification)


export default notificationRouter