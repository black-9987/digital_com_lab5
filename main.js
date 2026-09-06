import './style.css'

const sampleCount = 240
const $ = (selector) => document.querySelector(selector)

document.querySelector('#app').innerHTML = `
  <main class="shell">
    <header class="topbar"><div class="brand"><span class="brand-mark">∿</span><span>SIGNAL LAB</span><span class="brand-code">/ 04</span></div><div class="status"><span class="status-dot"></span> SIMULATION LIVE</div></header>
    <section class="intro"><div class="eyebrow">PULSE-CODED SYSTEMS <span></span> EXPERIMENT 04</div><h1>One signal.<br><em>Three decisions.</em></h1><p class="lede">See how a waveform becomes a sequence of bits, one quantized decision at a time.</p><div class="formula">x[n] <span>→</span> prediction <span>→</span> quantization <span>→</span> reconstruction</div></section>
    <section class="controls-panel" aria-label="Simulation controls"><div class="control-heading"><span class="step-number">01</span><div><strong>Shape the input</strong><small>Change the conditions. Watch the errors move.</small></div></div><label class="control"><span>Input frequency <output id="frequency-value">3.0 Hz</output></span><input id="frequency" type="range" min="1" max="10" step="0.5" value="3"></label><label class="control"><span>Step size Δ <output id="step-value">0.22</output></span><input id="step" type="range" min="0.06" max="0.5" step="0.01" value="0.22"></label><label class="control"><span>Prediction gain <output id="gain-value">0.92</output></span><input id="gain" type="range" min="0" max="1" step="0.01" value="0.92"></label><button id="reset" class="icon-button" type="button" title="Reset simulation">↺<span>reset</span></button></section>
    <section class="section-block"><div class="section-title"><div><span class="kicker">A / DIFFERENTIAL PULSE CODE MODULATION</span><h2>DPCM makes the <span>difference</span> smaller.</h2></div><p class="section-note">The predictor carries yesterday forward.<br>The quantizer only needs to describe the error.</p></div><div class="pipeline"><div class="pipeline-node"><b>01</b><strong>Prediction</strong><span>p[n] = a · x̂[n−1]</span></div><div class="pipeline-arrow">→</div><div class="pipeline-node hot"><b>02</b><strong>Quantization</strong><span>e[n] → Q(e[n])</span></div><div class="pipeline-arrow">→</div><div class="pipeline-node"><b>03</b><strong>Reconstruction</strong><span>x̂[n] = p[n] + ê[n]</span></div></div><div class="chart-card"><div class="chart-label"><span><i class="legend-line signal"></i>input x[n] <i class="legend-line recon"></i>reconstructed x̂[n]</span><span id="dpcm-error">mean error 0.00</span></div><canvas id="dpcm-chart" aria-label="DPCM input and reconstructed waveform"></canvas></div><div class="metrics"><div><span>residual range</span><strong id="residual-range">±0.00</strong></div><div><span>quantized levels</span><strong id="quantized-levels">0</strong></div><div><span>mean abs error</span><strong id="mean-error">0.00</strong></div><div><span>coding idea</span><strong class="text-accent">encode e[n]</strong></div></div></section>
    <section class="section-block delta-section"><div class="section-title"><div><span class="kicker">B / DELTA MODULATION</span><h2>One bit. A fixed <span>stride.</span></h2></div><p class="section-note">Every decision moves the staircase<br>up or down by exactly Δ.</p></div><div class="chart-card delta-card"><div class="chart-label"><span><i class="legend-line signal"></i>input x[n] <i class="legend-line stairs"></i>staircase x̂[n]</span><span id="delta-rate">step integrity 100%</span></div><canvas id="delta-chart" aria-label="Delta modulation staircase waveform"></canvas></div><div class="validation"><div class="validation-icon">✓</div><div><strong>STEP-INTEGRITY CHECK</strong><p id="validation-message">All 239 transitions are exactly +Δ or −Δ.</p></div><span class="pass-pill" id="validation-pill">PASS</span></div><div class="noise-note"><span class="note-icon">i</span><p><strong>Read the failure modes:</strong> small Δ follows slowly but leaves granular noise. Large input frequency outruns the staircase and causes slope overload.</p></div></section>
    <footer><span>CONTINUOUS-TIME INPUT / DISCRETE-TIME OUTPUT</span><span>Δ MODULATION STUDY <b>●</b> 2026</span></footer>
  </main>
`

