
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalculationParams, CalculationResult, calculateCompoundInterest, formatCurrency } from "@/utils/calculatorUtils";

interface ResultsDisplayProps {
  params: CalculationParams | null;
}

export function ResultsDisplay({ params }: ResultsDisplayProps) {
  const [result, setResult] = useState<CalculationResult | null>(null);

  useEffect(() => {
    if (params) {
      const calculatedResult = calculateCompoundInterest(params);
      setResult(calculatedResult);
    }
  }, [params]);

  if (!params || !result) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Calculation Results</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="breakdown">Year by Year</TabsTrigger>
            <TabsTrigger value="formula">Formula</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="text-lg font-medium text-muted-foreground">Principal Amount</h3>
                <p className="text-2xl font-bold">{formatCurrency(params.principal)}</p>
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="text-lg font-medium text-muted-foreground">Final Amount</h3>
                <p className="text-2xl font-bold">{formatCurrency(result.finalAmount)}</p>
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="text-lg font-medium text-muted-foreground">Total Interest Earned</h3>
                <p className="text-2xl font-bold">{formatCurrency(result.totalInterest)}</p>
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="text-lg font-medium text-muted-foreground">Interest to Principal Ratio</h3>
                <p className="text-2xl font-bold">
                  {(result.totalInterest / params.principal * 100).toFixed(2)}%
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="breakdown">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Year</TableHead>
                    {params.startDate && <TableHead>Date</TableHead>}
                    <TableHead>Balance</TableHead>
                    <TableHead>Interest Earned</TableHead>
                    <TableHead>Total Interest</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.yearlyBreakdown.map((row) => {
                    const totalInterestToDate = params.principal - params.principal + row.amount - params.principal;
                    
                    return (
                      <TableRow key={row.year}>
                        <TableCell>{row.year}</TableCell>
                        {params.startDate && <TableCell>{row.date}</TableCell>}
                        <TableCell>{formatCurrency(row.amount)}</TableCell>
                        <TableCell>{formatCurrency(row.interestEarned)}</TableCell>
                        <TableCell>{formatCurrency(totalInterestToDate)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="formula" className="space-y-4">
            <div className="bg-muted p-6 rounded-lg">
              <h3 className="text-lg font-medium mb-2">Formula Used:</h3>
              <p className="text-xl font-mono">{result.formula}</p>
              
              <div className="mt-4 space-y-2">
                <p><strong>Where:</strong></p>
                <p>A = Final amount</p>
                <p>P = Principal ({formatCurrency(params.principal)})</p>
                <p>r = Annual interest rate ({params.rate}%)</p>
                <p>t = Time period ({params.time} years)</p>
                {params.frequency !== 'continuously' && (
                  <p>n = Number of times compounded per year</p>
                )}
              </div>
              
              <div className="mt-4 p-4 bg-white dark:bg-gray-700 rounded-md">
                <h4 className="font-medium mb-2">Calculation:</h4>
                {params.frequency === 'continuously' ? (
                  <p className="font-mono">
                    A = {formatCurrency(params.principal)} × e^({(params.rate / 100).toFixed(4)} × {params.time}) = {formatCurrency(result.finalAmount)}
                  </p>
                ) : (
                  <p className="font-mono">
                    A = {formatCurrency(params.principal)}(1 + {(params.rate / 100).toFixed(4)}/{getFrequencyNumber(params.frequency)})^({getFrequencyNumber(params.frequency)} × {params.time}) = {formatCurrency(result.finalAmount)}
                  </p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function getFrequencyNumber(frequency: string): number {
  switch (frequency) {
    case 'annually': return 1;
    case 'semi-annually': return 2;
    case 'quarterly': return 4;
    case 'monthly': return 12;
    case 'weekly': return 52;
    case 'daily': return 365;
    default: return 1;
  }
}
