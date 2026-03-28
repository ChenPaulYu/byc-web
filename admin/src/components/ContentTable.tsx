import React from 'react';

export interface Column {
  key: string;
  label: string;
  render?: (value: unknown, item: Record<string, unknown>) => React.ReactNode;
}

interface ContentTableProps {
  columns: Column[];
  rows: Record<string, unknown>[];
  onEdit: (slug: string) => void;
  onDelete: (slug: string) => void;
}

const ContentTable: React.FC<ContentTableProps> = ({ columns, rows, onEdit, onDelete }) => {
  if (rows.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-400">
        <p className="text-sm">No content yet.</p>
      </div>
    );
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-neutral-200">
          {columns.map((col) => (
            <th key={col.key} className="text-left text-[11px] font-medium text-neutral-400 uppercase tracking-wide px-4 py-3">
              {col.label}
            </th>
          ))}
          <th className="text-right text-[11px] font-medium text-neutral-400 uppercase tracking-wide px-4 py-3">
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={row.slug as string}
            className="border-b border-neutral-100 hover:bg-neutral-50/50 cursor-pointer transition-colors"
            onClick={() => onEdit(row.slug as string)}
          >
            {columns.map((col) => (
              <td key={col.key} className="px-4 py-3 text-sm text-neutral-700">
                {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '')}
              </td>
            ))}
            <td className="px-4 py-3 text-right">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(row.slug as string); }}
                className="text-xs text-neutral-500 hover:text-neutral-900 mr-3 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(row.slug as string); }}
                className="text-xs text-neutral-400 hover:text-red-500 transition-colors"
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ContentTable;
