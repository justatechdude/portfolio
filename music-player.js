/**
 * Ambient Background Music Player
 * Track: "Sleepwalking" by Flawed Mangoes (YouTube: 9zoreg5Qxv0)
 * 
 * Auto-injects floating audio controller & click-to-play ambient audio.
 * Simply include this script on any page: <script src="music-player.js"></script>
 */

(function () {
  const YOUTUBE_VIDEO_ID = '9zoreg5Qxv0';
  let ytPlayer = null;
  let isAudioPlaying = false;
  let hasUserInteracted = false;
  let pendingPlay = false;

  // 1. Inject Styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes eqPulse {
      0%, 100% { height: 3px; }
      50% { height: 13px; }
    }
    .eq-animating .eq-bar:nth-child(1) { animation: eqPulse 0.8s ease-in-out infinite; }
    .eq-animating .eq-bar:nth-child(2) { animation: eqPulse 0.6s ease-in-out infinite 0.2s; }
    .eq-animating .eq-bar:nth-child(3) { animation: eqPulse 0.7s ease-in-out infinite 0.4s; }
    .music-widget-glow {
      box-shadow: 0 0 20px -3px rgba(239, 68, 68, 0.35);
    }
  `;
  document.head.appendChild(style);

  // 2. Build DOM Components once body is available
  function initPlayerDOM() {
    // Hidden YouTube Container
    const ytContainer = document.createElement('div');
    ytContainer.id = 'yt-audio-container';
    ytContainer.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';
    ytContainer.setAttribute('aria-hidden', 'true');
    ytContainer.innerHTML = '<div id="youtube-audio-player"></div>';
    document.body.appendChild(ytContainer);

    // Floating Music Pill
    const widget = document.createElement('div');
    widget.id = 'music-widget';
    widget.className = 'fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-2.5 rounded-full bg-zinc-950/90 border border-zinc-800 hover:border-red-600/70 shadow-2xl backdrop-blur-md transition-all duration-300 select-none music-widget-glow';
    widget.innerHTML = `
      <button id="music-toggle-btn" type="button" aria-label="Toggle ambient music" class="w-8 h-8 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-all focus:outline-none cursor-pointer">
        <svg id="music-play-icon" class="w-4 h-4 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z"/>
        </svg>
        <svg id="music-pause-icon" class="w-4 h-4 hidden" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
        </svg>
      </button>

      <div class="flex flex-col pr-1 cursor-pointer" id="music-info-area">
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold text-white tracking-tight">Sleepwalking</span>
          <div id="equalizer-bars" class="flex items-end gap-0.5 h-3 opacity-70">
            <span class="eq-bar w-0.5 bg-red-500 rounded-full h-1"></span>
            <span class="eq-bar w-0.5 bg-red-500 rounded-full h-2.5"></span>
            <span class="eq-bar w-0.5 bg-red-500 rounded-full h-1.5"></span>
          </div>
        </div>
        <span class="text-[10px] text-zinc-400 font-medium">Flawed Mangoes • <span id="music-status" class="text-red-400">Click anywhere to play</span></span>
      </div>
    `;
    document.body.appendChild(widget);

    // Setup Event Listeners
    setupControls();
  }

  // 3. YouTube API & Controls
  function setupControls() {
    const toggleBtn = document.getElementById('music-toggle-btn');
    const infoArea = document.getElementById('music-info-area');

    function toggleAudio(e) {
      if (e) e.stopPropagation();
      hasUserInteracted = true;
      document.removeEventListener('click', handleFirstUserClick);

      if (isAudioPlaying) {
        pausePlaying();
      } else {
        startPlaying();
      }
    }

    if (toggleBtn) toggleBtn.addEventListener('click', toggleAudio);
    if (infoArea) infoArea.addEventListener('click', toggleAudio);

    // Click anywhere on the document to start playing ambient audio
    function handleFirstUserClick(e) {
      if (hasUserInteracted) return;
      hasUserInteracted = true;
      startPlaying();
      document.removeEventListener('click', handleFirstUserClick);
    }
    document.addEventListener('click', handleFirstUserClick);
  }

  function startPlaying() {
    if (ytPlayer && typeof ytPlayer.playVideo === 'function') {
      ytPlayer.playVideo();
    } else {
      pendingPlay = true;
    }
  }

  function pausePlaying() {
    if (ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
      ytPlayer.pauseVideo();
    }
  }

  // 4. Global YouTube Callback
  window.onYouTubeIframeAPIReady = function () {
    ytPlayer = new YT.Player('youtube-audio-player', {
      height: '1',
      width: '1',
      videoId: YOUTUBE_VIDEO_ID,
      playerVars: {
        autoplay: 0,
        controls: 0,
        loop: 1,
        playlist: YOUTUBE_VIDEO_ID,
        enablejsapi: 1,
        playsinline: 1,
        origin: window.location.origin || '*'
      },
      events: {
        onReady: function () {
          ytPlayer.setVolume(50);
          if (pendingPlay) startPlaying();
        },
        onStateChange: function (event) {
          const playIcon = document.getElementById('music-play-icon');
          const pauseIcon = document.getElementById('music-pause-icon');
          const eqBars = document.getElementById('equalizer-bars');
          const musicStatus = document.getElementById('music-status');

          if (event.data === YT.PlayerState.PLAYING) {
            isAudioPlaying = true;
            if (playIcon) playIcon.classList.add('hidden');
            if (pauseIcon) pauseIcon.classList.remove('hidden');
            if (eqBars) eqBars.classList.add('eq-animating');
            if (musicStatus) {
              musicStatus.textContent = 'Ambient audio playing';
              musicStatus.className = 'text-green-400';
            }
          } else {
            isAudioPlaying = false;
            if (playIcon) playIcon.classList.remove('hidden');
            if (pauseIcon) pauseIcon.classList.add('hidden');
            if (eqBars) eqBars.classList.remove('eq-animating');
            if (musicStatus) {
              musicStatus.textContent = 'Paused • Click to resume';
              musicStatus.className = 'text-zinc-400';
            }
          }
        }
      }
    });
  };

  // 5. Load YouTube IFrame API Script
  const ytScript = document.createElement('script');
  ytScript.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(ytScript);

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPlayerDOM);
  } else {
    initPlayerDOM();
  }
})();
