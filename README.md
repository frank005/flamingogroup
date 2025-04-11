# Flamingo Group Demo

A feature-rich video conferencing application built with the Agora SDK, demonstrating advanced capabilities including SVC (Scalable Video Coding), cloud proxy support, and real-time statistics.

## Features

### Core Functionality
- Real-time video and audio communication
- Support for multiple participants
- Adaptive video layout (local + first remote in top row, pairs below)
- Mute/unmute controls for audio and video
- Device selection for camera and microphone
- Real-time network and performance statistics

### Advanced Features
- SVC (VP9 Scalable Video Coding) support
  - Configurable spatial and temporal layers
  - Per-user SVC controls
  - Global SVC settings
- Dual Stream Mode
  - Toggle between high and low quality streams
  - Automatic stream switching based on network conditions
- Virtual Background
  - Color backgrounds
  - Image backgrounds
  - Video backgrounds
  - Blur effect with adjustable strength
- AI Noise Suppression (AINS)
- Cloud Proxy Support
  - UDP mode
  - TCP mode with TLS encryption
- Geographic Region Selection
- Comprehensive Statistics Display
  - Network quality metrics
  - Video/Audio performance stats
  - FPS and resolution monitoring
  - Virtual background performance metrics

### Developer Tools
- Real-time performance graphs
- Detailed connection state monitoring
- Network quality indicators
- Packet loss and latency tracking

## Setup

1. Clone the repository
2. Open `index.html` in a web browser
3. Enter your Agora App ID
4. (Optional) Enter a channel token if authentication is enabled
5. Enter a channel name
6. Click "Join" to start a session

## Usage

### Basic Controls
- Use the "Join" and "Leave" buttons to manage your session
- Toggle your camera and microphone using the respective buttons
- Select different cameras or microphones from the device dropdowns

### SVC Controls
- Press 'S' key or click the game controller icon to access SVC settings
- Enable SVC before joining the call
- Adjust spatial (S) and temporal (T) layers globally or per user
- Values range from 0-3 for both layer types

### Virtual Background
1. Click "Enable Virtual Background"
2. Choose from:
   - Solid colors
   - Custom images
   - Video backgrounds
   - Blur effects
3. Adjust settings as needed

### Cloud Proxy
1. Select proxy mode from dropdown (UDP/TCP)
2. Choose geographic region if needed
3. Join the channel to activate proxy settings

## Requirements
- Modern web browser with WebRTC support
- Camera and microphone access
- Stable internet connection
- Agora App ID (get one from [Agora Console](https://console.agora.io/))

## Performance Notes
- SVC and Virtual Background features are CPU-intensive
- Performance graphs help monitor system impact
- Automatic quality adjustments based on network conditions
- Cloud proxy adds slight latency but improves reliability

## Browser Support
- Chrome (recommended)
- Firefox
- Safari
- Edge (Chromium-based)

## License
This project is part of the Flamingo Group demo applications.
