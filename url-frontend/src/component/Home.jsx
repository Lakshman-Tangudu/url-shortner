import { useState } from "react";
import { Copy } from "lucide-react";
import QRGenerator from './QrCode'; // Assuming you have this component

function Home() {
  // State to manage the URL data and loading status
  const [url, setUrl] = useState({
    origin: null,
    isLoaded: false,
    optimistic: null, // To show loading/error messages
  });

  /**
   * Handles the form submission to shorten a URL.
   * @param {React.FormEvent<HTMLFormElement>} e The form event.
   */
  const formsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const originalUrl = formData.get("originalUrl");

    if (!originalUrl) {
      // Use optimistic state to show user feedback instead of alert()
      setUrl(prev => ({ ...prev, optimistic: 'Please enter a valid URL.' }));
      return;
    }

    // Set a loading message
    setUrl(prev => ({
      ...prev,
      optimistic: "Shortening...",
      isLoaded: false
    }));

    try {
      // Fetch request to the public backend API
      const response = await fetch('https://url-shortner-backend-five-roan.vercel.app/api/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization' header is removed as it's no longer needed
        },
        body: JSON.stringify({ originalUrl })
      });

      const data = await response.json();

      // Check for non-successful status codes
      if (!response.ok) {
        throw new Error(data.message || 'Failed to shorten URL. Please try again.');
      }

      // Update state with the successful response
      setUrl({
        origin: data,
        isLoaded: true,
        optimistic: null
      });

    } catch (err) {
      // Update state with the error message
      setUrl(prev => ({
        ...prev,
        optimistic: err.message,
        isLoaded: false
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <h1 className="text-center text-4xl font-bold text-gray-900 mb-20 pb-10 shadow-sm">
        URL Shortener
      </h1>

      <div className="max-w-2xl mx-auto bg-white shadow-lg border border-gray-200 rounded-lg p-6 space-y-6">
        <form onSubmit={formsubmit} className="flex">
          <input
            type="text"
            name="originalUrl"
            placeholder="Enter the URL to shorten..."
            className="flex-1 border border-gray-300 rounded-l-md px-4 h-12 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-inner"
          />
          <button
            type="submit"
            className="bg-black text-white px-5 h-12 rounded-r-md hover:bg-blue-600 transition"
          >
            Shorten URL
          </button>
        </form>

        <div className="text-center text-gray-700 space-y-4 pt-4">
          {/* Display loading or error messages */}
          {url.optimistic && <div className="text-red-500">{url.optimistic}</div>}
          
          {/* Display the shortened URL result */}
          {url.isLoaded && url.origin?.shorturl && (
            <div className="flex flex-col md:flex-row justify-center items-center gap-4 p-4 bg-gray-100 rounded-md">
              <div className="flex-grow text-left">
                {/* Short URL */}
                <div className="flex items-center gap-2">
                  <strong className="whitespace-nowrap">Short URL:</strong>
                  <a
                    href={url.origin.shorturl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-black hover:text-blue-600 underline break-all"
                  >
                    {url.origin.shorturl}
                  </a>
                  <button onClick={() => navigator.clipboard.writeText(url.origin.shorturl)} className="p-1 text-gray-500 hover:text-black">
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
                {/* Original URL */}
                <div className="mt-2 text-sm text-gray-500 break-all">
                  <strong>Original:</strong> {url.origin.originalurl}
                </div>
              </div>
              
              {/* QR Code */}
              <div className="flex-shrink-0">
                <QRGenerator url={url.origin.shorturl} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
