import { useState, useEffect, useCallback } from 'react';
import { useCompany } from '@/contexts';
import { ratePlansApi, resourcesApi, categoriesApi } from '@/api';
import { Button, Card, Input, Select, Modal, Badge, EmptyState } from '@/components/ui';
import type { RatePlan, Resource, ResourceCategory } from '@/types';
import { getErrorMessage } from '@/api/client';

type PricingType = 'BLOCK' | 'TIME_UNIT';

export function RatesPage() {
  const { currentCompany, currentBranch } = useCompany();
  const [ratePlans, setRatePlans] = useState<RatePlan[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    pricingType: 'TIME_UNIT' as PricingType,
    resourceId: '',
    categoryId: '',
    basePrice: '',
    timeUnitMinutes: '60',
    blockHours: '',
    blockPrice: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!currentCompany || !currentBranch) return;
    try {
      const [ratesData, resourcesData, categoriesData] = await Promise.all([
        ratePlansApi.list(currentCompany.id, currentBranch.id),
        resourcesApi.list(currentCompany.id, currentBranch.id),
        categoriesApi.list(currentCompany.id),
      ]);
      setRatePlans(ratesData);
      setResources(resourcesData);
      setCategories(categoriesData);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [currentCompany, currentBranch]);

  useEffect(() => {
    if (currentCompany && currentBranch) {
      setIsLoading(true);
      fetchData().finally(() => setIsLoading(false));
    }
  }, [currentCompany, currentBranch, fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany || !currentBranch) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        pricingType: formData.pricingType,
        basePrice: formData.basePrice,
        resourceId: formData.resourceId || undefined,
        categoryId: formData.categoryId || undefined,
        timeUnitMinutes: formData.pricingType === 'TIME_UNIT' ? parseInt(formData.timeUnitMinutes, 10) : undefined,
        blockHours: formData.pricingType === 'BLOCK' ? parseInt(formData.blockHours, 10) : undefined,
        blockPrice: formData.pricingType === 'BLOCK' ? formData.blockPrice : undefined,
      };

      await ratePlansApi.create(currentCompany.id, currentBranch.id, payload);
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      pricingType: 'TIME_UNIT',
      resourceId: '',
      categoryId: '',
      basePrice: '',
      timeUnitMinutes: '60',
      blockHours: '',
      blockPrice: '',
    });
  };

  if (!currentCompany || !currentBranch) {
    return (
      <div className="p-6">
        <EmptyState
          title="Selecciona empresa y sede"
          description="Debes seleccionar una empresa y sede desde el Dashboard para gestionar tarifas."
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
        <h1 className="text-xl sm:text-2xl font-semibold text-[var(--ink-primary)]">Tarifas</h1>
        <Button onClick={() => setShowModal(true)} size="sm">
          Nueva Tarifa
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-4 text-sm text-[var(--error)] bg-[var(--error)]/10 rounded-md">
          {error}
        </div>
      )}

      {ratePlans.length === 0 ? (
        <Card padding>
          <EmptyState
            title="Sin tarifas"
            description="Creá tarifas para los recursos y categorías."
            action={<Button onClick={() => setShowModal(true)}>Crear primera tarifa</Button>}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {ratePlans.map((rate) => {
            const resource = resources.find((r) => r.id === rate.resourceId);
            const category = categories.find((c) => c.id === rate.categoryId);
            const scope = resource ? `Recurso: ${resource.name}` : category ? `Categoría: ${category.name}` : 'General';

            return (
              <Card key={rate.id} padding>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--ink-primary)]">{rate.name}</p>
                    <p className="text-xs text-[var(--ink-tertiary)] mt-0.5">{scope}</p>
                    <p className="text-xs text-[var(--ink-tertiary)]">
                      {rate.pricingType === 'TIME_UNIT'
                        ? `${rate.basePrice} / ${rate.timeUnitMinutes} min`
                        : `${rate.blockPrice} / ${rate.blockHours}h`}
                    </p>
                  </div>
                  <Badge variant={rate.status === 'ACTIVE' ? 'success' : 'default'}>
                    {rate.status}
                  </Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title="Nueva Tarifa"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ej: Tarifa hora casual"
            required
          />

          <Select
            label="Tipo de precio"
            options={[
              { value: 'TIME_UNIT', label: 'Por tiempo (hora, minutos)' },
              { value: 'BLOCK', label: 'Bloque (paquete fijo)' },
            ]}
            value={formData.pricingType}
            onChange={(e) => setFormData({ ...formData, pricingType: e.target.value as PricingType })}
          />

          {formData.pricingType === 'TIME_UNIT' ? (
            <>
              <Input
                label="Precio base"
                type="number"
                step="0.01"
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                placeholder="0.00"
                required
              />
              <Select
                label="Duración"
                options={[
                  { value: '30', label: '30 minutos' },
                  { value: '60', label: '1 hora' },
                  { value: '120', label: '2 horas' },
                ]}
                value={formData.timeUnitMinutes}
                onChange={(e) => setFormData({ ...formData, timeUnitMinutes: e.target.value })}
              />
            </>
          ) : (
            <>
              <Input
                label="Horas del bloque"
                type="number"
                value={formData.blockHours}
                onChange={(e) => setFormData({ ...formData, blockHours: e.target.value })}
                placeholder="1"
                required
              />
              <Input
                label="Precio del bloque"
                type="number"
                step="0.01"
                value={formData.blockPrice}
                onChange={(e) => setFormData({ ...formData, blockPrice: e.target.value })}
                placeholder="0.00"
                required
              />
            </>
          )}

          <Select
            label="Aplicar a (opcional)"
            options={[
              { value: '', label: 'General (todas las sedes)' },
              { value: 'resource', label: 'Recurso específico' },
              { value: 'category', label: 'Categoría específica' },
            ]}
            value={formData.resourceId ? 'resource' : formData.categoryId ? 'category' : ''}
            onChange={() => {
              setFormData({ ...formData, resourceId: '', categoryId: '' });
            }}
          />

          {formData.resourceId === '' && formData.categoryId === '' && (
            <p className="text-xs text-[var(--ink-tertiary)]">La tarifa se aplicará a todos los recursos de la sede.</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setShowModal(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Crear
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}