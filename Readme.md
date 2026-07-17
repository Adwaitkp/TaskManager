# Task Manager

A full-stack Task Management application where users can register, log in, and manage their daily tasks. Users can create, update, delete, and mark tasks as completed. The application uses JWT authentication and MongoDB for secure data storage.

## Features

- User registration and login
- JWT authentication
- Create, update, and delete tasks
- Mark tasks as completed or pending
- Filter tasks by status
- Responsive UI
- Form validation
- Docker support

## Tech Stack

### Frontend
- React (Vite)
- Tailwind CSS
- React Router DOM
- Axios

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcryptjs

### DevOps
- Docker
- Docker Compose
- Nginx

## Project Structure

```
task-manager/
├── backend/
├── frontend/
└── docker-compose.yml
```

## Installation

### Run with Docker

```bash
docker-compose up --build
```

Frontend: `http://localhost`

Backend: `http://localhost:5000`

### Run Locally

Backend

```bash
cd backend
npm install
npm run dev
```

Frontend

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

Create a `.env` file inside the `backend` folder.

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/task_manager
JWT_SECRET=your_secret_key
```

## API Endpoints

### Authentication

| Method | Endpoint |
|--------|----------|
| POST | /api/auth/register |
| POST | /api/auth/login |

### Tasks

| Method | Endpoint |
|--------|----------|
| GET | /api/tasks |
| POST | /api/tasks |
| PUT | /api/tasks/:id |
| DELETE | /api/tasks/:id |

All task routes require:

```
Authorization: Bearer <token>
```

## License

MIT