(function() {
  'use strict';
  
  // Prevent multiple instances
  if (document.getElementById('a11y-overlay')) {
    alert('Scanner already running!');
    return;
  }

  // LibGuides-specific explanations
  const ISSUE_EXPLANATIONS = {
    'image-alt': {
      title: 'Images Missing Descriptions',
      plain: 'Images need alternative text so screen readers can describe them to blind users.',
      howToFix: 'In LibGuides editor: Click the image → Properties → Add description in "Alternative Text" field. Describe what the image shows.',
      priority: 'critical',
      canFix: true
    },
    'decorative-image-role': {
      title: 'Decorative Image Needs role="presentation"',
      plain: 'This image has empty alt text (decorative), but should be explicitly marked with role="presentation" for screen readers.',
      howToFix: 'In LibGuides editor: Click image → Properties → In the "Advanced" tab, add Attribute: role="presentation". Or add descriptive alt text if the image isn\'t decorative.',
      priority: 'minor',
      canFix: true
    },
    'link-url-only-text': {
      title: 'Links Use URLs as Text',
      plain: 'These links display the full URL (like "http://proxy.lib...") instead of descriptive text. Screen reader users hear the entire URL read aloud.',
      howToFix: 'In LibGuides editor: Highlight the link → Change the visible text to something descriptive like "View in ProQuest Database" while keeping the URL in the link target.',
      priority: 'important',
      canFix: true
    },
    'image-no-alt': {
      title: 'Images Missing Alt Attribute',
      plain: 'These images have no alt attribute at all. Every image must have alt="" (if decorative) or descriptive alt text.',
      howToFix: 'In LibGuides editor: Click image → Properties → Add alt text describing the image, or use alt="" if purely decorative.',
      priority: 'critical',
      canFix: true
    },
    'image-alt-quality': {
      title: 'Alt Text Quality Issues',
      plain: 'Alt text contains problematic patterns: starts with phrases like "image of", is a filename (IMG_1234.jpg), text that\'s too long (>250 chars), or is ALL CAPS.',
      howToFix: 'In LibGuides editor: Click image → Properties → Revise alt text. Remove leading phrases like "image of" (just describe the content directly). Keep it under 250 characters. Example: Instead of "Image of students conducting experiments", use "Students conducting chemistry experiments in a laboratory".',
      priority: 'moderate',
      canFix: true
    },
    'label': {
      title: 'Form Fields Missing Labels',
      plain: 'Search boxes and input fields need visible labels so users know what to enter.',
      howToFix: 'Add a text label above the field, or contact library-web-support@umich.edu if it\'s a widget.',
      priority: 'critical',
      canFix: true
    },
    'link-name': {
      title: 'Links Without Descriptive Text',
      plain: 'Links need text that describes where they go. Avoid "click here" or "read more".',
      howToFix: 'Change link text to be specific: "View Chemistry Guide" instead of "click here". Edit in LibGuides rich text editor.',
      priority: 'important',
      canFix: true
    },
    'empty-heading': {
      title: 'Empty Headings',
      plain: 'Headings must contain text. Empty headings confuse screen readers.',
      howToFix: 'Add text to the heading or delete it. Check for hidden formatting in LibGuides editor.',
      priority: 'critical',
      canFix: true
    },
    'heading-order': {
      title: 'Heading Structure Problems',
      plain: 'Headings should go in order (H1 → H2 → H3), not skip levels. Think of it like a book outline.',
      howToFix: 'In LibGuides editor: Select the heading → Change from "Heading 4" to "Heading 3" in the format dropdown.',
      priority: 'important',
      canFix: true
    },
    'color-contrast': {
      title: 'Text Hard to Read (Low Contrast)',
      plain: 'Text color doesn\'t stand out enough from the background. People with low vision can\'t read it.',
      howToFix: 'Use darker text colors, or stick to LibGuides default styling. Avoid light gray text (#999) on white backgrounds.',
      priority: 'important',
      canFix: true
    },
    'button-name': {
      title: 'Buttons Without Labels',
      plain: 'Buttons need text or labels that describe what they do.',
      howToFix: 'Add text inside the button, or remove empty buttons from your content.',
      priority: 'critical',
      canFix: true
    },
    'landmark-one-main': {
      title: 'Multiple Main Content Areas',
      plain: 'Page has multiple "main" regions. This is usually a LibGuides template issue.',
      howToFix: 'SYSTEM ISSUE: Contact library-web-support@umich.edu. You likely can\'t fix this yourself.',
      priority: 'system',
      canFix: false
    },
    'page-has-heading-one': {
      title: 'Missing Main Page Title (H1)',
      plain: 'Pages should have one H1 heading that describes the main content.',
      howToFix: 'In LibGuides: Check that your page title is set. Edit Page → Page Title field.',
      priority: 'important',
      canFix: true
    },
    'region': {
      title: 'Content Not in Proper Sections',
      plain: 'Some content isn\'t inside proper page sections (header, main, footer). Screen readers use these to navigate.',
      howToFix: 'Put main content in center content boxes. Avoid floating text outside boxes. This may be partially a template issue.',
      priority: 'minor',
      canFix: 'partial'
    },
    'landmark-banner-is-top-level': {
      title: 'Banner Structure Issue',
      plain: 'Page header structure problem - usually a LibGuides system issue.',
      howToFix: 'SYSTEM ISSUE: You can ignore this or contact library-web-support@umich.edu.',
      priority: 'system',
      canFix: false
    }
  };

  function getExplanation(ruleId) {
    if (ISSUE_EXPLANATIONS[ruleId]) return ISSUE_EXPLANATIONS[ruleId];
    for (let key in ISSUE_EXPLANATIONS) {
      if (ruleId.includes(key) || key.includes(ruleId)) return ISSUE_EXPLANATIONS[key];
    }
    return {
      title: 'Accessibility Issue',
      plain: 'This element has an accessibility problem.',
      howToFix: 'Review the technical description below for details.',
      priority: 'important',
      canFix: true
    };
  }

  function highlightElement(selector) {
    document.querySelectorAll('.a11y-highlight').forEach(el => el.classList.remove('a11y-highlight'));
    if (!document.getElementById('a11y-highlight-style')) {
      const style = document.createElement('style');
      style.id = 'a11y-highlight-style';
      style.textContent = `
        .a11y-highlight {
          outline: 4px solid #ffcb05 !important;
          outline-offset: 2px !important;
          background: rgba(255, 203, 5, 0.1) !important;
          scroll-margin: 100px;
        }
      `;
      document.head.appendChild(style);
    }
    try {
      const element = document.querySelector(selector);
      if (element) {
        element.classList.add('a11y-highlight');
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return true;
      }
    } catch (e) { 
      console.error('Could not highlight:', e); 
    }
    return false;
  }

  // Custom LibGuides-specific checks that axe doesn't catch
  function runCustomChecks(context) {
    const violations = [];
    const container = context === document ? document : context;
    
    // Check 1: Decorative images with empty alt (should have role="presentation")
    const decorativeImages = container.querySelectorAll('img[alt=""]');
    if (decorativeImages.length > 0) {
      const nodes = Array.from(decorativeImages).filter(img => {
        return !img.hasAttribute('role') || img.getAttribute('role') !== 'presentation';
      });
      
      if (nodes.length > 0) {
        violations.push({
          id: 'decorative-image-role',
          impact: 'minor',
          help: 'Decorative Images Should Have role="presentation"',
          description: 'Images with empty alt text should explicitly be marked as decorative with role="presentation"',
          nodes: nodes.map(el => ({
            target: [getCssSelector(el)],
            html: el.outerHTML.substring(0, 100)
          }))
        });
      }
    }
    
    // Check 2: Links with only URLs as text
    const links = container.querySelectorAll('a');
    const urlOnlyLinks = Array.from(links).filter(link => {
      const text = link.textContent.trim();
      // Check if link text is just a URL
      return text.startsWith('http://') || text.startsWith('https://');
    });
    
    if (urlOnlyLinks.length > 0) {
      violations.push({
        id: 'link-url-only-text',
        impact: 'serious',
        help: 'Links Should Not Use URLs as Link Text',
        description: 'Links with URLs as text are not descriptive. Use meaningful text that describes the destination.',
        nodes: urlOnlyLinks.map(el => ({
          target: [getCssSelector(el)],
          html: el.outerHTML.substring(0, 150)
        }))
      });
    }
    
    // Check 3: Images without alt text at all
    const imagesNoAlt = container.querySelectorAll('img:not([alt])');
    if (imagesNoAlt.length > 0) {
      violations.push({
        id: 'image-no-alt',
        impact: 'critical',
        help: 'Images Must Have Alt Attributes',
        description: 'All images must have an alt attribute, even if empty for decorative images.',
        nodes: Array.from(imagesNoAlt).map(el => ({
          target: [getCssSelector(el)],
          html: el.outerHTML.substring(0, 100)
        }))
      });
    }
    
    // Check 4: Alt text quality issues
    const imagesWithAlt = container.querySelectorAll('img[alt]');
    const badAltImages = Array.from(imagesWithAlt).filter(img => {
      const alt = img.alt.toLowerCase();
      if (!alt) return false; // Empty is okay (decorative)
      
      // Check for bad patterns
      return (
        alt.startsWith('image of') ||
        alt.startsWith('picture of') ||
        alt.startsWith('photo of') ||
        alt.startsWith('graphic of') ||
        alt.startsWith('screenshot of') ||
        alt.match(/\.(jpg|jpeg|png|gif|svg|webp|bmp)$/i) || // Filename
        alt.length > 250 || // More reasonable limit (was 150)
        (alt === alt.toUpperCase() && alt.length > 10) // ALL CAPS (but allow short ones like "FAQ")
      );
    });
    
    if (badAltImages.length > 0) {
      violations.push({
        id: 'image-alt-quality',
        impact: 'moderate',
        help: 'Alt Text Quality Issues',
        description: 'Alt text should be concise (<250 chars), avoid phrases like "image of" at the start, and not be filenames or all caps.',
        nodes: badAltImages.map(el => ({
          target: [getCssSelector(el)],
          html: el.outerHTML.substring(0, 100),
          altText: el.alt
        }))
      });
    }
    
    return violations;
  }
  
  // Helper to get CSS selector for an element
  function getCssSelector(el) {
    // Try ID first
    if (el.id) return `#${el.id}`;
    
    // Try building a path
    const path = [];
    let current = el;
    
    while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      
      if (current.id) {
        selector = `#${current.id}`;
        path.unshift(selector);
        break;
      }
      
      // Add class if exists
      if (current.className && typeof current.className === 'string') {
        const classes = current.className.trim().split(/\s+/).slice(0, 2).join('.');
        if (classes) {
          selector += `.${classes}`;
        }
      }
      
      // Add nth-child for specificity
      if (current.parentElement) {
        const siblings = Array.from(current.parentElement.children);
        const index = siblings.indexOf(current);
        if (siblings.length > 1) {
          selector += `:nth-child(${index + 1})`;
        }
      }
      
      path.unshift(selector);
      current = current.parentElement;
      
      // Limit path length
      if (path.length > 5) break;
    }
    
    return path.join(' > ');
  }

  function findLibGuidesContainer() {
    // Try multiple selectors in order of preference
    const candidates = [
      '#s-lg-guide-main',
      '#s-lg-content',
      '.s-lg-guide-body',
      '#s-lg-public-main',
      '[id^="s-lg-box"]'
    ];
    
    for (let sel of candidates) {
      const el = document.querySelector(sel);
      if (el) {
        console.log('Found LibGuides container:', sel);
        return el;
      }
    }
    
    console.warn('No specific LibGuides container found, using document');
    return document;
  }

  function initScanner() {
    // Create sidebar
    const sidebar = document.createElement('div');
    sidebar.id = 'a11y-overlay';
    sidebar.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: 450px;
      background: white;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      box-shadow: -4px 0 20px rgba(0, 0, 0, 0.3);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      animation: slideIn 0.3s ease-out;
    `;
    
    if (!document.getElementById('a11y-sidebar-style')) {
      const style = document.createElement('style');
      style.id = 'a11y-sidebar-style';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes slideOut {
          from { transform: translateX(0); }
          to { transform: translateX(100%); }
        }
        @media (max-width: 768px) {
          #a11y-overlay { width: 100% !important; }
        }
      `;
      document.head.appendChild(style);
    }
    
    sidebar.innerHTML = `
      <div role="banner" style="background: #00274c; color: white; padding: 20px; border-bottom: 3px solid #ffcb05;">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
          <h2 style="margin: 0; font-size: 20px; flex: 1; color: #ffffff;">🔍 A11y Scanner</h2>
          <button id="a11y-minimize-btn" style="background: #0066cc; color: white; border: none; padding: 10px 15px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 14px;" title="Minimize sidebar" aria-label="Minimize sidebar">◀</button>
          <button id="a11y-close-btn" style="background: #dc3545; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 14px;" title="Close scanner" aria-label="Close accessibility scanner">Close</button>
        </div>
        <div id="scan-status" style="margin-top: 10px; font-size: 14px; opacity: 0.9; color: #ffffff;">Finding LibGuides content...</div>
      </div>
      <main id="a11y-results" style="flex: 1; overflow-y: auto; padding: 20px; color: #333333; text-align: center;">
        Initializing scanner...<br><br>⏳
      </main>
    `;
    
    document.body.appendChild(sidebar);
    
    // Minimize/maximize functionality
    let isMinimized = false;
    const minimizeBtn = document.getElementById('a11y-minimize-btn');
    const resultsDiv = document.getElementById('a11y-results');
    
    minimizeBtn.onclick = function() {
      isMinimized = !isMinimized;
      
      if (isMinimized) {
        sidebar.style.width = '60px';
        sidebar.style.transition = 'width 0.3s ease';
        resultsDiv.style.display = 'none';
        minimizeBtn.textContent = '▶';
        minimizeBtn.title = 'Expand sidebar';
        minimizeBtn.setAttribute('aria-label', 'Expand sidebar');
        sidebar.querySelector('h2').style.display = 'none';
        document.getElementById('scan-status').style.display = 'none';
        document.getElementById('a11y-close-btn').style.display = 'none';
      } else {
        sidebar.style.width = '450px';
        resultsDiv.style.display = 'block';
        minimizeBtn.textContent = '◀';
        minimizeBtn.title = 'Minimize sidebar';
        minimizeBtn.setAttribute('aria-label', 'Minimize sidebar');
        sidebar.querySelector('h2').style.display = 'block';
        document.getElementById('scan-status').style.display = 'block';
        document.getElementById('a11y-close-btn').style.display = 'inline-block';
      }
    };
    
    // Close button handler
    document.getElementById('a11y-close-btn').onclick = function() {
      document.querySelectorAll('.a11y-highlight').forEach(el => {
        el.classList.remove('a11y-highlight');
      });
      sidebar.style.animation = 'slideOut 0.3s ease-in';
      sidebar.addEventListener('animationend', () => sidebar.remove());
    };
    
    // Find LibGuides container
    const container = findLibGuidesContainer();
    document.getElementById('scan-status').textContent = 'Running accessibility checks...';
    
    // Run BOTH axe scan AND custom checks
    const context = container === document ? document : container;
    
    Promise.all([
      // Axe-core scan
      axe.run(context, { 
        runOnly: ['wcag2a', 'wcag2aa', 'best-practice'],
        resultTypes: ['violations']
      }),
      // Custom LibGuides checks
      Promise.resolve(runCustomChecks(context))
    ])
    .then(([axeResults, customResults]) => {
      // Merge axe violations with custom checks
      const allViolations = [...axeResults.violations, ...customResults];
      displayResults({ violations: allViolations });
    })
    .catch(err => {
      console.error('Scan error:', err);
      document.getElementById('a11y-results').innerHTML = `
        <div style="color: #dc3545; background: #f8d7da; padding: 20px; border-radius: 8px; border: 1px solid #f5c6cb;">
          <strong>Error:</strong> ${err.message}<br><br>
          <small>Check browser console for details.</small>
        </div>
      `;
    });
  }

  function displayResults(results) {
    const violations = results.violations;
    const statusEl = document.getElementById('scan-status');
    
    // Calculate accessibility score - STRICTER formula
    // Each violation deducts points based on severity AND count
    let score = 100;
    let deductions = 0;
    
    violations.forEach(v => {
      const count = v.nodes.length;
      if (v.impact === 'critical') deductions += (15 * count); // Much harsher
      else if (v.impact === 'serious') deductions += (10 * count);
      else if (v.impact === 'moderate') deductions += (5 * count);
      else if (v.impact === 'minor') deductions += (3 * count);
    });
    
    score = Math.max(0, 100 - deductions);
    
    // Determine score color and message
    let scoreColor, scoreMessage;
    if (score >= 95) {
      scoreColor = '#28a745';
      scoreMessage = 'Excellent';
    } else if (score >= 80) {
      scoreColor = '#ffc107';
      scoreMessage = 'Good';
    } else if (score >= 60) {
      scoreColor = '#fd7e14';
      scoreMessage = 'Needs Work';
    } else {
      scoreColor = '#dc3545';
      scoreMessage = 'Poor';
    }
    
    if (statusEl) {
      statusEl.textContent = violations.length === 0 ? 'Scan complete - No issues!' : `Found ${violations.length} issue(s)`;
    }
    
    if (violations.length === 0) {
      document.getElementById('a11y-results').innerHTML = `
        <div style="text-align: center; padding: 40px 20px;">
          <div style="font-size: 14px; font-weight: 600; color: #666; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px;">Accessibility Score</div>
          <svg width="120" height="120" viewBox="0 0 120 120" style="margin-bottom: 20px;">
            <circle cx="60" cy="60" r="54" fill="none" stroke="#e9ecef" stroke-width="8"/>
            <circle cx="60" cy="60" r="54" fill="none" stroke="#28a745" stroke-width="8" 
                    stroke-dasharray="339.292" stroke-dashoffset="0"
                    transform="rotate(-90 60 60)" stroke-linecap="round"/>
            <text x="60" y="65" text-anchor="middle" font-size="32" font-weight="bold" fill="#28a745">100</text>
            <text x="60" y="85" text-anchor="middle" font-size="12" fill="#666">/ 100</text>
          </svg>
          <div style="background: #d4edda; padding: 30px; border-radius: 10px; color: #155724; text-align: center; border: 2px solid #c3e6cb; margin-top: 10px;">
            <div style="font-size: 48px; margin-bottom: 15px;">✅</div>
            <h3 style="margin: 0 0 10px 0; font-size: 20px;">Perfect Score!</h3>
            <p style="margin: 0; font-size: 15px;">No accessibility issues detected in the LibGuides content.</p>
          </div>
        </div>
      `;
      return;
    }
    
    // Categorize issues
    const canFix = [];
    const systemIssues = [];
    
    violations.forEach(v => {
      const explanation = getExplanation(v.id);
      if (explanation.canFix === false) {
        systemIssues.push({ violation: v, explanation });
      } else {
        canFix.push({ violation: v, explanation });
      }
    });
    
    // Calculate circle progress (339.292 is circumference of r=54 circle)
    const circumference = 339.292;
    const progress = (score / 100) * circumference;
    const offset = circumference - progress;
    
    let html = `
      <div style="text-align: center; padding: 25px 20px 20px 20px; border-bottom: 2px solid #e9ecef; margin-bottom: 20px; background: #f8f9fa;">
        <div style="font-size: 14px; font-weight: 700; color: #495057; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1.5px;">Accessibility Score</div>
        <svg width="90" height="90" viewBox="0 0 120 120" style="margin-bottom: 12px;">
          <circle cx="60" cy="60" r="54" fill="none" stroke="#e9ecef" stroke-width="8"/>
          <circle cx="60" cy="60" r="54" fill="none" stroke="${scoreColor}" stroke-width="8" 
                  stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
                  transform="rotate(-90 60 60)" stroke-linecap="round"
                  style="transition: stroke-dashoffset 0.5s ease;"/>
          <text x="60" y="65" text-anchor="middle" font-size="28" font-weight="bold" fill="${scoreColor}">${score}</text>
          <text x="60" y="82" text-anchor="middle" font-size="11" fill="#999">/ 100</text>
        </svg>
        <div style="font-size: 16px; font-weight: 600; color: ${scoreColor}; margin-bottom: 3px;">${scoreMessage}</div>
        <div style="font-size: 12px; color: #999;">${violations.length} issue${violations.length !== 1 ? 's' : ''} found</div>
      </div>
      
      <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 0 20px 20px 20px; border-left: 5px solid #ffc107;">
        <h3 style="margin: 0 0 8px 0; color: #856404; font-size: 16px; font-weight: 600;">
          Issues Breakdown
        </h3>
        <div style="font-size: 13px; color: #856404;">
          ${canFix.length} you can fix • ${systemIssues.length} system issues
        </div>
      </div>
    `;
    
    // Show fixable issues first
    if (canFix.length > 0) {
      html += `<div style="margin-bottom: 25px;">`;
      html += `<h3 style="color: #00274c; font-size: 16px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #e9ecef;">✏️ You Can Fix</h3>`;
      
      canFix.forEach((item, index) => {
        const v = item.violation;
        const exp = item.explanation;
        const priorityColors = {
          critical: '#dc3545',
          important: '#fd7e14',
          minor: '#17a2b8'
        };
        const color = priorityColors[exp.priority] || '#6c757d';
        
        html += `
          <div style="background: #f8f9fa; padding: 15px; margin: 12px 0; border-left: 4px solid ${color}; border-radius: 6px;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
              <h3 style="margin: 0; color: #00274c; font-size: 15px; font-weight: 600; flex: 1; line-height: 1.3;">
                ${index + 1}. ${exp.title}
              </h3>
              <span style="background: ${color}; color: white; padding: 3px 8px; border-radius: 3px; font-size: 10px; font-weight: bold; text-transform: uppercase; white-space: nowrap; margin-left: 10px;">
                ${exp.priority}
              </span>
            </div>
            
            <div style="background: white; padding: 12px; border-radius: 4px; margin-bottom: 10px;">
              <div style="font-weight: 600; color: #495057; margin-bottom: 6px; font-size: 12px;">📖 What's wrong:</div>
              <p style="margin: 0; font-size: 13px; color: #666; line-height: 1.5;">${exp.plain}</p>
            </div>
            
            <div style="background: #e7f3ff; padding: 12px; border-radius: 4px; border-left: 3px solid #0066cc; margin-bottom: 10px;">
              <div style="font-weight: 600; color: #004085; margin-bottom: 6px; font-size: 12px;">🔧 How to fix:</div>
              <p style="margin: 0; font-size: 13px; color: #004085; line-height: 1.5;">${exp.howToFix}</p>
            </div>
            
            <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
              <button class="highlight-btn" data-selector="${v.nodes[0]?.target[0] || ''}" style="background: #ffcb05; color: #00274c; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600;">
                👁️ Show on Page
              </button>
              <span style="font-size: 12px; color: #666;">
                ${v.nodes.length} affected
              </span>
            </div>
            
            <details style="margin-top: 10px;">
              <summary style="cursor: pointer; font-size: 12px; color: #666; font-weight: 600;">Technical details</summary>
              <div style="background: white; padding: 8px; margin-top: 6px; border-radius: 4px; font-size: 11px; color: #666; line-height: 1.5;">
                <strong>Rule:</strong> ${v.id}<br>
                <strong>WCAG:</strong> ${v.description}<br>
                <strong>Element:</strong> <code style="background: #f8f9fa; padding: 2px 4px; border-radius: 2px; font-size: 10px;">${v.nodes[0]?.target[0] || 'N/A'}</code>
              </div>
            </details>
          </div>
        `;
      });
      html += `</div>`;
    }
    
    // Show system issues
    if (systemIssues.length > 0) {
      html += `<div style="margin-bottom: 20px;">`;
      html += `<h3 style="color: #6c757d; font-size: 16px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #e9ecef;">⚙️ System Issues</h3>`;
      
      systemIssues.forEach((item) => {
        const v = item.violation;
        const exp = item.explanation;
        
        html += `
          <div style="background: #f8f9fa; padding: 15px; margin: 12px 0; border-left: 4px solid #6c757d; border-radius: 6px; opacity: 0.8;">
            <h3 style="margin: 0 0 10px 0; color: #495057; font-size: 14px; font-weight: 600;">
              ${exp.title}
            </h3>
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #666; line-height: 1.5;">${exp.plain}</p>
            <div style="background: #e9ecef; padding: 10px; border-radius: 4px; font-size: 12px; color: #495057;">
              ${exp.howToFix}
            </div>
          </div>
        `;
      });
      html += `</div>`;
    }
    
    document.getElementById('a11y-results').innerHTML = html;
    
    // Add click handlers for highlight buttons
    document.querySelectorAll('.highlight-btn').forEach(btn => {
      btn.onclick = function() {
        const selector = this.getAttribute('data-selector');
        const success = highlightElement(selector);
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
  
  // Load axe-core if not already loaded
  if (typeof axe === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.2/axe.min.js';
    script.onload = initScanner;
    script.onerror = function() {
      alert('Failed to load axe-core. Check your internet connection.');
    };
    document.head.appendChild(script);
  } else {
    initScanner();
  }
})();