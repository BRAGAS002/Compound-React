import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  CalculationParams, 
  deleteCalculation, 
  formatCurrency, 
  getCalculationHistory,
  clearCalculationHistory
} from "@/utils/calculatorUtils";
import { useToast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import type { CalculationHistory as CalculationHistoryType } from "@/utils/calculatorUtils";

/**
 * Props interface for the CalculationHistory component
 * @property onSelectHistory - Callback function when a history item is selected
 */
interface HistoryProps {
  onSelectHistory: (params: CalculationParams) => void;
}

/**
 * CalculationHistory Component
 * 
 * Shows past calculations with:
 * - List of saved calculations
 * - Click to reuse a calculation
 * - Delete individual items
 * - Clear all history
 */
export function CalculationHistory({ onSelectHistory }: HistoryProps) {
  // Track history and selection
  const [history, setHistory] = useState<CalculationHistoryType[]>([]);
  const [selectedItem, setSelectedItem] = useState<CalculationHistoryType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load history on start
  useEffect(() => {
    loadHistory();
  }, []);

  // Load saved calculations
  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const calculationHistory = await getCalculationHistory();
      setHistory(calculationHistory);
    } catch (error) {
      console.error('Failed to load history:', error);
      toast({
        title: "Error",
        description: "Failed to load calculation history.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Delete one calculation
  const handleDelete = async (id: string) => {
    try {
      await deleteCalculation(id);
      await loadHistory();
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
      toast({
        title: "Calculation deleted",
        description: "The calculation has been removed from history."
      });
    } catch (error) {
      console.error('Failed to delete calculation:', error);
      toast({
        title: "Error",
        description: "Failed to delete calculation.",
        variant: "destructive"
      });
    }
  };

  // Clear all calculations
  const handleClearAll = async () => {
    try {
      await clearCalculationHistory();
      await loadHistory();
      setSelectedItem(null);
      toast({
        title: "History cleared",
        description: "All calculations have been deleted from history."
      });
    } catch (error) {
      console.error('Failed to clear history:', error);
      toast({
        title: "Error",
        description: "Failed to clear calculation history.",
        variant: "destructive"
      });
    }
  };

  // Format date to local style
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Handle item selection
  const handleItemClick = (item: CalculationHistoryType) => {
    setSelectedItem(item);
    onSelectHistory({
      principal: item.principal,
      rate: item.rate,
      time: item.time,
      frequency: item.frequency,
      startDate: item.startDate ? new Date(item.startDate) : null
    });
  };

  return (
    <Card className="w-full">
      {/* Header with Clear All button */}
      <CardHeader className="flex flex-row items-center justify-between px-4 sm:px-6">
        <CardTitle className="text-xl sm:text-2xl">Calculation History</CardTitle>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={history.length === 0 || isLoading} className="text-xs sm:text-sm">
              Clear All
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg sm:text-xl">Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-sm sm:text-base">
                This will permanently delete all your saved calculations.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="text-sm sm:text-base">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearAll} className="text-sm sm:text-base">Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardHeader>

      <CardContent className="px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* History List */}
          <ScrollArea className="h-[300px] sm:h-[400px] rounded-md">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground text-sm sm:text-base">
                Loading history...
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm sm:text-base">
                No calculation history yet
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {history.map((item) => (
                  <div 
                    key={item.id} 
                    className={`border rounded-lg p-3 sm:p-4 hover:bg-accent/50 cursor-pointer ${
                      selectedItem?.id === item.id ? 'bg-accent' : ''
                    }`}
                    onClick={() => handleItemClick(item)}
                  >
                    {/* History Item Header */}
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-sm sm:text-base">{formatCurrency(item.principal)} invested for {item.time} years</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {item.rate}% compounded {item.frequency}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.id);
                        }}
                        className="text-xs sm:text-sm"
                      >
                        Delete
                      </Button>
                    </div>
                    {/* History Item Footer */}
                    <div className="flex justify-between items-center">
                      <div className="text-xs sm:text-sm">
                        <p className="flex gap-2 items-center">
                          <Badge variant="outline" className="text-[10px] sm:text-xs">Final</Badge>
                          {formatCurrency(item.finalAmount)}
                        </p>
                      </div>
                      <span className="text-[10px] sm:text-xs text-muted-foreground">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          
          {/* Selected Item Details */}
          {selectedItem && (
            <div className="border rounded-lg p-3 sm:p-4">
              <h3 className="font-semibold mb-3 sm:mb-4 text-base sm:text-lg">Calculation Details</h3>
              <div className="space-y-2 text-sm sm:text-base">
                <p><strong>Principal:</strong> {formatCurrency(selectedItem.principal)}</p>
                <p><strong>Annual Rate:</strong> {selectedItem.rate}%</p>
                <p><strong>Time Period:</strong> {selectedItem.time} years</p>
                <p><strong>Compounding:</strong> {selectedItem.frequency}</p>
                <p><strong>Future Value (FV):</strong> {formatCurrency(selectedItem.finalAmount)}</p>
                <p><strong>Total Interest:</strong> {formatCurrency(selectedItem.totalInterest)}</p>
                <p><strong>Formula Used:</strong> CI = P(1 + r/n)<sup>nt</sup> - P</p>
                <div className="mt-2">
                  <p className="font-semibold mb-1">Step-by-Step Calculation:</p>
                  {(() => {
                    const P = selectedItem.principal;
                    const r = selectedItem.rate / 100;
                    const t = selectedItem.time;
                    const n = (() => {
                      switch (selectedItem.frequency) {
                        case 'annually': return 1;
                        case 'semi-annually': return 2;
                        case 'quarterly': return 4;
                        case 'monthly': return 12;
                        case 'weekly': return 52;
                        case 'daily': return 365;
                        default: return 1;
                      }
                    })();
                    const FV = selectedItem.finalAmount;
                    const CI = FV - P;
                    return [
                      <p key="step1">Step 1: CI = {formatCurrency(P)}(1 + {r.toFixed(4)}/{n})<sup>{n}×{t}</sup> - {formatCurrency(P)}</p>,
                      <p key="step2">Step 2: CI = {formatCurrency(P)}({(1 + r/n).toFixed(4)})<sup>{n * t}</sup> - {formatCurrency(P)}</p>,
                      <p key="step3">Step 3: CI = {formatCurrency(FV)} - {formatCurrency(P)}</p>,
                      <p key="step4">Step 4: CI = {formatCurrency(CI)}</p>
                    ];
                  })()}
                </div>
                <p><strong>Calculated on:</strong> {formatDate(selectedItem.createdAt)}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
