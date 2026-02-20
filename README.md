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

## Deployment to Vercel

This project is configured to work with Vercel's serverless functions. Follow these steps to deploy:

### Step 1: Push to Git Repository

Make sure your code is pushed to a Git repository (GitHub, GitLab, or Bitbucket).

### Step 2: Connect to Vercel

1. Go to [Vercel](https://vercel.com/) and sign in (or create an account)
2. Click **Add New Project**
3. Import your Git repository
4. Vercel will auto-detect the project settings

### Step 3: Configure Environment Variables

**This is critical!** You must add your API keys in Vercel's dashboard:

1. In your Vercel project dashboard, go to **Settings** → **Environment Variables**
2. Add the following variables (add at least one API key):

   ```
   GROQ_API_KEY=your_groq_api_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   GROQ_MODEL=llama-3.1-8b-instant
   GEMINI_MODEL=gemini-1.5-flash
   ```

3. **Important**: Select all environments (Production, Preview, Development) when adding each variable
4. Click **Save**

### Step 4: Deploy

1. Click **Deploy** (or push a new commit to trigger automatic deployment)
2. Wait for the deployment to complete
3. Your site will be live at `https://your-project-name.vercel.app`

### Vercel-Specific Notes

- **Serverless Functions**: The API endpoint (`/api/summarize`) runs as a Vercel serverless function
- **Environment Variables**: API keys are securely stored in Vercel's environment variables (not in code)
- **Automatic Deployments**: Every push to your main branch triggers a new deployment
- **Preview Deployments**: Pull requests get preview URLs automatically

### Troubleshooting Vercel Deployment

**NOT_FOUND (404) Error:**
This is the most common issue. Follow these steps:

1. **Verify the API file exists in Git:**
   ```bash
   git ls-files | grep api/summarize.js
   ```
   If it doesn't show up, the file isn't committed:
   ```bash
   git add api/summarize.js
   git commit -m "Add Vercel serverless function"
   git push
   ```

2. **Check file location:**
   - The file must be at `api/summarize.js` (lowercase `api` folder)
   - Vercel auto-detects files in the `/api` folder
   - No `vercel.json` is needed for basic serverless functions

3. **Verify deployment:**
   - Go to Vercel Dashboard → Your Project → Deployments
   - Check the latest deployment logs
   - Look for "Detected Serverless Functions" in the build output
   - You should see: `api/summarize.js`

4. **Redeploy:**
   - After committing the file, Vercel should auto-deploy
   - Or manually trigger: Deployments → Redeploy

5. **Test the endpoint:**
   - Visit: `https://your-project.vercel.app/api/summarize`
   - Should return 405 (Method Not Allowed) for GET, which means the function exists
   - Use POST from your frontend to actually call it

**"Missing API_KEY" error:**
- Go to Vercel Dashboard → Settings → Environment Variables
- Verify your API keys are added and saved
- Make sure you selected all environments (Production, Preview, Development)
- Redeploy after adding environment variables

**Function timeout:**
- Vercel free tier has a 10-second timeout for serverless functions
- If summaries take too long, try shorter input text or upgrade your Vercel plan

**CORS errors:**
- The serverless function includes CORS headers automatically
- If you see CORS errors, check that you're accessing the deployed URL (not localhost)

**Build errors:**
- Ensure `package.json` includes all dependencies
- Check Vercel build logs for specific error messages
- Make sure Node.js version is compatible (Vercel uses Node 18+ by default)
- Ensure `"type": "module"` is in `package.json` (for ES modules)

## Project Structure

```
AiTextSummarize/
├── api/
│   └── summarize.js    # Vercel serverless function (auto-detected by Vercel)
├── index.html          # Main HTML structure
├── styles.css          # Styling and responsive design
├── script.js           # Frontend JavaScript logic
├── server.js           # Express server (for local development)
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
- **Backend (Local)**: Edit `server.js` for local development
- **Backend (Vercel)**: Edit `api/summarize.js` for Vercel deployment
- **Restart**: After changing `server.js`, restart the server (`Ctrl+C` then `npm start`)
- **Note**: For Vercel, changes to `api/summarize.js` will be deployed automatically on push

### Adding New Providers

To add a new LLM provider:

1. Add provider function in both `server.js` (local) and `api/summarize.js` (Vercel)
2. Add API key to `.env.example` and `.env` (and Vercel environment variables)
3. Add option to provider dropdown in `index.html`
4. Update `script.js` to handle the new provider value

## License

This project is open source and available for personal and educational use.

## Credits

Built with:
- [Express.js](https://expressjs.com/) - Web server (local development)
- [Vercel](https://vercel.com/) - Serverless deployment platform
- [Groq](https://groq.com/) - LLM API provider
- [Google Gemini](https://deepmind.google/technologies/gemini/) - LLM API provider

---

## Important Security Notes

- **Never commit `.env`**: Keep your `.env` file secure and never commit it to version control. The `.gitignore` file is already configured to exclude it.
- **Vercel Environment Variables**: For Vercel deployments, add API keys in the Vercel dashboard (Settings → Environment Variables), not in your code.
- **API Keys**: API keys are stored server-side only and never exposed to the browser, ensuring your keys remain secure.
