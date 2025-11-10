const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const out = document.getElementById('out');
const spacingInput = document.getElementById('spacing');
const resampleBtn = document.getElementById('resampleBtn');
const clearBtn = document.getElementById('clearBtn');
const copyBtn = document.getElementById('copyBtn');
const addGestureBtn = document.getElementById('addGestureBtn');
const deleteGesturesBtn = document.getElementById('deleteGesturesBtn');
const gestureNameInput = document.getElementById('gestureName');
const statusEl = document.getElementById('status');
const galleryList = document.getElementById('galleryList');
const checkReverseInput = document.getElementById('checkReverse');
const importInput = document.getElementById('importInput');
const importBtn = document.getElementById('importBtn');
const galleryExport = document.getElementById('galleryExport');
const copyGalleryBtn = document.getElementById('copyGalleryBtn');

let drawing = false;
let rawPoints = []; // {x,y}
let sampled = []; // sampled points
const recognizer = new DollarRecognizer();

function getPos(e){
  const r = canvas.getBoundingClientRect();
  if(e.touches && e.touches.length) {
    return {x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top};
  }
  return {x: e.clientX - r.left, y: e.clientY - r.top};
}

function start(e){
  e.preventDefault();
  rawPoints = [];
  sampled = [];
  drawing = true;
  const p = getPos(e);
  rawPoints.push(p);
  draw();
}

function move(e){
  if(!drawing) return;
  e.preventDefault();
  const p = getPos(e);
  const last = rawPoints[rawPoints.length-1];
  // avoid duplicate exact points
  if(!last || last.x !== p.x || last.y !== p.y) rawPoints.push(p);
  draw();
}

function end(e){
  if(!drawing) return;
  drawing = false;
  // when finished, resample
  const spacing = Math.max(1, Number(spacingInput.value) || 20);
  sampled = resampleBySpacing(rawPoints, spacing);
  draw();
  updateOutput(sampled);
  recognizeCurrent();
}

// simple resample by distance: produce points every 'spacing' pixels along path
function resampleBySpacing(points, spacing){
  // Resample the input polyline so that points are roughly `spacing` pixels apart.
  if(!points || points.length===0) return [];
  if(points.length===1) return [{x: points[0].x, y: points[0].y}];
  const out = [];
  let D = 0; // accumulated distance from last sampled point
  out.push({x: points[0].x, y: points[0].y});

  for(let i=1;i<points.length;i++){
    // work with a copy of the segment start so we don't mutate original points
    let p1 = {x: points[i-1].x, y: points[i-1].y};
    const p2 = points[i];
    let dx = p2.x - p1.x;
    let dy = p2.y - p1.y;
    let d = Math.hypot(dx,dy);
    if(d === 0) continue;

    while(d + D >= spacing){
      const t = (spacing - D) / d; // fraction along current segment
      const nx = p1.x + dx * t;
      const ny = p1.y + dy * t;
      out.push({x: nx, y: ny});
      // advance p1 to the newly created point and recompute remaining segment
      p1 = {x: nx, y: ny};
      dx = p2.x - p1.x;
      dy = p2.y - p1.y;
      d = Math.hypot(dx,dy);
      D = 0;
      if(d === 0) break;
    }
    D += d;
  }

  // ensure the final original point is included
  const last = points[points.length-1];
  const lastOut = out[out.length-1];
  if(!lastOut || Math.hypot(last.x-lastOut.x, last.y-lastOut.y) > 0.5) out.push({x: last.x, y: last.y});
  return out;
}

// draw raw stroke and sampled points
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // draw raw polyline
  if(rawPoints.length>0){
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#222';
    ctx.beginPath();
    ctx.moveTo(rawPoints[0].x, rawPoints[0].y);
    for(let i=1;i<rawPoints.length;i++) ctx.lineTo(rawPoints[i].x, rawPoints[i].y);
    ctx.stroke();
  }
  // draw sampled points as small circles
  if(sampled && sampled.length>0){
    ctx.fillStyle = '#d33';
    for(let i=0;i<sampled.length;i++){
      const p = sampled[i];
      ctx.beginPath();
      const radius = i === 0 ? 8 : 3;
      ctx.arc(p.x, p.y, radius,0,Math.PI*2);
      ctx.fill();
    }
    // connect sampled with a thin line
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = '#d33';
    ctx.beginPath();
    ctx.moveTo(sampled[0].x, sampled[0].y);
    for(let i=1;i<sampled.length;i++) ctx.lineTo(sampled[i].x, sampled[i].y);
    ctx.stroke();
  }
}

