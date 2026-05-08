import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts';
import { api } from '@/api';
import { Button, Card, Input, Modal, Badge, EmptyState } from '@/components/ui';
import type { Customer } from '@/types';
import Swal from 'sweetalert2';

export function CustomersPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const { getMyCompanyRole } = useAuth();
  const membershipRole = getMyCompanyRole();
  const canManage = ['ADMIN_EMPRESA', 'ADMIN_SEDE'].includes(membershipRole || '');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadCustomers = async () => {
    if (!companyId) return;
    setIsLoading(true);
    try {
      const result = await api.get<{ data: Customer[] } | Customer[]>(`/companies/${companyId}/customers`);
      const raw = result.data;
      const list = Array.isArray(raw) ? raw : (raw as any)?.data;
      setCustomers(Array.isArray(list) ? list : []);
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Error al cargar clientes' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [companyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;
    setIsSubmitting(true);
    try {
      if (editingCustomer) {
        await api.put(`/companies/${companyId}/customers/${editingCustomer.id}`, formData);
        Swal.fire({ icon: 'success', title: 'Éxito', text: 'Cliente actualizado' });
      } else {
        await api.post(`/companies/${companyId}/customers`, formData);
        Swal.fire({ icon: 'success', title: 'Éxito', text: 'Cliente creado' });
      }
      setShowAddModal(false);
      setEditingCustomer(null);
      setFormData({ name: '', email: '', phone: '' });
      loadCustomers();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Error al guardar' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({ name: customer.name, email: customer.email || '', phone: customer.phone || '' });
    setShowAddModal(true);
  };

  const handleDelete = async (customer: Customer) => {
    const result = await Swal.fire({
      title: '¿Eliminar cliente?',
      text: `¿Seguro que querés eliminar a "${customer.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed && companyId) {
      try {
        await api.put(`/companies/${companyId}/customers/${customer.id}`, { status: 'INACTIVE' });
        Swal.fire({ icon: 'success', title: 'Éxito', text: 'Cliente eliminado' });
        loadCustomers();
      } catch (err: any) {
        Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Error al eliminar' });
      }
    }
  };

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData({ name: '', email: '', phone: '' });
    setShowAddModal(true);
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--ink-primary)]">Clientes</h1>
          <p className="text-sm text-[var(--ink-secondary)]">Gestión de clientes de la empresa</p>
        </div>
        {canManage && (
          <Button onClick={openAddModal}>+ Nuevo Cliente</Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full" />
        </div>
      ) : customers.length === 0 ? (
        <Card padding>
          <EmptyState
            title="No hay clientes"
            description="Agregá clientes para gestionar sus alquileres"
            action={canManage ? <Button onClick={openAddModal}>Crear Cliente</Button> : undefined}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {customers.map((customer) => (
            <Card key={customer.id} padding>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--ink-primary)]">{customer.name}</p>
                  <p className="text-xs text-[var(--ink-tertiary)]">
                    {customer.email && `${customer.email}`}
                    {customer.email && customer.phone && ' · '}
                    {customer.phone && customer.phone}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={customer.status === 'ACTIVE' ? 'success' : 'default'}>
                    {customer.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                  </Badge>
                  {canManage && (
                    <>
                      <button
                        onClick={() => handleEdit(customer)}
                        className="p-1.5 rounded hover:bg-[var(--surface-elevated)] transition-colors"
                        title="Editar"
                      >
                        <svg className="w-4 h-4 text-[var(--ink-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(customer)}
                        className="p-1.5 rounded hover:bg-[var(--error)]/10 transition-colors"
                        title="Eliminar"
                      >
                        <svg className="w-4 h-4 text-[var(--error)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Input
            label="Teléfono"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingCustomer ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}