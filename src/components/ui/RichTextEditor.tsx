import { useRef, useEffect } from 'react';
import { 
    TextB, 
    TextItalic, 
    TextUnderline, 
    ListBullets, 
    ListNumbers, 
    TextAlignLeft, 
    TextAlignCenter, 
    TextAlignRight,
    TextAlignJustify,
    TextHOne,
    TextHTwo,
    TextHThree,
    TextT
} from '@phosphor-icons/react';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    readOnly?: boolean;
    placeholder?: string;
}

export default function RichTextEditor({ value, onChange, readOnly = false, placeholder }: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);

    // Robust Markdown to HTML converter for legacy data and migration
    const convertMarkdownToHtml = (text: string) => {
        if (!text) return '';
        
        let html = text
            // bab header detection (e.g. BAB II - ...) - handle cases where it might be wrapped in <p>
            .replace(/(?:^|\n|>)(BAB\s+[IVXLCDM]+.*?)(?:$|\n|<)/gim, (_, p1) => {
                return `<h2 class="text-brand-700 border-b border-brand-100 pb-2 mb-8 uppercase tracking-widest text-center font-black mt-12">${p1}</h2>`;
            })
            
            // pasal detection (e.g. Pasal 1) - handle cases where it might be wrapped or mid-text
            .replace(/(?:^|\n|>|\s)(Pasal\s+\d+.*?)(?:$|\n|<)/gim, (_, p1) => {
                return `<h3 class="font-black text-slate-900 mt-10 mb-4 text-center border-t border-slate-100 pt-8">${p1}</h3>`;
            })

            // Headings
            .replace(/^#{1}\s+(.*?)$/gim, '<h1>$1</h1>')
            .replace(/^#{2}\s+(.*?)$/gim, '<h2>$1</h2>')
            .replace(/^#{3}\s+(.*?)$/gim, '<h3>$1</h3>')
            
            // Bold (improved to be more resilient with non-greedy and word boundaries)
            .replace(/\*\*((?!\*\*).*?)\*\*/gim, '<strong>$1</strong>')
            .replace(/__((?!__).*?)__/gim, '<strong>$1</strong>')
            
            // Italic
            .replace(/\*((?!\*).*?)\*/gim, '<em>$1</em>')
            .replace(/_((?!_).*?)_/gim, '<em>$1</em>')
            
            // Underline (not standard markdown but often used in our legacy)
            .replace(/<u>(.*?)<\/u>/gim, '<u>$1</u>')
            
            // Lists - detect and group
            .replace(/^\s*[-*]\s+(.*)/gim, '<li>$1</li>')
            .replace(/^\s*\d+\.\s+(.*)/gim, '<li data-list="ordered">$1</li>');

        // Wrap list items in appropriate tags
        html = html.replace(/(<li>(?:.|\n)*?<\/li>)/g, (match) => {
            if (match.includes('data-list="ordered"')) {
                return `<ol>${match.replace(/ data-list="ordered"/g, '')}</ol>`;
            }
            return `<ul>${match}</ul>`;
        });
        
        // Clean up adjacent same-type lists
        html = html.replace(/<\/ul>\s*<ul>/g, '').replace(/<\/ol>\s*<ol>/g, '');
        
        // If we still have raw newlines and no block tags, we need to paragraph-ize
        if (!html.includes('<p>') && !html.includes('<div') && !html.includes('<h2')) {
            const blocks = html.split(/\n\s*\n/);
            html = blocks.map(block => {
                const trimmed = block.trim();
                if (!trimmed) return '';
                if (/^<(h1|h2|h3|ul|ol|li|blockquote|div|p)/i.test(trimmed)) return trimmed;
                return `<p>${trimmed.replace(/\n/g, '<br />')}</p>`;
            }).join('');
        }

        return html;
    };

    // Sync editor content with value prop only if changed externally
    useEffect(() => {
        if (editorRef.current) {
            const currentHtml = editorRef.current.innerHTML;
            // Only update if value is different AND not just an internal update
            if (currentHtml !== value) {
                const processedValue = convertMarkdownToHtml(value || '');
                editorRef.current.innerHTML = processedValue;
            }
        }
    }, [value]);

    const handleInput = () => {
        if (editorRef.current) {
            const html = editorRef.current.innerHTML;
            // Clean up empty states
            if (html === '<p><br></p>' || html === '<br>' || html === '<div><br></div>' || html === '<p></p>') {
                onChange('');
            } else {
                onChange(html);
            }
        }
    };

    const execCommand = (command: string, cmdValue?: string) => {
        if (readOnly) return;
        
        // Ensure editor is focused and we have a selection
        editorRef.current?.focus();
        
        // Execute the command
        document.execCommand(command, false, cmdValue);
        
        // Trigger update
        handleInput();
        
        // Keep focus
        setTimeout(() => {
            editorRef.current?.focus();
        }, 10);
    };

    const applyHeading = (tag: string) => {
        // execCommand 'formatBlock' with <tag>
        execCommand('formatBlock', `<${tag}>`);
    };

    if (readOnly) {
        return (
            <div className="paper-container rounded-2xl overflow-hidden border border-slate-200">
                <div 
                    className="paper-sheet rte-content"
                    dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(value) || '<p class="text-slate-400 italic">Belum ada konten peraturan untuk kategori ini.</p>' }}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col border border-slate-200 rounded-2xl overflow-hidden focus-within:ring-4 focus-within:ring-brand-500/10 focus-within:border-brand-500 transition-all bg-slate-50 shadow-inner">
            {/* Toolbar - Floating/Sticky */}
            <div className="sticky top-0 z-20 flex flex-wrap items-center gap-2 p-3 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
                <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                    <button type="button" onClick={() => execCommand('bold')} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-700 active:scale-95" title="Bold">
                        <TextB size={20} weight="bold" />
                    </button>
                    <button type="button" onClick={() => execCommand('italic')} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-700 active:scale-95" title="Italic">
                        <TextItalic size={20} weight="bold" />
                    </button>
                    <button type="button" onClick={() => execCommand('underline')} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-700 active:scale-95" title="Underline">
                        <TextUnderline size={20} weight="bold" />
                    </button>
                </div>

                <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                    <button type="button" onClick={() => applyHeading('h1')} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-700 active:scale-95" title="Heading 1">
                        <TextHOne size={20} weight="bold" />
                    </button>
                    <button type="button" onClick={() => applyHeading('h2')} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-700 active:scale-95" title="Heading 2">
                        <TextHTwo size={20} weight="bold" />
                    </button>
                    <button type="button" onClick={() => applyHeading('h3')} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-700 active:scale-95" title="Heading 3">
                        <TextHThree size={20} weight="bold" />
                    </button>
                    <button type="button" onClick={() => applyHeading('p')} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-700 active:scale-95" title="Normal Text">
                        <TextT size={20} weight="bold" />
                    </button>
                </div>

                <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                    <button type="button" onClick={() => execCommand('insertUnorderedList')} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-700 active:scale-95" title="Bullet List">
                        <ListBullets size={20} weight="bold" />
                    </button>
                    <button type="button" onClick={() => execCommand('insertOrderedList')} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-700 active:scale-95" title="Numbered List">
                        <ListNumbers size={20} weight="bold" />
                    </button>
                </div>

                <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                    <button type="button" onClick={() => execCommand('justifyLeft')} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-700 active:scale-95" title="Align Left">
                        <TextAlignLeft size={20} weight="bold" />
                    </button>
                    <button type="button" onClick={() => execCommand('justifyCenter')} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-700 active:scale-95" title="Align Center">
                        <TextAlignCenter size={20} weight="bold" />
                    </button>
                    <button type="button" onClick={() => execCommand('justifyRight')} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-700 active:scale-95" title="Align Right">
                        <TextAlignRight size={20} weight="bold" />
                    </button>
                    <button type="button" onClick={() => execCommand('justifyFull')} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-700 active:scale-95" title="Justify">
                        <TextAlignJustify size={20} weight="bold" />
                    </button>
                </div>
            </div>

            {/* Editor Area - Paper Look */}
            <div className="paper-container">
                <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleInput}
                    onBlur={handleInput}
                    className="paper-sheet rte-content rte-editor outline-none"
                    data-placeholder={placeholder}
                />
            </div>
            
            <div className="px-6 py-3 bg-white border-t border-slate-100 text-[11px] text-slate-500 font-bold uppercase tracking-widest flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                    <span>Mode Penyuntingan Dokumen</span>
                </div>
                <span className="bg-slate-100 px-3 py-1 rounded-full text-slate-600">RichText Editor v2.0</span>
            </div>
        </div>
    );
}
