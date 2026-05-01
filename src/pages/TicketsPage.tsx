import { useState, useEffect, useCallback } from 'react';
import { useCompany, useTicketStore } from '@/contexts';
import { Button, Card, Input, Select, Modal, Badge, EmptyState } from '@/components/ui';
import type { TicketStatus } from '@/types';
import Swal from 'sweetalert2';

const statusLabels: Record<TicketStatus, { label: string; variant: 'default' | 'success' | 'error' }> = {
  OPEN: { label: 'Abierto', variant: 'default' },
  CLOSED: { label: 'Cerrado', variant: 'success' },
  CANCELLED: { label: 'Cancelado', variant: 'error' },
};

export function TicketsPage() {
  const { currentCompany, currentBranch } = useCompany();
  const {
    activeTicket,
    resources,
    catalogItems,
    isLoading,
    error,
    fetchActiveTicket,
    fetchResources,
    fetchCatalogItems,
    createTicket,
    addRental,
    addCatalogItem,
    addManualItem,
    addExtra,
    registerPayment,
    closeTicket,
    cancelItem,
    cancelTicket,
    cancelTicketWithReversal,
    clearError,
  } = useTicketStore();

  const [showAddRentalModal, setShowAddRentalModal] = useState(false);
  const [showAddCatalogModal, setShowAddCatalogModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [reservedMinutes, setReservedMinutes] = useState('60');
  const [selectedCatalogItemId, setSelectedCatalogItemId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'TRANSFER' | 'DIGITAL_WALLET' | 'OTHER'>('CASH');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    if (!currentCompany || !currentBranch) return;
    await Promise.all([
      fetchActiveTicket(currentCompany.id, currentBranch.id),
      fetchResources(currentCompany.id, currentBranch.id),
      fetchCatalogItems(currentCompany.id, currentBranch.id),
    ]);
  }, [currentCompany, currentBranch, fetchActiveTicket, fetchResources, fetchCatalogItems]);

  useEffect(() => {
    if (currentCompany && currentBranch) {
      loadData();
    }
  }, [currentCompany, currentBranch, loadData]);

  const handleCreateTicket = async () => {
    if (!currentCompany || !currentBranch) return;
    await createTicket(currentCompany.id, currentBranch.id);
  };

  const handleAddRental = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany || !currentBranch || !activeTicket) return;
    setIsSubmitting(true);
    await addRental(currentCompany.id, currentBranch.id, activeTicket.id, selectedResourceId, parseInt(reservedMinutes, 10));
    setIsSubmitting(false);
    setShowAddRentalModal(false);
    setSelectedResourceId('');
    setReservedMinutes('60');
  };

  const handleAddCatalogItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany || !currentBranch || !activeTicket) return;
    setIsSubmitting(true);
    await addCatalogItem(currentCompany.id, currentBranch.id, activeTicket.id, selectedCatalogItemId);
    setIsSubmitting(false);
    setShowAddCatalogModal(false);
    setSelectedCatalogItemId('');
  };

  const handleAddManualItem = async () => {
    if (!currentCompany || !currentBranch || !activeTicket) return;
    const description = prompt('Descripción del ítem:');
    if (!description) return;
    const price = prompt('Precio:');
    if (!price) return;
    await addManualItem(currentCompany.id, currentBranch.id, activeTicket.id, description, price);
  };

  const handleAddExtra = async () => {
    if (!currentCompany || !currentBranch || !activeTicket) return;
    const description = prompt('Descripción del extra:');
    if (!description) return;
    const amount = prompt('Monto:');
    if (!amount) return;
    await addExtra(currentCompany.id, currentBranch.id, activeTicket.id, description, amount);
  };

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany || !currentBranch || !activeTicket) return;
    setIsSubmitting(true);
    await registerPayment(currentCompany.id, currentBranch.id, activeTicket.id, paymentMethod, parseFloat(paymentAmount));
    setIsSubmitting(false);
    setShowPaymentModal(false);
    setPaymentAmount('');
  };

  const handleCloseTicket = async () => {
    if (!currentCompany || !currentBranch || !activeTicket) return;

    const activeRentals = activeTicket.items?.filter(
      (item) => item.rentalSession && ['RESERVED', 'IN_USE'].includes(item.rentalSession.status)
    );

    if (activeRentals && activeRentals.length > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No se puede cerrar',
        text: `Hay ${activeRentals.length} alquiler(es) activos. Finalizá los alquileres primero.`,
      });
      return;
    }

    const result = await Swal.fire({
      icon: 'question',
      title: '¿Cerrar el ticket?',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar',
      cancelButtonText: 'Cancelar',
    });
    if (!result.isConfirmed) return;
    await closeTicket(currentCompany.id, currentBranch.id, activeTicket.id);
  };

  const handleCancelItem = async (itemId: string) => {
    if (!currentCompany || !currentBranch || !activeTicket) return;
    const result = await Swal.fire({
      icon: 'question',
      title: '¿Cancelar este ítem?',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No',
    });
    if (!result.isConfirmed) return;
    await cancelItem(currentCompany.id, currentBranch.id, activeTicket.id, itemId);
  };

  const handleCancelTicket = async () => {
    if (!currentCompany || !currentBranch || !activeTicket) return;
    const result = await Swal.fire({
      icon: 'warning',
      title: '¿Cancelar el ticket?',
      text: 'Esta acción no se puede deshacer.',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No',
    });
    if (!result.isConfirmed) return;
    await cancelTicket(currentCompany.id, currentBranch.id, activeTicket.id);
  };

  const handleCancelTicketWithReversal = async () => {
    if (!currentCompany || !currentBranch || !activeTicket) return;
    const result = await Swal.fire({
      icon: 'warning',
      title: '¿Cancelar con reverso de pagos?',
      text: 'Esta acción no se puede deshacer.',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No',
    });
    if (!result.isConfirmed) return;
    await cancelTicketWithReversal(currentCompany.id, currentBranch.id, activeTicket.id);
  };

  const hasActiveRentals = activeTicket?.items?.some(
    (item) => item.rentalSession && ['RESERVED', 'IN_USE'].includes(item.rentalSession.status)
  );

  const paidAmount = activeTicket?.payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
  const pendingAmount = activeTicket ? parseFloat(activeTicket.total) - paidAmount : 0;

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-[var(--ink-primary)]">Tickets</h1>
        {!activeTicket && (
          <Button onClick={handleCreateTicket}>
            Abrir Ticket
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 text-sm text-[var(--error)] bg-[var(--error)]/10 rounded-md flex items-center justify-between">
          <span>{error}</span>
          <button onClick={clearError} className="text-[var(--error)]">×</button>
        </div>
      )}

      {activeTicket ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Card padding>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--ink-primary)]">
                    Ticket #{activeTicket.ticketNumber}
                  </h2>
                  <p className="text-xs text-[var(--ink-tertiary)]">
                    Abierto: {new Date(activeTicket.openedAt).toLocaleString()}
                  </p>
                </div>
                <Badge variant={statusLabels[activeTicket.status].variant}>
                  {statusLabels[activeTicket.status].label}
                </Badge>
              </div>

              {activeTicket.status === 'OPEN' && (
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button onClick={() => setShowAddRentalModal(true)} size="sm">+ Alquiler</Button>
                  <Button variant="secondary" onClick={() => setShowAddCatalogModal(true)} size="sm">+ Producto</Button>
                  <Button variant="secondary" onClick={handleAddManualItem} size="sm">+ Manual</Button>
                  <Button variant="secondary" onClick={handleAddExtra} size="sm">+ Extra</Button>
                </div>
              )}

              <div className="space-y-2">
                {activeTicket.items?.length === 0 ? (
                  <p className="text-sm text-[var(--ink-tertiary)] text-center py-4">
                    Sin ítems agregados
                  </p>
                ) : (
                  activeTicket.items?.map((item) => (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-[var(--border-subtle)] rounded-md gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--ink-primary)] truncate">{item.description}</p>
                        <p className="text-xs text-[var(--ink-tertiary)]">
                          {item.type} · {item.quantity} × ${parseFloat(item.unitPrice).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm font-medium">${parseFloat(item.totalPrice).toFixed(2)}</span>
                        {activeTicket.status === 'OPEN' && (
                          <button onClick={() => handleCancelItem(item.id)} className="text-[var(--error)] hover:text-[var(--error)]/80 p-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {activeTicket.status === 'OPEN' && pendingAmount > 0 && (
              <Card padding>
                <h3 className="text-sm font-medium text-[var(--ink-primary)] mb-3">Pagos</h3>
                {activeTicket.payments?.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
                    <span className="text-sm text-[var(--ink-secondary)]">
                      {payment.method} - {new Date(payment.createdAt).toLocaleString()}
                    </span>
                    <span className="text-sm font-medium text-[var(--success)]">
                      +${parseFloat(payment.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between py-2 mt-2">
                  <span className="text-sm font-medium text-[var(--ink-primary)]">Pendiente:</span>
                  <span className="text-lg font-semibold text-[var(--warning)]">${pendingAmount.toFixed(2)}</span>
                </div>
                <Button className="w-full mt-3" onClick={() => { setPaymentAmount(pendingAmount.toFixed(2)); setShowPaymentModal(true); }}>
                  Registrar Pago
                </Button>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card padding>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--ink-secondary)]">Subtotal</span>
                  <span className="text-[var(--ink-primary)]">${parseFloat(activeTicket.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--ink-secondary)]">Descuentos</span>
                  <span className="text-[var(--ink-primary)]">-${parseFloat(activeTicket.discountAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold pt-2 border-t border-[var(--border-subtle)]">
                  <span className="text-[var(--ink-primary)]">Total</span>
                  <span className="text-[var(--accent)]">${parseFloat(activeTicket.total).toFixed(2)}</span>
                </div>
              </div>
            </Card>

            {activeTicket.status === 'OPEN' && !hasActiveRentals && pendingAmount <= 0 && (
              <Button className="w-full" onClick={handleCloseTicket}>
                Cerrar Ticket
              </Button>
            )}

            {activeTicket.status === 'OPEN' && hasActiveRentals && (
              <div className="p-3 text-sm text-[var(--warning)] bg-[var(--warning)]/10 rounded-md">
                Hay alquileres activos. Finalizá todos antes de cerrar.
              </div>
            )}

            {activeTicket.status === 'OPEN' && (
              <div className="border-t border-[var(--border-subtle)] pt-4 mt-4">
                <p className="text-xs text-[var(--ink-tertiary)] mb-2">Operaciones de riesgo</p>
                <div className="space-y-2">
                  {activeTicket.payments && activeTicket.payments.length > 0 && (
                    <Button variant="danger" className="w-full text-xs" onClick={handleCancelTicketWithReversal}>
                      Cancelar con reverso
                    </Button>
                  )}
                  {(!activeTicket.payments || activeTicket.payments.length === 0) && (
                    <Button variant="danger" className="w-full text-xs" onClick={handleCancelTicket}>
                      Cancelar ticket
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <Card padding>
          <EmptyState
            title="Sin ticket activo"
            description="Abrí un nuevo ticket para comenzar una venta."
            action={<Button onClick={handleCreateTicket}>Abrir Ticket</Button>}
          />
        </Card>
      )}

      <Modal isOpen={showAddRentalModal} onClose={() => setShowAddRentalModal(false)} title="Agregar Alquiler">
        <form onSubmit={handleAddRental} className="space-y-4">
          <Select
            label="Recurso"
            options={resources.map((r) => ({ value: r.id, label: r.name }))}
            value={selectedResourceId}
            onChange={(e) => setSelectedResourceId(e.target.value)}
            placeholder="Seleccionar recurso"
          />
          <Select
            label="Duración"
            options={[
              { value: '30', label: '30 minutos' },
              { value: '60', label: '1 hora' },
              { value: '120', label: '2 horas' },
              { value: '180', label: '3 horas' },
            ]}
            value={reservedMinutes}
            onChange={(e) => setReservedMinutes(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowAddRentalModal(false)}>Cancelar</Button>
            <Button type="submit" isLoading={isSubmitting}>Agregar</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showAddCatalogModal} onClose={() => setShowAddCatalogModal(false)} title="Agregar Producto">
        <form onSubmit={handleAddCatalogItem} className="space-y-4">
          <Select
            label="Producto/Servicio"
            options={catalogItems.map((c) => ({ value: c.id, label: `${c.name} - $${parseFloat(c.price).toFixed(2)}` }))}
            value={selectedCatalogItemId}
            onChange={(e) => setSelectedCatalogItemId(e.target.value)}
            placeholder="Seleccionar ítem"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowAddCatalogModal(false)}>Cancelar</Button>
            <Button type="submit" isLoading={isSubmitting}>Agregar</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Registrar Pago">
        <form onSubmit={handleRegisterPayment} className="space-y-4">
          <Select
            label="Método de pago"
            options={[
              { value: 'CASH', label: 'Efectivo' },
              { value: 'CARD', label: 'Tarjeta' },
              { value: 'TRANSFER', label: 'Transferencia' },
              { value: 'DIGITAL_WALLET', label: 'Billetera digital' },
              { value: 'OTHER', label: 'Otro' },
            ]}
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
          />
          <Input
            label="Monto"
            type="number"
            step="0.01"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            placeholder="0.00"
            required
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowPaymentModal(false)}>Cancelar</Button>
            <Button type="submit" isLoading={isSubmitting}>Registrar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}