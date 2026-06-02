export default function Analytics() {
  return (
    <div className="h-full w-full">
      <iframe
        src="http://localhost:8501/?page=EDA"
        className="w-full h-full border-0"
        title="SPECTER Analytics Dashboard"
        allow="camera; microphone"
      />
    </div>
  )
}
