const logRequest = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || 'Unknown';
  
  // Log basic request info
  console.log(`[${timestamp}] ${method} ${url} - ${ip}`);
  
  // Log user info if authenticated
  if (req.user) {
    console.log(`  User: ${req.user.username} (${req.user.roles.join(', ')})`);
  }
  
  // Log request body for POST/PUT/PATCH (but hide sensitive data)
  if (['POST', 'PUT', 'PATCH'].includes(method) && req.body) {
    const body = { ...req.body };
    // Hide sensitive fields
    if (body.password) body.password = '[HIDDEN]';
    if (body.token) body.token = '[HIDDEN]';
    if (body.twoFactorCode) body.twoFactorCode = '[HIDDEN]';
    
    console.log(`  Body:`, JSON.stringify(body));
  }

  // Track response time
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const statusClass = Math.floor(statusCode / 100);
    
    let logLevel = 'INFO';
    if (statusClass === 4) logLevel = 'WARN';
    if (statusClass === 5) logLevel = 'ERROR';
    
    console.log(`[${timestamp}] ${logLevel} ${method} ${url} - ${statusCode} - ${duration}ms`);
  });

  next();
};

module.exports = {
  logRequest
};