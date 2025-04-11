// Agora client configuration
let client;
let localAudioTrack;
let localVideoTrack;
let remoteUsers = {};
let isDualStreamEnabled = false;
let isVirtualBackgroundEnabled = false;
let isAinsEnabled = false;
let startTime;
let statsInterval;
let joined = false;
let peerConnectionState = "disconnected";
let connectionState = "disconnected";
let relayState = "false";

//Agora net-quality stats
var clientNetQuality = {uplink: 0, downlink: 0};

// Add new variables for virtual background
let lastVirtualBgCost = 0;
let settingsToggleBtn;

// Add audio profiles configuration
const audioProfiles = [{
    label: "speech_low_quality",
    detail: "16 Khz, mono, 24Kbps",
    value: "speech_low_quality"
}, {
    label: "speech_standard",
    detail: "32 Khz, mono, 24Kbps",
    value: "speech_standard"
}, {
    label: "music_standard",
    detail: "48 Khz, mono, 40 Kbps",
    value: "music_standard"
}, {
    label: "standard_stereo",
    detail: "48 Khz, stereo, 64 Kbps",
    value: "standard_stereo"
}, {
    label: "high_quality",
    detail: "48 Khz, mono, 129 Kbps",
    value: "high_quality"
}, {
    label: "high_quality_stereo",
    detail: "48 Khz, stereo, 192 Kbps",
    value: "high_quality_stereo"
}, {
    label: "320_high",
    detail: "48 Khz, stereo, 320 Kbps",
    value: {
        bitrate: 320,
        sampleRate: 48000,
        sampleSize: 16,
        stereo: true
    }
}];

// Add SVC variables
let isSVCEnabled = false;
let svcSettings = {
    all: {
        spatialLayer: 3,
        temporalLayer: 3
    },
    users: {}
};

// DOM Elements
const appIdInput = document.getElementById('appId');
const tokenInput = document.getElementById('token');
const channelNameInput = document.getElementById('channelName');
const userIdInput = document.getElementById('userId');
const micSelect = document.getElementById('micSelect');
const cameraSelect = document.getElementById('cameraSelect');
const videoProfileSelect = document.getElementById('videoProfile');
const cloudProxySelect = document.getElementById('cloudProxy');
const geoFenceSelect = document.getElementById('geoFence');
const joinBtn = document.getElementById('joinBtn');
const leaveBtn = document.getElementById('leaveBtn');
const muteMicBtn = document.getElementById('muteMicBtn');
const muteCameraBtn = document.getElementById('muteCameraBtn');
const dualStreamBtn = document.getElementById('dualStreamBtn');
const switchStreamBtn = document.getElementById('switchStreamBtn');
const virtualBgBtn = document.getElementById('virtualBgBtn');
const ainsBtn = document.getElementById('ainsBtn');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const localVideoStats = document.getElementById('localVideoStats');
const remoteVideoStats = document.getElementById('remoteVideoStats');

// Add new DOM elements for virtual background controls
const virtualBgTypeSelect = document.getElementById('virtualBgType');
const virtualBgColorGroup = document.getElementById('virtualBgColorGroup');
const virtualBgColorInput = document.getElementById('virtualBgColor');
const colorValueDisplay = document.getElementById('colorValue');
const virtualBgImgGroup = document.getElementById('virtualBgImgGroup');
const virtualBgImgUrlInput = document.getElementById('virtualBgImgUrl');
const virtualBgVideoGroup = document.getElementById('virtualBgVideoGroup');
const virtualBgVideoUrlInput = document.getElementById('virtualBgVideoUrl');
const virtualBgBlurGroup = document.getElementById('virtualBgBlurGroup');
const virtualBgBlurSelect = document.getElementById('virtualBgBlur');

// Add new chart variables
let virtualBgCostChart;
let resolutionChart;
let virtualBgCostData;
let resolutionData;
let networkChart;
let fpsChart;
let networkData;
let fpsData;

// Add new DOM elements
const audioProfileSelect = document.getElementById('audioProfile');
const svcControls = document.getElementById('svcControls');
const spatialLayerInput = document.getElementById('spatialLayer');
const temporalLayerInput = document.getElementById('temporalLayer');
const applySVCBtn = document.getElementById('applySVCBtn');

// Define chart options globally
const chartOptions = {
    curveType: 'function',
    legend: { position: 'bottom' },
    backgroundColor: { fill: 'transparent' },
    hAxis: { textPosition: 'none' },
    vAxis: { minValue: 0 },
    animation: {
        duration: 0 // Disable animation to prevent blinking
    },
    tooltip: {
        trigger: 'focus',
        ignoreBounds: true
    }
};

// Initialize Google Charts
google.charts.load('current', {'packages':['corechart']});
google.charts.setOnLoadCallback(initializeCharts);

function initializeCharts() {
    // Create data tables
    networkData = new google.visualization.DataTable();
    networkData.addColumn('number', 'Time');
    networkData.addColumn('number', 'Upload');
    networkData.addColumn('number', 'Download');

    fpsData = new google.visualization.DataTable();
    fpsData.addColumn('number', 'Time');
    fpsData.addColumn('number', 'Local FPS');

    resolutionData = new google.visualization.DataTable();
    resolutionData.addColumn('number', 'Time');
    resolutionData.addColumn('number', 'Local Width');
    resolutionData.addColumn('number', 'Local Height');

    virtualBgCostData = new google.visualization.DataTable();
    virtualBgCostData.addColumn('number', 'Time');
    virtualBgCostData.addColumn('number', 'Cost');

    // Create chart instances
    networkChart = new google.visualization.LineChart(document.getElementById('networkQualityChart'));
    fpsChart = new google.visualization.LineChart(document.getElementById('fpsChart'));
    resolutionChart = new google.visualization.LineChart(document.getElementById('resolutionChart'));
    virtualBgCostChart = new google.visualization.LineChart(document.getElementById('virtualBgCostChart'));

    // Draw initial empty charts
    drawNetworkChart();
    drawFPSChart();
    drawResolutionChart();
    drawVirtualBgCostChart();
}

// Video profiles configuration
const videoProfiles = [
    { label: "120p", detail: "160×120, 15fps", value: "120p" },
    { label: "120p_1", detail: "160×120, 15fps", value: "120p_1" },
    { label: "120p_3", detail: "120×120, 15fps", value: "120p_3" },
    { label: "180p", detail: "320×180, 15fps", value: "180p" },
    { label: "180p_1", detail: "320×180, 15fps", value: "180p_1" },
    { label: "180p_3", detail: "180×180, 15fps", value: "180p_3" },
    { label: "180p_4", detail: "240×180, 15fps", value: "180p_4" },
    { label: "240p", detail: "320×240, 15fps", value: "240p" },
    { label: "240p_1", detail: "320×240, 15fps", value: "240p_1" },
    { label: "240p_3", detail: "240×240, 15fps", value: "240p_3" },
    { label: "240p_4", detail: "424×240, 15fps", value: "240p_4" },
    { label: "360p", detail: "640×360, 15fps", value: "360p" },
    { label: "360p_1", detail: "640×360, 15fps", value: "360p_1" },
    { label: "360p_3", detail: "360×360, 15fps", value: "360p_3" },
    { label: "360p_4", detail: "640×360, 30fps", value: "360p_4" },
    { label: "360p_6", detail: "360×360, 30fps", value: "360p_6" },
    { label: "360p_7", detail: "480×360, 15fps", value: "360p_7" },
    { label: "360p_8", detail: "480×360, 30fps", value: "360p_8" },
    { label: "360p_9", detail: "640×360, 15fps", value: "360p_9" },
    { label: "360p_10", detail: "640×360, 24fps", value: "360p_10" },
    { label: "360p_11", detail: "640×360, 24fps", value: "360p_11" },
    { label: "480p", detail: "640×480, 15fps", value: "480p" },
    { label: "480p_1", detail: "640×480, 15fps", value: "480p_1" },
    { label: "480p_2", detail: "640×480, 30fps", value: "480p_2" },
    { label: "480p_3", detail: "480×480, 15fps", value: "480p_3" },
    { label: "480p_4", detail: "640×480, 30fps", value: "480p_4" },
    { label: "480p_6", detail: "480×480, 30fps", value: "480p_6" },
    { label: "480p_8", detail: "848×480, 15fps", value: "480p_8" },
    { label: "480p_9", detail: "848×480, 30fps", value: "480p_9" },
    { label: "480p_10", detail: "640×480, 10fps", value: "480p_10" },
    { label: "720p", detail: "1280×720, 15fps", value: "720p" },
    { label: "720p_1", detail: "1280×720, 15fps", value: "720p_1" },
    { label: "720p_2", detail: "1280×720, 30fps", value: "720p_2" },
    { label: "720p_3", detail: "1280×720, 30fps", value: "720p_3" },
    { label: "720p_auto", detail: "1280×720, 30fps", value: "720p_auto" },
    { label: "720p_5", detail: "960×720, 15fps", value: "720p_5" },
    { label: "720p_6", detail: "960×720, 30fps", value: "720p_6" },
    { label: "1080p", detail: "1920×1080, 15fps", value: "1080p" },
    { label: "1080p_1", detail: "1920×1080, 15fps", value: "1080p_1" },
    { label: "1080p_2", detail: "1920×1080, 30fps", value: "1080p_2" },
    { label: "1080p_3", detail: "1920×1080, 30fps", value: "1080p_3" },
    { label: "1080p_5", detail: "1920×1080, 60fps", value: "1080p_5" }
  ];

