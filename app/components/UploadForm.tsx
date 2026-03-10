"use client"

import { useState, useEffect } from "react"
import axios from "axios"

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const MAX_FILE_SIZE = 5 * 1024 * 1024 
  const ALLOWED_EXTENSIONS = [".txt", ".pdf"]
  const ALLOWED_MIME_TYPES = ["text/plain", "application/pdf"]
  const MIN_TITLE_LENGTH = 3

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 6000)
      return () => clearTimeout(timer)
    }
  }, [message])

  function formatFileSize(size: number): string {
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    setFile(null)

    if (!selected) return

    const ext = selected.name.toLowerCase().slice(selected.name.lastIndexOf("."))

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setMessage({ type: "error", text: `Allowed files: ${ALLOWED_EXTENSIONS.join(", ")}` })
      e.target.value = ""
      return
    }

    if (!ALLOWED_MIME_TYPES.includes(selected.type)) {
      setMessage({ type: "error", text: "Invalid file format" })
      e.target.value = ""
      return
    }

    if (selected.size > MAX_FILE_SIZE) {
      setMessage({ type: "error", text: `File too large (max ${formatFileSize(MAX_FILE_SIZE)})` })
      e.target.value = ""
      return
    }

    setFile(selected)
    setMessage(null)
  }

 async function handleUpload(e: React.FormEvent) {
  e.preventDefault()
  setMessage(null)

  const trimmedTitle = title.trim()

  if (!trimmedTitle) {
    setMessage({ type: "error", text: "Title is required" })
    return
  }

  if (trimmedTitle.length < MIN_TITLE_LENGTH) {
    setMessage({ type: "error", text: `Title must be at least ${MIN_TITLE_LENGTH} characters` })
    return
  }

  if (!file) {
    setMessage({ type: "error", text: "Please select a file" })
    return
  }

  setLoading(true)

  try {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("title", trimmedTitle)

    await axios.post("/api/upload", formData)

    setMessage({ type: "success", text: "File uploaded successfully!" })
  } catch (err: any) {
    const errorMessage =
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      "Upload failed. Please try again."

    setMessage({ type: "error", text: errorMessage })
  } finally {
    setLoading(false)

  
    setTitle("")
    setFile(null)

    const input = document.getElementById("file") as HTMLInputElement | null
    if (input) input.value = ""
  }
}

  return (
    <div className="border border-gray-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 bg-white">
      <h2 className="text-xl font-semibold text-gray-800 mb-5">Upload Document</h2>

      {message && (
        <div
          className={`mb-5 px-4 py-3 rounded-lg text-white text-sm font-medium ${
            message.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleUpload} className="space-y-5">
        <div>
          <label htmlFor="title" className="block mb-1.5 text-sm font-medium text-gray-700">
            Document Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a clear title"
            maxLength={120}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-800 placeholder-gray-400"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="file" className="block mb-1.5 text-sm font-medium text-gray-700">
            File <span className="text-red-500">*</span>
          </label>
          <input
            id="file"
            type="file"
            accept={ALLOWED_EXTENSIONS.join(",")}
            onChange={handleFileChange}
            required
            className="w-full px-3 py-3 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer transition-all duration-200 disabled:opacity-60"
            disabled={loading}
          />
          <p className="mt-1.5 text-xs text-gray-500">
            Allowed: {ALLOWED_EXTENSIONS.join(", ")} • Max size: {formatFileSize(MAX_FILE_SIZE)}
          </p>
          {file && (
            <p className="mt-2 text-sm text-gray-700 font-medium">
              Selected: {file.name} ({formatFileSize(file.size)})
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !title.trim() || !file}
          className={`w-full py-3 px-6 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 ${
            loading || !title.trim() || !file ? "opacity-60 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Uploading..." : "Upload Document"}
        </button>
      </form>
    </div>
  )
}