# Wishiyo API Routes

This directory contains Vercel API routes that have been migrated from Supabase Edge Functions.

## API Endpoints

### 1. Send Order Verification

**Endpoint**: `/api/send-order-verification`

**Method**: `POST`

**Description**: Sends a verification code to the user's email for order history access.

**Request Body**:
```json
{
  "email": "customer@example.com"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Verification code sent"
}
```

### 2. Verify Order Code

**Endpoint**: `/api/verify-order-code`

**Method**: `POST`

**Description**: Verifies the code sent to the user's email and returns a JWT token for authentication.

**Request Body**:
```json
{
  "email": "customer@example.com",
  "code": "123456"
}
```

**Response**:
```json
{
  "success": true,
  "token": "jwt_token_here",
  "orderCount": 2
}
```

## Environment Variables

These API routes require the following environment variables to be set in your Vercel project:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `RESEND_API_KEY`: Your Resend API key for sending emails
- `JWT_SECRET`: A secure random string for signing JWT tokens

## Deployment

These API routes are automatically deployed when you deploy your Vercel project. Make sure to set the required environment variables in your Vercel project settings.