// Regions configuration
const regions = [
    { label: "Global", value: "GLOBAL" },
    { label: "Africa", value: "AFRICA" },
    { label: "Asia", value: "ASIA" },
    { label: "China", value: "CHINA" },
    { label: "Europe", value: "EUROPE" },
    { label: "Hong Kong & Macau", value: "HKMC" },
    { label: "India", value: "INDIA" },
    { label: "Japan", value: "JAPAN" },
    { label: "North America", value: "NORTH_AMERICA" },
    { label: "Oceania", value: "OCEANIA" },
    { label: "Oversea", value: "OVERSEA" },
    { label: "South America", value: "SOUTH_AMERICA" },
    { label: "United States", value: "US" }
];

// Proxy modes configuration
const proxyModes = [
    {
        label: "Close",
        detail: "Disable Cloud Proxy",
        value: "0",
    },
    {
        label: "UDP Mode",
        detail: "Enable Cloud Proxy via UDP protocol",
        value: "3",
    },
    {
        label: "TCP Mode",
        detail: "Enable Cloud Proxy via TCP/TLS port 443",
        value: "5",
    }
];

// Add new variables for SVC popup
const svcPopup = document.querySelector('.svc-popup');
const svcOverlay = document.querySelector('.svc-popup-overlay');
const svcSaveBtn = document.querySelector('.svc-popup-footer .save');
const svcCancelBtn = document.querySelector('.svc-popup-footer .cancel');
const enableSVCCheckbox = document.getElementById('enableSVC');

// Add click counter for logo
let logoClickCount = 0;
let logoClickTimeout;

// Add at the top with other variables
let baseUrl = window.location.origin + window.location.pathname;

// Add layers object at the top with other variables
let layers = {};

// Initialize Agora client
async function initializeAgoraClient() {
    // Set WebAudio initialization options
    AgoraRTC.setParameter('WEBAUDIO_INIT_OPTIONS', {
        latencyHint: 0.03,
        sampleRate: 48000,
    });

    AgoraRTC.setParameter("EXPERIMENTS", {"netqSensitivityMode": 1});

    client = AgoraRTC.createClient({ mode: "live", codec: "vp9" });

    await client.setClientRole("host");

    setupEventHandlers();
}

function setupEventHandlers() {
    // Network quality handlers
    client.on("network-quality", (stats) => {
        //console.log("Network quality changed:", stats);
        clientNetQuality.uplink = stats.uplinkNetworkQuality;
        clientNetQuality.downlink = stats.downlinkNetworkQuality;
    });

    // Regular connection state handler (without scale reset)
    client.on("connection-state-change", (cur, prev, reason) => {
        connectionState = cur;
        
        if (cur === "DISCONNECTED") {
            console.log(`Sender: connection-state-changed: Current: ${cur}, Previous: ${prev}, Reason: ${reason}`);
            showPopup(`Sender: Connection State: ${cur}, Reason: ${reason}`);
            if (reason === "FALLBACK") {
                console.log(`Sender: Autofallback TCP Proxy being attempted.`);
                showPopup(`Sender: Autofallback TCP Proxy Attempted`);
            }
        } else if (cur === "CONNECTED") {
            console.log(`Sender: connection-state-changed: Current: ${cur}, Previous: ${prev}`);
            showPopup(`Sender: Connection State: ${cur}`);
            joined = true;
        } else {
            console.log(`Sender: connection-state-changed: Current: ${cur}, Previous: ${prev}`);
            showPopup(`Sender: Connection State: ${cur}`);
            joined = false;
        }
    });

    // Peer connection state handler with scale reset
    client.on("peerconnection-state-change", (cur, prev) => {
        peerConnectionState = cur;
        const scaleValue = document.getElementById("scale-list").value;

        if (prev === "disconnected") {
            console.log(`Sender: peer-connection-state-changed: Current: ${cur}, Previous: ${prev}`);
            showPopup(`Sender: Peer Connection State: ${cur}`);
            if (scaleValue != 1) {
                console.log("Restoring scale settings after peer connection established");
                showPopup("Restoring scale settings after peer connection established");
                setScale();
            }
        } else {
            console.log(`Sender: peer-connection-state-changed: Current: ${cur}, Previous: ${prev}`);
            showPopup(`Sender: Peer Connection State: ${cur}`);
        }
    });

    // Cloud proxy handlers
    client.on("is-using-cloud-proxy", (isUsing) => {
        console.log("Using cloud proxy:", isUsing);
        showPopup(`Cloud proxy ${isUsing ? "enabled" : "disabled"}`);
        if (isUsing) {
            console.log("client isUsing", isUsing);
            relayState = "true";
        } else {
            console.log("client isUsing", isUsing);
            relayState = "false";
        }
    });

    client.on("join-fallback-to-proxy", () => {
        console.log("Falling back to proxy");
        showPopup("Falling back to proxy");
        if (isUsing) {
            relayState = "true";
        } else {
            relayState = "false";
        }
    });

    // Handle user published event
    client.on("user-published", async (user, mediaType) => {
        try {
            await handleUserPublished(user, mediaType);
        } catch (error) {
            console.error("Error in user-published handler:", error);
        }
    });

    client.on("user-unpublished", async (user, mediaType) => {
        try {
            await handleUserUnpublished(user, mediaType);
        } catch (error) {
            console.error("Error in user-unpublished handler:", error);
        }
    });
}

// Handle user published event
async function handleUserPublished(user, mediaType) {
    await client.subscribe(user, mediaType);

    // Initialize layers for new user
    const numericUid = Number(user.uid);
    if (!layers[numericUid]) {
        layers[numericUid] = {
            spatialLayer: svcSettings.all.spatialLayer,
            temporalLayer: svcSettings.all.temporalLayer
        };
    }

    if (!remoteUsers[user.uid]) {
        remoteUsers[user.uid] = user;
        
        // Only create SVC controls when we first add the user
        const svcControls = createSVCControlsForUser(user.uid);
        if (svcControls) {
            // Remove any existing controls for this user first
            const existingControls = document.getElementById(`svc-controls-${user.uid}`);
            if (existingControls) {
                existingControls.remove();
            }
            
            const usersContainer = document.getElementById('svc-users-container');
            if (usersContainer) {
                usersContainer.appendChild(svcControls);
            }
        }
    }

    if (mediaType === 'video') {
        const remoteVideoContainer = document.getElementById('remoteVideo');
        
        // Clear no-video div if it exists
        const noVideoDiv = remoteVideoContainer.querySelector('.no-video');
        if (noVideoDiv) {
            remoteVideoContainer.innerHTML = '';
        }

        let videoWrapper = document.getElementById(`video-wrapper-${user.uid}`);
        
        if (!videoWrapper) {
            videoWrapper = document.createElement('div');
            videoWrapper.className = 'video-wrapper';
            videoWrapper.id = `video-wrapper-${user.uid}`;
            
            const videoBox = document.createElement('div');
            videoBox.className = 'video-box';
            videoBox.id = `remote-video-${user.uid}`;
            
            const statsElement = document.createElement('div');
            statsElement.className = 'video-overlay-stats';
            statsElement.id = `stats-${user.uid}`;
            
            videoBox.appendChild(statsElement);
            videoWrapper.appendChild(videoBox);

            // Temporarily add to remote container
            remoteVideoContainer.appendChild(videoWrapper);
            
            // Reorganize all video tiles
            reorganizeVideoTiles();
        }
        
        user.videoTrack.play(`remote-video-${user.uid}`);
        updateChartColumns();
    }
    
    if (mediaType === 'audio') {
        user.audioTrack.play();
    }
}

// Handle user unpublished event
function handleUserUnpublished(user, mediaType) {
    if (mediaType === "video") {
        const videoWrapper = document.getElementById(`video-wrapper-${user.uid}`);
        if (videoWrapper) {
            videoWrapper.remove();
        }
        
        // Remove SVC controls
        const svcControls = document.getElementById(`svc-controls-${user.uid}`);
        if (svcControls) {
            svcControls.remove();
        }
        
        // Remove user settings
        delete svcSettings.users[user.uid];
        delete remoteUsers[user.uid];
        delete layers[user.uid];
        
        // Reorganize video tiles
        reorganizeVideoTiles();
        
        // Update chart columns after user leaves
        updateChartColumns();

        // If no more remote users, ensure remote container shows no-video div
        const remoteVideoContainer = document.getElementById('remoteVideo');
        if (Object.keys(remoteUsers).length === 0) {
            remoteVideoContainer.innerHTML = '<div class="no-video"></div>';
        }
    }
}

// Add function to reorganize video tiles
function reorganizeVideoTiles() {
    const firstRow = document.querySelector('.first-row');
    const remoteVideoContainer = document.getElementById('remoteVideo');
    const localVideoWrapper = document.getElementById('localVideo').parentElement;
    const remoteWrappers = Array.from(document.querySelectorAll('.video-wrapper')).filter(wrapper => 
        wrapper.id !== localVideoWrapper.id
    );

    // Ensure first row exists and contains local video
    if (!firstRow) {
        const newFirstRow = document.createElement('div');
        newFirstRow.className = 'first-row';
        const container = document.querySelector('.video-container');
        container.insertBefore(newFirstRow, remoteVideoContainer);
    }
    firstRow.innerHTML = '';
    firstRow.appendChild(localVideoWrapper);

    // If there are remote users, move the first one to the first row
    if (remoteWrappers.length > 0) {
        firstRow.appendChild(remoteWrappers[0]);
        
        // Move remaining remote videos to the remote container
        remoteVideoContainer.innerHTML = '';
        remoteWrappers.slice(1).forEach(wrapper => {
            remoteVideoContainer.appendChild(wrapper);
        });
    }

    // If no remote users, add the no-video div to remote container
    if (remoteWrappers.length === 0) {
        remoteVideoContainer.innerHTML = '<div class="no-video"></div>';
    }
}

