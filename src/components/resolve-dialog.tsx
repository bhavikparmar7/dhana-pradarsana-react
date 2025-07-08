
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import * as React from "react";



export interface AccountOption {
  id: string;
  name: string;
  productName?: string;
}

export interface ResolveDialogProps {
  accountType?: string; // Add accountType for color logic
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedrawTransactionId: string;
  date: string;
  description: string;
  amount: number;
  accounts?: AccountOption[]; // Optional, only needed for transfer
  accountId?: string; // The accountId of the selected tab
  onResolved?: () => void; // Callback to refresh table after resolve
}

export function ResolveDialog({ open, onOpenChange, selectedrawTransactionId, date, description, amount, accounts = [], accountId, onResolved, accountType }: ResolveDialogProps) {
  // Find accountType if possible (from accounts or prop)
  let resolvedAccountType = '';
  if (accounts && accountId) {
    // Try to get accountType from the account object if present
    const acc = accounts.find(a => a.id === accountId);
    if (acc && typeof (acc as { accountType?: string }).accountType === 'string') {
      resolvedAccountType = (acc as { accountType?: string }).accountType!;
    }
  }
  // Use accountType from props if not found in accounts
  if (!resolvedAccountType && typeof accountType === 'string') {
    resolvedAccountType = accountType;
  }
  const [submitting, setSubmitting] = React.useState(false);
  // Format date as DD/MM/YYYY
  let formattedDate = '';
  if (date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    formattedDate = `${day}/${month}/${year}`;
  }

  // Transaction types/categories state
  const [typeCategories, setTypeCategories] = React.useState<any>(null);
  const [selectedType, setSelectedType] = React.useState<string>('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = React.useState<string>('');
  const [remarks, setRemarks] = React.useState<string>('');
  const [transferTargetAccountId, setTransferTargetAccountId] = React.useState<string>('');

  React.useEffect(() => {
    if (!open) return;
    setSelectedType('');
    setSelectedCategory('');
    setSelectedSubcategory('');
    setRemarks('');
    setTransferTargetAccountId('');
    const fetchTypes = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const res = await fetchWithAuth(`${baseUrl}/transactions/type-categories`);
        if (!res.ok) throw new Error('Failed to fetch types');
        const json = await res.json();
        setTypeCategories(json);
      } catch {
        setTypeCategories(null);
      }
    };
    fetchTypes();
  }, [open]);

  // Helper to get categories/subcategories for selected type
  const categories = React.useMemo(() => {
    if (!typeCategories || !selectedType) return [];
    const cat = typeCategories[selectedType]?.category || [];
    return cat;
  }, [typeCategories, selectedType]);
  const subcategories = React.useMemo(() => {
    if (!typeCategories || !selectedType || !selectedCategory) return [];
    const subcat = typeCategories[selectedType]?.subcategory || [];
    return subcat;
  }, [typeCategories, selectedType, selectedCategory]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{formattedDate}</DialogTitle>
        </DialogHeader>
        <div className="pt-1 pb-2 flex items-start justify-between gap-4">
          <div className="flex-1">
            <div
              className="text-sm break-all max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl overflow-hidden text-ellipsis whitespace-pre-line"
              title={description}
            >
              {description}
            </div>
          </div>
          <div className="flex items-center">
            <span
              className={
                `font-mono text-2xl font-bold text-right ` +
                (
                  resolvedAccountType?.toLowerCase() === 'creditcard'
                    ? (amount >= 0 ? 'text-red-600' : 'text-green-700')
                    : (amount >= 0 ? 'text-green-700' : 'text-red-600')
                )
              }
            >
              ₹ {amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
        {/* Transaction type/category quick-pick */}
        <div className="mb-2">
          <div className="mb-1 text-xs font-medium text-muted-foreground">Transaction Type</div>
          <div className="flex flex-wrap gap-2">
            {typeCategories ? (
              Object.keys(typeCategories).map(type => (
                <button
                  key={type}
                  type="button"
                  className={`px-3 py-1 rounded border text-xs font-medium transition-colors ${selectedType === type ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border hover:bg-accent'} `}
                  onClick={() => {
                    setSelectedType(type);
                    setSelectedCategory('');
                    setSelectedSubcategory('');
                    setTransferTargetAccountId('');
                  }}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">Loading...</span>
            )}
          </div>
        </div>
        {selectedType && categories.length > 0 && (
          <div className="mb-2">
            <div className="mb-1 text-xs font-medium text-muted-foreground">Category</div>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat: string) => (
                <button
                  key={cat}
                  type="button"
                  className={`px-3 py-1 rounded border text-xs font-medium transition-colors ${selectedCategory === cat ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border hover:bg-accent'} `}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setSelectedSubcategory('');
                    setTransferTargetAccountId('');
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}
        {selectedType && selectedCategory && subcategories.length > 0 && (
          <div className="mb-2">
            <div className="mb-1 text-xs font-medium text-muted-foreground">Subcategory</div>
            <div className="flex flex-wrap gap-2">
              {subcategories.map((subcat: string) => (
                <button
                  key={subcat}
                  type="button"
                  className={`px-3 py-1 rounded border text-xs font-medium transition-colors ${selectedSubcategory === subcat ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border hover:bg-accent'} `}
                  onClick={() => setSelectedSubcategory(subcat)}
                >
                  {subcat}
                </button>
              ))}
            </div>
          </div>
        )}
        {/* Transfer Target Account quick-pick (only if type is transfer and category is selected) */}
        {selectedType === 'transfer' && selectedCategory && accounts.length > 0 && (
          <div className="mb-2">
            <div className="mb-1 text-xs font-medium text-muted-foreground">Transfer Target Account <span className="text-xs text-muted-foreground font-normal">(optional)</span></div>
            <div className="flex flex-wrap gap-2">
              {accounts.map(acc => (
                <button
                  key={acc.id}
                  type="button"
                  className={`px-3 py-1 rounded border text-xs font-medium transition-colors ${transferTargetAccountId === acc.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border hover:bg-accent'} `}
                  onClick={() => setTransferTargetAccountId(acc.id === transferTargetAccountId ? '' : acc.id)}
                >
                  {acc.name}{acc.productName ? ` (${acc.productName})` : ''}
                </button>
              ))}
            </div>
          </div>
        )}
        {/* Optional remarks input */}
        {selectedType && selectedCategory && (subcategories.length === 0 || (subcategories.length > 0 && selectedSubcategory)) && (
          <div className="mb-2">
            <div className="mb-1 text-xs font-medium text-muted-foreground">Remarks <span className="text-xs text-muted-foreground font-normal">(optional)</span></div>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded text-sm bg-background border-border focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Add remarks (optional)"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              maxLength={200}
            />
          </div>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">Cancel</Button>
          </DialogClose>
          <Button
            type="button"
            variant="default"
            disabled={
              !selectedType ||
              !selectedCategory ||
              (subcategories.length > 0 && !selectedSubcategory) ||
              submitting
            }
            onClick={async () => {
              if (!selectedType || !selectedCategory || (subcategories.length > 0 && !selectedSubcategory) || !accountId) return;
              setSubmitting(true);
              try {
                const baseUrl = import.meta.env.VITE_API_BASE_URL;
                const payload = {
                  rawTransactionId: selectedrawTransactionId,
                  date,
                  description,
                  amount,
                  transactionType: selectedType,
                  category: selectedCategory,
                  accountId,
                };
                if (selectedSubcategory) payload.subcategory = selectedSubcategory;
                if (remarks) payload.remarks = remarks;
                if (selectedType === 'transfer' && transferTargetAccountId) payload.transferTargetAccountId = transferTargetAccountId;
                const res = await fetchWithAuth(`${baseUrl}/transactions/resolve`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(payload),
                });
                if (!res.ok) {
                  const msg = `Failed to resolve transaction (${res.status})`;
                  toast.error(msg);
                  setSubmitting(false);
                  return;
                }
                toast.success('Transaction resolved successfully');
                setSubmitting(false);
                onOpenChange(false);
                if (onResolved) onResolved();
              } catch {
                toast.error('Failed to resolve transaction');
                setSubmitting(false);
              }
            }}
          >
            {submitting ? 'Resolving...' : 'Resolve'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
