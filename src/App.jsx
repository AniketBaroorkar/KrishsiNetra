function App() {
  return (
    <div style={{ fontFamily: "Arial", padding: "30px" }}>
      <h1>KrishiNetra</h1>

      <h2>AI and Satellite-Based Agricultural Fraud Detection System</h2>

      <p>
        KrishiNetra helps detect agricultural insurance fraud using AI,
        satellite imagery, and geo-tagged farmer photos.
      </p>

      <hr />

      <h2>Farmer App</h2>
      <ul>
        <li>Farmer logs in</li>
        <li>Farmer uploads geo-tagged crop photo</li>
        <li>Location and timestamp are saved</li>
        <li>Photo is sent for AI verification</li>
      </ul>

      <h2>AI Verification</h2>
      <ul>
        <li>System checks crop type from photo</li>
        <li>System compares with satellite data</li>
        <li>Fraud risk score is generated</li>
      </ul>

      <h2>Government Dashboard</h2>
      <ul>
        <li>View farmer claims</li>
        <li>See crop location on map</li>
        <li>Check risk score</li>
        <li>Approve or reject suspicious claims</li>
      </ul>

      <button style={{ padding: "12px 20px", fontSize: "16px" }}>
        Upload Geo-tagged Photo
      </button>
    </div>
  );
}

export default App;