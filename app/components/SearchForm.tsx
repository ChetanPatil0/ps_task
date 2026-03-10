"use client"

import { useState } from "react"
import axios from "axios"

export default function SearchForm() {
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<string | null>(null)

    async function handleSearch() {
        const trimmed = query.trim()
        if (!trimmed) {
            setMessage("Please enter a search query")
            setResults([])
            return
        }

        setLoading(true)
        setMessage(null)

        try {
            const res = await axios.get("/api/search", { params: { q: trimmed } })
            const data = res.data

            console.log("Search response:", data)

            if (data.results?.length > 0) {
                setResults(data.results)
                setMessage(null)
            } else {
                setResults([])
                setMessage(data.message || "No results found")
            }
        } catch (err) {
            setMessage("Search failed. Try again.")
            setResults([])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Search Any things</h2>

            <div className="flex gap-3 mb-6">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Type keywords..."
                    className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                    required
                />
                <button
                    onClick={handleSearch}
                    disabled={loading || !query.trim()}
                    className={`px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 ${loading || !query.trim() ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                >
                    {loading ? "Searching..." : "Search"}
                </button>
            </div>

            {message && (
                <p className="text-red-600 mb-4">{message}</p>
            )}

            <div className="space-y-6">
                
                {results.map((r) => (
                    <div key={r.id} className="border rounded-lg p-5 bg-gray-50">
                        {/* <h3 className="font-semibold text-lg mb-2">{r.title}</h3> */}

                        {/* <p className="text-gray-700 text-sm mb-4 line-clamp-5">
                            {r.preview}
                        </p> */}
                        {r.chunk_text && (
                            <p className="text-gray-700 text-sm mb-4">
                                 {r.chunk_text}
                            </p>
                        )}

                        <div className="flex justify-between items-center text-sm">
                          
<a
  href={`/api/files/${encodeURIComponent(r.file_url?.split("/").pop() || "")}`}
  target="_blank"
  rel="noopener noreferrer"
  className="text-blue-600 hover:underline"
>
  Open full document
</a>
                            {/* <span className="text-gray-500">
                                Relevance: {r.score}
                            </span> */}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}