const fs = require('fs');

const filepath = 'f:/Antigravity/Projects/pakrt/src/features/pengaturan/Pengaturan.tsx';
let content = fs.readFileSync(filepath, 'utf-8');

// 1. Add state for Reset Password Modal
const stateTarget = "const [newRoleForm, setNewRoleForm] = useState({ name: '' });";
const stateReplacement = `const [newRoleForm, setNewRoleForm] = useState({ name: '' });
    const [resetPasswordModal, setResetPasswordModal] = useState<{ isOpen: boolean; user: User | null; newPassword: string; showPassword: boolean }>({ isOpen: false, user: null, newPassword: '', showPassword: false });`;
content = content.replace(stateTarget, stateReplacement);

// 2. Replace handleResetPassword
const oldHandleReset = /const handleResetPassword = async \(user: User\) => \{[\s\S]*?\};/g;
const newHandleReset = `const handleResetPassword = async (user: User) => {
        setResetPasswordModal({ isOpen: true, user, newPassword: '', showPassword: false });
    };

    const submitResetPassword = async () => {
        if (!resetPasswordModal.user || !resetPasswordModal.newPassword) return;
        try {
            await userService.update(resetPasswordModal.user.id, { password: resetPasswordModal.newPassword });
            alert(\`Password untuk \${resetPasswordModal.user.name} berhasil diperbarui.\`);
            setResetPasswordModal({ isOpen: false, user: null, newPassword: '', showPassword: false });
        } catch (error) {
            console.error("Failed to reset password:", error);
            alert("Gagal mereset password. Silakan coba lagi.");
        }
    };`;
content = content.replace(oldHandleReset, newHandleReset);

// 3. Add Eye, EyeSlash import if missing
if (!content.includes('EyeSlash')) {
    const importTarget = "import { FloppyDisk, Money, FileText, CheckCircle, ShieldCheck, Palette, X, Plus, User as UserIcon, Eraser, QrCode, CaretUp, Key, Trash, Printer } from '@phosphor-icons/react';";
    const importReplacement = "import { FloppyDisk, Money, FileText, CheckCircle, ShieldCheck, Palette, X, Plus, User as UserIcon, Eraser, QrCode, CaretUp, Key, Trash, Printer, Eye, EyeSlash } from '@phosphor-icons/react';";
    content = content.replace(importTarget, importReplacement);
}

// 4. Replace Role Matrix
const roleMatrixPattern = /(<div className="overflow-x-auto no-scrollbar">[\s\S]*?<table className="w-full text-left min-w-\[450px\]">[\s\S]*?<\/table>\s*<\/div>)/;
const roleMatrixMobile = `<div className="hidden md:block overflow-x-auto no-scrollbar">
                                                              <table className="w-full text-left min-w-[450px]">
                                                                  <thead>
                                                                      <tr className="bg-slate-50/50 border-b border-slate-100">
                                                                          <th className="py-3 px-4 pl-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50 sticky left-0 z-10">Modul</th>
                                                                          {CRUD_ACTIONS.map(action => (
                                                                              <th key={action.id} className="p-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">{action.label}</th>
                                                                          ))}
                                                                      </tr>
                                                                  </thead>
                                                                  <tbody className="divide-y divide-slate-50">
                                                                      {APP_MODULES.map((module) => (
                                                                          <tr key={module.id} className="hover:bg-slate-50/30 transition-colors">
                                                                              <td className="py-3 px-4 pl-5 sticky left-0 bg-white z-10 border-r border-slate-50 shadow-[4px_0_8px_rgba(0,0,0,0.02)]">
                                                                                  <Text.Body className="!text-[11px] !font-bold !text-slate-700 uppercase">{module.label}</Text.Body>
                                                                              </td>
                                                                              {CRUD_ACTIONS.map(action => {
                                                                                  const isChecked = userPermissions[module.id]?.actions?.includes(action.id);
                                                                                  return (
                                                                                      <td key={action.id} className="p-2 text-center">
                                                                                          <button onClick={() => togglePermission(module.id, action.id)} className={\`w-7 h-7 rounded-lg border flex items-center justify-center mx-auto transition-all \${isChecked ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-slate-200 text-transparent'}\`}>
                                                                                              <CheckCircle weight="bold" className="w-4 h-4" />
                                                                                          </button>
                                                                                      </td>
                                                                                  );
                                                                              })}
                                                                          </tr>
                                                                      ))}
                                                                  </tbody>
                                                              </table>
                                                          </div>
                                                          <div className="md:hidden divide-y divide-slate-100 border-t border-slate-100">
                                                              {APP_MODULES.map((module) => (
                                                                  <div key={module.id} className="p-4 bg-white">
                                                                      <Text.Body className="!text-[12px] !font-bold !text-slate-800 uppercase mb-3">{module.label}</Text.Body>
                                                                      <div className="flex flex-wrap gap-2">
                                                                          {CRUD_ACTIONS.map(action => {
                                                                              const isChecked = userPermissions[module.id]?.actions?.includes(action.id);
                                                                              return (
                                                                                  <button key={action.id} onClick={() => togglePermission(module.id, action.id)}
                                                                                      className={\`px-3 py-1.5 text-[11px] font-bold rounded-full border transition-all flex items-center gap-1.5 \${isChecked ? 'bg-brand-50 border-brand-200 text-brand-700' : 'bg-white border-slate-200 text-slate-400'}\`}>
                                                                                      {action.label}
                                                                                  </button>
                                                                              );
                                                                          })}
                                                                      </div>
                                                                  </div>
                                                              ))}
                                                          </div>`;

