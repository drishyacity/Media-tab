import threading
import queue
import time
import logging
from models import Download, Playlist, DownloadStatus
from app import db
from downloader import VideoDownloader

class DownloadQueue:
    def __init__(self):
        self.queue = queue.Queue()
        self.active_downloads = {}
        self.paused_downloads = set()
        self.is_running = False
        self.worker_thread = None
        self.downloader = VideoDownloader()
        self.current_download = None
    
    def start_worker(self):
        """Start the worker thread"""
        if not self.is_running:
            self.is_running = True
            self.worker_thread = threading.Thread(target=self._worker, daemon=True)
            self.worker_thread.start()
            logging.info("Download worker started")
    
    def stop_worker(self):
        """Stop the worker thread"""
        self.is_running = False
        if self.worker_thread:
            self.worker_thread.join()
            logging.info("Download worker stopped")
    
    def _worker(self):
        """Worker thread that processes the download queue"""
        while self.is_running:
            try:
                if not self.queue.empty():
                    download = self.queue.get(timeout=1)
                    
                    if download.id not in self.paused_downloads:
                        self.current_download = {
                            'id': download.id,
                            'title': download.title,
                            'url': download.url
                        }
                        
                        try:
                            self.downloader.download_video(download)
                            
                            # Update playlist progress if this is part of a playlist
                            if download.playlist_id:
                                self._update_playlist_progress(download.playlist_id)
                            
                        except Exception as e:
                            logging.error(f"Download failed: {str(e)}")
                        
                        finally:
                            self.current_download = None
                    
                    else:
                        # Re-queue paused download
                        self.queue.put(download)
                
                else:
                    time.sleep(1)
            
            except queue.Empty:
                continue
            except Exception as e:
                logging.error(f"Worker error: {str(e)}")
    
    def add_download(self, download):
        """Add a download to the queue"""
        self.queue.put(download)
        if not self.is_running:
            self.start_worker()
        logging.info(f"Added download: {download.title}")
    
    def pause_download(self, download_id):
        """Pause a specific download"""
        self.paused_downloads.add(download_id)
        logging.info(f"Paused download: {download_id}")
    
    def resume_download(self, download_id):
        """Resume a paused download"""
        if download_id in self.paused_downloads:
            self.paused_downloads.remove(download_id)
            logging.info(f"Resumed download: {download_id}")
    
    def cancel_download(self, download_id):
        """Cancel a download"""
        if download_id in self.paused_downloads:
            self.paused_downloads.remove(download_id)
        # Note: If download is currently active, it will complete but won't be re-queued
        logging.info(f"Cancelled download: {download_id}")
    
    def is_active(self):
        """Check if worker is running"""
        return self.is_running
    
    def queue_size(self):
        """Get current queue size"""
        return self.queue.qsize()
    
    def get_current_download(self):
        """Get currently downloading item"""
        return self.current_download
    
    def _update_playlist_progress(self, playlist_id):
        """Update playlist download progress"""
        try:
            playlist = Playlist.query.get(playlist_id)
            if playlist:
                completed_count = Download.query.filter_by(
                    playlist_id=playlist_id,
                    status=DownloadStatus.COMPLETED
                ).count()
                
                playlist.downloaded_videos = completed_count
                
                if completed_count >= playlist.total_videos:
                    playlist.status = DownloadStatus.COMPLETED
                elif completed_count > 0:
                    playlist.status = DownloadStatus.DOWNLOADING
                
                db.session.commit()
        
        except Exception as e:
            logging.error(f"Error updating playlist progress: {str(e)}")
