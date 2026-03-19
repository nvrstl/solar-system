import { useState } from 'react'

interface Props {
  onSave: (key: string) => void
}

export function ApiKeyModal({ onSave }: Props) {
  const [key, setKey] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (key.trim()) {
      localStorage.setItem('gmaps_api_key', key.trim())
      onSave(key.trim())
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">☀️</span>
          <h2 className="text-xl font-bold text-gray-800">Solar Roof Designer</h2>
        </div>
        <p className="text-gray-600 text-sm mb-5">
          Enter your <strong>Google Maps JavaScript API key</strong> to load the satellite map.
          The key is stored only in your browser's localStorage.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="AIza..."
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!key.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            Load Map
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-4">
          Need a key?{' '}
          <a
            href="https://developers.google.com/maps/documentation/javascript/get-api-key"
            target="_blank"
            rel="noreferrer"
            className="text-blue-500 underline"
          >
            Get one here
          </a>
          . Enable "Maps JavaScript API" and "Drawing" library.
        </p>
      </div>
    </div>
  )
}