// We'll split the file by "Matrix Hak Akses" to handle user matrix
const parts = content.split("Matrix Hak Akses");
if (parts.length === 2) {
    // Handle user matrix in parts[1]
    const userMatrixPattern = /(<div className="overflow-x-auto no-scrollbar">[\s\S]*?<table className="w-full text-left min-w-\[500px\]">[\s\S]*?<\/table>\s*<\/div>)/;
    const userMatrixMobile = `<div className="hidden md:block overflow-x-auto no-scrollbar">
                                                                  <table className="w-full text-left min-w-[500px]">
                                                                      <thead>
                                                                          <tr className="bg-slate-50/50 border-b border-slate-100">
                                                                              <th className="py-3 px-4 pl-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50 sticky left-0 z-10">Modul</th>
                                                                              {CRUD_ACTIONS.map(action => (
                                                                                  <th key={action.id} className="p-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">{action.label}</th>
                                                                              ))}
                                                                              <th className="p-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scope</th>
                                                                          </tr>
                                                                      </thead>
                                                                      <tbody className="divide-y divide-slate-50">
                                                                          {APP_MODULES.map((module) => (
                                                                              <tr key={module.id} className="hover:bg-slate-50/30 transition-colors">
                                                                                  <td className="py-3 px-4 pl-5 sticky left-0 bg-white z-10 border-r border-slate-50 shadow-[4px_0_8px_rgba(0,0,0,0.02)]">
                                                                                      <Text.Body className="!text-[11px] !font-bold !text-slate-700 uppercase">{module.label}</Text.Body>
                                                                                  </td>
                                                                                  {CRUD_ACTIONS.map(action => {
                                                                                      const isChecked = userPermissions[module.id]?.actions?.includes(action.id);
                                                                                      return (
                                                                                          <td key={action.id} className="p-2 text-center">
                                                                                              <button onClick={() => togglePermission(module.id, action.id)} className={\`w-7 h-7 rounded-lg border flex items-center justify-center mx-auto transition-all \${isChecked ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-slate-200 text-transparent'}\`}>
                                                                                                  <CheckCircle weight="bold" className="w-4 h-4" />
                                                                                              </button>
                                                                                          </td>
                                                                                      );
                                                                                  })}
                                                                                  <td className="p-2 text-center">
                                                                                      <button onClick={() => toggleScope(module.id)} className="w-full py-1 text-[10px] font-bold rounded bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                                                                                          {userPermissions[module.id]?.scope === 'personal' ? 'Personal' : 'Semua'}
                                                                                      </button>
                                                                                  </td>
                                                                              </tr>
                                                                          ))}
                                                                      </tbody>
                                                                  </table>
                                                              </div>
                                                              <div className="md:hidden divide-y divide-slate-100 border-t border-slate-100">
                                                                  {APP_MODULES.map((module) => (
                                                                      <div key={module.id} className="p-4 bg-white">
                                                                          <div className="flex items-center justify-between mb-3">
                                                                              <Text.Body className="!text-[12px] !font-bold !text-slate-800 uppercase">{module.label}</Text.Body>
                                                                              <button onClick={() => toggleScope(module.id)} className={\`px-2 py-1 text-[10px] font-bold rounded-lg \${userPermissions[module.id]?.scope === 'personal' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}\`}>
                                                                                  Scope: {userPermissions[module.id]?.scope === 'personal' ? 'Personal' : 'Semua'}
                                                                              </button>
                                                                          </div>
                                                                          <div className="flex flex-wrap gap-2">
                                                                              {CRUD_ACTIONS.map(action => {
                                                                                  const isChecked = userPermissions[module.id]?.actions?.includes(action.id);
                                                                                  return (
                                                                                      <button key={action.id} onClick={() => togglePermission(module.id, action.id)}
                                                                                          className={\`px-3 py-1.5 text-[11px] font-bold rounded-full border transition-all flex items-center gap-1.5 \${isChecked ? 'bg-brand-50 border-brand-200 text-brand-700' : 'bg-white border-slate-200 text-slate-400'}\`}>
                                                                                          {action.label}
                                                                                      </button>
                                                                                  );
                                                                              })}
                                                                          </div>
                                                                      </div>
                                                                  ))}
                                                              </div>`;
    parts[1] = parts[1].replace(userMatrixPattern, userMatrixMobile);
    parts[0] = parts[0].replace(roleMatrixPattern, roleMatrixMobile);
    
    content = parts.join("Matrix Hak Akses");
}

// 5. Inject the Reset Password Modal at the end
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
content = content.replace(/        <\/div>\s*\n    \);\n}/, modalJsx);

fs.writeFileSync(filepath, content, 'utf-8');
console.log("Modification complete.");
