async function load24hHistory() {
  try {
    const response = await fetch("https://api.coincap.io/v2/assets/bitcoin/history?interval=h1");
    const json = await response.json();

    btcPriceHistory.length = 0; // Clear current history
    json.data.forEach(point => {
      btcPriceHistory.push({
        time: new Date(point.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        price: parseFloat(point.priceUsd),
      });
    });

    updateChart();
  } catch (err) {
    console.error("Failed to load 24h history:", err);
  }
}

const assets = ['bitcoin', 'ethereum', 'dogecoin', 'binance-coin', 'cardano'];
const ws = new WebSocket(`wss://ws.coincap.io/prices?assets=${assets.join(',')}`);

const cryptoList = document.getElementById('crypto-list');
const priceData = {};
const btcPriceHistory = [];

ws.onmessage = (msg) => {
  const data = JSON.parse(msg.data);
  for (let key in data) {
    priceData[key] = data[key];

    // Store BTC price for chart
    if (key === 'bitcoin') {
      btcPriceHistory.push({
        time: new Date().toLocaleTimeString(),
        price: parseFloat(data[key]),
      });
      if (btcPriceHistory.length > 20) btcPriceHistory.shift(); // keep last 20 points
      updateChart();
    }
  }
  updateUI();
};

function updateUI() {
  cryptoList.innerHTML = '';
  assets.forEach(key => {
    const price = priceData[key] || '...';
    cryptoList.innerHTML += `
      <div class="crypto-card">
        <strong>${key.toUpperCase()}</strong>
        <p>Price: $${parseFloat(price).toFixed(2)}</p>
      </div>`;
  });
}

// Dark mode toggle
document.getElementById('toggle-theme').addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
});

// Chart.js logic
const ctx = document.getElementById('priceChart').getContext('2d');
const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      label: 'BTC Price (USD)',
      data: [],
      borderColor: 'orange',
      backgroundColor: 'rgba(255,165,0,0.2)',
      fill: true,
      tension: 0.3,
    }],
  },
  options: {
    scales: {
      x: { display: true, title: { display: true, text: 'Time' }},
      y: { display: true, title: { display: true, text: 'Price ($)' }},
    }
  }
});

function updateChart() {
  chart.data.labels = btcPriceHistory.map(p => p.time);
  chart.data.datasets[0].data = btcPriceHistory.map(p => p.price);
  chart.update();
}
function downloadReport() {
  let csv = "Cryptocurrency,Price (USD)\n";
  assets.forEach(key => {
    const price = priceData[key] ? parseFloat(priceData[key]).toFixed(2) : "N/A";
    csv += `${key.toUpperCase()},${price}\n`;
  });

  // Create Blob and download link
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `CryptoPulse_Report_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

load24hHistory();

