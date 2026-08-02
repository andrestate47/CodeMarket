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
            background: '#0e0e14',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            overflow: 'hidden',
            width: '100%',
        }}>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    style={{
                                        padding: '14px 18px',
                                        fontWeight: 700,
                                        color: '#a1a1aa',
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
                                <td colSpan={columns.length} style={{ padding: '32px', textAlign: 'center', color: '#71717a' }}>
                                    Cargando datos...
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} style={{ padding: '32px', textAlign: 'center', color: '#71717a' }}>
                                    {emptyText}
                                </td>
                            </tr>
                        ) : (
                            data.map(item => (
                                <tr
                                    key={keyExtractor(item)}
                                    style={{
                                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                        transition: 'background 0.15s ease',
                                    }}
                                >
                                    {columns.map((col, idx) => (
                                        <td key={idx} style={{ padding: '16px 18px', color: '#e4e4e7', ...col.style }}>
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
