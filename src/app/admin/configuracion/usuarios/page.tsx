'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import {
    UserRole,
    UserPermissions,
    ROLE_LABELS,
    DEFAULT_ROLE_PERMISSIONS,
    PERMISSION_DESCRIPTIONS,
    getUserPermissions,
} from '@/lib/auth/permissions';

interface UserProfileRecord {
    id: string;
    full_name: string | null;
    email: string;
    phone?: string | null;
    role: UserRole | string;
    permissions?: Partial<UserPermissions> | null;
    is_active?: boolean;
    created_at: string;
}

export default function AdminUsersPermissionsPage() {
    const [users, setUsers] = useState<UserProfileRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');

    // Edit Modal State
    const [selectedUser, setSelectedUser] = useState<UserProfileRecord | null>(null);
    const [editingRole, setEditingRole] = useState<UserRole>('vendedor');
    const [editingPermissions, setEditingPermissions] = useState<UserPermissions>(DEFAULT_ROLE_PERMISSIONS.vendedor);
    const [isSaving, setIsSaving] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Create New Staff Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newRole, setNewRole] = useState<UserRole>('vendedor');
    const [newPermissions, setNewPermissions] = useState<UserPermissions>(DEFAULT_ROLE_PERMISSIONS.vendedor);

    // Fetch User Profiles
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error cargando usuarios:', error);
                setUsers([]);
            } else if (data && data.length > 0) {
                setUsers(data);
            } else {
                // Initial fallback seed if profiles table is empty in local dev
                const demoUsers: UserProfileRecord[] = [
                    {
                        id: 'demo-admin-1',
                        full_name: 'Andrés Tate',
                        email: 'andrestate47@gmail.com',
                        phone: '+51 999 888 777',
                        role: 'super_admin',
                        permissions: DEFAULT_ROLE_PERMISSIONS.super_admin,
                        is_active: true,
                        created_at: new Date().toISOString(),
                    },
                    {
                        id: 'demo-staff-2',
                        full_name: 'María García (Gerente)',
                        email: 'maria.garcia@codemarket.com',
                        phone: '+51 912 345 678',
                        role: 'manager',
                        permissions: DEFAULT_ROLE_PERMISSIONS.manager,
                        is_active: true,
                        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
                    },
                    {
                        id: 'demo-staff-3',
                        full_name: 'Carlos Ruiz (Vendedor)',
                        email: 'carlos.ruiz@codemarket.com',
                        phone: '+51 987 654 321',
                        role: 'vendedor',
                        permissions: DEFAULT_ROLE_PERMISSIONS.vendedor,
                        is_active: true,
                        created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
                    },
                ];
                setUsers(demoUsers);
            }
        } catch (err) {
            console.error('Excepción al cargar usuarios:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Filter Users
    const filteredUsers = users.filter(u => {
        const matchesSearch =
            !searchQuery.trim() ||
            (u.full_name && u.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (u.phone && u.phone.includes(searchQuery));

        const matchesRole = roleFilter === 'all' || u.role === roleFilter;

        return matchesSearch && matchesRole;
    });

    // Open Edit Modal
    const handleOpenEdit = (user: UserProfileRecord) => {
        setSelectedUser(user);
        const role = (user.role as UserRole) || 'vendedor';
        setEditingRole(role);
        const resolved = getUserPermissions(role, user.permissions);
        setEditingPermissions(resolved);
    };

    // Role selection inside modal updates permission presets
    const handleRolePresetChange = (role: UserRole) => {
        setEditingRole(role);
        setEditingPermissions({ ...DEFAULT_ROLE_PERMISSIONS[role] });
    };

    // Toggle specific permission
    const handleTogglePermission = (key: keyof UserPermissions) => {
        setEditingPermissions(prev => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    // Save Updated Permissions
    const handleSavePermissions = async () => {
        if (!selectedUser) return;
        setIsSaving(true);
        setNotification(null);

        try {
            const updatedUsers = users.map(u =>
                u.id === selectedUser.id
                    ? { ...u, role: editingRole, permissions: editingPermissions }
                    : u
            );
            setUsers(updatedUsers);

            // Persist in Supabase profiles
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: selectedUser.id,
                    email: selectedUser.email,
                    role: editingRole,
                    permissions: editingPermissions,
                    updated_at: new Date().toISOString(),
                });

            if (error) {
                console.warn('Advertencia al guardar en Supabase (simulado local):', error.message);
            }

            setNotification({ type: 'success', message: `Permisos de ${selectedUser.full_name || selectedUser.email} actualizados correctamente.` });
            setSelectedUser(null);
        } catch (err) {
            setNotification({ type: 'error', message: 'Error al actualizar permisos.' });
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    // Create New Staff Member
    const handleCreateStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEmail.trim() || !newName.trim()) return;

        setIsSaving(true);
        try {
            const newUserRecord: UserProfileRecord = {
                id: `user-${Date.now()}`,
                full_name: newName.trim(),
                email: newEmail.trim().toLowerCase(),
                phone: newPhone.trim() || null,
                role: newRole,
                permissions: newPermissions,
                is_active: true,
                created_at: new Date().toISOString(),
            };

            setUsers(prev => [newUserRecord, ...prev]);

            // Attempt insert into DB
            await supabase.from('profiles').insert({
                id: newUserRecord.id,
                full_name: newUserRecord.full_name,
                email: newUserRecord.email,
                phone: newUserRecord.phone,
                role: newUserRecord.role,
                permissions: newUserRecord.permissions,
            });

            setNotification({ type: 'success', message: `Usuario ${newName} agregado como ${ROLE_LABELS[newRole]?.label || newRole}.` });
            setShowCreateModal(false);
            setNewName('');
            setNewEmail('');
            setNewPhone('');
        } catch (err) {
            console.error('Error creando usuario:', err);
            setNotification({ type: 'error', message: 'Error al registrar nuevo usuario staff.' });
        } finally {
            setIsSaving(false);
        }
    };

    // Toggle active status
    const handleToggleUserStatus = async (user: UserProfileRecord) => {
        const nextStatus = !user.is_active;
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: nextStatus } : u));

        try {
            await supabase.from('profiles').update({ is_active: nextStatus }).eq('id', user.id);
        } catch {
            // local state already updated
        }
    };

    return (
        <div style={{ maxWidth: '1200px' }}>
            <AdminPageHeader
                title="Gestión de Usuarios y Permisos"
                description="Asigna roles a tu equipo (Administradores, Gerentes, Vendedores, Soporte) y gestiona permisos de acceso granulares."
                action={
                    <button
                        type="button"
                        onClick={() => setShowCreateModal(true)}
                        style={{
                            padding: '10px 18px',
                            background: 'var(--robotina-orange, #f97316)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontWeight: 700,
                            fontSize: '0.88rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 4px 14px rgba(249, 115, 22, 0.3)',
                        }}
                    >
                        ➕ Crear / Invitar Usuario Staff
                    </button>
                }
            />

            {notification && (
                <div
                    style={{
                        padding: '14px 18px',
                        borderRadius: '12px',
                        marginBottom: '20px',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        background: notification.type === 'success' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                        color: notification.type === 'success' ? '#22c55e' : '#ef4444',
                        border: `1.5px solid ${notification.type === 'success' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <span>{notification.type === 'success' ? '✅' : '⚠️'} {notification.message}</span>
                    <button
                        onClick={() => setNotification(null)}
                        style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 800 }}
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Filter Bar & Role Selector */}
            <div style={{ display: 'flex', gap: '14px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ position: 'relative', flex: '1', minWidth: '280px', maxWidth: '460px' }}>
                    <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                        🔍
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Buscar por nombre, correo o teléfono..."
                        style={{
                            width: '100%',
                            padding: '10px 14px 10px 42px',
                            background: 'var(--input-bg)',
                            border: '1.5px solid var(--glass-border)',
                            borderRadius: '10px',
                            color: 'var(--input-text)',
                            fontSize: '0.88rem',
                            outline: 'none',
                        }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {['all', 'super_admin', 'admin', 'manager', 'vendedor', 'inventario', 'soporte'].map(r => (
                        <button
                            key={r}
                            type="button"
                            onClick={() => setRoleFilter(r)}
                            style={{
                                padding: '7px 12px',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                border: roleFilter === r ? '1.5px solid var(--robotina-orange)' : '1.5px solid var(--glass-border)',
                                background: roleFilter === r ? 'rgba(249, 115, 22, 0.15)' : 'var(--card-bg)',
                                color: roleFilter === r ? 'var(--robotina-orange)' : 'var(--text-muted)',
                            }}
                        >
                            {r === 'all' ? 'Todos los roles' : ROLE_LABELS[r as UserRole]?.badge || r}
                        </button>
                    ))}
                </div>
            </div>

            {/* User List Table */}
            {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando usuarios y permisos...</div>
            ) : filteredUsers.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>👤</div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--foreground)' }}>No se encontraron usuarios</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>Intenta ajustar tus filtros de búsqueda o crea un nuevo usuario staff.</div>
                </div>
            ) : (
                <div style={{ background: 'var(--card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                        <thead>
                            <tr style={{ background: 'var(--input-bg)', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                <th style={{ padding: '14px 18px' }}>Usuario / Miembro</th>
                                <th style={{ padding: '14px 18px' }}>Rol Asignado</th>
                                <th style={{ padding: '14px 18px' }}>Permisos Activos</th>
                                <th style={{ padding: '14px 18px' }}>Estado</th>
                                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => {
                                const userRoleKey = (user.role as UserRole) || 'customer';
                                const roleMeta = ROLE_LABELS[userRoleKey] || { label: user.role, color: '#6b7280', badge: user.role };
                                const permissionsObj = getUserPermissions(userRoleKey, user.permissions);
                                const activePermsCount = Object.values(permissionsObj).filter(Boolean).length;
                                const totalPermsCount = Object.keys(PERMISSION_DESCRIPTIONS).length;

                                return (
                                    <tr key={user.id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.15s ease' }}>
                                        {/* User Details */}
                                        <td style={{ padding: '14px 18px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div
                                                    style={{
                                                        width: '42px',
                                                        height: '42px',
                                                        borderRadius: '50%',
                                                        background: `linear-gradient(135deg, ${roleMeta.color} 0%, #1e293b 100%)`,
                                                        color: 'white',
                                                        fontWeight: 800,
                                                        fontSize: '0.95rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                                    }}
                                                >
                                                    {(user.full_name || user.email || 'U').slice(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 800, color: 'var(--foreground)', fontSize: '0.94rem' }}>
                                                        {user.full_name || 'Sin Nombre'}
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                        {user.email} {user.phone && `• ${user.phone}`}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Role Badge */}
                                        <td style={{ padding: '14px 18px' }}>
                                            <span
                                                style={{
                                                    padding: '4px 10px',
                                                    borderRadius: '6px',
                                                    fontSize: '0.78rem',
                                                    fontWeight: 800,
                                                    background: `${roleMeta.color}20`,
                                                    color: roleMeta.color,
                                                    border: `1px solid ${roleMeta.color}40`,
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                }}
                                            >
                                                {roleMeta.badge}
                                            </span>
                                        </td>

                                        {/* Permissions Count */}
                                        <td style={{ padding: '14px 18px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: activePermsCount > 0 ? '#10b981' : 'var(--text-muted)' }}>
                                                    {activePermsCount} de {totalPermsCount} activos
                                                </span>
                                                <div style={{ width: '60px', height: '6px', background: 'var(--input-bg)', borderRadius: '3px', overflow: 'hidden' }}>
                                                    <div
                                                        style={{
                                                            width: `${(activePermsCount / totalPermsCount) * 100}%`,
                                                            height: '100%',
                                                            background: activePermsCount === totalPermsCount ? '#10b981' : 'var(--robotina-orange)',
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </td>

                                        {/* Status Toggle */}
                                        <td style={{ padding: '14px 18px' }}>
                                            <button
                                                type="button"
                                                onClick={() => handleToggleUserStatus(user)}
                                                style={{
                                                    padding: '4px 10px',
                                                    borderRadius: '20px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 800,
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    background: user.is_active !== false ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                                    color: user.is_active !== false ? '#16a34a' : '#ef4444',
                                                }}
                                            >
                                                {user.is_active !== false ? '● Activo' : '○ Inactivo'}
                                            </button>
                                        </td>

                                        {/* Actions */}
                                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                                            <button
                                                type="button"
                                                onClick={() => handleOpenEdit(user)}
                                                style={{
                                                    padding: '7px 14px',
                                                    background: 'var(--input-bg)',
                                                    border: '1.5px solid var(--glass-border)',
                                                    borderRadius: '8px',
                                                    color: 'var(--foreground)',
                                                    fontSize: '0.82rem',
                                                    fontWeight: 700,
                                                    cursor: 'pointer',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                }}
                                            >
                                                ⚙️ Configurar Permisos
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* EDIT PERMISSIONS MODAL */}
            {selectedUser && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 99,
                        background: 'rgba(0,0,0,0.65)',
                        backdropFilter: 'blur(6px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px',
                    }}
                    onClick={() => setSelectedUser(null)}
                >
                    <div
                        style={{
                            background: 'var(--card-bg)',
                            border: '1.5px solid var(--glass-border)',
                            borderRadius: '20px',
                            padding: '28px',
                            maxWidth: '680px',
                            width: '100%',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--foreground)' }}>
                                    🔐 Ajustar Permisos de {selectedUser.full_name || selectedUser.email}
                                </h3>
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                    Selecciona un rol predeterminado o personaliza los permisos individualmente.
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedUser(null)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Role Preset Selector */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '8px' }}>
                                Rol Principal del Usuario:
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                                {(Object.keys(ROLE_LABELS) as UserRole[]).map(roleKey => {
                                    const meta = ROLE_LABELS[roleKey];
                                    const isSelected = editingRole === roleKey;

                                    return (
                                        <div
                                            key={roleKey}
                                            onClick={() => handleRolePresetChange(roleKey)}
                                            style={{
                                                padding: '10px 12px',
                                                borderRadius: '10px',
                                                cursor: 'pointer',
                                                border: isSelected ? `2px solid ${meta.color}` : '1.5px solid var(--glass-border)',
                                                background: isSelected ? `${meta.color}15` : 'var(--input-bg)',
                                                transition: 'all 0.15s ease',
                                            }}
                                        >
                                            <div style={{ fontWeight: 800, fontSize: '0.86rem', color: isSelected ? meta.color : 'var(--foreground)' }}>
                                                {meta.badge}
                                            </div>
                                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                {meta.description}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Granular Permission Switches */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '12px' }}>
                                Permisos Granulares Activos:
                            </label>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {(Object.keys(PERMISSION_DESCRIPTIONS) as Array<keyof UserPermissions>).map(permKey => {
                                    const info = PERMISSION_DESCRIPTIONS[permKey];
                                    const isChecked = !!editingPermissions[permKey];

                                    return (
                                        <div
                                            key={permKey}
                                            onClick={() => handleTogglePermission(permKey)}
                                            style={{
                                                padding: '12px 16px',
                                                borderRadius: '10px',
                                                background: 'var(--input-bg)',
                                                border: '1.5px solid var(--glass-border)',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                cursor: 'pointer',
                                                transition: 'background 0.15s ease',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ fontSize: '1.2rem' }}>{info.icon}</span>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--foreground)' }}>
                                                        {info.label}
                                                    </div>
                                                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                                        Categoría: {info.group}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Custom Switch Component */}
                                            <div
                                                style={{
                                                    width: '44px',
                                                    height: '24px',
                                                    borderRadius: '12px',
                                                    background: isChecked ? 'var(--robotina-orange)' : 'rgba(255,255,255,0.15)',
                                                    position: 'relative',
                                                    transition: 'background 0.2s ease',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: '18px',
                                                        height: '18px',
                                                        borderRadius: '50%',
                                                        background: 'white',
                                                        position: 'absolute',
                                                        top: '3px',
                                                        left: isChecked ? '23px' : '3px',
                                                        transition: 'left 0.2s ease',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Modal Action Buttons */}
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                onClick={() => setSelectedUser(null)}
                                style={{
                                    padding: '10px 18px',
                                    background: 'var(--input-bg)',
                                    border: '1.5px solid var(--glass-border)',
                                    borderRadius: '10px',
                                    color: 'var(--foreground)',
                                    fontSize: '0.88rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                disabled={isSaving}
                                onClick={handleSavePermissions}
                                style={{
                                    padding: '10px 22px',
                                    background: 'var(--robotina-orange)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontSize: '0.88rem',
                                    fontWeight: 800,
                                    cursor: isSaving ? 'not-allowed' : 'pointer',
                                    boxShadow: '0 4px 14px rgba(249, 115, 22, 0.35)',
                                }}
                            >
                                {isSaving ? 'Guardando...' : '💾 Guardar Permisos'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CREATE STAFF MODAL */}
            {showCreateModal && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 99,
                        background: 'rgba(0,0,0,0.65)',
                        backdropFilter: 'blur(6px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px',
                    }}
                    onClick={() => setShowCreateModal(false)}
                >
                    <form
                        onSubmit={handleCreateStaff}
                        style={{
                            background: 'var(--card-bg)',
                            border: '1.5px solid var(--glass-border)',
                            borderRadius: '20px',
                            padding: '28px',
                            maxWidth: '520px',
                            width: '100%',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.15rem', fontWeight: 800, color: 'var(--foreground)' }}>
                            ➕ Crear / Invitar Usuario Staff
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                            <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--foreground)', display: 'block', marginBottom: '4px' }}>
                                    Nombre Completo *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    placeholder="Ej: Lucía Morales"
                                    style={{ width: '100%', padding: '10px 12px', background: 'var(--input-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '8px', color: 'var(--input-text)' }}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--foreground)', display: 'block', marginBottom: '4px' }}>
                                    Correo Electrónico *
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={newEmail}
                                    onChange={e => setNewEmail(e.target.value)}
                                    placeholder="lucia@codemarket.com"
                                    style={{ width: '100%', padding: '10px 12px', background: 'var(--input-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '8px', color: 'var(--input-text)' }}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--foreground)', display: 'block', marginBottom: '4px' }}>
                                    Teléfono / WhatsApp
                                </label>
                                <input
                                    type="text"
                                    value={newPhone}
                                    onChange={e => setNewPhone(e.target.value)}
                                    placeholder="+51 999 111 222"
                                    style={{ width: '100%', padding: '10px 12px', background: 'var(--input-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '8px', color: 'var(--input-text)' }}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--foreground)', display: 'block', marginBottom: '4px' }}>
                                    Rol Asignado Inicial
                                </label>
                                <select
                                    value={newRole}
                                    onChange={e => {
                                        const r = e.target.value as UserRole;
                                        setNewRole(r);
                                        setNewPermissions({ ...DEFAULT_ROLE_PERMISSIONS[r] });
                                    }}
                                    style={{ width: '100%', padding: '10px 12px', background: 'var(--input-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '8px', color: 'var(--input-text)' }}
                                >
                                    <option value="vendedor">🛍️ Vendedor / Comercial</option>
                                    <option value="manager">👔 Gerente / Manager</option>
                                    <option value="inventario">📦 Gestor de Inventario</option>
                                    <option value="soporte">🎧 Soporte Técnico</option>
                                    <option value="admin">👑 Administrador</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(false)}
                                style={{ padding: '9px 16px', background: 'var(--input-bg)', border: '1.5px solid var(--glass-border)', borderRadius: '8px', color: 'var(--foreground)', fontWeight: 700 }}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                style={{ padding: '9px 20px', background: 'var(--robotina-orange)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}
                            >
                                {isSaving ? 'Guardando...' : 'Crear Usuario Staff'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
