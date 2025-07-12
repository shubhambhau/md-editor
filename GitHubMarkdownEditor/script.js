class MarkdownEditor {
    constructor() {
        this.editor = document.getElementById('editor');
        this.preview = document.getElementById('preview');
        this.footnoteCounter = 1;
        this.isDarkMode = false;
        
        this.setupEventListeners();
        this.initializeEmojis();
        this.initializeDragAndDrop();
        this.updatePreview();
        this.updateCounters();
    }

    initializeEmojis() {
        // Reference: https://github.com/ikatyang/emoji-cheat-sheet/blob/master/README.md
        // Curated selection of developer-relevant emojis (3-4 per section)
        const emojis = [
            // Smileys & Emotion - Developer favorites
            {emoji: '😄', code: ':smile:'},
            {emoji: '😂', code: ':joy:'},
            {emoji: '🤔', code: ':thinking:'},
            {emoji: '😎', code: ':sunglasses:'},
            
            // People & Body - Common reactions
            {emoji: '👍', code: ':+1:'},
            {emoji: '👎', code: ':-1:'},
            {emoji: '👏', code: ':clap:'},
            {emoji: '🙏', code: ':pray:'},
            
            // Animals & Nature - Popular picks
            {emoji: '🐛', code: ':bug:'},
            {emoji: '🐱', code: ':cat:'},
            {emoji: '🐶', code: ':dog:'},
            {emoji: '🦄', code: ':unicorn:'},
            
            // Objects - Tech & Development
            {emoji: '💻', code: ':computer:'},
            {emoji: '⚡', code: ':zap:'},
            {emoji: '🔥', code: ':fire:'},
            {emoji: '💯', code: ':100:'},
            
            // Activities - Achievement & Celebration
            {emoji: '🎉', code: ':tada:'},
            {emoji: '🏆', code: ':trophy:'},
            {emoji: '🎯', code: ':dart:'},
            {emoji: '🚀', code: ':rocket:'},
            
            // Symbols - Development essentials
            {emoji: '✅', code: ':white_check_mark:'},
            {emoji: '❌', code: ':x:'},
            {emoji: '⚠️', code: ':warning:'},
            {emoji: '✨', code: ':sparkles:'},
            
            // Common GitHub reactions
            {emoji: '❤️', code: ':heart:'},
            {emoji: '🎊', code: ':confetti_ball:'},
            {emoji: '💡', code: ':bulb:'},
            {emoji: '🔧', code: ':wrench:'}
        ];
        
        const emojiGrid = document.getElementById('emojiGrid');
        if (!emojiGrid) {
            console.error('Emoji grid not found');
            return;
        }
        
        // Clear existing emojis
        emojiGrid.innerHTML = '';
        
        emojis.forEach(({emoji, code}) => {
            const emojiItem = document.createElement('div');
            emojiItem.className = 'emoji-item';
            emojiItem.textContent = emoji;
            emojiItem.title = code; // Show shortcode on hover
            emojiItem.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent event bubbling
                // Check if user prefers shortcode or emoji
                const useShortcode = document.getElementById('useShortcode')?.checked || false;
                this.insertAtCursor(useShortcode ? code : emoji);
                this.hideEmojiPicker();
            });
            emojiGrid.appendChild(emojiItem);
        });
        
        // Prevent emoji picker from closing when clicking inside it
        const emojiPicker = document.getElementById('emojiPicker');
        if (emojiPicker) {
            emojiPicker.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
    }

    initializeDragAndDrop() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileUpload(files[0]);
            }
        });
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileUpload(e.target.files[0]);
            }
        });
    }

    handleFileUpload(file) {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const progressArea = document.getElementById('uploadProgress');
        
        progressText.textContent = `Uploading: ${file.name} (${this.formatFileSize(file.size)})`;
        progressArea.style.display = 'block';
        
        // Simulate upload progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 30;
            if (progress > 100) progress = 100;
            
            progressFill.style.width = progress + '%';
            
            if (progress >= 100) {
                clearInterval(interval);
                
                if (file.type.startsWith('image/')) {
                    // For images, create a data URL
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const imageMarkdown = `![${file.name}](${e.target.result})`;
                        this.insertAtCursor(imageMarkdown);
                        this.hideModal('uploadModal');
                    };
                    reader.readAsDataURL(file);
                } else {
                    // For other files, just insert a link
                    const linkMarkdown = `[${file.name}](./uploads/${file.name})`;
                    this.insertAtCursor(linkMarkdown);
                    this.hideModal('uploadModal');
                }
                
                // Reset progress bar
                setTimeout(() => {
                    progressFill.style.width = '0%';
                    progressText.textContent = 'Uploading...';
                    progressArea.style.display = 'none';
                }, 1000);
            }
        }, 100);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    setupEventListeners() {
        this.editor.addEventListener('input', () => {
            this.updatePreview();
            this.updateCounters();
        });
        
        this.editor.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
        
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });
        
        // Toolbar buttons
        document.getElementById('boldBtn').addEventListener('click', () => this.insertBold());
        document.getElementById('italicBtn').addEventListener('click', () => this.insertItalic());
        document.getElementById('strikethroughBtn').addEventListener('click', () => this.insertStrikethrough());
        document.getElementById('underlineBtn').addEventListener('click', () => this.wrapText('<ins>', '</ins>'));
        document.getElementById('codeBtn').addEventListener('click', () => this.insertCode());
        document.getElementById('codeBlockBtn').addEventListener('click', () => this.insertCodeBlock());
        document.getElementById('quoteBtn').addEventListener('click', () => this.insertQuote());
        document.getElementById('linkBtn').addEventListener('click', () => this.insertLink());
        document.getElementById('imageBtn').addEventListener('click', () => this.insertImage());
        document.getElementById('uploadBtn').addEventListener('click', () => this.showModal('uploadModal'));
        document.getElementById('unorderedListBtn').addEventListener('click', () => this.insertList('- '));
        document.getElementById('orderedListBtn').addEventListener('click', () => this.insertList('1. '));
        document.getElementById('taskListBtn').addEventListener('click', () => this.insertList('- [ ] '));
        document.getElementById('tableBtn').addEventListener('click', () => this.insertTable());
        document.getElementById('emojiBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.showEmojiPicker();
        });
        document.getElementById('githubStatsBtn').addEventListener('click', () => this.insertGitHubStats());
        document.getElementById('typingSvgBtn').addEventListener('click', () => this.insertTypingSvg());
        document.getElementById('footnoteBtn').addEventListener('click', () => this.insertFootnote());
        document.getElementById('helpBtn').addEventListener('click', () => this.showModal('helpModal'));
        
        // Dropdowns
        document.getElementById('alertSelect').addEventListener('change', (e) => this.insertAlert(e.target.value));
        document.getElementById('headingSelect').addEventListener('change', (e) => this.insertHeading(e.target.value));
        
        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                modal.classList.remove('active');
            });
        });
        
        // Close modal on backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
        
        // Upload area
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.addEventListener('click', () => document.getElementById('fileInput').click());
        
        // Typing SVG generate button
        document.getElementById('generateTypingSvg').addEventListener('click', () => this.generateTypingSvg());
        
        // Add title button
        document.getElementById('addTitleBtn').addEventListener('click', () => this.addTitleInput());
        
        // Color picker sync
        document.getElementById('colorPicker').addEventListener('input', (e) => this.syncColorPicker(e));
        document.getElementById('svgColor').addEventListener('input', (e) => this.syncColorText(e));
    }

    handleKeyboardShortcuts(e) {
        const ctrl = e.ctrlKey || e.metaKey;
        const shift = e.shiftKey;
        
        if (ctrl && !shift) {
            switch (e.key) {
                case 'b':
                    e.preventDefault();
                    this.insertBold();
                    break;
                case 'i':
                    e.preventDefault();
                    this.insertItalic();
                    break;
                case 'k':
                    e.preventDefault();
                    this.insertLink();
                    break;
                case 'e':
                    e.preventDefault();
                    this.insertCode();
                    break;
            }
        } else if (ctrl && shift) {
            switch (e.key) {
                case '.':
                    e.preventDefault();
                    this.insertQuote();
                    break;
                case '7':
                    e.preventDefault();
                    this.insertList('1. ');
                    break;
                case '8':
                    e.preventDefault();
                    this.insertList('- ');
                    break;
            }
        }
        
        // Tab handling
        if (e.key === 'Tab') {
            e.preventDefault();
            this.insertAtCursor('    ');
        }
    }

    updatePreview() {
        const markdown = this.editor.value;
        const processedMarkdown = this.processMarkdown(markdown);
        
        if (typeof marked !== 'undefined') {
            this.preview.innerHTML = marked.parse(processedMarkdown);
        } else {
            // Fallback if marked.js is not available
            this.preview.innerHTML = this.parseMarkdown(processedMarkdown);
        }
        
        // Add syntax highlighting to code blocks
        this.preview.querySelectorAll('pre code').forEach((block) => {
            if (typeof hljs !== 'undefined') {
                hljs.highlightElement(block);
            }
        });
        
        // Process additional GitHub features
        this.processColorCodes();
        this.processTaskLists();
        this.processAlerts();
        this.processFootnotes();
    }
    
    processMarkdown(content) {
        // Don't process alerts here - let marked.js handle the blockquotes first
        // then we'll process them in processAlerts()
        
        // Process color codes
        content = content.replace(/`(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}|rgb\([^)]+\)|hsl\([^)]+\))`/g, (match, color) => {
            return `<span class="color-preview" style="background-color: ${color}"></span><code>${color}</code>`;
        });
        
        // Process mentions
        content = content.replace(/@([a-zA-Z0-9_-]+)/g, '<strong>@$1</strong>');
        
        // Process issue references
        content = content.replace(/#(\d+)/g, '<a href="#issue-$1">#$1</a>');
        
        return content;
    }
    
    processColorCodes() {
        this.preview.querySelectorAll('code').forEach(code => {
            const text = code.textContent;
            const colorMatch = text.match(/^(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}|rgb\([^)]+\)|hsl\([^)]+\))$/);
            if (colorMatch) {
                const color = colorMatch[1];
                const preview = document.createElement('span');
                preview.className = 'color-preview';
                preview.style.backgroundColor = color;
                code.parentNode.insertBefore(preview, code);
            }
        });
    }

    processTaskLists() {
        this.preview.querySelectorAll('li').forEach(li => {
            const text = li.innerHTML;
            if (text.includes('[ ]') || text.includes('[x]')) {
                li.classList.add('task-list-item');
                li.innerHTML = text.replace(/\[([ x])\]/g, '<input type="checkbox" $1disabled>');
            }
        });
    }

    processAlerts() {
        this.preview.querySelectorAll('blockquote').forEach(blockquote => {
            const text = blockquote.textContent.trim();
            const alertMatch = text.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/);
            
            if (alertMatch) {
                const type = alertMatch[1].toLowerCase();
                const alertIcon = this.getAlertIcon(type);
                const alertTitle = alertMatch[1];
                
                // Get the content after the alert marker
                let alertContent = blockquote.innerHTML;
                // Remove the alert marker from the content more robustly
                alertContent = alertContent.replace(/\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(<br\s*\/?>)?/g, '');
                // Clean up paragraph tags
                alertContent = alertContent.replace(/^<p>/, '').replace(/<\/p>$/, '');
                // Remove any empty paragraphs
                alertContent = alertContent.replace(/<p><\/p>/g, '');
                
                // Replace the blockquote with a proper alert div
                const alertDiv = document.createElement('div');
                alertDiv.className = `alert alert-${type}`;
                alertDiv.innerHTML = `
                    <div class="alert-header">
                        <span class="alert-icon">${alertIcon}</span>
                        <strong class="alert-title">${alertTitle}</strong>
                    </div>
                    <div class="alert-content">${alertContent}</div>
                `;
                
                blockquote.parentNode.replaceChild(alertDiv, blockquote);
            }
        });
    }

    getAlertIcon(type) {
        const icons = {
            'note': '📝',
            'tip': '💡',
            'important': '❗',
            'warning': '⚠️',
            'caution': '🚨'
        };
        return icons[type] || '📝';
    }

    processFootnotes() {
        const footnotes = {};
        const footnoteRefs = [];
        
        // Find footnote definitions
        this.preview.innerHTML = this.preview.innerHTML.replace(/\[\^([^\]]+)\]:\s*(.+)/g, (match, id, text) => {
            footnotes[id] = text;
            return '';
        });
        
        // Find footnote references
        this.preview.innerHTML = this.preview.innerHTML.replace(/\[\^([^\]]+)\]/g, (match, id) => {
            if (footnotes[id]) {
                footnoteRefs.push({id, text: footnotes[id]});
                return `<sup><a href="#footnote-${id}">${footnoteRefs.length}</a></sup>`;
            }
            return match;
        });
        
        // Add footnotes section
        if (footnoteRefs.length > 0) {
            let footnotesHtml = '<div class="footnote"><hr>';
            footnoteRefs.forEach((fn, index) => {
                footnotesHtml += `<p id="footnote-${fn.id}">${index + 1}. ${fn.text}</p>`;
            });
            footnotesHtml += '</div>';
            this.preview.innerHTML += footnotesHtml;
        }
    }

    parseMarkdown(markdown) {
        // Simple fallback markdown parser if marked.js is not available
        let html = markdown;
        
        // Headers
        html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
        
        // Bold and italic
        html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Strikethrough
        html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');
        
        // Code blocks
        html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
            const language = lang || 'plaintext';
            return `<pre><code class="language-${language}">${this.escapeHtml(code.trim())}</code></pre>`;
        });
        
        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
        
        // Images
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
        
        // Blockquotes (including alerts)
        html = html.replace(/^> (.*)$/gm, '<blockquote>$1</blockquote>');
        
        // Lists
        html = html.replace(/^\s*- (.*)$/gm, '<li>$1</li>');
        html = html.replace(/^\s*\d+\. (.*)$/gm, '<li>$1</li>');
        
        // Line breaks
        html = html.replace(/\n/g, '<br>');
        
        return html;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    highlightSyntax(block) {
        // Simple syntax highlighting for common languages
        const code = block.textContent;
        const language = block.className.match(/language-(\w+)/)?.[1];
        
        if (language === 'javascript' || language === 'js') {
            block.innerHTML = code
                .replace(/\b(function|var|let|const|if|else|for|while|return|class|import|export)\b/g, '<span class="keyword">$1</span>')
                .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '<span class="comment">$&</span>')
                .replace(/"([^"\\]|\\.)*"/g, '<span class="string">$&</span>')
                .replace(/'([^'\\]|\\.)*'/g, '<span class="string">$&</span>');
        } else if (language === 'css') {
            block.innerHTML = code
                .replace(/([.#]?[\w-]+)\s*{/g, '<span class="selector">$1</span>{')
                .replace(/([\w-]+):/g, '<span class="property">$1</span>:')
                .replace(/\/\*[\s\S]*?\*\//g, '<span class="comment">$&</span>');
        } else if (language === 'html') {
            block.innerHTML = code
                .replace(/&lt;(\/?[\w]+)([^&]*?)&gt;/g, '<span class="tag">&lt;$1$2&gt;</span>')
                .replace(/&lt;!--[\s\S]*?--&gt;/g, '<span class="comment">$&</span>');
        }
    }

    updateCounters() {
        const text = this.editor.value;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const characters = text.length;
        const lines = text.split('\n').length;
        
        document.getElementById('wordCount').textContent = words;
        document.getElementById('charCount').textContent = characters;
        document.getElementById('lineCount').textContent = lines;
    }

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        document.documentElement.setAttribute('data-theme', this.isDarkMode ? 'dark' : 'light');
        
        const themeToggle = document.getElementById('themeToggle');
        const icon = themeToggle.querySelector('.icon');
        icon.textContent = this.isDarkMode ? '☀️' : '🌙';
    }

    insertAtCursor(text) {
        const start = this.editor.selectionStart;
        const end = this.editor.selectionEnd;
        const value = this.editor.value;
        
        this.editor.value = value.substring(0, start) + text + value.substring(end);
        this.editor.focus();
        this.editor.setSelectionRange(start + text.length, start + text.length);
        
        this.updatePreview();
        this.updateCounters();
    }

    insertBold() {
        const selection = this.getSelection();
        const boldText = `**${selection || 'bold text'}**`;
        this.insertAtCursor(boldText);
        
        if (!selection) {
            const cursorPos = this.editor.selectionStart - 3;
            this.editor.setSelectionRange(cursorPos - 9, cursorPos);
        }
    }

    insertItalic() {
        const selection = this.getSelection();
        const italicText = `*${selection || 'italic text'}*`;
        this.insertAtCursor(italicText);
        
        if (!selection) {
            const cursorPos = this.editor.selectionStart - 1;
            this.editor.setSelectionRange(cursorPos - 11, cursorPos);
        }
    }

    insertStrikethrough() {
        const selection = this.getSelection();
        const strikeText = `~~${selection || 'strikethrough text'}~~`;
        this.insertAtCursor(strikeText);
        
        if (!selection) {
            const cursorPos = this.editor.selectionStart - 2;
            this.editor.setSelectionRange(cursorPos - 16, cursorPos);
        }
    }

    insertCode() {
        const selection = this.getSelection();
        const codeText = `\`${selection || 'code'}\``;
        this.insertAtCursor(codeText);
        
        if (!selection) {
            const cursorPos = this.editor.selectionStart - 1;
            this.editor.setSelectionRange(cursorPos - 4, cursorPos);
        }
    }

    insertCodeBlock() {
        const language = prompt('Enter language (optional):') || '';
        const codeBlock = `\`\`\`${language}\n${this.getSelection() || 'your code here'}\n\`\`\``;
        
        this.insertAtCursor(codeBlock);
        
        // Position cursor inside the code block
        const cursorPos = this.editor.selectionStart - 4;
        this.editor.setSelectionRange(cursorPos, cursorPos);
    }

    insertQuote() {
        const start = this.editor.selectionStart;
        const lineStart = this.editor.value.lastIndexOf('\n', start - 1) + 1;
        const lineEnd = this.editor.value.indexOf('\n', start);
        const actualLineEnd = lineEnd === -1 ? this.editor.value.length : lineEnd;
        
        const line = this.editor.value.substring(lineStart, actualLineEnd);
        const quotedLine = line.startsWith('> ') ? line.substring(2) : '> ' + line;
        
        this.editor.value = this.editor.value.substring(0, lineStart) + quotedLine + this.editor.value.substring(actualLineEnd);
        this.editor.focus();
        
        this.updatePreview();
    }

    insertLink() {
        const url = prompt('Enter URL:');
        const text = prompt('Enter link text:') || url;
        
        if (url) {
            this.insertAtCursor(`[${text}](${url})`);
        }
    }

    insertImage() {
        const url = prompt('Enter image URL:');
        const alt = prompt('Enter alt text:') || 'Image';
        
        if (url) {
            this.insertAtCursor(`![${alt}](${url})`);
        }
    }

    insertList(prefix) {
        const start = this.editor.selectionStart;
        const lineStart = this.editor.value.lastIndexOf('\n', start - 1) + 1;
        
        this.editor.value = this.editor.value.substring(0, lineStart) + prefix + this.editor.value.substring(lineStart);
        this.editor.focus();
        this.editor.setSelectionRange(lineStart + prefix.length, lineStart + prefix.length);
        
        this.updatePreview();
    }

    insertTable() {
        const table = `| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |`;
        
        this.insertAtCursor(table);
    }

    insertFootnote() {
        const id = `footnote${this.footnoteCounter}`;
        const reference = `[^${id}]`;
        const definition = `\n\n[^${id}]: Your footnote text here`;
        
        this.insertAtCursor(reference);
        this.insertAtCursor(definition);
        
        this.footnoteCounter++;
    }

    insertGitHubStats() {
        // Prompt user for GitHub username
        const username = prompt('Enter your GitHub username:');
        
        if (!username || username.trim() === '') {
            return; // User cancelled or entered empty username
        }
        
        const cleanUsername = username.trim();
        
        // GitHub stats markdown template
        const githubStatsMarkdown = `<p align="center">
  <img src="https://github-readme-stats.vercel.app/api?username=${cleanUsername}&show_icons=true&theme=react&hide_border=true" alt="GitHub Stats" />
  <br/>
  <img src="https://github-readme-streak-stats.herokuapp.com?user=${cleanUsername}&theme=react&hide_border=true" alt="GitHub Streak" />
  <br/>
  <img src="https://github-readme-stats.vercel.app/api/top-langs/?username=${cleanUsername}&layout=compact&theme=react&hide_border=true" alt="Top Languages" />
</p>

`;
        
        this.insertAtCursor(githubStatsMarkdown);
    }

    insertTypingSvg() {
        // Show the Typing SVG modal
        this.showModal('typingSvgModal');
        // Initialize with one title input if none exist
        this.initializeTitleInputs();
    }

    initializeTitleInputs() {
        const container = document.getElementById('titlesContainer');
        if (container.children.length === 0) {
            this.addTitleInput();
        }
    }

    addTitleInput() {
        const container = document.getElementById('titlesContainer');
        const titleGroup = document.createElement('div');
        titleGroup.className = 'title-input-group';
        
        titleGroup.innerHTML = `
            <input type="text" class="form-input title-input">
            <button type="button" class="btn btn-small btn-danger remove-title-btn" title="Remove Title">
                <span class="icon">-</span>
            </button>
        `;
        
        // Add event listener to remove button
        const removeBtn = titleGroup.querySelector('.remove-title-btn');
        removeBtn.addEventListener('click', () => this.removeTitleInput(titleGroup));
        
        container.appendChild(titleGroup);
        
        // Focus on the new input
        const newInput = titleGroup.querySelector('.title-input');
        newInput.focus();
    }

    removeTitleInput(titleGroup) {
        const container = document.getElementById('titlesContainer');
        // Keep at least one title input
        if (container.children.length > 1) {
            titleGroup.remove();
        } else {
            alert('At least one title is required');
        }
    }

    syncColorPicker(e) {
        const colorValue = e.target.value;
        const hexValue = colorValue.replace('#', '');
        document.getElementById('svgColor').value = hexValue;
    }

    syncColorText(e) {
        let colorValue = e.target.value.trim();
        // Remove # if user adds it
        colorValue = colorValue.replace('#', '');
        
        // Validate hex color (3 or 6 characters)
        if (/^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(colorValue)) {
            // Expand 3-char hex to 6-char
            if (colorValue.length === 3) {
                colorValue = colorValue.split('').map(char => char + char).join('');
            }
            document.getElementById('colorPicker').value = '#' + colorValue;
        }
    }

    generateTypingSvg() {
        // Get values from form inputs
        const color = document.getElementById('svgColor').value.trim() || 'F75C7E';
        const font = document.getElementById('svgFont').value;
        const size = document.getElementById('svgSize').value || '22';
        
        // Get all title inputs
        const titleInputs = document.querySelectorAll('.title-input');
        const titles = Array.from(titleInputs)
            .map(input => input.value.trim())
            .filter(title => title !== ''); // Remove empty titles
        
        // Validate required fields
        if (titles.length === 0) {
            alert('Please add at least one title/role');
            return;
        }
        
        // Build the lines for the typing animation (just the titles)
        const lines = [...titles];
        
        
        
        // URL encode the lines
        const encodedLines = encodeURIComponent(lines.join(';'));
        
        // Clean color value (remove # if present)
        const cleanColor = color.replace('#', '');
        
        // Generate typing SVG markdown
        const typingSvgMarkdown = `<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=${font}&size=${size}&duration=3000&pause=1000&color=${cleanColor}&center=true&vCenter=true&width=435&lines=${encodedLines}" alt="Typing SVG" />
</p>

`;
        
        // Insert the markdown
        this.insertAtCursor(typingSvgMarkdown);
        
        // Close the modal
        document.getElementById('typingSvgModal').classList.remove('active');
        
        // Clear the form
        this.clearTypingSvgForm();
    }

    clearTypingSvgForm() {
        document.getElementById('svgColor').value = 'F75C7E';
        document.getElementById('colorPicker').value = '#F75C7E';
        document.getElementById('svgFont').value = 'Fira+Code';
        document.getElementById('svgSize').value = '22';
        
        // Clear all title inputs and reset to one empty input
        const container = document.getElementById('titlesContainer');
        container.innerHTML = '';
        this.addTitleInput();
    }

    insertAlert(type) {
        if (!type) return;
        
        const alertText = `> [!${type.toUpperCase()}]\n> Your alert message here`;
        this.insertAtCursor(alertText);
        
        // Reset select
        document.getElementById('alertSelect').value = '';
    }

    insertHeading(level) {
        if (!level) return;
        
        const hashes = '#'.repeat(parseInt(level));
        const heading = `${hashes} Your heading here`;
        
        const start = this.editor.selectionStart;
        const lineStart = this.editor.value.lastIndexOf('\n', start - 1) + 1;
        
        this.editor.value = this.editor.value.substring(0, lineStart) + heading + this.editor.value.substring(lineStart);
        this.editor.focus();
        
        // Reset select
        document.getElementById('headingSelect').value = '';
        
        this.updatePreview();
    }

    showModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    }

    hideModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }

    showEmojiPicker() {
        const picker = document.getElementById('emojiPicker');
        const emojiBtn = document.getElementById('emojiBtn');
        
        if (!picker || !emojiBtn) {
            console.error('Emoji picker or button not found');
            return;
        }
        
        // Toggle picker visibility
        if (picker.classList.contains('active')) {
            this.hideEmojiPicker();
            return;
        }
        
        const rect = emojiBtn.getBoundingClientRect();
        
        picker.style.top = `${rect.bottom + window.scrollY + 5}px`;
        picker.style.left = `${rect.left + window.scrollX}px`;
        picker.classList.add('active');
        
        // Close on outside click
        this.handleOutsideClick = (e) => {
            if (!picker.contains(e.target) && !emojiBtn.contains(e.target)) {
                this.hideEmojiPicker();
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', this.handleOutsideClick);
        }, 100);
    }

    hideEmojiPicker() {
        const picker = document.getElementById('emojiPicker');
        if (picker) {
            picker.classList.remove('active');
            // Remove any existing outside click listeners
            document.removeEventListener('click', this.handleOutsideClick);
        }
    }

    wrapText(before, after) {
        const start = this.editor.selectionStart;
        const end = this.editor.selectionEnd;
        const selectedText = this.editor.value.substring(start, end);
        const replacement = before + selectedText + after;
        
        this.editor.value = this.editor.value.substring(0, start) + replacement + this.editor.value.substring(end);
        this.editor.focus();
        this.editor.setSelectionRange(start + before.length, start + before.length + selectedText.length);
        
        this.updatePreview();
        this.updateCounters();
    }

    getSelection() {
        const start = this.editor.selectionStart;
        const end = this.editor.selectionEnd;
        return this.editor.value.substring(start, end);
    }

    exportAsMarkdown() {
        const content = this.editor.value;
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'document.md';
        a.click();
        URL.revokeObjectURL(url);
    }

    exportAsHTML() {
        const content = this.preview.innerHTML;
        const blob = new Blob([content], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'document.html';
        a.click();
        URL.revokeObjectURL(url);
    }

    importFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.md,.txt';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.editor.value = e.target.result;
                    this.updatePreview();
                    this.updateCounters();
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    clearEditor() {
        if (confirm('Are you sure you want to clear the editor?')) {
            this.editor.value = '';
            this.updatePreview();
            this.updateCounters();
            this.editor.focus();
        }
    }
}

// Initialize the editor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new MarkdownEditor();
});