// Get devices
async function getDevices() {
    console.log("EMOJI Getting devices");
    try {
        const devices = await AgoraRTC.getDevices();

        const audioDevices = devices.filter(device => device.kind === 'audioinput');
        const videoDevices = devices.filter(device => device.kind === 'videoinput');

        // Populate microphone select
        micSelect.innerHTML = audioDevices.map(device => 
            `<option value="${device.deviceId}">${device.label || `Microphone ${device.deviceId}`}</option>`
        ).join('');

        // Populate camera select
        cameraSelect.innerHTML = videoDevices.map(device => 
            `<option value="${device.deviceId}">${device.label || `Camera ${device.deviceId}`}</option>`
        ).join('');
    } catch (error) {
        console.error("Error getting devices:", error);
    }
}

// Create local tracks
async function createLocalTracks() {
    try {
        // Create audio track with selected profile
        /*const audioProfile = audioProfileSelect.value;
        localVideoTrack = await AgoraRTC.createCameraVideoTrack({
            encoderConfig: videoProfileSelect.value,
            deviceId: cameraSelect.value,
            scalabiltyMode: isSVCEnabled ? "3SL3TL" : undefined
        });
        localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
            encoderConfig: audioProfile,
            deviceId: micSelect.value
        });*/
        [localAudioTrack, localVideoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
            {
                encoderConfig: audioProfile,
                deviceId: micSelect.value
            },
            {
                encoderConfig: videoProfileSelect.value,
                deviceId: cameraSelect.value,
                scalabiltyMode: isSVCEnabled ? "3SL3TL" : undefined
            }
        );

        // Play local video track
        localVideo.innerHTML = ''; // Clear no-video div
        localVideoTrack.play("localVideo");
    } catch (error) {
        console.error("Error creating local tracks:", error);
        throw error;
    }
}

// Join channel
async function joinChannel() {
    try {
        const appId = appIdInput.value;
        const token = tokenInput.value || null;
        const channelName = channelNameInput.value;
        const uid = userIdInput.value ? parseInt(userIdInput.value) : null;

        if (!appId || !channelName) {
            showPopup("Please enter App ID and Channel Name");
            return;
        }

        // Reset all graphs at the start of a new call
        if (networkData) networkData.removeRows(0, networkData.getNumberOfRows());
        if (fpsData) fpsData.removeRows(0, fpsData.getNumberOfRows());
        if (virtualBgCostData) virtualBgCostData.removeRows(0, virtualBgCostData.getNumberOfRows());
        if (resolutionData) resolutionData.removeRows(0, resolutionData.getNumberOfRows());

        showPopup("Initializing Agora client...");
        await initializeAgoraClient();
        
        showPopup("Creating local tracks...");
        await createLocalTracks();

        // Set region if selected
        if (geoFenceSelect.value !== "GLOBAL") {
            showPopup(`Setting region to ${geoFenceSelect.value}...`);
            AgoraRTC.setArea({areaCode: geoFenceSelect.value});
        }

        // Set proxy mode if selected
        const proxyMode = parseInt(cloudProxySelect.value);
        if (proxyMode > 0) {
            showPopup(`Starting proxy server in ${proxyMode === 3 ? 'UDP' : 'TCP'} mode...`);
            await client.startProxyServer(proxyMode);
        }

        // Enable dual stream mode before joining only if SVC is not enabled
        if (!isSVCEnabled) {
            showPopup("Enabling dual stream mode...");
            await client.enableDualStream();
            isDualStreamEnabled = true;
            dualStreamBtn.textContent = "Disable Dual Stream";
            dualStreamBtn.disabled = false;
            dualStreamBtn.style.opacity = '1';
            switchStreamBtn.textContent = "Set to Low Quality";
            switchStreamBtn.disabled = false;
            switchStreamBtn.style.opacity = '1';
        } else {
            showPopup("Dual stream disabled because SVC is enabled");
            isDualStreamEnabled = false;
            dualStreamBtn.textContent = "Enable Dual Stream";
            dualStreamBtn.disabled = true;
            dualStreamBtn.style.opacity = '0.5';
            switchStreamBtn.disabled = true;
            switchStreamBtn.style.opacity = '0.5';
        }

        // Join channel as host
        showPopup(`Joining channel ${channelName} as host...`);
        await client.join(appId, channelName, token, uid);
        await client.publish([localAudioTrack, localVideoTrack]);
        
        startTime = Date.now();
        startStatsMonitoring();

        // Update UI
        joinBtn.disabled = true;
        joinBtn.style.opacity = '0.5';
        leaveBtn.disabled = false;
        leaveBtn.style.opacity = '1';

        // Enable control buttons
        [muteMicBtn, muteCameraBtn, switchStreamBtn, virtualBgBtn, ainsBtn].forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.background = '#fff3cd';
        });

        // Mute audio after joining
        if (localAudioTrack) {
            await localAudioTrack.setMuted(true);
            muteMicBtn.textContent = "Unmute Mic";
            showPopup("Audio muted by default");
        }

        showPopup("Successfully joined channel!");
        
    } catch (error) {
        console.error("Error joining channel:", error);
        showPopup(`Failed to join channel: ${error.message}`);
    }
}

// Leave channel
async function leaveChannel() {
    try {
        // Stop stats monitoring
        stopStatsMonitoring();
        
        // Unpublish local tracks
        if (localAudioTrack) {
            localAudioTrack.close();
            localAudioTrack = null;
        }
        
        if (localVideoTrack) {
            localVideoTrack.close();
            localVideoTrack = null;
        }
        
        // Leave the channel
        await client.leave();
        
        // Clear remote video container and first row
        const remoteVideoContainer = document.getElementById('remoteVideo');
        const firstRow = document.querySelector('.first-row');
        
        // Keep local video wrapper but clear its contents
        const localVideoWrapper = document.getElementById('localVideo').parentElement;
        localVideo.innerHTML = '<div class="no-video"></div>';
        
        // Clear first row and re-add local video
        if (firstRow) {
            firstRow.innerHTML = '';
            firstRow.appendChild(localVideoWrapper);
        }
        
        // Clear remote video container
        if (remoteVideoContainer) {
            remoteVideoContainer.innerHTML = '<div class="no-video"></div>';
        }
        
        // Clear all SVC controls for remote users
        const svcUsersContainer = document.getElementById('svc-users-container');
        if (svcUsersContainer) {
            // Keep only the global controls
            const globalControls = svcUsersContainer.querySelector('.svc-global-controls');
            svcUsersContainer.innerHTML = '';
            if (globalControls) {
                svcUsersContainer.appendChild(globalControls);
            }
        }
        
        // Reset remote users and layers
        remoteUsers = {};
        layers = {};

        // Clear stats displays
        document.getElementById('overallStats').innerHTML = '';
        document.getElementById('localVideoStats').innerHTML = '';
        
        // Reset UI state
        joinBtn.disabled = false;
        joinBtn.style.opacity = '1';
        leaveBtn.disabled = true;
        leaveBtn.style.opacity = '0.5';
        
        // Reset joined state
        joined = false;
        
        // Show success message
        showPopup("Left channel successfully!");

    } catch (error) {
        console.error("Error leaving channel:", error);
        showPopup(`Error leaving channel: ${error.message}`);
    }
}

// Toggle microphone
async function toggleMicrophone() {
    if (localAudioTrack) {
        try {
            await localAudioTrack.setMuted(!localAudioTrack.muted);
            muteMicBtn.textContent = localAudioTrack.muted ? "Unmute Mic" : "Mute Mic";
        } catch (error) {
            console.error("Error toggling microphone:", error);
            showPopup("Failed to toggle microphone");
        }
    }
}

// Toggle camera
async function toggleCamera() {
    if (localVideoTrack) {
        try {
            await localVideoTrack.setMuted(!localVideoTrack.muted);
            muteCameraBtn.textContent = localVideoTrack.muted ? "Unmute Camera" : "Mute Camera";
            if (localVideoTrack.muted) {
                localVideo.innerHTML = '<div class="no-video"></div>';
            } else {
                localVideo.innerHTML = '';
                localVideoTrack.play("localVideo");
            }
        } catch (error) {
            console.error("Error toggling camera:", error);
            showPopup("Failed to toggle camera");
        }
    }
}

// Toggle dual stream
async function toggleDualStream() {
    if (!client) return;

    // Prevent toggling if SVC is enabled
    if (isSVCEnabled) {
        showPopup("Cannot enable dual stream while SVC is enabled");
        return;
    }

    try {
        if (!isDualStreamEnabled) {
            await client.enableDualStream();
            isDualStreamEnabled = true;
            dualStreamBtn.textContent = "Disable Dual Stream";
        } else {
            await client.disableDualStream();
            isDualStreamEnabled = false;
            dualStreamBtn.textContent = "Enable Dual Stream";
        }
    } catch (error) {
        console.error("Error toggling dual stream:", error);
    }
}

