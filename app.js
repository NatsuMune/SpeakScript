let recognition = null;
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const status = document.getElementById('status');
const output = document.getElementById('output');
const languageSelect = document.getElementById('languageSelect');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');
const confirmDialog = document.getElementById('confirmDialog');
const confirmBtn = document.getElementById('confirmBtn');
const cancelBtn = document.getElementById('cancelBtn');
const pwaPrompt = document.getElementById('pwaPrompt');
const closePwaPrompt = document.getElementById('closePwaPrompt');

let isRecording = false;

// Check if speech recognition is supported
if (!('webkitSpeechRecognition' in window)) {
    status.textContent = 'Speech recognition not supported';
    startBtn.disabled = true;
    stopBtn.disabled = true;
    languageSelect.disabled = true;
}

// Check if the app is running as a PWA
const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
              window.navigator.standalone;

// Show PWA prompt if not running as PWA
if (!isPWA) {
    // Wait a bit before showing the prompt
    setTimeout(() => {
        pwaPrompt.classList.add('show');
    }, 2000);
}

// Close PWA prompt (just hide it temporarily)
closePwaPrompt.addEventListener('click', () => {
    pwaPrompt.classList.remove('show');
});

function formatTimestamp(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

function createTranscriptEntry(timestamp, language, text) {
    const entry = document.createElement('div');
    entry.className = 'transcript-entry';

    const meta = document.createElement('div');
    meta.className = 'transcript-meta';

    const timeSpan = document.createElement('span');
    timeSpan.className = 'transcript-time';
    timeSpan.textContent = timestamp;
    meta.appendChild(timeSpan);

    const langSpan = document.createElement('span');
    langSpan.className = 'transcript-language';
    langSpan.textContent = language;
    meta.appendChild(langSpan);

    const textDiv = document.createElement('div');
    textDiv.className = 'transcript-text';
    textDiv.textContent = text;

    entry.appendChild(meta);
    entry.appendChild(textDiv);

    return entry;
}

function showCopyFeedback() {
    const originalText = copyBtn.querySelector('span').textContent;
    const originalSvg = copyBtn.querySelector('svg').innerHTML;
    
    // Change to checkmark
    copyBtn.querySelector('span').textContent = 'Copied!';
    copyBtn.querySelector('svg').innerHTML = '<path d="M0 0h24v24H0z" fill="none"/><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>';
    
    // Revert after 2 seconds
    setTimeout(() => {
        copyBtn.querySelector('span').textContent = originalText;
        copyBtn.querySelector('svg').innerHTML = originalSvg;
    }, 2000);
}

async function copyTranscript() {
    let text = '';
    const entries = output.getElementsByClassName('transcript-entry');
    
    for (const entry of entries) {
        const time = entry.querySelector('.transcript-time').textContent;
        const lang = entry.querySelector('.transcript-language').textContent;
        const content = entry.querySelector('.transcript-text').textContent;
        text += `[${time} - ${lang}] ${content}\n`;
    }
    
    if (text) {
        // Try using the newer Clipboard API first
        if (navigator.clipboard && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(text);
                showCopyFeedback();
                return;
            } catch (err) {
                console.error('Clipboard API failed:', err);
                // Fall through to fallback
            }
        }

        // Fallback for iOS
        try {
            // Create temporary textarea
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            
            // Select and copy
            textArea.focus();
            textArea.select();
            const successful = document.execCommand('copy');
            textArea.remove();

            if (successful) {
                showCopyFeedback();
            } else {
                throw new Error('execCommand failed');
            }
        } catch (err) {
            console.error('Fallback copy failed:', err);
            // Show error message
            const originalText = copyBtn.querySelector('span').textContent;
            copyBtn.querySelector('span').textContent = 'Copy failed';
            setTimeout(() => {
                copyBtn.querySelector('span').textContent = originalText;
            }, 2000);
        }
    }
}

function showConfirmDialog() {
    confirmDialog.classList.add('active');
}

function hideConfirmDialog() {
    confirmDialog.classList.remove('active');
}

function clearTranscript() {
    output.innerHTML = '';
    hideConfirmDialog();
}

function createRecognition() {
    if (recognition) {
        recognition.stop();
        recognition = null;
    }

    recognition = new webkitSpeechRecognition();
    
    // Set recognition properties
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = languageSelect.value || 'en-US';

    recognition.onstart = () => {
        isRecording = true;
        status.textContent = `Listening in ${languageSelect.options[languageSelect.selectedIndex].text}...`;
        startBtn.disabled = true;
        stopBtn.disabled = false;
        languageSelect.disabled = false;
    };

    recognition.onend = () => {
        if (isRecording) {
            recognition.start();
        } else {
            status.textContent = 'Click Start to begin recording';
            startBtn.disabled = false;
            stopBtn.disabled = true;
        }
    };

    recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const transcript = result[0].transcript;
            
            if (result.isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }

        if (finalTranscript) {
            const timestamp = formatTimestamp(new Date());
            const language = languageSelect.options[languageSelect.selectedIndex].text;
            const entry = createTranscriptEntry(timestamp, language, finalTranscript);
            output.appendChild(entry);
            output.scrollTop = output.scrollHeight;
        }
    };

    recognition.onerror = (event) => {
        console.error('Recognition error:', event.error);
        
        if (event.error === 'network') {
            status.textContent = 'Network error. Please check your internet connection.';
        } else if (event.error === 'not-allowed') {
            status.textContent = 'Microphone access denied. Please allow microphone access.';
        } else if (event.error === 'no-speech') {
            status.textContent = 'No speech detected. Please try again.';
        } else {
            status.textContent = `Error: ${event.error}`;
        }

        isRecording = false;
        startBtn.disabled = false;
        stopBtn.disabled = true;
    };

    return recognition;
}

// Event Listeners
languageSelect.addEventListener('change', () => {
    if (isRecording) {
        const selectedLanguage = languageSelect.options[languageSelect.selectedIndex].text;
        status.textContent = `Switching to ${selectedLanguage}...`;
        
        if (recognition) {
            recognition.stop();
            recognition = createRecognition();
            recognition.start();
        }
    }
});

startBtn.addEventListener('click', () => {
    isRecording = true;
    recognition = createRecognition();
    
    try {
        recognition.start();
    } catch (error) {
        console.error('Failed to start recognition:', error);
        status.textContent = 'Failed to start recognition. Please try again.';
        isRecording = false;
        startBtn.disabled = false;
        stopBtn.disabled = true;
    }
});

stopBtn.addEventListener('click', () => {
    isRecording = false;
    if (recognition) {
        recognition.stop();
        recognition = null;
    }
    startBtn.disabled = false;
    stopBtn.disabled = true;
});

copyBtn.addEventListener('click', copyTranscript);
clearBtn.addEventListener('click', showConfirmDialog);
confirmBtn.addEventListener('click', clearTranscript);
cancelBtn.addEventListener('click', hideConfirmDialog);

// Close dialog when clicking outside
confirmDialog.addEventListener('click', (e) => {
    if (e.target === confirmDialog) {
        hideConfirmDialog();
    }
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden && recognition) {
        isRecording = false;
        recognition.stop();
        recognition = null;
        startBtn.disabled = false;
        stopBtn.disabled = true;
    }
});
 