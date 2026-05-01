import { useState, useEffect, useCallback } from 'react';
import { useCompany } from '@/contexts';
import { catalogApi } from '@/api';
import { Button, Card, Input, Select, Modal, Badge, EmptyState } from '@/components/ui';
import type { SaleCatalogItem, CatalogItemType } from '@/types';
import { getErrorMessage } from '@/api/client';

export function CatalogPage() {
  const { currentCompany, currentBranch } = useCompany();
  const [items, setItems] = useState<SaleCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<SaleCatalogItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'PRODUCT' as CatalogItemType,
    price: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchItems = useCallback(async () => {
    if (!currentCompany) return;
    try {
      const params: { branchId?: string } = {};
      if (currentBranch) {
        params.branchId = currentBranch.id;
      }
      const data = await catalogApi.list(currentCompany.id, params);
      setItems(data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [currentCompany, currentBranch]);

  useEffect(() => {
    if (currentCompany) {
      setIsLoading(true);
      fetchItems().finally(() => setIsLoading(false));
    }
  }, [currentCompany, fetchItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany) return;

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        price: formData.price,
        branchId: currentBranch?.id,
      };

      if (editingItem) {
        await catalogApi.update(currentCompany.id, editingItem.id, payload);
      } else {
        await catalogApi.create(currentCompany.id, payload);
      }
      closeModal();
      fetchItems();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivate = async (item: SaleCatalogItem) => {
    if (!currentCompany) return;
    try {
      await catalogApi.activate(currentCompany.id, item.id);
      fetchItems();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDeactivate = async (item: SaleCatalogItem) => {
    if (!currentCompany) return;
    try {
      await catalogApi.deactivate(currentCompany.id, item.id);
      fetchItems();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const openEditModal = (item: SaleCatalogItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      type: item.type,
      price: item.price,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({ name: '', description: '', type: 'PRODUCT', price: '' });
  };

  if (!currentCompany) {
    return (
      <div className="p-6">
        <EmptyState
          title="Selecciona empresa"
          description="Debes seleccionar una empresa desde el Dashboard para gestionar el catálogo."
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
        <h1 className="text-xl sm:text-2xl font-semibold text-[var(--ink-primary)]">Catálogo</h1>
        <Button onClick={() => setShowModal(true)} size="sm">
          Nuevo Ítem
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-4 text-sm text-[var(--error)] bg-[var(--error)]/10 rounded-md">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <Card padding>
          <EmptyState
            title="Catálogo vacío"
            description="Agregá productos o servicios al catálogo."
            action={<Button onClick={() => setShowModal(true)}>Agregar ítem</Button>}
          />
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id} padding>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--ink-primary)]">{item.name}</p>
                  {item.description && (
                    <p className="text-xs text-[var(--ink-tertiary)] mt-0.5">{item.description}</p>
                  )}
                  <p className="text-sm font-semibold text-[var(--accent)] mt-2">
                    ${parseFloat(item.price).toFixed(2)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={item.type === 'PRODUCT' ? 'default' : 'warning'}>
                    {item.type === 'PRODUCT' ? 'Producto' : 'Servicio'}
                  </Badge>
                  <Badge variant={item.status === 'ACTIVE' ? 'success' : 'default'}>
                    {item.status}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-[var(--border-subtle)]">
                <Button variant="ghost" className="flex-1 text-xs" onClick={() => openEditModal(item)}>
                  Editar
                </Button>
                {item.status === 'ACTIVE' ? (
                  <Button variant="ghost" className="flex-1 text-xs" onClick={() => handleDeactivate(item)}>
                    Desactivar
                  </Button>
                ) : (
                  <Button variant="ghost" className="flex-1 text-xs" onClick={() => handleActivate(item)}>
                    Activar
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingItem ? 'Editar Ítem' : 'Nuevo Ítem'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ej: Bebida fría"
            required
          />

          <Input
            label="Descripción (opcional)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descripción del ítem"
          />

          <Select
            label="Tipo"
            options={[
              { value: 'PRODUCT', label: 'Producto' },
              { value: 'SERVICE', label: 'Servicio' },
            ]}
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as CatalogItemType })}
          />

          <Input
            label="Precio"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="0.00"
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingItem ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}