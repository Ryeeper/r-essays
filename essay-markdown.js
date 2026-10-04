/* Shared safe Markdown renderer for the local app and GitHub Pages copy. */
(function (global) {
  'use strict';

  function render(markdown) {
    if (!global.marked || !global.DOMPurify) {
      throw new Error('Markdown rendering libraries are unavailable.');
    }

    const html = global.marked.parse(String(markdown ?? ''), {
      gfm: true,
      breaks: false,
    });
    const fragment = global.DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
      RETURN_DOM_FRAGMENT: true,
    });
    const output = global.document.createElement('div');

    fragment.querySelectorAll('a[href]').forEach(link => {
      let destination;
      try {
        destination = new URL(link.getAttribute('href'), global.document.baseURI);
      } catch {
        link.removeAttribute('href');
        return;
      }

      const externalHttp = (destination.protocol === 'https:' || destination.protocol === 'http:') &&
        destination.origin !== global.location.origin;
      if (externalHttp) {
        link.setAttribute('target', '_blank');
      }
      if (externalHttp || link.getAttribute('target') === '_blank') {
        link.setAttribute('rel', 'noopener noreferrer');
      }
    });

    fragment.querySelectorAll('table').forEach(table => {
      const parent = table.parentNode;
      if (!parent || parent.classList?.contains('markdown-table-wrap')) return;
      const wrapper = global.document.createElement('div');
      wrapper.className = 'markdown-table-wrap';
      parent.replaceChild(wrapper, table);
      wrapper.appendChild(table);
    });

    output.appendChild(fragment);
    return output.innerHTML;
  }

  global.EssayMarkdown = Object.freeze({ render });
})(window);