// Switch stream quality
async function switchStream() {
    const remoteUserIds = Object.keys(remoteUsers);
    if (!remoteUserIds.length) {
        showPopup("No remote users to switch stream");
        return;
    }

    try {
        // Get current stream type from button text
        const currentText = switchStreamBtn.textContent;
        let newStreamType;
        let newButtonText;

        if (currentText === "Set to High Quality") {
            newStreamType = 0; // High quality
            newButtonText = "Set to Low Quality";
        } else {
            newStreamType = 1; // Low quality
            newButtonText = "Set to High Quality";
        }
        
        // Set the stream type for all remote users
        const promises = remoteUserIds.map(uid => 
            client.setRemoteVideoStreamType(uid, newStreamType)
        );
        await Promise.all(promises);
        
        switchStreamBtn.textContent = newButtonText;
        showPopup(`Switched all users to ${newStreamType === 0 ? "high" : "low"} quality stream`);
    } catch (error) {
        console.error("Error switching stream:", error);
        showPopup("Failed to switch stream quality");
    }
}

// Add popup function
function showPopup(message) {
    // Create container if it doesn't exist
    let container = document.querySelector('.popup-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'popup-container';
        document.body.appendChild(container);
    }

    // Create popup
    const popup = document.createElement('div');
    popup.className = 'popup';
    popup.textContent = message;
    container.appendChild(popup);
    
    // Remove popup after delay
    setTimeout(() => {
        popup.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            popup.remove();
            // Remove container if empty
            if (container.children.length === 0) {
                container.remove();
            }
        }, 300);
    }, 5000); // Increased from 3000 to 5000ms
}

// Helper function to load media with CORS handling
async function loadMediaWithCORS(url, type) {
    try {
        if (type === 'img') {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = url;
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });
            return img;
        } else if (type === 'video') {
            const video = document.createElement('video');
            video.crossOrigin = "anonymous";
            video.src = url;
            video.loop = true;
            video.muted = true;
            await new Promise((resolve, reject) => {
                video.onloadeddata = resolve;
                video.onerror = reject;
            });
            return video;
        }
    } catch (error) {
        console.error(`Error loading ${type}:`, error);
        throw new Error(`Failed to load ${type}. Make sure the URL is CORS-enabled.`);
    }
}

// Add new function to update virtual background
async function updateVirtualBackground() {
    if (!localVideoTrack || !isVirtualBackgroundEnabled) return;

    try {
        // Get the current processor
        const processor = localVideoTrack.processor;
        if (!processor) return;

        // Set options based on selected type
        const options = {
            type: virtualBgTypeSelect.value,
            fit: 'cover'
        };

        switch (virtualBgTypeSelect.value) {
            case 'color':
                options.color = virtualBgColorInput.value;
                break;
            case 'img':
                try {
                    options.source = await loadMediaWithCORS(virtualBgImgUrlInput.value, 'img');
                } catch (error) {
                    showPopup(error.message);
                    return;
                }
                break;
            case 'video':
                try {
                    options.source = await loadMediaWithCORS(virtualBgVideoUrlInput.value, 'video');
                } catch (error) {
                    showPopup(error.message);
                    return;
                }
                break;
            case 'blur':
                options.blurDegree = parseInt(virtualBgBlurSelect.value);
                break;
            case 'none':
                // No additional options needed
                break;
        }

        // Update the processor options
        processor.setOptions(options);
        showPopup("Virtual background updated");
    } catch (error) {
        console.error("Error updating virtual background:", error);
        showPopup("Failed to update virtual background");
    }
}

// Toggle virtual background
async function toggleVirtualBackground() {
    if (!localVideoTrack) {
        console.log("No local video track available");
        showPopup("No video track available");
        return;
    }

    try {
        if (!isVirtualBackgroundEnabled) {
            console.log("Enabling virtual background...");
            showPopup("Enabling virtual background...");
            
            // Create and register virtual background extension
            const vb = new VirtualBackgroundExtension();
            AgoraRTC.registerExtensions([vb]);
            
            // Create processor
            const processor = await vb.createProcessor();
            
            // Set up event handlers
            processor.eventBus.on("PERFORMANCE_WARNING", () => {
                console.warn("Performance warning!");
                showPopup("VirtualBackground performance warning!");
            });
            processor.eventBus.on("cost", (cost) => {
                console.warn(`cost of vb is ${cost}`);
                lastVirtualBgCost = cost;
            });
            processor.onoverload = async () => {
                console.log("overload!");
                showPopup("VirtualBackground overload!");
            };

            // Initialize processor
            try {
                await processor.init("not_needed");
            } catch (error) {
                console.error(error);
                showPopup("Failed to initialize virtual background");
                return;
            }

            // Set options based on selected type
            const options = {
                type: virtualBgTypeSelect.value,
                fit: 'cover'
            };

            switch (virtualBgTypeSelect.value) {
                case 'color':
                    options.color = virtualBgColorInput.value;
                    break;
                case 'img':
                    try {
                        options.source = await loadMediaWithCORS(virtualBgImgUrlInput.value, 'img');
                    } catch (error) {
                        showPopup(error.message);
                        return;
                    }
                    break;
                case 'video':
                    try {
                        options.source = await loadMediaWithCORS(virtualBgVideoUrlInput.value, 'video');
                    } catch (error) {
                        showPopup(error.message);
                        return;
                    }
                    break;
                case 'blur':
                    options.blurDegree = parseInt(virtualBgBlurSelect.value);
                    break;
                case 'none':
                    // No additional options needed
                    break;
            }

            processor.setOptions(options);
            await processor.enable();
            
            // Always unpipe first to ensure clean state
            try {
                await localVideoTrack.unpipe();
            } catch (error) {
                console.log("No existing pipe to unpipe");
            }
            
            // Pipe the processor to the destination
            await localVideoTrack.pipe(processor).pipe(localVideoTrack.processorDestination);
            
            isVirtualBackgroundEnabled = true;
            virtualBgBtn.textContent = "Disable Virtual Background";
            showPopup("Virtual background enabled");
        } else {
            console.log("Disabling virtual background...");
            showPopup("Disabling virtual background...");
            
            // Get the processor from the track
            const processor = localVideoTrack.processor;
            if (processor) {
                // First unpipe the processor
                await localVideoTrack.unpipe();
                // Then disable and release
                await processor.unpipe();
                await processor.disable();
                await processor.release();
                // Clear the processor reference
                localVideoTrack.processor = null;
            }
            
            isVirtualBackgroundEnabled = false;
            virtualBgBtn.textContent = "Enable Virtual Background";
            showPopup("Virtual background disabled");
        }
    } catch (error) {
        console.error("Error toggling virtual background:", error);
        showPopup("Failed to toggle virtual background");
    }
}

// Toggle AINS
async function toggleAins() {
    if (!localAudioTrack) {
        console.log("No local audio track available");
        showPopup("No audio track available");
        return;
    }

    try {
        if (!isAinsEnabled) {
            console.log("Enabling AINS...");
            showPopup("Enabling AINS...");
            
            // Create and register AINS extension
            const denoiser = new AIDenoiser.AIDenoiserExtension({
                assetsPath: 'https://agora-packages.s3.us-west-2.amazonaws.com/ext/aidenoiser/external'
            });
            AgoraRTC.registerExtensions([denoiser]);
            
            denoiser.onloaderror = (e) => {
                console.error(e);
                showPopup("AINS load error");
            };

            // Create processor
            const processor = denoiser.createProcessor();
            
            // Set up event handlers
            processor.onoverload = async (elapsedTimeInMs) => {
                console.log(`"overload!!! elapsed: ${elapsedTimeInMs}`);
                showPopup(`AINS overload after ${elapsedTimeInMs}ms`);
                try {
                    await processor.disable();
                    isAinsEnabled = false;
                    ainsBtn.textContent = "Enable AINS";
                    showPopup("AINS disabled due to overload");
                } catch (error) {
                    console.error("disable AIDenoiser failure");
                    showPopup("Failed to disable AINS after overload");
                }
            };

            // Pipe the processor
            await localAudioTrack.pipe(processor).pipe(localAudioTrack.processorDestination);
            
            // Enable and configure
            try {
                await processor.enable();
                await processor.setLevel("AGGRESSIVE");
                isAinsEnabled = true;
                ainsBtn.textContent = "Disable AINS";
                showPopup("AINS enabled successfully");
            } catch (error) {
                console.error("enable AIDenoiser failure");
                showPopup("Failed to enable AINS");
            }
        } else {
            console.log("Disabling AINS...");
            showPopup("Disabling AINS...");
            await localAudioTrack.unpipe();
            isAinsEnabled = false;
            ainsBtn.textContent = "Enable AINS";
            showPopup("AINS disabled successfully");
        }
    } catch (error) {
        console.error("Error toggling AINS:", error);
        showPopup("Error toggling AINS");
    }
}

// Handle user joined event
function handleUserJoined(user) {
    console.log("User joined:", user.uid);
    if (!remoteUsers[user.uid]) {
        remoteUsers[user.uid] = { audioTrack: null, videoTrack: null };
    }
}

// Handle user left event
function handleUserLeft(user) {
    console.log("User left:", user.uid);
    
    // Remove from layers
    const numericUid = Number(user.uid);
    delete layers[numericUid];
    
    // Remove the remote user's video wrapper
    const videoWrapper = document.getElementById(`video-wrapper-${user.uid}`);
    if (videoWrapper) {
        videoWrapper.remove();
    }
    
    // Remove from remote users
    delete remoteUsers[user.uid];
    
    // Update chart columns after user leaves
    updateChartColumns();
    
    // If no more remote users with video, add back the no-video div
    const remoteVideoContainer = document.getElementById('remoteVideo');
    if (Object.keys(remoteUsers).length === 0) {
        remoteVideoContainer.innerHTML = '<div class="no-video"></div>';
    }
}

