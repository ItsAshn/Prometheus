# Video Streaming Setup - HLS Implementation

This implementation adds HLS (HTTP Live Streaming) video functionality to your Qwik application.

## Features

### For Admins

- **Video Upload**: Upload videos through the admin interface
- **Automatic HLS Conversion**: Videos are automatically converted to HLS format using FFmpeg
- **Video Management**: View, manage, and delete uploaded videos
- **Background Processing**: Video conversion happens in the background

### For Users

- **HLS Video Player**: Watch videos with adaptive streaming
- **Cross-Browser Support**: Uses HLS.js for browsers that don't natively support HLS
- **Responsive Design**: Video player adapts to different screen sizes

## Setup Instructions

### 1. Dependencies

The following packages have been added:

- `ffmpeg-static`: For video processing
- `fluent-ffmpeg`: FFmpeg wrapper for Node.js
- `formidable`: For handling file uploads
- HLS.js (loaded via CDN): For browser HLS support

### 2. Directory Structure

```
src/
├── components/video/
│   ├── video-player.tsx       # HLS video player component
│   ├── video-upload.tsx       # Admin video upload form
│   └── video-list.tsx         # Video library listing
├── lib/video/
│   └── video-processor.ts     # Video processing service
└── routes/
    ├── videos/                # Public video library
    ├── admin/videos/          # Admin video management
    └── api/video/
        ├── upload/            # Video upload endpoint
        ├── list/              # List videos endpoint
        └── delete/            # Delete video endpoint
```

### 3. File Storage

- **Temporary uploads**: `temp/` directory (gitignored)
- **Processed videos**: `public/videos/hls/` directory (gitignored)
- **Metadata**: `public/videos/metadata.json`

### 4. Usage

#### Admin Access

1. Go to `/admin` and log in with your admin credentials
2. Click "Manage Videos" to access the video management interface
3. Upload videos using the upload form
4. Videos will be processed in the background and converted to HLS format

#### User Access

1. Visit `/videos` to see the public video library
2. Click on any video to start streaming
3. Videos will play with adaptive quality based on connection speed

### 5. Supported Video Formats

- MP4
- AVI
- MOV
- MKV
- WebM

**File Size Limit**: 5GB per upload

### 6. Technical Details

#### HLS Conversion

Videos are processed using FFmpeg with these settings:

- **Video Codec**: H.264 (libx264)
- **Audio Codec**: AAC
- **Segment Duration**: 10 seconds
- **Quality**: CRF 23 (high quality)
- **Preset**: Fast (good balance of speed and compression)

#### Browser Compatibility

- **Safari/iOS**: Native HLS support
- **Chrome/Firefox/Edge**: HLS.js library for compatibility
- **Mobile devices**: Full support on iOS and Android

### 7. Environment Variables

No additional environment variables are required. The system uses existing admin authentication.

### 8. Production Considerations

#### Storage

- Consider using external storage (AWS S3, etc.) for production
- Implement CDN for better video delivery performance
- Set up automatic cleanup of old temporary files

#### Performance

- Monitor disk space for video storage
- Consider implementing video transcoding queues for high-volume usage
- Add video thumbnail generation for better UX

#### Security

- Video uploads are restricted to authenticated admins only
- File type validation prevents malicious uploads
- Consider adding virus scanning for uploaded files

### 9. API Endpoints

#### `POST /api/video/upload`

Upload a new video (Admin only)

- **Body**: FormData with `video` file and `title` string
- **Response**: Upload confirmation with video ID

#### `GET /api/video/list`

Get list of all videos (Public)

- **Response**: Array of video metadata

#### `POST /api/video/delete`

Delete a video (Admin only)

- **Body**: `{ videoId: string }`
- **Response**: Deletion confirmation

### 10. Troubleshooting

#### FFmpeg Issues

- Ensure FFmpeg static binary is properly installed
- Check console logs for FFmpeg processing errors
- Verify sufficient disk space for video processing

#### Upload Failures

- Check file size limits (5GB default)
- Verify supported file formats
- Ensure temp directory has write permissions

#### Playback Issues

- Verify HLS.js is loading correctly
- Check browser console for HLS errors
- Ensure video files are accessible via HTTP

### 11. Future Enhancements

- Add video thumbnails
- Implement multiple quality levels
- Add video metadata editing
- Support for live streaming
- Video analytics and view tracking
- Subtitle support
- Video chapters and bookmarks
