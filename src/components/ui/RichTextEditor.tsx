import { useRef, useEffect } from 'react';
import { 
    TextB, 
    TextItalic, 
    TextUnderline, 
    ListBullets, 
    ListNumbers, 
    TextAlignLeft, 
    TextAlignCenter, 
    TextAlignRight 
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
            // Avoid empty <p><br></p> if possible
            if (html === '<p><br></p>' || html === '<br>') {
                onChange('');
            } else {
                onChange(html);
            }
        }
    };

    const execCommand = (command: string, cmdValue?: string) => {
        document.execCommand(command, false, cmdValue);
        handleInput();
        // Return focus to editor
        editorRef.current?.focus();
    };

    if (readOnly) {
        return (
            <div 
                className="rte-content p-6 min-h-[300px] border border-slate-100 rounded-2xl bg-slate-50/30 text-slate-800 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: value || '<p class="text-slate-400 italic">Belum ada konten peraturan untuk kategori ini.</p>' }}
            />
        );
    }

    return (
        <div className="flex flex-col border border-slate-200 rounded-2xl overflow-hidden focus-within:ring-4 focus-within:ring-brand-500/10 focus-within:border-brand-500 transition-all bg-white shadow-sm">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-0.5 bg-white p-1 rounded-lg border border-slate-200 shadow-sm mr-2">
                    <button type="button" onClick={() => execCommand('bold')} className="p-2 hover:bg-slate-100 rounded-md transition-colors text-slate-600" title="Bold">
                        <TextB size={18} weight="bold" />
                    </button>
                    <button type="button" onClick={() => execCommand('italic')} className="p-2 hover:bg-slate-100 rounded-md transition-colors text-slate-600" title="Italic">
                        <TextItalic size={18} weight="bold" />
                    </button>
                    <button type="button" onClick={() => execCommand('underline')} className="p-2 hover:bg-slate-100 rounded-md transition-colors text-slate-600" title="Underline">
                        <TextUnderline size={18} weight="bold" />
                    </button>
                </div>

                <div className="flex items-center gap-0.5 bg-white p-1 rounded-lg border border-slate-200 shadow-sm mr-2">
                    <button type="button" onClick={() => execCommand('insertUnorderedList')} className="p-2 hover:bg-slate-100 rounded-md transition-colors text-slate-600" title="Bullet List">
                        <ListBullets size={18} weight="bold" />
                    </button>
                    <button type="button" onClick={() => execCommand('insertOrderedList')} className="p-2 hover:bg-slate-100 rounded-md transition-colors text-slate-600" title="Numbered List">
                        <ListNumbers size={18} weight="bold" />
                    </button>
                </div>

                <div className="flex items-center gap-0.5 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                    <button type="button" onClick={() => execCommand('justifyLeft')} className="p-2 hover:bg-slate-100 rounded-md transition-colors text-slate-600" title="Align Left">
                        <TextAlignLeft size={18} weight="bold" />
                    </button>
                    <button type="button" onClick={() => execCommand('justifyCenter')} className="p-2 hover:bg-slate-100 rounded-md transition-colors text-slate-600" title="Align Center">
                        <TextAlignCenter size={18} weight="bold" />
                    </button>
                    <button type="button" onClick={() => execCommand('justifyRight')} className="p-2 hover:bg-slate-100 rounded-md transition-colors text-slate-600" title="Align Right">
                        <TextAlignRight size={18} weight="bold" />
                    </button>
                </div>
            </div>

            {/* Editor Area */}
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                onBlur={handleInput}
                className="rte-content p-6 min-h-[400px] outline-none text-slate-800 leading-relaxed bg-white overflow-y-auto rte-editor"
                data-placeholder={placeholder}
                style={{ WebkitUserModify: 'read-write-plaintext-only' } as any}
            />
            
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 font-medium italic flex justify-between items-center">
                <span>Tip: Gunakan toolbar di atas untuk memformat teks.</span>
                <span>RichText Editor v1.0</span>
            </div>
        </div>
    );
}
