# Media Tab 4K

## Overview

This is a Flask-based web application called "Media Tab 4K" that allows users to download videos and media in high quality (including 4K/8K) from various platforms including YouTube, Instagram, Facebook, Pinterest and others. The application provides a user-friendly web interface for adding download tasks, monitoring progress, and managing downloads through a queue system.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (2025-07-30)

✓ Enhanced YouTube resolution options with 4K/8K support
✓ Improved format selection with detailed quality descriptions  
✓ Fixed progress stream timeout issues by switching to polling
✓ Added comprehensive codec information display
✓ Optimized download queue management
✓ Successfully tested video info extraction (40 formats available)
✓ Added MP3 audio download options (128, 192, 256, 320 kbps)
✓ Installed FFmpeg for audio conversion support
✓ Enhanced audio quality detection with bitrate information
✓ Successfully tested MP3 download functionality

## System Architecture

The application follows a traditional Flask web application architecture with the following key components:

### Backend Architecture
- **Flask Framework**: Core web framework handling HTTP requests and responses
- **SQLAlchemy ORM**: Database abstraction layer with declarative models
- **Multi-threaded Processing**: Background worker thread for handling downloads
- **Queue-based System**: FIFO queue for managing download tasks

### Frontend Architecture
- **Server-side Rendering**: Jinja2 templates for HTML generation
- **Bootstrap 5**: CSS framework for responsive design with dark theme
- **Vanilla JavaScript**: Client-side functionality without heavy frameworks
- **Real-time Updates**: Server-sent events for live progress monitoring

### Data Storage
- **SQLite Database**: Default local database for development
- **PostgreSQL Support**: Configurable via environment variables for production
- **File System Storage**: Downloaded media files stored in local 'downloads' directory

## Key Components

### Core Flask Application (`app.py`)
- Initializes Flask app with SQLAlchemy integration
- Configures database connection with environment variable support
- Sets up application context and creates necessary directories
- Handles session management with configurable secret key

### Data Models (`models.py`)
- **Download Model**: Tracks individual download tasks with status, progress, and metadata
- **Playlist Model**: Manages playlist downloads with aggregate status tracking
- **Enum Types**: DownloadStatus enum for consistent state management

### Download Engine (`downloader.py`)
- **VideoDownloader Class**: Wraps yt-dlp library for media extraction and downloading
- **Information Extraction**: Analyzes URLs to extract video/playlist metadata and available formats
- **Format Selection**: Supports multiple quality options and format preferences

### Queue Management (`queue_manager.py`)
- **DownloadQueue Class**: Thread-safe queue implementation for managing download tasks
- **Worker Thread**: Background processing for sequential download execution
- **Status Tracking**: Real-time monitoring of download progress and errors
- **Pause/Resume**: Support for pausing and resuming downloads

### API Routes (`routes.py`)
- **REST Endpoints**: JSON API for URL analysis, download management, and status monitoring
- **Template Routes**: Server-side rendering for the main application interface
- **Real-time Streaming**: Server-sent events for live progress updates

### Frontend Interface
- **Responsive Design**: Mobile-friendly interface using Bootstrap 5
- **Progressive Enhancement**: Works without JavaScript, enhanced with JS features
- **Real-time Updates**: Live progress bars and status updates
- **Batch Operations**: Support for playlist downloads and bulk management

## Data Flow

1. **URL Submission**: User submits media URL through web interface
2. **Information Extraction**: yt-dlp extracts metadata and available formats
3. **Format Selection**: User selects preferred quality/format options
4. **Queue Addition**: Download task added to processing queue
5. **Background Processing**: Worker thread processes downloads sequentially
6. **Progress Monitoring**: Real-time updates sent to frontend via server-sent events
7. **File Storage**: Completed downloads saved to local filesystem
8. **Status Updates**: Database updated with download progress and completion status

## External Dependencies

### Core Libraries
- **Flask**: Web framework and HTTP handling
- **SQLAlchemy**: Database ORM and migrations
- **yt-dlp**: Media extraction and downloading engine
- **Bootstrap 5**: Frontend CSS framework
- **Font Awesome**: Icon library for UI elements

### Media Platform Support
- YouTube, Instagram, Facebook, Pinterest
- Extensible to any platform supported by yt-dlp
- Automatic platform detection and format optimization

## Deployment Strategy

### Development
- SQLite database for local development
- Flask development server with debug mode
- File-based media storage in 'downloads' directory

### Production Considerations
- Environment variable configuration for database and secrets
- Support for PostgreSQL via DATABASE_URL
- Session management with configurable secret keys
- Logging configuration for monitoring and debugging

### Scalability Features
- Database connection pooling with automatic reconnection
- Thread-safe queue management for concurrent downloads
- Configurable worker threads for parallel processing
- Clean separation of concerns for easy maintenance and testing

The application is designed to be easily deployable on platforms like Replit, Heroku, or similar cloud services with minimal configuration changes.