(function() {
  'use strict';
  
  if (document.getElementById('a11y-overlay')) {
    alert('Scanner already running!');
    return;
  }

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

  function calculateAccessibilityScore(violations) {
    let score = 100;
    const violationsByRule = {};
    violations.forEach(v => {
      if (!violationsByRule[v.id]) {
        violationsByRule[v.id] = { impact: v.impact, count: 0 };
      }
      violationsByRule[v.id].count += v.nodes.length;
    });
    Object.values(violationsByRule).forEach(rule => {
      let deduction = 0;
      const count = rule.count;
      if (rule.impact === 'critical') deduction = count * 8;
      else if (rule.impact === 'serious') deduction = count * 5;
      else if (rule.impact === 'moderate') deduction = count * 3;
      else if (rule.impact === 'minor') deduction = count * 2;
      const maxDeductionPerRule = {
        'critical': 25,
        'serious': 20,
        'moderate': 15,
        'minor': 10
      };
      deduction = Math.min(deduction, maxDeductionPerRule[rule.impact] || 15);
      score -= deduction;
    });
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

    function discoverGuidePages() {
        // Try to find guide ID from URL - support multiple formats
        let currentGuideId = window.location.href.match(/g=(\d+)/)?.[1] || 
                            window.location.href.match(/guides\/(\d+)/)?.[1];
        
        // For friendly URLs like /guides/x-symposium/, extract the guide slug
        let guideSlug = null;
        const friendlyUrlMatch = window.location.href.match(/guides\.lib\.umich\.edu\/([^\/]+)/);
        if (friendlyUrlMatch) {
            guideSlug = friendlyUrlMatch[1];
            console.log('Guide slug found:', guideSlug);
        }
        
        if (!currentGuideId && !guideSlug) {
            console.log('No guide ID or slug found in URL');
            return [{ title: document.title || 'Current Page', url: window.location.href }];
        }

        console.log('Guide ID:', currentGuideId, 'Guide slug:', guideSlug);

        // Look for navigation links in common LibGuides locations
        const navSelectors = [
            '#s-lg-tabs-container a',           // Tab navigation
            '.s-lg-tabs a',                      // Alternative tab class
            '#s-lg-guide-tabs a',                // Guide tabs
            '.s-lg-guide-tabs a',                // Guide tabs alt
            '#s-lg-guide-nav a',                 // Guide navigation
            'nav a',                             // Generic nav
            '[role="navigation"] a',             // ARIA navigation
            '.navbar a'                          // Navbar links
        ];

        const guidePages = [];
        const seenUrls = new Set();

        navSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(link => {
            const href = link.href;
            const text = link.textContent.trim();
            
            // Skip if already seen
            if (seenUrls.has(href)) return;
            
            // Check if link belongs to this guide (by ID or slug)
            let belongsToGuide = false;
            
            if (currentGuideId) {
                const linkGuideId = href.match(/g=(\d+)/)?.[1] || href.match(/guides\/(\d+)/)?.[1];
                belongsToGuide = linkGuideId === currentGuideId;
            }
            
            if (guideSlug && !belongsToGuide) {
                // Check if URL contains the guide slug
                belongsToGuide = href.includes(`guides.lib.umich.edu/${guideSlug}/`) || 
                                href.includes(`/${guideSlug}/`);
            }
            
            if (!belongsToGuide) return;
            
            // Skip navigation helpers and anchors
            const skipKeywords = ['skip to', 'next:', 'previous:', 'jump to'];
            if (skipKeywords.some(kw => text.toLowerCase().includes(kw))) return;
            
            // Skip anchor-only links
            if (href.includes('#') && href.split('#')[0] === window.location.href.split('#')[0]) return;
            
            // Clean URL (remove hash)
            const cleanUrl = href.split('#')[0];
            
            if (!seenUrls.has(cleanUrl) && text.length > 0) {
                guidePages.push({
                title: text || 'Untitled Page',
                url: cleanUrl
                });
                seenUrls.add(cleanUrl);
            }
            });
        });

        // If no pages found in navigation, search all links
        if (guidePages.length === 0) {
            console.log('No nav pages found, searching all links...');
            Array.from(document.querySelectorAll('a')).forEach(link => {
            const href = link.href;
            
            let belongsToGuide = false;
            
            if (currentGuideId) {
                const hasGuideId = href.includes(`g=${currentGuideId}`) || href.includes(`guides/${currentGuideId}`);
                const hasPageId = href.includes('&p=') || href.includes('/p/');
                belongsToGuide = hasGuideId && hasPageId;
            }
            
            if (guideSlug && !belongsToGuide) {
                belongsToGuide = (href.includes(`guides.lib.umich.edu/${guideSlug}/`) || 
                                href.includes(`/${guideSlug}/`)) &&
                                href !== window.location.href.split('#')[0];
            }
            
            if (belongsToGuide) {
                const cleanUrl = href.split('#')[0];
                if (!seenUrls.has(cleanUrl)) {
                guidePages.push({
                    title: link.textContent.trim() || 'Untitled Page',
                    url: cleanUrl
                });
                seenUrls.add(cleanUrl);
                }
            }
            });
        }

        // Always include current page
        const currentUrl = window.location.href.split('#')[0];
        if (!seenUrls.has(currentUrl)) {
            guidePages.unshift({
            title: document.title || 'Current Page',
            url: currentUrl
            });
        }

        console.log(`Found ${guidePages.length} pages:`, guidePages);
        return guidePages.length > 0 ? guidePages : [{ title: document.title || 'Current Page', url: window.location.href }];
        }

    async function scanMultiplePages(pages) {
        const results = [];
        const totalPages = pages.length;
        let scannedCount = 0;
        const batchSize = 1; // Changed from 3 to 1 to avoid axe conflicts
        
        for (let i = 0; i < pages.length; i += batchSize) {
            const batch = pages.slice(i, i + batchSize);
            const batchPromises = batch.map(page => scanPageWithFetch(page, scannedCount, totalPages));
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
        
    function scanPageWithFetch(page, current, total) {
        return new Promise(async (resolve, reject) => {
            const timeout = setTimeout(() => {
            reject(new Error('Timeout'));
            }, 15000);
            
            try {
            const response = await fetch(page.url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const container = doc.querySelector('#s-lg-guide-main') || doc.querySelector('#s-lg-content') || doc.body;
            
            // Create a unique axe instance for this document to avoid conflicts
            let axeResults;
            try {
                // Run axe with a small delay to prevent conflicts
                await new Promise(r => setTimeout(r, Math.random() * 100));
                axeResults = await axe.run(container, {
                runOnly: ['wcag2a', 'wcag2aa', 'best-practice'],
                resultTypes: ['violations']
                });
            } catch (axeError) {
                console.warn('Axe error on', page.url, axeError.message);
                // If axe fails, just use custom checks
                axeResults = { violations: [] };
            }
            
            // Run custom checks
            const customResults = runCustomChecksOnDoc(doc, container);
            
            clearTimeout(timeout);
            resolve({
                page: page,
                violations: [...axeResults.violations, ...customResults]
            });
            } catch (err) {
            clearTimeout(timeout);
            reject(err);
            }
        });
        }

        function runCustomChecksOnDoc(doc, context) {
        const violations = [];
        const container = context || doc.body;
        
        const decorativeImages = container.querySelectorAll('img[alt=""]');
        if(decorativeImages.length>0){
            const nodes=Array.from(decorativeImages).filter(img=>!img.hasAttribute('role')||img.getAttribute('role')!=='presentation');
            if(nodes.length>0) violations.push({id:'decorative-image-role', impact:'minor', help:'Decorative Images Should Have role="presentation"', description:'Images with empty alt text should explicitly be marked as decorative with role="presentation"', nodes:nodes.map(el=>({target:[getCssSelectorForElement(el, doc)], html:el.outerHTML.substring(0,100)}))});
        }
        
        const links = container.querySelectorAll('a');
        const urlOnlyLinks = Array.from(links).filter(link=>{
            const text = link.textContent.trim();
            return text.startsWith('http://') || text.startsWith('https://');
        });
        if(urlOnlyLinks.length>0) violations.push({id:'link-url-only-text', impact:'serious', help:'Links Should Not Use URLs as Link Text', description:'Links with URLs as text are not descriptive.', nodes:urlOnlyLinks.map(el=>({target:[getCssSelectorForElement(el, doc)], html:el.outerHTML.substring(0,150)}))});
        
        const imagesNoAlt = container.querySelectorAll('img:not([alt])');
        if(imagesNoAlt.length>0) violations.push({id:'image-no-alt', impact:'critical', help:'Images Must Have Alt Attributes', description:'All images must have an alt attribute, even if empty for decorative images.', nodes:Array.from(imagesNoAlt).map(el=>({target:[getCssSelectorForElement(el, doc)], html:el.outerHTML.substring(0,100)}))});
        
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
        if(badAltImages.length>0) violations.push({id:'image-alt-quality', impact:'moderate', help:'Alt Text Quality Issues', description:'Alt text should be concise (<250 chars), avoid phrases like "image of", and not be filenames or all caps.', nodes:badAltImages.map(el=>({target:[getCssSelectorForElement(el, doc)], html:el.outerHTML.substring(0,100), altText:el.alt}))});
        
        return violations;
        }

        function getCssSelectorForElement(el, doc) {
        if(el.id) return `#${el.id}`;
        const path = [];
        let current = el;
        while(current && current.nodeType === Node.ELEMENT_NODE && current !== doc.body){
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

  function updateProgress(current, total) {
    const percent = Math.round((current / total) * 100);
    const statusEl = document.getElementById('scan-status');
    if (statusEl) {
      statusEl.textContent = `Scanning page ${current} of ${total}... (${percent}%)`;
    }
  }

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
    const sidebar = document.createElement('div');
    sidebar.id = 'a11y-overlay';
    sidebar.style.cssText = `position:fixed;top:0;right:0;bottom:0;width:450px;background:white;z-index:999999;display:flex;flex-direction:column;box-shadow:-4px 0 20px rgba(0,0,0,0.3);font-family:'Lexend',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;animation:slideIn 0.3s ease-out;transition:transform 0.3s cubic-bezier(0.4,0,0.2,1);`;
    sidebar.innerHTML = `
      <div id="a11y-resizer" title="Drag to resize sidebar"></div>
      <div role="banner" id="a11y-header" style="background:#00274c;color:white;padding:20px;border-bottom:3px solid #ffcb05;transition:opacity 0.3s ease;font-family:'Lexend',sans-serif;">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
          <h2 style="margin:0;font-size:20px;flex:1;color:#ffffff;font-family:'Lexend',sans-serif;">🔍 A11y Scanner</h2>
          <button id="scan-mode-toggle" style="background:#ffcb05;border-radius:6px;padding:8px 12px;color:#00274C;font-weight:600;font-size:12px;cursor:pointer;transition:all 0.2s;font-family:'Lexend',sans-serif;" title="Scan all pages in this guide">
            Show All Pages
          </button>
          <button id="a11y-close-btn" style="background:none;border:2px solid #ffcb05;border-radius:50%;width:40px;height:40px;line-height:1;color:#ffcb05;font-weight:bold;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s ease;" title="Close scanner" aria-label="Close">✕</button>
        </div>
      </div>
      <main id="a11y-results" style="flex:1;overflow-y:auto;padding:20px;color:#333;text-align:center;font-family:'Lexend',sans-serif;">Initializing scanner...<br><br>⏳</main>
    `;
    document.body.appendChild(sidebar);
    document.getElementById('a11y-close-btn').onclick = () => {
      sidebar.style.animation = 'slideOut 0.3s ease-in';
      sidebar.addEventListener('animationend', () => sidebar.remove());
    };
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
    let isMultiPage = false;
    const toggleBtn = document.getElementById('scan-mode-toggle');
    toggleBtn.onclick = function() {
      isMultiPage = !isMultiPage;
      this.textContent = isMultiPage ? 'Show Current Page' : 'Show All Pages';
      this.title = isMultiPage ? 'Switch to scanning current page only' : 'Switch to scanning all pages in guide';
      startScan(isMultiPage);
    };
    startScan(isMultiPage);
  }

  async function startScan(multiPage) {
    document.getElementById('a11y-results').innerHTML = '<div style="text-align:center;padding:40px;">⏳ Scanning...</div>';
    try {
      if (multiPage) {
        const pages = discoverGuidePages();
        console.log('Pages found:', pages);  // <-- Add this
        const results = await scanMultiplePages(pages);
        displayMultiPageResults(results);
      } else {
        const container = findLibGuidesContainer();
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
  // Load Lexend font if not present
  if (!document.getElementById("lexend-font")) {
    const link = document.createElement("link");
    link.id = "lexend-font";
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Lexend:wght@400;600&display=swap";
    document.head.appendChild(link);
  }

  let totalViolations = 0;
  let totalScore = 0;
  let validPageCount = 0;
  const pageScores = [];
  
  results.forEach(result => {
    if (result.error) {
      pageScores.push({ page: result.page, score: 0, violations: [], error: result.error });
      return;
    }
    const violations = result.violations;
    totalViolations += violations.length;
    const score = calculateAccessibilityScore(violations);
    totalScore += score;
    validPageCount++;
    pageScores.push({ page: result.page, score, violations, error: null });
  });
  
  const avgScore = validPageCount > 0 ? Math.floor(totalScore / validPageCount) : 0;
  
  // Softer colors matching single page design
  const scoreColors = {
    excellent: "#2c9a4b",
    good: "#1493a0",
    needsWork: "#d66a12",
    poor: "#c23c3c",
  };
  
  let scoreColor, scoreMessage;
  if (avgScore >= 95) {
    scoreColor = scoreColors.excellent;
    scoreMessage = "Excellent";
  } else if (avgScore >= 80) {
    scoreColor = scoreColors.good;
    scoreMessage = "Good";
  } else if (avgScore >= 60) {
    scoreColor = scoreColors.needsWork;
    scoreMessage = "Needs Work";
  } else {
    scoreColor = scoreColors.poor;
    scoreMessage = "Poor";
  }
  
  const circumference = 339.292;
  const progress = (avgScore / 100) * circumference;
  const offset = circumference - progress;
  
  let html = `
    <div style="text-align:center;padding:25px 20px 20px;border-bottom:1px solid #e5e7eb;margin-bottom:20px;background:#fafafa;font-family:'Lexend',sans-serif;">
      <div style="font-size:14px;font-weight:600;color:#4a4a4a;margin-bottom:15px;text-transform:uppercase;letter-spacing:1px;">Overall Guide Score</div>
      <svg width="90" height="90" viewBox="0 0 120 120"">
        <circle cx="60" cy="60" r="54" fill="none" stroke="#e9ecef" stroke-width="8"/>
        <circle cx="60" cy="60" r="54" fill="none" stroke="${scoreColor}" stroke-width="8" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" transform="rotate(-90 60 60)" stroke-linecap="round" style="transition:stroke-dashoffset 0.5s ease;"/>
        <text x="60" y="65" text-anchor="middle" font-size="28" font-weight="600" fill="${scoreColor}">${avgScore}</text>
        <text x="60" y="82" text-anchor="middle" font-size="11" fill="#999">/ 100</text>
      </svg>
      <div style="font-size:15px;font-weight:600;color:${scoreColor};margin-bottom:8px;">${scoreMessage} ${avgScore >= 95 ? '⭐⭐⭐⭐⭐' : avgScore >= 80 ? '⭐⭐⭐⭐' : avgScore >= 60 ? '⭐⭐⭐' : '⭐⭐'}</div>
      <div style="font-size:13px;color:#00274C;background:#f1f3f5;padding:8px 12px;border-radius:6px;display:inline-block;">
        Scanned ${results.length} page${results.length !== 1 ? 's' : ''} • Found ${totalViolations} issue${totalViolations !== 1 ? 's' : ''}
      </div>
    </div>
  `;
  
  html += `<h3 style="color:#00274c;font-size:16px;margin:20px 0 12px;padding-bottom:8px;border-bottom:1px solid #e5e7eb;font-weight:600;font-family:'Lexend',sans-serif;">📄 Per-Page Results <span style="font-size:12px;font-weight:normal;color:#00274c;">(in navigation order)</span></h3>`;
  
  pageScores.forEach((item, idx) => {
    const pageScoreColor = item.score >= 80 ? scoreColors.excellent : item.score >= 60 ? scoreColors.good : scoreColors.poor;
    const issueCount = item.violations.length;
    
    html += `
      <details style="background:#fff;padding:15px;margin:12px 0;border-radius:6px;border-left:4px solid ${pageScoreColor};box-shadow:0 1px 3px rgba(0,0,0,0.06);font-family:'Lexend',sans-serif;">
        <summary style="cursor:pointer;font-weight:600;font-size:14px;display:flex;justify-content:space-between;align-items:center;">
            <span style="color:#00274c;">${item.page.title}</span>
            <span style="display:flex;gap:10px;align-items:center;">
                <span style="font-size:14px;">${item.score >= 95 ? '⭐⭐⭐⭐⭐' : item.score >= 80 ? '⭐⭐⭐⭐' : item.score >= 60 ? '⭐⭐⭐' : '⭐⭐'}</span>
                <span style="background:${pageScoreColor};color:white;padding:4px 10px;border-radius:4px;font-size:11px;font-weight:600;">${item.score}/100</span>
                <span style="color:#666;font-size:12px;">${issueCount} issue${issueCount !== 1 ? 's' : ''}</span>
            </span>
        </summary>
        <div style="margin-top:15px;padding-top:15px;border-top:1px solid #e5e7eb;">
          ${item.error ? `<p style="color:#c23c3c;font-size:14px;">Error: ${item.error}</p>` : ''}
          ${item.violations.length === 0 ? '<p style="color:#2c9a4b;font-size:14px;">✓ No issues found</p>' : ''}
          ${item.violations.slice(0, 5).map(v => {
            const exp = getExplanation(v.id);
            return `<div style="background:#f8f9fa;padding:10px;margin:8px 0;border-radius:4px;font-size:13px;"><strong>${exp.title}</strong><br><span style="color:#666;">${v.nodes.length} instance${v.nodes.length !== 1 ? 's' : ''}</span></div>`;
          }).join('')}
          ${item.violations.length > 5 ? `<p style="font-size:12px;color:#666;margin-top:10px;">...and ${item.violations.length - 5} more</p>` : ''}
        </div>
      </details>
    `;
  });
  
  document.getElementById('a11y-results').innerHTML = html;
}

  function displaySinglePageResults(results) {
  // Load Lexend font if not present
  if (!document.getElementById("lexend-font")) {
    const link = document.createElement("link");
    link.id = "lexend-font";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Lexend:wght@400;600&display=swap";
    document.head.appendChild(link);
  }

  const violations = results.violations;
  const score = calculateAccessibilityScore(violations);

  // Softer, less saturated versions of the original colors
  const scoreColors = {
    excellent: "#2c9a4b",
    good: "#1493a0",
    needsWork: "#d66a12",
    poor: "#c23c3c",
  };

  let scoreColor, scoreMessage;
  if (score >= 95) {
    scoreColor = scoreColors.excellent;
    scoreMessage = "Excellent";
  } else if (score >= 80) {
    scoreColor = scoreColors.good;
    scoreMessage = "Good";
  } else if (score >= 60) {
    scoreColor = scoreColors.needsWork;
    scoreMessage = "Needs Work";
  } else {
    scoreColor = scoreColors.poor;
    scoreMessage = "Poor";
  }

  // --- No issues ---
  if (violations.length === 0) {
    document.getElementById("a11y-results").innerHTML = `
      <div style="text-align:center;padding:40px 20px;font-family:'Lexend',sans-serif;">
        <div style="font-size:14px;font-weight:600;color:#666;margin-bottom:15px;text-transform:uppercase;letter-spacing:1px;">
          Accessibility Score
        </div>

        <svg width="120" height="120" viewBox="0 0 120 120" style="margin-bottom:20px;">
          <circle cx="60" cy="60" r="54" fill="none" stroke="#e9ecef" stroke-width="8"/>
          <circle cx="60" cy="60" r="54" fill="none" stroke="#2c9a4b" stroke-width="8"
            stroke-dasharray="339.292" stroke-dashoffset="0"
            transform="rotate(-90 60 60)" stroke-linecap="round"/>

          <text x="60" y="65" text-anchor="middle"
            font-size="32" font-weight="600" fill="#2c9a4b">100</text>
          <text x="60" y="85" text-anchor="middle" font-size="12" fill="#666">/ 100</text>
        </svg>

        <div style="font-size:13px;color:#00274C;background:#f1f3f5;padding:8px 12px;border-radius:6px;margin-bottom:15px;display:inline-block;">
          Current page • No issues found
        </div>

        <div style="background:#e6f4ea;padding:30px;border-radius:10px;color:#155724;text-align:center;border:1.5px solid #ccebd5;">
          <div style="font-size:48px;margin-bottom:15px;">✅</div>
          <h3 style="margin:0 0 10px 0;font-size:20px;font-weight:600;">Perfect Score!</h3>
          <p style="margin:0;font-size:15px;">No accessibility issues detected in the LibGuides content.</p>
        </div>
      </div>
    `;
    return;
  }

  // ---- violations split ----
  const canFix = [];
  const systemIssues = [];

  violations.forEach((v) => {
    const exp = getExplanation(v.id);
    if (exp.canFix === false)
      systemIssues.push({ violation: v, explanation: exp });
    else canFix.push({ violation: v, explanation: exp });
  });

  const circumference = 339.292;
  const offset = circumference - (score / 100) * circumference;

  let html = `
    <div style="text-align:center;padding:25px 20px 20px 20px;border-bottom:1px solid #e5e7eb;margin-bottom:20px;background:#fafafa;font-family:'Lexend',sans-serif;">
      <div style="font-size:14px;font-weight:600;color:#4a4a4a;margin-bottom:15px;text-transform:uppercase;letter-spacing:1px;">
        Accessibility Score
      </div>

      <svg width="90" height="90" viewBox="0 0 120 120"">
        <circle cx="60" cy="60" r="54" fill="none" stroke="#e9ecef" stroke-width="8"/>
        <circle cx="60" cy="60" r="54" fill="none"
          stroke="${scoreColor}" stroke-width="8"
          stroke-dasharray="${circumference}"
          stroke-dashoffset="${offset}"
          transform="rotate(-90 60 60)"
          stroke-linecap="round"
        />

        <text x="60" y="65" text-anchor="middle"
          font-size="28" font-weight="600" fill="${scoreColor}">
          ${score}
        </text>
        <text x="60" y="82" text-anchor="middle" font-size="11" fill="#999">/ 100</text>
      </svg>

      <div style="font-size:15px;font-weight:600;color:${scoreColor};margin-bottom:8px;">
        ${scoreMessage} ${score >= 95 ? '⭐⭐⭐⭐⭐' : score >= 80 ? '⭐⭐⭐⭐' : score >= 60 ? '⭐⭐⭐' : '⭐⭐'}
      </div>

      <div style="font-size:13px;color:#00274C;background:#f1f3f5;padding:8px 12px;border-radius:6px;display:inline-block;">
        Current page • Found ${violations.length} issue${violations.length !== 1 ? "s" : ""}
      </div>
    </div>
  `;

  // Accent colors toned down
  const priorityColors = {
    critical: "#c23c3c",
    important: "#d66a12",
    minor: "#1493a0",
  };

  // Muted background colors matching each priority
  const priorityBackgrounds = {
    critical: "rgba(194, 60, 60, 0.04)",
    important: "rgba(214, 106, 18, 0.04)",
    minor: "rgba(20, 147, 160, 0.04)",
  };

  // ========= YOU CAN FIX =========
  if (canFix.length > 0) {
    html += `
      <div style="margin-bottom:25px;font-family:'Lexend',sans-serif;">
        <h3 style="color:#00274c;font-size:16px;margin:20px 0 12px;padding-bottom:8px;border-bottom:1px solid #e5e7eb;font-weight:600;font-family:'Lexend',sans-serif;">
          ✏️ Issues You Can Fix
        </h3>
    `;

    canFix.forEach((item, index) => {
      const v = item.violation;
      const exp = item.explanation;
      const color = priorityColors[exp.priority] || "#6c757d";
      const bgColor = priorityBackgrounds[exp.priority] || "rgba(108, 117, 125, 0.04)";
      const selectors = v.nodes.map((n) => n.target[0]).join("|");

      html += `
        <details style="background:${bgColor};padding:16px;margin:16px 0;border-radius:6px;border-left:4px solid ${color};box-shadow:0 1px 3px rgba(0,0,0,0.06);text-align:left;">
          <summary style="cursor:pointer;display:flex;justify-content:space-between;align-items:center;">
            <div style="font-size:15px;font-weight:600;color:#00274c;flex:1;">
              ${index + 1}. ${exp.title}
            </div>
            <span style="background:${color};color:white;padding:3px 8px;border-radius:4px;font-size:10px;font-weight:600;text-transform:uppercase;">
              ${exp.priority}
            </span>
          </summary>

          <div style="margin-top:14px;font-size:15px;line-height:1.6;color:#4a5568;text-align:center;">

            <div style="background:white;padding:12px;border:1px solid #e5e7eb;border-radius:6px;margin-bottom:14px;">
              <h5 style="margin:0 0 6px 0;font-weight:700;color:#1a2e3f;font-size:14px;">
                📖 What's wrong
              </h5>
              <p style="margin:0;">${exp.plain}</p>
            </div>

            <div style="background:white;padding:12px;border:1px solid #d8e7f7;border-radius:6px;margin-bottom:14px;">
              <h5 style="margin:0 0 6px 0;font-weight:700;color:##1a2e3f;font-size:14px;">
                🔧 How to fix
              </h5>
              <p style="margin:0;">${exp.howToFix}</p>
            </div>

            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
              <button class="highlight-btn"
                data-selectors="${selectors}"
                style="background:#ffcb05;color:#00274c;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:13px;font-weight:600;">
                👁️ Show on Page
              </button>
              <span style="font-size:13px;color:#666;">${v.nodes.length} affected</span>
            </div>

            <details style="margin-top:12px;">
              <summary style="cursor:pointer;font-size:13px;color:#666;font-weight:600;">
                Technical details
              </summary>
              <div style="background:#fafafa;padding:10px;margin-top:6px;border-radius:4px;font-size:12px;color:#555;border:1px solid #e5e7eb;line-height:1.5;">
                <strong>Rule:</strong> ${v.id}<br>
                <strong>WCAG:</strong> ${v.description}<br>
                <strong>Element:</strong>
                <code style="background:#f3f4f6;padding:2px 4px;border-radius:3px;font-size:11px;">
                  ${v.nodes[0]?.target[0] || "N/A"}
                </code>
              </div>
            </details>

          </div>
        </details>
      `;
    });

    html += `</div>`;
  }

  // ========== SYSTEM ISSUES ==========
  if (systemIssues.length > 0) {
    html += `
      <div style="margin-bottom:25px;">
        <h3 style="color:#6c757d;font-size:16px;margin-bottom:15px;padding-bottom:8px;border-bottom:1px solid #e5e7eb;font-weight:600;">
          ⚙️ System Issues
        </h3>
    `;

    systemIssues.forEach((item) => {
      const v = item.violation;
      const exp = item.explanation;

      html += `
        <details style="background:rgba(108, 117, 125, 0.04);padding:16px;margin:16px 0;border-left:4px solid #6c757d;border-radius:6px;opacity:0.85;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
          <summary style="cursor:pointer;font-size:15px;font-weight:600;color:#495057;">
            ${exp.title}
          </summary>

          <div style="margin-top:14px;font-size:15px;line-height:1.6;color:#4a5568;">
            <p style="margin-bottom:12px;">${exp.plain}</p>
            <div style="background:#f3f4f6;padding:12px;border-radius:6px;font-size:14px;color:#333;border:1px solid #e5e7eb;">
              ${exp.howToFix}
            </div>
          </div>
        </details>
      `;
    });

    html += `</div>`;
  }

  // push html
  document.getElementById("a11y-results").innerHTML = html;

  // attach highlight events
  document.querySelectorAll(".highlight-btn").forEach((btn) => {
    btn.onclick = function () {
      const selectorsString = this.getAttribute("data-selectors");
      if (!selectorsString) return;

      const selectorArray = selectorsString.split("|").filter(Boolean);
      const success = highlightAllElements(selectorArray);

      if (success) {
        this.textContent = "✓ Highlighted";
        this.style.background = "#2c9a4b";
        this.style.color = "white";
        setTimeout(() => {
          this.textContent = "👁️ Show on Page";
          this.style.background = "#ffcb05";
          this.style.color = "#00274c";
        }, 2000);
      } else {
        this.textContent = "✗ Not found";
        this.style.background = "#c23c3c";
        this.style.color = "white";
      }
    };
  });
}


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


