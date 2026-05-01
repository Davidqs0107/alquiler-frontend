import { useState, useEffect, useCallback } from 'react';
import { useCompany } from '@/contexts';
import { categoriesApi, resourcesApi } from '@/api';
import { Button, Card, CardHeader, CardTitle, Input, Select, Modal, Badge, EmptyState } from '@/components/ui';
import type { ResourceCategory, Resource } from '@/types';
import { getErrorMessage } from '@/api/client';

export function ResourcesPage() {
  const { currentCompany, currentBranch } = useCompany();
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [resourceName, setResourceName] = useState('');
  const [resourceDescription, setResourceDescription] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = useCallback(async () => {
    if (!currentCompany) return;
    try {
      const data = await categoriesApi.list(currentCompany.id);
      setCategories(data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [currentCompany]);

  const fetchResources = useCallback(async () => {
    if (!currentCompany || !currentBranch) return;
    try {
      const data = await resourcesApi.list(currentCompany.id, currentBranch.id);
      setResources(data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [currentCompany, currentBranch]);

  useEffect(() => {
    if (currentCompany && currentBranch) {
      setIsLoading(true);
      Promise.all([fetchCategories(), fetchResources()])
        .finally(() => setIsLoading(false));
    }
  }, [currentCompany, currentBranch, fetchCategories, fetchResources]);

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
        categoryId: selectedCategoryId,
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
            <Badge>{categories.length}</Badge>
          </CardHeader>
          {categories.length === 0 ? (
            <EmptyState
              title="Sin categorías"
              description="Creá tu primera categoría para organizar los recursos."
            />
          ) : (
            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 border border-[var(--border-subtle)] rounded-md"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--ink-primary)]">{category.name}</p>
                    {category.description && (
                      <p className="text-xs text-[var(--ink-tertiary)] mt-0.5">{category.description}</p>
                    )}
                  </div>
                  <Badge variant={category.status === 'ACTIVE' ? 'success' : 'default'}>
                    {category.status}
                  </Badge>
                </div>
              ))}
            </div>
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
                  <div>
                    <p className="text-sm font-medium text-[var(--ink-primary)]">{resource.name}</p>
                    <p className="text-xs text-[var(--ink-tertiary)] mt-0.5">
                      {resource.category?.name || 'Sin categoría'}
                    </p>
                  </div>
                  <Badge variant={resource.status === 'ACTIVE' ? 'success' : 'default'}>
                    {resource.status}
                  </Badge>
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
    </div>
  );
}