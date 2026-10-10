'use client';
import { z } from 'zod';

export type TicketStatus = 'Abierto' | 'En Progreso' | 'Cerrado';

export const ticketSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  status: z.enum(['Abierto', 'En Progreso', 'Cerrado']),
  bodega: z.string(),
  cuenta: z.string(),
  sistema: z.string(),
  createdAt: z.object({
    seconds: z.number(),
    nanoseconds: z.number(),
  }),
  creatorEmail: z.string(),
  creatorName: z.string(),
  creatorRole: z.string(),
  assignee: z.string().optional(),
  closingComment: z.string().optional(),
  closedAt: z
    .object({
      seconds: z.number(),
      nanoseconds: z.number(),
    })
    .optional(),
  closedBy: z.string().optional(),
  rootCause: z.string().optional(),
});

export type TicketData = z.infer<typeof ticketSchema>;

export type UserRole = 'admin' | 'user';

export const userSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  email: z.string(),
  role: z.enum(['admin', 'user']),
  createdAt: z.object({
    seconds: z.number(),
    nanoseconds: z.number(),
  }),
  photoURL: z.string().optional(),
});

export type User = z.infer<typeof userSchema>;

export const bodegaSchema = z.object({
  id: z.string(),
  name: z.string(),
});
export type BodegaData = z.infer<typeof bodegaSchema>;

export const cuentaSchema = z.object({
  id: z.string(),
  name: z.string(),
  bodegaId: z.string(),
  sistemas: z.array(z.string()).optional(), // Array of sistema IDs
});
export type CuentaData = z.infer<typeof cuentaSchema>;

export const sistemaSchema = z.object({
  id: z.string(),
  name: z.string(),
});
export type SistemaData = z.infer<typeof sistemaSchema>;

export const rootCauseSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdBy: z.string(),
});
export type RootCauseData = z.infer<typeof rootCauseSchema>;
