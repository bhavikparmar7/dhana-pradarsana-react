import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';

import React from "react";
import { CircleDot, CircleCheck, TicketMinus, TicketCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ResolveDialog } from "@/components/resolve-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Remove Shadcn Form system, use only UI components
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from "@/components/ui/table";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";

type Account = {
  id: string;
  name: string;
  productName?: string;
  accountNumber?: string;
  accountType: string;
  isStatementExtracted?: boolean;
  fileFormatsAllowed?: string[];
};


export default function FileStatementsPage() {
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedAccountId, setSelectedAccountId] = React.useState<string>("");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [fileError, setFileError] = React.useState<string | null>(null);

  // Filter accounts for dropdown (only those with isStatementExtracted true)
  const uploadableAccounts: Account[] = accounts.filter((a: Account) => a.isStatementExtracted);
  const selectedAccount: Account | undefined = uploadableAccounts.find((a: Account) => a.id === selectedAccountId);

  React.useEffect(() => {
    const fetchAccounts = async () => {
      setLoading(true);
      setError(null);
      try {
        const jwt = localStorage.getItem("firebase_jwt");
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const res = await fetch(`${baseUrl}/accounts/by-userid`, {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const json = await res.json();
        setAccounts(json);
      } catch (err) {
        setError((err as Error).message || "Failed to fetch accounts");
      } finally {
        setLoading(false);
      }
    };
    fetchAccounts();
  }, []);

  // --- File list and raw transactions state for each account tab ---
  // We'll use a local state object to cache file lists per accountId
  type RawFile = {
    rawFileId: string;
    userId: string;
    accountId: string;
    accountName: string;
    fileKey: string;
    uploadedFileName: string;
    status: string;
    uploadedAt?: string;
    resolvedTransactionsCount?: number;
    totalTransactionsCount?: number;
  };
  const [filesByAccount, setFilesByAccount] = React.useState<Record<string, RawFile[]>>({});
  const [filesLoading, setFilesLoading] = React.useState<Record<string, boolean>>({});
  const [filesError, setFilesError] = React.useState<Record<string, string | null>>({});

  // Track which tab is active
  const [activeTab, setActiveTab] = React.useState<string>("");

  // Auto-select first tab when uploadableAccounts changes (page load or accounts fetch)
  React.useEffect(() => {
    if (uploadableAccounts.length > 0 && !activeTab) {
      setActiveTab(uploadableAccounts[0].id);
    }
  }, [uploadableAccounts, activeTab]);

  // Auto-select first file when tab changes and files are loaded
  React.useEffect(() => {
    if (!activeTab) return;
    const files = filesByAccount[activeTab];
    if (files && files.length > 0) {
      // If already selected, don't re-fetch
      if (selectedFileKey !== files[0].fileKey) {
        setSelectedFileKey(files[0].fileKey);
        setRawTxError(prev => ({ ...prev, [files[0].fileKey]: null }));
        setRawTxLoading(prev => ({ ...prev, [files[0].fileKey]: true }));
        const fetchTx = async () => {
          try {
            const jwt = localStorage.getItem("firebase_jwt");
            const baseUrl = import.meta.env.VITE_API_BASE_URL;
            const res = await fetch(`${baseUrl}/raw-transactions/by-filekey?fileKey=${encodeURIComponent(files[0].fileKey)}`, {
              headers: { Authorization: `Bearer ${jwt}` },
            });
            if (!res.ok) throw new Error(`API error: ${res.status}`);
            const json = await res.json();
            const txs = Array.isArray(json) ? json : (json.data || []);
            setRawTxByFile(prev => ({ ...prev, [files[0].fileKey]: txs }));
          } catch (err) {
            setRawTxError(prev => ({ ...prev, [files[0].fileKey]: (err as Error).message || "Failed to fetch transactions" }));
          } finally {
            setRawTxLoading(prev => ({ ...prev, [files[0].fileKey]: false }));
          }
        };
        fetchTx();
      }
    } else {
      setSelectedFileKey(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, filesByAccount]);

  // Raw transactions state per fileKey
  type RawTransaction = {
    rawTransactionId: string;
    date: string;
    description: string;
    amount: number;
    status: string;
    transactionType?: string;
    category?: string;
    subcategory?: string;
  };
  const [rawTxByFile, setRawTxByFile] = React.useState<Record<string, RawTransaction[]>>({});
  const [rawTxLoading, setRawTxLoading] = React.useState<Record<string, boolean>>({});
  const [rawTxError, setRawTxError] = React.useState<Record<string, string | null>>({});
  const [selectedFileKey, setSelectedFileKey] = React.useState<string | null>(null);

  // Table columns for react-table
  const columns = React.useMemo<ColumnDef<RawTransaction, unknown>[]>(() => [
    {
      accessorKey: 'date',
      header: 'Date',
      cell: info => {
        const value = info.getValue() as string;
        if (!value) return '';
        const d = new Date(value);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      },
    },
    { accessorKey: 'description', header: 'Description' },
    { accessorKey: 'amount', header: 'Amount', cell: info => <span className="text-right">{info.getValue() as number}</span> },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: function StatusCell(info) {
        const value = (info.getValue() as string)?.toLowerCase();
        const row = info.row?.original;
        const [open, setOpen] = React.useState(false);
        if (value === 'resolved') {
          return (
            <span className="flex items-center justify-center gap-1 text-green-600 w-full">
              <CircleCheck size={16} aria-label="Resolved" />
              <span className="sr-only">Resolved</span>
            </span>
          );
        }
        return (
          <>
            <button
              type="button"
              className="flex items-center justify-center gap-1 text-muted-foreground w-full hover:text-yellow-600 focus:outline-none"
              onClick={e => {
                e.stopPropagation();
                setOpen(true);
              }}
              tabIndex={0}
              aria-label="Resolve transaction"
            >
              <CircleDot size={16} aria-label="Unresolved" />
              <span className="sr-only">Unresolved</span>
            </button>
            <ResolveDialog
              open={open}
              onOpenChange={setOpen}
              selectedrawTransactionId={row?.rawTransactionId}
              date={row?.date}
              description={row?.description}
              amount={row?.amount}
accounts={accounts.map(acc => ({ id: acc.id, name: acc.name, productName: acc.productName, accountType: acc.accountType }))}
              accountId={activeTab}
              onResolved={async () => {
                // Refresh transactions for the selected file
                if (selectedFileKey) {
                  setRawTxError(prev => ({ ...prev, [selectedFileKey]: null }));
                  setRawTxLoading(prev => ({ ...prev, [selectedFileKey]: true }));
                  const fetchTx = async () => {
                    try {
                      const jwt = localStorage.getItem("firebase_jwt");
                      const baseUrl = import.meta.env.VITE_API_BASE_URL;
                      const res = await fetch(`${baseUrl}/raw-transactions/by-filekey?fileKey=${encodeURIComponent(selectedFileKey)}`, {
                        headers: { Authorization: `Bearer ${jwt}` },
                      });
                      if (!res.ok) throw new Error(`API error: ${res.status}`);
                      const json = await res.json();
                      const txs = Array.isArray(json) ? json : (json.data || []);
                      setRawTxByFile(prev => ({ ...prev, [selectedFileKey]: txs }));
                    } catch (err) {
                      setRawTxError(prev => ({ ...prev, [selectedFileKey]: (err as Error).message || "Failed to fetch transactions" }));
                    } finally {
                      setRawTxLoading(prev => ({ ...prev, [selectedFileKey]: false }));
                    }
                  };
                  await fetchTx();
                }
                // Refresh files for the active account (to update icons)
                if (activeTab) {
                  setFilesLoading(prev => ({ ...prev, [activeTab]: true }));
                  setFilesError(prev => ({ ...prev, [activeTab]: null }));
                  try {
                    const jwt = localStorage.getItem("firebase_jwt");
                    const baseUrl = import.meta.env.VITE_API_BASE_URL;
                    const res = await fetch(`${baseUrl}/raw-files/by-accountid?accountId=${encodeURIComponent(activeTab)}`, {
                      headers: { Authorization: `Bearer ${jwt}` },
                    });
                    if (!res.ok) throw new Error(`API error: ${res.status}`);
                    const json = await res.json();
                    setFilesByAccount(prev => {
                      // Try to keep the same file selected if it still exists
                      const prevSelected = selectedFileKey;
                      const newFiles = json;
                      setTimeout(() => {
                        if (prevSelected && Array.isArray(newFiles) && newFiles.some(f => f.fileKey === prevSelected)) {
                          setSelectedFileKey(prevSelected);
                        } else if (Array.isArray(newFiles) && newFiles.length > 0) {
                          setSelectedFileKey(newFiles[0].fileKey);
                        } else {
                          setSelectedFileKey(null);
                        }
                      }, 0);
                      return { ...prev, [activeTab]: newFiles };
                    });
                  } catch (err) {
                    setFilesError(prev => ({ ...prev, [activeTab]: (err as Error).message || "Failed to fetch files" }));
                  } finally {
                    setFilesLoading(prev => ({ ...prev, [activeTab]: false }));
                  }
                }
              }}
            />
          </>
        );
      },
    },
  ], [accounts, activeTab, selectedFileKey]);

  // --- TanStack Table instance for selected file ---
  const table = useReactTable({
    data: selectedFileKey && rawTxByFile[selectedFileKey] ? rawTxByFile[selectedFileKey] : [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    debugTable: false,
  });

  // Fetch files for the active tab/account
  // Only retry fetching files for a tab if the user clicks the tab again after an error
  // Removed unused lastTriedTabRef
  React.useEffect(() => {
    if (!activeTab) return;
    // Always fetch files when tab is switched (do not cache)
    setFilesLoading(prev => ({ ...prev, [activeTab]: true }));
    setFilesError(prev => ({ ...prev, [activeTab]: null }));
    const fetchFiles = async () => {
      try {
        const jwt = localStorage.getItem("firebase_jwt");
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const res = await fetch(`${baseUrl}/raw-files/by-accountid?accountId=${encodeURIComponent(activeTab)}`, {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        if (!res.ok) {
          const msg = `Failed to fetch files (${res.status})`;
          setFilesError(prev => ({ ...prev, [activeTab]: msg }));
          toast.error(msg);
          return;
        }
        const json = await res.json();
        setFilesByAccount(prev => ({ ...prev, [activeTab]: json }));
      } catch (err) {
        const msg = (err as Error).message || "Failed to fetch files";
        setFilesError(prev => ({ ...prev, [activeTab]: msg }));
        toast.error(msg);
      } finally {
        setFilesLoading(prev => ({ ...prev, [activeTab]: false }));
      }
    };
    fetchFiles();
    //
  }, [activeTab]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">File Statements</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setDialogOpen(true)}>
              Upload File
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Statement File</DialogTitle>
              <DialogDescription>
                Select an account and upload a PDF or CSV statement file.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={async e => {
                e.preventDefault();
                setFileError(null);
                if (!selectedAccountId || !selectedFile) return;
                try {
                  const jwt = localStorage.getItem("firebase_jwt");
                  const baseUrl = import.meta.env.VITE_API_BASE_URL;
                  const formData = new FormData();
                  formData.append("file", selectedFile);
                  const res = await fetch(`${baseUrl}/raw-files/upload?accountId=${encodeURIComponent(selectedAccountId)}`, {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${jwt}`
                    },
                    body: formData
                  });
                  if (!res.ok) {
                    const msg = res.status === 401 ? "Unauthorized" : `Upload failed (${res.status})`;
                    setFileError(msg);
                    return;
                  }
                  setDialogOpen(false);
                  setSelectedAccountId("");
                  setSelectedFile(null);
                  setFileError(null);
                  // Optionally, trigger a reload or toast
                  // Invalidate file list for the selected account
                  setFilesByAccount(prev => {
                    const updated = { ...prev };
                    delete updated[selectedAccountId];
                    return updated;
                  });
                } catch (err) {
                  setFileError((err as Error).message || "Upload failed");
                }
              }}
              className="space-y-4"
            >
              {/* Account Dropdown */}
              <div>
                <Label htmlFor="account">Account</Label>
                <Select
                  value={selectedAccountId}
                  onValueChange={val => {
                    setSelectedAccountId(val);
                    setSelectedFile(null);
                    setFileError(null);
                  }}
                  required
                >
                  <SelectTrigger id="account">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {uploadableAccounts.map((acc: Account) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name} {acc.productName ? `(${acc.productName})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* File Input */}
              <div>
                <Label htmlFor="file">Statement File</Label>
                <Input
                  id="file"
                  type="file"
                  accept={selectedAccount?.fileFormatsAllowed?.map((f: string) => `.${f}`).join(",") || ".pdf,.csv"}
                  onChange={e => {
                    setFileError(null);
                    const file = (e.target as HTMLInputElement).files?.[0] || null;
                    if (!file) {
                      setSelectedFile(null);
                      return;
                    }
                    // Validate file extension
                    const allowed = selectedAccount?.fileFormatsAllowed || [];
                    const ext = file.name.split(".").pop()?.toLowerCase();
                    if (allowed.length && ext && !allowed.includes(ext)) {
                      setFileError(`File type .${ext} not allowed. Allowed: ${allowed.join(", ")}`);
                      setSelectedFile(null);
                    } else {
                      setSelectedFile(file);
                    }
                  }}
                  disabled={!selectedAccountId}
                  required
                />
                {fileError && <div className="text-red-500 text-sm mt-1">{fileError}</div>}
              </div>
              {/* Dialog Actions */}
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={!selectedAccountId || !selectedFile || !!fileError}>
                  Submit
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {loading && <div className="text-muted-foreground">Loading accounts...</div>}
      {error && <div className="text-red-500">{error}</div>}
      {/* Tabs for accounts with isStatementExtracted */}
      {uploadableAccounts.length > 0 && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList>
            {uploadableAccounts.map(acc => (
              <TabsTrigger key={acc.id} value={acc.id}>
                {acc.name} {acc.productName ? `(${acc.productName})` : ""}
              </TabsTrigger>
            ))}
          </TabsList>
  <div className="relative w-full flex-1 min-h-0 overflow-hidden">
            {uploadableAccounts.map(acc => (
              <TabsContent
                key={acc.id}
                value={acc.id}
                className="flex gap-2 min-h-[400px]"
              >
                {/* Left: Uploaded files list */}
                <div className="w-72 shrink-0">
                  <ScrollArea className="h-full rounded-md border bg-background z-10">
                    {filesLoading[acc.id] && (
                      <div className="p-4 text-muted-foreground text-center">Loading files...</div>
                    )}
                    {!filesLoading[acc.id] && !filesError[acc.id] && filesByAccount[acc.id]?.length === 0 && (
                      <div className="p-4 text-muted-foreground text-center">No files uploaded yet.</div>
                    )}
                    {!filesLoading[acc.id] && !filesError[acc.id] && filesByAccount[acc.id]?.length > 0 && (
                      <ul className="divide-y">
                        {filesByAccount[acc.id].map((file: RawFile) => (
                        <li
                          key={file.fileKey}
                          className={`px-4 py-3 hover:bg-muted/60 cursor-pointer relative ${selectedFileKey === file.fileKey ? 'bg-muted/100' : ''}`}
                          style={{ userSelect: 'none' }}
                          tabIndex={0}
                          role="button"
                          aria-pressed={selectedFileKey === file.fileKey}
                          onClick={() => {
                            setSelectedFileKey(file.fileKey);
                            setRawTxError(prev => ({ ...prev, [file.fileKey]: null }));
                            setRawTxLoading(prev => ({ ...prev, [file.fileKey]: true }));
                            const fetchTx = async () => {
                              try {
                                const jwt = localStorage.getItem("firebase_jwt");
                                const baseUrl = import.meta.env.VITE_API_BASE_URL;
                                const res = await fetch(`${baseUrl}/raw-transactions/by-filekey?fileKey=${encodeURIComponent(file.fileKey)}`, {
                                  headers: { Authorization: `Bearer ${jwt}` },
                                });
                                if (!res.ok) throw new Error(`API error: ${res.status}`);
                                const json = await res.json();
                                const txs = Array.isArray(json) ? json : (json.data || []);
                                setRawTxByFile(prev => ({ ...prev, [file.fileKey]: txs }));
                              } catch (err) {
                                setRawTxError(prev => ({ ...prev, [file.fileKey]: (err as Error).message || "Failed to fetch transactions" }));
                              } finally {
                                setRawTxLoading(prev => ({ ...prev, [file.fileKey]: false }));
                              }
                            };
                            fetchTx();
                          }}
                        >
                          <div
                            className="text-sm font-medium break-words whitespace-normal w-full"
                            title={file.uploadedFileName}
                          >
                            {file.uploadedFileName}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 w-full">
                            {file.uploadedAt ? (() => {
                              const d = new Date(file.uploadedAt);
                              const day = String(d.getDate()).padStart(2, '0');
                              const month = String(d.getMonth() + 1).padStart(2, '0');
                              const year = d.getFullYear();
                              return `${day}/${month}/${year}`;
                            })() : ""}
                          </div>
                          {/* Ticket icon bottom right */}
                          <div className="absolute right-2 bottom-2">
                            {typeof file.resolvedTransactionsCount === 'number' && typeof file.totalTransactionsCount === 'number' ? (
                              file.resolvedTransactionsCount !== file.totalTransactionsCount ? (
                                <TicketMinus size={16} className="text-red-500" />
                              ) : (
                                <TicketCheck size={16} />
                              )
                            ) : null}
                          </div>
                        </li>
                        ))}
                      </ul>
                    )}
                  </ScrollArea>
                </div>
                {/* Right: Raw transactions table placeholder */}
                <div className="flex-1 flex flex-col">
                  <div className="rounded-md border bg-background min-h-[350px] overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40 border-b border-border">
                          <TableHead className="text-xs font-medium text-foreground py-1 px-2 tracking-wide">Date</TableHead>
                          <TableHead className="text-xs font-medium text-foreground py-1 px-2 tracking-wide">Description</TableHead>
                          <TableHead className="text-xs font-medium text-foreground py-1 px-2 text-right tracking-wide">Amount</TableHead>
                          <TableHead className="text-xs font-medium text-foreground py-1 px-4 text-center tracking-wide w-32">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Use TanStack Table for rendering rows */}
                        {selectedFileKey && rawTxLoading[selectedFileKey] && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground">Loading...</TableCell>
                          </TableRow>
                        )}
                        {selectedFileKey && rawTxError[selectedFileKey] && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-red-500">{rawTxError[selectedFileKey]}</TableCell>
                          </TableRow>
                        )}
                        {selectedFileKey && !rawTxLoading[selectedFileKey] && !rawTxError[selectedFileKey] && rawTxByFile[selectedFileKey]?.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground">No transactions found.</TableCell>
                          </TableRow>
                        )}
                        {selectedFileKey && rawTxByFile[selectedFileKey]?.length > 0 && (
                          table.getRowModel().rows.map(row => (
                            <TableRow key={row.id}>
                              {row.getVisibleCells().map(cell => (
                                <TableCell
                                  key={cell.id}
                                  className={
                                    cell.column.id === 'amount'
                                      ? 'text-right'
                                      : cell.column.id === 'status'
                                        ? 'text-center'
                                        : ''
                                  }
                                >
                                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>
            ))}
          </div>
        </Tabs>
      )}
    </div>
  );
}
