import UploadForm from "../app/components/UploadForm"
import SearchForm from "../app/components/SearchForm"

export default function Home() {
 return (
  <div className="max-w-3xl mx-auto p-10 space-y-10">
   <h1 className="text-3xl font-bold text-center mb-6">Pulse Solutions Task</h1>

   <UploadForm />

   <SearchForm />
  </div>
 )
}