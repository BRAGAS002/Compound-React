import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  CalculationParams, 
  deleteCalculation, 
  formatCurrency, 
  getCalculationHistory 
} from "@/utils/calculatorUtils";
import { useToast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import type { CalculationHistory as CalculationHistoryType } from "@/utils/calculatorUtils";

interface HistoryProps {
  onSelectHistory: (params: CalculationParams) => void;
}

export function CalculationHistory({ onSelectHistory }: HistoryProps) {
  const [history, setHistory] = useState<CalculationHistoryType[]>([]);
  const [selectedItem, setSelectedItem] = useState<CalculationHistoryType | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const calculationHistory = getCalculationHistory();
    setHistory(calculationHistory);
  };

  const handleDelete = (id: string) => {
    deleteCalculation(id);
    loadHistory();
    if (selectedItem?.id === id) {
      setSelectedItem(null);
    }
    toast({
      title: "Calculation deleted",
      description: "The calculation has been removed from history."
    });
  };

  const handleClearAll = () => {
    localStorage.setItem('calculationHistory', JSON.stringify([]));
    loadHistory();
    setSelectedItem(null);
    toast({
      title: "History cleared",
      description: "All calculations have been deleted from history."
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Calculation History</CardTitle>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={history.length === 0}>
              Clear All
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all your saved calculations.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearAll}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ScrollArea className="h-72 rounded-md">
            {history.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No calculation history yet
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((item) => (
                  <div 
                    key={item.id} 
                    className={`border rounded-lg p-4 hover:bg-accent/50 cursor-pointer ${
                      selectedItem?.id === item.id ? 'bg-accent' : ''
                    }`}
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{formatCurrency(item.principal)} invested for {item.time} years</h4>
                        <p className="text-sm text-muted-foreground">
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
                      >
                        Delete
                      </Button>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        <p className="flex gap-2 items-center">
                          <Badge variant="outline" className="text-xs">Final</Badge>
                          {formatCurrency(item.finalAmount)}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          
          {selectedItem && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-4">Calculation Details</h3>
              <div className="space-y-2">
                <p><strong>Principal:</strong> {formatCurrency(selectedItem.principal)}</p>
                <p><strong>Annual Rate:</strong> {selectedItem.rate}%</p>
                <p><strong>Time Period:</strong> {selectedItem.time} years</p>
                <p><strong>Compounding:</strong> {selectedItem.frequency}</p>
                <p><strong>Final Amount:</strong> {formatCurrency(selectedItem.finalAmount)}</p>
                <p><strong>Total Interest:</strong> {formatCurrency(selectedItem.totalInterest)}</p>
                <p><strong>Formula Used:</strong> {selectedItem.formula}</p>
                <p><strong>Calculated on:</strong> {formatDate(selectedItem.createdAt)}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
