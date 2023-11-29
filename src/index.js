// Import the express module
const express = require('express');

// Create an instance of the express application
const app = express();

// Define a route for the GET request on the root endpoint '/'
app.get('/', (req, res) => {
  // Send the response 'Hello' when the endpoint is accessed
  res.send('Hello');
});

// Set the server to listen on port 3000
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
