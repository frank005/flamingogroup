# Cat Cloud Proxy

A modern web-based video conferencing application built with Agora RTC SDK, featuring cloud proxy capabilities, virtual backgrounds, and real-time performance monitoring.

## Features

- 🎥 High-quality video conferencing
- 🎤 Audio and video controls
- 🌐 Cloud proxy support (UDP/TCP)
- 🌍 Geo-fencing capabilities
- 🎨 Virtual background support
- 🎯 AI Noise Suppression (AINS)
- 📊 Real-time performance monitoring
- 📈 Network quality and FPS charts
- 🔄 Dual stream support
- 📱 Responsive design

## Prerequisites

- Modern web browser with WebRTC support
- Agora account and App ID
- Microphone and camera (optional)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/catProxy.git
cd catProxy
```

2. Open `index.html` in your web browser or serve it using a local web server.

## Configuration

1. Get your Agora App ID from the [Agora Console](https://console.agora.io/)
2. Enter your App ID in the application
3. (Optional) Enter a token if you have enabled token authentication
4. Enter a channel name to join
5. (Optional) Enter a user ID

## Usage

1. **Join a Channel**
   - Enter your App ID and channel name
   - Click "Join Channel"

2. **Device Selection**
   - Select your preferred microphone and camera
   - Choose video quality profile

3. **Cloud Proxy Settings**
   - Enable/disable cloud proxy
   - Select proxy mode (UDP/TCP)
   - Choose geo-fencing region

4. **Additional Features**
   - Toggle microphone/camera
   - Enable/disable virtual background
   - Toggle AI noise suppression
   - Enable/disable dual stream
   - Switch between streams

5. **Monitoring**
   - View real-time network quality
   - Monitor FPS and bitrate
   - Track connection statistics

## Technical Details

### Video Profiles
- 360p (640x360)
- 480p (848x480)
- 720p (1280x720)
- 1080p (1920x1080)

### Supported Regions
- Global
- Africa
- Asia
- China
- Europe
- Hong Kong & Macau
- India
- Japan
- Korea
- North America
- Oceania
- South America
- United States

### Dependencies
- AgoraRTC SDK
- Google Charts
- Agora Virtual Background Extension
- Agora AI Denoiser Extension

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Agora.io](https://www.agora.io/) for providing the RTC SDK
- Google Charts for visualization capabilities 
