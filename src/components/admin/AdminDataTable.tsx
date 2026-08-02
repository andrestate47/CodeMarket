import React from 'react';

interface Column<T> {
    header: string;
    accessor?: keyof T;
    cell?: (item: T) => React.ReactNode;
    style?: React.CSSProperties;
}

interface AdminDataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    keyExtractor: (item: T) => string | number;
    emptyText?: string;
    loading?: boolean;
}

export default function AdminDataTable<T>({
    columns,
    data,
    keyExtractor,
    emptyText = 'No hay registros para mostrar.',
    loading = false,
}: AdminDataTableProps<T>) {
    return (
        <div style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: '16px',
            overflow: 'hidden',
            width: '100%',
            transition: 'var(--transition)',
        }}>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                    <thead>
                        <tr style={{ background: 'var(--glass-bg)', borderBottom: '1px solid var(--glass-border)' }}>
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    style={{
                                        padding: '14px 18px',
                                        fontWeight: 700,
                                        color: 'var(--text-muted)',
                                        fontSize: '0.8rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        ...col.style,
                                    }}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-description)' }}>
                                    Cargando datos...
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-description)' }}>
                                    {emptyText}
                                </td>
                            </tr>
                        ) : (
                            data.map(item => (
                                <tr
                                    key={keyExtractor(item)}
                                    style={{
                                        borderBottom: '1px solid var(--glass-border)',
                                        transition: 'background 0.15s ease',
                                    }}
                                >
                                    {columns.map((col, idx) => (
                                        <td key={idx} style={{ padding: '16px 18px', color: 'var(--foreground)', ...col.style }}>
                                            {col.cell ? col.cell(item) : col.accessor ? String(item[col.accessor]) : null}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
