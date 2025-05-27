import cron from 'node-cron';
import UsedToken from '../models/UsedToken.js';

const runSchedulers = () => {
  cron.schedule('0 * * * *', async () => {
    console.log('Clearing tokens used for verification more than 24h ago');

    try {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); 
      const tokens = await UsedToken.find({ usedAt: { $lt: cutoff } });
      console.log(`Found ${tokens.length} tokens to delete.`);
      await UsedToken.deleteMany({ usedAt: { $lt: cutoff } });
      console.log('Tokens cleared successfully.');
    } catch (err) {
      console.error('Error clearing tokens:', err);
    }
  });
}

export default runSchedulers;