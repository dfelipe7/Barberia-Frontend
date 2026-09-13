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
  hoverable?: boolean;
  striped?: boolean;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No se encontraron registros.',
  hoverable = true,
  striped = true,
}: TableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="alert alert-light text-center py-4 text-muted border">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="table-responsive bg-white rounded shadow-sm">
      <table className={`table mb-0 align-middle ${hoverable ? 'table-hover' : ''} ${striped ? 'table-striped' : ''}`}>
        <thead className="table-light">
          <tr>
            {columns.map((col) => (
              <th key={col.key} scope="col" className={col.className}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={keyExtractor(item)}>
              {columns.map((col) => (
                <td key={col.key} className={col.className}>
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
