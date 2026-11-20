import React, { useState } from 'react';
import {
  X,
  Upload,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Lock,
  Tag,
  Package,
} from 'lucide-react';
import { motion } from 'motion/react';
import { CustodyItem, ItemCategory, SecurityQuestionConfig } from '../types/custody';
import { sfx } from '../utils/audio';

interface RapidIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveItem: (item: CustodyItem) => void;
  nextItemCode: string;
}

const SAMPLE_PHOTO_PRESETS = [
  {
    label: 'Smartphone / Móvil',
    url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80',
    category: 'electronics' as ItemCategory,
  },
  {
    label: 'Portátil / Laptop',
    url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
    category: 'electronics' as ItemCategory,
  },
  {
    label: 'Billetera de Cuero',
    url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80',
    category: 'wallets_ids' as ItemCategory,
  },
  {
    label: 'Mochila / Maletín',
    url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
    category: 'luggage' as ItemCategory,
  },
  {
    label: 'Llavero con Mando',
    url: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=800&q=80',
    category: 'keys' as ItemCategory,
  },
  {
    label: 'Reloj / Joyería',
    url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80',
    category: 'jewelry' as ItemCategory,
  },
];

export const RapidIntakeModal: React.FC<RapidIntakeModalProps> = ({
  isOpen,
  onClose,
  onSaveItem,
  nextItemCode,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ItemCategory>('electronics');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [distinctMarks, setDistinctMarks] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('$ 500.000 COP');

  // Finder / Hallazgo
  const [finderName, setFinderName] = useState('Aprendiz / Funcionario SENA');
  const [finderContact, setFinderContact] = useState('+57 310 000 0000');
  const [surrenderLocation, setSurrenderLocation] = useState('Ambiente 204 - Bloque ADSO');

  // Ubicación física (Casillero / Locker)
  const [zone, setZone] = useState('Zona A - Alta Seguridad');
  const [lockerNumber, setLockerNumber] = useState('L-05');
  const [binNumber, setBinNumber] = useState('Bandeja 01');

  // Pregunta de Seguridad RF-09
  const [securityLabel, setSecurityLabel] = useState('Fondo de pantalla o clave de bloqueo');
  const [securityHint, setSecurityHint] = useState('Clave PIN numérica y foto personal en pantalla de bloqueo');

  // Foto y validación RF-04 (Máx 500 KB)
  const [photoUrl, setPhotoUrl] = useState(SAMPLE_PHOTO_PRESETS[0].url);
  const [photoSizeKb, setPhotoSizeKb] = useState(280);
  const [photoError, setPhotoError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeKb = Math.round(file.size / 1024);
    setPhotoSizeKb(sizeKb);

    // Validación estricta RF-04: Máximo 500 KB
    if (sizeKb > 500) {
      setPhotoError(`La fotografía pesa ${sizeKb} KB. RF-04 exige un tamaño máximo de 500 KB.`);
      return;
    }

    setPhotoError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (preset: typeof SAMPLE_PHOTO_PRESETS[0]) => {
    setPhotoUrl(preset.url);
    setCategory(preset.category);
    setPhotoSizeKb(240);
    setPhotoError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !brand.trim() || !distinctMarks.trim()) {
      alert('Por favor complete los campos obligatorios: Título, Marca y Señas Particulares.');
      return;
    }
    if (photoError) {
      alert('Por favor resuelva el error de tamaño de fotografía (RF-04: ≤ 500 KB).');
      return;
    }

    sfx.playScannerBeep();
    sfx.playSolenoidLatch();

    const timestamp = new Date().toISOString();
    const formattedDate = new Date().toLocaleString('es-CO');
    const sealCode = 'SEAL-2026-' + Math.floor(1000 + Math.random() * 9000);
    const rfidCode = 'RFID-994021' + Math.floor(1000 + Math.random() * 9000);
    const cryptoHash = 'HASH-' + Math.random().toString(36).substring(2, 12).toUpperCase();

    const newItem: CustodyItem = {
      id: nextItemCode,
      trackingCode: nextItemCode,
      title: title.trim(),
      category,
      brand: brand.trim(),
      model: model.trim() || undefined,
      color: color.trim() || 'No especificado',
      distinctMarks: distinctMarks.trim(),
      serialNumber: serialNumber.trim() || undefined,
      status: 'EN_CUSTODIA',
      registeredAt: timestamp,
      relativeTime: 'hace un momento',
      estimatedValue,
      intakeOfficer: {
        name: 'Ofc. Hernann Manchola',
        badge: 'ADSO-3413988',
      },
      finder: {
        name: finderName,
        contact: finderContact,
        surrenderLocation,
        incidentRef: 'INC-2026-' + Math.floor(1000 + Math.random() * 9000),
      },
      location: {
        zone,
        lockerNumber,
        binNumber,
        isLocked: true,
      },
      tamperSealNumber: sealCode,
      rfidTagId: rfidCode,
      securityQuestion: {
        questionType: category === 'electronics' ? 'WALLPAPER' : 'INNER_CONTENTS',
        label: securityLabel,
        correctHint: securityHint,
      },
      failedAttempts: [],
      evidencePhotos: [
        {
          id: 'ev-new-1',
          url: photoUrl,
          caption: 'Fotografía reglamentaria de ingreso (< 500 KB)',
          timestamp: formattedDate,
          sizeKb: photoSizeKb,
        },
      ],
      timeline: [
        {
          id: 'tl-new-1',
          title: 'Registro de Ingreso a Custodia (RF-03 / RF-04)',
          timestamp: formattedDate,
          officer: 'Ofc. Hernann Manchola',
          officerBadge: 'ADSO-3413988',
          status: 'completed',
          notes: `Bien ingresado al inventario digital y asignado al casillero ${lockerNumber}. Precinto ${sealCode} colocado.`,
          hash: cryptoHash,
        },
      ],
    };

    onSaveItem(newItem);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 15 }}
        className="relative my-8 w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200"
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#0F172A] px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/30 border border-blue-400 text-blue-400">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-base font-bold uppercase tracking-wider text-white">
                  Registro Rápido de Objeto Hallado (RF-03 / RF-04)
                </h3>
                <span className="rounded bg-blue-900/80 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-300">
                  CU-03
                </span>
              </div>
              <p className="font-mono text-xs text-slate-300">
                Código de Seguimiento Autogenerado: <strong>{nextItemCode}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Fila 1: Datos Básicos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Descripción / Título del Bien *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. iPhone 14 Pro Max 128GB Morado Oscuro"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Categoría (RF-05) *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ItemCategory)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
              >
                <option value="electronics">Tecnología / Celulares</option>
                <option value="wallets_ids">Billeteras y Documentos</option>
                <option value="luggage">Mochilas y Maletines</option>
                <option value="keys">Llaves y Mandos</option>
                <option value="jewelry">Relojes y Joyería</option>
                <option value="clothing">Prendas y Accesorios</option>
                <option value="documents">Documentos Aislados</option>
                <option value="other">Otros Artículos</option>
              </select>
            </div>
          </div>

          {/* Fila 2: Marca, Modelo, Color, Serial */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Marca *</label>
              <input
                type="text"
                required
                placeholder="Ej. Apple, Samsung, Vélez"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Modelo</label>
              <input
                type="text"
                placeholder="Ej. Galaxy S23, A2890"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Color Principal</label>
              <input
                type="text"
                placeholder="Ej. Negro Mate, Azul"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Serial / IMEI (Opcional)</label>
              <input
                type="text"
                placeholder="Ej. SN-8921829K"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Señas particulares */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Señas Particulares / Rayones / Calcomanías (Para el 70%-80% de validación) *
            </label>
            <textarea
              rows={2}
              required
              placeholder="Describa rayones específicos, stickers, fundas, fisuras, abolladuras o detalles que solo el verdadero dueño conoce..."
              value={distinctMarks}
              onChange={(e) => setDistinctMarks(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Carga y Validación de Fotografía (RF-04: Máx 500 KB) */}
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Camera className="h-4 w-4 text-blue-600" />
                Fotografía del Objeto (RF-04: Máximo 500 KB)
              </label>
              <span className="font-mono text-[11px] text-slate-500">
                Peso actual: <strong>{photoSizeKb} KB</strong>
              </span>
            </div>

            {photoError && (
              <div className="mb-3 rounded-lg bg-red-100 p-2.5 text-xs text-red-800 flex items-center gap-2 border border-red-300 font-medium">
                <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                <span>{photoError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              {/* Preview */}
              <div className="relative h-28 rounded-lg overflow-hidden border border-slate-300 bg-white shadow-xs">
                <img src={photoUrl} alt="Preview" className="h-full w-full object-cover" />
                <span className="absolute bottom-1 right-1 rounded bg-slate-900/80 px-1.5 py-0.5 text-[10px] text-white font-mono">
                  {photoSizeKb} KB
                </span>
              </div>

              {/* Upload manual */}
              <div className="md:col-span-2 space-y-2">
                <label className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 p-3 cursor-pointer hover:border-blue-500 bg-white transition">
                  <Upload className="h-4 w-4 text-slate-500" />
                  <span className="text-xs font-medium text-slate-700">Subir foto desde archivo (≤ 500 KB)</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>

                {/* Presets rápidos */}
                <div>
                  <span className="text-[11px] font-bold text-slate-500 block mb-1">
                    O seleccione un preset de muestra para demostración rápida:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {SAMPLE_PHOTO_PRESETS.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => handleSelectPreset(p)}
                        className="rounded-md bg-white px-2 py-1 text-[11px] font-medium text-slate-700 border border-slate-200 hover:border-blue-500 transition"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Asignación de Casillero Físico (Locker Matrix) */}
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              Ubicación Física en Casillero / Locker (RF-03)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Zona del Depósito</label>
                <select
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                >
                  <option value="Zona A - Alta Seguridad">Zona A - Alta Seguridad</option>
                  <option value="Zona B - Valores y Documentos">Zona B - Valores y Documentos</option>
                  <option value="Zona C - Maletines y Equipajes">Zona C - Maletines y Equipajes</option>
                  <option value="Zona D - Varios y Prendas">Zona D - Varios y Prendas</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Número de Casillero</label>
                <input
                  type="text"
                  value={lockerNumber}
                  onChange={(e) => setLockerNumber(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 font-mono focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Bandeja / Gaveta</label>
                <input
                  type="text"
                  value={binNumber}
                  onChange={(e) => setBinNumber(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Configuración de Pregunta Clave de Seguridad (RF-09) */}
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 mb-2 flex items-center gap-2">
              <Lock className="h-4 w-4 text-indigo-600" />
              RF-09: Configuración de Pregunta Clave / Verificación Reforzada
            </h4>
            <p className="text-[11px] text-indigo-700 mb-3">
              Esta información es confidencial. Solo el personal de custodia la verá al evaluar al reclamante.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-indigo-950 mb-1">
                  Concepto a Validar
                </label>
                <input
                  type="text"
                  value={securityLabel}
                  onChange={(e) => setSecurityLabel(e.target.value)}
                  className="w-full rounded-lg border border-indigo-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-indigo-950 mb-1">
                  Respuesta o Dato Secreto Esperado
                </label>
                <input
                  type="text"
                  value={securityHint}
                  onChange={(e) => setSecurityHint(e.target.value)}
                  className="w-full rounded-lg border border-indigo-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none bg-white"
                />
              </div>
            </div>
          </div>

          {/* Pie de Acciones */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={Boolean(photoError)}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-blue-500/25 hover:bg-blue-700 transition cursor-pointer active:scale-95 disabled:bg-slate-300"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Guardar en Inventario y Generar Precinto (RF-03)</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
