# Admin Dashboard System - Deployment & Security Checklist

## 🚀 Pre-Deployment Checklist

### Database Security
- [ ] **Change default admin password**
  ```sql
  -- Login as admin and change password via UI, or:
  UPDATE Users 
  SET password = '<new_bcrypt_hash>' 
  WHERE email = 'admin@microlease.com';
  ```

- [ ] **Set strong JWT secret**
  ```bash
  # In .env file:
  JWT_SECRET=<generate_strong_random_string_64_chars>
  ```

- [ ] **Enable database backups**
  - Schedule automatic daily backups
  - Test restore procedure
  - Store backups off-site

- [ ] **Restrict database access**
  - Use separate database user for production
  - Grant minimum required permissions
  - Disable remote root access

### Backend Security

- [ ] **Environment Variables**
  ```bash
  # .env file (DO NOT commit to git)
  NODE_ENV=production
  DB_HOST=<production_db_host>
  DB_USER=<db_user>
  DB_PASS=<strong_password>
  DB_NAME=<db_name>
  JWT_SECRET=<64_char_random_string>
  JWT_EXPIRY=24h
  PORT=3000
  CORS_ORIGIN=https://yourdomain.com
  ```

- [ ] **CORS Configuration**
  ```javascript
  // In server.js
  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
  }));
  ```

- [ ] **Rate Limiting on Admin Routes**
  ```bash
  npm install express-rate-limit
  ```
  ```javascript
  // In server.js
  const rateLimit = require('express-rate-limit');
  
  const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
  });
  
  app.use('/api/admin', adminLimiter);
  ```

- [ ] **Helmet.js for Security Headers**
  ```bash
  npm install helmet
  ```
  ```javascript
  // In server.js
  const helmet = require('helmet');
  app.use(helmet());
  ```

- [ ] **Input Validation**
  - Verify express-validator is used on all routes
  - Sanitize user inputs
  - Validate file uploads (if any)

- [ ] **HTTPS Enforcement**
  ```javascript
  // In server.js (for production)
  if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
      if (req.header('x-forwarded-proto') !== 'https') {
        res.redirect(`https://${req.header('host')}${req.url}`);
      } else {
        next();
      }
    });
  }
  ```

### Frontend Security

- [ ] **Build for Production**
  ```bash
  cd frontend
  npm run build
  # Outputs to dist/ folder
  ```

- [ ] **Environment Variables**
  ```bash
  # .env.production
  VITE_API_URL=https://api.yourdomain.com
  ```

- [ ] **Token Storage Review**
  - Consider using httpOnly cookies instead of localStorage
  - Implement token refresh mechanism
  - Set reasonable token expiry time

- [ ] **CSP Headers**
  ```javascript
  // In backend server.js
  app.use(helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    }
  }));
  ```

---

## 🔐 Access Control Checklist

- [ ] **Admin Account Management**
  - Only create admin accounts via secure process
  - Use strong passwords (min 12 chars, mixed case, numbers, symbols)
  - Enable 2FA if possible (future enhancement)
  - Regular password rotation policy (every 90 days)

- [ ] **Session Management**
  - Set JWT expiry to reasonable time (24 hours)
  - Implement logout on all devices feature
  - Clear tokens on logout
  - Detect and prevent concurrent logins

- [ ] **Role Verification**
  - Verify adminMiddleware is applied to ALL admin routes
  - Double-check no admin routes are accidentally public
  - Test non-admin user cannot access admin endpoints

---

## 📊 Monitoring & Logging

- [ ] **Logging Setup**
  ```bash
  npm install winston
  ```
  ```javascript
  // logger.js
  const winston = require('winston');
  
  const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
      new winston.transports.File({ filename: 'error.log', level: 'error' }),
      new winston.transports.File({ filename: 'combined.log' }),
    ],
  });
  
  if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
      format: winston.format.simple(),
    }));
  }
  
  module.exports = logger;
  ```

- [ ] **Admin Activity Logging**
  ```javascript
  // Add to each admin route handler
  logger.info({
    action: 'USER_BANNED',
    admin: req.user.email,
    targetUser: userId,
    timestamp: new Date(),
    ip: req.ip
  });
  ```

- [ ] **Error Monitoring**
  - Set up Sentry or similar for error tracking
  - Monitor API response times
  - Set up alerts for failed admin actions

- [ ] **Database Query Monitoring**
  - Enable slow query log
  - Monitor for N+1 queries
  - Index frequently queried fields

---

## 🧪 Testing Before Deployment

### Automated Testing
- [ ] **Backend API Tests**
  ```bash
  npm install --save-dev jest supertest
  ```
  - Test all admin endpoints with valid JWT
  - Test all admin endpoints with invalid/missing JWT
  - Test all admin endpoints with non-admin JWT
  - Test ban user functionality
  - Test approve item functionality
  - Test dispute resolution with wallet updates

- [ ] **Frontend Component Tests**
  ```bash
  npm install --save-dev @testing-library/react vitest
  ```
  - Test AdminRoute redirects correctly
  - Test AdminLogin validates credentials
  - Test admin pages render without errors

### Manual Testing
- [ ] Run complete test suite from ADMIN_TESTING_GUIDE.md
- [ ] Test all 80+ test cases
- [ ] Verify all workflows work end-to-end
- [ ] Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test responsive design on mobile/tablet
- [ ] Test with slow network conditions

### Security Testing
- [ ] **Penetration Testing**
  - Test SQL injection on all inputs
  - Test XSS on description fields
  - Test CSRF protection
  - Test JWT tampering
  - Test unauthorized access attempts

- [ ] **Load Testing**
  ```bash
  npm install -g artillery
  ```
  ```yaml
  # load-test.yml
  config:
    target: 'https://api.yourdomain.com'
    phases:
      - duration: 60
        arrivalRate: 10
  scenarios:
    - name: 'Admin Dashboard'
      flow:
        - post:
            url: '/api/auth/login'
            json:
              email: 'admin@microlease.com'
              password: 'Admin@123'
  ```
  ```bash
  artillery run load-test.yml
  ```

---

## 🌐 Deployment Steps

### Backend Deployment (Node.js)

#### Option 1: PM2 (Recommended)
```bash
# Install PM2 globally
npm install -g pm2

