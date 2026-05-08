import { useState, useEffect, useCallback } from 'react';
import { useCompany } from '@/contexts';
import { categoriesApi, resourcesApi, blockoutsApi, extractData, extractMeta } from '@/api';
import { Button, Card, CardHeader, CardTitle, Input, Select, Modal, Badge, EmptyState, Pagination } from '@/components/ui';
import type { ResourceCategory, Resource, ResourceBlockout } from '@/types';
import { getErrorMessage } from '@/api/client';
import { Eye, EyeOff, Pencil } from 'lucide-react';

const DEFAULT_LIMIT = 20;

export function ResourcesPage() {
  const { currentCompany, currentBranch } = useCompany();
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCategoryEditModal, setShowCategoryEditModal] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [showResourceEditModal, setShowResourceEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ResourceCategory | null>(null);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [resourceName, setResourceName] = useState('');
  const [resourceDescription, setResourceDescription] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingVisibility, setTogglingVisibility] = useState<string | null>(null);
  const [togglingResourceStatus, setTogglingResourceStatus] = useState<string | null>(null);
  const [categoryOffset, setCategoryOffset] = useState<number | null>(0);
  const [categoryTotal, setCategoryTotal] = useState(0);
  const [resourceOffset, setResourceOffset] = useState<number | null>(0);
  const [blockouts, setBlockouts] = useState<ResourceBlockout[]>([]);
  const [showBlockoutModal, setShowBlockoutModal] = useState(false);
  const [blockoutResourceId, setBlockoutResourceId] = useState('');
  const [blockoutStartDate, setBlockoutStartDate] = useState('');
  const [blockoutStartTime, setBlockoutStartTime] = useState('');
  const [blockoutEndDate, setBlockoutEndDate] = useState('');
  const [blockoutEndTime, setBlockoutEndTime] = useState('');
  const [blockoutReason, setBlockoutReason] = useState('');
  const [isSubmittingBlockout, setIsSubmittingBlockout] = useState(false);

  const getVisibilityForCurrentBranch = useCallback(
    (category: ResourceCategory): boolean => {
      if (!currentBranch) return true;
      const override = category.visibilityOverrides?.find((v) => v.branchId === currentBranch.id);
      return override ? override.isVisible : true;
    },
    [currentBranch]
  );

  const handleToggleVisibility = async (category: ResourceCategory) => {
    if (!currentCompany || !currentBranch) return;
    const currentVisibility = getVisibilityForCurrentBranch(category);
    setTogglingVisibility(category.id);
    try {
      await categoriesApi.updateVisibility(
        currentCompany.id,
        category.id,
        currentBranch.id,
        !currentVisibility
      );
      fetchCategories(categoryOffset || 0);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setTogglingVisibility(null);
    }
  };

  const handleToggleResourceStatus = async (resource: Resource) => {
    if (!currentCompany || !currentBranch) return;
    const newStatus = resource.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setTogglingResourceStatus(resource.id);
    try {
      await resourcesApi.updateStatus(currentCompany.id, currentBranch.id, resource.id, newStatus);
      fetchResources(resourceOffset || 0);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setTogglingResourceStatus(null);
    }
  };

  const fetchCategories = useCallback(async (offsetValue: number = 0) => {
    if (!currentCompany) return;
    try {
      const response = await categoriesApi.list(currentCompany.id, { limit: DEFAULT_LIMIT, offset: offsetValue });
      const data = extractData<ResourceCategory>(response);
      const meta = extractMeta<ResourceCategory>(response);
      setCategories(data);
      setCategoryTotal(meta?.total ?? data.length);
      setCategoryOffset(meta?.offset ?? offsetValue);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [currentCompany]);

  const fetchResources = useCallback(async (offsetValue: number = 0) => {
    if (!currentCompany || !currentBranch) return;
    try {
      const response = await resourcesApi.list(currentCompany.id, currentBranch.id, { limit: DEFAULT_LIMIT, offset: offsetValue });
      const data = extractData<Resource>(response);
      const meta = extractMeta<Resource>(response);
      setResources(data);
      setResourceOffset(meta?.offset ?? offsetValue);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [currentCompany, currentBranch]);

  const fetchBlockouts = useCallback(async () => {
    if (!currentCompany || !currentBranch) return;
    try {
      const data = await blockoutsApi.list(currentCompany.id, currentBranch.id);
      setBlockouts(data);
    } catch (err) {
      console.error('Error fetching blockouts:', err);
    }
  }, [currentCompany, currentBranch]);

  useEffect(() => {
    if (currentCompany && currentBranch) {
      setIsLoading(true);
      Promise.all([fetchCategories(0), fetchResources(0), fetchBlockouts()])
        .finally(() => setIsLoading(false));
    }
  }, [currentCompany, currentBranch, fetchCategories, fetchResources, fetchBlockouts]);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany) return;
    setIsSubmitting(true);
    try {
      await categoriesApi.create(currentCompany.id, {
        name: categoryName,
        description: categoryDescription || undefined,
      });
      setShowCategoryModal(false);
      setCategoryName('');
      setCategoryDescription('');
      fetchCategories();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany || !currentBranch) return;
    setIsSubmitting(true);
    try {
      await resourcesApi.create(currentCompany.id, currentBranch.id, {
        resourceCategoryId: selectedCategoryId,
        name: resourceName,
        description: resourceDescription || undefined,
      });
      setShowResourceModal(false);
      setResourceName('');
      setResourceDescription('');
      setSelectedCategoryId('');
      fetchResources();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCategory = (category: ResourceCategory) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryDescription(category.description || '');
    setShowCategoryEditModal(true);
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany || !editingCategory) return;
    setIsSubmitting(true);
    try {
      await categoriesApi.update(currentCompany.id, editingCategory.id, {
        name: categoryName,
        description: categoryDescription || null,
      });
      setShowCategoryEditModal(false);
      setEditingCategory(null);
      setCategoryName('');
      setCategoryDescription('');
      fetchCategories();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditResource = (resource: Resource) => {
    setEditingResource(resource);
    setResourceName(resource.name);
    setResourceDescription(resource.description || '');
    setSelectedCategoryId(resource.resourceCategoryId);
    setShowResourceEditModal(true);
  };

  const handleUpdateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany || !currentBranch || !editingResource) return;
    setIsSubmitting(true);
    try {
      await resourcesApi.update(currentCompany.id, currentBranch.id, editingResource.id, {
        name: resourceName,
        description: resourceDescription || null,
        resourceCategoryId: selectedCategoryId,
      });
      setShowResourceEditModal(false);
      setEditingResource(null);
      setResourceName('');
      setResourceDescription('');
      setSelectedCategoryId('');
      fetchResources();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentCompany || !currentBranch) {
    return (
      <div className="p-6">
        <EmptyState
          title="Selecciona empresa y sede"
          description="Debes seleccionar una empresa y sede desde el Dashboard para gestionar recursos."
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
        <h1 className="text-xl sm:text-2xl font-semibold text-[var(--ink-primary)]">Recursos</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowCategoryModal(true)} variant="secondary" size="sm">
            Nueva Categoría
          </Button>
          <Button onClick={() => setShowResourceModal(true)} size="sm">
            Nuevo Recurso
          </Button>
          <Button onClick={() => setShowBlockoutModal(true)} variant="secondary" size="sm">
            Bloquear Horario
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 text-sm text-[var(--error)] bg-[var(--error)]/10 rounded-md">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card padding>
          <CardHeader>
            <CardTitle>Categorías</CardTitle>
            <Badge>{categoryTotal}</Badge>
          </CardHeader>
          {categories.length === 0 ? (
            <EmptyState
              title="Sin categorías"
              description="Creá tu primera categoría para organizar los recursos."
            />
          ) : (
            <>
              <div className="space-y-2">
                {categories.map((category) => {
                  const isVisible = getVisibilityForCurrentBranch(category);
                  return (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-3 border border-[var(--border-subtle)] rounded-md"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--ink-primary)]">{category.name}</p>
                        {category.description && (
                          <p className="text-xs text-[var(--ink-tertiary)] mt-0.5">{category.description}</p>
                        )}
                        {!isVisible && (
                          <span className="text-xs text-[var(--warning)] mt-0.5">Oculta en esta sede</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="p-1.5 rounded hover:bg-[var(--surface-secondary)] transition-colors"
                          title="Editar categoría"
                        >
                          <Pencil className="w-4 h-4 text-[var(--ink-tertiary)]" />
                        </button>
                        <button
                          onClick={() => handleToggleVisibility(category)}
                          disabled={togglingVisibility === category.id}
                          className="p-1.5 rounded hover:bg-[var(--surface-secondary)] transition-colors disabled:opacity-50"
                          title={isVisible ? 'Ocultar en esta sede' : 'Mostrar en esta sede'}
                        >
                          {togglingVisibility === category.id ? (
                            <div className="w-4 h-4 animate-spin border border-[var(--accent)] border-t-transparent rounded-full" />
                          ) : isVisible ? (
                            <Eye className="w-4 h-4 text-[var(--success)]" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-[var(--warning)]" />
                          )}
                        </button>
                        <Badge variant={category.status === 'ACTIVE' ? 'success' : 'default'}>
                          {category.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Pagination
                total={categoryTotal}
                limit={DEFAULT_LIMIT}
                offset={categoryOffset}
                onPageChange={(offset) => fetchCategories(offset)}
              />
            </>
          )}
        </Card>

        <Card padding>
          <CardHeader>
            <CardTitle>Recursos</CardTitle>
            <Badge>{resources.length}</Badge>
          </CardHeader>
          {resources.length === 0 ? (
            <EmptyState
              title="Sin recursos"
              description="Creá recursos asociados a las categorías."
            />
          ) : (
            <div className="space-y-2">
              {resources.map((resource) => (
                <div
                  key={resource.id}
                  className="flex items-center justify-between p-3 border border-[var(--border-subtle)] rounded-md"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--ink-primary)]">{resource.name}</p>
                    <p className="text-xs text-[var(--ink-tertiary)] mt-0.5">
                      {resource.category?.name || 'Sin categoría'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleEditResource(resource)}
                      className="p-1.5 rounded hover:bg-[var(--surface-secondary)] transition-colors"
                      title="Editar recurso"
                    >
                      <Pencil className="w-4 h-4 text-[var(--ink-tertiary)]" />
                    </button>
                    <button
                      onClick={() => handleToggleResourceStatus(resource)}
                      disabled={togglingResourceStatus === resource.id}
                      className="p-1.5 rounded hover:bg-[var(--surface-secondary)] transition-colors disabled:opacity-50"
                      title={resource.status === 'ACTIVE' ? 'Deshabilitar recurso' : 'Habilitar recurso'}
                    >
                      {togglingResourceStatus === resource.id ? (
                        <div className="w-4 h-4 animate-spin border border-[var(--accent)] border-t-transparent rounded-full" />
                      ) : resource.status === 'ACTIVE' ? (
                        <Eye className="w-4 h-4 text-[var(--success)]" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-[var(--warning)]" />
                      )}
                    </button>
                    <Badge variant={resource.status === 'ACTIVE' ? 'success' : 'default'}>
                      {resource.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Modal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="Nueva Categoría"
      >
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <Input
            label="Nombre"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder="Ej: Canchas de fútbol"
            required
          />
          <Input
            label="Descripción (opcional)"
            value={categoryDescription}
            onChange={(e) => setCategoryDescription(e.target.value)}
            placeholder="Descripción de la categoría"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowCategoryModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Crear
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showResourceModal}
        onClose={() => setShowResourceModal(false)}
        title="Nuevo Recurso"
      >
        <form onSubmit={handleCreateResource} className="space-y-4">
          <Select
            label="Categoría"
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            placeholder="Seleccionar categoría"
          />
          <Input
            label="Nombre"
            value={resourceName}
            onChange={(e) => setResourceName(e.target.value)}
            placeholder="Ej: Cancha 1"
            required
          />
          <Input
            label="Descripción (opcional)"
            value={resourceDescription}
            onChange={(e) => setResourceDescription(e.target.value)}
            placeholder="Descripción del recurso"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowResourceModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Crear
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showCategoryEditModal}
        onClose={() => {
          setShowCategoryEditModal(false);
          setEditingCategory(null);
          setCategoryName('');
          setCategoryDescription('');
        }}
        title="Editar Categoría"
      >
        <form onSubmit={handleUpdateCategory} className="space-y-4">
          <Input
            label="Nombre"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder="Ej: Canchas de fútbol"
            required
          />
          <Input
            label="Descripción (opcional)"
            value={categoryDescription}
            onChange={(e) => setCategoryDescription(e.target.value)}
            placeholder="Descripción de la categoría"
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowCategoryEditModal(false);
                setEditingCategory(null);
                setCategoryName('');
                setCategoryDescription('');
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Guardar
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showResourceEditModal}
        onClose={() => {
          setShowResourceEditModal(false);
          setEditingResource(null);
          setResourceName('');
          setResourceDescription('');
          setSelectedCategoryId('');
        }}
        title="Editar Recurso"
      >
        <form onSubmit={handleUpdateResource} className="space-y-4">
          <Select
            label="Categoría"
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            placeholder="Seleccionar categoría"
          />
          <Input
            label="Nombre"
            value={resourceName}
            onChange={(e) => setResourceName(e.target.value)}
            placeholder="Ej: Cancha 1"
            required
          />
          <Input
            label="Descripción (opcional)"
            value={resourceDescription}
            onChange={(e) => setResourceDescription(e.target.value)}
            placeholder="Descripción del recurso"
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowResourceEditModal(false);
                setEditingResource(null);
                setResourceName('');
                setResourceDescription('');
                setSelectedCategoryId('');
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Guardar
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showBlockoutModal}
        onClose={() => {
          setShowBlockoutModal(false);
          setBlockoutResourceId('');
          setBlockoutStartDate('');
          setBlockoutStartTime('');
          setBlockoutEndDate('');
          setBlockoutEndTime('');
          setBlockoutReason('');
        }}
        title="Bloquear Horario"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!currentCompany || !currentBranch || !blockoutResourceId || !blockoutStartDate || !blockoutStartTime || !blockoutEndDate || !blockoutEndTime || !blockoutReason) return;
            setIsSubmittingBlockout(true);
            try {
              const startAt = `${blockoutStartDate}T${blockoutStartTime}:00.000Z`;
              const endAt = `${blockoutEndDate}T${blockoutEndTime}:00.000Z`;
              await blockoutsApi.create(currentCompany.id, currentBranch.id, {
                resourceId: blockoutResourceId,
                startAt,
                endAt,
                reason: blockoutReason,
              });
              setShowBlockoutModal(false);
              setBlockoutResourceId('');
              setBlockoutStartDate('');
              setBlockoutStartTime('');
              setBlockoutEndDate('');
              setBlockoutEndTime('');
              setBlockoutReason('');
              fetchBlockouts();
            } catch (err) {
              setError(getErrorMessage(err));
            } finally {
              setIsSubmittingBlockout(false);
            }
          }}
          className="space-y-4"
        >
          <Select
            label="Recurso"
            options={resources.map((r) => ({ value: r.id, label: r.name }))}
            value={blockoutResourceId}
            onChange={(e) => setBlockoutResourceId(e.target.value)}
            placeholder="Seleccionar recurso"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fecha inicio"
              type="date"
              value={blockoutStartDate}
              onChange={(e) => setBlockoutStartDate(e.target.value)}
              required
            />
            <Input
              label="Hora inicio"
              type="time"
              value={blockoutStartTime}
              onChange={(e) => setBlockoutStartTime(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fecha fin"
              type="date"
              value={blockoutEndDate}
              onChange={(e) => setBlockoutEndDate(e.target.value)}
              required
            />
            <Input
              label="Hora fin"
              type="time"
              value={blockoutEndTime}
              onChange={(e) => setBlockoutEndTime(e.target.value)}
              required
            />
          </div>
          <Input
            label="Motivo"
            value={blockoutReason}
            onChange={(e) => setBlockoutReason(e.target.value)}
            placeholder="Ej: Mantenimiento, evento privado"
            required
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowBlockoutModal(false);
                setBlockoutResourceId('');
                setBlockoutStartDate('');
                setBlockoutStartTime('');
                setBlockoutEndDate('');
                setBlockoutEndTime('');
                setBlockoutReason('');
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmittingBlockout}>
              Crear Bloqueo
            </Button>
          </div>
        </form>
      </Modal>

      {blockouts.length > 0 && (
        <Card padding className="mt-6">
          <CardHeader>
            <CardTitle>Horarios Bloqueados</CardTitle>
          </CardHeader>
          <div className="space-y-2">
            {blockouts.map((blockout) => {
              const start = new Date(blockout.startAt);
              const end = new Date(blockout.endAt);
              return (
                <div key={blockout.id} className="flex items-center justify-between p-3 border border-[var(--border-subtle)] rounded-md">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--ink-primary)]">{blockout.resource?.name || 'Recurso eliminado'}</p>
                    <p className="text-xs text-[var(--ink-tertiary)]">
                      {start.toLocaleDateString('es-AR')} · {start.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-[var(--ink-secondary)] mt-0.5">{blockout.reason}</p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={async () => {
                      if (!currentCompany || !currentBranch) return;
                      try {
                        await blockoutsApi.delete(currentCompany.id, currentBranch.id, blockout.id);
                        fetchBlockouts();
                      } catch (err) {
                        setError(getErrorMessage(err));
                      }
                    }}
                  >
                    Eliminar
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}