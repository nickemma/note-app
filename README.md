# Multi-Language Note-Taking App

### Description

A modern note-taking application demonstrating the integration of multiple programming languages and databases. The app supports user authentication, note creation, reading, updating, and deletion (CRUD), with authorization ensuring only logged-in users can modify their own notes. Others can view notes, and a stats endpoint provides note analytics.

### Features

- **Authentication:** JWT-based user registration and login via Java (Spring Boot) with PostgreSQL.
- **Note Management:** CRUD operations for notes using Go (Gin) with MongoDB, including rate limiting.
- **Analytics:** Note statistics (e.g., user note count) via Python (FastAPI).
- **Frontend:** Responsive UI built with Next.js and TypeScript, styled with Tailwind CSS.
- **Authorization:** Only authenticated users can create, edit, or delete their own notes.
- **Multi-Language Integration:** Combines Java, Go, Python, and TypeScript for a polyglot architecture.
- **Containerized:** Uses Docker Compose to orchestrate PostgreSQL, MongoDB, and all services.

## Tech Stack

### Backend

- **Languages**: Go (Golang), Java and Python for high-performance microservices
- **API Gateway**: Kong with rate limiting (1000 requests/minute default)
- **Authentication**: JWT + bcrypt password hashing

### Databases

- **PostgreSQL**: EHR data storage (AWS RDS)
- **MongoDB**: Session caching (patient active video sessions)

### Containerization

- **Docker**: 

## Project Structure

| Note-Taking-App        | Methodology                            |
|------------------------|----------------------------------------|
| **java-backend**       | Spring Boot backend for authentication |
| **go-backend**         | Gin backend for note CRUD              |
| **python-backend**     | FastAPI backend for stats              |
| **frontend**           | Next.js frontend                       |
| **.env**               | Environment variables                  |
| **docker-compose.yml** | Orchestrates services                  |

### Prerequisites

- Docker and Docker Compose
- Node.js (for local frontend development, optional)
- Maven (for local Java development, optional)
- Go (for local Go development, optional)
- Python 3.10+ (for local Python development, optional)

### Setup Instructions

1. Clone the Repository:
```sh
  git clone https://github.com/nickemma/note-app.git
  cd note-taking-app
```

2. Create the .env File: Copy the provided .env template to the project root and ensure the values match your environment:

- POSTGRES_USER=admin
- POSTGRES_PASSWORD=secret
- POSTGRES_DB=notesdb
- MONGO_URI=mongodb://mongo:27017/notesdb
- JWT_SECRET=your-very-secure-secret-key
- JAVA_API_URL=http://java-backend:8080
- GO_API_URL=http://go-backend:8081
- PYTHON_API_URL=http://python-backend:8000

3. Build and Run with Docker Compose:
```sh
 docker-compose up --build
```
This starts:
- PostgreSQL on port 5432
- MongoDB on port 27017
- Java backend on port 8080
- Go backend on port 8081
- Python backend on port 8000
- Next.js frontend on port 3000

4. Access the App: Open http://localhost:3000 in your browser.

### API Endpoints

- Java Backend (Authentication):
  - POST /api/auth/register: Register a new user.
  - POST /api/auth/login: Log in and receive a JWT token.
- Go Backend (Notes):
  - GET /api/notes: List all notes.
  - GET /api/notes/:id: Get a specific note.
  - POST /api/notes: Create a new note (authenticated).
  - PUT /api/notes/:id: Update a note (authenticated, owner only).
  - DELETE /api/notes/:id: Delete a note (authenticated, owner only).
- Python Backend (Stats):
  - GET /api/stats: Get note statistics for the authenticated user.

### Development Notes
- **Environment Variables:** Ensure .env and frontend/.env.local are correctly configured.
- **Security:** The Go backend includes a simple rate limiter. For production, consider Redis-based rate limiting and HTTPS.
- **Extensibility:** Add more features like note categories or rich text editing by extending the Go backend and frontend.

### Development Notes
- **Database Issues:** Verify PostgreSQL and MongoDB containers are running (docker ps).
- **API Errors:** Check container logs with docker-compose logs <service>.
- **Frontend Not Loading:** Ensure the backend services are up before the frontend starts.

### Contributing
Feel free to fork the repository, make improvements, and submit pull requests. Focus areas for enhancement:
- Add note categories or tags.
- Implement advanced rate limiting with Redis.
- Enhance the UI with additional features like dark mode.

### 📜 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 👥 Author

👤 **Nicholas Emmanuel**

- GitHub: [@NickEmma](https://github.com/NickEmma)
- Twitter: [@techieEmma](https://twitter.com/techieEmma)
- LinkedIn: [@Nicholas Emmanuel](https://www.linkedin.com/in/techieemma/)
- Website: [Nicholas Emmanuel](https://techieemma.me)