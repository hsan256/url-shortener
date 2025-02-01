# Arcube URL Shortener

## Overview

This project is a **simplified URL shortening service**, similar to Bit.ly. It allows users to input a long URL and receive a shortened version. When the shortened URL is accessed, it redirects users to the original long URL.

The project consists of:

- **Backend**: A Node.js and Express API that handles URL shortening, storage, and redirection.
- **Frontend**: A Next.js-based interface built with **ShadCN UI** and **Tailwind CSS** for user interaction.
- **Database**: MongoDB hosted on **MongoDB Atlas** for storing URLs.
- **Testing**: Both **unit** and **end-to-end (E2E) tests** are implemented using Jest and Supertest.
- **Documentation**: API documentation is provided via **Swagger UI**.

## Live Deployment

- **Backend**: Deployed on **Render** (free instance, may have cold start delays of 50+ seconds)
- **Frontend**: Deployed on **Vercel**
- **API Documentation**: Available at [Swagger UI](https://deploy-backend-arcube.onrender.com/api-docs)

---

## Project Structure

### Backend (`server/`)

```
📁 server
│── 📁 config          # Configuration files
│   ├── db.js          # MongoDB connection setup
│   ├── swagger.js     # Swagger documentation setup
│
│── 📁 models          # Database models
│   ├── Url.js         # URL schema model
│
│── 📁 routes          # API routes
│   ├── urls.js        # Routes for URL shortening & redirection
│
│── 📁 tests           # Test cases
│   ├── 📁 e2e         # e2e (integration) tests
│   │   ├── urls.test.js
│   ├── 📁 unit        # Unit tests
│   │   ├── urls.unit.test.js
│
│── .env               # Environment variables (not committed to Git)
│── .gitignore         # Git ignore file
│── index.js           # Main server entry point
│── jest.config.js     # Jest test configuration
│── package.json       # Project dependencies & scripts
│── package-lock.json  # Dependency lock file
```

---

## Getting Started

### Installation

Clone the repository and install dependencies:

```sh
git clone https://github.com/hsan256/url-shortener.git
cd server
npm install
```

### Configuration

Create an `.env` file in the `server/` directory based on the provided `.env.example`:

```
MONGO_URI=your_mongodb_connection_string
BASE_URL=http://localhost:5000
PORT=5000
```

---

### Running the Backend Server

```sh
npm run dev
```

The server should now be running at `http://localhost:5000`.

---

## Testing

### Run All Tests
```sh
npm run test
```

---

### API Docs
Access [Swagger Documentation](https://deploy-backend-arcube.onrender.com/api-docs) for a full API reference.

---

## Frontend

Create an `.env.local` file in the `client/` directory based on the provided `.env.example`:

```
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:5000
```

Install dependencies:

```sh
cd client
npm install
```

Frontend should be ready to go on http://localhost:3000
