const cors = require('cors');

const corsOptions = {
  origin: process.env.ALLOWED_ORIGIN || '*',  // Set allowed origin from environment variable
  methods: 'GET,POST,PATCH,DELETE',  // Allowed methods
  credentials: true,  // Allow credentials if needed
};

app.use(cors(corsOptions));
