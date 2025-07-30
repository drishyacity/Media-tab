import yt_dlp
import os
import logging
from models import Download, DownloadStatus
from app import db
from datetime import datetime

class VideoDownloader:
    def __init__(self):
        self.download_dir = 'downloads'
        os.makedirs(self.download_dir, exist_ok=True)
    
    def extract_info(self, url, extract_flat=False):
        """Extract video/playlist information"""
        ydl_opts = {
            'quiet': True,
            'extract_flat': extract_flat,
            'no_warnings': True,
            'ignoreerrors': True,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            try:
                info = ydl.extract_info(url, download=False)
                
                if info and info.get('_type') == 'playlist':
                    return {
                        'type': 'playlist',
                        'title': info.get('title', 'Unknown Playlist'),
                        'extractor': info.get('extractor', 'unknown'),
                        'entries': info.get('entries', []),
                        'webpage_url': info.get('webpage_url', url)
                    }
                else:
                    formats = []
                    if info and info.get('formats'):
                        seen_formats = set()
                        for fmt in info['formats']:
                            if fmt and (fmt.get('vcodec') != 'none' or fmt.get('acodec') != 'none'):
                                # Create unique identifier for format to avoid duplicates
                                height = fmt.get('height')
                                ext = fmt.get('ext', 'unknown')
                                vcodec = fmt.get('vcodec', 'none')
                                acodec = fmt.get('acodec', 'none')
                                
                                # Enhanced quality detection for YouTube
                                quality_label = fmt.get('format_note', '')
                                if height:
                                    if height >= 2160:
                                        quality_display = f"4K ({height}p)"
                                    elif height >= 1440:
                                        quality_display = f"2K ({height}p)"
                                    elif height >= 1080:
                                        quality_display = f"Full HD ({height}p)"
                                    elif height >= 720:
                                        quality_display = f"HD ({height}p)"
                                    else:
                                        quality_display = f"{height}p"
                                else:
                                    # Enhanced audio quality detection
                                    if acodec != 'none' and vcodec == 'none':
                                        tbr = fmt.get('tbr', 0)
                                        if tbr >= 320:
                                            quality_display = 'High Quality Audio (320+ kbps)'
                                        elif tbr >= 256:
                                            quality_display = 'Premium Audio (256 kbps)'
                                        elif tbr >= 192:
                                            quality_display = 'Standard Audio (192 kbps)'
                                        elif tbr >= 128:
                                            quality_display = 'Good Audio (128 kbps)'
                                        else:
                                            quality_display = 'Audio Only'
                                    else:
                                        quality_display = quality_label or 'Unknown Quality'
                                
                                # Add codec info for better selection
                                if vcodec != 'none' and acodec != 'none':
                                    codec_info = f" ({vcodec}+{acodec})"
                                elif vcodec != 'none':
                                    codec_info = f" (video: {vcodec})"
                                elif acodec != 'none':
                                    codec_info = f" (audio: {acodec})"
                                else:
                                    codec_info = ""
                                
                                format_key = f"{height}_{ext}_{vcodec}_{acodec}"
                                if format_key not in seen_formats:
                                    seen_formats.add(format_key)
                                    formats.append({
                                        'format_id': fmt.get('format_id'),
                                        'ext': ext,
                                        'quality': quality_display + codec_info,
                                        'quality_sort': height or 0,
                                        'filesize': fmt.get('filesize'),
                                        'vcodec': vcodec,
                                        'acodec': acodec,
                                        'height': height,
                                        'width': fmt.get('width'),
                                        'fps': fmt.get('fps'),
                                        'tbr': fmt.get('tbr'),
                                        'is_audio_only': vcodec == 'none' and acodec != 'none'
                                    })
                        
                        # Sort formats by quality (highest first) and group by type
                        formats.sort(key=lambda x: (x.get('is_audio_only', False), -x.get('quality_sort', 0)))
                    
                    return {
                        'type': 'video',
                        'title': info.get('title', 'Unknown Video') if info else 'Unknown Video',
                        'extractor': info.get('extractor', 'unknown') if info else 'unknown',
                        'duration': info.get('duration') if info else None,
                        'view_count': info.get('view_count') if info else None,
                        'upload_date': info.get('upload_date') if info else None,
                        'uploader': info.get('uploader') if info else None,
                        'description': info.get('description') if info else None,
                        'thumbnail': info.get('thumbnail') if info else None,
                        'formats': formats,
                        'webpage_url': info.get('webpage_url', url) if info else url
                    }
            
            except Exception as e:
                logging.error(f"Error extracting info for {url}: {str(e)}")
                raise e
    
    def download_video(self, download_obj):
        """Download a single video"""
        try:
            download_obj.status = DownloadStatus.DOWNLOADING
            download_obj.started_at = datetime.utcnow()
            db.session.commit()
            
            def progress_hook(d):
                if d['status'] == 'downloading':
                    download_obj.downloaded_bytes = d.get('downloaded_bytes', 0)
                    download_obj.file_size = d.get('total_bytes', d.get('total_bytes_estimate', 0))
                    download_obj.download_speed = d.get('speed', 0)
                    download_obj.eta = d.get('eta', 0)
                    db.session.commit()
                
                elif d['status'] == 'finished':
                    download_obj.filename = os.path.basename(d['filename'])
                    download_obj.status = DownloadStatus.COMPLETED
                    download_obj.completed_at = datetime.utcnow()
                    download_obj.downloaded_bytes = download_obj.file_size
                    db.session.commit()
            
            # Enhanced format selection for better YouTube quality
            if download_obj.format_id == 'best':
                # For YouTube, prefer highest quality video + audio combination
                format_selector = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best[ext=mp4]/best'
            elif download_obj.format_id == '4k':
                format_selector = 'bestvideo[height>=2160]+bestaudio/best[height>=2160]'
            elif download_obj.format_id == '1080p':
                format_selector = 'bestvideo[height<=1080]+bestaudio/best[height<=1080]'
            elif download_obj.format_id == '720p':
                format_selector = 'bestvideo[height<=720]+bestaudio/best[height<=720]'
            elif download_obj.format_id == '480p':
                format_selector = 'bestvideo[height<=480]+bestaudio/best[height<=480]'
            elif download_obj.format_id in ['audio', 'mp3', 'mp3_320', 'mp3_256', 'mp3_192', 'mp3_128']:
                format_selector = 'bestaudio[ext=m4a]/bestaudio/best[height=0]'
            else:
                format_selector = download_obj.format_id

            # Base options
            ydl_opts = {
                'outtmpl': os.path.join(self.download_dir, '%(uploader)s - %(title)s.%(ext)s'),
                'format': format_selector,
                'progress_hooks': [progress_hook],
                'no_warnings': True,
                'ignoreerrors': False,
                'extract_flat': False,
            }
            
            # Audio-specific options
            if download_obj.format_id in ['audio', 'mp3', 'mp3_320', 'mp3_256', 'mp3_192', 'mp3_128']:
                # Determine quality based on format_id
                if download_obj.format_id == 'mp3_320':
                    quality = '320'
                elif download_obj.format_id == 'mp3_256':
                    quality = '256'
                elif download_obj.format_id == 'mp3_192':
                    quality = '192'
                elif download_obj.format_id == 'mp3_128':
                    quality = '128'
                else:
                    quality = '192'  # Default quality
                
                ydl_opts.update({
                    'format': 'bestaudio/best',
                    'postprocessors': [{
                        'key': 'FFmpegExtractAudio',
                        'preferredcodec': 'mp3',
                        'preferredquality': quality,
                    }],
                    'outtmpl': os.path.join(self.download_dir, '%(uploader)s - %(title)s.%(ext)s'),
                })
            else:
                # Video options
                ydl_opts.update({
                    'writesubtitles': True,
                    'writeautomaticsub': True,
                    'subtitleslangs': ['en', 'es', 'fr', 'de'],
                    'merge_output_format': 'mp4',
                })
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([download_obj.url])
            
        except Exception as e:
            logging.error(f"Error downloading {download_obj.url}: {str(e)}")
            download_obj.status = DownloadStatus.FAILED
            download_obj.error_message = str(e)
            db.session.commit()
            raise e
