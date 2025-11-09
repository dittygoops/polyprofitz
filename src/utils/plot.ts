import * as fs from 'fs';
import * as path from 'path';
import { EventData, PricePoint } from '../types/polymarket';
import { fromUnixTimestamp } from './time';

/**
 * Generate an HTML file with interactive price charts for all tokens
 */
export function plotPriceHistory(eventData: EventData, outputPath: string): string {
  const { market, tokens } = eventData;

  // Prepare data for each token
  const traces = tokens.map((token, index) => {
    const timestamps = token.priceHistory.map(point =>
      fromUnixTimestamp(point.t).toISOString()
    );
    const prices = token.priceHistory.map(point => point.p);

    return {
      x: timestamps,
      y: prices,
      type: 'scatter',
      mode: 'lines+markers',
      name: token.outcome,
      line: {
        width: 2
      },
      marker: {
        size: 6
      }
    };
  });

  // Create HTML with Plotly
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${market.question || 'Price History'}</title>
  <script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background-color: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      margin-top: 0;
      color: #333;
      font-size: 24px;
    }
    .metadata {
      background-color: #f9f9f9;
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 20px;
      font-size: 14px;
      color: #666;
    }
    .metadata p {
      margin: 5px 0;
    }
    .metadata strong {
      color: #333;
    }
    #chart {
      width: 100%;
      height: 600px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${market.question || 'Market Price History'}</h1>

    <div class="metadata">
      <p><strong>Market ID:</strong> ${market.id}</p>
      <p><strong>Slug:</strong> ${(market as any).slug || 'N/A'}</p>
      <p><strong>Status:</strong> ${market.closed ? 'Closed' : 'Active'}</p>
      ${(market as any).tags && (market as any).tags.length > 0 ? `
      <p><strong>Tags:</strong> ${(market as any).tags.map((t: any) => t.label || t.name).join(', ')}</p>
      ` : ''}
      <p><strong>Total Volume:</strong> ${market.volume ? parseFloat(market.volume).toLocaleString() : 'N/A'}</p>
      <p><strong>Fetched:</strong> ${eventData.fetchedAt}</p>
      ${eventData.timeRange && (eventData.timeRange.start || eventData.timeRange.end) ? `
      <p><strong>Data Range:</strong> ${eventData.timeRange.start || 'Beginning'} to ${eventData.timeRange.end || 'End'}</p>
      ` : ''}
    </div>

    <div id="chart"></div>
  </div>

  <script>
    const data = ${JSON.stringify(traces)};

    const layout = {
      title: {
        text: 'Price History Over Time',
        font: { size: 18 }
      },
      xaxis: {
        title: 'Date',
        type: 'date',
        showgrid: true,
        gridcolor: '#e0e0e0'
      },
      yaxis: {
        title: 'Price',
        range: [0, 1],
        showgrid: true,
        gridcolor: '#e0e0e0',
        tickformat: '.2f'
      },
      hovermode: 'x unified',
      plot_bgcolor: '#fafafa',
      paper_bgcolor: 'white',
      margin: {
        l: 60,
        r: 30,
        t: 50,
        b: 80
      }
    };

    const config = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['lasso2d', 'select2d']
    };

    Plotly.newPlot('chart', data, layout, config);
  </script>
</body>
</html>`;

  // Save HTML file
  fs.writeFileSync(outputPath, html, 'utf-8');

  return outputPath;
}

/**
 * Generate plot filename from market slug
 */
export function generatePlotFilename(marketSlug: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `${marketSlug}_${timestamp}_plot.html`;
}