# Start backend
cd backend
pm2 start server.js --name microlease-backend

# Configure auto-restart on reboot
pm2 startup
pm2 save

# Monitor
pm2 monit

# View logs
pm2 logs microlease-backend
```

#### Option 2: Docker
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```
```bash
# Build and run
docker build -t microlease-backend .
docker run -d -p 3000:3000 --name microlease-backend microlease-backend
```

#### Option 3: Cloud Platforms
- **Heroku**: `git push heroku main`
- **AWS Elastic Beanstalk**: Deploy via AWS CLI
- **Google Cloud Run**: Deploy via gcloud CLI
- **Azure App Service**: Deploy via Azure Portal

### Frontend Deployment

#### Option 1: Static Hosting (Vercel, Netlify)
```bash
# Vercel
npm install -g vercel
cd frontend
vercel --prod

# Netlify
npm install -g netlify-cli
cd frontend
npm run build
netlify deploy --prod --dir=dist
```

#### Option 2: Nginx
```bash
# Build frontend
cd frontend
npm run build

# Copy to Nginx directory
sudo cp -r dist/* /var/www/html/

# Nginx configuration
sudo nano /etc/nginx/sites-available/microlease
```
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
```bash
# Enable site and restart Nginx
sudo ln -s /etc/nginx/sites-available/microlease /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Database Migration
- [ ] Backup production database
- [ ] Run Sequelize migrations
  ```bash
  # If using migrations (recommended)
  npx sequelize-cli db:migrate
  ```
- [ ] Verify all tables and columns exist
- [ ] Run seed script for admin user
  ```bash
  node scripts/seedAdmin.js
  ```

---

## 🔄 Post-Deployment Verification

- [ ] **Smoke Tests**
  - [ ] Admin login works
  - [ ] Dashboard loads with stats
  - [ ] Can view users, items, disputes, transactions
  - [ ] Can ban a test user
  - [ ] Can approve a test item
  - [ ] Can resolve a test dispute

- [ ] **Performance Tests**
  - [ ] Dashboard loads in < 2 seconds
  - [ ] API responses < 500ms
  - [ ] No memory leaks (monitor for 24 hours)

- [ ] **Monitoring Setup**
  - [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
  - [ ] Set up error alerts (Sentry, Rollbar)
  - [ ] Set up performance monitoring (New Relic, Datadog)
  - [ ] Configure email alerts for critical errors

---

## 📝 Operational Procedures

### Daily Tasks
- [ ] Check error logs
- [ ] Monitor API response times
- [ ] Review admin activity logs
- [ ] Check for suspicious login attempts

### Weekly Tasks
- [ ] Review dispute resolution times
- [ ] Analyze user ban patterns
- [ ] Check for unapproved items backlog
- [ ] Review transaction anomalies

### Monthly Tasks
- [ ] Database optimization (ANALYZE TABLE)
- [ ] Security patch updates
- [ ] Review and rotate admin passwords
- [ ] Backup verification (test restore)
- [ ] Performance report generation

### Quarterly Tasks
- [ ] Security audit
- [ ] Penetration testing
- [ ] Update dependencies
- [ ] Review and update documentation

---

## 🆘 Emergency Procedures

### Database Corruption
```bash
# Restore from latest backup
mysql -u root -p microlease < backup_latest.sql

