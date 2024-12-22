let recognition = null;
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const status = document.getElementById('status');
const output = document.getElementById('output');
const languageSelect = document.getElementById('languageSelect');

let isRecording = false;

// Check if speech recognition is supported
if (!('webkitSpeechRecognition' in window)) {
    status.textContent = 'Speech recognition not supported';
    startBtn.disabled = true;
    stopBtn.disabled = true;
    languageSelect.disabled = true;
}

function formatTimestamp(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

function getLanguageCode(fullCode) {
    const langMap = {
        'en': 'EN',
        'es': 'ES',
        'fr': 'FR',
        'de': 'DE',
        'it': 'IT',
        'pt': 'PT',
        'ru': 'RU',
        'ja': 'JA',
        'ko': 'KO',
        'zh': 'ZH'
    };
    const mainLang = fullCode.split('-')[0].toLowerCase();
    return langMap[mainLang] || mainLang.toUpperCase();
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
    recognition.lang = languageSelect.value || 'en-US'; // Default to English if no language selected

    recognition.onstart = () => {
        isRecording = true;
        status.textContent = `Listening in ${languageSelect.options[languageSelect.selectedIndex].text}...`;
        startBtn.disabled = true;
        stopBtn.disabled = false;
        languageSelect.disabled = false; // Allow language switching during recording
    };

    recognition.onend = () => {
        if (isRecording) {
            // Restart recognition if it was stopped unexpectedly
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
            const langCode = getLanguageCode(languageSelect.value);
            output.value += `_${timestamp}_ \`${langCode}\` ${finalTranscript}\n\n`;
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

// Handle language change during recording
languageSelect.addEventListener('change', () => {
    if (isRecording) {
        const selectedLanguage = languageSelect.options[languageSelect.selectedIndex].text;
        status.textContent = `Switching to ${selectedLanguage}...`;
        
        // Restart recognition with new language
        if (recognition) {
            recognition.stop();
            recognition = createRecognition();
            recognition.start();
        }
    }
});

startBtn.addEventListener('click', () => {
    output.value = '';
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

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => console.log('ServiceWorker registered'))
            .catch(err => console.log('ServiceWorker registration failed:', err));
    });
} 