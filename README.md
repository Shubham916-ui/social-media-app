# Social Media App

A full-stack social media application built with Node.js, Express, MongoDB, and vanilla JavaScript.

## Deployment on Vercel

### Prerequisites

1. MongoDB Atlas account (for production database)
2. Vercel account

### Steps to Deploy

1. **Set up MongoDB Atlas:**

   - Create a MongoDB Atlas cluster
   - Get your connection string
   - Whitelist Vercel's IP addresses (or use 0.0.0.0/0 for all IPs)

2. **Deploy to Vercel:**

   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Deploy
   vercel
   ```

3. **Set Environment Variables in Vercel:**

   - Go to your Vercel dashboard
   - Select your project
   - Go to Settings > Environment Variables
   - Add these variables:
     - `MONGODB_URI`: Your MongoDB Atlas connection string
     - `NODE_ENV`: `production`
     - `JWT_SECRET`: A secure random string

4. **Redeploy:**
   ```bash
   vercel --prod
   ```

### Local Development

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.example .env
   # Edit .env with your local MongoDB connection
   ```

3. **Start the server:**

   ```bash
   npm run dev
   ```

4. **Open in browser:**
   ```
   http://localhost:5000
   ```

## Features

- User authentication (register/login)
- Create, read, delete posts
- Like and comment on posts
- Follow/unfollow users
- User profiles
- Dark mode
- Responsive design

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose
- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Authentication:** JWT
- **Deployment:** Vercel