// Update chart columns based on current remote users
function updateChartColumns() {
    // Create a new DataTable for FPS
    const newFpsData = new google.visualization.DataTable();
    newFpsData.addColumn('number', 'Time');
    newFpsData.addColumn('number', 'Local FPS');
    
    // Add columns for each remote user
    const remoteUsersWithVideo = Object.keys(remoteUsers).filter(uid => remoteUsers[uid].videoTrack);
    remoteUsersWithVideo.forEach(uid => {
        newFpsData.addColumn('number', `Remote ${uid} FPS`);
    });
    
    // Copy existing data if any
    if (fpsData && fpsData.getNumberOfRows() > 0) {
        for (let i = 0; i < fpsData.getNumberOfRows(); i++) {
            const row = [fpsData.getValue(i, 0), fpsData.getValue(i, 1)];
            // Add remote user FPS values if they exist in the old data
            remoteUsersWithVideo.forEach((uid, index) => {
                if (index + 2 < fpsData.getNumberOfColumns()) {
                    row.push(fpsData.getValue(i, index + 2));
                } else {
                    row.push(0);
                }
            });
            newFpsData.addRow(row);
        }
    }
    
    // Replace the old data table
    fpsData = newFpsData;
    
    // Create new resolution data table
    const newResolutionData = new google.visualization.DataTable();
    newResolutionData.addColumn('number', 'Time');
    newResolutionData.addColumn('number', 'Local Width');
    newResolutionData.addColumn('number', 'Local Height');
    
    // Add columns for each remote user's resolution
    remoteUsersWithVideo.forEach(uid => {
        newResolutionData.addColumn('number', `Remote ${uid} Width`);
        newResolutionData.addColumn('number', `Remote ${uid} Height`);
    });
    
    // Copy existing resolution data if any
    if (resolutionData && resolutionData.getNumberOfRows() > 0) {
        for (let i = 0; i < resolutionData.getNumberOfRows(); i++) {
            const row = [
                resolutionData.getValue(i, 0),
                resolutionData.getValue(i, 1),
                resolutionData.getValue(i, 2)
            ];
            // Add remote user resolution values if they exist in the old data
            remoteUsersWithVideo.forEach((uid, index) => {
                const baseIndex = 3 + (index * 2);
                if (baseIndex < resolutionData.getNumberOfColumns()) {
                    row.push(resolutionData.getValue(i, baseIndex));
                    row.push(resolutionData.getValue(i, baseIndex + 1));
                } else {
                    row.push(0, 0);
                }
            });
            newResolutionData.addRow(row);
        }
    }
    
    // Replace the old resolution data table
    resolutionData = newResolutionData;
    
    // Redraw charts
    drawFPSChart();
    drawResolutionChart();
}

// Start stats monitoring
function startStatsMonitoring() {
    startTime = Date.now();
    statsInterval = setInterval(async () => {
        try {
            const clientStats = await client.getRTCStats();
            const localVideoStats = await client.getLocalVideoStats();
            const localAudioStats = await client.getLocalAudioStats();
            // Update connection states
            peerConnectionState = client._peerConnectionState;
            connectionState = client.connectionState;
            
            // Get remote stats for all remote users
            const remoteVideoStats = {};
            const remoteAudioStats = {};
            for (const uid in remoteUsers) {
                const userVideoStats = await client.getRemoteVideoStats()[uid];
                const userAudioStats = await client.getRemoteAudioStats()[uid];
                if (userVideoStats) remoteVideoStats[uid] = userVideoStats;
                if (userAudioStats) remoteAudioStats[uid] = userAudioStats;
            }
            
            updateStats(clientStats, null, localVideoStats, remoteVideoStats, localAudioStats, remoteAudioStats);
        } catch (error) {
            console.error("Error getting stats:", error);
        }
    }, 1000);
}

function stopStatsMonitoring() {
    if (statsInterval) {
        clearInterval(statsInterval);
        statsInterval = null;
    }
}

function updateStats(clientStats, clientStats2, localVideoStats, remoteVideoStats, localAudioStats, remoteAudioStats) {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    
    // Helper function to get colored status text
    const getColoredStatus = (status, type) => {
        let color;
        switch (type) {
            case 'link':
                color = status ? '#4CAF50' : '#F44336'; // Green for online, Red for offline
                return `<span style="color: ${color}; font-weight: bold;">${status ? 'Online' : 'Offline'}</span>`;
            case 'connection':
                switch (status) {
                    case 'CONNECTED':
                        color = '#4CAF50'; // Green
                        break;
                    case 'CONNECTING':
                        color = '#FFA500'; // Orange
                        break;
                    case 'DISCONNECTED':
                        color = '#F44336'; // Red
                        break;
                    default:
                        color = '#757575'; // Grey for other states
                }
                return `<span style="color: ${color}; font-weight: bold;">${status}</span>`;
            case 'peer':
                switch (status) {
                    case 'connected':
                        color = '#4CAF50'; // Green
                        break;
                    case 'connecting':
                        color = '#FFA500'; // Orange
                        break;
                    case 'disconnected':
                    case 'failed':
                        color = '#F44336'; // Red
                        break;
                    case 'closed':
                        color = '#757575'; // Grey
                        break;
                    default:
                        color = '#757575'; // Grey for other states
                }
                return `<span style="color: ${color}; font-weight: bold;">${status}</span>`;
            case 'relay':
                color = status == "true" ? '#FFA500' : '#4CAF50'; // Orange for relay, Green for direct
                return `<span style="color: ${color}; font-weight: bold;">${status == "true" ? 'Yes' : 'No'}</span>`;
        }
    };
    
    // Update overall stats
    document.getElementById('overallStats').innerHTML = [
        `Local UID: ${client.uid}`,
        `Host Count: ${clientStats.UserCount}`,
        `Duration: ${duration}s`,
        `RTT: ${clientStats.RTT}ms`,
        `Outgoing B/W: ${(Number(clientStats.OutgoingAvailableBandwidth) * 0.001).toFixed(4)} Mbps`,
        `Link Status: ${getColoredStatus(navigator.onLine, 'link')}`,
        `Connection State: ${getColoredStatus(connectionState, 'connection')}`,
        `Peer Connection State: ${getColoredStatus(peerConnectionState, 'peer')}`,
        `Relay: ${getColoredStatus(relayState, 'relay')}`
    ].map(stat => `<div class="stat-item">${stat}</div>`).join('');

    // Update local video stats
    document.getElementById('localVideoStats').innerHTML = [
        `<span style="color: #2196F3;">Video Stats</span>`,
        `Codec: ${localVideoStats.codecType}`,
        `Capture FPS: ${localVideoStats.captureFrameRate}`,
        `Send FPS: ${localVideoStats.sendFrameRate}`,
        `Video encode delay: ${Number(localVideoStats.encodeDelay).toFixed(2)}ms`,
        `Resolution: ${localVideoStats.sendResolutionWidth}x${localVideoStats.sendResolutionHeight}`,
        `Send bitrate: ${(Number(localVideoStats.sendBitrate) * 0.000001).toFixed(4)} Mbps`,
        `Send Jitter: ${Number(localVideoStats.sendJitterMs).toFixed(2)}ms`,
        `Send RTT: ${Number(localVideoStats.sendRttMs).toFixed(2)}ms`,
        `Packet Loss: ${Number(localVideoStats.currentPacketLossRate).toFixed(3)}%`,
        `Network Quality: ${clientNetQuality.uplink}`,
        `<span style="color: #2196F3;">Audio Stats</span>`,
        `Codec: ${localAudioStats.codecType}`,
        `Send Level: ${localAudioStats.sendVolumeLevel}`,
        `Audio Send Bitrate: ${(Number(localAudioStats.sendBitrate) * 0.000001).toFixed(4)} Mbps`,
        `Audio Send Jitter: ${Number(localAudioStats.sendJitterMs).toFixed(2)}ms`,
        `Audio Send RTT: ${Number(localAudioStats.sendRttMs).toFixed(2)}ms`,
        `Audio Packet Loss: ${Number(localAudioStats.currentPacketLossRate).toFixed(3)}%`
    ].join('<br>');

    // Update remote stats for all remote users
    for (const [uid, stats] of Object.entries(remoteVideoStats)) {
        const audioStats = remoteAudioStats[uid] || {};
        const statsElement = document.getElementById(`stats-${uid}`);
        
        if (statsElement) {
            statsElement.innerHTML = [
                `<span style="color: #2196F3;">Remote User ${uid} Stats</span>`,
            `<span style="color: #2196F3;">Video Stats</span>`,
                `Codec: ${stats.codecType}`,
                `Receive FPS: ${stats.receiveFrameRate}`,
                `Decode FPS: ${stats.decodeFrameRate}`,
                `Render FPS: ${stats.renderFrameRate}`,
                `Resolution: ${stats.receiveResolutionWidth}x${stats.receiveResolutionHeight}`,
                `Receive bitrate: ${(Number(stats.receiveBitrate) * 0.000001).toFixed(4)} Mbps`,
                `receive delay: ${Number(stats.receiveDelay).toFixed(0)}ms`,
                `Packets lost: ${stats.receivePacketsLost}`,
                `E2E Delay: ${stats.end2EndDelay}ms`,
                `Transport Delay: ${stats.transportDelay}ms`,
                `Freeze Rate: ${Number(stats.freezeRate).toFixed(3)}%`,
                `Total freeze time: ${stats.totalFreezeTime}s`,
                `Network Quality: ${clientNetQuality.downlink}`,
            `<span style="color: #2196F3;">Audio Stats</span>`,
                `Codec: ${audioStats.codecType}`,
                `Receive Level: ${audioStats.receiveLevel}`,
                `Receive Bitrate: ${(Number(audioStats.receiveBitrate) * 0.000001).toFixed(4)} Mbps`,
                `receive delay: ${Number(audioStats.receiveDelay).toFixed(0)}ms`,
                `Transport Delay: ${audioStats.transportDelay}ms`,
        ].join('<br>');
        }
    }

    const time = (Date.now() - startTime) / 1000;
    
    try {
        // Update network data (this stays the same as it has fixed columns)
        const uploadBitrate = Number(clientStats.SendBitrate) * 0.000001;
        const downloadBitrate = Number(clientStats.RecvBitrate) * 0.000001;
        networkData.addRow([time, uploadBitrate, downloadBitrate]);
        
        // Get current remote users with video
        const remoteUsersWithVideo = Object.keys(remoteUsers).filter(uid => remoteUsers[uid].videoTrack);
        
        // Check if we need to update columns (column count changed)
        if (fpsData.getNumberOfColumns() !== remoteUsersWithVideo.length + 2) {
            updateChartColumns();
        }
        
        // Create FPS row with correct number of columns
        const fpsRow = [time, Math.min(localVideoStats.sendFrameRate || 0, 60)];
        remoteUsersWithVideo.forEach(uid => {
            const stats = remoteVideoStats[uid];
            fpsRow.push(stats ? Math.min(stats.receiveFrameRate || 0, 60) : 0);
        });
        fpsData.addRow(fpsRow);
        
        // Create resolution row with correct number of columns
        const resolutionRow = [
            time,
            Math.min(localVideoStats.sendResolutionWidth || 0, 1920),
            Math.min(localVideoStats.sendResolutionHeight || 0, 1080)
        ];
        remoteUsersWithVideo.forEach(uid => {
            const stats = remoteVideoStats[uid];
            if (stats) {
                resolutionRow.push(Math.min(stats.receiveResolutionWidth || 0, 1920));
                resolutionRow.push(Math.min(stats.receiveResolutionHeight || 0, 1080));
            } else {
                resolutionRow.push(0, 0);
            }
        });
        resolutionData.addRow(resolutionRow);
        
        // Update virtual background cost data
        virtualBgCostData.addRow([time, lastVirtualBgCost || 0]);
        
        // Keep only last 60 seconds of data
        if (networkData.getNumberOfRows() > 60) networkData.removeRow(0);
        if (fpsData.getNumberOfRows() > 60) fpsData.removeRow(0);
        if (resolutionData.getNumberOfRows() > 60) resolutionData.removeRow(0);
        if (virtualBgCostData.getNumberOfRows() > 60) virtualBgCostData.removeRow(0);
        
        // Draw all charts
        drawNetworkChart();
        drawFPSChart();
        drawResolutionChart();
        drawVirtualBgCostChart();
        
    } catch (error) {
        console.error("Error updating charts:", error);
    }
}

