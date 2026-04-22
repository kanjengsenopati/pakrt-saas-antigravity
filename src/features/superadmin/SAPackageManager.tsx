import { useState, useEffect } from 'react';
import { packageService } from '../../services/packageService';
import { Text } from '../../components/ui/Typography';
import { 
  Package, 
  Plus, 
  PencilSimple, 
  Trash, 
  CheckCircle, 
  XCircle, 
  CurrencyCircleDollar, 
  CalendarBlank,
  Clock
} from '@phosphor-icons/react';

interface PricePackage {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  duration_unit: 'WEEK' | 'MONTH';
  features: any;
  isActive: boolean;
}

export default function SAPackageManager() {
  const [packages, setPackages] = useState<PricePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PricePackage | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    duration: 1,
    duration_unit: 'MONTH' as 'WEEK' | 'MONTH',
    features: ['']
  });

  const loadPackages = async () => {
    setLoading(true);
    try {
      const data = await packageService.getAll();
      setPackages(data);
    } catch (error) {
      console.error('Failed to load packages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPackages();
  }, []);

  const handleOpenModal = (pkg?: PricePackage) => {
    if (pkg) {
      setEditingPackage(pkg);
      setFormData({
        name: pkg.name,
        description: pkg.description || '',
        price: pkg.price,
        duration: pkg.duration,
        duration_unit: pkg.duration_unit || 'MONTH',
        features: Array.isArray(pkg.features) ? pkg.features : ['']
      });
    } else {
      setEditingPackage(null);
      setFormData({
        name: '',
        description: '',
        price: 0,
        duration: 1,
        duration_unit: 'MONTH',
        features: ['']
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        duration: Number(formData.duration),
        features: formData.features.filter(f => f.trim() !== '')
      };

      if (editingPackage) {
        await packageService.update(editingPackage.id, payload);
      } else {
        await packageService.create(payload);
      }
      setIsModalOpen(false);
      loadPackages();
    } catch (error) {
      console.error('Failed to save package:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus/menonaktifkan paket ini?')) {
      try {
        await packageService.delete(id);
        loadPackages();
      } catch (error) {
        console.error('Failed to delete package:', error);
      }
    }
  };

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ''] });
  };

  const removeFeature = (index: number) => {
    const newFeatures = [...formData.features];
    newFeatures.splice(index, 1);
    setFormData({ ...formData, features: newFeatures });
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };


  const formatThousand = (val: number | string) => {
    const num = String(val).replace(/\D/g, '');
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    setFormData({ ...formData, price: Number(rawValue) });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Text.H1>Manajemen Paket Harga</Text.H1>
          <Text.Body className="mt-1 flex items-center gap-1.5 text-slate-500 font-medium">
            <Package size={16} weight="bold" />
            Kelola paket berlangganan SaaS PakRT
          </Text.Body>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-[24px] font-bold text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95"
        >
          <Plus size={18} weight="bold" />
          <span>Tambah Paket Baru</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <div 
              key={pkg.id} 
              className={`bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50 relative group overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 ${!pkg.isActive ? 'opacity-60 grayscale' : ''}`}
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600" />
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <Text.Label className="!text-[10px] !text-slate-500 mb-1">Paket Berlangganan</Text.Label>
                  <Text.H2>{pkg.name}</Text.H2>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleOpenModal(pkg)}
                    className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
                  >
                    <PencilSimple size={18} weight="bold" />
                  </button>
                  <button 
                    onClick={() => handleDelete(pkg.id)}
                    className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all"
                  >
                    <Trash size={18} weight="bold" />
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <Text.Amount className="!text-3xl !text-slate-900">
                    Rp {pkg.price.toLocaleString('id-ID')}
                  </Text.Amount>
                  <Text.Caption className="!italic !text-slate-500">
                    / {pkg.duration} {pkg.duration_unit === 'WEEK' ? 'Minggu' : 'Bulan'}
                  </Text.Caption>
                </div>
                <Text.Body className="mt-2 line-clamp-2 min-h-[40px] text-slate-600">
                  {pkg.description || 'Tidak ada deskripsi paket.'}
                </Text.Body>
              </div>

              <div className="space-y-3 mb-6">
                <Text.Label className="!text-[10px] !text-slate-500">Fitur Termasuk</Text.Label>
                {Array.isArray(pkg.features) && pkg.features.slice(0, 4).map((feature: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 text-slate-600">
                    <CheckCircle size={16} weight="fill" className="text-emerald-500" />
                    <span className="text-xs font-medium">{feature}</span>
                  </div>
                ))}
                {Array.isArray(pkg.features) && pkg.features.length > 4 && (
                  <Text.Caption className="!ml-6 !text-slate-500">+{pkg.features.length - 4} Fitur lainnya</Text.Caption>
                )}
              </div>

              <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50">
                  <Clock size={14} className="text-slate-500" />
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    {pkg.duration} {pkg.duration_unit === 'WEEK' ? 'Wk' : 'Mo'}
                  </span>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${pkg.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                  {pkg.isActive ? 'Aktif' : 'Non-aktif'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <Text.H2>{editingPackage ? 'Edit Paket' : 'Tambah Paket Baru'}</Text.H2>
                <Text.Caption className="!text-slate-500">Lengkapi detail paket berlangganan</Text.Caption>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-2xl bg-slate-50 text-slate-500 hover:bg-slate-100 transition-all"
              >
                <XCircle size={24} weight="bold" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Text.Label className="!text-slate-500">Nama Paket</Text.Label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-600 transition-all outline-none text-slate-800 font-medium"
                    placeholder="Contoh: Premium Bulanan"
                  />
                </div>
                <div className="space-y-2">
                  <Text.Label className="!text-slate-500">Harga (Rp)</Text.Label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-600 transition-colors z-10">
                      <CurrencyCircleDollar size={22} weight="bold" />
                    </div>
                    <input
                      type="text"
                      required
                      value={formatThousand(formData.price)}
                      onChange={handlePriceChange}
                      className="w-full pl-14 pr-5 py-3.5 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-600 transition-all outline-none text-slate-800 font-bold text-lg"
                      placeholder="0"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <Text.Label className="!text-slate-500">Durasi</Text.Label>
                    <div className="flex bg-slate-100 p-1 rounded-xl gap-1 scale-90 origin-right">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, duration_unit: 'WEEK' })}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${formData.duration_unit === 'WEEK' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                      >
                        MINGGUAN
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, duration_unit: 'MONTH' })}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${formData.duration_unit === 'MONTH' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                      >
                        BULANAN
                      </button>
                    </div>
                  </div>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-600 transition-colors z-10">
                      <CalendarBlank size={22} weight="bold" />
                    </div>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                      className="w-full pl-14 pr-5 py-3.5 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-600 transition-all outline-none text-slate-800 font-bold text-lg"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-black text-slate-500 uppercase tracking-widest pointer-events-none">
                      {formData.duration_unit === 'WEEK' ? 'Minggu' : 'Bulan'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Text.Label className="!text-slate-500">Deskripsi</Text.Label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-600 transition-all outline-none text-slate-800 font-medium min-h-[100px]"
                  placeholder="Jelaskan keunggulan paket ini..."
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Text.Label className="!text-slate-500">Fitur Unggulan</Text.Label>
                  <button
                    type="button"
                    onClick={addFeature}
                    className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline"
                  >
                    <Plus size={14} weight="bold" />
                    Tambah Fitur
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.features.map((feature, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => updateFeature(idx, e.target.value)}
                        className="flex-1 px-5 py-3 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-600 transition-all outline-none text-slate-800 text-sm font-medium"
                        placeholder={`Fitur ${idx + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeFeature(idx)}
                        className="p-3 text-slate-500 hover:text-red-600 transition-all"
                      >
                        <Trash size={18} weight="bold" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-4 rounded-[24px] bg-slate-50 text-slate-600 font-bold text-sm hover:bg-slate-100 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-4 rounded-[24px] bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
                >
                  {editingPackage ? 'Simpan Perubahan' : 'Buat Paket'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}

