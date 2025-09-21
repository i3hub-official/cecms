// src/app/providers/NotificationProvider.tsx
'use client';

import { ReactNode } from 'react';
import NotificationContainer from '@/app/components/ui/NotificationContainer';

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  return (
    <>
      {children}
      <NotificationContainer />
    </>
  );
}