function drawNetworkChart() {
    try {
        networkChart.draw(networkData, {
            ...chartOptions,
            title: 'Network Quality',
            vAxis: { title: 'Bitrate (Mbps)', minValue: 0 }
        });
    } catch (error) {
        console.error("Error drawing network chart:", error);
    }
}

function drawFPSChart() {
    try {
        fpsChart.draw(fpsData, {
            ...chartOptions,
            title: 'Frame Rate',
            vAxis: { title: 'FPS', minValue: 0 }
        });
    } catch (error) {
        console.error("Error drawing FPS chart:", error);
    }
}

function drawResolutionChart() {
    try {
        resolutionChart.draw(resolutionData, {
            ...chartOptions,
            title: 'Resolution',
            vAxis: { title: 'Pixels', minValue: 0 }
        });
    } catch (error) {
        console.error("Error drawing resolution chart:", error);
    }
}

function drawVirtualBgCostChart() {
    try {
        virtualBgCostChart.draw(virtualBgCostData, {
            ...chartOptions,
            title: 'Virtual Background Cost',
            vAxis: { title: 'Cost', minValue: 0 }
        });
    } catch (error) {
        console.error("Error drawing virtual background cost chart:", error);
    }
}

// Add settings toggle functionality
function toggleSettings() {
    const controls = document.querySelector('.controls');
    controls.classList.toggle('hidden');
    settingsToggleBtn.textContent = controls.classList.contains('hidden') ? 'Show Settings' : 'Hide Settings';
}

// Initialize everything after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Set default cat background for video containers
    if (localVideo) localVideo.innerHTML = '<div class="no-video"></div>';
    if (remoteVideo) remoteVideo.innerHTML = '<div class="no-video"></div>';

    // Initialize Google Charts
    google.charts.load('current', {'packages':['corechart']});
    google.charts.setOnLoadCallback(initializeCharts);

    // Populate video profiles
    if (videoProfileSelect) {
        videoProfileSelect.innerHTML = videoProfiles.map(profile => 
            `<option value="${profile.value}" title="${profile.detail}" ${profile.value === "720p_3" ? "selected" : ""}>${profile.label}</option>`
        ).join('');
    }

    // Populate regions
    if (geoFenceSelect) {
        geoFenceSelect.innerHTML = regions.map(region => 
            `<option value="${region.value}">${region.label}</option>`
        ).join('');
    }

    // Populate proxy modes
    if (cloudProxySelect) {
        cloudProxySelect.innerHTML = proxyModes.map(mode => 
            `<option value="${mode.value}" title="${mode.detail}">${mode.label}</option>`
        ).join('');
    }

    // Populate audio profiles
    if (audioProfileSelect) {
        audioProfileSelect.innerHTML = audioProfiles.map(profile => 
            `<option value='${typeof profile.value === 'string' ? profile.value : JSON.stringify(profile.value)}' title="${profile.detail}" ${profile.value === "speech_standard" ? "selected" : ""}>${profile.label}</option>`
        ).join('');
    }

    // Get devices
    getDevices();

    // Add event listeners
    if (joinBtn) joinBtn.addEventListener('click', joinChannel);
    if (leaveBtn) leaveBtn.addEventListener('click', leaveChannel);
    if (muteMicBtn) muteMicBtn.addEventListener('click', toggleMicrophone);
    if (muteCameraBtn) muteCameraBtn.addEventListener('click', toggleCamera);
    if (dualStreamBtn) dualStreamBtn.addEventListener('click', toggleDualStream);
    if (switchStreamBtn) switchStreamBtn.addEventListener('click', switchStream);
    if (virtualBgBtn) virtualBgBtn.addEventListener('click', toggleVirtualBackground);
    if (ainsBtn) ainsBtn.addEventListener('click', toggleAins);

    // Set initial button states
    if (leaveBtn) {
        leaveBtn.disabled = true;
        leaveBtn.style.opacity = '0.5';
    }
    
    [muteMicBtn, muteCameraBtn, dualStreamBtn, switchStreamBtn, virtualBgBtn, ainsBtn].forEach(btn => {
        if (btn) {
            btn.disabled = true;
            btn.style.opacity = '0.5';
        }
    });

    // Handle window resize for charts
    window.addEventListener('resize', () => {
        if (networkChart && fpsChart) {
            networkChart.draw(networkData, {
                title: 'Network Quality',
                vAxis: { title: 'Bitrate (Mbps)' }
            });
            fpsChart.draw(fpsData, {
                title: 'Frame Rate',
                vAxis: { title: 'FPS' }
            });
        }
    });

    // Add settings toggle button
    settingsToggleBtn = document.createElement('button');
    settingsToggleBtn.className = 'settings-toggle';
    settingsToggleBtn.textContent = 'Hide Settings';
    settingsToggleBtn.addEventListener('click', toggleSettings);
    document.body.appendChild(settingsToggleBtn);

    // Add video profile change handler
    videoProfileSelect.addEventListener('change', async () => {
        if (!localVideoTrack) {
            showPopup("No video track available");
            return;
        }

        try {
            const selectedProfile = videoProfileSelect.value;
            await localVideoTrack.setEncoderConfiguration(selectedProfile);
            showPopup(`Video profile updated to ${selectedProfile}`);
        } catch (error) {
            console.error("Error updating video profile:", error);
            showPopup("Failed to update video profile");
        }
    });

    // Add virtual background event listeners
    virtualBgTypeSelect.addEventListener('change', async () => {
        // Hide all groups first
        virtualBgColorGroup.style.display = 'none';
        virtualBgImgGroup.style.display = 'none';
        virtualBgVideoGroup.style.display = 'none';
        virtualBgBlurGroup.style.display = 'none';

        // Show relevant group based on selection
        switch (virtualBgTypeSelect.value) {
            case 'color':
                virtualBgColorGroup.style.display = 'flex';
                break;
            case 'img':
                virtualBgImgGroup.style.display = 'flex';
                break;
            case 'video':
                virtualBgVideoGroup.style.display = 'flex';
                break;
            case 'blur':
                virtualBgBlurGroup.style.display = 'flex';
                break;
        }

        if (isVirtualBackgroundEnabled) {
            await updateVirtualBackground();
        }
    });

    // Add virtual background control listeners
    virtualBgColorInput.addEventListener('input', async (e) => {
        colorValueDisplay.textContent = e.target.value;
        if (isVirtualBackgroundEnabled) {
            await updateVirtualBackground();
        }
    });

    virtualBgImgUrlInput.addEventListener('input', async () => {
        if (isVirtualBackgroundEnabled) {
            await updateVirtualBackground();
        }
    });

    virtualBgVideoUrlInput.addEventListener('input', async () => {
        if (isVirtualBackgroundEnabled) {
            await updateVirtualBackground();
        }
    });

    virtualBgBlurSelect.addEventListener('input', async (e) => {
        const value = parseInt(e.target.value);
        const blurValue = document.getElementById('blurValue');
        blurValue.textContent = value === 1 ? 'Low' : value === 2 ? 'Medium' : 'High';
        if (isVirtualBackgroundEnabled) {
            await updateVirtualBackground();
        }
    });

    // Add logo click handler for SVC controls
    const logo = document.querySelector('.logo');
    if (logo) {
        logo.style.cursor = 'pointer';
        logo.addEventListener('click', () => {
            logoClickCount++;
            if (logoClickTimeout) {
                clearTimeout(logoClickTimeout);
            }
            logoClickTimeout = setTimeout(() => {
                logoClickCount = 0;
            }, 3000);
            if (logoClickCount === 3) {
                svcPopup.classList.add('show');
                svcOverlay.classList.add('show');
                showPopup("🎮 You found the secret SVC controls!");
            }
        });
    }

    // Add SVC popup event listeners
    if (svcSaveBtn) svcSaveBtn.addEventListener('click', () => {
        saveSVCSettings();
        closeSVCPopup();
    });
    if (svcCancelBtn) svcCancelBtn.addEventListener('click', closeSVCPopup);
    if (svcOverlay) svcOverlay.addEventListener('click', closeSVCPopup);

    // Add enable SVC checkbox handler
    if (enableSVCCheckbox) {
        enableSVCCheckbox.addEventListener('change', (e) => {
            const svcControls = document.getElementById('svcControls');
            if (svcControls) {
                svcControls.style.display = e.target.checked ? 'block' : 'none';
                isSVCEnabled = e.target.checked;
                showPopup(e.target.checked ? "🎮 SVC enabled! Make sure to save before joining the call." : "SVC disabled");
            }
        });
    }

    // Initialize SVC popup content
    const svcPopupContent = document.querySelector('.svc-popup-content');
    if (svcPopupContent) {
        // Create container for user controls
        const usersContainer = document.createElement('div');
        usersContainer.id = 'svc-users-container';
        usersContainer.className = 'svc-users-container';
        
        // Add global controls at the top
        const globalControls = createSVCControlsForUser('all');
        if (globalControls) {
            globalControls.classList.add('svc-global-controls');
            usersContainer.appendChild(globalControls);
        }
        
        svcPopupContent.appendChild(usersContainer);
    }

    // Handle URL parameters and auto-join
    handleUrlParameters();

    // Initialize scale controls
    const scaleList = document.getElementById("scale-list");
    const touchBitrate = document.getElementById("touchBitrate");
    
    if (scaleList) {
        scaleList.addEventListener("change", setScale);
    }
    
    if (touchBitrate) {
        touchBitrate.addEventListener("change", setScale);
    }

    // Add function to initialize video layout
    initializeVideoLayout();
});

