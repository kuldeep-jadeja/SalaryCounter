import { useState } from "react";

export default function LiveSalaryCounter() {
  const [salary, setSalary] = useState(100000);
  const [duration, setDuration] = useState(10);
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState("#ffffff");
  const [currency, setCurrency] = useState("₹");
  const [videoURL, setVideoURL] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [celebrity, setCelebrity] = useState("");
  const [netWorth, setNetWorth] = useState(null);
  const [isFetchingNetWorth, setIsFetchingNetWorth] = useState(false);

  const fetchNetWorth = async () => {
    if (!celebrity) return;

    setIsFetchingNetWorth(true);
    setError(null);

    try {
      const res = await fetch("/api/networth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: celebrity }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to fetch net worth.");

      const estimatedAnnual = data.netWorth * 0.05;
      setNetWorth(data.netWorth);
      setSalary(Math.round(estimatedAnnual)); // Autofill salary
    } catch (err) {
      setError(err.message);
    } finally {
      setIsFetchingNetWorth(false);
    }
  };


  const handleGenerate = async () => {
    if (duration <= 0 || salary <= 0 || fontSize <= 0) {
      setError("All values must be greater than zero.");
      return;
    }

    setIsGenerating(true);
    setVideoURL(null);
    setError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salary, duration, fontSize, color, currency }),
      });

      if (!res.ok) throw new Error("Video generation failed.");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setVideoURL(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f172a",
      color: "#f1f5f9",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "40px 20px",
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{
        background: "#1e293b",
        borderRadius: "12px",
        padding: "30px",
        width: "100%",
        maxWidth: "500px",
        boxShadow: "0 8px 20px rgba(0,0,0,0.2)"
      }}>
        <h1 style={{
          fontSize: "28px",
          fontWeight: "700",
          marginBottom: "20px",
          textAlign: "center"
        }}>
          🎥 Live Salary Counter Generator
        </h1>

        <div style={{ marginBottom: "15px" }}>
          <label>Celebrity Name</label>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              value={celebrity}
              onChange={(e) => setCelebrity(e.target.value)}
              className="input"
              placeholder="e.g. Elon Musk"
            />
            <button
              onClick={fetchNetWorth}
              disabled={isFetchingNetWorth}
              style={{
                backgroundColor: "#10b981",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                padding: "8px 12px",
                cursor: "pointer"
              }}
            >
              {isFetchingNetWorth ? "Fetching..." : "Fetch"}
            </button>
          </div>
          {netWorth && (
            <p style={{ marginTop: "8px", color: "#22c55e" }}>
              Estimated Net Worth: <strong>${(netWorth / 1e6).toFixed(2)}M</strong> → Annual Salary: <strong>${Math.round(netWorth * 0.05).toLocaleString()}</strong>
            </p>
          )}
        </div>


        <div style={{ marginBottom: "15px" }}>
          <label>Annual Salary</label>
          <input
            type="number"
            value={salary}
            onChange={(e) => setSalary(Number(e.target.value))}
            className="input"
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Video Duration (seconds)</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="input"
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Font Size (px)</label>
          <input
            type="number"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="input"
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Font Color</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            style={{ width: "100%", height: "40px", borderRadius: "6px", border: "none" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Currency Symbol</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="input"
          >
            <option value="₹">₹ (INR)</option>
            <option value="$">$ (USD)</option>
            <option value="€">€ (EUR)</option>
            <option value="£">£ (GBP)</option>
            <option value="¥">¥ (JPY)</option>
          </select>
        </div>

        {error && (
          <div style={{
            backgroundColor: "#ef4444",
            color: "#fff",
            padding: "10px",
            borderRadius: "8px",
            marginBottom: "15px",
            textAlign: "center"
          }}>
            ⚠️ {error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          style={{
            width: "100%",
            padding: "12px",
            fontSize: "16px",
            fontWeight: "600",
            backgroundColor: isGenerating ? "#64748b" : "#3b82f6",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: isGenerating ? "not-allowed" : "pointer"
          }}
        >
          {isGenerating ? "Generating Video..." : "Generate Video"}
        </button>

        {videoURL && (
          <div style={{ marginTop: "30px" }}>
            <video
              controls
              src={videoURL}
              style={{ width: "100%", borderRadius: "12px" }}
            />
            <a
              href={videoURL}
              download="salary-counter.webm"
              style={{
                display: "block",
                marginTop: "12px",
                textAlign: "center",
                color: "#60a5fa",
                textDecoration: "underline"
              }}
            >
              ⬇️ Download Video
            </a>
          </div>
        )}
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          padding: 10px;
          border-radius: 8px;
          border: 1px solid #475569;
          background: #334155;
          color: #f8fafc;
          font-size: 14px;
          margin-top: 6px;
        }

        label {
          display: block;
          margin-bottom: 4px;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
