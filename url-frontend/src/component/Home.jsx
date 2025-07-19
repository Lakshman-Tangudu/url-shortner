import { useState } from "react"; // Import the CSS file for styling
import { useAuth } from '@clerk/clerk-react';
import { Copy } from "lucide-react";
import QRGenerator from './QrCode';
function Home() {
  const { getToken } = useAuth();
  const [url, setUrl] = useState({
    origin: null,
    isLoaded: false,
    optimistic: null
  });

  const formsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const originalUrl = formData.get("originalUrl");

    if (!originalUrl) { return alert('enter a valid url') }

    setUrl(prev => ({
      ...prev,
      optimistic: "waiting...",
      isLoaded: false
    }));

    try {
      const token = await getToken();
      const response = await fetch("http://localhost:3000/api/shorten", {
        method: 'POST',
        headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ originalUrl })
      });
      const data = await response.json();
      console.log(response.status);
      if (response.status !== 302 && response.status !== 200) {
        throw new Error(data.message || 'Failed to shorten URL');
      }
      setUrl({
        origin: data,
        isLoaded: true,
        optimistic: null
      });
    } catch (err) {
      setUrl(prev => ({
        ...prev,
        optimistic: err.message,
        isLoaded: false
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <h1 className="text-center text-4xl font-bold text-gray-700 mb-12 shadow-sm">
        URL Shortener
      </h1>

      <div className="max-w-2xl mx-auto bg-white shadow-lg border border-gray-200 rounded-lg p-6 space-y-6">
        <form onSubmit={formsubmit} className="flex">
          <input
            type="text"
            name="originalUrl"
            placeholder="Enter the URL..."
            className="flex-1 border border-gray-300 rounded-l-md px-4 h-12 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-inner"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-5 h-12 rounded-r-md hover:bg-blue-600 transition"
          >
            Shorten URL
          </button>
        </form>

        <div className="text-center text-gray-700 space-y-2">
            {url.optimistic && <div>{url.optimistic}</div>}
            <div className="flex justify-center">
              <div>
            {url.isLoaded && url.origin?.shorturl && (
              <div className="flex justify-center">
                <div className="flex-col">
                  <strong>Short URL:</strong>{" "}
                  <a
                    href={url.origin.shorturl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline break-all"
                  >
                    {url.origin.shorturl}
                  </a>
                  <button onClick={() => navigator.clipboard.writeText(url.origin.shorturl)} className="ml-4 bg-white text-black rounded-lg items-baseline">
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
            {url.isLoaded && url.origin?.originalurl && (
              <div>
                <strong>Original URL:</strong>{" "}
                <a
                  href={url.origin.originalurl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-800 break-all underline"
                >
                  {url.origin.originalurl}
                </a>
              </div>
            )}
              </div>
            {url.isLoaded && url.origin?.originalurl &&(
              <div>
                <QRGenerator url={url.origin.shorturl}/>
              </div>
            )}
            </div>
        </div>
      </div>
    </div>

  );
}

export default Home;