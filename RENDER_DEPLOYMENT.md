# Render Deployment Configuration

## Required Environment Variables

The following environment variables must be configured in your Render dashboard for the backend service to function properly:

### Database Configuration (Required)
- **SPRING_DATASOURCE_URL**: Full JDBC URL for your PostgreSQL database
  - Format: `jdbc:postgresql://host:port/database?sslmode=require&preferQueryMode=simple&prepareThreshold=0`
  - For Supabase Transaction Pooler: Use port 6543
  - For Supabase Session Pooler: Use port 5432
  - Example: `jdbc:postgresql://aws-0-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require&preferQueryMode=simple&prepareThreshold=0`

- **SPRING_DATASOURCE_USERNAME**: Database username (e.g., `postgres`)
- **SPRING_DATASOURCE_PASSWORD**: Database password

### JWT Configuration (Required)
- **JWT_SECRET**: Secret key for JWT token signing (use a strong random string)
- **JWT_EXPIRATION**: JWT token expiration time in milliseconds (default: 86400000 = 24 hours)
- **REFRESH_TOKEN_EXPIRATION**: Refresh token expiration time in milliseconds (default: 604800000 = 7 days)

### OAuth2 Configuration (Optional)
- **OAUTH2_GOOGLE_CLIENT_ID**: Google OAuth2 client ID
- **OAUTH2_GOOGLE_CLIENT_SECRET**: Google OAuth2 client secret
- **OAUTH2_GITHUB_CLIENT_ID**: GitHub OAuth2 client ID
- **OAUTH2_GITHUB_CLIENT_SECRET**: GitHub OAuth2 client secret

## Deployment Steps

1. **Push code to GitHub** - Ensure your repository is connected to Render

2. **Create a new Web Service** on Render:
   - Connect your GitHub repository
   - Select the `backend` directory as root
   - Render will detect the Java/Maven build automatically
   - Or use the `render.yaml` file in the repository root for automatic configuration

3. **Configure Environment Variables** in the Render dashboard:
   - Add all required variables from the list above
   - Never commit sensitive credentials to the repository

4. **Deploy** - Render will automatically build and deploy your application

## Troubleshooting

### Database Connection Issues
- Verify `SPRING_DATASOURCE_URL` is correct and includes the proper host, port, and SSL settings
- Ensure your database allows connections from Render's IP addresses
- For Supabase, check that you're using the correct pooler (Transaction vs Session)

### Application Fails to Start
- Check the Render logs for specific error messages
- Ensure all required environment variables are set
- Verify the database is accessible from Render's network

## Security Notes
- Never commit `.env` files or sensitive credentials to version control
- Use Render's environment variable feature for all sensitive data
- Rotate secrets regularly
- Use strong, random values for `JWT_SECRET`
