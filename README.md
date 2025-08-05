# Biometric Attendance System

A comprehensive biometric attendance tracking system built with fingerprint recognition technology using the DigitalPersona U.are.U 4500 scanner. The system features a modern web interface, secure backend, and advanced fingerprint matching capabilities.

![System Architecture](screenshots/bas_screenshot_1.JPG)

## 🎯 Features

- **Fingerprint-based Authentication**: Secure student identification using DigitalPersona U.are.U 4500 scanner
- **Course Management**: Create and manage courses with teacher assignments
- **Student Registration**: Register students with fingerprint enrollment
- **Real-time Attendance**: Mark attendance using fingerprint verification
- **Comprehensive Reports**: Generate detailed attendance reports with filtering options
- **Multi-tier Architecture**: React frontend, Node.js API, and Python matching service
- **Modern UI**: Responsive design with Bootstrap and custom styling
- **Database Integration**: MySQL with Prisma ORM for data management

## 🏗️ System Architecture

The system consists of three main components:

### 1. **Client (Frontend)**

- **Technology**: React 18 with TypeScript
- **Port**: 5000
- **Features**:
  - User authentication and authorization
  - Course and student management interfaces
  - Real-time fingerprint scanning interface
  - Attendance reporting and analytics
  - Responsive design for desktop and mobile

### 2. **Server (Core Backend)**

- **Technology**: Node.js with Express and TypeScript
- **Port**: 8000
- **Features**:
  - RESTful API endpoints
  - JWT-based authentication
  - Prisma ORM for database operations
  - Input validation and error handling
  - CORS configuration for cross-origin requests

### 3. **Server-py (Matching Backend)**

- **Technology**: Python with Flask and OpenCV
- **Port**: 5000 (Python service)
- **Features**:
  - DigitalPersona SDK integration
  - Fingerprint image processing
  - Template generation and matching
  - Quality verification algorithms
  - Feature extraction capabilities

## 📋 Prerequisites

### System Requirements

- **Operating System**: Windows 10/11 (required for DigitalPersona scanner)
- **Node.js**: 16.0 or higher
- **Python**: 3.9 or higher
- **Conda**: Latest version
- **MySQL**: 8.0 or higher
- **Git**: Latest version

### Hardware Requirements

- **Scanner**: DigitalPersona U.are.U 4500 fingerprint scanner
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 5GB free space
- **USB**: Available USB port for scanner

### Software Dependencies

- **DigitalPersona Client**: [Download Here](https://drive.google.com/file/d/12QCh311WQ-_PIkMHeXqNRfTkbIWnnSdY/view?usp=sharing)
- **Visual Studio Redistributables**: For Windows dependencies
- **MySQL Workbench**: For database management (optional)

## 🚀 Quick Start

### One-Command Setup (Recommended)

You can run the entire system (database, backend, Python fingerprint service, frontend) with Docker Compose:

1. **Install Docker Desktop** (Windows/Mac/Linux)
2. **Connect the DigitalPersona U.are.U 4500 fingerprint scanner** to your computer
3. **Open a terminal in the project root** (`GitUploader`)
4. **Run:**

   ```powershell
   docker-compose up --build
   ```

5. **Wait for all containers to start.** Healthchecks will ensure services are ready.
6. **Access the app:**
   - React client: [http://localhost:5000](http://localhost:5000)
   - API server: [http://localhost:8000/api/health](http://localhost:8000/api/health)
   - Python service: [http://localhost:5000/health](http://localhost:5000/health)

**Optional:**

- For Nginx reverse proxy: add `--profile with-nginx`
- For Redis: add `--profile with-redis`

**Troubleshooting:**

- Make sure Docker Desktop is running
- Ensure the scanner is connected for fingerprint features
- Database and services are seeded automatically

---

### 1. Clone the Repository

```bash
git clone https://github.com/IamGideonIdoko/bio-attendance-sys.git
cd bio-attendance-sys
```