function updateOutput(arr){
  if(!arr || arr.length===0){ out.value = ''; return; }
  const pointStrings = arr.map(p => `new Point(${Math.round(p.x)}, ${Math.round(p.y)})`);
  const pointsArray = `new Array(${pointStrings.join(',')})`;
  out.value = `this.Unistrokes.push(new Unistroke("symbol_name", ${pointsArray}));`;
}

function toDollarPoints(arr){
  return arr.map(p => new Point(Math.round(p.x), Math.round(p.y)));
}

function setStatus(message, isError = false){
  if(!statusEl) return;
  statusEl.textContent = message || '';
  statusEl.classList.toggle('error', !!isError && !!message);
}

function recognizeCurrent(){
  if(!recognizer) return;
  if(!sampled.length){
    setStatus('');
    return;
  }
  
  const points = toDollarPoints(sampled);
  const result1 = recognizer.Recognize(points, false);
  
  if(!checkReverseInput || !checkReverseInput.checked){
    // Normal recognition only
    if(result1.Name === 'No match.'){
      setStatus('No match.', true);
    }else{
      const percent = (result1.Score * 100).toFixed(1);
      setStatus(`Matched "${result1.Name}" (${percent}%), ${result1.Time} ms.`);
    }
    return;
  }
  
  // Check both normal and reversed
  const reversedPoints = points.slice().reverse();
  const result2 = recognizer.Recognize(reversedPoints, false);
  
  // Find the best result
  const bestResult = result1.Score > result2.Score ? result1 : result2;
  
  if(bestResult.Name === 'No match.'){
    setStatus('No match (both directions).', true);
    return;
  }
  
  const bestPercent = (bestResult.Score * 100).toFixed(1);
  
  let statusText = `Normal: "${result1.Name}" (${(result1.Score * 100).toFixed(1)}%), ${result1.Time} ms.\n`;
  statusText += `Reversed: "${result2.Name}" (${(result2.Score * 100).toFixed(1)}%), ${result2.Time} ms.\n`;
  statusText += `Best: "${bestResult.Name}" (${bestPercent}%)`;
  
  setStatus(statusText);
}

function toPlainPoints(points){
  if(!points) return [];
  return points.map(p => ({
    x: 'X' in p ? p.X : p.x,
    y: 'Y' in p ? p.Y : p.y
  }));
}

function loadGestureFromTemplate(points, name){
  const plain = toPlainPoints(points);
  if(!plain.length) return;
  drawing = false;
  rawPoints = plain.map(p => ({x: p.x, y: p.y}));
  const spacing = Math.max(1, Number(spacingInput.value) || 20);
  sampled = resampleBySpacing(rawPoints, spacing);
  updateOutput(sampled);
  draw();
  if(recognizer && sampled.length){
    const result = recognizer.Recognize(toDollarPoints(sampled), false);
    if(result.Name === 'No match.'){
      setStatus(`Loaded template "${name || 'gesture'}" (no match).`, true);
    }else{
      const percent = (result.Score * 100).toFixed(1);
      setStatus(`Loaded template "${name || result.Name}". Matched "${result.Name}" (${percent}%), ${result.Time} ms.`);
    }
  }else if(name){
    setStatus(`Loaded template "${name}".`);
  }
}

function deleteGestureAt(index){
  if(index < 0 || index >= recognizer.Unistrokes.length) return;
  const removed = recognizer.Unistrokes.splice(index,1)[0];
  setStatus(`Deleted gesture "${removed ? removed.Name : 'Unknown'}".`);
  renderGallery();
}

