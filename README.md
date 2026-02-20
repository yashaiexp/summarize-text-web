# AI Text Summarizer

A clean, responsive web application that uses free LLM APIs (Groq or Google Gemini) to generate concise summaries of text input. Built with HTML, CSS, JavaScript, and Node.js.

## Features

- ✨ **Modern UI**: Clean, responsive design that works on desktop and mobile
- 🤖 **LLM Integration**: Supports Groq and Google Gemini APIs
- 🔒 **Secure**: API keys stored server-side in `.env` (never exposed to browser)
- ⚡ **Fast**: Quick summarization with real-time status updates
- 📋 **Copy to Clipboard**: Easy copy functionality for generated summaries
- 🔄 **Fallback**: Local summarization algorithm if API fails
- 📊 **Live Stats**: Real-time word and character count

## Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** (comes with Node.js)
- An API key from either:
  - [Groq](https://console.groq.com/) (free tier available)
  - [Google Gemini](https://makersuite.google.com/app/apikey) (free tier available)

## Installation

1. **Clone or download this repository**

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` and add your API key(s):**
   ```env
   # Add at least one API key (or both)
   GROQ_API_KEY=your_groq_api_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   
   # Optional: Customize models
   GROQ_MODEL=llama-3.1-8b-instant
   GEMINI_MODEL=gemini-1.5-flash
   
   # Optional: Change port (default: 3000)
   PORT=3000
   ```

## Getting API Keys

### Groq API Key

1. Visit [Groq Console](https://console.groq.com/)
2. Sign up or log in
3. Navigate to **API Keys** section
4. Click **Create API Key**
5. Copy the key and paste it into your `.env` file

**Available Models:**
- `llama-3.1-8b-instant` (default, fastest)
- `llama-3.1-70b-versatile`
- `mixtral-8x7b-32768`

### Google Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **Create API Key**
4. Select or create a Google Cloud project
5. Copy the key and paste it into your `.env` file

**Available Models:**
- `gemini-1.5-flash` (default, fastest)
- `gemini-1.5-pro`
- `gemini-pro`

## Running the Application

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Open your browser:**
   Navigate to `http://localhost:3000`

3. **Use the application:**
   - Paste or type your text in the textarea
   - Select your preferred LLM provider (Groq or Gemini)
   - Click **Summarize Text**
   - Copy the summary using the **Copy** button

## Project Structure

```
AiTextSummarize/
├── index.html          # Main HTML structure
├── styles.css          # Styling and responsive design
├── script.js           # Frontend JavaScript logic
├── server.js           # Express server with API endpoints
├── package.json        # Node.js dependencies
├── .env.example        # Environment variables template
├── .env                # Your API keys (create this, not in git)
├── .gitignore          # Git ignore rules
└── README.md           # This file
```

## API Endpoints

### `POST /api/summarize`

Summarizes text using the specified LLM provider.

**Request Body:**
```json
{
  "text": "Your text to summarize here...",
  "provider": "groq"  // or "gemini"
}
```

**Success Response:**
```json
{
  "summary": "Generated summary text..."
}
```

**Error Response:**
```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

## Troubleshooting

### Server won't start

- **Port already in use**: Change `PORT` in `.env` to a different port (e.g., `3001`)
- **Missing dependencies**: Run `npm install` again
- **Node.js version**: Ensure you're using Node.js v18 or higher (`node --version`)

### API errors

- **"Missing API_KEY"**: Check that your `.env` file exists and contains the correct key
- **401 Unauthorized**: Verify your API key is correct and hasn't expired
- **429 Rate Limit**: You've exceeded the free tier rate limit. Wait a few minutes or upgrade your API plan
- **Network errors**: Check your internet connection and that the API service is accessible

### Summary not appearing

- Check browser console (F12) for errors
- Verify the server is running (`npm start`)
- Ensure you've selected a provider that has an API key configured
- Try the fallback: if API fails, a local summary should appear automatically

### CORS errors

- Make sure you're accessing the site through `http://localhost:3000` (not `file://`)
- The server handles CORS automatically, but ensure you're using the correct URL

## Development

### Making Changes

- **Frontend**: Edit `index.html`, `styles.css`, or `script.js`
- **Backend**: Edit `server.js` for API logic
- **Restart**: After changing `server.js`, restart the server (`Ctrl+C` then `npm start`)

### Adding New Providers

To add a new LLM provider:

1. Add provider function in `server.js` (similar to `summarizeWithGroq` or `summarizeWithGemini`)
2. Add API key to `.env.example` and `.env`
3. Add option to provider dropdown in `index.html`
4. Update `script.js` to handle the new provider value

## License

This project is open source and available for personal and educational use.

## Credits

Built with:
- [Express.js](https://expressjs.com/) - Web server
- [Groq](https://groq.com/) - LLM API provider
- [Google Gemini](https://deepmind.google/technologies/gemini/) - LLM API provider

---

**Note**: Keep your `.env` file secure and never commit it to version control. The `.gitignore` file is already configured to exclude it.
