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
        priority:'violation', canFix:true},
    'image-alt-quality': {
        title:'Alt Text Quality Issues', 
        plain:'Alt text contains problematic patterns: starts with phrases like "image of", is a filename, too long, or all caps.', 
        howToFix:'Revise alt text. Remove leading phrases like "image of". Keep under 250 characters. You can use the <a href="https://chatgpt.com/g/g-t8ueMpwjg-wolverine-describer" target="_blank" rel="noopener" aria-label="Wolverine Describer (opens in new tab)">Wolverine Describer</a> to generate accessible alt text.',
        priority:'best-practice', canFix:true},
    'link-url-only-text': {
        title:'Links Use URLs as Text', 
        plain:'These links display the full URL (like "http://proxy.lib...") instead of descriptive text. Screen reader users hear the entire URL read aloud.', 
        howToFix:'In LibGuides editor: Highlight the link → Change the visible text to something descriptive like "View in ProQuest Database" while keeping the URL in the link target.', 
        priority:'warning', canFix:true},
    'link-name': {
        title:'Links Without Descriptive Text', 
        plain:'Links need text that describes where they go. Avoid "click here" or "read more".', 
        howToFix:'Change link text to be specific: "View Chemistry Guide" instead of "click here".', 
        priority:'violation', canFix:true},
    'empty-heading-image-only': {
        title:'Heading Contains Only an Image', 
        plain:'This heading contains only an image. Screen readers treat this as an empty heading because they can\'t read the image as a heading.', 
        howToFix:'In LibGuides editor: Add text inside the heading alongside or instead of the image. Or move the image outside the heading tag entirely.', 
        priority:'violation', canFix:true},
    'empty-heading-whitespace': {
        title:'Heading is Completely Empty', 
        plain:'This heading has no text at all - it\'s completely empty or contains only whitespace.', 
        howToFix:'In LibGuides editor: Delete this heading or add descriptive text to it.', 
        priority:'violation', canFix:true},
    'empty-heading-libguides-box': {
        title:'Empty LibGuides Box Title', 
        plain:'This looks like a LibGuides box title heading. LibGuides sometimes creates empty headings automatically when a box title is missing.', 
        howToFix:'In LibGuides editor: Edit the box → Add a title in the "Box Title" field, or change the box type to "No Heading" in box settings.', 
        priority:'violation', canFix:true},
    'heading-order': {
        title:'Heading Structure Problems', 
        plain:'Headings should go in order (H1 → H2 → H3), not skip levels.', 
        howToFix:'Change heading level in editor to correct sequence.', 
        priority:'warning', canFix:true},
    'page-has-heading-one': {
        title:'Missing Main Page Title (H1)', 
        plain:'Pages should have one H1 heading that describes the main content.', 
        howToFix:'Check that your page title is set. Edit Page → Page Title field.', 
        priority:'warning', canFix:true},
    'heading-with-link': {
        title:'Headings Used Entirely as Links',
        plain: 'This heading\'s entire text is a link. This can confuse screen readers - is it a heading for navigation or a clickable link?',
        howToFix: 'In LibGuides editor: Either (1) add non-linked text to the heading, or (2) if the entire section is clickable, consider using regular text with a link instead of a heading.',
        priority: 'warning', canFix: true},
    'label': {
        title:'Form Fields Missing Labels', 
        plain:'Search boxes and input fields need visible labels so users know what to enter. Screen readers cannot tell what an unlabeled field is for.', 
        howToFix:'In LibGuides editor: If you embedded a form using HTML: Add a &lt;label&gt; tag in the code. Example: change &lt;input type="text" name="search"&gt; to &lt;label&gt;Search: &lt;input type="text" name="search"&gt;&lt;/label&gt;. OR add descriptive text above the form. If you created a form using a widget: add visible text above the input field describing what to enter.', 
        priority:'violation', canFix:true},
    'button-name': {
        title:'Buttons Without Labels',
        plain:'Buttons need text or labels that describe what they do.', 
        howToFix:'Add text inside the button, or remove empty buttons.', 
        priority:'violation', canFix:true},    
    'color-contrast': {
        title:'Text Fails Contrast Requirements', 
        plain:'Text color doesn\'t have enough contrast with its background color. This makes it difficult or impossible for people with low vision or color blindness to read.',
        howToFix:'In LibGuides editor: Change the text to a darker color or use the default text color (remove custom colors). The text and background must have a contrast ratio of at least 4.5:1 for normal text, or 3:1 for large text (18pt+ or 14pt+ bold). Use the <a href="https://webaim.org/resources/contrastchecker/" target="_blank" rel="noopener" aria-label="WebAIM Contrast Checker (opens in new tab)">WebAIM Contrast Checker</a> to test your colors.', 
        priority:'violation', canFix:true},
    'duplicate-id': {
        title: 'Duplicate ID Attributes',
        plain: 'Multiple elements have the same ID. This often happens when copying content from Google Docs or Word, which adds hidden IDs that get duplicated when you paste multiple times.',
        howToFix: 'In LibGuides editor: (1) Select all the content in this box, (2) Copy the content and paste it into a plain text editor (such as Notepad, TextEdit)to strip any hidden formatting and duplicate ID codes, (3) Then, copy the cleaned text from the plain text editor and paste it back into LibGuides, (4) Reapply any formatting you need (bold, italics, headings, links) using the LibGuides editor tools.',
        priority: 'violation', canFix: true},
    'scope-attr-valid': {
        title:'Incorrect Use of Scope Attribute in Tables', 
        plain:'Table cells have a "scope" attribute, but this attribute should only be used on table header cells (<th>), not regular data cells (<td>).', 
        howToFix:'In LibGuides editor: Edit the table → Select the header row → Use the table toolbar to convert header cells from <td> to <th>. Or rebuild the table using the table tool with proper headers. If editing HTML directly: change change &lt;td scope="col"&gt; to &lt;th scope="col"&gt; for header cells.', 
        priority:'violation', canFix: true},
    'list': {
        title:'Improperly Structured List', 
        plain:'This list has structural problems - likely extra tags, nested elements, or formatting copied from Microsoft Word or Google Docs that breaks the list structure for screen readers.', 
        howToFix:'In LibGuides editor: (1) Delete the problematic list, (2) Recreate it using the list button in the toolbar (bullet or numbered list icon), (3) Type or paste content as plain text, then format. DO NOT copy formatted lists directly from Word/Docs. If you must paste from Word: paste into Notepad first to strip formatting, then paste into LibGuides.', 
        priority:'violation', canFix: true},
    'frame-title': {
        title: 'Embedded Content Missing Labels',
        plain: 'Embedded content (like videos, databases, or widgets in iframes) is missing a title or label. Screen reader users can\'t tell what the embedded content is.',
        howToFix: 'In LibGuides editor: If you embedded content using HTML code, add a title attribute to the iframe. Example: &lt;iframe src="..." title="Database Search Widget"&gt;&lt;/iframe&gt;. The title should describe what the embedded content is.',
        priority: 'violation',
        canFix: true
    },
    'empty-container': {
        title: 'Empty Section or Container',
        plain: 'This section or container has no content in it. Empty sections create confusion for screen reader users.',
        howToFix: 'In LibGuides editor: Either (1) add content to this section/box, or (2) delete the empty section/box entirely. Check for LibGuides boxes with no content.',
        priority: 'warning',
        canFix: true
    },
    'th-has-data-cells': {
        title: 'Table Headers Not Marked as Headers',
        plain: 'This table has regular cells (&lt;td&gt;) for headers instead of proper header cells (&lt;th&gt;). Screen readers cannot identify which cells are headers, making the table incomprehensible.',
        howToFix: 'In LibGuides editor: Right click the table -> Select Table Properties -> Use the table toolbar to mark cells as headers . Or rebuild the table using the table tool and designate the first row/column as headers. All column and row headers must use &lt;th&gt; tags.',
        priority: 'violation',
        canFix: true
    },
    'table-semantic-markup': {
        title: 'Table Lacks Proper Structure', 
        plain: 'This table is missing proper semantic structure elements like &lt;thead&gt;, &lt;tbody&gt;, or &lt;caption&gt;. This makes it harder for screen readers to navigate and understand the table.',
        howToFix: 'In LibGuides editor: This is difficult to fix in the visual editor. Best practice: (1) Add a caption/title above the table using regular text to describe what the table shows, or (2) If editing HTML directly, wrap header rows in &lt;thead&gt; and data rows in &lt;tbody&gt;. For simple tables, having proper &lt;th&gt; headers is most critical.',
        priority: 'best-practice', 
        canFix: 'partial'
    },
    'link-new-window': {
        title: 'Links Open in New Window Without Warning', 
        plain: 'These links open in a new window or tab (target="_blank") but don\'t warn users. This is disorienting for screen reader users and people with cognitive disabilities who may not realize they\'ve left the current page.',
        howToFix: 'In LibGuides editor: For links that open in new windows, add text like "(opens in new window)" or "(opens in new tab)" to the link text. Example: "View Database (opens in new window)". Or add a visual icon that indicates external links. Best Practice: Avoid opening links in new windows unless necessary.',
        priority: 'warning', 
        canFix: true
    },
    'iframe-unique-name': {
        title: 'Multiple Embedded Videos/Iframes Share Same Name',
        plain: 'Multiple iframes (embedded videos, widgets, etc.) have the same name attribute. Each iframe must have a unique name so screen readers can distinguish between them.',
        howToFix: 'In LibGuides editor: If you embedded multiple YouTube videos or widgets using HTML: Edit the code and ensure each iframe has a unique name attribute, or remove the name attribute entirely (title attribute is sufficient). Example: change name="video" on each to name="video1", name="video2", etc. Or use LibGuides\' Media/Widget embed feature which handles this automatically.',
        priority:'violation', 
        canFix:true
    },
    'presentation-role-conflict': {
        title: 'Decorative Element Has Conflicting Accessibility Markup',
        plain: 'This element is marked as decorative (role="presentation") but also has ARIA attributes or tabindex, which is contradictory. Screen readers don\'t know whether to ignore it or announce it.',
        howToFix: 'In LibGuides editor: If this element is decorative (like a spacer image or design element), remove any tabindex or ARIA attributes from it. If it\'s actually meaningful content, remove role="presentation". This often happens with email/newsletter embeds or complex widgets.',
        priority: 'warning', 
        canFix: 'partial'
    },
    'label-content-name-mismatch': {
      title: 'Visible Label and Accessible Name Don\'t Match',
      plain:'This element\'s visible text doesn\'t match what screen readers announce (the accessible name). For example, a button shows "Submit" but screen readers hear "Send Form". This confuses voice control users who say "click Submit" but it doesn\'t work.',
      howToFix: 'In LibGuides editor: Make sure any aria-label or aria-labelledby matches the visible text on the element. If a button says "Search", don\'t give it aria-label="Find". Either remove the aria-label to use the visible text, or make them match exactly.',
      priority:'violation', 
      canFix:true
    },
    'link-not-distinguished': {
      title: 'Links Not Visually Distinguished from Regular Text',
      plain: 'These links have no underline and/or use the same color as surrounding text, making them difficult to distinguish as links for sighted users. People with low vision or color blindness cannot reliably tell that these are clickable.',
      howToFix: 'In LibGuides editor: Select the link text and either (1) remove any custom text color to use the default link color (blue and underlined), or (2) ensure the link has a different color AND is underlined. This often happens when copying from Microsoft Word, remove the formatting and then re-create the link.',
      priority: 'violation',
      canFix: true
    },
    'layout-table': {
      title:'Table Used for Page Layout', 
      plain:'This table appears to be used for visual layout (arranging content in columns) rather than displaying actual data. Layout tables can cause navigation problems for screen reader users and are not recommended in modern HTML.',
      howToFix:'In LibGuides editor: Replace the layout table with LibGuides\' built-in column features or boxes. If you must keep the table for layout, add role="presentation" to the table tag in HTML view. Example: &lt;table role="presentation"&gt;. Better solution: rebuild the layout using LibGuides boxes arranged side-by-side instead of tables.',
      priority:'warning', 
      canFix:true
    }
  };

  function calculateAccessibilityScore(violations) {
    let score = 100;
    const violationsByRule = {};

    violations.forEach(v => {
      if (!violationsByRule[v.id]) {
        const explanation = getExplanation(v.id);
        violationsByRule[v.id] = {
            priority: explanation.priority,
            count: 0
        };
      }
      violationsByRule[v.id].count += v.nodes.length;
    });

    Object.values(violationsByRule).forEach(rule => {
      const deductions = {'violations': 10, // WCAG failures - most severe
        'warning': 5, // Usability issues
        'best-practice': 2, // Nice to have
        'system': 0 // not user's fault
        };
      const maxDeductions = {'violations': 30, 'warning': 20, 'best-practice': 10, 'system': 0};
      let deduction = rule.count * (deductions[rule.priority] || 5);
      score -= Math.min(deduction, maxDeductions[rule.priority] || 20);
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

    // Iframes without titles (embedded content)
    const unlabeledIframes = Array.from(container.querySelectorAll('iframe')).filter(iframe => {
        const hasTitle = iframe.hasAttribute('title') && iframe.getAttribute('title').trim().length > 0;
        const hasAriaLabel = iframe.hasAttribute('aria-label') && iframe.getAttribute('aria-label').trim().length > 0;
        const hasAriaLabelledby = iframe.hasAttribute('aria-labelledby');
        return !hasTitle && !hasAriaLabel && !hasAriaLabelledby;
    });
    if(unlabeledIframes.length) violations.push({id: 'frame-title', impact: 'serious', help:'Iframes Missing Title Attributes', description:'Embedded content (iframes) must have descriptive titles.', nodes:unlabeledIframes.map(el => ({target:[getCssSelector(el, true)], html:el.outerHTML.substring(0, 150)}))});

    // Empty containers/sections (LibGuides boxes and general containers)
    const emptyContainers = Array.from(container.querySelectorAll('[id^="s-lg-box"], section, article, aside, div[role="regiion"]')).filter(el => {
        const text = el.textContent.trim();
        const hasMedia = el.querySelector('img, video, audio, iframe, canvas, svg');
        const hasInteractive = el.querySelector('input, button, select, textarea, a, form');
        return text.length === 0 && !hasMedia && !hasInteractive;
    });
    if(emptyContainers.length) violations.push({id: 'empty-container', impact: 'moderate', help: 'Empty Sections or Containers', description: 'Empty sections create navigation issue for screen reader users.', nodes: emptyContainers.map(el => ({target:[getCssSelector(el, true)], html:el.outerHTML.substring(0, 150)}))});

    // Tables without proper headers
    const tablesWithoutHeaders = Array.from(container.querySelectorAll('table')).filter(table => {
      const hasThElements = table.querySelectorAll('th').length > 0;
      const hasCells = table.querySelectorAll('td').length > 0;
      // Flag tables that have data cells but no header cells
      return hasCells && !hasThElements;
    });
    if(tablesWithoutHeaders.length) violations.push({id:'th-has-data-cells', impact:'serious', help:'Tables Missing Header Markup', description:'Tables must have header cells (&lt;th&gt;) to identify column/row headers.', nodes:tablesWithoutHeaders.map(el=>({target:[getCssSelector(el, true)], html:el.outerHTML.substring(0, 150)}))});

    // Tables without semantic structure (missing thead/tbody/caption)
    const tablesWithoutStructure = Array.from(container.querySelectorAll('table')).filter(table => {
      const hasThead = table.querySelector('thead') !== null;
      const hasTbody = table.querySelector('tbody') !== null;
      const hasCaption = table.querySelector('caption') !== null;

      // Flag if missing all semantic elements
      return !hasThead && !hasTbody && !hasCaption;
    });
    if(tablesWithoutStructure.length) violations.push({id: 'table-semantic-markup', impact: 'moderate', help:'Tables Missing Semantic Structure', description:'Tables should use &lt;thead&gt;, &lt;tbody&gt;, and/or &lt;caption&gt; for better screen reader navigation.', nodes: tablesWithoutStructure.map(el => ({target:[getCssSelector(el, true)], html:el.outerHTML.substring(0, 150)}))});

    // Links that open in new window without warning
    const newWindowLinks = Array.from(container.querySelectorAll('a[target="_blank"]')).filter(link => {
      const text = link.textContent.toLowerCase();
      const hasWarning = text.includes('new window') || text.includes('new tab') || text.includes('opens in');
      const hasAriaLabel = link.hasAttribute('aria-label') && link.getAttribute('aria-label').toLowerCase().includes('new window');
      const hasTitle = link.hasAttribute('title') && link.getAttribute('title').toLowerCase('new window');
      const hasIcon = link.querySelector('[class*="external"], [class*=new-window], .fa-external-link');
      return !hasWarning && !hasAriaLabel && !hasTitle && !hasIcon;
    });
    if(newWindowLinks.length) violations.push({id:'link-new-window', impact:'moderate', help:'Links Open in New Window Without Warning', description:'Links that open in new windows should inform users.', nodes:newWindowLinks.map(el=>({target:[getCssSelector(el, true)], html:el.outerHTML.substring(0,150)}))});

    // Duplicate iframe names
    const iframeNames = {};
    Array.from(container.querySelectorAll('iframe[name]')).forEach(iframe => {
      const name = iframe.getAttribute('name');
      if (name) {
        if (!iframeNames[name]) iframeNames[name] = [];
        iframeNames[name].push(iframe);
      }
    });

    const duplicateNameIframes = [];
    Object.entries(iframeNames).forEach(([name, iframes]) => {
      if(iframes.length > 1){
        iframes.forEach(iframe => duplicateNameIframes.push(iframe));
      }
    });
    if(duplicateNameIframes.length) violations.push({id:'iframe-unique-name', impact:'serious', help:'Iframes Have Duplicate Names', description:'Multiple iframes share the same name attribute. Each must be unique.', nodes:duplicateNameIframes.map(el=>({target:[getCssSelector(el, true)], html:el.outerHTML.substring(0,150)}))});

    // Label/name mismatch - visible text doesn't match accessible name
    const labelMismatches = Array.from(container.querySelectorAll('button, a, input[type="submit"], input[type="button"]')).filter(el => {
      const visibleText = el.textContent.trim().toLowerCase();
      const ariaLabel = (el.getAttribute('aria-label') || '').trim().toLowerCase();
      const ariaLabelledby = el.getAttribute('aria-labelledby');

      // check if aria-label exists and doesn't contain the visible text
      if (ariaLabel && visibleText && !ariaLabel.includes(visibleText) && !visibleText.includes(ariaLabel)) {
        return true;
      }

      return false;
    })
    if(labelMismatches.length) violations.push({id: 'label-content-name-mismatch', impact:'serious', help: 'Visible Label Does Not Match Accessible Name', description: 'The visible text and screen reader announcement don\'t match.', nodes: labelMismatches.map(el => ({target: [getCssSelector(el, true)], html: el.outerHTML.substring(0, 150)}))});

    // Links not visually distinguished (no underline, same color as text)
    const invisibleLinks = Array.from(container.querySelectorAll('a[href]')).filter(link => {
      const computedStyle = window.getComputedStyle(link);
      const parentStyle = link.parentElement ? window.getComputedStyle(link.parentElement) : null;
      
      const hasUnderline = computedStyle.textDecoration.includes('underline') || 
                          computedStyle.textDecorationLine === 'underline' ||
                          computedStyle.borderBottom !== 'none';
      
      const linkColor = computedStyle.color;
      const parentColor = parentStyle ? parentStyle.color : null;
      
      // Flag if no underline AND same color as parent text
      const sameColorAsParent = linkColor === parentColor;
      
      return !hasUnderline && sameColorAsParent;
    });
    if(invisibleLinks.length) violations.push({id:'link-not-distinguished', impact:'serious', help:'Links Not Visually Distinguished', description:'Links must be underlined or have a different color from surrounding text.', nodes:invisibleLinks.map(el=>({target:[getCssSelector(el, true)], html:el.outerHTML.substring(0,150)}))});

    // Layout tables (tables used for visual layout instead of data)
    const layoutTables = Array.from(container.querySelectorAll('table:not([role="presentation"])')).filter(table => {
        const hasThElements = table.querySelectorAll('th').length > 0;
        const hasCells = table.querySelectorAll('td').length > 0;
        
        // Heuristics for layout tables:
        // 1. Has cells but no <th> headers (data tables should have headers)
        // 2. Contains mostly non-text content (images, nested divs)
        // 3. Has very few rows (1-2 rows often = layout, not data)
        
        const rowCount = table.querySelectorAll('tr').length;
        const cellsWithImages = table.querySelectorAll('td img, td div').length;
        const totalCells = table.querySelectorAll('td').length;
        
        const likelyLayout = !hasThElements && hasCells && (
            rowCount <= 2 || // Very few rows
            (cellsWithImages / totalCells) > 0.5 // More than half cells have images/divs
        );
        
        return likelyLayout;
    });
    if(layoutTables.length) violations.push({id:'layout-table', impact:'moderate', help:'Table Used for Layout Instead of Data', description:'Tables should only be used for tabular data, not visual layout. Layout tables cause navigation issues.', nodes:layoutTables.map(el=>({target:[getCssSelector(el, true)], html:el.outerHTML.substring(0,150)}))});

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
          axeResults.violations = axeResults.violations.filter(v => v.id !== 'empty-heading' && v.id !== 'image-alt' && v.id !== 'frame-title');
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
          <div style="display:flex;align-items:center;gap:8px;flex:1;">
            <h2 style="margin:0;font-size:18px;color:#ffffff;font-family:'Lexend',sans-serif;">🔍 LibGuides A11y Insights</h2>
            <a href="https://padhma.github.io/libguides-a11y-insights/" target="_blank" rel="noopener" title="View documentation and learn more about this tool" style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;border:2px solid #ffcb05;color:#ffcb05;text-decoration:none;font-size:12px;font-weight:bold;font-family:serif;transition:all 0.2s;" onmouseover="this.style.background='#ffcb05';this.style.color='#00274c';" onmouseout="this.style.background='transparent';this.style.color='#ffcb05';">i</a>
          </div>
          <button id="scan-mode-toggle" style="background:#ffcb05;border-radius:6px;padding:8px 12px;color:#00274C;font-weight:600;font-size:12px;cursor:pointer;transition:all 0.2s;font-family:'Lexend',sans-serif;" title="Scan all pages in this guide">Show All Pages</button>
          <button id="a11y-close-btn" style="background:none;border:2px solid #ffcb05;border-radius:50%;width:40px;height:40px;line-height:1;color:#ffcb05;font-weight:bold;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s ease;" title="Close scanner" aria-label="Close">✕</button>
        </div>
      </div>
      <main id="a11y-results" style="flex:1;overflow-y:auto;padding:20px;color:#333;text-align:center;font-family:'Lexend',sans-serif;">Initializing scanner...<br><br>⏳</main>
    `;
    document.body.appendChild(sidebar);

    // Auto-close after 15 minutes of inactivity
    let inactivityTimer;
    const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes in millseconds

    function resetInactivityTimer() {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        // Show a gentle notification before closing
        const header = document.getElementById('a11y-header');
        if (header) {
          header.style.opacity = '0.6';
          const notice = document.createElement('div');
          notice.style.cssText = 'background:#ffcb05;color:#00274c;padding:10px;text-align:center;font-size:13px;font-family:Lexend,sans-serif;';
          notice.textContent = 'Scanner closed due to inactivity. Refresh the page to scan again.';
          header.insertAdjacentElement('afterend', notice);
        }
        setTimeout(() => {
          sidebar.style.animation = 'slideOut 0.3s ease-in';
          sidebar.addEventListener('animationend', () => sidebar.remove());
        }, 2000);
      }, INACTIVITY_TIMEOUT);
    }

    // Reset timer on any interaction with the sidebar
    sidebar.addEventListener('click', resetInactivityTimer);
    sidebar.addEventListener('scroll', resetInactivityTimer);
    sidebar.addEventListener('keydown', resetInactivityTimer);

    // Start the timer
    resetInactivityTimer();
    
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
            && v.id !== 'frame-title'
            && v.id !== 'th-has-data-cells'
            && v.id !== 'label-content-name-mismatch'
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

    // Feedback form link
    html += `<div style="text-align:center;padding:20px;margin-top:20px;border-top:1px solid #e5e7eb;">
      <a href="https://forms.gle/R4tf8NLJ9kbNpEDc8" target="_blank" rel="noopener" style="color:#00274c;text-decoration:underline;font-size:14px;font-family:'Lexend',sans-serif;">
        Let us know what you think about the tool! 📝
      </a>
      </div>`;

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
        const priorityColors = {'violation': "#c23c3c", 'warning': "#d66a12", 'best-practice': "#1493a0"};
        const priorityBackgrounds = {'violation': "rgba(194, 60, 60, 0.04)", 'warning': "rgba(214, 106, 18, 0.04)", 'best-practice': "rgba(20, 147, 160, 0.04)"};

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
    } 
    else {
      initScanner();
    }
  })();
