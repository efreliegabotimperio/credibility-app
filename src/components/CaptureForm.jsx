import { useState, useRef, useEffect } from 'react';
import { generateSOP } from '../api';

const PLACEHOLDER = "Tell me about something you do in your business. Talk like you're explaining it to a friend.";

// Voice recording hook
function useVoice(onTranscript) {
  const [recording, setRecording] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSupported(!!SpeechRecognition);
  }, []);

  function startRecording() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = true;

    let transcript = '';

    recognition.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript + ' ';
      }
    };

    recognition.onend = () => {
      setRecording(false);
      if (transcript.trim()) onTranscript(transcript.trim());
    };

    recognition.onerror = () => setRecording(false);

    recognition.start();
    recognitionRef.current = recognition;
    setRecording(true);
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    setRecording(false);
  }

  return { recording, supported, startRecording, stopRecording };
}

export default function CaptureForm({ onResult, selectedPrompt, onPromptUsed }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // When a prompt card is clicked, pre-fill the textarea
  useEffect(() => {
    if (selectedPrompt) {
      setText(selectedPrompt);
    }
  }, [selectedPrompt]);

  const { recording, supported, startRecording, stopRecording } = useVoice((transcript) => {
    setText(prev => (prev ? prev + ' ' + transcript : transcript));
  });

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    
    setError('');
    setLoading(true);
    try {
      const sop = await generateSOP(text.trim());
      onResult(sop, text.trim());
      setText('');
      onPromptUsed?.();
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function toggleVoice() {
    if (recording) stopRecording();
    else startRecording();
  }

  return (
    <div className="capture-card" id="capture-form">
      <form onSubmit={handleSubmit}>
        <div className="textarea-wrap">
          <textarea
            id="capture-textarea"
            className="capture-textarea"
            placeholder={PLACEHOLDER}
            value={text}
            onChange={e => setText(e.target.value)}
            rows={6}
            disabled={loading}
          />
        </div>

        <div className="capture-actions">
          <button
            id="btn-generate-sop"
            type="submit"
            className="btn btn-primary"
            disabled={loading || !text.trim()}
          >
            {loading ? (
              <>
                <span className="spinner" />
                Working on it…
              </>
            ) : (
              'Edit this for me.'
            )}
          </button>

          {supported && (
            <button
              id="btn-voice-record"
              type="button"
              className={`btn btn-secondary voice-btn${recording ? ' recording' : ''}`}
              onClick={toggleVoice}
              disabled={loading}
              aria-label={recording ? 'Stop recording' : 'Record voice input'}
            >
              {recording ? (
                <>
                  <span className="voice-dot" />
                  Stop recording
                </>
              ) : (
                <>
                  🎙 Say it out loud
                </>
              )}
            </button>
          )}

          {loading && (
            <span className="processing-msg">Turning your words into a procedure…</span>
          )}
        </div>

        {error && (
          <div className="error-banner" role="alert">
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}
      </form>
    </div>
  );
}
