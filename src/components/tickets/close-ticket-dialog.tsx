'use client';
import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { RootCauseData } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Input } from '../ui/input';

interface CloseTicketDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: { comment: string, rootCause: string, newRootCause?: string }) => void;
  ticketTitle: string;
  rootCauses: RootCauseData[];
}

export function CloseTicketDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  ticketTitle,
  rootCauses,
}: CloseTicketDialogProps) {
  const [comment, setComment] = useState('');
  const [selectedRootCause, setSelectedRootCause] = useState('');
  const [newRootCause, setNewRootCause] = useState('');

  const isNewRootCause = selectedRootCause === 'new';
  
  const canSubmit = comment.trim() && (isNewRootCause ? newRootCause.trim() : selectedRootCause);

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
        comment,
        rootCause: selectedRootCause,
        newRootCause
    });
  };
  
  useEffect(() => {
    if (isOpen) {
        setComment('');
        setSelectedRootCause('');
        setNewRootCause('');
    }
  }, [isOpen]);

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cerrar el Ticket: "{ticketTitle}"</AlertDialogTitle>
          <AlertDialogDescription>
            Añade un comentario y clasifica la causa raíz (Root Cause) para documentar la solución aplicada.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4">
            <div className="grid w-full gap-1.5">
                <Label htmlFor="comment">Comentario de Cierre</Label>
                <Textarea 
                    id="comment"
                    placeholder="Describe la solución aplicada y el resultado final..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[100px]"
                />
            </div>
             <div className="grid w-full gap-1.5">
                <Label htmlFor="rootCause">Causa Raíz (Root Cause)</Label>
                <Select value={selectedRootCause} onValueChange={setSelectedRootCause}>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecciona o crea una causa raíz..." />
                    </SelectTrigger>
                    <SelectContent>
                        {rootCauses.map(rc => (
                            <SelectItem key={rc.id} value={rc.name}>
                                {rc.name}
                            </SelectItem>
                        ))}
                        <SelectItem value="new">
                            + Crear nueva causa raíz
                        </SelectItem>
                    </SelectContent>
                </Select>
             </div>
             {isNewRootCause && (
                <div className="grid w-full gap-1.5">
                    <Label htmlFor="newRootCause">Nueva Causa Raíz</Label>
                    <Input 
                        id="newRootCause"
                        placeholder="Ej: Falla de configuración en servidor"
                        value={newRootCause}
                        onChange={(e) => setNewRootCause(e.target.value)}
                    />
                </div>
             )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleSubmit} disabled={!canSubmit}>
            Confirmar Cierre
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
