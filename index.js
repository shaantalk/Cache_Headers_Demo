const express = require("express");
const app = express();

let resource = {
  content: "This is a sample resource",
  eTag: '"' + Math.random().toString(36).substr(2, 9) + '"', // Initial ETag value
  lastModified: new Date().toISOString(), // Initial last modified timestamp
  updateCounter: 0, // Counter to track the number of updates
};

// Middleware to set cache control headers and update resource properties
app.use((req, res, next) => {
  // Cache-Control: Specifies directives for caching mechanisms
  res.setHeader("Cache-Control", "public, max-age=10"); // Cache resource for 10 seconds

  // Expires: Provide a date/time after which the response is considered stale
  const expiryDate = new Date(Date.now() + 10000); // Cache resource for 10 seconds (in milliseconds)
  res.setHeader("Expires", expiryDate.toUTCString());

  // ETag: An identifier for a specific version of a resource
  res.setHeader("ETag", resource.eTag);

  // Last-Modified: The date and time the resource was last modified
  res.setHeader("Last-Modified", resource.lastModified);

  next();
});

// Middleware to handle conditional requests using ETag and Last-Modified headers
function handleConditionalRequests(req, res, next) {
  // Check if the client's cache is still valid
  if (
    req.headers["if-none-match"] === resource.eTag &&
    new Date(req.headers["if-modified-since"]) >=
      new Date(resource.lastModified)
  ) {
    // Resource has not been modified, send a 304 Not Modified response
    return res.status(304).end();
  } else {
    // Resource has been modified, continue to the next middleware
    next();
  }
}

// Route to serve the sample resource along with conditional request handling middleware
app.get("/resource", handleConditionalRequests, (req, res) => {
  // Extract previous ETag and Last-Modified from request headers
  const prevETag = req.headers["if-none-match"];
  const prevLastModified = req.headers["if-modified-since"];

  // Determine message based on previous ETag and Last-Modified
  let message = "";
  if (!prevETag && !prevLastModified) {
    message = "First request";
  } else {
    message = `Resource updated ${resource.updateCounter} times`;
  }

  // Increment the update counter
  resource.updateCounter++;

  // Send the resource object including message
  const responseObject = {
    content: resource.content,
    eTag: resource.eTag,
    lastModified: resource.lastModified,
    previousETag: prevETag || null,
    previousLastModified: prevLastModified || null,
    message: message,
  };

  res.json(responseObject);
});

// Update resource properties (ETag and last modified) every 10 seconds
setInterval(() => {
  // Update ETag
  resource.eTag = '"' + Math.random().toString(36).substr(2, 9) + '"';

  // Update last modified timestamp
  resource.lastModified = new Date().toISOString();
}, 20000);

const PORT = 8081;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
