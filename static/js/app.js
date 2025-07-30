class MediaDownloader {
    constructor() {
        this.currentInfo = null;
        this.eventSource = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDownloads();
        this.startProgressStream();
        
        // Refresh downloads every 30 seconds
        setInterval(() => this.loadDownloads(), 30000);
    }

    setupEventListeners() {
        // URL form submission
        document.getElementById('urlForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.analyzeUrl();
        });

        // Refresh downloads
        document.getElementById('refreshDownloads').addEventListener('click', () => {
            this.loadDownloads();
        });

        // Clear completed downloads
        document.getElementById('clearCompleted').addEventListener('click', () => {
            this.clearCompleted();
        });
    }

    async analyzeUrl() {
        const url = document.getElementById('urlInput').value.trim();
        if (!url) return;

        this.showLoading();
        
        try {
            const response = await fetch('/api/extract_info', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.currentInfo = data;
                this.displayVideoInfo(data);
                this.hideLoading();
            } else {
                throw new Error(data.error || 'Failed to analyze URL');
            }
        } catch (error) {
            this.hideLoading();
            this.showError(error.message);
        }
    }

    displayVideoInfo(info) {
        const videoInfoSection = document.getElementById('videoInfoSection');
        const videoInfo = document.getElementById('videoInfo');

        if (info.type === 'playlist') {
            videoInfo.innerHTML = `
                <div class="row">
                    <div class="col-md-8">
                        <h5><i class="fas fa-list me-2"></i>${info.title}</h5>
                        <p class="text-muted mb-2">
                            <i class="fas fa-play-circle me-2"></i>${info.entries.length} videos
                            <span class="ms-3"><i class="fas fa-globe me-2"></i>${info.extractor}</span>
                        </p>
                        <div class="mb-3">
                            <label class="form-label">Quality:</label>
                            <select class="form-select" id="playlistQuality">
                                <option value="best">Best Quality (4K/8K if available)</option>
                                <option value="4k">4K (2160p)</option>
                                <option value="1080p">Full HD (1080p)</option>
                                <option value="720p">HD (720p)</option>
                                <option value="480p">Standard (480p)</option>
                                <option value="360p">Low (360p)</option>
                                <option value="mp3_320">🎵 MP3 High Quality (320 kbps)</option>
                                <option value="mp3_256">🎵 MP3 Premium (256 kbps)</option>
                                <option value="mp3_192">🎵 MP3 Standard (192 kbps)</option>
                                <option value="mp3_128">🎵 MP3 Good (128 kbps)</option>
                                <option value="audio">🎵 Best Audio Quality</option>
                            </select>
                        </div>
                    </div>
                    <div class="col-md-4 text-end">
                        <button class="btn btn-success btn-lg" onclick="mediaDownloader.addPlaylistDownload()">
                            <i class="fas fa-download me-2"></i>Download Playlist
                        </button>
                    </div>
                </div>
            `;
        } else {
            let formatsHtml = '';
            if (info.formats && info.formats.length > 0) {
                formatsHtml = `
                    <div class="mb-3">
                        <label class="form-label">Select Quality:</label>
                        <select class="form-select" id="videoFormat">
                            <option value="best">Best Quality (4K/8K if available)</option>
                            <option value="4k">4K (2160p)</option>
                            <option value="1080p">Full HD (1080p)</option>
                            <option value="720p">HD (720p)</option>
                            <option value="480p">Standard (480p)</option>
                            <option value="360p">Low (360p)</option>
                            <option value="mp3_320">🎵 MP3 High Quality (320 kbps)</option>
                            <option value="mp3_256">🎵 MP3 Premium (256 kbps)</option>
                            <option value="mp3_192">🎵 MP3 Standard (192 kbps)</option>
                            <option value="mp3_128">🎵 MP3 Good (128 kbps)</option>
                            <option value="audio">🎵 Best Audio Quality</option>
                `;
                
                info.formats.forEach(format => {
                    const sizeText = format.filesize ? ` (${this.formatFileSize(format.filesize)})` : '';
                    const qualityText = format.height ? `${format.height}p` : format.quality;
                    formatsHtml += `
                        <option value="${format.format_id}">
                            ${qualityText} - ${format.ext}${sizeText}
                        </option>
                    `;
                });
                
                formatsHtml += `
                        </select>
                    </div>
                `;
            }

            videoInfo.innerHTML = `
                <div class="row">
                    <div class="col-md-8">
                        <h5><i class="fas fa-play me-2"></i>${info.title}</h5>
                        <p class="text-muted mb-2">
                            <span><i class="fas fa-globe me-2"></i>${info.extractor}</span>
                            ${info.duration ? `<span class="ms-3"><i class="fas fa-clock me-2"></i>${this.formatDuration(info.duration)}</span>` : ''}
                            ${info.view_count ? `<span class="ms-3"><i class="fas fa-eye me-2"></i>${info.view_count.toLocaleString()} views</span>` : ''}
                        </p>
                        ${info.uploader ? `<p class="text-muted"><i class="fas fa-user me-2"></i>${info.uploader}</p>` : ''}
                        ${formatsHtml}
                    </div>
                    <div class="col-md-4 text-end">
                        <button class="btn btn-success btn-lg" onclick="mediaDownloader.addVideoDownload()">
                            <i class="fas fa-download me-2"></i>Download Video
                        </button>
                    </div>
                </div>
            `;
        }

        videoInfoSection.style.display = 'block';
    }

    async addVideoDownload() {
        if (!this.currentInfo) return;

        const formatSelect = document.getElementById('videoFormat');
        const formatId = formatSelect ? formatSelect.value : 'best';

        try {
            const response = await fetch('/api/add_download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: document.getElementById('urlInput').value,
                    format_id: formatId,
                    quality: formatSelect ? formatSelect.options[formatSelect.selectedIndex].text : 'best'
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.showSuccess(data.message);
                this.loadDownloads();
                this.clearForm();
            } else {
                throw new Error(data.error || 'Failed to add download');
            }
        } catch (error) {
            this.showError(error.message);
        }
    }

    async addPlaylistDownload() {
        if (!this.currentInfo) return;

        const qualitySelect = document.getElementById('playlistQuality');
        const quality = qualitySelect ? qualitySelect.value : 'best';

        try {
            const response = await fetch('/api/add_download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: document.getElementById('urlInput').value,
                    format_id: quality,
                    quality: quality
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.showSuccess(data.message);
                this.loadDownloads();
                this.clearForm();
            } else {
                throw new Error(data.error || 'Failed to add playlist');
            }
        } catch (error) {
            this.showError(error.message);
        }
    }

    async loadDownloads() {
        try {
            const response = await fetch('/api/downloads');
            const data = await response.json();
            
            this.updateQueueStatus(data.queue_status, data.downloads);
            this.displayDownloads(data.downloads);
            this.displayPlaylists(data.playlists);
            this.updateCurrentDownload(data.queue_status.current_download);
        } catch (error) {
            console.error('Failed to load downloads:', error);
        }
    }

    updateQueueStatus(queueStatus, downloads) {
        const queueSize = queueStatus.queue_size || 0;
        const activeCount = downloads.filter(d => d.status === 'downloading').length;
        const completedCount = downloads.filter(d => d.status === 'completed').length;

        document.getElementById('queueSize').textContent = queueSize;
        document.getElementById('activeDownloads').textContent = activeCount;
        document.getElementById('completedDownloads').textContent = completedCount;
    }

    updateCurrentDownload(currentDownload) {
        const currentDownloadDiv = document.getElementById('currentDownload');
        
        if (currentDownload) {
            document.getElementById('currentTitle').textContent = currentDownload.title;
            document.getElementById('currentUrl').textContent = currentDownload.url;
            currentDownloadDiv.style.display = 'block';
        } else {
            currentDownloadDiv.style.display = 'none';
        }
    }

    displayDownloads(downloads) {
        const downloadsList = document.getElementById('downloadsList');
        
        if (downloads.length === 0) {
            downloadsList.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-inbox fa-3x mb-3"></i>
                    <h5>No downloads yet</h5>
                    <p>Add a URL above to start downloading!</p>
                </div>
            `;
            return;
        }

        let html = '';
        downloads.forEach(download => {
            const statusIcon = this.getStatusIcon(download.status);
            const statusClass = this.getStatusClass(download.status);
            const progressWidth = Math.round(download.progress || 0);

            html += `
                <div class="card mb-2">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div class="flex-grow-1">
                                <h6 class="card-title mb-1">${download.title}</h6>
                                <small class="text-muted">${download.platform} • ${download.quality}</small>
                                ${download.playlist_id ? `<small class="text-muted ms-2">(Playlist item ${download.playlist_index})</small>` : ''}
                            </div>
                            <div class="d-flex align-items-center">
                                <span class="badge ${statusClass} me-2">
                                    ${statusIcon} ${download.status.toUpperCase()}
                                </span>
                                <div class="btn-group btn-group-sm">
                                    ${this.getDownloadActions(download)}
                                </div>
                            </div>
                        </div>
                        
                        ${download.status === 'downloading' || download.status === 'completed' ? `
                            <div class="progress mb-2" style="height: 6px;">
                                <div class="progress-bar ${download.status === 'completed' ? 'bg-success' : ''}" 
                                     style="width: ${progressWidth}%"></div>
                            </div>
                            <div class="row text-small">
                                <div class="col-4">
                                    <i class="fas fa-tachometer-alt me-1"></i>
                                    ${download.download_speed ? this.formatSpeed(download.download_speed) : 'N/A'}
                                </div>
                                <div class="col-4">
                                    <i class="fas fa-clock me-1"></i>
                                    ${download.eta ? this.formatTime(download.eta) : 'N/A'}
                                </div>
                                <div class="col-4">
                                    <i class="fas fa-hdd me-1"></i>
                                    ${download.file_size ? this.formatFileSize(download.file_size) : 'Unknown'}
                                </div>
                            </div>
                        ` : ''}
                        
                        ${download.error_message ? `
                            <div class="alert alert-danger mt-2 mb-0">
                                <small><i class="fas fa-exclamation-triangle me-1"></i>${download.error_message}</small>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        });

        downloadsList.innerHTML = html;
    }

    displayPlaylists(playlists) {
        const playlistsList = document.getElementById('playlistsList');
        
        if (playlists.length === 0) {
            playlistsList.innerHTML = '';
            return;
        }

        let html = '<h6 class="mt-4 mb-3"><i class="fas fa-list me-2"></i>Playlists</h6>';
        
        playlists.forEach(playlist => {
            const progressWidth = Math.round(playlist.progress || 0);
            const statusClass = this.getStatusClass(playlist.status);

            html += `
                <div class="card mb-2 border-info">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div>
                                <h6 class="card-title mb-1">
                                    <i class="fas fa-list me-2"></i>${playlist.title}
                                </h6>
                                <small class="text-muted">${playlist.platform} • ${playlist.downloaded_videos}/${playlist.total_videos} videos</small>
                            </div>
                            <span class="badge ${statusClass}">
                                ${playlist.status.toUpperCase()}
                            </span>
                        </div>
                        
                        <div class="progress mb-2" style="height: 8px;">
                            <div class="progress-bar ${playlist.status === 'completed' ? 'bg-success' : 'bg-info'}" 
                                 style="width: ${progressWidth}%"></div>
                        </div>
                        
                        <small class="text-muted">
                            Progress: ${progressWidth}% (${playlist.downloaded_videos} of ${playlist.total_videos} videos completed)
                        </small>
                    </div>
                </div>
            `;
        });

        playlistsList.innerHTML = html;
    }

    getDownloadActions(download) {
        switch (download.status) {
            case 'pending':
            case 'downloading':
                return `
                    <button class="btn btn-outline-warning btn-sm" onclick="mediaDownloader.pauseDownload(${download.id})">
                        <i class="fas fa-pause"></i>
                    </button>
                    <button class="btn btn-outline-danger btn-sm" onclick="mediaDownloader.cancelDownload(${download.id})">
                        <i class="fas fa-times"></i>
                    </button>
                `;
            case 'paused':
                return `
                    <button class="btn btn-outline-success btn-sm" onclick="mediaDownloader.resumeDownload(${download.id})">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="btn btn-outline-danger btn-sm" onclick="mediaDownloader.cancelDownload(${download.id})">
                        <i class="fas fa-times"></i>
                    </button>
                `;
            case 'failed':
                return `
                    <button class="btn btn-outline-success btn-sm" onclick="mediaDownloader.resumeDownload(${download.id})">
                        <i class="fas fa-redo"></i>
                    </button>
                    <button class="btn btn-outline-danger btn-sm" onclick="mediaDownloader.cancelDownload(${download.id})">
                        <i class="fas fa-times"></i>
                    </button>
                `;
            default:
                return `
                    <button class="btn btn-outline-danger btn-sm" onclick="mediaDownloader.cancelDownload(${download.id})">
                        <i class="fas fa-times"></i>
                    </button>
                `;
        }
    }

    async pauseDownload(downloadId) {
        try {
            const response = await fetch(`/api/download/${downloadId}/pause`, { method: 'POST' });
            if (response.ok) {
                this.loadDownloads();
            }
        } catch (error) {
            this.showError('Failed to pause download');
        }
    }

    async resumeDownload(downloadId) {
        try {
            const response = await fetch(`/api/download/${downloadId}/resume`, { method: 'POST' });
            if (response.ok) {
                this.loadDownloads();
            }
        } catch (error) {
            this.showError('Failed to resume download');
        }
    }

    async cancelDownload(downloadId) {
        if (!confirm('Are you sure you want to cancel this download?')) return;
        
        try {
            const response = await fetch(`/api/download/${downloadId}/cancel`, { method: 'DELETE' });
            if (response.ok) {
                this.loadDownloads();
            }
        } catch (error) {
            this.showError('Failed to cancel download');
        }
    }

    async clearCompleted() {
        if (!confirm('Are you sure you want to clear all completed downloads?')) return;
        
        try {
            const response = await fetch('/api/clear_completed', { method: 'POST' });
            if (response.ok) {
                this.loadDownloads();
                this.showSuccess('Completed downloads cleared');
            }
        } catch (error) {
            this.showError('Failed to clear completed downloads');
        }
    }

    startProgressStream() {
        // Use polling instead of server-sent events to avoid timeout issues
        this.progressInterval = setInterval(async () => {
            try {
                const response = await fetch('/api/progress_stream');
                if (response.ok) {
                    const data = await response.json();
                    if (!data.heartbeat && !data.error) {
                        this.updateDownloadProgress(data);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch progress:', error);
            }
        }, 3000); // Poll every 3 seconds
    }

    updateDownloadProgress(data) {
        // Update current download progress
        if (data.id) {
            const progressElement = document.getElementById('currentProgress');
            const progressBarElement = document.getElementById('currentProgressBar');
            const speedElement = document.getElementById('currentSpeed');
            const etaElement = document.getElementById('currentEta');
            const sizeElement = document.getElementById('currentSize');

            if (progressElement) progressElement.textContent = `${Math.round(data.progress || 0)}%`;
            if (progressBarElement) progressBarElement.style.width = `${Math.round(data.progress || 0)}%`;
            if (speedElement) speedElement.textContent = this.formatSpeed(data.download_speed);
            if (etaElement) etaElement.textContent = this.formatTime(data.eta);
            if (sizeElement) sizeElement.textContent = this.formatFileSize(data.file_size);
        }
    }

    // Utility functions
    getStatusIcon(status) {
        const icons = {
            'pending': '<i class="fas fa-clock"></i>',
            'downloading': '<i class="fas fa-download"></i>',
            'completed': '<i class="fas fa-check"></i>',
            'failed': '<i class="fas fa-exclamation-triangle"></i>',
            'paused': '<i class="fas fa-pause"></i>'
        };
        return icons[status] || '<i class="fas fa-question"></i>';
    }

    getStatusClass(status) {
        const classes = {
            'pending': 'bg-secondary',
            'downloading': 'bg-primary',
            'completed': 'bg-success',
            'failed': 'bg-danger',
            'paused': 'bg-warning'
        };
        return classes[status] || 'bg-secondary';
    }

    formatFileSize(bytes) {
        if (!bytes) return 'Unknown';
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Bytes';
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    formatSpeed(speed) {
        if (!speed) return '0 KB/s';
        return this.formatFileSize(speed) + '/s';
    }

    formatTime(seconds) {
        if (!seconds) return '--:--';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    formatDuration(seconds) {
        if (!seconds) return 'Unknown';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    clearForm() {
        document.getElementById('urlInput').value = '';
        document.getElementById('videoInfoSection').style.display = 'none';
        this.currentInfo = null;
    }

    showLoading() {
        const modal = new bootstrap.Modal(document.getElementById('loadingModal'));
        modal.show();
    }

    hideLoading() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('loadingModal'));
        if (modal) modal.hide();
    }

    showError(message) {
        const alert = document.getElementById('errorAlert');
        const messageElement = document.getElementById('errorMessage');
        messageElement.textContent = message;
        alert.style.display = 'block';
        alert.classList.add('show');
        
        setTimeout(() => {
            alert.classList.remove('show');
            setTimeout(() => alert.style.display = 'none', 150);
        }, 5000);
    }

    showSuccess(message) {
        const alert = document.getElementById('successAlert');
        const messageElement = document.getElementById('successMessage');
        messageElement.textContent = message;
        alert.style.display = 'block';
        alert.classList.add('show');
        
        setTimeout(() => {
            alert.classList.remove('show');
            setTimeout(() => alert.style.display = 'none', 150);
        }, 3000);
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.mediaDownloader = new MediaDownloader();
});
