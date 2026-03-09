import React, { useState } from 'react';
import { ChevronLeft, CheckCircle } from 'lucide-react';
import { useAppStore } from '../context/AppStore';

export function CreateMatch() {
  const { navigate, addMatch } = useAppStore();

  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [pricingMode, setPricingMode] = useState<'field' | 'player'>('field');
  const [fieldCost, setFieldCost] = useState('');
  const [pricePerPlayer, setPricePerPlayer] = useState('');
  const [paymentEmail, setPaymentEmail] = useState('');
  const [registrationPin, setRegistrationPin] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('16');
  const [fields, setFields] = useState('2');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Match name is required';
    if (!date) e.date = 'Date is required';
    if (!time) e.time = 'Time is required';
    if (pricingMode === 'field' && (!fieldCost || Number(fieldCost) <= 0)) e.fieldCost = 'Field cost must be greater than 0';
    if (pricingMode === 'player' && (!pricePerPlayer || Number(pricePerPlayer) <= 0)) e.pricePerPlayer = 'Price per player must be greater than 0';
    if (!paymentEmail.trim()) e.paymentEmail = 'Payment email is required';
    if (!/^\d{4}$/.test(registrationPin)) e.registrationPin = 'PIN must be exactly 4 digits';
    if (!maxPlayers || Number(maxPlayers) < 2) e.maxPlayers = 'Minimum 2 players';
    if (!fields || Number(fields) < 1) e.fields = 'Minimum 1 field';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = () => {
    if (!validate()) return;
    addMatch({
      name: name.trim(),
      date, time, pricingMode,
      fieldCost: pricingMode === 'field' ? Number(fieldCost) : 0,
      pricePerPlayer: pricingMode === 'player' ? Number(pricePerPlayer) : 0,
      paymentEmail: paymentEmail.trim(),
      registrationPin,
      maxPlayers: Number(maxPlayers),
      fields: Number(fields),
    });
    setSuccess(true);
    setTimeout(() => navigate({ name: 'list' }), 1500);
  };

  const inputClass = 'w-full rounded-xl px-4 py-3.5 outline-none text-base transition-all';
  const inputStyle = { background: '#FFFFFF', border: '1.5px solid #EAEAEA', color: '#111', fontWeight: 500 };
  const inputErrorStyle = { ...inputStyle, border: '1.5px solid #ef4444' };
  const labelStyle = { color: '#111', fontWeight: 600, fontSize: 14 };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: '#F7F7F7' }}>
        <div className="rounded-full flex items-center justify-center mb-4" style={{ width: 80, height: 80, background: '#F0FAF4' }}>
          <CheckCircle size={44} color="#1DB954" />
        </div>
        <h2 style={{ fontWeight: 800, fontSize: 24, color: '#111' }}>Match Created!</h2>
        <p style={{ color: '#888', marginTop: 8 }}>Redirecting to matches…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#F7F7F7' }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-6" style={{ background: 'linear-gradient(135deg, #0F5132 0%, #1a7a4a 100%)' }}>
        <button onClick={() => navigate({ name: 'list' })} className="flex items-center gap-1 mb-4 opacity-80 active:opacity-60 transition-opacity">
          <ChevronLeft size={20} color="white" />
          <span style={{ color: 'white', fontWeight: 600, fontSize: 15 }}>Back</span>
        </button>
        <h1 style={{ color: 'white', fontWeight: 800, fontSize: 26, lineHeight: 1.2 }}>Create Match</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 4 }}>Set up your next game</p>
      </div>

      {/* Form */}
      <div className="flex-1 px-4 py-6 space-y-5 pb-10">
        <div className="space-y-2">
          <label style={labelStyle}>Match Name</label>
          <input className={inputClass} style={errors.name ? inputErrorStyle : inputStyle} placeholder="e.g. Soccer Friday" value={name} onChange={e => setName(e.target.value)} />
          {errors.name && <p style={{ color: '#ef4444', fontSize: 12 }}>{errors.name}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label style={labelStyle}>Date</label>
            <input type="date" className={inputClass} style={errors.date ? inputErrorStyle : inputStyle} value={date} onChange={e => setDate(e.target.value)} />
            {errors.date && <p style={{ color: '#ef4444', fontSize: 12 }}>{errors.date}</p>}
          </div>
          <div className="space-y-2">
            <label style={labelStyle}>Time</label>
            <input type="time" className={inputClass} style={errors.time ? inputErrorStyle : inputStyle} value={time} onChange={e => setTime(e.target.value)} />
            {errors.time && <p style={{ color: '#ef4444', fontSize: 12 }}>{errors.time}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <label style={labelStyle}>Pricing Mode</label>
          <div className="grid grid-cols-2 rounded-xl p-1" style={{ background: '#EAEAEA' }}>
            <button onClick={() => setPricingMode('field')} className="rounded-lg py-3 transition-all" style={{ background: pricingMode === 'field' ? '#0F5132' : 'transparent', color: pricingMode === 'field' ? '#fff' : '#555', fontWeight: 700, fontSize: 14 }}>
              Cost per Field
            </button>
            <button onClick={() => setPricingMode('player')} className="rounded-lg py-3 transition-all" style={{ background: pricingMode === 'player' ? '#0F5132' : 'transparent', color: pricingMode === 'player' ? '#fff' : '#555', fontWeight: 700, fontSize: 14 }}>
              Cost per Player
            </button>
          </div>
        </div>

        {pricingMode === 'field' ? (
          <div className="space-y-2">
            <label style={labelStyle}>Field Cost ($) <span style={{ color: '#888', fontWeight: 400 }}>per field</span></label>
            <input type="number" className={inputClass} style={errors.fieldCost ? inputErrorStyle : inputStyle} placeholder="e.g. 66" value={fieldCost} onChange={e => setFieldCost(e.target.value)} />
            {errors.fieldCost && <p style={{ color: '#ef4444', fontSize: 12 }}>{errors.fieldCost}</p>}
          </div>
        ) : (
          <div className="space-y-2">
            <label style={labelStyle}>Price per Player ($)</label>
            <input type="number" className={inputClass} style={errors.pricePerPlayer ? inputErrorStyle : inputStyle} placeholder="e.g. 10" value={pricePerPlayer} onChange={e => setPricePerPlayer(e.target.value)} />
            {errors.pricePerPlayer && <p style={{ color: '#ef4444', fontSize: 12 }}>{errors.pricePerPlayer}</p>}
          </div>
        )}

        <div className="space-y-2">
          <label style={labelStyle}>Payment Email</label>
          <input type="email" className={inputClass} style={errors.paymentEmail ? inputErrorStyle : inputStyle} placeholder="e.g. yourname@email.com" value={paymentEmail} onChange={e => setPaymentEmail(e.target.value)} />
          {errors.paymentEmail && <p style={{ color: '#ef4444', fontSize: 12 }}>{errors.paymentEmail}</p>}
        </div>

        <div className="space-y-2">
          <label style={labelStyle}>Registration PIN (4 digits)</label>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            className={inputClass}
            style={errors.registrationPin ? inputErrorStyle : inputStyle}
            placeholder="e.g. 1234"
            value={registrationPin}
            onChange={e => setRegistrationPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          />
          {errors.registrationPin && <p style={{ color: '#ef4444', fontSize: 12 }}>{errors.registrationPin}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label style={labelStyle}>Max Players</label>
            <input type="number" className={inputClass} style={errors.maxPlayers ? inputErrorStyle : inputStyle} placeholder="16" value={maxPlayers} onChange={e => setMaxPlayers(e.target.value)} />
            {errors.maxPlayers && <p style={{ color: '#ef4444', fontSize: 12 }}>{errors.maxPlayers}</p>}
          </div>
          <div className="space-y-2">
            <label style={labelStyle}>Number of Fields</label>
            <input type="number" className={inputClass} style={errors.fields ? inputErrorStyle : inputStyle} placeholder="2" value={fields} onChange={e => setFields(e.target.value)} />
            {errors.fields && <p style={{ color: '#ef4444', fontSize: 12 }}>{errors.fields}</p>}
          </div>
        </div>

        <button onClick={handleCreate} className="w-full rounded-2xl py-4 mt-2 transition-all active:scale-95" style={{ background: '#1DB954', color: '#fff', fontWeight: 800, fontSize: 17 }}>
          Create Match ⚽
        </button>
      </div>
    </div>
  );
}