function drawTemplate(ctx, points){
  if(!ctx || !points || !points.length) return;
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  ctx.clearRect(0,0,width,height);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for(let i=0;i<points.length;i++){
    const px = points[i].X;
    const py = points[i].Y;
    if(px < minX) minX = px;
    if(px > maxX) maxX = px;
    if(py < minY) minY = py;
    if(py > maxY) maxY = py;
  }
  if(!isFinite(minX) || !isFinite(minY)) return;

  let drawableWidth = maxX - minX;
  let drawableHeight = maxY - minY;
  if(drawableWidth === 0) drawableWidth = 1;
  if(drawableHeight === 0) drawableHeight = 1;
  const padding = 8;
  const scale = Math.min(
    (width - padding * 2) / drawableWidth,
    (height - padding * 2) / drawableHeight
  );
  const offsetX = (width - drawableWidth * scale) / 2;
  const offsetY = (height - drawableHeight * scale) / 2;

  const mapped = points.map(p => ({
    x: (p.X - minX) * scale + offsetX,
    y: (p.Y - minY) * scale + offsetY
  }));

  ctx.strokeStyle = '#444';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(mapped[0].x, mapped[0].y);
  for(let i=1;i<mapped.length;i++){
    ctx.lineTo(mapped[i].x, mapped[i].y);
  }
  ctx.stroke();

  ctx.fillStyle = '#d33';
  for(let i=0;i<mapped.length;i++){
    const pt = mapped[i];
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, i === 0 ? 5 : 2, 0, Math.PI*2);
    ctx.fill();
  }
}

function generateExportText(){
  if(!recognizer || !recognizer.Unistrokes) return '';
  
  const lines = [];
  recognizer.Unistrokes.forEach((unistroke) => {
    if(!unistroke || !unistroke.OriginalPoints) return;
    
    const points = unistroke.OriginalPoints;
    const pointStrings = points.map(p => `new Point(${p.X}, ${p.Y})`);
    const pointsArray = `new Array(${pointStrings.join(',')})`;
    const line = `this.Unistrokes.push(new Unistroke("${unistroke.Name}", ${pointsArray}));`;
    lines.push(line);
  });
  
  return lines.join('\n');
}

function renderGallery(){
  if(!galleryList || !recognizer || !recognizer.Unistrokes) return;
  galleryList.innerHTML = '';
  recognizer.Unistrokes.forEach((unistroke, index) => {
    if(!unistroke || !unistroke.Points) return;
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.setAttribute('role', 'button');
    item.tabIndex = 0;

    const templateCanvas = document.createElement('canvas');
    templateCanvas.width = 100;
    templateCanvas.height = 100;
    templateCanvas.className = 'gallery-canvas';
    const templateCtx = templateCanvas.getContext('2d');
    const sourcePoints = unistroke.OriginalPoints || unistroke.Points;
    drawTemplate(templateCtx, sourcePoints);

    const label = document.createElement('span');
    label.className = 'gallery-label';
    label.textContent = unistroke.Name;

    item.appendChild(templateCanvas);
    item.appendChild(label);

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'gallery-delete';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', e=>{
      e.stopPropagation();
      deleteGestureAt(index);
    });
    deleteBtn.addEventListener('keydown', e=>{
      if(e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        deleteGestureAt(index);
      }
    });
    item.appendChild(deleteBtn);

    const activate = ()=>{
      loadGestureFromTemplate(sourcePoints, unistroke.Name);
    };
    item.addEventListener('click', activate);
    item.addEventListener('keydown', e=>{
      if(e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        activate();
      }
    });
    galleryList.appendChild(item);
  });
  
  // Update export textarea
  if(galleryExport){
    galleryExport.value = generateExportText();
  }
}

// helpers: mouse + touch
canvas.addEventListener('mousedown', start);
window.addEventListener('mousemove', move);
window.addEventListener('mouseup', end);
canvas.addEventListener('touchstart', start, {passive:false});
window.addEventListener('touchmove', move, {passive:false});
window.addEventListener('touchend', end);

clearBtn.addEventListener('click', ()=>{
  rawPoints=[];
  sampled=[];
  out.value='';
  setStatus('Canvas cleared.');
  draw();
});

copyBtn.addEventListener('click', async ()=>{
  try{
    await navigator.clipboard.writeText(out.value);
    copyBtn.textContent = 'Copied ✓';
    setTimeout(()=>copyBtn.textContent='Copy to clipboard',900);
  }catch(e){
    alert('Copy failed — copy manually.');
  }
});