const controls = { frequency: $('#frequency'), step: $('#step'), gain: $('#gain') }
const outputs = { frequency: $('#frequency-value'), step: $('#step-value'), gain: $('#gain-value') }

function simulate() {
  const frequency = Number(controls.frequency.value); const delta = Number(controls.step.value); const gain = Number(controls.gain.value)
  const input = Array.from({ length: sampleCount }, (_, index) => Math.sin((index / sampleCount) * Math.PI * 2 * frequency)); const predicted = [0]; const residual = []; const reconstruction = [0]
  for (let index = 0; index < sampleCount; index += 1) { predicted[index] = index === 0 ? 0 : gain * reconstruction[index - 1]; residual[index] = input[index] - predicted[index]; reconstruction[index] = predicted[index] + Math.round(residual[index] / delta) * delta }
  const deltaOutput = [0]
  for (let index = 0; index < sampleCount - 1; index += 1) { const direction = input[index] >= deltaOutput[index] ? 1 : -1; deltaOutput[index + 1] = deltaOutput[index] + direction * delta }
  const transitions = deltaOutput.slice(1).map((value, index) => Number((value - deltaOutput[index]).toFixed(8))); const invalid = transitions.filter((value) => value !== delta && value !== -delta)
  return { input, residual, reconstruction, deltaOutput, delta, invalid, transitions }
}

function drawChart(canvas, series, colors, range = 1.2) {
  const rect = canvas.getBoundingClientRect(); const ratio = window.devicePixelRatio || 1; canvas.width = rect.width * ratio; canvas.height = rect.height * ratio; const context = canvas.getContext('2d'); context.scale(ratio, ratio); const width = rect.width; const height = rect.height; context.clearRect(0, 0, width, height)
  context.strokeStyle = '#e2ddd2'; context.lineWidth = 1; for (let line = 1; line < 4; line += 1) { const y = (height / 4) * line; context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke() } context.strokeStyle = '#c8c0b4'; context.beginPath(); context.moveTo(0, height / 2); context.lineTo(width, height / 2); context.stroke()
  series.forEach((values, seriesIndex) => { context.strokeStyle = colors[seriesIndex]; context.lineWidth = seriesIndex === 0 ? 2 : 2.5; context.beginPath(); values.forEach((value, index) => { const x = (index / (values.length - 1)) * width; const y = height / 2 - (value / range) * (height * 0.42); if (index === 0) context.moveTo(x, y); else context.lineTo(x, y) }); context.stroke() })
}

function render() {
  const data = simulate(); outputs.frequency.textContent = `${Number(controls.frequency.value).toFixed(1)} Hz`; outputs.step.textContent = Number(controls.step.value).toFixed(2); outputs.gain.textContent = Number(controls.gain.value).toFixed(2)
  drawChart($('#dpcm-chart'), [data.input, data.reconstruction], ['#ee5a3d', '#1e7c75']); drawChart($('#delta-chart'), [data.input, data.deltaOutput], ['#ee5a3d', '#c58a2b'])
  const meanError = data.input.reduce((total, value, index) => total + Math.abs(value - data.reconstruction[index]), 0) / sampleCount; const residualRange = Math.max(...data.residual.map(Math.abs)); $('#dpcm-error').textContent = `mean error ${meanError.toFixed(3)}`; $('#mean-error').textContent = meanError.toFixed(3); $('#residual-range').textContent = `±${residualRange.toFixed(2)}`; $('#quantized-levels').textContent = new Set(data.residual.map((value) => Math.round(value / data.delta))).size
  const valid = data.invalid.length === 0; $('#validation-message').textContent = valid ? `All ${data.transitions.length} transitions are exactly +Δ or −Δ.` : `${data.invalid.length} transitions failed the ±Δ check.`; $('#validation-pill').textContent = valid ? 'PASS' : 'CHECK'; $('#validation-pill').classList.toggle('fail', !valid); $('#delta-rate').textContent = `step integrity ${valid ? '100%' : `${Math.round((1 - data.invalid.length / data.transitions.length) * 100)}%`}`
}

Object.values(controls).forEach((control) => control.addEventListener('input', render)); $('#reset').addEventListener('click', () => { controls.frequency.value = 3; controls.step.value = 0.22; controls.gain.value = 0.92; render() }); window.addEventListener('resize', render); render()
