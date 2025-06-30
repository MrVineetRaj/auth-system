import { createServer } from 'http';

import app from './app/express';
import envConf from './envConf';
import connectDB from './app/database/db';

const PORT = envConf.PORT || 3000;

const server = createServer(app);

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(
        `Server is running in ${envConf.NODE_ENV} mode on port ${PORT}`
      );
    });
  })
  .catch((error) => {
    console.error('Failed to connect to the database:', error);
    process.exit(1);
  });

  