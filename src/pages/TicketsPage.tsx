import { useState, useEffect, useCallback } from 'react';
import { useCompany, useTicketStore } from '@/contexts';
import { Button, Card, Input, Select, Modal, Badge, EmptyState } from '@/components/ui';
import type { TicketStatus, Ticket } from '@/types';
import Swal from 'sweetalert2';
import { ticketsApi, customersApi } from '@/api';

const statusLabels: Record<TicketStatus, { label: string; variant: 'default' | 'success' | 'error' }> = {
  OPEN: { label: 'Abierto', variant: 'default' },
  CLOSED: { label: 'Cerrado', variant: 'success' },
  CANCELLED: { label: 'Cancelado', variant: 'error' },
};

type FilterStatus = 'ALL' | 'OPEN' | 'CLOSED' | 'CANCELLED';

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
    cancelTicket: cancelTicketStore,
    cancelTicketWithReversal,
    setActiveTicket,
    clearActiveTicket,
    refreshTicket,
    clearError,
    finishRental,
    cancelRental,
    startRental,
    extendRental,
  } = useTicketStore();

  const [view, setView] = useState<'list' | 'detail'>('list');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('OPEN');
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [showAddRentalModal, setShowAddRentalModal] = useState(false);
  const [showAddCatalogModal, setShowAddCatalogModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendingRentalId, setExtendingRentalId] = useState<string | null>(null);
  const [extendDuration, setExtendDuration] = useState('60');
  const [extendCustomMinutes, setExtendCustomMinutes] = useState('');
  const [extendIsOvertime, setExtendIsOvertime] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [reservedMinutes, setReservedMinutes] = useState('60');
  const [selectedCatalogItemId, setSelectedCatalogItemId] = useState('');
  const [catalogQuantity, setCatalogQuantity] = useState('1');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'TRANSFER' | 'DIGITAL_WALLET' | 'OTHER'>('CASH');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  const loadTicketList = useCallback(async () => {
    if (!currentCompany || !currentBranch) return;
    setIsLoadingList(true);
    try {
      const params: { status?: string } = {};
      if (filterStatus !== 'ALL') {
        params.status = filterStatus;
      }
      const data = await ticketsApi.list(currentCompany.id, currentBranch.id, params);
      setTickets(data);
    } catch (err) {
      console.error('Error loading tickets:', err);
    } finally {
      setIsLoadingList(false);
    }
  }, [currentCompany, currentBranch, filterStatus]);

  const loadData = useCallback(async () => {
    if (!currentCompany || !currentBranch) return;
    const [, , customersData] = await Promise.all([
      fetchResources(currentCompany.id, currentBranch.id),
      fetchCatalogItems(currentCompany.id, currentBranch.id),
      customersApi.list(currentCompany.id).catch(() => []),
    ]);
    setCustomers(customersData.map((c: any) => ({ id: c.id, name: c.name })));
  }, [currentCompany, currentBranch, fetchResources, fetchCatalogItems]);

  useEffect(() => {
    if (currentCompany && currentBranch) {
      if (view === 'list') {
        loadTicketList();
      } else if (activeTicket) {
        refreshTicket(currentCompany.id, currentBranch.id, activeTicket.id);
      }
      loadData();
    }
  }, [currentCompany, currentBranch, view, filterStatus]);

  const handleOpenTicket = async () => {
    if (!currentCompany || !currentBranch) return;
    const ticket = await createTicket(currentCompany.id, currentBranch.id);
    if (ticket) {
      setActiveTicket(ticket);
      setView('detail');
    }
  };

  const handleSelectTicket = async (ticket: Ticket) => {
    if (!currentCompany || !currentBranch) return;
    setIsLoadingList(true);
    try {
      const fullTicket = await ticketsApi.get(currentCompany.id, currentBranch.id, ticket.id);
      setActiveTicket(fullTicket);
      setView('detail');
    } catch (err) {
      console.error('Error loading ticket:', err);
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleBackToList = () => {
    clearActiveTicket();
    setView('list');
    loadTicketList();
  };

  const handleAddRental = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany || !currentBranch || !activeTicket) return;
    setIsSubmitting(true);
    await addRental(currentCompany.id, currentBranch.id, activeTicket.id, selectedResourceId, parseInt(reservedMinutes, 10), selectedCustomerId || undefined);
    setIsSubmitting(false);
    setShowAddRentalModal(false);
    setSelectedResourceId('');
    setReservedMinutes('60');
    setSelectedCustomerId('');
  };

  const handleAddCatalogItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany || !currentBranch || !activeTicket || !selectedCatalogItemId) return;
    setIsSubmitting(true);
    const qty = parseInt(catalogQuantity, 10);
    for (let i = 0; i < qty; i++) {
      await addCatalogItem(currentCompany.id, currentBranch.id, activeTicket.id, selectedCatalogItemId);
    }
    setIsSubmitting(false);
    setShowAddCatalogModal(false);
    setSelectedCatalogItemId('');
    setCatalogQuantity('1');
  };

  const handleAddManualItem = async () => {
    if (!currentCompany || !currentBranch || !activeTicket) return;
    const { value: formValues } = await Swal.fire({
      title: 'Agregar ítem manual',
      html: `
        <input id="swal-description" class="swal2-input" placeholder="Descripción del ítem">
        <input id="swal-price" type="number" step="0.01" class="swal2-input" placeholder="Precio">
      `,
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => {
        const description = (document.getElementById('swal-description') as HTMLInputElement).value;
        const price = (document.getElementById('swal-price') as HTMLInputElement).value;
        if (!description || !price) {
          Swal.showValidationMessage('Completá ambos campos');
          return false;
        }
        return { description, price };
      },
    });
    if (formValues) {
      await addManualItem(currentCompany.id, currentBranch.id, activeTicket.id, formValues.description, formValues.price);
    }
  };

  const handleAddExtra = async () => {
    if (!currentCompany || !currentBranch || !activeTicket) return;
    const { value: formValues } = await Swal.fire({
      title: 'Agregar extra',
      html: `
        <input id="swal-description" class="swal2-input" placeholder="Descripción del extra">
        <input id="swal-amount" type="number" step="0.01" class="swal2-input" placeholder="Monto">
      `,
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => {
        const description = (document.getElementById('swal-description') as HTMLInputElement).value;
        const amount = (document.getElementById('swal-amount') as HTMLInputElement).value;
        if (!description || !amount) {
          Swal.showValidationMessage('Completá ambos campos');
          return false;
        }
        return { description, amount };
      },
    });
    if (formValues) {
      await addExtra(currentCompany.id, currentBranch.id, activeTicket.id, formValues.description, formValues.amount);
    }
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

    const inUseRentals = activeTicket.items?.filter(
      (item) => item.rentalSession && item.rentalSession.status === 'IN_USE'
    );

    const overdueRentals = activeTicket.items?.filter(
      (item) => item.rentalSession && item.rentalSession.status === 'RESERVED' && new Date(item.rentalSession.scheduledEndAt) <= new Date()
    );

    if ((inUseRentals?.length ?? 0) > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No se puede cerrar',
        text: `Hay ${inUseRentals.length} alquiler(es) en uso. Finalizá los alquileres primero.`,
      });
      return;
    }

    if ((overdueRentals?.length ?? 0) > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No se puede cerrar',
        text: `Hay ${overdueRentals.length} alquiler(es) vencidos. Cancelá o finalizá primero.`,
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
    handleBackToList();
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

  const handleFinishRental = async (rentalSessionId: string) => {
    if (!currentCompany || !currentBranch || !activeTicket) return;
    const result = await Swal.fire({
      icon: 'question',
      title: '¿Finalizar este alquiler?',
      showCancelButton: true,
      confirmButtonText: 'Sí, finalizar',
      cancelButtonText: 'No',
    });
    if (!result.isConfirmed) return;
    await finishRental(currentCompany.id, currentBranch.id, rentalSessionId, activeTicket.id);
  };

  const handleCancelRental = async (rentalSessionId: string) => {
    if (!currentCompany || !currentBranch || !activeTicket) return;
    const result = await Swal.fire({
      icon: 'warning',
      title: '¿Cancelar este alquiler?',
      text: 'Esta acción no se puede deshacer.',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No',
    });
    if (!result.isConfirmed) return;
    await cancelRental(currentCompany.id, currentBranch.id, rentalSessionId, activeTicket.id);
  };

  const handleExtendClick = (rentalSessionId: string) => {
    setExtendingRentalId(rentalSessionId);
    setExtendDuration('60');
    setExtendCustomMinutes('');
    setExtendIsOvertime(false);
    setShowExtendModal(true);
  };

  const handleExtendRental = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany || !currentBranch || !activeTicket || !extendingRentalId) return;
    const minutes = extendDuration === 'custom'
      ? parseInt(extendCustomMinutes, 10)
      : parseInt(extendDuration, 10);
    setIsSubmitting(true);
    await extendRental(currentCompany.id, currentBranch.id, extendingRentalId, activeTicket.id, minutes, extendIsOvertime);
    setIsSubmitting(false);
    setShowExtendModal(false);
    setExtendingRentalId(null);
  };

  const handleStartRental = async (rentalSessionId: string) => {
    if (!currentCompany || !currentBranch || !activeTicket) return;
    const result = await Swal.fire({
      icon: 'question',
      title: '¿Iniciar uso de este alquiler?',
      showCancelButton: true,
      confirmButtonText: 'Sí, iniciar',
      cancelButtonText: 'No',
    });
    if (!result.isConfirmed) return;
    await startRental(currentCompany.id, currentBranch.id, rentalSessionId, activeTicket.id);
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
    await cancelTicketStore(currentCompany.id, currentBranch.id, activeTicket.id);
    handleBackToList();
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
    handleBackToList();
  };

  const hasActiveRentals = activeTicket?.items?.some(
    (item) => item.rentalSession && item.rentalSession.status === 'IN_USE'
  );

  const hasPendingStartRentals = activeTicket?.items?.some(
    (item) => item.rentalSession && item.rentalSession.status === 'RESERVED' && new Date(item.rentalSession.scheduledEndAt) <= new Date()
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

  if (view === 'list') {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-[var(--ink-primary)]">Tickets</h1>
          <Button onClick={handleOpenTicket}>
            + Nuevo Ticket
          </Button>
        </div>

        <div className="flex gap-2 mb-4">
          {(['ALL', 'OPEN', 'CLOSED', 'CANCELLED'] as FilterStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                filterStatus === status
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--surface-elevated)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
              }`}
            >
              {status === 'ALL' ? 'Todos' : statusLabels[status as TicketStatus]?.label}
            </button>
          ))}
        </div>

        {isLoadingList ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full" />
          </div>
        ) : tickets.length === 0 ? (
          <Card padding>
            <EmptyState
              title="No hay tickets"
              description={filterStatus === 'ALL' ? 'Creá un nuevo ticket para comenzar.' : `No hay tickets ${filterStatus === 'OPEN' ? 'abiertos' : filterStatus === 'CLOSED' ? 'cerrados' : 'cancelados'}.`}
              action={filterStatus === 'ALL' ? <Button onClick={handleOpenTicket}>Crear ticket</Button> : undefined}
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <Card
                key={ticket.id}
                padding
                className="cursor-pointer hover:border-[var(--accent)] transition-colors"
                onClick={() => handleSelectTicket(ticket)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[var(--ink-primary)]">
                        Ticket #{ticket.ticketNumber}
                      </p>
                      <Badge variant={statusLabels[ticket.status as TicketStatus].variant}>
                        {statusLabels[ticket.status as TicketStatus].label}
                      </Badge>
                    </div>
                    <p className="text-xs text-[var(--ink-tertiary)] mt-0.5">
                      Abierto: {new Date(ticket.openedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[var(--ink-primary)]">
                      ${parseFloat(ticket.total).toFixed(2)}
                    </p>
                    <p className="text-xs text-[var(--ink-tertiary)]">
                      {ticket.status === 'OPEN' ? (
                        ticket.payments?.length ? 'Parcialmente pago' : 'Sin pagos'
                      ) : (
                        ticket.status === 'CLOSED' ? 'Cerrado' : 'Cancelado'
                      )}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (view === 'detail' && activeTicket) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="secondary" size="sm" onClick={handleBackToList}>
            ← Volver
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-[var(--ink-primary)]">
              Ticket #{activeTicket.ticketNumber}
            </h1>
            <p className="text-xs text-[var(--ink-tertiary)]">
              {activeTicket.status === 'OPEN' ? 'Abierto' : activeTicket.status === 'CLOSED' ? 'Cerrado' : 'Cancelado'} el {new Date(activeTicket.openedAt).toLocaleString()}
            </p>
          </div>
          <Badge variant={statusLabels[activeTicket.status as TicketStatus].variant}>
            {statusLabels[activeTicket.status as TicketStatus].label}
          </Badge>
        </div>

        {error && (
          <div className="mb-4 p-4 text-sm text-[var(--error)] bg-[var(--error)]/10 rounded-md flex items-center justify-between">
            <span>{error}</span>
            <button onClick={clearError} className="text-[var(--error)]">×</button>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Card padding>
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
                        {item.rentalSession && (
                          <Badge
                            variant={item.rentalSession.status === 'IN_USE' ? 'success' : item.rentalSession.status === 'RESERVED' ? 'warning' : 'default'}
                            className="mt-1"
                          >
                            {item.rentalSession.status === 'IN_USE' ? 'En uso' : item.rentalSession.status === 'RESERVED' ? 'Reservado' : item.rentalSession.status}
                          </Badge>
                        )}
                        {item.rentalSession?.customer && (
                          <p className="text-xs text-[var(--ink-tertiary)] mt-0.5">Cliente: {item.rentalSession.customer.name}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm font-medium">${parseFloat(item.subtotal).toFixed(2)}</span>
                        {activeTicket.status === 'OPEN' && item.rentalSession?.status === 'IN_USE' && (
                          <>
                            <button onClick={() => handleFinishRental(item.rentalSession!.id)} className="text-[var(--success)] hover:text-[var(--success)]/80 p-1" title="Finalizar alquiler">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                            <button onClick={() => handleExtendClick(item.rentalSession!.id)} className="text-[var(--accent)] hover:text-[var(--accent)]/80 p-1" title="Extender alquiler">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          </>
                        )}
                        {activeTicket.status === 'OPEN' && item.rentalSession?.status === 'RESERVED' && (
                          <button onClick={() => handleStartRental(item.rentalSession!.id)} className="text-[var(--success)] hover:text-[var(--success)]/80 p-1" title="Iniciar uso">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        )}
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

            {activeTicket.status === 'OPEN' && (hasActiveRentals || hasPendingStartRentals) && (
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

        <Modal isOpen={showAddRentalModal} onClose={() => setShowAddRentalModal(false)} title="Agregar Alquiler">
          <form onSubmit={handleAddRental} className="space-y-4">
            <Select
              label="Cliente (opcional)"
              options={[{ value: '', label: 'Sin cliente' }, ...customers.map((c) => ({ value: c.id, label: c.name }))]}
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              placeholder="Seleccionar cliente"
            />
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
            <Input
              label="Cantidad"
              type="number"
              min="1"
              value={catalogQuantity}
              onChange={(e) => setCatalogQuantity(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setShowAddCatalogModal(false)}>Cancelar</Button>
              <Button type="submit" isLoading={isSubmitting} disabled={!selectedCatalogItemId || parseInt(catalogQuantity, 10) < 1}>Agregar</Button>
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

        <Modal isOpen={showExtendModal} onClose={() => setShowExtendModal(false)} title="Extender Alquiler">
          <form onSubmit={handleExtendRental} className="space-y-4">
            <Select
              label="Agregar tiempo"
              options={[
                { value: '30', label: '+30 minutos' },
                { value: '60', label: '+1 hora' },
                { value: '120', label: '+2 horas' },
                { value: 'custom', label: 'Custom...' },
              ]}
              value={extendDuration}
              onChange={(e) => setExtendDuration(e.target.value)}
            />
            {extendDuration === 'custom' && (
              <Input
                label="Minutos adicionales"
                type="number"
                min="1"
                value={extendCustomMinutes}
                onChange={(e) => setExtendCustomMinutes(e.target.value)}
                placeholder="Ej: 45"
                required
              />
            )}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={extendIsOvertime}
                onChange={(e) => setExtendIsOvertime(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--border-subtle)]"
              />
              <span className="text-sm text-[var(--ink-secondary)]">Marcar como overtime</span>
            </label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setShowExtendModal(false)}>Cancelar</Button>
              <Button type="submit" isLoading={isSubmitting}>Extender</Button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  return null;
}