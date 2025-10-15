# MorjaHome - Private Dashboard for Raspberry Pi

A private dashboard application with REST API, user authentication, two-factor authentication (2FA), and role-based access control. Perfect for Raspberry Pi deployments.

## Features

- **User Authentication**: Login system with JWT tokens
- **Two-Factor Authentication (2FA)**: TOTP support with QR codes
- **Role-Based Access Control**: Links, Photos, Minecraft, Vaultwarden, Admin roles
- **Link Manager**: Create, edit, delete, and organize links with categories
- **JSON Data Storage**: Simple file-based data storage
- **Modular Architecture**: Clean separation of concerns
- **Simple HTML Frontend**: Easy-to-use web interface
- **REST API**: Full API for all functionality

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the Application**
   ```bash
   # Development mode (with auto-restart)
   npm run dev
   
   # Production mode
   npm start
   ```

4. **Access the Dashboard**
   - Open http://localhost:3000 in your browser
   - Login with default admin credentials:
     - Username: `admin`
     - Password: `admin123`
   - **Change the default password immediately!**

## Project Structure

```
src/
├── config/          # Application configuration
├── controllers/     # Request handlers
├── middleware/      # Express middleware
├── models/          # Data models (JSON-based)
├── routes/          # API route definitions
├── services/        # Business logic
├── public/          # Static files (CSS, JS, uploads)
└── views/           # HTML templates

data/                # JSON data storage
├── users.json       # User accounts
└── links.json       # Links data
```

## User Roles

- **Admin**: Full access to all features and user management
- **Links**: Access to link management features
- **Photos**: Access to photo gallery (future feature)
- **Minecraft**: Access to Minecraft server management (future feature)
- **Vaultwarden**: Access to password manager integration (future feature)

## API Documentation

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user (admin only)
- `GET /api/auth/profile` - Get current user profile
- `POST /api/auth/logout` - Logout

### Two-Factor Authentication
- `POST /api/auth/2fa/setup` - Initialize 2FA setup
- `POST /api/auth/2fa/enable` - Enable 2FA with verification
- `POST /api/auth/2fa/disable` - Disable 2FA

### Links Management
- `GET /api/links` - Get user's links
- `POST /api/links` - Create new link
- `GET /api/links/:id` - Get specific link
- `PUT /api/links/:id` - Update link
- `DELETE /api/links/:id` - Delete link
- `POST /api/links/:id/click` - Track link click

### Dashboard
- `GET /api/dashboard` - Get dashboard data
- `GET /api/dashboard/status` - Get system status

### Admin (Admin role required)
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/stats` - System statistics

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation and sanitization
- Role-based authorization

## Configuration

Key environment variables:

- `PORT`: Server port (default: 3000)
- `JWT_SECRET`: JWT signing secret (change in production!)
- `DEFAULT_ADMIN_USERNAME/PASSWORD`: Initial admin credentials
- `NODE_ENV`: Environment (development/production)

## Development

```bash
# Install dependencies
npm install

# Start development server with auto-reload
npm run dev

# The server will be available at http://localhost:3000
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Change default JWT secret and admin credentials
3. Configure reverse proxy (nginx recommended)
4. Set up SSL/TLS certificates
5. Consider using PM2 for process management

## Future Features

- Photo gallery management
- Minecraft server integration
- Vaultwarden integration
- Advanced user permissions
- API key authentication
- Backup/restore functionality

## License

ISC