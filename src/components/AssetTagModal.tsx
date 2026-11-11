import React from 'react';
import { X, Printer, Barcode } from 'lucide-react';
import { motion } from 'motion/react';
import { CustodyItem } from '../types/custody';

interface AssetTagModalProps {
  item: CustodyItem;
  isOpen: boolean;
  onClose: () => void;
}

export const AssetTagModal: React.FC<AssetTagModalProps> = ({
  item,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/75 p-4 backdrop-blur-xs">
      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.93, opacity: 0, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative w-full max-w-lg rounded-lg bg-white shadow-2xl overflow-hidden border border-slate-200"
      >
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#0F172A] px-5 py-3.5 text-white">
          <div className="flex items-center gap-2">
            <Barcode className="h-5 w-5 text-sky-400" />
            <h3 className="font-heading text-sm font-bold uppercase tracking-wider">
              Etiqueta Institucional de Activo / Adhesivo Térmico
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center">
          {/* Adhesivo Térmico Institucional en Blanco y Negro (4" x 2.5") */}
          <div className="printable-asset-tag w-full max-w-sm rounded border-2 border-black bg-white p-4 text-black shadow-md font-mono">
            {/* Cabecera institucional */}
            <div className="flex items-center justify-between border-b-2 border-black pb-2 text-[10px] font-bold">
              <span>CUSTODIA CORE · CONTROL JUDICIAL</span>
              <span>USO OFICIAL</span>
            </div>

            {/* Código de Seguimiento */}
            <div className="my-2 text-center">
              <span className="block text-2xl font-extrabold tracking-widest font-mono">
                {item.trackingCode}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-700">
                {item.category.replace('_', ' ')} · {item.brand}
              </span>
            </div>

            {/* Código de barras 1D Code128 */}
            <div className="my-3 flex flex-col items-center justify-center">
              <svg
                className="h-14 w-full"
                viewBox="0 0 280 60"
                preserveAspectRatio="none"
              >
                <rect x="0" y="0" width="3" height="60" fill="#000" />
                <rect x="5" y="0" width="2" height="60" fill="#000" />
                <rect x="9" y="0" width="4" height="60" fill="#000" />
                <rect x="16" y="0" width="2" height="60" fill="#000" />
                <rect x="20" y="0" width="5" height="60" fill="#000" />
                <rect x="28" y="0" width="2" height="60" fill="#000" />
                <rect x="33" y="0" width="4" height="60" fill="#000" />
                <rect x="40" y="0" width="6" height="60" fill="#000" />
                <rect x="48" y="0" width="2" height="60" fill="#000" />
                <rect x="53" y="0" width="4" height="60" fill="#000" />
                <rect x="60" y="0" width="2" height="60" fill="#000" />
                <rect x="64" y="0" width="5" height="60" fill="#000" />
                <rect x="72" y="0" width="3" height="60" fill="#000" />
                <rect x="78" y="0" width="4" height="60" fill="#000" />
                <rect x="85" y="0" width="2" height="60" fill="#000" />
                <rect x="90" y="0" width="6" height="60" fill="#000" />
                <rect x="98" y="0" width="3" height="60" fill="#000" />
                <rect x="104" y="0" width="2" height="60" fill="#000" />
                <rect x="108" y="0" width="5" height="60" fill="#000" />
                <rect x="115" y="0" width="4" height="60" fill="#000" />
                <rect x="122" y="0" width="2" height="60" fill="#000" />
                <rect x="126" y="0" width="6" height="60" fill="#000" />
                <rect x="135" y="0" width="3" height="60" fill="#000" />
                <rect x="140" y="0" width="4" height="60" fill="#000" />
                <rect x="146" y="0" width="2" height="60" fill="#000" />
                <rect x="151" y="0" width="5" height="60" fill="#000" />
                <rect x="158" y="0" width="3" height="60" fill="#000" />
                <rect x="164" y="0" width="4" height="60" fill="#000" />
                <rect x="171" y="0" width="2" height="60" fill="#000" />
                <rect x="175" y="0" width="6" height="60" fill="#000" />
                <rect x="184" y="0" width="3" height="60" fill="#000" />
                <rect x="190" y="0" width="2" height="60" fill="#000" />
                <rect x="194" y="0" width="5" height="60" fill="#000" />
                <rect x="202" y="0" width="4" height="60" fill="#000" />
                <rect x="208" y="0" width="2" height="60" fill="#000" />
                <rect x="212" y="0" width="6" height="60" fill="#000" />
                <rect x="220" y="0" width="3" height="60" fill="#000" />
                <rect x="225" y="0" width="4" height="60" fill="#000" />
                <rect x="231" y="0" width="2" height="60" fill="#000" />
                <rect x="236" y="0" width="5" height="60" fill="#000" />
                <rect x="244" y="0" width="2" height="60" fill="#000" />
                <rect x="248" y="0" width="6" height="60" fill="#000" />
                <rect x="256" y="0" width="3" height="60" fill="#000" />
                <rect x="261" y="0" width="4" height="60" fill="#000" />
                <rect x="268" y="0" width="2" height="60" fill="#000" />
                <rect x="272" y="0" width="4" height="60" fill="#000" />
                <rect x="278" y="0" width="2" height="60" fill="#000" />
              </svg>
              <span className="mt-1 text-[10px] tracking-widest">{item.rfidTagId}</span>
            </div>

            {/* Coordenadas en Bóveda */}
            <div className="grid grid-cols-3 border-t-2 border-b-2 border-black py-1.5 text-center text-[10px]">
              <div>
                <span className="block font-bold">CASILLERO</span>
                <span>{item.location.lockerNumber}</span>
              </div>
              <div>
                <span className="block font-bold">BANDEJA</span>
                <span>{item.location.binNumber}</span>
              </div>
              <div>
                <span className="block font-bold">PRECINTO</span>
                <span className="truncate">{item.tamperSealNumber}</span>
              </div>
            </div>

            {/* Metadatos de Pie */}
            <div className="mt-2 flex items-center justify-between text-[9px] text-slate-700">
              <span>OFICIAL: #{item.intakeOfficer.badge}</span>
              <span>FECHA: {new Date(item.registeredAt).toLocaleDateString('es-ES')}</span>
            </div>
            <div className="mt-1 text-center text-[8px] font-bold text-slate-800">
              PRECINTO OBLIGATORIO · PROPIEDAD EN CUSTODIA FORMAL
            </div>
          </div>

          <p className="mt-4 text-xs text-slate-500 text-center max-w-xs">
            Formato optimizado para impresión térmica directa en etiquetas adhesivas Zebra / Brother.
          </p>

          <div className="mt-6 flex w-full justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Cerrar
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-md bg-[#0F172A] px-4 py-2 text-xs font-bold text-white shadow hover:bg-[#1E293B] transition"
            >
              <Printer className="h-4 w-4" />
              <span>Enviar a Impresora Térmica</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
