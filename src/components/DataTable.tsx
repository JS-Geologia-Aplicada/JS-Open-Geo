import { Table } from "react-bootstrap";

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  align?: "start" | "center" | "end";
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  title?: string;
  maxHeight?: string;
  emptyMessage?: string;
  striped?: boolean;
  bordered?: boolean;
  hover?: boolean;
  size?: "sm" | undefined;
  rowClassName?: (row: T) => string;
}

export const DataTable = <T extends Record<string, any>>({
  data,
  columns,
  title = "",
  maxHeight = "500px",
  emptyMessage = "Nenhum dado disponível",
  striped = true,
  bordered = true,
  hover = true,
  size = "sm",
  rowClassName,
}: DataTableProps<T>) => {
  if (data.length === 0) {
    return (
      <div className="text-center text-muted py-4">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      {title.trim() && <h5 className="mb-3">{title.trim()}</h5>}
      <div
        style={{
          maxHeight,
          overflow: "auto",
          border: "1px solid #dee2e6",
          borderRadius: "4px",
        }}
      >
        <Table
          striped={striped}
          bordered={bordered}
          hover={hover}
          size={size}
          className="mb-0"
        >
          <thead
            style={{
              position: "sticky",
              top: 0,
              backgroundColor: "white",
              zIndex: 10,
            }}
          >
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={col.align ? `text-${col.align}` : ""}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} className={rowClassName ? rowClassName(row) : ""}>
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={col.align ? `text-${col.align}` : ""}
                  >
                    {col.render
                      ? col.render(row, index)
                      : String(row[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </>
  );
};
