from app import db
from datetime import datetime
from enum import Enum

class DownloadStatus(Enum):
    PENDING = "pending"
    DOWNLOADING = "downloading"
    COMPLETED = "completed"
    FAILED = "failed"
    PAUSED = "paused"

class Download(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    url = db.Column(db.Text, nullable=False)
    title = db.Column(db.String(500))
    platform = db.Column(db.String(50))
    format_id = db.Column(db.String(100))
    quality = db.Column(db.String(50))
    file_size = db.Column(db.BigInteger)
    downloaded_bytes = db.Column(db.BigInteger, default=0)
    status = db.Column(db.Enum(DownloadStatus), default=DownloadStatus.PENDING)
    error_message = db.Column(db.Text)
    filename = db.Column(db.String(500))
    download_speed = db.Column(db.Float)
    eta = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    started_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    playlist_id = db.Column(db.String(100))
    playlist_index = db.Column(db.Integer)

class Playlist(db.Model):
    id = db.Column(db.String(100), primary_key=True)
    title = db.Column(db.String(500))
    url = db.Column(db.Text, nullable=False)
    platform = db.Column(db.String(50))
    total_videos = db.Column(db.Integer)
    downloaded_videos = db.Column(db.Integer, default=0)
    status = db.Column(db.Enum(DownloadStatus), default=DownloadStatus.PENDING)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
