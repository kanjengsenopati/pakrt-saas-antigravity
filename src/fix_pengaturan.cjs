const fs = require('fs');
let content = fs.readFileSync('src/features/pengaturan/Pengaturan.tsx', 'utf-8');
const modalJsx = `            {/* Reset Password Modal */}
            {resetPasswordModal.isOpen && (
                <>
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 animate-fade-in" onClick={() => setResetPasswordModal({ ...resetPasswordModal, isOpen: false })} />
                    <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white rounded-[32px] p-6 z-50 shadow-2xl animate-scale-in">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                                    <Key weight="fill" className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Reset Password</h3>
                                    <p className="text-[11px] text-slate-500">Ubah sandi untuk {resetPasswordModal.user?.name}</p>
                                </div>
                            </div>
                            <button onClick={() => setResetPasswordModal({ ...resetPasswordModal, isOpen: false })} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                                <X weight="bold" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="relative">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Password Baru</label>
                                <div className="relative">
                                    <input 
                                        type={resetPasswordModal.showPassword ? "text" : "password"}
                                        required
                                        placeholder="Ketik password baru..."
                                        value={resetPasswordModal.newPassword}
                                        onChange={(e) => setResetPasswordModal({ ...resetPasswordModal, newPassword: e.target.value })}
                                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 pr-10 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all text-sm"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setResetPasswordModal({ ...resetPasswordModal, showPassword: !resetPasswordModal.showPassword })}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                                    >
                                        {resetPasswordModal.showPassword ? <EyeSlash weight="bold" /> : <Eye weight="bold" />}
                                    </button>
                                </div>
                            </div>
                            
                            <button 
                                onClick={submitResetPassword}
                                disabled={!resetPasswordModal.newPassword}
                                className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                                Simpan Password
                            </button>
                        </div>
                    </div>
                </>
            )}

        </div>
    );
}`;

content = content.replace(/        <\/div>\s*\)\s*}\s*<\/div>\s*\);\s*}\s*$/, modalJsx); // Handle trailing spaces/blocks just in case
// A better way is to find the last </div>
const lastDivIndex = content.lastIndexOf('</div>');
if (lastDivIndex !== -1) {
    const beforeDiv = content.substring(0, lastDivIndex);
    const afterDiv = content.substring(lastDivIndex);
    content = beforeDiv + modalJsx;
}

fs.writeFileSync('src/features/pengaturan/Pengaturan.tsx', content);
console.log("Done");
