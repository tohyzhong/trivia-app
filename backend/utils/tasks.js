import cron from "node-cron";
import UsedToken from "../models/UsedToken.js";
import Lobby from "../models/Lobby.js";
import { getSocketIO } from "../socket.js";

const runSchedulers = () => {
  console.log("Initialising Cronjobs...");
  cron.schedule("0 * * * *", async () => {
    console.log("Clearing tokens used for verification more than 24h ago");

    try {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const tokens = await UsedToken.find({ usedAt: { $lt: cutoff } });
      console.log(`Found ${tokens.length} tokens to delete.`);
      await UsedToken.deleteMany({ usedAt: { $lt: cutoff } });
      console.log("Tokens cleared successfully.");
    } catch (err) {
      console.error("Error clearing tokens:", err);
    }
  });

  cron.schedule("*/1 * * * *", async () => {
    console.log(
      "Clearing lobbies that have been inactive for more than 30 minutes"
    );

    try {
      const socketIO = getSocketIO();
      const thirtyMinutesAgo = new Date(Date.now() - 1 * 60 * 1000);

      const lobbies = await Lobby.find({
        lastActivity: { $lt: thirtyMinutesAgo },
      });

      console.log(`Found ${lobbies.length} to delete.`);

      const result = await Lobby.deleteMany({
        lastActivity: { $lt: thirtyMinutesAgo },
      });

      if (result.deletedCount > 0) {
        console.log(`Deleted ${result.deletedCount} inactive lobby(ies).`);

        lobbies.forEach((lobby) => {
          socketIO.emit("lobbyDeleted", lobby.lobbyId);
        });
      } else {
        console.log("No inactive lobbies to delete.");
      }
    } catch (error) {
      console.error("Error deleting inactive lobbies:", error);
    }
  });
};

export default runSchedulers;
