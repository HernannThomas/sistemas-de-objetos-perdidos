import React, { useState } from 'react';
import {
  X,
  MapPin,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { CustodyItem, ItemCategory } from '../types/custody';
import { sfx } from '../utils/audio';

interface RapidIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveItem: (item: CustodyItem) => void;
  nextItemCode: string;
}

const SAMPLE_PHOTO_PRESETS = [
  {
    label: 'Portátil / Laptop',
    url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Smartphone',
    url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Cámara Réflex',
    url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Billetera de Cuero',
    url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Auriculares',
    url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Reloj de Lujo',
    url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Llavero con Mando',
    url: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Maleta de Viaje',
    url: 'https://images.unsplash.com/photo-1581553680321-4fffae59fccd?auto=format&fit=crop&w=800&q=80',
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
  const [estimatedValue, setEstimatedValue] = useState('500,00 €');

  // Finder
  const [finderName, setFinderName] = useState('Ciudadano Anónimo (Entrega en Mostrador)');
  const [finderContact, setFinderContact] = useState('+34 900 000 000');
  const [surrenderLocation, setSurrenderLocation] = useState('Mostrador Central Recepción #4');

  // Storage
  const [zone, setZone] = useState('Zona B - Alto Valor');
  const [lockerNumber, setLockerNumber] = useState('L-18');
  const [binNumber, setBinNumber] = useState('Bandeja 02');

  // Photo
  const [photoUrl, setPhotoUrl] = useState(SAMPLE_PHOTO_PRESETS[0].url);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !brand.trim()) return;

    sfx.playScannerBeep();
    sfx.playSolenoidLatch();

    const timestamp = new Date().toISOString();
    const formattedDate =
      new Date().toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }) +
      ' · ' +
      new Date().toLocaleTimeString('es-ES', { hour12: false });

    const newItem: CustodyItem = {
      id: nextItemCode,
      trackingCode: nextItemCode,
      title: title.trim(),
      category,
      brand: brand.trim(),
      model: model.trim() || undefined,
      color: color.trim() || 'Estándar',
      distinctMarks: distinctMarks.trim() || 'Sin signos particulares observados en la inspección de entrada.',
      serialNumber: serialNumber.trim() || undefined,
      status: 'EN_CUSTODIA',
      registeredAt: timestamp,
      relativeTime: 'Ahora mismo',
      intakeOfficer: {
        name: 'Ofc. J. Martínez',
        badge: '8921-SEC',
      },
      finder: {
        name: finderName.trim(),
        contact: finderContact.trim(),
        surrenderLocation: surrenderLocation.trim(),
        incidentRef: 'INC-2026-' + Math.floor(1000 + Math.random() * 9000),
      },
      location: {
        zone,
        lockerNumber,
        binNumber,
        isLocked: true,
      },
      tamperSealNumber: 'SEAL-' + Math.floor(1000 + Math.random() * 9000) + '-SEC',
      estimatedValue: estimatedValue.trim() || '100,00 €',
      rfidTagId: 'RFID-' + Math.floor(10000000 + Math.random() * 90000000),
      evidencePhotos: [
        {
          id: 'ev-new-1',
          url: photoUrl,
          caption: 'Evidencia fotográfica en mostrador de recepción',
          timestamp: formattedDate,
        },
      ],
      timeline: [
        {
          id: 'step-new-1',
          title: 'Alta de Recepción y Precintado',
          timestamp: formattedDate,
          officer: 'J. Martínez',
          officerBadge: '8921-SEC',
          status: 'completed',
          notes: `Bien entregado en ${surrenderLocation}. Precinto de seguridad colocado y depositado en ${lockerNumber} (${binNumber}).`,
          hash: 'SHA256: ' + Math.random().toString(36).substring(2, 8) + '...alta',
        },
      ],
    };

    onSaveItem(newItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/75 p-4 backdrop-blur-xs">
      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.93, opacity: 0, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative w-full max-w-2xl rounded-lg bg-white shadow-2xl overflow-hidden border border-slate-200"
      >
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#0F172A] px-5 py-3.5 text-white">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-sky-400" />
            <div>
              <h3 className="font-heading text-sm font-bold uppercase tracking-wider">
                Terminal de Recepción Rápida de Custodia
              </h3>
              <p className="font-mono text-[11px] text-slate-300">
                Código Asignado: <span className="text-sky-300 font-bold">{nextItemCode}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Identificación del bien */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Descripción / Denominación del Bien *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ej. Ordenador Portátil 14 pulgadas con funda de neopreno"
                className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#2563EB] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Categoría Institucional *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ItemCategory)}
                className="w-full rounded border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-800 focus:border-[#2563EB] focus:outline-none"
              >
                <option value="electronics">Dispositivos y Electrónica</option>
                <option value="wallets_ids">Carteras, Tarjetas e Identificaciones</option>
                <option value="jewelry">Joyería y Relojes de Lujo</option>
                <option value="keys">Llaves y Mandos</option>
                <option value="luggage">Equipajes y Maletas</option>
                <option value="documents">Documentación Oficial</option>
                <option value="other">Bienes Generales</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Marca / Fabricante *
              </label>
              <input
                type="text"
                required
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="ej. Apple, Dell, Montblanc, Samsonite"
                className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#2563EB] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Modelo / Versión
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="ej. Modelo A2992, Pro Max"
                className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#2563EB] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Color y Acabado
              </label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="ej. Gris Espacial, Negro Mate, Azul Marino"
                className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#2563EB] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Número de Serie / IMEI Hardware
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="ej. SN-8849201"
                className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-800 focus:border-[#2563EB] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Valor Estimado / Tasación
              </label>
              <input
                type="text"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
                placeholder="450,00 €"
                className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-800 focus:border-[#2563EB] focus:outline-none"
              />
            </div>
          </div>

          {/* Marcas Distintivas */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Marcas Físicas Distintivas, Rasguños o Adhesivos *
            </label>
            <textarea
              rows={2}
              required
              value={distinctMarks}
              onChange={(e) => setDistinctMarks(e.target.value)}
              placeholder="Describa cualquier raspadura, iniciales grabadas, fisuras en cristal, pegatinas..."
              className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#2563EB] focus:outline-none"
            />
          </div>

          {/* Selector de Fotografía de Evidencia */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Fotografía de Evidencia (Seleccione Imagen de Muestra o URL)
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {SAMPLE_PHOTO_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setPhotoUrl(preset.url)}
                  className={`rounded border px-2 py-1 text-[11px] transition ${
                    photoUrl === preset.url
                      ? 'border-[#2563EB] bg-[#2563EB]/10 font-bold text-[#2563EB]'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 font-mono focus:border-[#2563EB] focus:outline-none"
            />
          </div>

          {/* Asignación en Bóveda / Casillero */}
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-1.5 mb-2 font-heading text-xs font-bold uppercase text-slate-700">
              <MapPin className="h-3.5 w-3.5 text-sky-600" />
              <span>Coordenadas de Almacenamiento en Casillero</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Zona</label>
                <select
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  className="w-full rounded border border-slate-300 bg-white py-1.5 px-2 text-xs text-slate-800"
                >
                  <option value="Zona B - Alto Valor">Zona B - Alto Valor</option>
                  <option value="Zona A - Casillero Prioritario">Zona A - Casillero Prioritario</option>
                  <option value="Zona C - Almacén Estándar">Zona C - Almacén Estándar</option>
                  <option value="Bóveda Alfa - Restringida">Bóveda Alfa - Restringida</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Casillero #</label>
                <input
                  type="text"
                  value={lockerNumber}
                  onChange={(e) => setLockerNumber(e.target.value)}
                  className="w-full rounded border border-slate-300 bg-white py-1.5 px-2 text-xs font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Bandeja / Estante</label>
                <input
                  type="text"
                  value={binNumber}
                  onChange={(e) => setBinNumber(e.target.value)}
                  className="w-full rounded border border-slate-300 bg-white py-1.5 px-2 text-xs font-bold text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Cancelar
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="flex items-center gap-2 rounded-md bg-[#0F172A] px-5 py-2 text-xs font-bold text-white shadow hover:bg-[#1E293B] transition"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Registrar Recepción y Bloquear Casillero</span>
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
