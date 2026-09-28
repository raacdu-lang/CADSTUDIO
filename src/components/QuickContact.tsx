import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { StudioConfig, ContactInquiry } from '../types';
import { addActivityLog } from '../services/storageService';
import { DiscoverySessionBookingWidget } from './DiscoverySessionBookingWidget';
import {
  Send,
  MessageCircle,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  CalendarCheck,
  FileText,
} from 'lucide-react';

interface QuickContactProps {
  config: StudioConfig;
}

export const QuickContact: React.FC<QuickContactProps> = ({ config }) => {
  const [activeTab, setActiveTab] = useState<'discovery' | 'quote'>('discovery');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    shootType: 'bodas',
    date: '',
    budgetRange: '2.500€ - 5.000€',
    message: '',
  });

  const [submitted, setSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const shootTypes = [
    { id: 'bodas', label: 'Bodas de Destino & Eventos', estimate: 'Desde 2.900€' },
    { id: 'gastronomia', label: 'Gastronomía & Espacios Culinarios', estimate: 'Desde 1.400€' },
    { id: 'arquitectura', label: 'Arquitectura & Interiorismo', estimate: 'Desde 1.800€' },
    { id: 'retrato', label: 'Retrato de Autor & Editorial', estimate: 'Desde 950€' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);

      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });

      addActivityLog({
        type: 'contact',
        title: `Nueva consulta de presupuesto: ${formData.name}`,
        description: `Interés en "${formData.shootType}" con presupuesto de ${formData.budgetRange}.`,
        clientName: formData.name,
      });
    }, 600);
  };

  const selectedShoot = shootTypes.find((s) => s.id === formData.shootType);

  const handleWhatsAppDirect = () => {
    const text = encodeURIComponent(
      `Hola ${config.photographerName}, me interesa consultar disponibilidad para un proyecto de tipo ${selectedShoot?.label || 'Fotografía/Video'}. Mi nombre es ${formData.name || 'Cliente'}.`
    );
    window.open(`https://wa.me/${config.whatsapp.replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
  };

  return (
    <section id="contact" className="py-16 sm:py-24 border-b border-[#2B7574]/25 relative bg-[#E2E2E0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Studio Contact Coordinates */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono-data text-[#0E2931]/70 mb-2">
                <span className="text-[#2B7574] font-bold">AGENDA DEL ESTUDIO & CONTRATACIONES</span>
                <span aria-hidden="true">·</span>
                <span>GOOGLE CALENDAR EN TIEMPO REAL</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#0E2931] tracking-tight">
                Sesiones de Descubrimiento & Contacto
              </h2>
            </div>

            <p className="text-sm text-[#0E2931]/80 font-light leading-relaxed">
              Agende una sesión de descubrimiento de 45 minutos directamente seleccionando el día preferido y proponiendo su horario con Mateo Valenzuela en Culiacán, o solicite un presupuesto a medida para su evento o producción comercial.
            </p>

            {/* Direct Studio Data Points (Zero Pill discipline) */}
            <div className="space-y-4 pt-4 border-t border-[#2B7574]/25 text-xs">
              <div className="flex items-center gap-3 text-[#0E2931]">
                <div className="p-2.5 rounded-lg bg-white border border-[#2B7574]/30 text-[#2B7574] shrink-0 shadow-xs">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[10px] font-mono-data text-[#0E2931]/60 font-semibold">CORREO DIRECTO</span>
                  <a href={`mailto:${config.email}`} className="hover:text-[#2B7574] transition-colors font-medium">
                    {config.email}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[#0E2931]">
                <div className="p-2.5 rounded-lg bg-white border border-[#2B7574]/30 text-[#2B7574] shrink-0 shadow-xs">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[10px] font-mono-data text-[#0E2931]/60 font-semibold">ATENCIÓN TELEFÓNICA</span>
                  <a href={`tel:${config.phone}`} className="hover:text-[#2B7574] transition-colors font-medium">
                    {config.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[#0E2931]">
                <div className="p-2.5 rounded-lg bg-white border border-[#2B7574]/30 text-[#2B7574] shrink-0 shadow-xs">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[10px] font-mono-data text-[#0E2931]/60 font-semibold">ESTUDIO BASE</span>
                  <span className="font-medium">{config.location}</span>
                </div>
              </div>
            </div>

            {/* Instant WhatsApp Shortcut */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleWhatsAppDirect}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white hover:bg-[#2B7574]/15 border border-[#2B7574]/50 text-[#0E2931] text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <MessageCircle className="w-4 h-4 text-[#2B7574]" />
                <span>Escribir directamente por WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Right Column: Google Calendar Booking & Fast Form */}
          <div className="lg:col-span-7 space-y-4">
            {/* View Mode Tabs */}
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white border border-[#2B7574]/30 shadow-xs">
              <button
                type="button"
                onClick={() => setActiveTab('discovery')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'discovery'
                    ? 'bg-[#2B7574] text-[#E2E2E0] shadow-sm'
                    : 'text-[#0E2931]/80 hover:text-[#0E2931] hover:bg-[#2B7574]/10'
                }`}
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                <span>Sesión de Descubrimiento (Calendario por Días)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('quote')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'quote'
                    ? 'bg-[#2B7574] text-[#E2E2E0] shadow-sm'
                    : 'text-[#0E2931]/80 hover:text-[#0E2931] hover:bg-[#2B7574]/10'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Solicitud de Presupuesto Directo</span>
              </button>
            </div>

            {/* TAB 1: Discovery Session with Google Calendar */}
            {activeTab === 'discovery' && (
              <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#2B7574]/30 shadow-xl relative text-[#0E2931]">
                <DiscoverySessionBookingWidget config={config} />
              </div>
            )}

            {/* TAB 2: Fast Quote Request Form */}
            {activeTab === 'quote' && (
              <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#2B7574]/30 shadow-xl relative overflow-hidden text-[#0E2931]">
                {submitted ? (
                  <div className="py-12 text-center space-y-4 animate-in fade-in duration-300">
                    <div className="w-14 h-14 mx-auto rounded-full bg-[#2B7574]/20 border border-[#2B7574] flex items-center justify-center text-[#2B7574]">
                      <CheckCircle2 className="w-7 h-7 text-[#2B7574]" />
                    </div>
                    <h3 className="font-display text-2xl font-bold text-[#0E2931]">
                      ¡Solicitud de Presupuesto Recibida!
                    </h3>
                    <p className="text-xs text-[#0E2931]/80 max-w-md mx-auto leading-relaxed">
                      Muchas gracias, <strong className="text-[#0E2931]">{formData.name}</strong>. Mateo Valenzuela y el equipo de CADSTUDIO revisarán los requerimientos técnicos y le enviarán una propuesta en menos de 24 horas.
                    </p>
                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setFormData({
                          name: '',
                          email: '',
                          phone: '',
                          shootType: 'bodas',
                          date: '',
                          budgetRange: '2.500€ - 5.000€',
                          message: '',
                        });
                      }}
                      className="mt-4 px-5 py-2.5 text-xs font-semibold text-[#E2E2E0] bg-[#2B7574] hover:bg-[#225e5d] rounded-xl shadow-sm"
                    >
                      Enviar otra consulta
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-mono-data text-[#0E2931]/75 mb-1 font-semibold">
                          NOMBRE Y APELLIDO *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="ej. Elena Martín"
                          className="w-full px-3.5 py-2.5 rounded-lg bg-[#E2E2E0]/40 border border-[#2B7574]/40 text-[#0E2931] text-xs focus:outline-none focus:border-[#2B7574]"
                        />
                      </div>

                      <div>
                        <label className="block font-mono-data text-[#0E2931]/75 mb-1 font-semibold">
                          EMAIL DE CONTACTO *
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="elena@marca.com"
                          className="w-full px-3.5 py-2.5 rounded-lg bg-[#E2E2E0]/40 border border-[#2B7574]/40 text-[#0E2931] text-xs focus:outline-none focus:border-[#2B7574]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-mono-data text-[#0E2931]/75 mb-1 font-semibold">
                          TIPO DE PRODUCCIÓN
                        </label>
                        <select
                          value={formData.shootType}
                          onChange={(e) => setFormData({ ...formData, shootType: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-lg bg-[#E2E2E0]/40 border border-[#2B7574]/40 text-[#0E2931] text-xs focus:outline-none focus:border-[#2B7574]"
                        >
                          {shootTypes.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.label} ({t.estimate})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-mono-data text-[#0E2931]/75 mb-1 font-semibold">
                          FECHA ESTIMADA DEL RODAJE
                        </label>
                        <input
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-lg bg-[#E2E2E0]/40 border border-[#2B7574]/40 text-[#0E2931] text-xs focus:outline-none focus:border-[#2B7574]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-mono-data text-[#0E2931]/75 mb-1 font-semibold">
                        RANGO DE PRESUPUESTO
                      </label>
                      <select
                        value={formData.budgetRange}
                        onChange={(e) => setFormData({ ...formData, budgetRange: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-lg bg-[#E2E2E0]/40 border border-[#2B7574]/40 text-[#0E2931] text-xs focus:outline-none focus:border-[#2B7574]"
                      >
                        <option value="1.000€ - 2.500€">1.000€ - 2.500€ (Retrato / Sesión corta)</option>
                        <option value="2.500€ - 5.000€">2.500€ - 5.000€ (Editorial / Campaña digital)</option>
                        <option value="5.000€ - 10.000€">5.000€ - 10.000€ (Bodas de destino / Gran producción)</option>
                        <option value="10.000€+">Más de 10.000€ (Producción internacional completa)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-mono-data text-[#0E2931]/75 mb-1 font-semibold">
                        DETALLES DEL PROYECTO & LOCACIÓN *
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Cuéntenos sobre el concepto visual, fechas, locaciones y entregables esperados..."
                        className="w-full p-3 rounded-lg bg-[#E2E2E0]/40 border border-[#2B7574]/40 text-[#0E2931] text-xs focus:outline-none focus:border-[#2B7574] leading-relaxed"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3.5 text-xs font-semibold text-[#E2E2E0] bg-[#2B7574] hover:bg-[#225e5d] disabled:opacity-50 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-[#2B7574]/30"
                      >
                        <Send className="w-4 h-4" />
                        <span>{isSubmitting ? 'Enviando solicitud...' : 'Enviar Solicitud de Presupuesto Inmediato'}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
