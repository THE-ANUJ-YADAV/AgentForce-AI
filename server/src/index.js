/**
 * index.js
 * Server entrypoint starting Express on configured PORT.
 */
import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[AgentForce AI] Server running on http://localhost:${PORT}`);
  console.log(`[AgentForce AI] Allowed client origin: ${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}`);
  console.log(`[AgentForce AI] AI Mode: ${process.env.GEMINI_API_KEY ? 'Gemini (' + (process.env.GEMINI_MODEL || 'gemini-2.5-flash') + ')' : 'Deterministic Fallback'}`);
});