# Verify data integrity
SELECT COUNT(*) FROM Users;
SELECT COUNT(*) FROM Items;
```

### Security Breach
1. **Immediate Actions**:
   - [ ] Disable all admin accounts
   - [ ] Rotate JWT secret
   - [ ] Force logout all users
   - [ ] Review access logs

2. **Investigation**:
   - [ ] Check admin activity logs
   - [ ] Review database changes
   - [ ] Identify breach source

3. **Recovery**:
   - [ ] Restore from pre-breach backup
   - [ ] Create new admin accounts
   - [ ] Notify affected users
   - [ ] Implement additional security measures

### Server Down
1. **Check server status**:
   ```bash
   pm2 status
   # or
   docker ps
   ```

2. **Restart backend**:
   ```bash
   pm2 restart microlease-backend
   # or
   docker restart microlease-backend
   ```

3. **Check logs**:
   ```bash
   pm2 logs microlease-backend
   # or
   docker logs microlease-backend
   ```

4. **Verify database connection**:
   ```bash
   mysql -u user -p -h host -e "SELECT 1"
   ```

---

## 🎯 Performance Optimization

### Database Indexing
```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_users_email ON Users(email);
CREATE INDEX idx_users_role ON Users(role);
CREATE INDEX idx_users_banned ON Users(banned);
CREATE INDEX idx_items_approved ON Items(approved);
CREATE INDEX idx_items_availability ON Items(availability);
CREATE INDEX idx_disputes_status ON Disputes(status);
CREATE INDEX idx_transactions_userid ON Transactions(UserId);
CREATE INDEX idx_transactions_type ON Transactions(type);
CREATE INDEX idx_leases_status ON Leases(status);
```

### Query Optimization
```javascript
// Use lean queries for list views
const users = await User.findAll({
  attributes: ['id', 'name', 'email', 'role', 'banned'],
  include: [
    { model: Item, attributes: ['id'] },
    { model: Lease, attributes: ['id'] }
  ]
});

// Implement pagination
const { page = 1, limit = 20 } = req.query;
const offset = (page - 1) * limit;
const transactions = await Transaction.findAll({ limit, offset });
```

### Caching
```bash
npm install redis
```
```javascript
// Cache dashboard stats for 5 minutes
const redis = require('redis');
const client = redis.createClient();

router.get('/stats', auth, adminMiddleware, async (req, res) => {
  const cacheKey = 'admin:dashboard:stats';
  const cached = await client.get(cacheKey);
  
  if (cached) {
    return res.json(JSON.parse(cached));
  }
  
  const stats = await calculateStats();
  await client.setEx(cacheKey, 300, JSON.stringify(stats)); // 5 min TTL
  res.json(stats);
});
```

---

## ✅ Final Deployment Checklist

### Before Going Live
- [ ] All tests passing
- [ ] No console errors or warnings
- [ ] All environment variables set
- [ ] Database backups configured
- [ ] SSL certificates installed
- [ ] HTTPS enforced
- [ ] Rate limiting enabled
- [ ] Logging configured
- [ ] Monitoring set up
- [ ] Admin password changed
- [ ] JWT secret set to strong value
- [ ] CORS configured correctly
- [ ] Security headers enabled
- [ ] Documentation complete
- [ ] Emergency procedures documented

### Launch Day
- [ ] Deploy backend to production server
- [ ] Deploy frontend to hosting platform
- [ ] Run database migrations
- [ ] Verify all services running
- [ ] Test admin login
- [ ] Test critical workflows
- [ ] Monitor error logs for 1 hour
- [ ] Announce to team

### First Week
- [ ] Daily log reviews
- [ ] Performance monitoring
- [ ] User feedback collection
- [ ] Bug triage and fixes
- [ ] Documentation updates based on issues

---

## 📞 Support Contacts

**System Administrator**: _____________
**Database Admin**: _____________
**Security Lead**: _____________
**On-Call Developer**: _____________

---

## 📚 Additional Resources

- **API Documentation**: /api-docs (if using Swagger)
- **User Guide**: ADMIN_QUICK_REFERENCE.md
- **Testing Guide**: ADMIN_TESTING_GUIDE.md
- **Architecture**: ADMIN_ARCHITECTURE.md
- **GitHub Issues**: _____________
- **Monitoring Dashboard**: _____________

---

**Deployment Version**: 1.0.0
**Last Updated**: January 2025
**Status**: Ready for Production
