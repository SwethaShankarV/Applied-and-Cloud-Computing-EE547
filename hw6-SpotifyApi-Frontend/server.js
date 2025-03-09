const express = require('express');
const app = express();
const path = require('path');
const searchRoutes = require('./routes/searchRoutes');

// Serve static files (CSS, images, JS)
app.use('/web', express.static(path.join(__dirname, 'public')));

// Home page route (Serves the static HTML page for search form)
app.get('/', (req, res) => {
  res.sendFile(path.join('public', 'index.html'));
});

// Use searchRoutes for all the search-related routes
app.use('/web', searchRoutes);

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

