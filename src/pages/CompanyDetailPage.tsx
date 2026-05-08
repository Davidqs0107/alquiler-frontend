import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Badge, EmptyState, Modal, Input, Select } from '@/components/ui';
import { api, companiesApi } from '@/api';
import { useAuth } from '@/contexts';
import Swal from 'sweetalert2';
import { Pencil, Eye, EyeOff } from 'lucide-react';

type Branch = {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type UserSummary = {
  id: string;
  email: string;
  globalRole: string;
  status: string;
  createdAt: string;
};

type CompanyUser = {
  id: string;
  role: string;
  status: string;
  createdAt: string;
  user: UserSummary;
};

type BranchUser = {
  id: string;
  role: string;
  status: string;
  createdAt: string;
  user: UserSummary;
};

type CompanyDetail = {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  branches: Branch[];
  users: CompanyUser[];
};

export function CompanyDetailPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const { getMyCompanyRole } = useAuth();
  const membershipRole = getMyCompanyRole();
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [branchMembers, setBranchMembers] = useState<BranchUser[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [showEditBranch, setShowEditBranch] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [editingBranchMember, setEditingBranchMember] = useState<BranchUser | null>(null);
  const [showEditBranchMember, setShowEditBranchMember] = useState(false);
  const [editingCompanyMember, setEditingCompanyMember] = useState<CompanyUser | null>(null);
  const [showEditCompanyMember, setShowEditCompanyMember] = useState(false);
  const [memberForm, setMemberForm] = useState({ email: '', password: '', role: 'CAJERO', branchId: '' as string });
  const [companyMemberForm, setCompanyMemberForm] = useState({ role: 'CAJERO' as string });
  const [branchForm, setBranchForm] = useState({ name: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCompany = async () => {
    if (!companyId) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.get<CompanyDetail>(`/companies/${companyId}`);
      setCompany(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar empresa');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBranchMembers = async (branchId: string) => {
    if (!companyId) return;
    try {
      const { data } = await api.get<BranchUser[]>(`/companies/${companyId}/branches/${branchId}/members`);
      setBranchMembers(data);
    } catch {
      setBranchMembers([]);
    }
  };

  useEffect(() => {
    fetchCompany();
  }, [companyId]);

  useEffect(() => {
    if (selectedBranchId) {
      fetchBranchMembers(selectedBranchId);
    } else {
      setBranchMembers([]);
    }
  }, [selectedBranchId, companyId]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;
    setIsSubmitting(true);
    try {
      await api.post(`/companies/${companyId}/members`, memberForm);
      setShowAddMember(false);
      setMemberForm({ email: '', password: '', role: 'CAJERO', branchId: '' });
      fetchCompany();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Error al crear miembro',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddBranchMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !selectedBranchId) return;
    setIsSubmitting(true);
    try {
      await api.post(`/companies/${companyId}/branches/${selectedBranchId}/members`, {
        email: memberForm.email,
        password: memberForm.password,
        role: memberForm.role,
      });
      setShowAddMember(false);
      setMemberForm({ email: '', password: '', role: 'CAJERO', branchId: '' });
      fetchBranchMembers(selectedBranchId);
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Error al crear miembro',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;
    setIsSubmitting(true);
    try {
      await api.post(`/companies/${companyId}/branches`, branchForm);
      setShowAddBranch(false);
      setBranchForm({ name: '' });
      fetchCompany();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Error al crear sede',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditBranch = (branch: Branch) => {
    setEditingBranch(branch);
    setBranchForm({ name: branch.name });
    setShowEditBranch(true);
  };

  const handleUpdateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !editingBranch) return;
    setIsSubmitting(true);
    try {
      await companiesApi.updateBranch(companyId, editingBranch.id, { name: branchForm.name });
      setShowEditBranch(false);
      setEditingBranch(null);
      setBranchForm({ name: '' });
      fetchCompany();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Error al actualizar sede' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditBranchMember = (member: BranchUser) => {
    setEditingBranchMember(member);
    setShowEditBranchMember(true);
  };

  const handleUpdateBranchMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !selectedBranchId || !editingBranchMember) return;
    setIsSubmitting(true);
    try {
      const updateData: { branchId?: string } = {};
      if (memberForm.branchId && memberForm.branchId !== selectedBranchId) {
        updateData.branchId = memberForm.branchId;
      }
      await companiesApi.updateBranchMember(companyId, selectedBranchId, editingBranchMember.id, updateData);
      setShowEditBranchMember(false);
      setEditingBranchMember(null);
      setMemberForm({ email: '', password: '', role: 'CAJERO', branchId: '' });
      fetchCompany();
      if (selectedBranchId) fetchBranchMembers(selectedBranchId);
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Error al actualizar miembro' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleBranchMemberStatus = async (member: BranchUser) => {
    if (!companyId || !selectedBranchId) return;
    try {
      await companiesApi.updateBranchMember(companyId, selectedBranchId, member.id, {
        status: member.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
      });
      if (selectedBranchId) fetchBranchMembers(selectedBranchId);
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Error al cambiar estado' });
    }
  };

  const handleEditCompanyMember = (member: CompanyUser) => {
    setEditingCompanyMember(member);
    setCompanyMemberForm({ role: member.role });
    setShowEditCompanyMember(true);
  };

  const handleUpdateCompanyMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !editingCompanyMember) return;
    setIsSubmitting(true);
    try {
      await companiesApi.updateMember(companyId, editingCompanyMember.id, { role: companyMemberForm.role });
      setShowEditCompanyMember(false);
      setEditingCompanyMember(null);
      setCompanyMemberForm({ role: 'CAJERO' });
      fetchCompany();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Error al actualizar miembro' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleCompanyMemberStatus = async (member: CompanyUser) => {
    if (!companyId) return;
    try {
      await companiesApi.updateMember(companyId, member.id, {
        status: member.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
      });
      fetchCompany();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Error al cambiar estado' });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-[var(--surface-elevated)] rounded" />
          <div className="h-64 bg-[var(--surface-elevated)] rounded-md" />
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="p-6">
        <Card padding>
          <p className="text-[var(--error)]">{error || 'Empresa no encontrada'}</p>
          <Button variant="secondary" className="mt-4" onClick={() => navigate('/companies')}>
            Volver
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4 sm:mb-6">
        <Button variant="secondary" onClick={() => navigate('/companies')} size="sm">
          ←
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold text-[var(--ink-primary)] truncate">{company.name}</h1>
          <p className="text-sm text-[var(--ink-secondary)]">{company.slug}</p>
        </div>
        <Badge variant={company.status === 'ACTIVE' ? 'success' : 'default'}>
          {company.status === 'ACTIVE' ? 'Activa' : company.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card padding>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-medium text-[var(--ink-primary)]">Sedes</h2>
              <Button variant="secondary" className="text-xs" onClick={() => { setBranchForm({ name: '' }); setShowAddBranch(true); }} size="sm">
                + Agregar
              </Button>
            </div>
            {company.branches.length === 0 ? (
              <p className="text-sm text-[var(--ink-tertiary)]">No hay sedes</p>
            ) : (
              <div className="space-y-2">
                {company.branches.map((branch) => (
                  <div key={branch.id} className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedBranchId(branch.id)}
                      className={`flex-1 text-left px-3 py-2 text-sm rounded-md transition-colors ${
                        selectedBranchId === branch.id
                          ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                          : 'hover:bg-[var(--surface-elevated)] text-[var(--ink-secondary)]'
                      }`}
                    >
                      {branch.name}
                      <span className="ml-1 text-xs text-[var(--ink-tertiary)]">{branch.status === 'ACTIVE' ? '' : branch.status}</span>
                    </button>
                    <button
                      onClick={() => handleEditBranch(branch)}
                      className="p-1.5 rounded hover:bg-[var(--surface-elevated)] transition-colors"
                      title="Editar sede"
                    >
                      <Pencil className="w-3.5 h-3.5 text-[var(--ink-tertiary)]" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {membershipRole !== 'ADMIN_SEDE' && (
            <Card padding>
              <h2 className="font-medium text-[var(--ink-primary)] mb-3">Miembros de Empresa</h2>
            {company.users.length === 0 ? (
              <p className="text-sm text-[var(--ink-tertiary)]">No hay miembros</p>
            ) : (
              <div className="space-y-3">
                {company.users.map((membership) => (
                  <div key={membership.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-[var(--surface-base)] rounded-md">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--ink-primary)] truncate">{membership.user.email}</p>
                      <p className="text-xs text-[var(--ink-tertiary)]">
                        Desde {new Date(membership.createdAt).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant={membership.status === 'ACTIVE' ? 'success' : 'default'}>
                        {membership.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                      </Badge>
                      <Badge variant="info">{membership.role.replace('_', ' ')}</Badge>
                      <button
                        onClick={() => handleEditCompanyMember(membership)}
                        className="p-1.5 rounded hover:bg-[var(--surface-elevated)] transition-colors"
                        title="Editar rol"
                      >
                        <Pencil className="w-3.5 h-3.5 text-[var(--ink-tertiary)]" />
                      </button>
                      <button
                        onClick={() => handleToggleCompanyMemberStatus(membership)}
                        className="p-1.5 rounded hover:bg-[var(--surface-elevated)] transition-colors"
                        title={membership.status === 'ACTIVE' ? 'Deshabilitar' : 'Habilitar'}
                      >
                        {membership.status === 'ACTIVE' ? (
                          <Eye className="w-3.5 h-3.5 text-[var(--success)]" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5 text-[var(--warning)]" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button
              variant="secondary"
              className="w-full mt-3 text-sm"
              onClick={() => setShowAddMember(true)}
            >
              + Agregar Miembro
            </Button>
          </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          <Card padding className="min-h-[300px] sm:min-h-[400px]">
            {selectedBranchId ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-medium text-[var(--ink-primary)]">
                    Miembros de{' '}
                    {company.branches.find((b) => b.id === selectedBranchId)?.name}
                  </h2>
                  <Button className="text-sm" onClick={() => setShowAddMember(true)}>
                    + Agregar
                  </Button>
                </div>
                {branchMembers.length === 0 ? (
                  <EmptyState
                    title="No hay miembros en esta sede"
                    description="Agrega miembros para asignarlos a esta sede"
                  />
                ) : (
                  <div className="space-y-3">
                    {branchMembers.map((membership) => (
                      <div
                        key={membership.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-[var(--surface-base)] rounded-md"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[var(--ink-primary)] truncate">
                            {membership.user.email}
                          </p>
                          <p className="text-xs text-[var(--ink-tertiary)]">
                            Desde {new Date(membership.createdAt).toLocaleDateString('es-AR')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant={membership.status === 'ACTIVE' ? 'success' : 'default'}>
                            {membership.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                          </Badge>
                          <button
                            onClick={() => handleEditBranchMember(membership)}
                            className="p-1.5 rounded hover:bg-[var(--surface-elevated)] transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5 text-[var(--ink-tertiary)]" />
                          </button>
                          <button
                            onClick={() => handleToggleBranchMemberStatus(membership)}
                            className="p-1.5 rounded hover:bg-[var(--surface-elevated)] transition-colors"
                            title={membership.status === 'ACTIVE' ? 'Deshabilitar' : 'Habilitar'}
                          >
                            {membership.status === 'ACTIVE' ? (
                              <Eye className="w-3.5 h-3.5 text-[var(--success)]" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5 text-[var(--warning)]" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                title="Selecciona una sede"
                description="Selecciona una sede del panel izquierdo para ver sus miembros"
              />
            )}
          </Card>
        </div>
      </div>

      <Modal isOpen={showAddMember} onClose={() => setShowAddMember(false)} title="Agregar Miembro">
        <form onSubmit={selectedBranchId ? handleAddBranchMember : handleAddMember} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={memberForm.email}
            onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
            required
          />
          <Input
            label="Contraseña"
            type="password"
            value={memberForm.password}
            onChange={(e) => setMemberForm({ ...memberForm, password: e.target.value })}
            minLength={6}
            required
          />
<Select
              label="Rol"
              value={memberForm.role}
              onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
              options={
                selectedBranchId
                  ? [
                      { value: 'ADMIN_SEDE', label: 'Admin Sede' },
                      { value: 'CAJERO', label: 'Cajero' },
                      { value: 'RECEPCION', label: 'Recepción' },
                    ]
                  : [
                      { value: 'ADMIN_EMPRESA', label: 'Admin Empresa' },
                      { value: 'ADMIN_SEDE', label: 'Admin Sede' },
                      { value: 'CAJERO', label: 'Cajero' },
                      { value: 'RECEPCION', label: 'Recepción' },
                    ]
              }
            />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowAddMember(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Crear
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showAddBranch} onClose={() => setShowAddBranch(false)} title="Agregar Sede">
        <form onSubmit={handleAddBranch} className="space-y-4">
          <Input
            label="Nombre de la Sede"
            value={branchForm.name}
            onChange={(e) => setBranchForm({ name: e.target.value })}
            placeholder="Ej: Sucursal Centro"
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowAddBranch(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Crear
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showEditBranch} onClose={() => { setShowEditBranch(false); setEditingBranch(null); setBranchForm({ name: '' }); }} title="Editar Sede">
        <form onSubmit={handleUpdateBranch} className="space-y-4">
          <Input
            label="Nombre de la Sede"
            value={branchForm.name}
            onChange={(e) => setBranchForm({ name: e.target.value })}
            placeholder="Ej: Sucursal Centro"
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setShowEditBranch(false); setEditingBranch(null); setBranchForm({ name: '' }); }}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Guardar
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showEditBranchMember} onClose={() => { setShowEditBranchMember(false); setEditingBranchMember(null); setMemberForm({ email: '', password: '', role: 'CAJERO', branchId: '' }); }} title="Editar Miembro de Sede">
        <form onSubmit={handleUpdateBranchMember} className="space-y-4">
          {editingBranchMember && (
            <p className="text-sm text-[var(--ink-secondary)]">Editando: {editingBranchMember.user.email}</p>
          )}
          {company && selectedBranchId && (
            <Select
              label="Mover a Sucursal"
              value={selectedBranchId}
              onChange={(e) => {
                const targetBranchId = e.target.value;
                if (targetBranchId !== selectedBranchId) {
                  setMemberForm((prev) => ({ ...prev, branchId: targetBranchId }));
                }
              }}
              options={company.branches.map((b) => ({ value: b.id, label: b.name }))}
            />
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setShowEditBranchMember(false); setEditingBranchMember(null); setMemberForm({ email: '', password: '', role: 'CAJERO', branchId: '' }); }}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Guardar
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showEditCompanyMember} onClose={() => { setShowEditCompanyMember(false); setEditingCompanyMember(null); setCompanyMemberForm({ role: 'CAJERO' }); }} title="Editar Miembro de Empresa">
        <form onSubmit={handleUpdateCompanyMember} className="space-y-4">
          {editingCompanyMember && (
            <p className="text-sm text-[var(--ink-secondary)]">Editando: {editingCompanyMember.user.email}</p>
          )}
          <Select
            label="Rol en Empresa"
            value={companyMemberForm.role}
            onChange={(e) => setCompanyMemberForm({ role: e.target.value })}
            options={[
              { value: 'CAJERO', label: 'Cajero' },
              { value: 'RECEPCION', label: 'Recepción' },
              { value: 'ADMIN_EMPRESA', label: 'Admin Empresa' },
            ]}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setShowEditCompanyMember(false); setEditingCompanyMember(null); setCompanyMemberForm({ role: 'CAJERO' }); }}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Guardar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}