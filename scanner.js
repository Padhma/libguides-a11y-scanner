(function() {
  'use strict';
  
  // Prevent multiple instances
  if (document.getElementById('a11y-overlay')) {
    alert('Scanner already running!');
    return;
  }

  // ============= CONFIGURATION =============
  const ISSUE_EXPLANATIONS = {
    'image-alt': {title:'Images Missing Descriptions', plain:'Images need alternative text so screen readers can describe them to blind users.', howToFix:'In LibGuides editor: Click the image → Properties → Add description in "Alternative Text" field. Describe what the image shows.', priority:'critical', canFix:true},
    'decorative-image-role': {title:'Decorative Image Needs role="presentation"', plain:'This image has empty alt text (decorative), but should be explicitly marked with role="presentation" for screen readers.', howToFix:'In LibGuides editor: Click image → Properties → In the "Advanced" tab, add Attribute: role="presentation". Or add descriptive alt text if the image isn\'t decorative.', priority:'minor', canFix:true},
    'link-url-only-text': {title:'Links Use URLs as Text', plain:'These links display the full URL (like "http://proxy.lib...") instead of descriptive text. Screen reader users hear the entire URL read aloud.', howToFix:'In LibGuides editor: Highlight the link → Change the visible text to something descriptive like "View in ProQuest Database" while keeping the URL in the link target.', priority:'important', canFix:true},
    'image-no-alt': {title:'Images Missing Alt Attribute', plain:'These images have no alt attribute at all. Every image must have alt="" (if decorative) or descriptive alt text.', howToFix:'In LibGuides editor: Click image → Properties → Add alt text describing the image, or use alt="" if purely decorative.', priority:'critical', canFix:true},
    'image-alt-quality': {title:'Alt Text Quality Issues', plain:'Alt text contains problematic patterns: starts with phrases like "image of", is a filename, too long, or all caps.', howToFix:'Revise alt text. Remove leading phrases like "image of". Keep under 250 characters.', priority:'moderate', canFix:true},
    'label': {title:'Form Fields Missing Labels', plain:'Search boxes and input fields need visible labels so users know what to enter.', howToFix:'Add a text label above the field, or contact library-web-support@umich.edu if it\'s a widget.', priority:'critical', canFix:true},
    'link-name': {title:'Links Without Descriptive Text', plain:'Links need text that describes where they go. Avoid "click here" or "read more".', howToFix:'Change link text to be specific: "View Chemistry Guide" instead of "click here".', priority:'important', canFix:true},
    'empty-heading': {title:'Empty Headings', plain:'Headings must contain text. Empty headings confuse screen readers.', howToFix:'Add text to the heading or delete it.', priority:'critical', canFix:true},
    'heading-order': {title:'Heading Structure Problems', plain:'Headings should go in order (H1 → H2 → H3), not skip levels.', howToFix:'Change heading level in editor to correct sequence.', priority:'important', canFix:true},
    'color-contrast': {title:'Text Hard to Read (Low Contrast)', plain:'Text color doesn\'t stand out enough from background.', howToFix:'Use darker text colors or default styling.', priority:'important', canFix:true},
    'button-name': {title:'Buttons Without Labels', plain:'Buttons need text or labels that describe what they do.', howToFix:'Add text inside the button, or remove empty buttons.', priority:'critical', canFix:true},
    'landmark-one-main': {title:'Multiple Main Content Areas', plain:'Page has multiple "main" regions. This is usually a LibGuides template issue.', howToFix:'SYSTEM ISSUE: Contact library-web-support@umich.edu.', priority:'system', canFix:false},
    'page-has-heading-one': {title:'Missing Main Page Title (H1)', plain:'Pages should have one H1 heading that describes the main content.', howToFix:'Check that your page title is set. Edit Page → Page Title field.', priority:'important', canFix:true},
    'region': {title:'Content Not in Proper Sections', plain:'Some content isn\'t inside proper page sections.', howToFix:'Put main content in center content boxes. May be partially a template issue.', priority:'minor', canFix:'partial'},
    'landmark-banner-is-top-level': {title:'Banner Structure Issue', plain:'Page header structure problem - usually a LibGuides system issue.', howToFix:'SYSTEM ISSUE: You can ignore this or contact library-web-support@umich.edu.', priority:'system', canFix:false}
  };

  // ============= IMPROVED SCORING LOGIC =============
  function calculateAccessibilityScore(violations) {
    let score = 100;
    
    // Group violations by rule ID to cap per-issue-type deductions
    const violationsByRule = {};
    violations.forEach(v => {
      if (!violationsByRule[v.id]) {
        violationsByRule[v.id] = { impact: v.impact, count: 0 };
      }
      violationsByRule[v.id].count += v.nodes.length;
    });
    
    // Calculate deductions with caps per rule type
    Object.values(violationsByRule).forEach(rule => {
      let deduction = 0;
      const count = rule.count;
      
      // Base deduction per instance
      if (rule.impact === 'critical') deduction = count * 8;      // Reduced from 15
      else if (rule.impact === 'serious') deduction = count * 5;  // Reduced from 10
      else if (rule.impact === 'moderate') deduction = count * 3; // Reduced from 5
      else if (rule.impact === 'minor') deduction = count * 2;    // Reduced from 3
      
      // Cap maximum deduction per rule type to prevent one issue from dominating
      const maxDeductionPerRule = {
        'critical': 25,   // Max 25 points for any single critical issue type
        'serious': 20,    // Max 20 points for any single serious issue type
        'moderate': 15,   // Max 15 points for any single moderate issue type
        'minor': 10       // Max 10 points for any single minor issue type
      };
      
      deduction = Math.min(deduction, maxDeductionPerRule[rule.impact] || 15);
      score -= deduction;
    });
    
    // Apply a floor - even terrible pages should show some score
    // This helps distinguish between "bad" (30) and "very bad" (15)
    score = Math.max(15, score);
    
    return Math.round(score);
  }
  function getExplanation(ruleId){
    if(ISSUE_EXPLANATIONS[ruleId]) return ISSUE_EXPLANATIONS[ruleId];
    for(let key in ISSUE_EXPLANATIONS) if(ruleId.includes(key)||key.includes(ruleId)) return ISSUE_EXPLANATIONS[key];
    return {title:'Accessibility Issue', plain:'This element has an accessibility problem.', howToFix:'Review the technical description below for details.', priority:'important', canFix:true};
  }

  function highlightAllElements(selectors){
    document.querySelectorAll('.a11y-highlight').forEach(el=>el.classList.remove('a11y-highlight'));
    if(!document.getElementById('a11y-highlight-style')){
      const style=document.createElement('style');
      style.id='a11y-highlight-style';
      style.textContent=`.a11y-highlight {outline: 4px solid #ffcb05 !important;outline-offset: 2px !important;background: rgba(255, 203, 5, 0.1) !important;scroll-margin: 100px;}`;
      document.head.appendChild(style);
    }
    let successCount = 0;
    selectors.forEach(selector => {
      try {
        document.querySelectorAll(selector).forEach(el => {
          if(el){
            el.classList.add('a11y-highlight');
            successCount++;
            if(successCount === 1) el.scrollIntoView({behavior:'smooth', block:'center'});
          }
        });
      }catch(e){console.error('Could not highlight:', selector, e);}
    });
    return successCount > 0;
  }

  function runCustomChecks(context){
    const violations = [];
    const container = context === document ? document : context;
    const decorativeImages = container.querySelectorAll('img[alt=""]');
    if(decorativeImages.length>0){
      const nodes=Array.from(decorativeImages).filter(img=>!img.hasAttribute('role')||img.getAttribute('role')!=='presentation');
      if(nodes.length>0) violations.push({id:'decorative-image-role', impact:'minor', help:'Decorative Images Should Have role="presentation"', description:'Images with empty alt text should explicitly be marked as decorative with role="presentation"', nodes:nodes.map(el=>({target:[getCssSelector(el)], html:el.outerHTML.substring(0,100)}))});
    }
    const links = container.querySelectorAll('a');
    const urlOnlyLinks = Array.from(links).filter(link=>{
      const text = link.textContent.trim();
      return text.startsWith('http://') || text.startsWith('https://');
    });
    if(urlOnlyLinks.length>0) violations.push({id:'link-url-only-text', impact:'serious', help:'Links Should Not Use URLs as Link Text', description:'Links with URLs as text are not descriptive.', nodes:urlOnlyLinks.map(el=>({target:[getCssSelector(el)], html:el.outerHTML.substring(0,150)}))});
    const imagesNoAlt = container.querySelectorAll('img:not([alt])');
    if(imagesNoAlt.length>0) violations.push({id:'image-no-alt', impact:'critical', help:'Images Must Have Alt Attributes', description:'All images must have an alt attribute, even if empty for decorative images.', nodes:Array.from(imagesNoAlt).map(el=>({target:[getCssSelector(el)], html:el.outerHTML.substring(0,100)}))});
    const imagesWithAlt = container.querySelectorAll('img[alt]');
    const badAltImages = Array.from(imagesWithAlt).filter(img=>{
      const alt = img.alt.toLowerCase();
      if(!alt) return false;
      return (
        alt.startsWith('image of') ||
        alt.startsWith('picture of') ||
        alt.startsWith('photo of') ||
        alt.startsWith('graphic of') ||
        alt.startsWith('screenshot of') ||
        alt.match(/\.(jpg|jpeg|png|gif|svg|webp|bmp)$/i) ||
        alt.length > 250 ||
        (alt === alt.toUpperCase() && alt.length > 10)
      );
    });
    if(badAltImages.length>0) violations.push({id:'image-alt-quality', impact:'moderate', help:'Alt Text Quality Issues', description:'Alt text should be concise (<250 chars), avoid phrases like "image of", and not be filenames or all caps.', nodes:badAltImages.map(el=>({target:[getCssSelector(el)], html:el.outerHTML.substring(0,100), altText:el.alt}))});
    return violations;
  }

  function getCssSelector(el){
    if(el.id) return `#${el.id}`;
    const path = [];
    let current = el;
    while(current && current.nodeType === Node.ELEMENT_NODE && current !== document.body){
      let selector = current.tagName.toLowerCase();
      if(current.id){
        selector = `#${current.id}`;
        path.unshift(selector);
        break;
      }
      if(current.className && typeof current.className === 'string'){
        const classes = current.className.trim().split(/\s+/).slice(0,2).join('.');
        if(classes) selector += `.${classes}`;
      }
      if(current.parentElement){
        const siblings = Array.from(current.parentElement.children);
        const index = siblings.indexOf(current);
        if(siblings.length > 1) selector += `:nth-child(${index+1})`;
      }
      path.unshift(selector);
      current = current.parentElement;
      if(path.length > 5) break;
    }
    return path.join(' > ');
  }

  function findLibGuidesContainer(){
    const candidates = ['#s-lg-guide-main','#s-lg-content','.s-lg-guide-body','#s-lg-public-main','[id^="s-lg-box"]'];
    for(let sel of candidates){
      const el = document.querySelector(sel);
      if(el) return el;
    }
    return document;
  }

  // ============= MULTI-PAGE DISCOVERY =============
  function discoverGuidePages() {
    const currentGuideId = window.location.href.match(/g=(\d+)/)?.[1];
    
    if (!currentGuideId) {
      return [{ title: document.title || 'Current Page', url: window.location.href }];
    }
    
    const guidePages = Array.from(document.querySelectorAll('a'))
      .filter(link => {
        if (!link.href.includes(`g=${currentGuideId}`) || !link.href.includes('&p=')) return false;
        const text = link.textContent.trim().toLowerCase();
        if (text.includes('skip to') || text.includes('next:') || text.includes('previous:') || link.href.includes('#')) return false;
        return true;
      })
      .map(link => ({
        title: link.textContent.trim() || 'Untitled Page',
        url: link.href.split('#')[0]
      }));
    
    // Remove duplicates
    const uniquePages = Array.from(new Map(guidePages.map(p => [p.url, p])).values());
    
    return uniquePages.length > 0 ? uniquePages : [{ title: document.title || 'Current Page', url: window.location.href }];
  }

  // ============= MULTI-PAGE SCANNER =============
  async function scanMultiplePages(pages) {
    const results = [];
    const totalPages = pages.length;
    let scannedCount = 0;
    
    // Scan pages in batches of 3 to avoid overwhelming browser
    const batchSize = 3;
    
    for (let i = 0; i < pages.length; i += batchSize) {
      const batch = pages.slice(i, i + batchSize);
      const batchPromises = batch.map(page => scanPageInIframe(page, scannedCount, totalPages));
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, idx) => {
        scannedCount++;
        updateProgress(scannedCount, totalPages);
        
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            page: batch[idx],
            violations: [],
            error: result.reason.message || 'Failed to scan page'
          });
        }
      });
    }
    
    return results;
  }

  function scanPageInIframe(page, current, total) {
    return new Promise((resolve, reject) => {
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:absolute;width:0;height:0;border:none;visibility:hidden;';
      iframe.src = page.url;
      
      const timeout = setTimeout(() => {
        iframe.remove();
        reject(new Error('Timeout'));
      }, 15000); // 15 second timeout per page
      
      iframe.onload = async function() {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
          const container = iframeDoc.querySelector('#s-lg-guide-main') || iframeDoc.querySelector('#s-lg-content') || iframeDoc.body;
          
          // Load axe in iframe if needed
          if (typeof iframe.contentWindow.axe === 'undefined') {
            await loadAxeInIframe(iframe);
          }
          
          // Run axe scan
          const axeResults = await iframe.contentWindow.axe.run(container, {
            runOnly: ['wcag2a', 'wcag2aa', 'best-practice'],
            resultTypes: ['violations']
          });
          
          // Run custom checks (need to inject our function)
          const customResults = await runCustomChecksInIframe(iframe, container);
          
          clearTimeout(timeout);
          iframe.remove();
          
          resolve({
            page: page,
            violations: [...axeResults.violations, ...customResults]
          });
        } catch (err) {
          clearTimeout(timeout);
          iframe.remove();
          reject(err);
        }
      };
      
      iframe.onerror = function() {
        clearTimeout(timeout);
        iframe.remove();
        reject(new Error('Failed to load page'));
      };
      
      document.body.appendChild(iframe);
    });
  }

  function loadAxeInIframe(iframe) {
    return new Promise((resolve, reject) => {
      const script = iframe.contentDocument.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.2/axe.min.js';
      script.onload = resolve;
      script.onerror = reject;
      iframe.contentDocument.head.appendChild(script);
    });
  }

  async function runCustomChecksInIframe(iframe, context) {
    // Inject custom check logic into iframe
    const customCheckCode = `
      (${runCustomChecks.toString()})
    `;
    
    const getCssSelectorCode = `
      (${getCssSelector.toString()})
    `;
    
    iframe.contentWindow.eval(`
      window.getCssSelector = ${getCssSelectorCode};
      window.runCustomChecks = ${customCheckCode};
    `);
    
    return iframe.contentWindow.runCustomChecks(context);
  }

  function updateProgress(current, total) {
    const percent = Math.round((current / total) * 100);
    const statusEl = document.getElementById('scan-status');
    if (statusEl) {
      statusEl.textContent = `Scanning page ${current} of ${total}... (${percent}%)`;
    }
  }

  // ============= UI INITIALIZATION =============
  function initScanner(){
    if(!document.getElementById('a11y-global-styles')){
      const style = document.createElement('style');
      style.id = 'a11y-global-styles';
      style.textContent = `
        @keyframes slideIn{from{transform:translateX(100%);}to{transform:translateX(0);}}
        @keyframes slideOut{from{transform:translateX(0);}to{transform:translateX(100%);}}
        @media(max-width:768px){#a11y-overlay{width:100% !important;}}
        #a11y-resizer {position: absolute;top: 0;left: -8px;bottom: 0;width: 16px;cursor: col-resize;z-index: 1000000;}
      `;
      document.head.appendChild(style);
    }
    
    // Create sidebar
    const sidebar = document.createElement('div');
    sidebar.id = 'a11y-overlay';
    sidebar.style.cssText = `position:fixed;top:0;right:0;bottom:0;width:450px;background:white;z-index:999999;display:flex;flex-direction:column;box-shadow:-4px 0 20px rgba(0,0,0,0.3);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;animation:slideIn 0.3s ease-out;transition:transform 0.3s cubic-bezier(0.4,0,0.2,1);`;
    
    sidebar.innerHTML = `
      <div id="a11y-resizer" title="Drag to resize sidebar"></div>
      <div role="banner" id="a11y-header" style="background:#00274c;color:white;padding:20px;border-bottom:3px solid #ffcb05;transition:opacity 0.3s ease;">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
          <h2 style="margin:0;font-size:20px;flex:1;color:#ffffff;">🔍 A11y Scanner</h2>
          <button id="scan-mode-toggle" style="background:#FFCB05;border-radius:6px;padding:8px 12px;color:#00274C;font-weight:600;font-size:12px;cursor:pointer;transition:all 0.2s;" title="Switch scan mode">
            Multi-Page
          </button>
          <button id="a11y-close-btn" style="background:none;border:2px solid #ffcb05;border-radius:50%;width:40px;height:40px;line-height:1;color:#ffcb05;font-weight:bold;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s ease;" title="Close scanner" aria-label="Close">✕</button>
        </div>
        <div id="scan-status" style="margin-top:10px;font-size:14px;opacity:0.9;color:#ffffff;">Discovering pages...</div>
      </div>
      <main id="a11y-results" style="flex:1;overflow-y:auto;padding:20px;color:#333;text-align:center;">Initializing scanner...<br><br>⏳</main>
    `;
    
    document.body.appendChild(sidebar);
    
    // Close button
    document.getElementById('a11y-close-btn').onclick = () => {
      sidebar.style.animation = 'slideOut 0.3s ease-in';
      sidebar.addEventListener('animationend', () => sidebar.remove());
    };
    
    // Resizing logic
    const resizer = document.getElementById('a11y-resizer');
    let isResizing = false;
    const minWidth = 300;
    
    resizer.addEventListener('mousedown', function(e) {
      isResizing = true;
      sidebar.style.transition = 'none';
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    });
    
    document.addEventListener('mousemove', function(e) {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > minWidth) sidebar.style.width = newWidth + 'px';
    });
    
    document.addEventListener('mouseup', function() {
      if (isResizing) {
        isResizing = false;
        sidebar.style.transition = 'transform 0.3s cubic-bezier(0.4,0,0.2,1)';
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      }
    });
    
    // Mode toggle
    let isMultiPage = true;
    const toggleBtn = document.getElementById('scan-mode-toggle');
    
    toggleBtn.onclick = function() {
      isMultiPage = !isMultiPage;
      this.textContent = isMultiPage ? 'Multi-Page' : 'Single-Page';
      startScan(isMultiPage);
    };
    
    // Start initial scan
    startScan(isMultiPage);
  }

  async function startScan(multiPage) {
    document.getElementById('scan-status').textContent = 'Discovering pages...';
    document.getElementById('a11y-results').innerHTML = '<div style="text-align:center;padding:40px;">⏳ Scanning...</div>';
    
    try {
      if (multiPage) {
        const pages = discoverGuidePages();
        document.getElementById('scan-status').textContent = `Found ${pages.length} page(s) to scan...`;
        
        const results = await scanMultiplePages(pages);
        displayMultiPageResults(results);
      } else {
        // Single page mode (original behavior)
        const container = findLibGuidesContainer();
        document.getElementById('scan-status').textContent = 'Scanning current page...';
        
        const axeResults = await axe.run(container, {
          runOnly: ['wcag2a', 'wcag2aa', 'best-practice'],
          resultTypes: ['violations']
        });
        
        const customResults = runCustomChecks(container);
        displaySinglePageResults({ violations: [...axeResults.violations, ...customResults] });
      }
    } catch (err) {
      console.error('Scan error:', err);
      document.getElementById('a11y-results').innerHTML = `
        <div style="color:#dc3545;background:#f8d7da;padding:20px;border-radius:8px;border:1px solid #f5c6cb;">
          <strong>Error:</strong> ${err.message}<br><br>
          <small>Check browser console for details.</small>
        </div>
      `;
    }
  }

  // ============= DISPLAY FUNCTIONS =============
  function displayMultiPageResults(results) {
    const statusEl = document.getElementById('scan-status');
    
    // Calculate overall stats
    let totalViolations = 0;
    let totalScore = 0;
    const pageScores = [];
    
    results.forEach(result => {
      if (result.error) {
        pageScores.push({ page: result.page, score: 0, violations: [], error: result.error });
        return;
      }
      
      const violations = result.violations;
      totalViolations += violations.length;
      
      // Calculate score for this page using improved logic
      const score = calculateAccessibilityScore(violations);
      totalScore += score;
      
      pageScores.push({ page: result.page, score, violations, error: null });
    });
    
    const avgScore = Math.round(totalScore / results.length);
    let scoreColor, scoreMessage;
    if(avgScore >= 95) {scoreColor = '#28a745'; scoreMessage = 'Excellent';}
    else if(avgScore >= 80) {scoreColor = '#ffc107'; scoreMessage = 'Good';}
    else if(avgScore >= 60) {scoreColor = '#fd7e14'; scoreMessage = 'Needs Work';}
    else {scoreColor = '#dc3545'; scoreMessage = 'Poor';}
    
    statusEl.textContent = `Scanned ${results.length} page(s) - ${totalViolations} total issues`;
    
    // Build HTML
    const circumference = 339.292;
    const progress = (avgScore / 100) * circumference;
    const offset = circumference - progress;
    
    let html = `
      <div style="text-align:center;padding:25px 20px 20px;border-bottom:2px solid #e9ecef;margin-bottom:20px;background:#f8f9fa;">
        <div style="font-size:14px;font-weight:700;color:#495057;margin-bottom:15px;text-transform:uppercase;letter-spacing:1.5px;">Overall Guide Score</div>
        <svg width="90" height="90" viewBox="0 0 120 120" style="margin-bottom:0;">
          <circle cx="60" cy="60" r="54" fill="none" stroke="#e9ecef" stroke-width="8"/>
          <circle cx="60" cy="60" r="54" fill="none" stroke="${scoreColor}" stroke-width="8" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" transform="rotate(-90 60 60)" stroke-linecap="round" style="transition:stroke-dashoffset 0.5s ease;"/>
          <text x="60" y="65" text-anchor="middle" font-size="28" font-weight="bold" fill="${scoreColor}">${avgScore}</text>
          <text x="60" y="82" text-anchor="middle" font-size="11" fill="#999">/ 100</text>
        </svg>
        <div style="font-size:16px;font-weight:600;color:${scoreColor};margin-bottom:2px;">${scoreMessage}</div>
        <div style="font-size:12px;color:#999;">${results.length} pages • ${totalViolations} issues</div>
      </div>
    `;
    
    // Keep pages in original navigation order (don't sort by score)
    // pageScores already in correct order from results array
    
    html += `<h3 style="color:#00274c;font-size:16px;margin:20px 0 12px;padding-bottom:8px;border-bottom:2px solid #e9ecef;">📄 Per-Page Results <span style="font-size:12px;font-weight:normal;color:#666;">(in navigation order)</span></h3>`;
    
    pageScores.forEach((item, idx) => {
      const scoreColor = item.score >= 80 ? '#28a745' : item.score >= 60 ? '#ffc107' : '#dc3545';
      const issueCount = item.violations.length;
      
      html += `
        <details style="background:#f8f9fa;padding:15px;margin:12px 0;border-radius:6px;border-left:4px solid ${scoreColor};">
          <summary style="cursor:pointer;font-weight:600;font-size:14px;display:flex;justify-content:space-between;align-items:center;">
            <span>${item.page.title}</span>
            <span style="display:flex;gap:10px;align-items:center;">
              <span style="background:${scoreColor};color:white;padding:4px 10px;border-radius:12px;font-size:11px;">${item.score}/100</span>
              <span style="color:#666;font-size:12px;">${issueCount} issue${issueCount !== 1 ? 's' : ''}</span>
            </span>
          </summary>
          <div style="margin-top:15px;padding-top:15px;border-top:1px solid #dee2e6;">
            ${item.error ? `<p style="color:#dc3545;">Error: ${item.error}</p>` : ''}
            ${item.violations.length === 0 ? '<p style="color:#28a745;">✓ No issues found</p>' : ''}
            ${item.violations.slice(0, 5).map(v => {
              const exp = getExplanation(v.id);
              return `<div style="background:white;padding:10px;margin:8px 0;border-radius:4px;font-size:13px;"><strong>${exp.title}</strong><br><span style="color:#666;">${v.nodes.length} instance(s)</span></div>`;
            }).join('')}
            ${item.violations.length > 5 ? `<p style="font-size:12px;color:#666;margin-top:10px;">...and ${item.violations.length - 5} more</p>` : ''}
          </div>
        </details>
      `;
    });
    
    document.getElementById('a11y-results').innerHTML = html;
  }

  function displaySinglePageResults(results) {
    // Use improved scoring logic
    const violations = results.violations;
    const statusEl = document.getElementById('scan-status');
    const score = calculateAccessibilityScore(violations);
    
    let scoreColor, scoreMessage;
    if(score >= 95) {scoreColor = '#28a745'; scoreMessage = 'Excellent';}
    else if(score >= 80) {scoreColor = '#ffc107'; scoreMessage = 'Good';}
    else if(score >= 60) {scoreColor = '#fd7e14'; scoreMessage = 'Needs Work';}
    else {scoreColor = '#dc3545'; scoreMessage = 'Poor';}
    if(statusEl) statusEl.textContent = violations.length === 0 ? 'Scan complete - No issues!' : `Found ${violations.length} issue(s)`;
    if(violations.length === 0) {
      document.getElementById('a11y-results').innerHTML = `<div style="text-align:center;padding:40px 20px;"><div style="font-size:14px;font-weight:600;color:#666;margin-bottom:15px;text-transform:uppercase;letter-spacing:1px;">Accessibility Score</div><svg width="120" height="120" viewBox="0 0 120 120" style="margin-bottom:20px;"><circle cx="60" cy="60" r="54" fill="none" stroke="#e9ecef" stroke-width="8"/><circle cx="60" cy="60" r="54" fill="none" stroke="#28a745" stroke-width="8" stroke-dasharray="339.292" stroke-dashoffset="0" transform="rotate(-90 60 60)" stroke-linecap="round"/><text x="60" y="65" text-anchor="middle" font-size="32" font-weight="bold" fill="#28a745">100</text><text x="60" y="85" text-anchor="middle" font-size="12" fill="#666">/ 100</text></svg><div style="background:#d4edda;padding:30px;border-radius:10px;color:#155724;text-align:center;border:2px solid #c3e6cb;margin-top:10px;"><div style="font-size:48px;margin-bottom:15px;">✅</div><h3 style="margin:0 0 10px 0;font-size:20px;">Perfect Score!</h3><p style="margin:0;font-size:15px;">No accessibility issues detected in the LibGuides content.</p></div></div>`;
      return;
    }
    const canFix = [], systemIssues = [];
    violations.forEach(v=>{
      const exp = getExplanation(v.id);
      if(exp.canFix === false) systemIssues.push({violation: v, explanation: exp});
      else canFix.push({violation: v, explanation: exp});
    });
    const circumference = 339.292, progress = (score / 100) * circumference, offset = circumference - progress;
    let html = `<div style="text-align:center;padding:25px 20px 20px 20px;border-bottom:2px solid #e9ecef;margin-bottom:20px;background:#f8f9fa;"><div style="font-size:14px;font-weight:700;color:#495057;margin-bottom:15px;text-transform:uppercase;letter-spacing:1.5px;">Accessibility Score</div><svg width="90" height="90" viewBox="0 0 120 120" style="margin-bottom:0px;"><circle cx="60" cy="60" r="54" fill="none" stroke="#e9ecef" stroke-width="8"/><circle cx="60" cy="60" r="54" fill="none" stroke="${scoreColor}" stroke-width="8" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" transform="rotate(-90 60 60)" stroke-linecap="round" style="transition: stroke-dashoffset 0.5s ease;"/><text x="60" y="65" text-anchor="middle" font-size="28" font-weight="bold" fill="${scoreColor}">${score}</text><text x="60" y="82" text-anchor="middle" font-size="11" fill="#999">/ 100</text></svg><div style="font-size:16px;font-weight:600;color:${scoreColor};margin-bottom:2px;">${scoreMessage}</div></div>`;
    if(canFix.length > 0){
      html += `<div style="margin-bottom:25px;"><h3 style="color:#00274c;font-size:16px;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #e9ecef;">✏️ Issues You Can Fix</h3>`;
      canFix.forEach((item,index)=>{
        const v = item.violation, exp = item.explanation;
        const priorityColors = {critical:'#dc3545', important:'#fd7e14', minor:'#17a2b8'};
        const color = priorityColors[exp.priority] || '#6c757d';
        const allSelectors = v.nodes.map(n=>n.target[0]).filter(Boolean).join('|');
        html += `<div style="background:#f8f9fa;padding:15px;margin:12px 0;border-left:4px solid ${color};border-radius:6px;"><div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px;"><h3 style="margin:0;color:#00274c;font-size:15px;font-weight:600;flex:1;line-height:1.3;">${index+1}. ${exp.title}</h3><span style="background:${color};color:white;padding:3px 8px;border-radius:3px;font-size:10px;font-weight:bold;text-transform:uppercase;white-space:nowrap;margin-left:10px;">${exp.priority}</span></div><div style="background:white;padding:12px;border-radius:4px;margin-bottom:10px;"><div style="font-weight:600;color:#495057;margin-bottom:6px;font-size:12px;">📖 What's wrong:</div><p style="margin:0;font-size:13px;color:#666;line-height:1.5;">${exp.plain}</p></div><div style="background:#e7f3ff;padding:12px;border-radius:4px;border-left:3px solid #0066cc;margin-bottom:10px;"><div style="font-weight:600;color:#004085;margin-bottom:6px;font-size:12px;">🔧 How to fix:</div><p style="margin:0;font-size:13px;color:#004085;line-height:1.5;">${exp.howToFix}</p></div><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;"><button class="highlight-btn" data-selectors="${allSelectors}" style="background:#ffcb05;color:#00274c;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:12px;font-weight:600;">👁️ Show on Page</button><span style="font-size:12px;color:#666;">${v.nodes.length} affected</span></div><details style="margin-top:10px;"><summary style="cursor:pointer;font-size:12px;color:#666;font-weight:600;">Technical details</summary><div style="background:white;padding:8px;margin-top:6px;border-radius:4px;font-size:11px;color:#666;line-height:1.5;"><strong>Rule:</strong> ${v.id}<br><strong>WCAG:</strong> ${v.description}<br><strong>Element:</strong> <code style="background:#f8f9fa;padding:2px 4px;border-radius:2px;font-size:10px;">${v.nodes[0]?.target[0]||'N/A'}</code></div></details></div>`;
      });
      html+='</div>';
    }
    if(systemIssues.length > 0){
      html += `<div style="margin-bottom:20px;"><h3 style="color:#6c757d;font-size:16px;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #e9ecef;">⚙️ System Issues</h3>`;
      systemIssues.forEach(item=>{
        const v = item.violation, exp = item.explanation;
        html += `<div style="background:#f8f9fa;padding:15px;margin:12px 0;border-left:4px solid #6c757d;border-radius:6px;opacity:0.8;"><h3 style="margin:0 0 10px 0;color:#495057;font-size:14px;font-weight:600;">${exp.title}</h3><p style="margin:0 0 8px 0;font-size:13px;color:#666;line-height:1.5;">${exp.plain}</p><div style="background:#e9ecef;padding:10px;border-radius:4px;font-size:12px;color:#495057;">${exp.howToFix}</div></div>`;
      });
      html+='</div>';
    }
    document.getElementById('a11y-results').innerHTML = html;
    // Attach highlight button handlers
    document.querySelectorAll('.highlight-btn').forEach(btn=>{
      btn.onclick = function(){
        const selectorsString = this.getAttribute('data-selectors');
        if (!selectorsString) return;
        const selectorArray = selectorsString.split('|').filter(s => s);
        const success = highlightAllElements(selectorArray);
        if (success) {
          this.textContent = '✓ Highlighted';
          this.style.background = '#28a745';
          this.style.color = 'white';
          setTimeout(() => {
            this.textContent = '👁️ Show on Page';
            this.style.background = '#ffcb05';
            this.style.color = '#00274c';
          }, 2000);
        } else {
          this.textContent = '✗ Not found';
          this.style.background = '#dc3545';
          this.style.color = 'white';
        }
      };
    });
  }

  // ============= INITIALIZATION =============
  if(typeof axe === 'undefined'){
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.2/axe.min.js';
    script.onload = initScanner;
    script.onerror = () => alert('Failed to load axe-core. Check your internet connection.');
    document.head.appendChild(script);
  } else {
    initScanner();
  }
})();
