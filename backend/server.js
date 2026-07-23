require('dotenv').config();

const connectDB = require('./config/db');
const app = require('./app');

const PORT = Number(process.env.PORT) || 5000;

connectDB()
  .then(() => {
    // 0.0.0.0 required on Render / most PaaS hosts
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
