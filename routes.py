from flask import render_template, request, jsonify, session, Response
from app import app, db
from models import Download, Playlist, DownloadStatus
from downloader import VideoDownloader
from queue_manager import DownloadQueue
import json
import uuid
import logging

# Initialize the download queue
download_queue = DownloadQueue()
video_downloader = VideoDownloader()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/extract_info', methods=['POST'])
def extract_info():
    """Extract video/playlist information without downloading"""
    try:
        data = request.get_json()
        url = data.get('url')
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        
        info = video_downloader.extract_info(url)
        return jsonify(info)
    
    except Exception as e:
        logging.error(f"Error extracting info: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/add_download', methods=['POST'])
def add_download():
    """Add a new download to the queue"""
    try:
        data = request.get_json()
        url = data.get('url')
        format_id = data.get('format_id', 'best')
        quality = data.get('quality', 'best')
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        
        # Extract basic info first
        info = video_downloader.extract_info(url, extract_flat=True)
        
        if info.get('_type') == 'playlist':
            # Handle playlist
            playlist_id = str(uuid.uuid4())
            playlist = Playlist(
                id=playlist_id,
                title=info.get('title', 'Unknown Playlist'),
                url=url,
                platform=info.get('extractor', 'unknown'),
                total_videos=len(info.get('entries', []))
            )
            db.session.add(playlist)
            
            # Add individual videos to download queue
            for idx, entry in enumerate(info.get('entries', [])):
                if entry:
                    download = Download(
                        url=entry.get('url', entry.get('webpage_url')),
                        title=entry.get('title', f'Video {idx + 1}'),
                        platform=info.get('extractor', 'unknown'),
                        format_id=format_id,
                        quality=quality,
                        playlist_id=playlist_id,
                        playlist_index=idx + 1
                    )
                    db.session.add(download)
                    download_queue.add_download(download)
            
            db.session.commit()
            return jsonify({'message': f'Added {len(info.get("entries", []))} videos to download queue', 'playlist_id': playlist_id})
        
        else:
            # Handle single video
            download = Download(
                url=url,
                title=info.get('title', 'Unknown Video'),
                platform=info.get('extractor', 'unknown'),
                format_id=format_id,
                quality=quality
            )
            db.session.add(download)
            db.session.commit()
            
            download_queue.add_download(download)
            return jsonify({'message': 'Video added to download queue', 'download_id': download.id})
    
    except Exception as e:
        logging.error(f"Error adding download: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/downloads')
def get_downloads():
    """Get all downloads with their status"""
    downloads = Download.query.order_by(Download.created_at.desc()).all()
    playlists = Playlist.query.order_by(Playlist.created_at.desc()).all()
    
    download_data = []
    for download in downloads:
        download_data.append({
            'id': download.id,
            'url': download.url,
            'title': download.title,
            'platform': download.platform,
            'quality': download.quality,
            'file_size': download.file_size,
            'downloaded_bytes': download.downloaded_bytes,
            'status': download.status.value,
            'error_message': download.error_message,
            'filename': download.filename,
            'download_speed': download.download_speed,
            'eta': download.eta,
            'playlist_id': download.playlist_id,
            'playlist_index': download.playlist_index,
            'progress': (download.downloaded_bytes / download.file_size * 100) if download.file_size else 0
        })
    
    playlist_data = []
    for playlist in playlists:
        playlist_data.append({
            'id': playlist.id,
            'title': playlist.title,
            'url': playlist.url,
            'platform': playlist.platform,
            'total_videos': playlist.total_videos,
            'downloaded_videos': playlist.downloaded_videos,
            'status': playlist.status.value,
            'progress': (playlist.downloaded_videos / playlist.total_videos * 100) if playlist.total_videos else 0
        })
    
    return jsonify({
        'downloads': download_data,
        'playlists': playlist_data,
        'queue_status': {
            'active': download_queue.is_active(),
            'queue_size': download_queue.queue_size(),
            'current_download': download_queue.get_current_download()
        }
    })

@app.route('/api/download/<int:download_id>/pause', methods=['POST'])
def pause_download(download_id):
    """Pause a specific download"""
    try:
        download = Download.query.get_or_404(download_id)
        download_queue.pause_download(download_id)
        download.status = DownloadStatus.PAUSED
        db.session.commit()
        return jsonify({'message': 'Download paused'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/download/<int:download_id>/resume', methods=['POST'])
def resume_download(download_id):
    """Resume a paused download"""
    try:
        download = Download.query.get_or_404(download_id)
        download_queue.resume_download(download_id)
        download.status = DownloadStatus.PENDING
        db.session.commit()
        return jsonify({'message': 'Download resumed'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/download/<int:download_id>/cancel', methods=['DELETE'])
def cancel_download(download_id):
    """Cancel and remove a download"""
    try:
        download = Download.query.get_or_404(download_id)
        download_queue.cancel_download(download_id)
        db.session.delete(download)
        db.session.commit()
        return jsonify({'message': 'Download cancelled'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/clear_completed', methods=['POST'])
def clear_completed():
    """Clear all completed downloads from the list"""
    try:
        Download.query.filter_by(status=DownloadStatus.COMPLETED).delete()
        db.session.commit()
        return jsonify({'message': 'Completed downloads cleared'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/progress_stream')
def progress_stream():
    """Simple progress endpoint for polling"""
    try:
        current_download = download_queue.get_current_download()
        if current_download:
            download = Download.query.get(current_download['id'])
            if download:
                data = {
                    'id': download.id,
                    'progress': (download.downloaded_bytes / download.file_size * 100) if download.file_size else 0,
                    'downloaded_bytes': download.downloaded_bytes,
                    'file_size': download.file_size,
                    'download_speed': download.download_speed,
                    'eta': download.eta,
                    'status': download.status.value
                }
                return jsonify(data)
        return jsonify({'heartbeat': True})
    except Exception as e:
        logging.error(f"Progress endpoint error: {str(e)}")
        return jsonify({'error': str(e)}), 500
