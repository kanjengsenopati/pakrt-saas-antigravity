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

    // Sync editor content with value prop only if changed externally
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value || '';
        }
    }, [value]);

    const handleInput = () => {
        if (editorRef.current) {
            const html = editorRef.current.innerHTML;
            // Clean up empty states
            if (html === '<p><br></p>' || html === '<br>' || html === '<div><br></div>') {
                onChange('');
            } else {
                onChange(html);
            }
        }
    };

    const execCommand = (command: string, cmdValue?: string) => {
        if (readOnly) return;
        document.execCommand(command, false, cmdValue);
        handleInput();
        editorRef.current?.focus();
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
                    dangerouslySetInnerHTML={{ __html: value || '<p class="text-slate-400 italic">Belum ada konten peraturan untuk kategori ini.</p>' }}
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