// Add function to close SVC popup
function closeSVCPopup() {
    svcPopup.classList.remove('show');
    svcOverlay.classList.remove('show');
}

// Add function to create SVC controls for a remote user
function createSVCControlsForUser(uid) {
    // Only create controls for 'all' (global) or remote users
    if (uid !== 'all' && uid === client?.uid) {
        return null;
    }

    const container = document.createElement('div');
    container.id = `svc-controls-${uid}`;
    container.className = 'svc-user-controls compact';
    
    const header = document.createElement('div');
    header.className = 'svc-header';
    header.innerHTML = uid === 'all' ? 'Global Settings' : `User ${uid}`;
    
    const controls = document.createElement('div');
    controls.className = 'svc-controls-grid';
    
    const sliders = [
        { name: 'spatial', label: 'S', min: 0, max: 3 },
        { name: 'temporal', label: 'T', min: 0, max: 3 }
    ];
    
    const controlRow = document.createElement('div');
    controlRow.className = 'svc-control-row';
    
    sliders.forEach(slider => {
        const sliderGroup = document.createElement('div');
        sliderGroup.className = 'svc-slider-group';
        
        const label = document.createElement('label');
        label.textContent = slider.label;
        
        const input = document.createElement('input');
        input.type = 'range';
        input.min = slider.min;
        input.max = slider.max;
        const layerName = `${slider.name}Layer`;
        input.value = uid === 'all' ? svcSettings.all[layerName] : (svcSettings.users[uid]?.[layerName] ?? svcSettings.all[layerName]);
        input.className = 'svc-slider';
        input.id = uid === 'all' ? `global-${slider.name}` : `${layerName}-${uid}`;
        
        const value = document.createElement('span');
        value.className = 'svc-value';
        value.id = uid === 'all' ? `global-${slider.name}-value` : `${layerName}-value-${uid}`;
        value.textContent = input.value;
        
        input.oninput = async function() {
            const newValue = parseInt(this.value);
            const valueSpan = document.getElementById(uid === 'all' ? `global-${slider.name}-value` : `${layerName}-value-${uid}`);
            if (valueSpan) {
                valueSpan.textContent = newValue;
            }
            
            if (uid === 'all') {
                // Update global settings
                svcSettings.all[layerName] = newValue;
                
                // Update all user controls to match global and apply immediately
                Object.keys(remoteUsers).forEach(async (userId) => {
                    const userSlider = document.getElementById(`${layerName}-${userId}`);
                    const userValue = document.getElementById(`${layerName}-value-${userId}`);
                    
                    if (userSlider) {
                        userSlider.value = newValue;
                    }
                    if (userValue) {
                        userValue.textContent = newValue;
                    }
                    
                    if (!svcSettings.users[userId]) {
                        svcSettings.users[userId] = { ...svcSettings.all };
                    }
                    svcSettings.users[userId][layerName] = newValue;

                    // Apply changes immediately
                    await applySVCForUser(userId);
                });
            } else {
                if (!svcSettings.users[uid]) {
                    svcSettings.users[uid] = { ...svcSettings.all };
                }
                svcSettings.users[uid][layerName] = newValue;
                // Apply changes immediately for individual user
                await applySVCForUser(uid);
            }
        };
        
        sliderGroup.appendChild(label);
        sliderGroup.appendChild(input);
        sliderGroup.appendChild(value);
        controlRow.appendChild(sliderGroup);
    });
    
    controls.appendChild(controlRow);
    container.appendChild(header);
    container.appendChild(controls);
    return container;
}

// Add function to apply SVC settings to a specific user
async function applySVCForUser(uid) {
    if (!isSVCEnabled) return;
    
    try {
        const settings = uid === 'all' ? svcSettings.all : svcSettings.users[uid];
        
        if (uid === 'all') {
            // Apply to all users and update their UI
            const promises = Object.keys(remoteUsers).map(async (userId) => {
                const numericUid = Number(userId);
                svcSettings.users[userId] = { ...settings };
                
                // Update UI for this user
                const spatialSlider = document.getElementById(`spatialLayer-${userId}`);
                const temporalSlider = document.getElementById(`temporalLayer-${userId}`);
                const spatialValue = document.getElementById(`spatialLayer-value-${userId}`);
                const temporalValue = document.getElementById(`temporalLayer-value-${userId}`);
                
                if (spatialSlider) spatialSlider.value = settings.spatialLayer;
                if (temporalSlider) temporalSlider.value = settings.temporalLayer;
                if (spatialValue) spatialValue.textContent = settings.spatialLayer;
                if (temporalValue) temporalValue.textContent = settings.temporalLayer;

                // Update layers and apply SVC settings
                if (!layers[numericUid]) {
                    layers[numericUid] = {};
                }
                layers[numericUid].spatialLayer = settings.spatialLayer;
                layers[numericUid].temporalLayer = settings.temporalLayer;

                // Apply to remote stream
                const remoteUser = remoteUsers[userId];
                if (remoteUser && remoteUser.videoTrack) {
                    await client.pickSVCLayer(numericUid, {
                        spatialLayer: layers[numericUid].spatialLayer,
                        temporalLayer: layers[numericUid].temporalLayer
                    });
                }
            });
            await Promise.all(promises);
            showPopup("Applied SVC settings to all users");
        } else {
            // Apply to single user
            const numericUid = Number(uid);
            if (!layers[numericUid]) {
                layers[numericUid] = {};
            }
            layers[numericUid].spatialLayer = settings.spatialLayer;
            layers[numericUid].temporalLayer = settings.temporalLayer;

            if (remoteUsers[uid] && remoteUsers[uid].videoTrack) {
                await client.pickSVCLayer(numericUid, {
                    spatialLayer: layers[numericUid].spatialLayer,
                    temporalLayer: layers[numericUid].temporalLayer
                });
            }
            showPopup(`Applied SVC settings to user ${uid}`);
        }
    } catch (error) {
        console.error("Error applying SVC settings:", error);
        showPopup(`Failed to apply SVC settings: ${error.message}`);
    }
}

// Add function to save SVC settings
function saveSVCSettings() {
    isSVCEnabled = document.getElementById('enableSVC').checked;
    
    if (isSVCEnabled) {
        // Set SVC parameters
        AgoraRTC.setParameter("SVC", ["vp9"]);
        AgoraRTC.setParameter("ENABLE_AUT_CC", true);
        
        showPopup("SVC settings saved and enabled");
    } else {
        showPopup("SVC disabled");
    }
}

