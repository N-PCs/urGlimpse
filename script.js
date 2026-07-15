(() => {
  "use strict";

  const preview = document.getElementById("preview");
  const playback = document.getElementById("playback");
  const placeholder = document.getElementById("placeholder");
  const result = document.getElementById("result");
  const recIndicator = document.getElementById("recIndicator");
  const recTimer = document.getElementById("recTimer");
  const downloadBtn = document.getElementById("downloadBtn");
  const deleteBtn = document.getElementById("deleteBtn");

  const startBtn = document.getElementById("startBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const resumeBtn = document.getElementById("resumeBtn");
  const stopBtn = document.getElementById("stopBtn");

  let mediaRecorder = null;
  let recordedChunks = [];
  let combinedStream = null;
  let micStream = null;
  let timerInterval = null;
  let elapsedSeconds = 0;
  let lastBlobUrl = null;

  const prefersVisible = typeof navigator !== "undefined" &&
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getDisplayMedia === "function";

  function formatTime(totalSeconds) {
    const m = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const s = String(totalSeconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  function startTimer() {
    elapsedSeconds = 0;
    recTimer.textContent = formatTime(elapsedSeconds);
    timerInterval = setInterval(() => {
      elapsedSeconds += 1;
      recTimer.textContent = formatTime(elapsedSeconds);
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function setRecordingUI(isRecording) {
    startBtn.disabled = isRecording;
    stopBtn.disabled = !isRecording;
    pauseBtn.disabled = !isRecording;
    resumeBtn.disabled = true;
    recIndicator.hidden = !isRecording;
    recIndicator.classList.remove("rec-indicator--paused");
    placeholder.style.display = isRecording ? "none" : "flex";
  }

  function resetForNewRecording() {
    result.hidden = true;
    if (lastBlobUrl) {
      URL.revokeObjectURL(lastBlobUrl);
      lastBlobUrl = null;
    }
    recordedChunks = [];
  }

  function discardRecording() {
    if (lastBlobUrl) {
      URL.revokeObjectURL(lastBlobUrl);
      lastBlobUrl = null;
    }
    recordedChunks = [];
    downloadBtn.removeAttribute("href");
    playback.removeAttribute("src");
    playback.load();
    result.hidden = true;
  }

  async function startRecording() {
    if (!prefersVisible) {
      alert("Screen capture is not supported in this browser. Please use Chrome, Edge, or another Chromium-based browser.");
      return;
    }

    resetForNewRecording();

    let screenStream;
    try {
      screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: true,
      });
    } catch (err) {
      console.error(err);
      alert("Screen sharing was cancelled or is unavailable.");
      return;
    }

    // Try to add microphone audio; fall back gracefully if denied/unavailable.
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      console.warn("Microphone access not granted:", err);
      micStream = null;
    }

    combinedStream = new MediaStream();

    screenStream.getVideoTracks().forEach((track) => {
      combinedStream.addTrack(track);
      // When the user stops sharing via the browser UI, end the recording.
      track.addEventListener("ended", () => {
        if (mediaRecorder && mediaRecorder.state !== "inactive") {
          stopRecording();
        }
      });
    });

    // Prefer the microphone for audio; otherwise use system/tab audio if present.
    const audioTracks = micStream ? micStream.getAudioTracks() : [];
    if (audioTracks.length > 0) {
      audioTracks.forEach((track) => combinedStream.addTrack(track));
    } else {
      screenStream.getAudioTracks().forEach((track) => combinedStream.addTrack(track));
    }

    preview.srcObject = combinedStream;
    preview.muted = true;

    let options = { mimeType: "video/webm;codecs=vp9,opus" };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: "video/webm;codecs=vp8,opus" };
    }
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: "video/webm" };
    }

    try {
      mediaRecorder = new MediaRecorder(combinedStream, options);
    } catch (err) {
      console.error(err);
      alert("MediaRecorder could not be initialized.");
      return;
    }

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      lastBlobUrl = URL.createObjectURL(blob);

      playback.src = lastBlobUrl;
      downloadBtn.href = lastBlobUrl;
      result.hidden = false;

      stopTimer();
      setRecordingUI(false);

      // Clean up live streams.
      combinedStream.getTracks().forEach((track) => track.stop());
      if (micStream) {
        micStream.getTracks().forEach((track) => track.stop());
        micStream = null;
      }
      preview.srcObject = null;
      placeholder.style.display = "flex";
    };

    mediaRecorder.start(1000);
    startTimer();
    setRecordingUI(true);
  }

  function pauseRecording() {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.pause();
      pauseBtn.disabled = true;
      resumeBtn.disabled = false;
      recIndicator.classList.add("rec-indicator--paused");
      recTimer.textContent = formatTime(elapsedSeconds) + " (paused)";
    }
  }

  function resumeRecording() {
    if (mediaRecorder && mediaRecorder.state === "paused") {
      mediaRecorder.resume();
      pauseBtn.disabled = false;
      resumeBtn.disabled = true;
      recIndicator.classList.remove("rec-indicator--paused");
      recTimer.textContent = formatTime(elapsedSeconds);
    }
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
  }

  startBtn.addEventListener("click", startRecording);
  pauseBtn.addEventListener("click", pauseRecording);
  resumeBtn.addEventListener("click", resumeRecording);
  stopBtn.addEventListener("click", stopRecording);
  deleteBtn.addEventListener("click", discardRecording);
})();
