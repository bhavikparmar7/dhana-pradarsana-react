import { Button } from "@/components/ui/button";


import * as React from "react";

import { toast } from "sonner";
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontal, BanknoteArrowUp, BanknoteArrowDown, RefreshCcw } from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

type Transaction = {
  transactionId: string;
  date: string;
  description: string;
  amount: number;
  transactionType: string;
  category: string;
  subcategory?: string;
  remarks?: string;
};

export default function TransactionsPage() {
  const [data, setData] = React.useState<Transaction[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(15);
  const [total, setTotal] = React.useState(0);

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const jwt = localStorage.getItem("firebase_jwt");
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const res = await fetch(`${baseUrl}/transactions/by-userid?limit=${pageSize}&page=${page}`, {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const json = await res.json();
        setData(json.data || []);
        setTotal(json.total || 0);
      } catch (err) {
        const message = (err as Error).message || "Failed to fetch transactions";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page, pageSize]);

  const columns = React.useMemo<ColumnDef<Transaction, any>[]>(
    () => [
      {
        header: "Date",
        accessorKey: "date",
        cell: info => {
          const date = new Date(info.getValue<string>())
          const day = String(date.getDate()).padStart(2, '0')
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const year = date.getFullYear()
          return (
            <span className="text-gray-900 dark:text-gray-100 font-medium whitespace-nowrap">
              {`${day}-${month}-${year}`}
            </span>
          )
        },
      },
      {
        header: "Description",
        accessorKey: "description",
      },
      {
        header: () => <span className="text-right w-full block">Amount</span>,
        accessorKey: "amount",
        cell: info => {
          const value = Number(info.getValue());
          const absValue = Math.abs(value);
          const formatted = absValue.toLocaleString("en-IN");
          return (
            <span className="font-medium text-right w-full block whitespace-nowrap">
              {value < 0 ? `- ${formatted}` : formatted}
            </span>
          );
        },
        meta: { align: "right" },
      },
      {
        header: "Account Name",
        accessorKey: "accountName",
        cell: info => info.getValue() || "-",
      },
      {
        header: "Type",
        accessorKey: "transactionType",
        cell: info => {
          const value = (info.getValue<string>() || "").toLowerCase();
          if (value === "income") {
            return <span className="flex items-center gap-1 text-green-600 dark:text-green-400"><BanknoteArrowUp className="w-5 h-5" title="Income" /></span>;
          }
          if (value === "expense") {
            return <span className="flex items-center gap-1 text-red-600 dark:text-red-400"><BanknoteArrowDown className="w-5 h-5" title="Expense" /></span>;
          }
          if (value === "transfer") {
            // Use amber for transfer for better distinction
            return <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400"><RefreshCcw className="w-5 h-5" aria-label="Transfer" /></span>;
          }
          return <span className="text-gray-400">-</span>;
        },
      },
      {
        header: "Category",
        accessorKey: "category",
      },
      {
        header: "Sub-Category",
        accessorKey: "subcategory",
        cell: info => info.getValue() || "-",
      },
      {
        header: "Remarks",
        accessorKey: "remarks",
        cell: info => info.getValue() || "-",
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="More actions"
              >
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {}}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {}}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Pagination logic
  const totalPages = Math.ceil(total / pageSize);
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Transactions</h1>
      {loading && <div className="text-muted-foreground">Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}
      <div className="overflow-x-auto rounded-lg border bg-white dark:bg-gray-900">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 dark:bg-gray-800">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-4 py-2 text-left font-semibold whitespace-nowrap"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="border-b last:border-0">
                {row.getVisibleCells().map(cell => (
                  <td
                    key={cell.id}
                    className={
                      cell.column.id === "amount"
                        ? "px-4 py-2 text-right"
                        : "px-4 py-2"
                    }
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {data.length === 0 && !loading && (
              <tr>
                <td colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                  No transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination Controls */}
      <div className="flex items-center justify-between mt-4 gap-2">
        <div className="text-sm text-muted-foreground">
          Page {page} of {totalPages || 1} ({total} transactions)
        </div>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 rounded border bg-gray-100 dark:bg-gray-800 disabled:opacity-50 flex items-center justify-center"
            onClick={() => setPage(page - 1)}
            disabled={!canPrev}
            aria-label="Previous page"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <button
            className="px-3 py-1 rounded border bg-gray-100 dark:bg-gray-800 disabled:opacity-50 flex items-center justify-center"
            onClick={() => setPage(page + 1)}
            disabled={!canNext}
            aria-label="Next page"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
