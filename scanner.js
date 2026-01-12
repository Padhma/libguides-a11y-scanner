(function() {
  'use strict';
  
  if (document.getElementById('a11y-overlay')) {
    alert('Scanner already running!');
    return;
  }

  const ISSUE_EXPLANATIONS = {
    'image-no-alt': { 
        title:'Images Missing Alt Attribute', 
        plain:'These images have no alt attribute at all. Every image must have alt="" (if decorative) or descriptive alt text.', 
        howToFix:'In LibGuides editor: Click image → Properties → Add alt text describing the image, or use alt="" if purely decorative.', 
        priority:'critical', canFix:true},
    'image-alt-quality': {
        title:'Alt Text Quality Issues', 
        plain:'Alt text contains problematic patterns: starts with phrases like "image of", is a filename, too long, or all caps.', 
        howToFix:'Revise alt text. Remove leading phrases like "image of". Keep under 250 characters.', 
        priority:'moderate', canFix:true},
    'link-url-only-text': {
        title:'Links Use URLs as Text', 
        plain:'These links display the full URL (like "http://proxy.lib...") instead of descriptive text. Screen reader users hear the entire URL read aloud.', 
        howToFix:'In LibGuides editor: Highlight the link → Change the visible text to something descriptive like "View in ProQuest Database" while keeping the URL in the link target.', 
        priority:'important', canFix:true},
    'link-name': {
        title:'Links Without Descriptive Text', 
        plain:'Links need text that describes where they go. Avoid "click here" or "read more".', 
        howToFix:'Change link text to be specific: "View Chemistry Guide" instead of "click here".', 
        priority:'important', canFix:true},
    'empty-heading-image-only': {
        title:'Heading Contains Only an Image', 
        plain:'This heading contains only an image. Screen readers treat this as an empty heading because they can\'t read the image as a heading.', 
        howToFix:'In LibGuides editor: Add text inside the heading alongside or instead of the image. Or move the image outside the heading tag entirely.', 
        priority:'critical', canFix:true},
    'empty-heading-whitespace': {
        title:'Heading is Completely Empty', 
        plain:'This heading has no text at all - it\'s completely empty or contains only whitespace.', 
        howToFix:'In LibGuides editor: Delete this heading or add descriptive text to it.', 
        priority:'critical', canFix:true},
    'empty-heading-libguides-box': {
        title:'Empty LibGuides Box Title', 
        plain:'This looks like a LibGuides box title heading. LibGuides sometimes creates empty headings automatically when a box title is missing.', 
        howToFix:'In LibGuides editor: Edit the box → Add a title in the "Box Title" field, or change the box type to "No Heading" in box settings.', 
        priority:'critical', canFix:true},
    'heading-order': {
        title:'Heading Structure Problems', 
        plain:'Headings should go in order (H1 → H2 → H3), not skip levels.', 
        howToFix:'Change heading level in editor to correct sequence.', 
        priority:'important', canFix:true},
    'page-has-heading-one': {
        title:'Missing Main Page Title (H1)', 
        plain:'Pages should have one H1 heading that describes the main content.', 
        howToFix:'Check that your page title is set. Edit Page → Page Title field.', 
        priority:'important', canFix:true},
    'heading-with-link': {
        title:'Headings Used Entirely as Links',
        plain: 'This heading\'s entire text is a link. This can confuse screen readers - is it a heading for navigation or a clickable link?',
        howToFix: 'In LibGuides editor: Either (1) add non-linked text to the heading, or (2) if the entire section is clickable, consider using regular text with a link instead of a heading.',
        priority: 'important', canFix: true},
    'label': {
        title:'Form Fields Missing Labels', 
        plain:'Search boxes and input fields need visible labels so users know what to enter. Screen readers cannot tell what an unlabeled field is for.', 
        howToFix:'In LibGuides editor: If you embedded a form using HTML: Add a &lt;label&gt; tag in the code. Example: change &lt;input type="text" name="search"&gt; to &lt;label&gt;Search: &lt;input type="text" name="search"&gt;&lt;/label&gt;. OR add descriptive text above the form. If you created a form using a widget: add visible text above the input field describing what to enter.', 
        priority:'critical', canFix:true},
    'button-name': {
        title:'Buttons Without Labels', 
        plain:'Buttons need text or labels that describe what they do.', 
        howToFix:'Add text inside the button, or remove empty buttons.', 
        priority:'critical', canFix:true},    
    'color-contrast': {
        title:'Text Fails Contrast Requirements', 
        plain:'Text color doesn\'t have enough contrast with its background color. This makes it difficult or impossible for people with low vision or color blindness to read.',
        howToFix:'In LibGuides editor: Change the text to a darker color or use the default text color (remove custom colors). The text and background must have a contrast ratio of at least 4.5:1 for normal text, or 3:1 for large text (18pt+ or 14pt+ bold). Use a contrast checker tool if needed, or simply use default colors which meet requirements.', 
        priority:'important', canFix:true},
    'duplicate-id': {
        title: 'Duplicate ID Attributes',
        plain: 'Multiple elements have the same ID. This often happens when copying content from Google Docs or Word, which adds hidden IDs that get duplicated when you paste multiple times.',
        howToFix: 'In LibGuides editor: (1) Select all the content in this box, (2) Copy the content and paste it into a plain text editor (such as Notepad, TextEdit)to strip any hidden formatting and duplicate ID codes, (3) Then, copy the cleaned text from the plain text editor and paste it back into LibGuides, (4) Reapply any formatting you need (bold, italics, headings, links) using the LibGuides editor tools.',
        priority: 'important', canFix: true},
    'scope-attr-valid': {
        title:'Incorrect Use of Scope Attribute in Tables', 
        plain:'Table cells have a "scope" attribute, but this attribute should only be used on table header cells (<th>), not regular data cells (<td>).', 
        howToFix:'In LibGuides editor: Edit the table → Select the header row → Use the table toolbar to convert header cells from <td> to <th>. Or rebuild the table using the table tool with proper headers. If editing HTML directly: change change &lt;td scope="col"&gt; to &lt;th scope="col"&gt; for header cells.', 
        priority:'important', canFix: true},
    'list': {
        title:'Improperly Structured List', 
        plain:'This list has structural problems - likely extra tags, nested elements, or formatting copied from Microsoft Word or Google Docs that breaks the list structure for screen readers.', 
        howToFix:'In LibGuides editor: (1) Delete the problematic list, (2) Recreate it using the list button in the toolbar (bullet or numbered list icon), (3) Type or paste content as plain text, then format. DO NOT copy formatted lists directly from Word/Docs. If you must paste from Word: paste into Notepad first to strip formatting, then paste into LibGuides.', 
        priority:'important', canFix: true},
    'landmark-one-main': {
        title:'Multiple Main Content Areas', 
        plain:'Page has multiple "main" regions. This is usually a LibGuides template issue.', 
        howToFix:'SYSTEM ISSUE: Contact library-web-support@umich.edu.', 
        priority:'system', canFix:false},
    'region': {
        title:'Content Not in Proper Sections', 
        plain:'Some content isn\'t inside proper page sections.', 
        howToFix:'Put main content in center content boxes. May be partially a template issue.', 
        priority:'minor', canFix:'partial'},
    'landmark-banner-is-top-level': {
        title:'Banner Structure Issue', 
        plain:'Page header structure problem - usually a LibGuides system issue.', 
        howToFix:'SYSTEM ISSUE: You can ignore this or contact library-web-support@umich.edu.', 
        priority:'system', canFix:false}
  };

  function calculateAccessibilityScore(violations) {
    let score = 100;
    const violationsByRule = {};
    violations.forEach(v => {
      if (!violationsByRule[v.id]) violationsByRule[v.id] = { impact: v.impact, count: 0 };
      violationsByRule[v.id].count += v.nodes.length;
    });
    Object.values(violationsByRule).forEach(rule => {
      const deductions = {critical: 8, serious: 5, moderate: 3, minor: 2};
      const maxDeductions = {critical: 25, serious: 20, moderate: 15, minor: 10};
      let deduction = rule.count * (deductions[rule.impact] || 2);
      score -= Math.min(deduction, maxDeductions[rule.impact] || 15);
    });
    return Math.max(15, Math.round(score));
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
          if(el && !el.closest('#a11y-overlay')){
            el.classList.add('a11y-highlight');
            successCount++;
            if(successCount === 1) el.scrollIntoView({behavior:'smooth', block:'center'});
          }
        });
      }catch(e){console.error('Could not highlight:', selector, e);}
    });
    return successCount > 0;
  }

  function getCssSelector(el, skipId = false){
    // If skipId is true, don't use the ID even if it exists (for duplicate IDs)
    if(el.id && !skipId) return `#${el.id}`;

    const path = [];
    let current = el;
    while(current && current.nodeType === Node.ELEMENT_NODE && current !== document.body){
      let selector = current.tagName.toLowerCase();
      if(current.id && !skipId){selector = `#${current.id}`; path.unshift(selector); break;}
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

  function checkEmptyHeadings(container) {
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const categories = {imageOnly: [], whitespace: [], libguidesBox: []};
    const violations = [];

    headings.forEach(h => {
      const text = h.textContent.trim();
      if (text.length > 0) return;
      
      const hasMedia = h.querySelector('img, i, svg, [class*="icon"]');
      const isLGBox = h.closest('[id^="s-lg-box"]') || h.classList.contains('s-lib-box-title') || h.id.startsWith('s-lg-box');
      
      if (hasMedia) {
        categories.imageOnly.push(h);
        // console.log('Empty heading with image found:', h, 'Selector:', getCssSelector(h));
      } 
      else if (isLGBox) categories.libguidesBox.push(h);
      else categories.whitespace.push(h);
    });

    const specs = [
      ['empty-heading-image-only', 'critical', 'Headings with Only Images', 'Headings containing only images are treated as empty by screen readers.', categories.imageOnly],
      ['empty-heading-whitespace', 'critical', 'Completely Empty Headings', 'These headings contain no text at all.', categories.whitespace],
      ['empty-heading-libguides-box', 'critical', 'Empty LibGuides Box Titles', 'LibGuides auto-generated empty headings for boxes without titles.', categories.libguidesBox]
    ];

    specs.forEach(([id, impact, help, desc, els]) => {
      if (els.length > 0) violations.push({id, impact, help, description: desc, nodes: els.map(el => ({target: [getCssSelector(el)], html: el.outerHTML.substring(0, 150)}))});
    });

    return violations;
  }

  function runCustomChecks(container) {
    const violations = [];
    
    // URL-only links
    const urlLinks = Array.from(container.querySelectorAll('a')).filter(link => {
      const text = link.textContent.trim();
      return text.startsWith('http://') || text.startsWith('https://');
    });
    if(urlLinks.length) violations.push({id:'link-url-only-text', impact:'serious', help:'Links Should Not Use URLs as Link Text', description:'Links with URLs as text are not descriptive.', nodes:urlLinks.map(el=>({target:[getCssSelector(el)], html:el.outerHTML.substring(0,150)}))});
    
    // Images without alt
    const noAlt = Array.from(container.querySelectorAll('img:not([alt])'));
    if(noAlt.length) violations.push({id:'image-no-alt', impact:'critical', help:'Images Must Have Alt Attributes', description:'All images must have an alt attribute, even if empty for decorative images.', nodes:noAlt.map(el=>({target:[getCssSelector(el)], html:el.outerHTML.substring(0,100)}))});
    
    // Bad alt text
    const badAlt = Array.from(container.querySelectorAll('img[alt]')).filter(img => {
      const alt = img.alt.toLowerCase();
      return alt && (alt.startsWith('image of') || alt.startsWith('picture of') || alt.startsWith('photo of') || alt.startsWith('graphic of') || alt.startsWith('screenshot of') || alt.match(/\.(jpg|jpeg|png|gif|svg|webp|bmp)$/i) || alt.length > 250 || (alt === alt.toUpperCase() && alt.length > 10));
    });
    if(badAlt.length) violations.push({id:'image-alt-quality', impact:'moderate', help:'Alt Text Quality Issues', description:'Alt text should be concise (<250 chars), avoid phrases like "image of", and not be filenames or all caps.', nodes:badAlt.map(el=>({target:[getCssSelector(el)], html:el.outerHTML.substring(0,100), altText:el.alt}))});
    
    // Headings used as links
    const headingLinks = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6')).filter(h => {
        const links = h.querySelectorAll('a');
        return links.length === 1 && h.textContent.trim() === links[0].textContent.trim();
    });
    if(headingLinks.length) violations.push({id: 'heading-with-link', impact: 'serious', help: 'Headings Used Entirely as Links', description: 'Headings where all text is a link can confuse screen readers about the purpose of the element.', nodes: headingLinks.map(el => ({target:[getCssSelector(el)], html:el.outerHTML.substring(0,150)}))});

    // Duplicate IDs - custom check to find ALL duplicates
    const allIds = {};
    Array.from(container.querySelectorAll('[id]')).forEach(el => {
      const id = el.id;
      if (!allIds[id]) allIds[id] = [];
      allIds[id].push(el);
    });
    
    const duplicateIdElements = [];
    Object.entries(allIds).forEach(([id, elements]) => {
      if (elements.length > 1) {
        elements.forEach(el => duplicateIdElements.push(el));
      }
    });
    
    if(duplicateIdElements.length) violations.push({id:'duplicate-id', impact:'serious', help:'Duplicate ID Attributes Found', description:'Multiple elements have the same ID. IDs must be unique on a page.', nodes:duplicateIdElements.map(el=>({target:[getCssSelector(el, true)], html:el.outerHTML.substring(0,150)}))});

    // Invalid scope attributes (scope on <td> instead of <th>)
    const invalidScope = Array.from(container.querySelectorAll('td[scope], td[headers]'));
    if(invalidScope.length) violations.push({id:'scope-attr-valid', impact:'serious', help:'Invalid Scope Attribute on Table Cells', description:'The scope attribute should only be used on <th> elements, not <td> elements.', nodes:invalidScope.map(el=>({target:[getCssSelector(el, true)], html:el.outerHTML.substring(0,150)}))});

    // Empty headings
    violations.push(...checkEmptyHeadings(container));
    
    return violations;
  }

  function findLibGuidesContainer(){
    const candidates = ['#s-lg-guide-main','#s-lg-content','.s-lg-guide-body','#s-lg-public-main','[id^="s-lg-box"]'];
    for(let sel of candidates){const el = document.querySelector(sel); if(el) return el;}
    return document;
  }

  function discoverGuidePages() {
    let currentGuideId = window.location.href.match(/g=(\d+)/)?.[1] || window.location.href.match(/guides\/(\d+)/)?.[1];
    let guideSlug = window.location.href.match(/guides\.lib\.umich\.edu\/([^\/]+)/)?.[1];
    
    // if we have slug but no id, grab id from the first nav link | note to Padhma: fix for both id based and slug based issue
    if (!currentGuideId && guideSlug) {
        const firstNavLink = document.querySelector('#s-lg-tabs-container a[href*="g="], #s-lg-guide-tabs a[href*="g="]');
        if (firstNavLink) {
            currentGuideId = firstNavLink.href.match(/g=(\d+)/)?.[1];
        }
    }
    
    if (!currentGuideId && !guideSlug) 
        return [{title: document.title || 'Current Page', url: window.location.href }];

    const navSelectors = ['#s-lg-tabs-container a', '.s-lg-tabs a', '#s-lg-guide-tabs a', '.s-lg-guide-tabs a', '#s-lg-guide-nav a', 'nav a', '[role="navigation"] a', '.navbar a'];
    const guidePages = [];
    const seenUrls = new Set();

    navSelectors.forEach(selector => {
        const found = document.querySelectorAll(selector);
        found.forEach(link => {
            const href = link.href, text = link.textContent.trim();
            if (seenUrls.has(href)) {
            return;
            }
            
            let belongsToGuide = false;
            if (currentGuideId) {
            belongsToGuide = (href.match(/g=(\d+)/)?.[1] || href.match(/guides\/(\d+)/)?.[1]) === currentGuideId;
            }
            if (guideSlug && !belongsToGuide) {
            belongsToGuide = href.includes(`guides.lib.umich.edu/${guideSlug}/`) || href.includes(`/${guideSlug}/`);
            }
            
            if (!belongsToGuide) {
            return;
            }
            
            const skipKeywords = ['skip to', 'next:', 'previous:', 'jump to'];
            if (skipKeywords.some(kw => text.toLowerCase().includes(kw))) {
            return;
            }
            if (href.includes('#') && href.split('#')[0] === window.location.href.split('#')[0]) {
            return;
            }
            
            const cleanUrl = href.split('#')[0];
            if (!seenUrls.has(cleanUrl) && text.length > 0) {
            guidePages.push({title: text || 'Untitled Page', url: cleanUrl});
            seenUrls.add(cleanUrl);
            }
        });
        });

    if (guidePages.length === 0) {
      Array.from(document.querySelectorAll('a')).forEach(link => {
        const href = link.href;
        let belongsToGuide = false;
        if (currentGuideId) belongsToGuide = href.includes(`g=${currentGuideId}`) && href.includes('&p=');
        if (guideSlug && !belongsToGuide) belongsToGuide = (href.includes(`guides.lib.umich.edu/${guideSlug}/`) || href.includes(`/${guideSlug}/`)) && href !== window.location.href.split('#')[0];
        if (belongsToGuide) {
          const cleanUrl = href.split('#')[0];
          if (!seenUrls.has(cleanUrl)) {
            guidePages.push({title: link.textContent.trim() || 'Untitled Page', url: cleanUrl});
            seenUrls.add(cleanUrl);
          }
        }
      });
    }

    const currentUrl = window.location.href.split('#')[0];
    if (!seenUrls.has(currentUrl)) guidePages.unshift({title: document.title || 'Current Page', url: currentUrl});
    return guidePages.length > 0 ? guidePages : [{ title: document.title || 'Current Page', url: window.location.href }];
  }

  async function scanMultiplePages(pages) {
    const results = [];
    for (let i = 0; i < pages.length; i++) {
      updateProgress(i + 1, pages.length);
      try {
        const response = await fetch(pages[i].url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const container = doc.querySelector('#s-lg-guide-main') || doc.querySelector('#s-lg-content') || doc.body;
        
        let axeResults = { violations: [] };
        try {
          await new Promise(r => setTimeout(r, Math.random() * 100));
          axeResults = await axe.run(container, {runOnly: ['wcag2a', 'wcag2aa', 'best-practice'], resultTypes: ['violations']});
          axeResults.violations = axeResults.violations.filter(v => v.id !== 'empty-heading' && v.id !== 'image-alt');
        } catch (axeError) {console.warn('Axe error on', pages[i].url);}
        
        results.push({page: pages[i], violations: [...axeResults.violations, ...runCustomChecks(container)]});
      } catch (err) {
        results.push({page: pages[i], violations: [], error: err.message || 'Failed to scan'});
      }
    }
    return results;
  }

  function updateProgress(current, total) {
    const statusEl = document.getElementById('scan-status');
    if (statusEl) statusEl.textContent = `Scanning page ${current} of ${total}... (${Math.round((current / total) * 100)}%)`;
  }

  function initScanner(){
    if(!document.getElementById('a11y-global-styles')){
      const style = document.createElement('style');
      style.id = 'a11y-global-styles';
      style.textContent = `@keyframes slideIn{from{transform:translateX(100%);}to{transform:translateX(0);}}@keyframes slideOut{from{transform:translateX(0);}to{transform:translateX(100%);}}@media(max-width:768px){#a11y-overlay{width:100% !important;}}#a11y-resizer {position: absolute;top: 0;left: -8px;bottom: 0;width: 16px;cursor: col-resize;z-index: 1000000;}`;
      document.head.appendChild(style);
    }
    const sidebar = document.createElement('div');
    sidebar.id = 'a11y-overlay';
    sidebar.style.cssText = `position:fixed;top:0;right:0;bottom:0;width:450px;background:white;z-index:999999;display:flex;flex-direction:column;box-shadow:-4px 0 20px rgba(0,0,0,0.3);font-family:'Lexend',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;animation:slideIn 0.3s ease-out;transition:transform 0.3s cubic-bezier(0.4,0,0.2,1);`;
    sidebar.innerHTML = `
      <div id="a11y-resizer" title="Drag to resize sidebar"></div>
      <div role="banner" id="a11y-header" style="background:#00274c;color:white;padding:20px;border-bottom:3px solid #ffcb05;transition:opacity 0.3s ease;font-family:'Lexend',sans-serif;">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
          <h2 style="margin:0;font-size:20px;flex:1;color:#ffffff;font-family:'Lexend',sans-serif;">🔍 LibGuides A11y Insights</h2>
          <button id="scan-mode-toggle" style="background:#ffcb05;border-radius:6px;padding:8px 12px;color:#00274C;font-weight:600;font-size:12px;cursor:pointer;transition:all 0.2s;font-family:'Lexend',sans-serif;" title="Scan all pages in this guide">Show All Pages</button>
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
    resizer.addEventListener('mousedown', () => {isResizing = true; sidebar.style.transition = 'none'; document.body.style.userSelect = 'none'; document.body.style.cursor = 'col-resize';});
    document.addEventListener('mousemove', e => {if (isResizing) {const newWidth = window.innerWidth - e.clientX; if (newWidth > 300) sidebar.style.width = newWidth + 'px';}});
    document.addEventListener('mouseup', () => {if (isResizing) {isResizing = false; sidebar.style.transition = 'transform 0.3s cubic-bezier(0.4,0,0.2,1)'; document.body.style.userSelect = ''; document.body.style.cursor = '';}});
    
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
        // wait for libguides to load navigatin
        await new Promise(r => setTimeout(r, 500));
        window.scrollBy(0, 100);
        window.scrollBy(0, -100);
        await new Promise(r => setTimeout(r, 300));

        const pages = discoverGuidePages();
        const results = await scanMultiplePages(pages);
        displayMultiPageResults(results);
      } else {
        const container = findLibGuidesContainer();
        const axeResults = await axe.run(container, {runOnly: ['wcag2a', 'wcag2aa', 'best-practice'], resultTypes: ['violations']});
        const filteredAxeViolations = axeResults.violations.filter(v => 
            v.id !== 'empty-heading' 
            && v.id !== 'duplicate-id' 
            && v.id !== 'scope-attr-valid'
            && v.id !== 'image-alt'
        );

        displaySinglePageResults({ violations: [...filteredAxeViolations, ...runCustomChecks(container)] });
      }
    } catch (err) {
      document.getElementById('a11y-results').innerHTML = `<div style="color:#dc3545;background:#f8d7da;padding:20px;border-radius:8px;border:1px solid #f5c6cb;"><strong>Error:</strong> ${err.message}<br><br><small>Check browser console for details.</small></div>`;
    }
  }

  function displayMultiPageResults(results) {
    if (!document.getElementById("lexend-font")) {
      const link = document.createElement("link");
      link.id = "lexend-font"; link.rel = "stylesheet"; link.href = "https://fonts.googleapis.com/css2?family=Lexend:wght@400;600&display=swap";
      document.head.appendChild(link);
    }

    let totalViolations = 0, totalScore = 0, validPageCount = 0;
    const pageScores = results.map(result => {
      if (result.error) return { page: result.page, score: 0, violations: [], error: result.error };
      const score = calculateAccessibilityScore(result.violations);
      totalViolations += result.violations.length;
      totalScore += score;
      validPageCount++;
      return { page: result.page, score, violations: result.violations, error: null };
    });
    
    const avgScore = validPageCount > 0 ? Math.floor(totalScore / validPageCount) : 0;
    const scoreColors = {excellent: "#2c9a4b", good: "#1493a0", needsWork: "#d66a12", poor: "#c23c3c"};
    let scoreColor, scoreMessage;
    if (avgScore >= 95) {scoreColor = scoreColors.excellent; scoreMessage = "Excellent";}
    else if (avgScore >= 80) {scoreColor = scoreColors.good; scoreMessage = "Good";}
    else if (avgScore >= 60) {scoreColor = scoreColors.needsWork; scoreMessage = "Needs Work";}
    else {scoreColor = scoreColors.poor; scoreMessage = "Poor";}
    
    const circumference = 339.292, progress = (avgScore / 100) * circumference, offset = circumference - progress;
    
    let html = `<div style="text-align:center;padding:25px 20px 20px;border-bottom:1px solid #e5e7eb;margin-bottom:20px;background:#fafafa;font-family:'Lexend',sans-serif;">
      <div style="font-size:14px;font-weight:600;color:#4a4a4a;margin-bottom:15px;text-transform:uppercase;letter-spacing:1px;">Overall Guide Score</div>
      <svg width="90" height="90" viewBox="0 0 120 120"><circle cx="60" cy="60" r="54" fill="none" stroke="#e9ecef" stroke-width="8"/>
      <circle cx="60" cy="60" r="54" fill="none" stroke="${scoreColor}" stroke-width="8" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" transform="rotate(-90 60 60)" stroke-linecap="round" style="transition:stroke-dashoffset 0.5s ease;"/>
      <text x="60" y="65" text-anchor="middle" font-size="28" font-weight="600" fill="${scoreColor}">${avgScore}</text>
      <text x="60" y="82" text-anchor="middle" font-size="11" fill="#999">/ 100</text></svg>
      <div style="font-size:15px;font-weight:600;color:${scoreColor};margin-bottom:8px;">${scoreMessage} ${avgScore >= 95 ? '⭐⭐⭐⭐⭐' : avgScore >= 80 ? '⭐⭐⭐⭐' : avgScore >= 60 ? '⭐⭐⭐' : '⭐⭐'}</div>
      <div style="font-size:13px;color:#00274C;background:#f1f3f5;padding:8px 12px;border-radius:6px;display:inline-block;">Scanned ${results.length} page${results.length !== 1 ? 's' : ''} • Found ${totalViolations} issue${totalViolations !== 1 ? 's' : ''}</div></div>
      <h3 style="color:#00274c;font-size:16px;margin:20px 0 12px;padding-bottom:8px;border-bottom:1px solid #e5e7eb;font-weight:600;font-family:'Lexend',sans-serif;">📄 Per-Page Results</h3>`;
    
    pageScores.forEach(item => {
      const pageScoreColor = item.score >= 80 ? scoreColors.excellent : item.score >= 60 ? scoreColors.good : scoreColors.poor;
      const issueCount = item.violations.length;
      html += `<details style="background:#fff;padding:15px;margin:12px 0;border-radius:6px;border-left:4px solid ${pageScoreColor};box-shadow:0 1px 3px rgba(0,0,0,0.06);font-family:'Lexend',sans-serif;">
        <summary style="cursor:pointer;font-weight:600;font-size:14px;display:flex;justify-content:space-between;align-items:center;">
            <span style="color:#00274c;">${item.page.title}</span>
            <span style="display:flex;gap:10px;align-items:center;"></span>
            <span style="font-size:14px;">${item.score >= 95 ? '⭐⭐⭐⭐⭐' : item.score >= 80 ? '⭐⭐⭐⭐' : item.score >= 60 ? '⭐⭐⭐' : '⭐⭐'}</span>
            <span style="background:${pageScoreColor};color:white;padding:4px 10px;border-radius:4px;font-size:11px;font-weight:600;">${item.score}/100</span>
            <span style="color:#666;font-size:12px;">${issueCount} issue${issueCount !== 1 ? 's' : ''}</span>
        </summary>
        <div style="margin-top:15px;padding-top:15px;border-top:1px solid #e5e7eb;">
            ${item.error ? `<p style="color:#c23c3c;font-size:14px;">Error: ${item.error}</p>` : ''}
            ${item.violations.length === 0 ? '<p style="color:#2c9a4b;font-size:14px;">✓ No issues found</p>' : ''}
            ${item.violations.slice(0, 5).map(v => `<div style="background:#f8f9fa;padding:10px;margin:8px 0;border-radius:4px;font-size:13px;"><strong>${getExplanation(v.id).title}</strong><br><span style="color:#666;">${v.nodes.length} instance${v.nodes.length !== 1 ? 's' : ''}</span></div>`).join('')}
            ${item.violations.length > 5 ? `<p style="font-size:12px;color:#666;margin-top:10px;">...and ${item.violations.length - 5} more</p>` : ''}
        </div>
        </details>`;
    });
    document.getElementById('a11y-results').innerHTML = html;
    }
    
    function displaySinglePageResults(results) {
        if (!document.getElementById("lexend-font")) {
        const link = document.createElement("link");
        link.id = "lexend-font"; link.rel = "stylesheet"; link.href = "https://fonts.googleapis.com/css2?family=Lexend:wght@400;600&display=swap";
        document.head.appendChild(link);
        }
        const violations = results.violations, score = calculateAccessibilityScore(violations);
        const scoreColors = {excellent: "#2c9a4b", good: "#1493a0", needsWork: "#d66a12", poor: "#c23c3c"};
        let scoreColor, scoreMessage;
        if (score >= 95) {scoreColor = scoreColors.excellent; scoreMessage = "Excellent";}
        else if (score >= 80) {scoreColor = scoreColors.good; scoreMessage = "Good";}
        else if (score >= 60) {scoreColor = scoreColors.needsWork; scoreMessage = "Needs Work";}
        else {scoreColor = scoreColors.poor; scoreMessage = "Poor";}

        if (violations.length === 0) {
        document.getElementById("a11y-results").innerHTML = `<div style="max-width:400px;margin:32px auto 0;"><div style="text-align:center;padding:18px 16px 12px 16px;border-radius:8px;background:#f8fafb;border:1px solid #e5e7eb;box-shadow:0 1px 6px rgba(44,154,75,0.05);margin-bottom:14px;">
            <div style="font-size:13px;font-weight:600;color:#4a4a4a;margin-bottom:8px;">Accessibility Score</div>
            <svg width="80" height="80" viewBox="0 0 120 120" style="margin-bottom:6px;"><circle cx="60" cy="60" r="54" fill="none" stroke="#e9ecef" stroke-width="8"/><circle cx="60" cy="60" r="54" fill="none" stroke="#2c9a4b" stroke-width="8" stroke-dasharray="339.292" stroke-dashoffset="0" transform="rotate(-90 60 60)" stroke-linecap="round"/><text x="60" y="65" text-anchor="middle" font-size="26" font-weight="600" fill="#2c9a4b">100</text><text x="60" y="82" text-anchor="middle" font-size="10" fill="#999">/100</text></svg>
            <div style="font-size:15px;font-weight:600;color:#2c9a4b;margin-bottom:4px;">Excellent ⭐⭐⭐⭐⭐</div>
            <div style="font-size:12px;color:#00274C;background:#eafcef;padding:6px 10px;border-radius:5px;display:inline-block;">No issues found</div></div>
            <div style="background:#e6f4ea;border-radius:7px;border:1.2px solid #f1f9f3;padding:20px 15px;text-align:center;"><div style="font-family:'Lexend';font-size:14px;color:#226644;">This page successfully passed all accessibility checks.</div><div style="font-family:'Lexend';font-size:12px;color:#226644;font-style:italic;">Keep up the great work!</div></div></div>`;
        return;
        }

        const canFix = [], systemIssues = [];
        violations.forEach(v => {const exp = getExplanation(v.id); (exp.canFix === false ? systemIssues : canFix).push({ violation: v, explanation: exp });});

        const circumference = 339.292, offset = circumference - (score / 100) * circumference;
        const priorityColors = {critical: "#c23c3c", important: "#d66a12", minor: "#1493a0"};
        const priorityBackgrounds = {critical: "rgba(194, 60, 60, 0.04)", important: "rgba(214, 106, 18, 0.04)", minor: "rgba(20, 147, 160, 0.04)"};

        let html = `<div style="text-align:center;padding:25px 20px 20px 20px;border-bottom:1px solid #e5e7eb;margin-bottom:20px;background:#fafafa;font-family:'Lexend',sans-serif;">
        <div style="font-size:14px;font-weight:600;color:#4a4a4a;margin-bottom:15px;text-transform:uppercase;letter-spacing:1px;">Accessibility Score</div>
        <svg width="90" height="90" viewBox="0 0 120 120"><circle cx="60" cy="60" r="54" fill="none" stroke="#e9ecef" stroke-width="8"/>
        <circle cx="60" cy="60" r="54" fill="none" stroke="${scoreColor}" stroke-width="8" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" transform="rotate(-90 60 60)" stroke-linecap="round"/>
        <text x="60" y="65" text-anchor="middle" font-size="28" font-weight="600" fill="${scoreColor}">${score}</text>
        <text x="60" y="82" text-anchor="middle" font-size="11" fill="#999">/ 100</text></svg>
        <div style="font-size:15px;font-weight:600;color:${scoreColor};margin-bottom:8px;">${scoreMessage} ${score >= 95 ? '⭐⭐⭐⭐⭐' : score >= 80 ? '⭐⭐⭐⭐' : score >= 60 ? '⭐⭐⭐' : '⭐⭐'}</div>
        <div style="font-size:13px;color:#00274C;background:#f1f3f5;padding:8px 12px;border-radius:6px;display:inline-block;">Current page • Found ${violations.length} issue${violations.length !== 1 ? "s" : ""}</div></div>`;

        if (canFix.length > 0) {
        html += `<div style="display:flex;align-items:center;justify-content:space-between;margin:20px 0 12px 0;padding-bottom:8px;border-bottom:1px solid #e5e7eb;">
            <h3 style="color:#00274c;font-size:16px;font-weight:600;margin:0;font-family:'Lexend',sans-serif;">✏️ Issues You Can Fix</h3>
            <button id="accordion-toggle-btn" type="button" style="background:#ffcb05;color:#00274c;font-weight:600;border:none;border-radius:5px;padding:6px 15px;cursor:pointer;font-size:14px;">Expand All</button></div>`;

        canFix.forEach((item, index) => {
            const v = item.violation, exp = item.explanation;
            const color = priorityColors[exp.priority] || "#6c757d", bgColor = priorityBackgrounds[exp.priority] || "rgba(108, 117, 125, 0.04)";
            const selectors = v.nodes.map(n => n.target[0]).join("|");
            html += `<details style="background:${bgColor};padding:16px;margin:16px 0;border-radius:6px;border-left:4px solid ${color};box-shadow:0 1px 3px rgba(0,0,0,0.06);text-align:left;">
            <summary style="cursor:pointer;display:flex;justify-content:space-between;align-items:center;">
                <div style="font-size:15px;font-weight:600;color:#00274c;flex:1;">${index + 1}. ${exp.title}</div>
                <span style="background:${color};color:white;padding:3px 8px;border-radius:4px;font-size:10px;font-weight:600;text-transform:uppercase;">${exp.priority}</span>
            </summary>
            <div style="margin-top:14px;font-size:15px;line-height:1.6;color:#4a5568;text-align:center;">
                <div style="background:white;padding:12px;border:1px solid #e5e7eb;border-radius:6px;margin-bottom:14px;"><h5 style="margin:0 0 6px 0;font-weight:700;color:#1a2e3f;font-size:14px;">📖 What's wrong</h5><p style="margin:0;">${exp.plain}</p></div>
                <div style="background:white;padding:12px;border:1px solid #d8e7f7;border-radius:6px;margin-bottom:14px;"><h5 style="margin:0 0 6px 0;font-weight:700;color:#1a2e3f;font-size:14px;">🔧 How to fix</h5><p style="margin:0;">${exp.howToFix}</p></div>
                <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                <button class="highlight-btn" data-selectors="${selectors}" style="background:#ffcb05;color:#00274c;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:13px;font-weight:600;">👁️ Show on Page</button>
                <span style="font-size:13px;color:#666;">${v.nodes.length} affected</span>
                </div>
                <details style="margin-top:12px;"><summary style="cursor:pointer;font-size:13px;color:#666;font-weight:600;">Technical details</summary>
                <div style="background:#fafafa;padding:10px;margin-top:6px;border-radius:4px;font-size:12px;color:#555;border:1px solid #e5e7eb;line-height:1.5;">
                    <strong>Rule:</strong> ${v.id}<br><strong>WCAG:</strong> ${v.description}<br><strong>Element:</strong> <code style="background:#f3f4f6;padding:2px 4px;border-radius:3px;font-size:11px;">${v.nodes[0]?.target[0] || "N/A"}</code>
                </div>
                </details>
            </div>
            </details>`;
        });
    }

    if (systemIssues.length > 0) {
    html += `<div style="margin-bottom:25px;"><h3 style="color:#6c757d;font-size:16px;margin-bottom:15px;padding-bottom:8px;border-bottom:1px solid #e5e7eb;font-weight:600;">⚙️ System Issues</h3>`;
    systemIssues.forEach(item => {
        const v = item.violation, exp = item.explanation;
        html += `<details style="background:rgba(108, 117, 125, 0.04);padding:16px;margin:16px 0;border-left:4px solid #6c757d;border-radius:6px;opacity:0.85;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
        <summary style="cursor:pointer;font-size:15px;font-weight:600;color:#495057;">${exp.title}</summary>
        <div style="margin-top:14px;font-size:15px;line-height:1.6;color:#4a5568;"><p style="margin-bottom:12px;">${exp.plain}</p>
            <div style="background:#f3f4f6;padding:12px;border-radius:6px;font-size:14px;color:#333;border:1px solid #e5e7eb;">${exp.howToFix}</div>
        </div>
        </details>`;
    });
    html += `</div>`;
    }

    document.getElementById("a11y-results").innerHTML = html;

    setTimeout(() => {
    const accordionBtn = document.getElementById('accordion-toggle-btn');
    if (accordionBtn) {
        let expanded = false;
        accordionBtn.addEventListener('click', () => {
        expanded = !expanded;
        document.querySelectorAll("#a11y-results > details").forEach(d => d.open = expanded);
        accordionBtn.textContent = expanded ? "Collapse All" : "Expand All";
        });
    }
    }, 0);

    document.querySelectorAll(".highlight-btn").forEach(btn => {
    btn.onclick = function () {
        const selectorsString = this.getAttribute("data-selectors");
        if (!selectorsString) return;
        const success = highlightAllElements(selectorsString.split("|").filter(Boolean));
        if (success) {
        this.textContent = "✓ Highlighted"; this.style.background = "#2c9a4b"; this.style.color = "white";
        setTimeout(() => {this.textContent = "👁️ Show on Page"; this.style.background = "#ffcb05"; this.style.color = "#00274c";}, 2000);
        } else {
        this.textContent = "✗ Not found"; this.style.background = "#c23c3c"; this.style.color = "white";
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
