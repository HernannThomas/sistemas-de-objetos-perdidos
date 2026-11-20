import React from 'react';
import {
  X,
  Printer,
  QrCode,
  Barcode,
  Radio,
  MapPin,
  Calendar,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { motion } from 'motion/react';
import { CustodyItem } from '../types/custody';

interface AssetTagModalProps {
  item: CustodyItem;
  isOpen: boolean;
  onClose: () => void;
}

export const AssetTagModal: React.FC<AssetTagModalProps> = ({ item, isOpen, onClose }) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-xs">
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 15 }}
        className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200"
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#0F172A] px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/30 text-blue-400">
              <Barcode className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold uppercase tracking-wider">
                Rótulo Físico de Custodia y RFID
              </h3>
              <p className="font-mono text-xs text-slate-300">
                Impresión de precinto para bolsa o casillero
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

        {/* Vista previa imprimible */}
        <div className="p-6">
          <div className="printable-asset-tag rounded-xl border-2 border-dashed border-slate-800 bg-white p-5 text-slate-900 font-mono shadow-sm">
            {/* Header del Rótulo */}
            <div className="border-b-2 border-slate-900 pb-2 mb-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold block tracking-wider uppercase">
                  SENA · REGIONAL HUILA · CIES
                </span>
                <span className="text-xs font-black tracking-tight">
                  SISTEMA DE OBJETOS PERDIDOS (SOP)
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-bold uppercase block">CASILLERO</span>
                <span className="text-base font-black bg-slate-900 text-white px-2 py-0.5 rounded">
                  {item.location.lockerNumber}
                </span>
              </div>
            </div>

            {/* Código de barras simulado */}
            <div className="text-center my-3 bg-slate-50 p-2 rounded border border-slate-200">
              <div className="h-12 w-full flex items-center justify-center tracking-widest text-2xl font-bold font-mono">
                ||| | || |||| | ||| || |||| | ||| |
              </div>
              <span className="text-sm font-black tracking-widest block mt-1">
                {item.trackingCode}
              </span>
            </div>

            {/* Datos Técnicos del Objeto */}
            <div className="grid grid-cols-2 gap-2 text-xs border-y border-slate-300 py-2.5 my-2">
              <div>
                <span className="text-[10px] text-slate-500 block">DESCRIPCIÓN:</span>
                <span className="font-bold block truncate">{item.title}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">MARCA / MODELO:</span>
                <span className="font-bold block truncate">{item.brand} {item.model || ''}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">ZONA / BANDEJA:</span>
                <span className="font-bold block">{item.location.zone} ({item.location.binNumber})</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">PRECINTO / SEAL:</span>
                <span className="font-bold block">{item.tamperSealNumber}</span>
              </div>
            </div>

            {/* RFID y Oficial */}
            <div className="flex items-center justify-between text-[10px] text-slate-600 pt-1">
              <span className="flex items-center gap-1 font-bold">
                <Radio className="h-3 w-3 text-blue-600" />
                RFID: {item.rfidTagId}
              </span>
              <span>Oficial: {item.intakeOfficer.badge}</span>
            </div>
          </div>
        </div>

        {/* Pie de Acciones */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition cursor-pointer active:scale-95"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimir Etiqueta Térmica</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
