# Speech to Text PWA

## Description
Speech to Text PWA is a Progressive Web Application that allows users to convert spoken language into text. It supports multiple languages and provides a user-friendly interface for recording, displaying, and managing transcripts.

## Features
- **Speech Recognition:** Utilizes the Web Speech API for real-time speech recognition.
- **Multi-Language Support:** Choose from various languages for speech recognition.
- **Transcript Management:** View, copy, and clear transcripts easily.
- **Responsive Design:** Optimized for both desktop and mobile devices.
- **Microphone Access:** Requests microphone permission upon loading.

## Technologies Used
- HTML
- CSS
- JavaScript
- Web Speech API
- Express.js (for serving the application)

## Installation

### Prerequisites
- Node.js and npm installed on your machine.

### Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/speech-to-text-pwa.git
   cd speech-to-text-pwa
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. Open your browser and navigate to `http://localhost:3000`.

## Usage
1. Select your preferred language from the dropdown menu.
2. Click the "Start Recording" button to begin capturing speech.
3. Speak clearly into your microphone.
4. The recognized text will appear in the transcript area.
5. Use the "Copy" button to copy the transcript to your clipboard or "Clear" to remove all entries.