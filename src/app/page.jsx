"use client";
import React from "react";

function MainComponent() {
  const [userId, setUserId] = useState(null);
  const [tokens, setTokens] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAd, setShowAd] = useState(false);
  const adTimeout = useRef(null);

  // Initialize user on first load
  useEffect(() => {
    const initUser = async () => {
      try {
        const response = await fetch("/api/tokens", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "create" }),
        });
        const data = await response.json();
        if (data.userId) {
          setUserId(data.userId);
          setTokens(data.tokens);
        }
      } catch (err) {
        setError("Failed to initialize user");
        console.error(err);
      }
    };

    if (!userId) {
      initUser();
    }
  }, [userId]);

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      setError("Please enter a description");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, prompt }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setGeneratedImage(data.imageUrl);
        setTokens(data.remainingTokens);
      }
    } catch (err) {
      setError("Failed to generate image");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;

    try {
      // First fetch the image
      const response = await fetch(generatedImage);
      const blob = await response.blob();

      // Create object URL
      const url = window.URL.createObjectURL(blob);

      // Create download link
      const link = document.createElement("a");
      link.href = url;
      link.download = `AI-Image-${Date.now()}.png`;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      setError("Failed to download image. Please try again.");
    }
  };

  const handleWatchAd = () => {
    setShowAd(true);
    // Simulate watching an ad for 5 seconds
    adTimeout.current = setTimeout(async () => {
      try {
        const response = await fetch("/api/tokens", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update",
            userId,
            amount: 1,
          }),
        });
        const data = await response.json();
        if (data.tokens) {
          setTokens(data.tokens);
        }
      } catch (err) {
        setError("Failed to earn token");
        console.error(err);
      }
      setShowAd(false);
    }, 5000);
  };

  useEffect(() => {
    return () => {
      if (adTimeout.current) {
        clearTimeout(adTimeout.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold mb-4 text-center">
            AI Image Generator
          </h1>

          <div className="mb-4 text-center">
            <p className="text-lg">
              Your Tokens: <span className="font-bold">{tokens}</span>
            </p>
            <button
              onClick={handleWatchAd}
              disabled={showAd}
              className="mt-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
            >
              {showAd ? "Watching Ad..." : "Watch Ad to Earn Token"}
            </button>
          </div>

          <div className="mb-4">
            <textarea
              className="w-full p-2 border rounded"
              rows="3"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
            />
          </div>

          <button
            onClick={handleGenerateImage}
            disabled={loading || !prompt.trim() || tokens < 1}
            className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? "Generating..." : "Generate Image (1 Token)"}
          </button>

          {error && (
            <div className="mt-4 p-2 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          {generatedImage && (
            <div className="mt-6">
              <img
                src={generatedImage}
                alt="Generated image"
                className="w-full rounded-lg shadow-md mb-4"
              />
              <button
                onClick={handleDownload}
                className="w-full bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 active:bg-purple-700 flex items-center justify-center gap-2 transition-colors"
              >
                <i className="fas fa-download"></i>
                Download Image
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MainComponent;