// Add function to update SVC layers
async function updateSVCLayers() {
    if (!client || !isSVCEnabled) {
        showPopup("Cannot update SVC layers - SVC not enabled");
        return;
    }

    try {
        const spatialLayer = parseInt(document.getElementById('spatialLayer').value);
        const temporalLayer = parseInt(document.getElementById('temporalLayer').value);

        // Update global settings and UI
        svcSettings.all.spatialLayer = spatialLayer;
        svcSettings.all.temporalLayer = temporalLayer;

        // Update the global control values
        const spatialValue = document.getElementById('spatialLayer-value-all');
        const temporalValue = document.getElementById('temporalLayer-value-all');
        if (spatialValue) spatialValue.textContent = spatialLayer;
        if (temporalValue) temporalValue.textContent = temporalLayer;

        // Update all user controls to match global
        Object.keys(remoteUsers).forEach(userId => {
            const userSpatialSlider = document.getElementById(`spatialLayer-${userId}`);
            const userTemporalSlider = document.getElementById(`temporalLayer-${userId}`);
            const userSpatialValue = document.getElementById(`spatialLayer-value-${userId}`);
            const userTemporalValue = document.getElementById(`temporalLayer-value-${userId}`);
            
            if (userSpatialSlider && userSpatialValue) {
                userSpatialSlider.value = spatialLayer;
                userSpatialValue.textContent = spatialLayer;
            }
            if (userTemporalSlider && userTemporalValue) {
                userTemporalSlider.value = temporalLayer;
                userTemporalValue.textContent = temporalLayer;
            }
            
            if (!svcSettings.users[userId]) {
                svcSettings.users[userId] = { ...svcSettings.all };
            }
            svcSettings.users[userId].spatialLayer = spatialLayer;
            svcSettings.users[userId].temporalLayer = temporalLayer;
        });

        showPopup(`Updated SVC layers - Spatial: ${spatialLayer}, Temporal: ${temporalLayer}`);
    } catch (error) {
        console.error("Error updating SVC layers:", error);
        showPopup("Failed to update SVC layers");
    }
}

// Add toggle for SVC controls
function toggleSVCControls() {
    const svcPopup = document.querySelector('.svc-popup');
    svcPopup.classList.toggle('show');
    svcOverlay.classList.toggle('show');
}

// Add function to set scale
document.getElementById("scale-list").addEventListener("change", setScale);
document.getElementById("touchBitrate").addEventListener("change", setScale);

async function setScale() {
  if (joined) {
    scaleValue = parseFloat(document.getElementById("scale-list").value);
    const rtpconnections = client._p2pChannel.connection.peerConnection.getSenders();
    const videosender = rtpconnections.find((val) => val?.track?.kind === 'video');

    if (!videosender) {
      console.warn("No video sender found.");
      showPopup("No video sender found");
      return;
    }

    const params = videosender.getParameters();
    if (!params.encodings || params.encodings.length === 0) {
      params.encodings = [{}]; // Ensure encodings array exists
    }

    params.encodings[0].scaleResolutionDownBy = scaleValue;

    if (document.getElementById("touchBitrate").checked) {
      const bitrate = Math.floor(580000 / scaleValue);
      params.encodings[0].maxBitrate = bitrate;
      showPopup(`Scale set to ${scaleValue}x with bitrate adjusted to ${bitrate} bps`);
    } else {
      showPopup(`Scale set to ${scaleValue}x (bitrate unchanged)`);
    }

    await videosender.setParameters(params);
  } else {
    showPopup("Join first");
  }
}

// Add new function for invite link
function copyInviteLink() {
    const appId = appIdInput.value;
    const channelName = channelNameInput.value;
    
    if (!appId || !channelName) {
        showPopup("Please enter App ID and Channel Name first");
        return;
    }
    
    // Build URL with all parameters
    const params = new URLSearchParams();
    params.set('appId', appId);
    params.set('channel', channelName);
    
    // Add optional parameters if they have values
    if (tokenInput.value) params.set('token', tokenInput.value);
    if (userIdInput.value) params.set('uid', userIdInput.value);
    if (videoProfileSelect.value) params.set('videoProfile', videoProfileSelect.value);
    if (audioProfileSelect.value) params.set('audioProfile', audioProfileSelect.value);
    if (cloudProxySelect.value !== "0") params.set('cloudProxy', cloudProxySelect.value);
    if (geoFenceSelect.value !== "GLOBAL") params.set('geoFence', geoFenceSelect.value);
    
    // Add SVC parameters if enabled
    const enableSVCCheckbox = document.getElementById('enableSVC');
    if (enableSVCCheckbox) {
        params.set('svc', enableSVCCheckbox.checked.toString());
        if (enableSVCCheckbox.checked) {
            params.set('spatialLayer', svcSettings.all.spatialLayer.toString());
            params.set('temporalLayer', svcSettings.all.temporalLayer.toString());
        }
    }
    
    // Set autoJoin to false by default
    params.set('autoJoin', 'false');
    
    const inviteUrl = `${baseUrl}?${params.toString()}`;
    const inviteLinkInput = document.getElementById('inviteLink');
    inviteLinkInput.value = inviteUrl;
    
    // Copy to clipboard
    inviteLinkInput.select();
    document.execCommand('copy');
    
    showPopup("Invite link copied to clipboard!");
}

// Add function to handle URL parameters and auto-join
function handleUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Set values from URL parameters if they exist
    if (urlParams.has('appId')) appIdInput.value = urlParams.get('appId');
    if (urlParams.has('channel')) channelNameInput.value = urlParams.get('channel');
    if (urlParams.has('token')) tokenInput.value = urlParams.get('token');
    if (urlParams.has('uid')) userIdInput.value = urlParams.get('uid');
    
    // Handle select inputs
    if (urlParams.has('videoProfile')) {
        const videoProfile = urlParams.get('videoProfile');
        if ([...videoProfileSelect.options].some(opt => opt.value === videoProfile)) {
            videoProfileSelect.value = videoProfile;
        }
    }
    
    if (urlParams.has('audioProfile')) {
        const audioProfile = urlParams.get('audioProfile');
        if ([...audioProfileSelect.options].some(opt => opt.value === audioProfile)) {
            audioProfileSelect.value = audioProfile;
        }
    }
    
    if (urlParams.has('cloudProxy')) {
        const cloudProxy = urlParams.get('cloudProxy');
        if ([...cloudProxySelect.options].some(opt => opt.value === cloudProxy)) {
            cloudProxySelect.value = cloudProxy;
        }
    }
    
    if (urlParams.has('geoFence')) {
        const geoFence = urlParams.get('geoFence');
        if ([...geoFenceSelect.options].some(opt => opt.value === geoFence)) {
            geoFenceSelect.value = geoFence;
        }
    }

    // Handle SVC settings
    if (urlParams.has('svc')) {
        const svcEnabled = urlParams.get('svc') === 'true';
        const enableSVCCheckbox = document.getElementById('enableSVC');
        if (enableSVCCheckbox) {
            enableSVCCheckbox.checked = svcEnabled;
            const svcControls = document.getElementById('svcControls');
            if (svcControls) {
                svcControls.style.display = svcEnabled ? 'block' : 'none';
            }
            isSVCEnabled = svcEnabled;
        }

        // Handle SVC layer settings if provided
        if (svcEnabled) {
            if (urlParams.has('spatialLayer')) {
                const spatialLayer = parseInt(urlParams.get('spatialLayer'));
                if (!isNaN(spatialLayer) && spatialLayer >= 0 && spatialLayer <= 3) {
                    svcSettings.all.spatialLayer = spatialLayer;
                }
            }
            if (urlParams.has('temporalLayer')) {
                const temporalLayer = parseInt(urlParams.get('temporalLayer'));
                if (!isNaN(temporalLayer) && temporalLayer >= 0 && temporalLayer <= 3) {
                    svcSettings.all.temporalLayer = temporalLayer;
                }
            }
        }
    }
    
    // Auto-join if parameter is present and set to true
    if (urlParams.has('autoJoin') && 
        urlParams.get('autoJoin') === 'true' && 
        urlParams.has('appId') && 
        urlParams.has('channel')) {
        // Small delay to ensure everything is initialized
        setTimeout(() => {
            joinChannel();
        }, 1000);
    }
}

// Add keyboard shortcut for SVC popup
document.addEventListener('keydown', (e) => {
    if (e.key && e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey && 
        !(document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA')) {
        const svcPopup = document.querySelector('.svc-popup');
        const svcOverlay = document.querySelector('.svc-popup-overlay');
        if (svcPopup && svcOverlay) {
            svcPopup.classList.add('show');
            svcOverlay.classList.add('show');
            showPopup("🎮 SVC controls opened!");
        }
    }
});

// Add function to initialize video layout
function initializeVideoLayout() {
    const container = document.querySelector('.video-container');
    const localVideoWrapper = document.getElementById('localVideo').parentElement;
    const remoteVideoContainer = document.getElementById('remoteVideo');
    
    // Create first row
    const firstRow = document.createElement('div');
    firstRow.className = 'first-row';
    firstRow.appendChild(localVideoWrapper);
    
    // Rearrange elements
    container.innerHTML = '';
    container.appendChild(firstRow);
    container.appendChild(remoteVideoContainer);
}
