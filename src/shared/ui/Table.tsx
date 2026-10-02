import React from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  emptyMessage?: string;
  emptyContent?: React.ReactNode;
  hoverable?: boolean;
  striped?: boolean;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No se encontraron registros.',
  emptyContent,
  hoverable = true,
  striped = true,
}: TableProps<T>) {
  if (data.length === 0) {
    if (emptyContent) {
      return <>{emptyContent}</>;
    }
    return (
      <div className="alert alert-light text-center py-4 text-muted border">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      className="table-responsive custom-table-wrapper bg-white rounded-3 shadow-sm border"
      style={{
        overflow: 'visible',
        minHeight: data.length > 0 && data.length <= 2 ? '220px' : 'auto',
      }}
    >
      <table className={`table custom-app-table mb-0 align-middle ${hoverable ? 'table-hover' : ''} ${striped ? 'table-striped' : ''}`}>
        <thead className="custom-table-header">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className="text-center align-middle py-3 px-3 fw-bold"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={keyExtractor(item)}>
              {columns.map((col) => (
                <td key={col.key} className={`align-middle py-3 px-3 ${col.className || ''}`}>
                  {col.render ? col.render(item) : (item as Record<string, unknown>)[col.key] as React.ReactNode}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
