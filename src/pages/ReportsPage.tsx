import { useState, useEffect, useCallback } from 'react';
import { useCompany } from '@/contexts';
import { ticketsApi } from '@/api';
import { Button, Card, Select, Badge, EmptyState } from '@/components/ui';
import type { Ticket, TicketStatus } from '@/types';
import { getErrorMessage } from '@/api/client';

const statusConfig: Record<TicketStatus, { label: string; variant: 'default' | 'success' | 'error' }> = {
  OPEN: { label: 'Abierto', variant: 'default' },
  CLOSED: { label: 'Cerrado', variant: 'success' },
  CANCELLED: { label: 'Cancelado', variant: 'error' },
};

export function ReportsPage() {
  const { currentCompany, currentBranch } = useCompany();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<TicketStatus | ''>('');

  const fetchTickets = useCallback(async () => {
    if (!currentCompany || !currentBranch) return;
    setIsLoading(true);
    setError(null);
    try {
      const params: { status?: string } = {};
      if (filterStatus) {
        params.status = filterStatus;
      }
      const data = await ticketsApi.list(currentCompany.id, currentBranch.id, params);
      setTickets(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany, currentBranch, filterStatus]);

  useEffect(() => {
    if (currentCompany && currentBranch) {
      fetchTickets();
    }
  }, [currentCompany, currentBranch, fetchTickets]);

  if (!currentCompany || !currentBranch) {
    return (
      <div className="p-6">
        <EmptyState
          title="Selecciona empresa y sede"
          description="Debes seleccionar una empresa y sede desde el Dashboard."
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-[var(--ink-primary)]">Reportes</h1>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <Select
            options={[
              { value: '', label: 'Todos los estados' },
              { value: 'OPEN', label: 'Abiertos' },
              { value: 'CLOSED', label: 'Cerrados' },
              { value: 'CANCELLED', label: 'Cancelados' },
            ]}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as TicketStatus | '')}
          />
          <Button variant="secondary" onClick={fetchTickets} size="sm">
            Actualizar
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 text-sm text-[var(--error)] bg-[var(--error)]/10 rounded-md">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full" />
        </div>
      ) : tickets.length === 0 ? (
        <Card padding>
          <EmptyState
            title="Sin tickets"
            description="No hay tickets para los filtros seleccionados."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const paidAmount = ticket.payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
            const pendingAmount = parseFloat(ticket.total) - paidAmount;

            return (
              <Card key={ticket.id} padding>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-lg font-semibold text-[var(--ink-primary)]">#{ticket.ticketNumber}</p>
                      <p className="text-xs text-[var(--ink-tertiary)]">
                        {new Date(ticket.openedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--ink-secondary)]">
                        Abrió: {new Date(ticket.openedAt).toLocaleTimeString()}
                      </p>
                      {ticket.closedAt && (
                        <p className="text-sm text-[var(--ink-secondary)]">
                          Cerró: {new Date(ticket.closedAt).toLocaleTimeString()}
                        </p>
                      )}
                      <p className="text-sm text-[var(--ink-tertiary)] mt-1">
                        {ticket.items?.length || 0} ítems
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-[var(--ink-primary)]">
                        ${parseFloat(ticket.total).toFixed(2)}
                      </p>
                      {ticket.status === 'CLOSED' && (
                        <p className="text-xs text-[var(--success)]">
                          Pagado: ${paidAmount.toFixed(2)}
                        </p>
                      )}
                      {ticket.status === 'OPEN' && pendingAmount > 0 && (
                        <p className="text-xs text-[var(--warning)]">
                          Pendiente: ${pendingAmount.toFixed(2)}
                        </p>
                      )}
                    </div>
                    <Badge variant={statusConfig[ticket.status].variant}>
                      {statusConfig[ticket.status].label}
                    </Badge>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card padding>
          <p className="text-sm text-[var(--ink-secondary)] mb-1">Total Tickets</p>
          <p className="text-2xl font-semibold text-[var(--ink-primary)]">{tickets.length}</p>
        </Card>
        <Card padding>
          <p className="text-sm text-[var(--ink-secondary)] mb-1">Monto Total</p>
          <p className="text-2xl font-semibold text-[var(--ink-primary)]">
            ${tickets.reduce((sum, t) => sum + parseFloat(t.total), 0).toFixed(2)}
          </p>
        </Card>
        <Card padding>
          <p className="text-sm text-[var(--ink-secondary)] mb-1">Tickets Abiertos</p>
          <p className="text-2xl font-semibold text-[var(--ink-primary)]">
            {tickets.filter((t) => t.status === 'OPEN').length}
          </p>
        </Card>
      </div>
    </div>
  );
}