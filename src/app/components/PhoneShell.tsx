import React from 'react';
import { Outlet } from 'react-router';

export function PhoneShell() {
  return (
    <div
      className="min-h-screen w-full flex items-start justify-center"
      style={{ background: '#E0E0E0' }}
    >
      <div
        className="relative w-full max-w-[430px] min-h-screen flex flex-col overflow-hidden shadow-2xl"
        style={{ background: '#F7F7F7' }}
      >
        <Outlet />
      </div>
    </div>
  );
}