if(copyGalleryBtn && galleryExport){
  copyGalleryBtn.addEventListener('click', async ()=>{
    try{
      await navigator.clipboard.writeText(galleryExport.value);
      copyGalleryBtn.textContent = 'Copied ✓';
      setTimeout(()=>copyGalleryBtn.textContent='Copy to clipboard',900);
    }catch(e){
      alert('Copy failed — copy manually.');
    }
  });
}

if(checkReverseInput){
  checkReverseInput.addEventListener('change', ()=>{
    if(sampled.length){
      recognizeCurrent();
    }
  });
}

if(resampleBtn){
  resampleBtn.addEventListener('click', ()=>{
    if(!rawPoints.length){
      setStatus('Draw a gesture first.', true);
      return;
    }
    const spacing = Math.max(1, Number(spacingInput.value) || 20);
    sampled = resampleBySpacing(rawPoints, spacing);
    updateOutput(sampled);
    draw();
    recognizeCurrent();
  });
}

if(addGestureBtn){
  addGestureBtn.addEventListener('click', ()=>{
    if(!gestureNameInput){
      setStatus('Gesture name input missing.', true);
      return;
    }
    const name = gestureNameInput.value.trim();
    if(!name){
      setStatus('Enter a gesture name.', true);
      gestureNameInput.focus();
      return;
    }
    if(!sampled.length){
      setStatus('Draw a gesture first.', true);
      return;
    }
    const total = recognizer.AddGesture(name, toDollarPoints(sampled));
    setStatus(`Saved gesture "${name}". Templates with this name: ${total}.`);
    gestureNameInput.value = '';
    renderGallery();
  });
}

if(deleteGesturesBtn){
  deleteGesturesBtn.addEventListener('click', ()=>{
    recognizer.Unistrokes = [];
    setStatus('All gestures removed.');
    renderGallery();
  });
}

function parseImportText(text){
  if(!text || !text.trim()) return [];
  
  const gestures = [];
  // Match: (optional: this.Unistrokes[...] = or this.Unistrokes.push() ) new Unistroke("name", new Array(...))
  // We'll match the name first, then find the array content by counting parentheses
  const unistrokePattern = /(?:this\.Unistrokes(?:\[\d+\]\s*=\s*|\.push\s*\()\s*)?new\s+Unistroke\s*\(\s*["']([^"']+)["']\s*,\s*new\s+Array\s*\(/g;
  
  let match;
  while((match = unistrokePattern.exec(text)) !== null){
    const name = match[1];
    const startPos = match.index + match[0].length;
    
    // Find the matching closing paren for the Array
    let depth = 1;
    let pos = startPos;
    let endPos = -1;
    
    while(pos < text.length && depth > 0){
      if(text[pos] === '(') depth++;
      else if(text[pos] === ')') depth--;
      pos++;
    }
    
    if(depth === 0){
      endPos = pos - 1;
      const pointsText = text.substring(startPos, endPos);
      
      // Extract all Point(x, y) from the array
      const pointPattern = /new\s+Point\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/g;
      const points = [];
      let pointMatch;
      
      while((pointMatch = pointPattern.exec(pointsText)) !== null){
        const x = parseInt(pointMatch[1], 10);
        const y = parseInt(pointMatch[2], 10);
        if(!isNaN(x) && !isNaN(y)){
          points.push(new Point(x, y));
        }
      }
      
      if(points.length > 0){
        gestures.push({name, points});
      }
    }
  }
  
  return gestures;
}

if(importBtn && importInput){
  importBtn.addEventListener('click', ()=>{
    const text = importInput.value.trim();
    if(!text){
      setStatus('Enter gesture data to import.', true);
      return;
    }
    
    const gestures = parseImportText(text);
    if(gestures.length === 0){
      setStatus('No valid gestures found in import text.', true);
      return;
    }
    
    let imported = 0;
    for(const gesture of gestures){
      try{
        recognizer.AddGesture(gesture.name, gesture.points);
        imported++;
      }catch(e){
        console.error('Error importing gesture:', gesture.name, e);
      }
    }
    
    setStatus(`Imported ${imported} gesture(s).`);
    importInput.value = '';
    renderGallery();
  });
}

// initial draw
draw();
renderGallery();

